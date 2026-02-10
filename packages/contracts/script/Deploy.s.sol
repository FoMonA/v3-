// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";
import {MockFOMA} from "../src/MockFOMA.sol";
import {FoMACommunityRegistry} from "../src/FoMACommunityRegistry.sol";
import {FoMACommunityGovernor, IFoMABettingPool} from "../src/FoMACommunityGovernor.sol";
import {FoMABettingPool} from "../src/FoMABettingPool.sol";

contract Deploy is Script {
    // Voting period in blocks. Override via VOTING_PERIOD env var.
    // Monad testnet: 500ms/block
    //   1800   = ~15 minutes (testing)
    //   86400  = ~12 hours (production)
    uint32 constant DEFAULT_VOTING_PERIOD = 1800;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        uint32 votingPeriod = uint32(vm.envOr("VOTING_PERIOD", uint256(DEFAULT_VOTING_PERIOD)));

        vm.startBroadcast(deployerKey);

        MockFOMA fomaToken = new MockFOMA();
        console.log("MockFOMA:", address(fomaToken));

        FoMACommunityRegistry registry = new FoMACommunityRegistry(deployer);
        console.log("Registry:", address(registry));

        FoMACommunityGovernor governor = new FoMACommunityGovernor(
            IERC20(address(fomaToken)),
            registry,
            deployer,
            votingPeriod
        );
        console.log("VotingPeriod:", votingPeriod, "blocks");
        console.log("Governor:", address(governor));

        FoMABettingPool bettingPool = new FoMABettingPool(
            IGovernor(address(governor)),
            IERC20(address(fomaToken)),
            deployer
        );
        console.log("BettingPool:", address(bettingPool));

        governor.setBettingPool(IFoMABettingPool(address(bettingPool)));
        console.log("BettingPool linked to Governor");

        console.log("--- .env values ---");
        console.log("FOMA_ADDR=", address(fomaToken));
        console.log("REGISTRY_ADDR=", address(registry));
        console.log("GOVERNOR_ADDR=", address(governor));
        console.log("POOL_ADDR=", address(bettingPool));

        vm.stopBroadcast();
    }
}
