// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {MockFOMA} from "../src/MockFOMA.sol";
import {FoMACommunityRegistry} from "../src/FoMACommunityRegistry.sol";
import {FoMACommunityGovernor} from "../src/FoMACommunityGovernor.sol";
import {FoMABettingPool} from "../src/FoMABettingPool.sol";

// ---------------------------------------------------------------------------
// Contract addresses read from .env:
//   FOMA_ADDR, REGISTRY_ADDR, GOVERNOR_ADDR, POOL_ADDR
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HumanBet: human wallet bets on a proposal (assumes wallet has MON for gas)
//
// Required env:
//   PRIVATE_KEY   - human's private key
//   PROPOSAL_ID   - uint256 proposal id
//   BET_YES       - true / false
//   BET_AMOUNT    - FOMA amount in whole tokens (default 10)
// ---------------------------------------------------------------------------

contract HumanBet is Script {
    function run() external {
        MockFOMA foma = MockFOMA(vm.envAddress("FOMA_ADDR"));
        FoMABettingPool pool = FoMABettingPool(vm.envAddress("POOL_ADDR"));

        uint256 humanKey = vm.envUint("PRIVATE_KEY");
        uint256 proposalId = vm.envUint("PROPOSAL_ID");
        bool betYes = vm.envBool("BET_YES");
        uint256 amount = vm.envOr("BET_AMOUNT", uint256(10)) * 1e18;

        address human = vm.addr(humanKey);

        console.log("=== HumanBet ===");
        console.log("Human:   ", human);
        console.log("Proposal:", proposalId);
        console.log("Bet YES: ", betYes);
        console.log("Amount:  ", amount / 1e18, "FOMA");

        vm.startBroadcast(humanKey);

        foma.mint(human, amount);
        console.log("Minted FOMA");

        foma.approve(address(pool), amount);
        console.log("Approved BettingPool");

        pool.bet(proposalId, betYes, amount);
        console.log("Bet placed!");

        vm.stopBroadcast();
    }
}

// ---------------------------------------------------------------------------
// AgentVote: agent votes on a proposal (assumes wallet has MON for gas)
//
// Required env:
//   PRIVATE_KEY   - agent's private key (must already be registered + have FOMA)
//   PROPOSAL_ID   - uint256 proposal id
//   VOTE_FOR      - true (FOR) / false (AGAINST)  (default: true)
// ---------------------------------------------------------------------------

contract AgentVote is Script {
    function run() external {
        MockFOMA foma = MockFOMA(vm.envAddress("FOMA_ADDR"));
        FoMACommunityGovernor governor = FoMACommunityGovernor(payable(vm.envAddress("GOVERNOR_ADDR")));

        uint256 agentKey = vm.envUint("PRIVATE_KEY");
        uint256 proposalId = vm.envUint("PROPOSAL_ID");
        bool voteFor = vm.envOr("VOTE_FOR", true);

        address agent = vm.addr(agentKey);

        console.log("=== AgentVote ===");
        console.log("Agent:   ", agent);
        console.log("Proposal:", proposalId);
        console.log("Vote FOR:", voteFor);

        vm.startBroadcast(agentKey);

        foma.approve(address(governor), type(uint256).max);
        console.log("Approved Governor");

        uint8 support = voteFor ? 1 : 0; // 1 = For, 0 = Against
        governor.castVote(proposalId, support);
        console.log("Vote cast!");

        vm.stopBroadcast();
    }
}

// ---------------------------------------------------------------------------
// SetupAgent: deployer registers + funds a new agent
//
// Required env:
//   PRIVATE_KEY   - deployer's private key (registry owner)
//   AGENT_ADDR    - agent address to register
// ---------------------------------------------------------------------------

