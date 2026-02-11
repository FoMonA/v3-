// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockFOMA} from "../src/MockFOMA.sol";
import {FoMACommunityRegistry} from "../src/FoMACommunityRegistry.sol";
import {FoMACommunityGovernor, IFoMABettingPool} from "../src/FoMACommunityGovernor.sol";
import {FoMABettingPool} from "../src/FoMABettingPool.sol";

contract FoMAGovernanceTest is Test {
    MockFOMA foma;
    FoMACommunityRegistry registry;
    FoMACommunityGovernor governor;
    FoMABettingPool bettingPool;

    address deployer = address(1);
    address agent1 = address(2);
    address agent2 = address(3);
    address agent3 = address(4);
    address human = address(5);
    address platform = address(6);

    function setUp() public {
        vm.startPrank(deployer);

        foma = new MockFOMA();
        registry = new FoMACommunityRegistry(deployer);
        governor = new FoMACommunityGovernor(
            IERC20(address(foma)),
            registry,
            deployer,
            86400
        );
        bettingPool = new FoMABettingPool(
            IGovernor(address(governor)),
            IERC20(address(foma)),
            deployer
        );
        governor.setBettingPool(IFoMABettingPool(address(bettingPool)));

        registry.registerAgent(agent1);
        registry.registerAgent(agent2);
        registry.registerAgent(agent3);

        vm.stopPrank();

        foma.mint(agent1, 500e18);
        foma.mint(agent2, 500e18);
        foma.mint(agent3, 500e18);

        vm.prank(agent1);
        foma.approve(address(governor), type(uint256).max);
        vm.prank(agent2);
        foma.approve(address(governor), type(uint256).max);
        vm.prank(agent3);
        foma.approve(address(governor), type(uint256).max);
    }

    // --- Helpers ---

    function _propose(address proposer) internal returns (uint256) {
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        vm.prank(proposer);
        return governor.proposeWithCategory(targets, values, calldatas, "Test proposal", 0);
    }

    function _proposeWithDescription(address proposer, string memory desc) internal returns (uint256) {
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        vm.prank(proposer);
        return governor.proposeWithCategory(targets, values, calldatas, desc, 0);
    }

    // --- Tests ---

    function test_proposeChargesRandomCost() public {
        uint256 balBefore = foma.balanceOf(agent1);
        uint256 govBalBefore = foma.balanceOf(address(governor));

        uint256 proposalId = _propose(agent1);
        uint256 cost = governor.proposalCosts(proposalId);

        assertGe(cost, 0);
        assertLe(cost, 100e18);
        assertEq(foma.balanceOf(agent1), balBefore - cost);
        assertEq(foma.balanceOf(address(governor)), govBalBefore + cost);
    }

    function test_proposeStoresProposer() public {
        uint256 proposalId = _propose(agent1);
        assertEq(governor.proposers(proposalId), agent1);
    }

    function test_proposeStoresCategory() public {
        uint256 proposalId = _propose(agent1);
        assertEq(governor.proposalCategories(proposalId), 0);
    }

    function test_proposeCreatesBettingMarket() public {
        uint256 proposalId = _propose(agent1);
        (bool exists,,,,,) = bettingPool.markets(proposalId);
        assertTrue(exists);
    }

    function test_proposeFailsUnregisteredProposer() public {
        foma.mint(human, 500e18);
        vm.prank(human);
        foma.approve(address(governor), type(uint256).max);

        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        vm.prank(human);
        vm.expectRevert(abi.encodeWithSelector(FoMACommunityGovernor.ProposerNotRegistered.selector, human));
        governor.proposeWithCategory(targets, values, calldatas, "Test proposal", 0);
    }

    function test_proposeFailsInvalidCategory() public {
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(agent1);
        vm.expectRevert(abi.encodeWithSelector(FoMACommunityGovernor.InvalidCategory.selector, 99));
        governor.proposeWithCategory(targets, values, calldatas, "bad", 99);
    }

    function test_proposeFailsWithoutCategory() public {
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = "";

        vm.prank(agent1);
        vm.expectRevert(FoMACommunityGovernor.MustUseProposalWithCategory.selector);
        governor.propose(targets, values, calldatas, "no category");
    }

    function test_castVoteChargesFee() public {
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2); // past voting delay

        uint256 balBefore = foma.balanceOf(agent2);
        vm.prank(agent2);
        governor.castVote(proposalId, 1); // FOR

        assertEq(foma.balanceOf(agent2), balBefore - 1e18);
        assertEq(governor.votingFees(proposalId), 1e18);
    }

    function test_castVoteFailsUnregistered() public {
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2);

        foma.mint(human, 100e18);
        vm.prank(human);
        foma.approve(address(governor), type(uint256).max);

        vm.prank(human);
        vm.expectRevert(abi.encodeWithSelector(FoMACommunityGovernor.VoterNotRegistered.selector, human));
        governor.castVote(proposalId, 1);
    }

    function test_castVoteFailsProposerSelfVote() public {
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2);

        vm.prank(agent1);
        vm.expectRevert(abi.encodeWithSelector(FoMACommunityGovernor.ProposerCannotVote.selector, proposalId, agent1));
        governor.castVote(proposalId, 1);
    }

    function test_castVoteFailsAbstain() public {
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2);

        vm.prank(agent2);
        vm.expectRevert(FoMACommunityGovernor.AbstainNotAllowed.selector);
        governor.castVote(proposalId, 2); // Abstain
    }

    function test_proposalSucceedsForMajority() public {
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1); // FOR
        vm.prank(agent3);
        governor.castVote(proposalId, 1); // FOR

        vm.roll(block.number + 86401); // past voting period
        IGovernor.ProposalState s = governor.state(proposalId);
        assertEq(uint8(s), uint8(IGovernor.ProposalState.Succeeded));
    }

    function test_proposalDefeatedAgainstMajority() public {
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 0); // AGAINST
        vm.prank(agent3);
        governor.castVote(proposalId, 0); // AGAINST

        vm.roll(block.number + 86401);
        IGovernor.ProposalState s = governor.state(proposalId);
        assertEq(uint8(s), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_executePaysProposerReward() public {
        uint256 proposalId = _propose(agent1);
        uint256 cost = governor.proposalCosts(proposalId);

        vm.roll(block.number + 2);
        vm.prank(agent2);
        governor.castVote(proposalId, 1);
        vm.prank(agent3);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + 86401);

        uint256 expectedReward = cost + 2e18; // cost + 2 votes * 1 FOMA
        uint256 balBefore = foma.balanceOf(agent1);

        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        governor.execute(targets, values, calldatas, keccak256("Test proposal"));
        assertEq(foma.balanceOf(agent1), balBefore + expectedReward);
    }

    function test_failedProposalPoolKeepsFunds() public {
        uint256 proposalId = _propose(agent1);
        uint256 cost = governor.proposalCosts(proposalId);

        vm.roll(block.number + 2);
        vm.prank(agent2);
        governor.castVote(proposalId, 0); // AGAINST

        vm.roll(block.number + 86401);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));

        // Funds stay in governor (cost + 1 vote fee)
        assertGe(foma.balanceOf(address(governor)), cost + 1e18);
    }

    function test_multipleConcurrentProposals() public {
        uint256 proposalId1 = _proposeWithDescription(agent1, "Proposal A");
        uint256 proposalId2 = _proposeWithDescription(agent2, "Proposal B");

        assertTrue(proposalId1 != proposalId2);

        vm.roll(block.number + 2);

        // Agent2 votes on proposal1, agent3 votes on both
        vm.prank(agent2);
        governor.castVote(proposalId1, 1); // FOR
        vm.prank(agent3);
        governor.castVote(proposalId1, 1); // FOR

        // Agent1 votes on proposal2 (agent2 is proposer of proposal2)
        vm.prank(agent1);
        governor.castVote(proposalId2, 0); // AGAINST
        vm.prank(agent3);
        governor.castVote(proposalId2, 0); // AGAINST

        vm.roll(block.number + 86401);
        assertEq(uint8(governor.state(proposalId1)), uint8(IGovernor.ProposalState.Succeeded));
        assertEq(uint8(governor.state(proposalId2)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_quorumAlwaysMet() public {
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2);

        // Single FOR vote should be enough
        vm.prank(agent2);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + 86401);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));
    }

    function test_getVotesReturnsFlatWeight() public view {
        uint256 votes = governor.getVotes(agent1, block.number - 1);
        assertEq(votes, 1e18);
    }

    function test_addCategoryViaGovernance() public {
        // addCategory can only be called through governance (proposal -> execute)
        uint256 proposalId = _propose(agent1);
        vm.roll(block.number + 2);
        vm.prank(agent2);
        governor.castVote(proposalId, 1);
        vm.roll(block.number + 86401);

        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");
        governor.execute(targets, values, calldatas, keccak256("Test proposal"));

        assertEq(governor.categoryCount(), 6);
        assertEq(governor.categories(5), "DeFi");
    }

    function test_defaultCategories() public view {
        assertEq(governor.categories(0), "Tech");
        assertEq(governor.categories(1), "Trading");
        assertEq(governor.categories(2), "Socials");
        assertEq(governor.categories(3), "Meme");
        assertEq(governor.categories(4), "NFT");
        assertEq(governor.categoryCount(), 5);
    }

    function test_proposeRevertsIfMarketCreationFails() public {
        // Propose once to create market
        _propose(agent1);

        // Try to propose with same description + calldata -> same proposalId
        // bettingPool.createMarket() will revert with MarketAlreadyExists
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        vm.prank(agent2);
        vm.expectRevert();
        governor.proposeWithCategory(targets, values, calldatas, "Test proposal", 0);
    }

    function test_registerAgentFailsZeroAddress() public {
        vm.prank(deployer);
        vm.expectRevert(FoMACommunityRegistry.ZeroAddress.selector);
        registry.registerAgent(address(0));
    }
}
