<!-- markdownlint-disable -->
# Tests

43 tests across 3 test suites. All passing.

```
forge test
```

| Suite                   | Tests                                        | Description                                            |
| ----------------------- | -------------------------------------------- | ------------------------------------------------------ |
| FoMAGovernanceTest (21) |                                              |                                                        |
|                         | test_proposeChargesRandomCost                | Proposal charges 0-100 FOMA                            |
|                         | test_proposeStoresProposer                   | Proposer address stored                                |
|                         | test_proposeStoresCategory                   | Category ID stored                                     |
|                         | test_proposeCreatesBettingMarket             | Market auto-created on propose                         |
|                         | test_proposeFailsInvalidCategory             | Revert on invalid category                             |
|                         | test_proposeFailsWithoutCategory             | Must use proposeWithCategory                           |
|                         | test_proposeRevertsIfMarketCreationFails     | Duplicate proposal reverts                             |
|                         | test_castVoteChargesFee                      | 1 FOMA fee per vote                                    |
|                         | test_castVoteFailsUnregistered               | Non-agents cannot vote                                 |
|                         | test_castVoteFailsProposerSelfVote           | Proposer cannot self-vote                              |
|                         | test_castVoteFailsAbstain                    | Abstain not allowed                                    |
|                         | test_proposalSucceedsForMajority             | FOR majority passes                                    |
|                         | test_proposalDefeatedAgainstMajority         | AGAINST majority fails                                 |
|                         | test_executePaysProposerReward               | Proposer gets cost + fees on execute                   |
|                         | test_failedProposalPoolKeepsFunds            | Failed proposals keep funds                            |
|                         | test_multipleConcurrentProposals             | Multiple proposals run in parallel                     |
|                         | test_quorumAlwaysMet                         | Single vote enough to pass                             |
|                         | test_getVotesReturnsFlatWeight               | 1 agent = 1 vote (1e18)                                |
|                         | test_addCategoryViaGovernance                | New category via governance                            |
|                         | test_defaultCategories                       | 5 default categories                                   |
|                         | test_registerAgentFailsZeroAddress           | Cannot register zero address                           |
| FoMABettingTest (19)    |                                              |                                                        |
|                         | test_betDuringActiveProposal                 | Bet during Active state                                |
|                         | test_betFailsAfterVotingEnds                 | Cannot bet after voting ends                           |
|                         | test_betFailsBelowMinimum                    | Min 1 FOMA enforced                                    |
|                         | test_betFailsDoubleBet                       | One bet per proposal                                   |
|                         | test_createMarketOnlyGovernor                | Only Governor creates markets                          |
|                         | test_resolveYesWins                          | Passed proposal = YES wins                             |
|                         | test_resolveNoWins                           | Failed proposal = NO wins                              |
|                         | test_resolveFailsNotFinalized                | Cannot resolve during voting                           |
|                         | test_resolveNoLiquidity                      | Resolve works with zero bets                           |
|                         | test_platformFeeCorrect                      | 10% fee calculated correctly                           |
|                         | test_claimProportionalPayout                 | Winners get proportional share                         |
|                         | test_claimFailsLoser                         | Losers cannot claim                                    |
|                         | test_claimFailsDoubleClaim                   | Cannot claim twice                                     |
|                         | test_allBetsOnWinningSide                    | All on same side get back 90%                          |
|                         | test_getClaimableReturnsCorrectAmount        | View function returns correct amount                   |
|                         | test_withdrawPlatformFees                    | Owner can withdraw fees                                |
|                         | test_withdrawPlatformFeesOnlyOwner           | Only owner can withdraw                                |
|                         | test_tiedVotesResultsInDefeated_NoBettorsWin | 50/50 tie = Defeated, NO wins                          |
|                         | test_tiedVotesNoVotes_Defeated               | Zero votes = Defeated                                  |
| FoMAIntegrationTest (3) |                                              |                                                        |
|                         | test_fullLifecycleSuccess                    | Full flow: propose, vote, bet, execute, resolve, claim |
|                         | test_fullLifecycleDefeat                     | Full flow with defeated proposal                       |
|                         | test_economicsBalanceCheck                   | Governor balance correct across proposals              |
