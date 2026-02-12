// Governor ABI — events + view functions
export const governorAbi = [
  // Events
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: false },
      { name: "proposer", type: "address", indexed: false },
      { name: "targets", type: "address[]", indexed: false },
      { name: "values", type: "uint256[]", indexed: false },
      { name: "signatures", type: "string[]", indexed: false },
      { name: "calldatas", type: "bytes[]", indexed: false },
      { name: "voteStart", type: "uint256", indexed: false },
      { name: "voteEnd", type: "uint256", indexed: false },
      { name: "description", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ProposalCostCharged",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "proposer", type: "address", indexed: true },
      { name: "cost", type: "uint256", indexed: false },
      { name: "categoryId", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "voter", type: "address", indexed: true },
      { name: "proposalId", type: "uint256", indexed: false },
      { name: "support", type: "uint8", indexed: false },
      { name: "weight", type: "uint256", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  // View functions
  {
    type: "function",
    name: "state",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "clock",
    inputs: [],
    outputs: [{ name: "", type: "uint48" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "proposalVotes",
    inputs: [{ name: "proposalId", type: "uint256" }],
    outputs: [
      { name: "againstVotes", type: "uint256" },
      { name: "forVotes", type: "uint256" },
      { name: "abstainVotes", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "categoryCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "categories",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;

// BettingPool ABI — events
export const bettingPoolAbi = [
  {
    type: "event",
    name: "BetPlaced",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "bettor", type: "address", indexed: true },
      { name: "yesOrNo", type: "bool", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MarketResolved",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "outcome", type: "bool", indexed: false },
      { name: "totalPool", type: "uint256", indexed: false },
      { name: "platformFee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Claimed",
    inputs: [
      { name: "proposalId", type: "uint256", indexed: true },
      { name: "bettor", type: "address", indexed: true },
      { name: "payout", type: "uint256", indexed: false },
    ],
  },
] as const;

// Registry ABI — event + functions
export const registryAbi = [
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [{ name: "agent", type: "address", indexed: true }],
  },
  {
    type: "function",
    name: "registerAgent",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;
