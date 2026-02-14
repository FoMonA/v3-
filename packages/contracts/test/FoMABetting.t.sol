// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockFOMA} from "../src/MockFOMA.sol";
import {FoMACommunityRegistry} from "../src/FoMACommunityRegistry.sol";
import {FoMACommunityGovernor, IFoMABettingPool} from "../src/FoMACommunityGovernor.sol";
import {FoMABettingPool} from "../src/FoMABettingPool.sol";

contract FoMABettingTest is Test {
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
    address bettor3 = address(12);
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
        foma.mint(bettor1, 100e18);
        foma.mint(bettor2, 100e18);
        foma.mint(bettor3, 100e18);

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
        vm.prank(bettor3);
        foma.approve(address(bettingPool), type(uint256).max);
    }

    function _createProposal() internal returns (uint256) {
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        vm.prank(agent1);
        return governor.proposeWithCategory(targets, values, calldatas, "Test proposal", 0);
    }

    function test_createMarketOnlyGovernor() public {
        vm.prank(bettor1);
        vm.expectRevert(FoMABettingPool.OnlyGovernor.selector);
        bettingPool.createMarket(999);
    }

    function test_betDuringActiveProposal() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 10e18);

        assertEq(bettingPool.yesBets(proposalId, bettor1), 10e18);
        (,,, uint256 totalYes,,) = bettingPool.markets(proposalId);
        assertEq(totalYes, 10e18);
    }

    function test_betFailsAfterVotingEnds() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + 86401); // past voting

        vm.prank(bettor1);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.BettingWindowClosed.selector, proposalId));
        bettingPool.bet(proposalId, true, 10e18);
    }

    function test_betFailsBelowMinimum() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(bettor1);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.BetBelowMinimum.selector, 0.5e18, 1e18));
        bettingPool.bet(proposalId, true, 0.5e18);
    }

    function test_resolveYesWins() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1);

        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 10e18);
        vm.prank(bettor2);
        bettingPool.bet(proposalId, false, 10e18);

        vm.roll(block.number + 86401);

        uint256 poolBalBefore = foma.balanceOf(address(bettingPool));
        bettingPool.resolve(proposalId);

        (,bool resolved, bool outcome,,,uint256 platformFeeAmount) = bettingPool.markets(proposalId);
        assertTrue(resolved);
        assertTrue(outcome); // YES wins
        assertEq(platformFeeAmount, 2e18); // 10% of 20 FOMA
        assertEq(bettingPool.accumulatedPlatformFees(), 2e18);
        // Fee stays in pool (no transfer out)
        assertEq(foma.balanceOf(address(bettingPool)), poolBalBefore);
    }

    function test_resolveNoWins() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 0); // AGAINST

        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 10e18);
        vm.prank(bettor2);
        bettingPool.bet(proposalId, false, 10e18);

        vm.roll(block.number + 86401);
        bettingPool.resolve(proposalId);

        (,, bool outcome,,,) = bettingPool.markets(proposalId);
        assertFalse(outcome); // NO wins
    }

    function test_resolveFailsNotFinalized() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2); // still Active

        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.ProposalNotFinalized.selector, proposalId));
        bettingPool.resolve(proposalId);
    }

    function test_claimProportionalPayout() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1); // FOR -> YES wins

        // bettor1: 30 FOMA on YES, bettor2: 10 FOMA on YES, bettor3: 60 FOMA on NO
        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 30e18);
        vm.prank(bettor2);
        bettingPool.bet(proposalId, true, 10e18);
        vm.prank(bettor3);
        bettingPool.bet(proposalId, false, 60e18);

        vm.roll(block.number + 86401);
        bettingPool.resolve(proposalId);

        // Total pool = 100 FOMA, platform fee = 10 FOMA, distributable = 90 FOMA
        // bettor1 share: 30/40 * 90 = 67.5 FOMA
        // bettor2 share: 10/40 * 90 = 22.5 FOMA

        uint256 bal1Before = foma.balanceOf(bettor1);
        vm.prank(bettor1);
        bettingPool.claim(proposalId);
        assertEq(foma.balanceOf(bettor1), bal1Before + 67.5e18);

        uint256 bal2Before = foma.balanceOf(bettor2);
        vm.prank(bettor2);
        bettingPool.claim(proposalId);
        assertEq(foma.balanceOf(bettor2), bal2Before + 22.5e18);
    }

    function test_claimFailsLoser() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1); // FOR -> YES wins

        vm.prank(bettor1);
        bettingPool.bet(proposalId, false, 10e18); // NO bet, loses

        vm.roll(block.number + 86401);
        bettingPool.resolve(proposalId);

        vm.prank(bettor1);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.NothingToClaim.selector, proposalId, bettor1));
        bettingPool.claim(proposalId);
    }

    function test_claimFailsDoubleClaim() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1);

        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 10e18);

        vm.roll(block.number + 86401);
        bettingPool.resolve(proposalId);

        vm.prank(bettor1);
        bettingPool.claim(proposalId);

        vm.prank(bettor1);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.AlreadyClaimed.selector, proposalId, bettor1));
        bettingPool.claim(proposalId);
    }

    function test_platformFeeCorrect() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1);

        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 50e18);
        vm.prank(bettor2);
        bettingPool.bet(proposalId, false, 50e18);

        vm.roll(block.number + 86401);

        bettingPool.resolve(proposalId);
        assertEq(bettingPool.accumulatedPlatformFees(), 10e18); // 10% of 100
    }

    function test_resolveNoLiquidity() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + 86401);
        bettingPool.resolve(proposalId); // no bets, should not revert

        (,bool resolved,,,,uint256 fee) = bettingPool.markets(proposalId);
        assertTrue(resolved);
        assertEq(fee, 0);
    }

    function test_allBetsOnWinningSide() public {
        // All bettors bet NO, agents vote AGAINST -> NO wins
        // Majority vote decides outcome, not quorum
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 0); // AGAINST
        vm.prank(agent3);
        governor.castVote(proposalId, 0); // AGAINST

        // All bets on NO (no YES bets)
        vm.prank(bettor1);
        bettingPool.bet(proposalId, false, 30e18);
        vm.prank(bettor2);
        bettingPool.bet(proposalId, false, 20e18);

        vm.roll(block.number + 86401);
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));

        bettingPool.resolve(proposalId);

        (,, bool outcome,,,) = bettingPool.markets(proposalId);
        assertFalse(outcome); // NO wins

        // Total pool = 50, fee = 5, distributable = 45
        // bettor1: 30/50 * 45 = 27, bettor2: 20/50 * 45 = 18
        uint256 bal1Before = foma.balanceOf(bettor1);
        vm.prank(bettor1);
        bettingPool.claim(proposalId);
        assertEq(foma.balanceOf(bettor1), bal1Before + 27e18);

        uint256 bal2Before = foma.balanceOf(bettor2);
        vm.prank(bettor2);
        bettingPool.claim(proposalId);
        assertEq(foma.balanceOf(bettor2), bal2Before + 18e18);
    }

    function test_getClaimableReturnsCorrectAmount() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1); // FOR -> YES wins

        // bettor1: 30 YES, bettor2: 10 YES, bettor3: 60 NO
        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 30e18);
        vm.prank(bettor2);
        bettingPool.bet(proposalId, true, 10e18);
        vm.prank(bettor3);
        bettingPool.bet(proposalId, false, 60e18);

        // Before resolve: returns 0
        assertEq(bettingPool.getClaimable(proposalId, bettor1), 0);

        vm.roll(block.number + 86401);
        bettingPool.resolve(proposalId);

        // Total pool = 100, fee = 10, distributable = 90
        // bettor1: 30/40 * 90 = 67.5, bettor2: 10/40 * 90 = 22.5
        assertEq(bettingPool.getClaimable(proposalId, bettor1), 67.5e18);
        assertEq(bettingPool.getClaimable(proposalId, bettor2), 22.5e18);

        // Loser gets 0
        assertEq(bettingPool.getClaimable(proposalId, bettor3), 0);

        // After claim: returns 0
        vm.prank(bettor1);
        bettingPool.claim(proposalId);
        assertEq(bettingPool.getClaimable(proposalId, bettor1), 0);
    }

    function test_withdrawPlatformFees() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        vm.prank(agent2);
        governor.castVote(proposalId, 1);

        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 50e18);
        vm.prank(bettor2);
        bettingPool.bet(proposalId, false, 50e18);

        vm.roll(block.number + 86401);
        bettingPool.resolve(proposalId);

        assertEq(bettingPool.accumulatedPlatformFees(), 10e18);

        uint256 ownerBalBefore = foma.balanceOf(deployer);
        vm.prank(deployer);
        bettingPool.withdrawPlatformFees();

        assertEq(bettingPool.accumulatedPlatformFees(), 0);
        assertEq(foma.balanceOf(deployer), ownerBalBefore + 10e18);
    }

    function test_withdrawPlatformFeesOnlyOwner() public {
        vm.prank(bettor1);
        vm.expectRevert();
        bettingPool.withdrawPlatformFees();
    }

    function test_tiedVotesResultsInDefeated_NoBettorsWin() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        // 1 FOR, 1 AGAINST = tied
        vm.prank(agent2);
        governor.castVote(proposalId, 1); // FOR
        vm.prank(agent3);
        governor.castVote(proposalId, 0); // AGAINST

        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 30e18);  // YES
        vm.prank(bettor2);
        bettingPool.bet(proposalId, false, 20e18); // NO

        vm.roll(block.number + 86401);

        // Tied votes -> Defeated (Governor uses strict >)
        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));

        bettingPool.resolve(proposalId);

        // NO wins on a tie
        (,, bool outcome,,,) = bettingPool.markets(proposalId);
        assertFalse(outcome);

        // NO bettor (bettor2) can claim, YES bettor (bettor1) cannot
        // Total pool = 50, fee = 5, distributable = 45
        // bettor2 is only NO bettor: 20/20 * 45 = 45
        uint256 bal2Before = foma.balanceOf(bettor2);
        vm.prank(bettor2);
        bettingPool.claim(proposalId);
        assertEq(foma.balanceOf(bettor2), bal2Before + 45e18);

        vm.prank(bettor1);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.NothingToClaim.selector, proposalId, bettor1));
        bettingPool.claim(proposalId);
    }

    function test_tiedVotesNoVotes_Defeated() public {
        // Zero votes on both sides -> forVotes (0) > againstVotes (0) is false -> Defeated
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        // No votes cast at all
        vm.roll(block.number + 86401);

        assertEq(uint8(governor.state(proposalId)), uint8(IGovernor.ProposalState.Defeated));
    }

    function test_betFailsDoubleBet() public {
        uint256 proposalId = _createProposal();
        vm.roll(block.number + 2);

        // First bet succeeds
        vm.prank(bettor1);
        bettingPool.bet(proposalId, true, 10e18);

        // Second bet on same side reverts
        vm.prank(bettor1);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.AlreadyBet.selector, proposalId, bettor1));
        bettingPool.bet(proposalId, true, 10e18);

        // Bet on opposite side also reverts
        vm.prank(bettor1);
        vm.expectRevert(abi.encodeWithSelector(FoMABettingPool.AlreadyBet.selector, proposalId, bettor1));
        bettingPool.bet(proposalId, false, 10e18);
    }
}
