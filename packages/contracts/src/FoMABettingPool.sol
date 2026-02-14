// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FoMABettingPool is ReentrancyGuard, Ownable {
    struct Market {
        bool exists;
        bool resolved;
        bool outcome; // true = YES won, false = NO won
        uint256 totalYes;
        uint256 totalNo;
        uint256 platformFeeAmount;
    }

    IGovernor public immutable governor;
    IERC20 public immutable fomaToken;
    uint256 public accumulatedPlatformFees;

    uint256 public constant MIN_BET = 1e18; // 1 FOMA

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => uint256)) public yesBets;
    mapping(uint256 => mapping(address => uint256)) public noBets;
    mapping(uint256 => mapping(address => bool)) public claimed;

    // --- Events ---

    event MarketCreated(uint256 indexed proposalId);
    event BetPlaced(uint256 indexed proposalId, address indexed bettor, bool yesOrNo, uint256 amount);
    event MarketResolved(uint256 indexed proposalId, bool outcome, uint256 totalPool, uint256 platformFee);
    event Claimed(uint256 indexed proposalId, address indexed bettor, uint256 payout);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);

    // --- Errors ---

    error OnlyGovernor();
    error MarketAlreadyExists(uint256 proposalId);
    error MarketDoesNotExist(uint256 proposalId);
    error MarketAlreadyResolved(uint256 proposalId);
    error MarketNotResolved(uint256 proposalId);
    error BettingWindowClosed(uint256 proposalId);
    error BetBelowMinimum(uint256 amount, uint256 minimum);
    error ProposalNotFinalized(uint256 proposalId);
    error NothingToClaim(uint256 proposalId, address user);
    error AlreadyClaimed(uint256 proposalId, address user);
    error AlreadyBet(uint256 proposalId, address user);
    error TokenTransferFailed();

    error ZeroAddress();

    constructor(
        IGovernor _governor,
        IERC20 _fomaToken,
        address _owner
    ) Ownable(_owner) {
        if (address(_governor) == address(0)) revert ZeroAddress();
        if (address(_fomaToken) == address(0)) revert ZeroAddress();
        governor = _governor;
        fomaToken = _fomaToken;
    }

    function createMarket(uint256 proposalId) external {
        if (msg.sender != address(governor)) revert OnlyGovernor();
        if (markets[proposalId].exists) revert MarketAlreadyExists(proposalId);

        markets[proposalId].exists = true;
        emit MarketCreated(proposalId);
    }

    function bet(uint256 proposalId, bool yesOrNo, uint256 amount) external nonReentrant {
        Market storage market = markets[proposalId];
        if (!market.exists) revert MarketDoesNotExist(proposalId);
        if (market.resolved) revert MarketAlreadyResolved(proposalId);
        if (amount < MIN_BET) revert BetBelowMinimum(amount, MIN_BET);

        IGovernor.ProposalState s = governor.state(proposalId);
        if (s != IGovernor.ProposalState.Active && s != IGovernor.ProposalState.Pending) {
            revert BettingWindowClosed(proposalId);
        }

        // Each human can only bet once per proposal, on one side only.
        if (yesBets[proposalId][msg.sender] > 0 || noBets[proposalId][msg.sender] > 0) {
            revert AlreadyBet(proposalId, msg.sender);
        }

        if (!fomaToken.transferFrom(msg.sender, address(this), amount)) {
            revert TokenTransferFailed();
        }

        if (yesOrNo) {
            yesBets[proposalId][msg.sender] = amount;
            market.totalYes += amount;
        } else {
            noBets[proposalId][msg.sender] = amount;
            market.totalNo += amount;
        }

        emit BetPlaced(proposalId, msg.sender, yesOrNo, amount);
    }

    function resolve(uint256 proposalId) external nonReentrant {
        Market storage market = markets[proposalId];
        if (!market.exists) revert MarketDoesNotExist(proposalId);
        if (market.resolved) revert MarketAlreadyResolved(proposalId);

        IGovernor.ProposalState s = governor.state(proposalId);
        bool yesWins;

        // Succeeded/Executed = proposal passed = YES wins.
        // Defeated/Expired = proposal failed = NO wins.
        // A 50/50 tie in votes results in Defeated (Governor uses strict >),
        // so NO bettors win on a tie.
        if (s == IGovernor.ProposalState.Succeeded || s == IGovernor.ProposalState.Executed) {
            yesWins = true;
        } else if (s == IGovernor.ProposalState.Defeated || s == IGovernor.ProposalState.Expired) {
            yesWins = false;
        } else {
            revert ProposalNotFinalized(proposalId);
        }

        uint256 totalPool = market.totalYes + market.totalNo;
        uint256 platformFee = totalPool / 10; // 10%

        market.resolved = true;
        market.outcome = yesWins;
        market.platformFeeAmount = platformFee;

        accumulatedPlatformFees += platformFee;

        emit MarketResolved(proposalId, yesWins, totalPool, platformFee);
    }

    function withdrawPlatformFees() external onlyOwner {
        uint256 amount = accumulatedPlatformFees;
        accumulatedPlatformFees = 0;
        if (!fomaToken.transfer(msg.sender, amount)) {
            revert TokenTransferFailed();
        }
        emit PlatformFeesWithdrawn(msg.sender, amount);
    }

    function claim(uint256 proposalId) external nonReentrant {
        Market storage market = markets[proposalId];
        if (!market.resolved) revert MarketNotResolved(proposalId);
        if (claimed[proposalId][msg.sender]) revert AlreadyClaimed(proposalId, msg.sender);

        uint256 userBet;
        uint256 winningSideTotal;

        if (market.outcome) {
            userBet = yesBets[proposalId][msg.sender];
            winningSideTotal = market.totalYes;
        } else {
            userBet = noBets[proposalId][msg.sender];
            winningSideTotal = market.totalNo;
        }

        if (userBet == 0) revert NothingToClaim(proposalId, msg.sender);

        uint256 totalPool = market.totalYes + market.totalNo;
        uint256 distributable = totalPool - market.platformFeeAmount;
        // Integer division may leave dust (< 1 wei per claimer, negligible).
        uint256 payout = (userBet * distributable) / winningSideTotal;

        claimed[proposalId][msg.sender] = true;
        if (!fomaToken.transfer(msg.sender, payout)) {
            revert TokenTransferFailed();
        }

        emit Claimed(proposalId, msg.sender, payout);
    }

    // View function for frontend: returns claimable FOMA for a user, or 0.
    function getClaimable(uint256 proposalId, address user) external view returns (uint256) {
        Market storage market = markets[proposalId];
        if (!market.resolved) return 0;
        if (claimed[proposalId][user]) return 0;

        uint256 userBet = market.outcome
            ? yesBets[proposalId][user]
            : noBets[proposalId][user];
        if (userBet == 0) return 0;

        uint256 totalPool = market.totalYes + market.totalNo;
        uint256 distributable = totalPool - market.platformFeeAmount;
        uint256 winningSideTotal = market.outcome ? market.totalYes : market.totalNo;
        return (userBet * distributable) / winningSideTotal;
    }
}