contract SetupAgent is Script {
    function run() external {
        MockFOMA foma = MockFOMA(vm.envAddress("FOMA_ADDR"));
        FoMACommunityRegistry registry = FoMACommunityRegistry(vm.envAddress("REGISTRY_ADDR"));

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address agent = vm.envAddress("AGENT_ADDR");

        console.log("=== SetupAgent ===");
        console.log("Agent:", agent);

        vm.startBroadcast(deployerKey);

        if (!registry.isRegistered(agent)) {
            registry.registerAgent(agent);
            console.log("Registered agent");
        } else {
            console.log("Agent already registered");
        }

        foma.mint(agent, 100e18);
        console.log("Minted 100 FOMA to agent");

        (bool ok,) = payable(agent).call{value: 0.1 ether}("");
        require(ok, "MON transfer failed");
        console.log("Sent 0.1 MON for gas");

        vm.stopBroadcast();
    }
}

// ---------------------------------------------------------------------------
// FundWallet: deployer sends MON + mints FOMA to a target wallet
//
// Required env:
//   PRIVATE_KEY   - deployer's private key
//   TARGET        - address to fund
//   FOMA_AMOUNT   - FOMA in whole tokens (default 100)
//   MON_AMOUNT    - MON in milliether (default 100 = 0.1 MON)
// ---------------------------------------------------------------------------

contract FundWallet is Script {
    function run() external {
        MockFOMA foma = MockFOMA(vm.envAddress("FOMA_ADDR"));

        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address target = vm.envAddress("TARGET");
        uint256 fomaAmount = vm.envOr("FOMA_AMOUNT", uint256(100)) * 1e18;
        uint256 monMilliether = vm.envOr("MON_AMOUNT", uint256(100));

        console.log("=== FundWallet ===");
        console.log("Target:", target);
        console.log("FOMA:  ", fomaAmount / 1e18);

        vm.startBroadcast(deployerKey);

        foma.mint(target, fomaAmount);
        console.log("Minted FOMA");

        uint256 monWei = monMilliether * 1e15; // milliether to wei
        (bool ok,) = payable(target).call{value: monWei}("");
        require(ok, "MON transfer failed");
        console.log("Sent MON for gas");

        vm.stopBroadcast();
    }
}

// ---------------------------------------------------------------------------
// CheckProposal: read-only state check
//
// Required env:
//   PROPOSAL_ID   - uint256 proposal id
// ---------------------------------------------------------------------------

contract CheckProposal is Script {
    function run() external view {
        FoMACommunityGovernor governor = FoMACommunityGovernor(payable(vm.envAddress("GOVERNOR_ADDR")));
        FoMABettingPool pool = FoMABettingPool(vm.envAddress("POOL_ADDR"));

        uint256 proposalId = vm.envUint("PROPOSAL_ID");

        console.log("=== Proposal State ===");
        console.log("ID:", proposalId);

        IGovernor.ProposalState s = governor.state(proposalId);
        if (s == IGovernor.ProposalState.Pending)   console.log("State: Pending");
        if (s == IGovernor.ProposalState.Active)     console.log("State: Active");
        if (s == IGovernor.ProposalState.Canceled)   console.log("State: Canceled");
        if (s == IGovernor.ProposalState.Defeated)   console.log("State: Defeated");
        if (s == IGovernor.ProposalState.Succeeded)  console.log("State: Succeeded");
        if (s == IGovernor.ProposalState.Queued)      console.log("State: Queued");
        if (s == IGovernor.ProposalState.Expired)     console.log("State: Expired");
        if (s == IGovernor.ProposalState.Executed)    console.log("State: Executed");

        (uint256 against, uint256 forVotes,) = governor.proposalVotes(proposalId);
        console.log("For:    ", forVotes / 1e18);
        console.log("Against:", against / 1e18);

        console.log("--- Betting Market ---");
        (bool exists, bool resolved,, uint256 totalYes, uint256 totalNo,) = pool.markets(proposalId);
        if (!exists) {
            console.log("No market");
        } else {
            console.log("Total YES:", totalYes / 1e18, "FOMA");
            console.log("Total NO: ", totalNo / 1e18, "FOMA");
            console.log("Resolved: ", resolved);
        }
    }
}
