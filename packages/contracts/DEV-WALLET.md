<!-- markdownlint-disable -->

# Dev Wallet

**Address:** `0x03746707814360933738eC292A22B661b60B7F87` (Replace with yours)

**Faucet:** https://faucet.monad.xyz/

## Deployed Contracts (Testnet 10143)

| Contract    | Address                                      |
| ----------- | -------------------------------------------- |
| MockFOMA    | `0x6609CC6181a7Cd300f7965B4CD7FA3ae95c74edf` |
| Registry    | `0x05F407dA5C9473bcdD7489152A209c0ACB1Db1e7` |
| Governor    | `0xcDC97caC210DE7D9422941595756b110C830226f` |
| BettingPool | `0x085086891549979f76A462C8Db274d7da6CEb07c` |

**Voting Period:** 1800 blocks (~15 minutes)

**Explorer:** https://testnet.monadexplorer.com

## Test Wallets

| Role     | Address                                                           | Private Key                                                          |
| -------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Deployer | `0x03746707814360933738eC292A22B661b60B7F87` (Replace with yours) | (in .env)                                                            |
| Agent 2  | `0xFa4E6071C366cAd94Bd301BF596885a4c36e713f`                      | `0x97004da64ffde158dcdc67fc3da9bf15b6dad0b6b80a5c008d2936b67f097a5c` |
| Agent 3  | `0xA5a201E82495ACEBBF6F377B64F509EB49f03648`                      | `0x343f43e75731ba1febf02bea73551163f70d398c1da3e395186d624384b5ccf6` |
| Agent 4  | `0x50494EBCbC0DAB6d8a7a10Fcda844F9380b45CbA`                      | `0x53935dc92c6c00e5f3b6a5ba22337b9d1991af5bbc682c1d4c9e8b75e85f4a34` |
| Human 1  | `0x15D42Ebe42e5ea48d995Ade878F5e30119Aa1865`                      | `0xe4379111bc37fe11a4b344862c649c374d111a6afc614cbae1856f27c7f07e32` |
| Human 2  | `0x8cE1d72cc86efe4874B8Ebda9f6f2A9D7277C138`                      | `0xfd6129cb9592f1f528bca68f7bd61447d83c45a46f9ebc351f9c88bf3d42f0e3` |
| Human 3  | `0xD2D0E8ee94eF5F83675E9baCE8ed5f338e4Dc4D3`                      | `0x499948552dbcbc0f6f3892a176969ce30b4e6951f5fdfa10e4ea67c430c3ea80` |

### Check balance

```bash
cast balance 0x03746707814360933738eC292A22B661b60B7F87 --rpc-url https://testnet-rpc.monad.xyz --ether
```

### Deploy all contracts

```bash
# 15 min voting (default)
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast

# 12 hour voting (production)
VOTING_PERIOD=86400 forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast
```
