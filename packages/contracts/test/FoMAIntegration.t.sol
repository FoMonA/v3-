// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockFOMA} from "../src/MockFOMA.sol";
import {FoMACommunityRegistry} from "../src/FoMACommunityRegistry.sol";
import {FoMACommunityGovernor, IFoMABettingPool} from "../src/FoMACommunityGovernor.sol";
import {FoMABettingPool} from "../src/FoMABettingPool.sol";

contract FoMAIntegrationTest is Test {
    MockFOMA foma;
    FoMACommunityRegistry registry;
    FoMACommunityGovernor governor;
    FoMABettingPool bettingPool;

    address deployer = address(1);
    address agent1 = address(2);
    address agent2 = address(3);
    address agent3 = address(4);
    address bettor1 = address(10);
    address bettor2 = address(11);
    address platform = address(6);

    function setUp() public {
        vm.startPrank(deployer);
        foma = new MockFOMA();
        registry = new FoMACommunityRegistry(deployer);
        governor = new FoMACommunityGovernor(IERC20(address(foma)), registry, deployer, 86400);
        bettingPool = new FoMABettingPool(IGovernor(address(governor)), IERC20(address(foma)), deployer);
        governor.setBettingPool(IFoMABettingPool(address(bettingPool)));
        registry.registerAgent(agent1);
        registry.registerAgent(agent2);
        registry.registerAgent(agent3);
        vm.stopPrank();

        foma.mint(agent1, 500e18);
        foma.mint(agent2, 500e18);
        foma.mint(agent3, 500e18);
        foma.mint(bettor1, 200e18);
        foma.mint(bettor2, 200e18);

        vm.prank(agent1);
        foma.approve(address(governor), type(uint256).max);
        vm.prank(agent2);
        foma.approve(address(governor), type(uint256).max);
        vm.prank(agent3);
        foma.approve(address(governor), type(uint256).max);
        vm.prank(bettor1);
        foma.approve(address(bettingPool), type(uint256).max);
        vm.prank(bettor2);
        foma.approve(address(bettingPool), type(uint256).max);
    }

    function test_fullLifecycleSuccess() public {
        // 1. Agent1 proposes to create a new category
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        vm.prank(agent1);
        uint256 proposalId = governor.proposeWithCategory(targets, values, calldatas, "Add DeFi category", 0);

        uint256 cost = governor.proposalCosts(proposalId);

        // 2. Advance past voting delay
        vm.roll(block.number + 2);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Active));

        // 3. Agents vote YES
        vm.prank(agent2);
        governor.castVote(proposalId, 1);
        vm.prank(agent3);
        governor.castVote(proposalId, 1);

        // 4. Humans bet during voting
        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 50e18); // YES
        vm.prank(bettor2);
        bettingPool.bet(proposalId, false, 50e18); // NO

        // 5. Advance past voting period
        vm.roll(block.number + 86401);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Succeeded));

        // 6. Execute -- proposer gets reward
        uint256 agent1BalBefore = foma.balanceOf(agent1);
        governor.execute(targets, values, calldatas, keccak256("Add DeFi category"));
        uint256 expectedReward = cost + 2e18; // cost + 2 voting fees
        assertEq(foma.balanceOf(agent1), agent1BalBefore + expectedReward);

        // 7. Resolve betting market -- 10% fee accumulated in pool
        bettingPool.resolve(proposalId);
        assertEq(bettingPool.accumulatedPlatformFees(), 10e18); // 10% of 100

        // 8. Winners claim -- YES wins, bettor1 gets 90% of pool
        uint256 bettor1Before = foma.balanceOf(bettor1);
        vm.prank(bettor1);
        bettingPool.claim(proposalId);
        assertEq(foma.balanceOf(bettor1), bettor1Before + 90e18); // 90 FOMA (sole YES bettor)

        // 9. Losers get nothing
        vm.prank(bettor2);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.NothingToClaim.selector, proposalId, bettor2));
        bettingPool.claim(proposalId);

        // 10. Verify new category was added
        assertEq(governor.categories(5), "DeFi");
        assertEq(governor.categoryCount(), 6);
    }

    function test_fullLifecycleDefeat() public {
        // 1. Agent1 proposes to create a new category
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "Bad");

        vm.prank(agent1);
        uint256 proposalId = governor.proposeWithCategory(targets, values, calldatas, "Bad proposal", 1);

        uint256 govBalAfterPropose = foma.balanceOf(address(governor));

        // 2. Agents vote NO
        vm.roll(block.number + 2);
        vm.prank(agent2);
        governor.castVote(proposalId, 0); // AGAINST
        vm.prank(agent3);
        governor.castVote(proposalId, 0); // AGAINST

        // 3. Bettors place bets
        vm.prank(bettor1);
        bettingPool.bet(proposalId, false, 40e18); // NO
        vm.prank(bettor2);
        bettingPool.bet(proposalId, true, 60e18); // YES

        // 4. Advance -- proposal defeated
        vm.roll(block.number + 86401);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));

        // 5. Pool keeps governance funds (cost + voting fees)
        assertEq(foma.balanceOf(address(governor)), govBalAfterPropose + 2e18);

        // 6. Resolve -- NO wins
        bettingPool.resolve(proposalId);
        (,, bool outcome,,,) = bettingPool.markets(proposalId);
        assertFalse(outcome);

        // 7. NO bettor claims
        uint256 bettor1Before = foma.balanceOf(bettor1);
        vm.prank(bettor1);
        bettingPool.claim(proposalId);
        // Total pool 100, fee 10, distributable 90, bettor1 is sole NO bettor
        assertEq(foma.balanceOf(bettor1), bettor1Before + 90e18);

        // 8. YES bettor gets nothing
        vm.prank(bettor2);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.NothingToClaim.selector, proposalId, bettor2));
        bettingPool.claim(proposalId);
    }

    function test_economicsBalanceCheck() public {
        // Track governor balance through multiple proposals
        uint256 govBalStart = foma.balanceOf(address(governor));

        // Proposal 1: passes
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        vm.prank(agent1);
        uint256 pid1 = governor.proposeWithCategory(targets, values, calldatas, "Proposal 1", 0);
        governor.proposalCosts(pid1);

        vm.roll(block.number + 2);
        vm.prank(agent2);
        governor.castVote(pid1, 1);

        vm.roll(block.number + 86401);
        governor.execute(targets, values, calldatas, keccak256("Proposal 1"));

        // After execute: governor paid out cost1 + 1e18 to proposer
        // Net change: 0 (received cost1 + 1e18, paid cost1 + 1e18)
        assertEq(foma.balanceOf(address(governor)), govBalStart);

        // Proposal 2: fails -- pool accumulates
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "Bad2");
        vm.prank(agent2);
        uint256 pid2 = governor.proposeWithCategory(targets, values, calldatas, "Proposal 2", 0);
        uint256 cost2 = governor.proposalCosts(pid2);

        vm.roll(block.number + 2);
        vm.prank(agent1);
        governor.castVote(pid2, 0); // AGAINST

        vm.roll(block.number + 86401);
        // Failed: governor keeps cost2 + 1e18
        assertEq(foma.balanceOf(address(governor)), govBalStart + cost2 + 1e18);
    }
}
