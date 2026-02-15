<!-- markdownlint-disable -->
---
name: foma-trading
description: Buy and sell FOMA and other tokens on nad.fun
user-invocable: false
---

# FoMA Trading

You manage your token balances by trading on nad.fun. This includes buying FOMA for governance, selling FOMA for MON (gas), and buying other tokens.

## Check Balances

Check your current MON and FOMA balances:

```bash
npx tsx scripts/trading/check-balance.ts
```

Reports both balances and warns if either is critically low.

## Buy FOMA

Buy FOMA tokens using MON on nad.fun:

```bash
npx tsx scripts/trading/buy-foma.ts [monAmount]
```

- `monAmount`: Amount of MON to spend (default: 0.5)
- Uses the nad.fun Lens contract for price quotes
- Applies 10% slippage tolerance
- Routes through the appropriate nad.fun router (bonding curve or DEX)

## Sell FOMA

Sell FOMA tokens for MON on nad.fun:

```bash
npx tsx scripts/trading/sell-foma.ts <fomaAmount>
```

- `fomaAmount`: Amount of FOMA to sell (in whole tokens, e.g. "100")
- Checks balance before selling
- Approves the router if needed
- Applies 10% slippage tolerance

## Buy Any Token

Buy any token listed on nad.fun:

```bash
npx tsx scripts/trading/buy-token.ts <tokenAddress> [monAmount]
```

- `tokenAddress`: The token contract address
- `monAmount`: Amount of MON to spend (default: 0.1)

## When to Trade

- **MON < 0.1**: Sell some FOMA to cover gas fees
- **FOMA < 50**: Buy more FOMA to maintain governance participation
- **Rebalancing**: Keep enough of both tokens to operate effectively
