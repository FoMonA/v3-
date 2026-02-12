// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {FoMACommunityRegistry} from "../src/FoMACommunityRegistry.sol";
import {FoMACommunityGovernor} from "../src/FoMACommunityGovernor.sol";
import {FoMABettingPool} from "../src/FoMABettingPool.sol";

/// @notice Full flow test against live testnet using nad.fun tFOMA (no mint).
contract NadFunTestnet is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        IERC20 foma = IERC20(vm.envAddress("FOMA_ADDR"));
        FoMACommunityRegistry registry = FoMACommunityRegistry(vm.envAddress("REGISTRY_ADDR"));
        FoMACommunityGovernor governor = FoMACommunityGovernor(payable(vm.envAddress("GOVERNOR_ADDR")));
        FoMABettingPool pool = FoMABettingPool(vm.envAddress("POOL_ADDR"));

        console.log("=== NadFun Testnet Flow ===");
        console.log("Deployer:", deployer);
        console.log("tFOMA balance:", foma.balanceOf(deployer) / 1e18, "FOMA");

        vm.startBroadcast(deployerKey);

        // 1. Register deployer as agent
        if (!registry.isRegistered(deployer)) {
            registry.registerAgent(deployer);
            console.log("[1] Registered deployer as agent");
        } else {
            console.log("[1] Deployer already registered");
        }

        // 2. Approve governor + pool to spend tFOMA
        foma.approve(address(governor), type(uint256).max);
        foma.approve(address(pool), type(uint256).max);
        console.log("[2] Approved Governor + Pool");

        // 3. State check
        console.log("--- Contract State ---");
        console.log("Agent count:", registry.agentCount());
        console.log("Categories:", governor.categoryCount());
        console.log("Voting period:", governor.votingPeriod(), "blocks");

        // 4. Create proposal
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        uint256 proposalId = governor.proposeWithCategory(
            targets, values, calldatas, "Add DeFi category", 0
        );
        console.log("[3] Proposal created");
        console.log("    ID:", proposalId);
        console.log("    Cost:", governor.proposalCosts(proposalId) / 1e18, "FOMA");

        // 5. Place a bet (YES, 5 FOMA)
        pool.bet(proposalId, true, 5e18);
        console.log("[4] Bet placed: 5 FOMA on YES");

        console.log("--- Balances After ---");
        console.log("tFOMA:", foma.balanceOf(deployer) / 1e18, "FOMA");

        vm.stopBroadcast();

        console.log("=== Done ===");
        console.log("Proposal ID:", proposalId);
        console.log("Wait 1 block for Active, then vote with a second agent.");
    }
}
