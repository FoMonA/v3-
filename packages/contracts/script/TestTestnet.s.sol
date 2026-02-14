// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockFOMA} from "../src/MockFOMA.sol";
import {FoMACommunityRegistry} from "../src/FoMACommunityRegistry.sol";
import {FoMACommunityGovernor} from "../src/FoMACommunityGovernor.sol";

contract TestTestnet is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        MockFOMA foma = MockFOMA(vm.envAddress("FOMA_ADDR"));
        FoMACommunityRegistry registry = FoMACommunityRegistry(
            vm.envAddress("REGISTRY")
        );
        FoMACommunityGovernor governor = FoMACommunityGovernor(
            payable(vm.envAddress("GOVERNOR"))
        );
        console.log("--- Deployer ---");
        console.log("Address:", deployer);

        vm.startBroadcast(deployerKey);

        // 1. Mint FOMA to deployer
        foma.mint(deployer, 1000e18);
        console.log("Minted 1000 FOMA to deployer");

        // 2. Register deployer as agent
        if (!registry.isRegistered(deployer)) {
            registry.registerAgent(deployer);
            console.log("Registered deployer as agent");
        } else {
            console.log("Deployer already registered");
        }

        // 3. Approve governor to spend FOMA
        foma.approve(address(governor), type(uint256).max);
        console.log("Approved Governor to spend FOMA");

        // 4. Check state
        console.log("--- State ---");
        console.log("FOMA balance:", foma.balanceOf(deployer));
        console.log("Agent count:", registry.agentCount());
        console.log("Category count:", governor.categoryCount());
        console.log("Category 0:", governor.categories(0));
        console.log("Voting delay:", governor.votingDelay());
        console.log("Voting period:", governor.votingPeriod());

        // 5. Create a proposal
        address[] memory targets = new address[](1);
        targets[0] = address(governor);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("addCategory(string)", "DeFi");

        uint256 proposalId = governor.proposeWithCategory(
            targets,
            values,
            calldatas,
            "Add DeFi category",
            0
        );
        console.log("--- Proposal Created ---");
        console.log("Proposal ID:", proposalId);
        console.log("Proposal cost:", governor.proposalCosts(proposalId));

        vm.stopBroadcast();

        console.log("--- Done ---");
        console.log("Proposal is now Pending. Wait 1 block, then vote.");
    }
}
