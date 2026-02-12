// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Governor, IGovernor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorSettings} from "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FoMACommunityRegistry} from "./FoMACommunityRegistry.sol";

interface IFoMABettingPool {
    function createMarket(uint256 proposalId) external;
}

contract FoMACommunityGovernor is Governor, GovernorCountingSimple, GovernorSettings, Ownable {
    IERC20 public immutable fomaToken;
    FoMACommunityRegistry public immutable registry;
    IFoMABettingPool public bettingPool;

    mapping(uint256 => string) public categories;
    uint256 public categoryCount;

    mapping(uint256 => uint256) public proposalCosts;
    mapping(uint256 => uint256) public votingFees;
    mapping(uint256 => address) public proposers;
    mapping(uint256 => uint256) public proposalCategories;

    uint256 private _pendingCategory;

    // --- Events ---

    event ProposalCostCharged(uint256 indexed proposalId, address indexed proposer, uint256 cost, uint256 categoryId);
    event ProposerRewarded(uint256 indexed proposalId, address indexed proposer, uint256 reward);
    event CategoryAdded(uint256 indexed categoryId, string name);
    event BettingPoolSet(address indexed bettingPool);

    // --- Errors ---

    error ProposerNotRegistered(address proposer);
    error VoterNotRegistered(address voter);
    error ProposerCannotVote(uint256 proposalId, address proposer);
    error AbstainNotAllowed();
    error InvalidCategory(uint256 categoryId);
    error MustUseProposalWithCategory();
    error InsufficientFOMA(address account, uint256 required, uint256 balance);
    error InsufficientFOMAAllowance(address account, uint256 required, uint256 allowance);
    error TokenTransferFailed();

    constructor(
        IERC20 _fomaToken,
        FoMACommunityRegistry _registry,
        address initialOwner,
        uint32 votingPeriodBlocks
    )
        Governor("FoMACommunityGovernor")
        GovernorSettings(
            1,                   // votingDelay: 1 block
            votingPeriodBlocks,  // votingPeriod: caller decides
            1e18                 // proposalThreshold: 1 FOMA
        )
        Ownable(initialOwner)
    {
        fomaToken = _fomaToken;
        registry = _registry;

        categories[0] = "Tech";
        categories[1] = "Trading";
        categories[2] = "Socials";
        categories[3] = "Meme";
        categories[4] = "NFT";
        categoryCount = 5;
    }

    // --- Admin ---

    function setBettingPool(IFoMABettingPool _bettingPool) external onlyOwner {
        bettingPool = _bettingPool;
        emit BettingPoolSet(address(_bettingPool));
    }

    function addCategory(string calldata name) external onlyGovernance returns (uint256) {
        uint256 id = categoryCount++;
        categories[id] = name;
        emit CategoryAdded(id, name);
        return id;
    }

    // --- Public entry point for proposals ---

    function proposeWithCategory(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        uint256 categoryId
    ) external returns (uint256) {
        if (!registry.isRegistered(msg.sender)) revert ProposerNotRegistered(msg.sender);
        if (categoryId >= categoryCount) revert InvalidCategory(categoryId);
        _pendingCategory = categoryId + 1; // +1 so 0 means "unset"
        uint256 proposalId = propose(targets, values, calldatas, description);
        _pendingCategory = 0;
        return proposalId;
    }

    // --- Governor overrides ---

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public virtual override(Governor) returns (uint256) {
        if (_pendingCategory == 0) revert MustUseProposalWithCategory();

        address proposer = _msgSender();

        // Primary spam gate: proposer must pay a random 0-100 FOMA cost.
        // This replaces proposalThreshold as the real barrier to propose.
        uint256 cost = _calculateProposalCost();
        if (cost > 0) {
            uint256 balance = fomaToken.balanceOf(proposer);
            if (balance < cost) revert InsufficientFOMA(proposer, cost, balance);
            uint256 allowance = fomaToken.allowance(proposer, address(this));
            if (allowance < cost) revert InsufficientFOMAAllowance(proposer, cost, allowance);
            if (!fomaToken.transferFrom(proposer, address(this), cost)) {
                revert TokenTransferFailed();
            }
        }

        uint256 proposalId = super.propose(targets, values, calldatas, description);

        proposalCosts[proposalId] = cost;
        proposers[proposalId] = proposer;
        proposalCategories[proposalId] = _pendingCategory - 1;

        if (address(bettingPool) != address(0)) {
            bettingPool.createMarket(proposalId);
        }

        emit ProposalCostCharged(proposalId, proposer, cost, _pendingCategory - 1);

        return proposalId;
    }

    function _castVote(
        uint256 proposalId,
        address account,
        uint8 support,
        string memory reason,
        bytes memory params
    ) internal virtual override(Governor) returns (uint256) {
        if (!registry.isRegistered(account)) revert VoterNotRegistered(account);
        if (proposers[proposalId] == account) revert ProposerCannotVote(proposalId, account);
        if (support == uint8(GovernorCountingSimple.VoteType.Abstain)) revert AbstainNotAllowed();

        // 1 FOMA voting fee
        uint256 voterBalance = fomaToken.balanceOf(account);
        if (voterBalance < 1e18) revert InsufficientFOMA(account, 1e18, voterBalance);
        uint256 voterAllowance = fomaToken.allowance(account, address(this));
        if (voterAllowance < 1e18) revert InsufficientFOMAAllowance(account, 1e18, voterAllowance);
        if (!fomaToken.transferFrom(account, address(this), 1e18)) {
            revert TokenTransferFailed();
        }
        votingFees[proposalId] += 1e18;

        return super._castVote(proposalId, account, support, reason, params);
    }

    // --- Retained Pool Design ---
    // The Governor contract itself acts as the reward/retained pool.
    // Every proposal deposits its random cost (0-100 FOMA) and each voter pays 1 FOMA.
    // When a proposal PASSES: _executeOperations refunds cost + voting fees to the proposer.
    // When a proposal FAILS: _executeOperations is never called -- the cost + voting fees
    //   remain in the Governor, growing the retained pool over time.
    // Future use of retained funds (governance vote, redistribution, burn, etc.)
    //   is left to a future governance decision by the community.
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal virtual override(Governor) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);

        address proposer = proposers[proposalId];
        uint256 reward = proposalCosts[proposalId] + votingFees[proposalId];

        if (reward > 0 && proposer != address(0)) {
            if (!fomaToken.transfer(proposer, reward)) {
                revert TokenTransferFailed();
            }
            emit ProposerRewarded(proposalId, proposer, reward);
        }
    }

    // --- Abstract implementations (not provided by GovernorVotes since we skip it) ---

    // Equal voting: 1 registered agent = 1 vote, regardless of token balance.
    // We skip GovernorVotes/ERC20Votes because the FOMA token lives on nad.fun
    // (third-party bonding curve) which doesn't support checkpoints.
    // Access control is enforced in _castVote via registry.isRegistered().
    function _getVotes(
        address,
        uint256,
        bytes memory
    ) internal pure virtual override(Governor) returns (uint256) {
        return 1e18;
    }

    function clock() public view virtual override(Governor) returns (uint48) {
        return uint48(block.number);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure virtual override(Governor) returns (string memory) {
        return "mode=blocknumber&from=default";
    }

    // No quorum requirement. Outcome is determined solely by simple majority
    // (forVotes > againstVotes) at the end of the 86,400 block voting period.
    // _voteSucceeded() is inherited from GovernorCountingSimple (not overridden):
    //   return proposalVote.forVotes > proposalVote.againstVotes;
    // NOTE: Ties (forVotes == againstVotes) result in proposal DEFEAT.
    // This is intentional: status quo wins on a tie. In the betting market,
    // a tie means NO bettors win (proposal failed to pass).
    function quorum(uint256) public pure virtual override(Governor) returns (uint256) {
        return 0;
    }

    function _quorumReached(
        uint256
    ) internal pure virtual override(Governor, GovernorCountingSimple) returns (bool) {
        return true;
    }

    // --- Diamond inheritance resolution ---

    function votingDelay() public view virtual override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view virtual override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function proposalThreshold() public view virtual override(Governor, GovernorSettings) returns (uint256) {
        return super.proposalThreshold();
    }

    // --- Internal helpers ---

    // Pseudo-random proposal cost (0-100 FOMA). NOT secure randomness.
    // All inputs (blockhash, msg.sender, timestamp) are predictable on-chain.
    // Acceptable for hackathon; production should use VRF oracle (e.g. Chainlink/Pyth)
    // for tamper-proof randomness.
    function _calculateProposalCost() internal view returns (uint256) {
        uint256 randomish = uint256(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            msg.sender,
            block.timestamp
        )));
        return (randomish % 101) * 1e18; // 0-100 FOMA
    }
}
