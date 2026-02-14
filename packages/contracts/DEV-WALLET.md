<!-- markdownlint-disable -->

# Dev Wallet

**Address:** `0x03746707814360933738eC292A22B661b60B7F87` (Replace with yours)

**Faucet:** https://faucet.monad.xyz/

## Deployed Contracts (Testnet 10143)

| Contract    | Address                                      |
| ----------- | -------------------------------------------- |
| tFOMA       | `0x0B8fE534aB0f6Bf6A09E92BB1f260Cadd7587777` |
| Registry    | `0x6782Ac490615F63BaAcED668A5fA4f4D3e250d6a` |
| Governor    | `0xb3EDdc787f22E188d3E30319df62cCb6f1bF4693` |
| BettingPool | `0x8357034bF4A5B477709d90f3409C511F8Aa5Ec8C` |

**Voting Period:** 43200 blocks (~6 hours)

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

## Deployed Contracts (Mainnet 143)

| Contract    | Address                                      |
| ----------- | -------------------------------------------- |
| FOMA        | `0xA1F6152e4203F66349d0c0E53D9E50bA2A057777` |
| Registry    | `0x6d3920cd0A1996a1c34FC238c9446B7e996eAE52` |
| Governor    | `0x144e0E78D8D29E79075e3640dcC391B0Da81eadB` |
| BettingPool | `0x5C7ec54685cD57416FC4e1ba4deB12474D683a4E` |

**Voting Period:** 86400 blocks (~12 hours)

**Deploy Block:** 55363959

**Explorer:** https://monadexplorer.com

### nad.fun Mainnet Contracts

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| CURVE                | `0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE` |
| BONDING_CURVE_ROUTER | `0x6F6B8F1a20703309951a5127c45B49b1CD981A22` |
| LENS                 | `0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea` |
| CREATOR_TREASURY     | `0x42e75B4B96d7000E7Da1e0c729Cec8d2049B9731` |
| API                  | `https://api.nadapp.net`                     |

**Deploy fee:** 10 MON (from `CURVE.feeConfig()`)

### Check balance

```bash
# Testnet
cast balance 0x03746707814360933738eC292A22B661b60B7F87 --rpc-url https://testnet-rpc.monad.xyz --ether

# Mainnet
cast balance 0x03746707814360933738eC292A22B661b60B7F87 --rpc-url https://monad.drpc.org --ether
```

### Deploy all contracts

```bash
# Testnet (6 hour voting)
forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast

# Mainnet (12 hour voting)
VOTING_PERIOD=86400 forge script script/Deploy.s.sol --rpc-url monad_mainnet --broadcast
```
