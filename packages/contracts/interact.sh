#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# FoMA Testnet Interaction Helper
#
# Usage:
#   ./interact.sh balance       <ADDRESS>
#   ./interact.sh human-bet    <PROPOSAL_ID> <yes|no> [AMOUNT] [HUMAN_KEY]
#   ./interact.sh agent-vote   <PROPOSAL_ID> [for|against]  [AGENT_KEY]
#   ./interact.sh agent-propose <TITLE> <BODY> <CATEGORY_ID> [AGENT_KEY]
#   ./interact.sh agent-propose <TITLE> <BODY> new <CATEGORY_NAME> [AGENT_KEY]
#   ./interact.sh setup-agent  <AGENT_ADDR>
#   ./interact.sh fund         <TARGET_ADDR> [FOMA_AMOUNT] [MON_MILLIETHER]
#   ./interact.sh state        <PROPOSAL_ID>
#   ./interact.sh execute      <PROPOSAL_ID>
#   ./interact.sh resolve      <PROPOSAL_ID>
#   ./interact.sh categories
#   ./interact.sh new-wallet
#
# Env (.env file required -- copy .env.example):
#   PRIVATE_KEY   - deployer private key (used for fund/setup-agent)
#   FOMA_ADDR     - deployed MockFOMA address
#   REGISTRY_ADDR - deployed FoMACommunityRegistry address
#   GOVERNOR_ADDR - deployed FoMACommunityGovernor address
#   POOL_ADDR     - deployed FoMABettingPool address
#   NETWORK       - "testnet" (default) or "mainnet"
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env (required -- contains PRIVATE_KEY + contract addresses)
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
else
    echo "Error: .env file not found in $SCRIPT_DIR"
    echo "Copy .env.example and fill in your values:"
    echo "  cp .env.example .env"
    exit 1
fi

# Set RPC based on NETWORK env var (default: testnet)
case "${NETWORK:-testnet}" in
    mainnet) RPC="https://monad.drpc.org" ;;
    testnet) RPC="https://testnet-rpc.monad.xyz" ;;
    *) echo "Error: NETWORK must be 'testnet' or 'mainnet'"; exit 1 ;;
esac

# Validate required contract addresses
: "${FOMA_ADDR:?Set FOMA_ADDR in .env (run forge script Deploy.s.sol first)}"
: "${REGISTRY_ADDR:?Set REGISTRY_ADDR in .env (run forge script Deploy.s.sol first)}"
: "${GOVERNOR_ADDR:?Set GOVERNOR_ADDR in .env (run forge script Deploy.s.sol first)}"
: "${POOL_ADDR:?Set POOL_ADDR in .env (run forge script Deploy.s.sol first)}"

usage() {
    cat <<'EOF'
FoMA Testnet Interaction Helper

Commands:
  balance       <ADDR>                                Check FOMA + MON balance
  new-wallet                                          Generate a new wallet
  fund          <ADDR> [FOMA] [MON_milli]             Fund wallet (MON + FOMA)
  setup-agent   <ADDR>                                Register + fund agent
  agent-propose <TITLE> <BODY> <CAT_ID> [AGENT_KEY]   Agent creates a proposal
  agent-propose <TITLE> <BODY> new <NAME> [KEY]       Propose adding a new category
  agent-vote    <PROPOSAL_ID> [for|against] [KEY]     Agent votes
  human-bet     <PROPOSAL_ID> <yes|no> [AMT] [KEY]   Human places a bet
  state         <PROPOSAL_ID>                         Check proposal state
  execute       <PROPOSAL_ID>                         Execute passed proposal
  resolve       <PROPOSAL_ID>                         Resolve betting market
  claim         <PROPOSAL_ID> [HUMAN_KEY]             Claim betting winnings
  categories                                          List all proposal categories

Examples:
  ./interact.sh new-wallet
  ./interact.sh fund 0xABC...
  ./interact.sh setup-agent 0xABC...
  ./interact.sh agent-propose "Integrate Chainlink VRF" "Replace insecure blockhash randomness" 0
  ./interact.sh agent-propose "Add DeFi Category" "We need a DeFi category for DeFi proposals" new "DeFi"
  ./interact.sh agent-vote 0xa56f... for
  ./interact.sh human-bet 0xa56f... yes 10
  ./interact.sh state 0xa56f...
  ./interact.sh execute 0xa56f...
  ./interact.sh resolve 0xa56f...
EOF
    exit 1
}

cmd_balance() {
    local addr="${1:?Missing ADDRESS}"

    echo "=== Wallet Balance ==="
    echo "Address: $addr"

    local mon_wei
    mon_wei=$(cast balance "$addr" --rpc-url "$RPC")
    echo "MON:  $(cast --from-wei "$mon_wei") MON"

    local foma_hex
    foma_hex=$(cast call "$FOMA_ADDR" "balanceOf(address)" "$addr" --rpc-url "$RPC")
    local foma_dec
    foma_dec=$(cast --to-dec "$foma_hex")
    echo "FOMA: $(cast --from-wei "$foma_dec") FOMA"
}

cmd_new_wallet() {
    echo "=== New Wallet ==="
    cast wallet new
    echo ""
    echo "Next: ./interact.sh fund <ADDRESS>"
}

cmd_fund() {
    local target="${1:?Missing TARGET address}"
    local foma_amount="${2:-100}"
    local mon_wei="100000000000000000" # 0.1 MON

    echo "=== FundWallet ==="
    echo "Target: $target"

    echo "[1/2] Sending 0.1 MON..."
    cast send "$target" --value "$mon_wei" \
        --private-key "${PRIVATE_KEY:?PRIVATE_KEY not set}" \
        --rpc-url "$RPC" > /dev/null
    echo "       Sent"

    # local foma_wei="${foma_amount}000000000000000000"
    # echo "[2/2] Minting ${foma_amount} FOMA..."
    # cast send "$FOMA_ADDR" "mint(address,uint256)" "$target" "$foma_wei" \
    #     --private-key "${PRIVATE_KEY}" --rpc-url "$RPC" > /dev/null
    # echo "       Minted"
    # NOTE: tFOMA on nad.fun has no mint(). Transfer from deployer instead.
    local foma_wei="${foma_amount}000000000000000000"
    echo "[2/2] Transferring ${foma_amount} FOMA from deployer..."
    cast send "$FOMA_ADDR" "transfer(address,uint256)" "$target" "$foma_wei" \
        --private-key "${PRIVATE_KEY}" --rpc-url "$RPC" > /dev/null
    echo "       Transferred"
}

cmd_setup_agent() {
    local agent_addr="${1:?Missing AGENT_ADDR}"

    echo "=== SetupAgent ==="
    echo "Agent: $agent_addr"

    # Check if already registered
    local registered
    registered=$(cast call "$REGISTRY_ADDR" "isRegistered(address)(bool)" "$agent_addr" --rpc-url "$RPC")
    if [[ "$registered" == "true" ]]; then
        echo "[1/3] Agent already registered (skipped)"
    else
        echo "[1/3] Registering agent..."
        cast send "$REGISTRY_ADDR" "registerAgent(address)" "$agent_addr" \
            --private-key "${PRIVATE_KEY:?PRIVATE_KEY not set}" \
            --rpc-url "$RPC" > /dev/null
        echo "       Registered"
    fi

    # echo "[2/3] Minting 100 FOMA..."
    # cast send "$FOMA_ADDR" "mint(address,uint256)" "$agent_addr" "100000000000000000000" \
    #     --private-key "${PRIVATE_KEY}" --rpc-url "$RPC" > /dev/null
    # echo "       Minted"
    # NOTE: tFOMA on nad.fun has no mint(). Transfer from deployer instead.
    echo "[2/3] Transferring 100 FOMA from deployer..."
    cast send "$FOMA_ADDR" "transfer(address,uint256)" "$agent_addr" "100000000000000000000" \
        --private-key "${PRIVATE_KEY}" --rpc-url "$RPC" > /dev/null
    echo "       Transferred"

    echo "[3/3] Sending 0.1 MON..."
    cast send "$agent_addr" --value "100000000000000000" \
        --private-key "${PRIVATE_KEY}" --rpc-url "$RPC" > /dev/null
    echo "       Sent"
}

cmd_human_bet() {
    local proposal_id="${1:?Missing PROPOSAL_ID}"
    local side="${2:?Missing yes|no}"
    local amount="${3:-10}"
    local human_key="${4:-${HUMAN_KEY:-}}"

    if [[ -z "$human_key" ]]; then
        echo "Error: pass HUMAN_KEY as 4th arg or set HUMAN_KEY env var"
        exit 1
    fi

    local bet_yes
    case "$side" in
        yes|YES|y|Y) bet_yes=true ;;
        no|NO|n|N)   bet_yes=false ;;
        *) echo "Error: side must be yes or no"; exit 1 ;;
    esac

    local human_addr
    human_addr=$(cast wallet address "$human_key" 2>/dev/null)
    echo "=== HumanBet ==="
    echo "Human:    $human_addr"
    echo "Proposal: $proposal_id"
    echo "Side:     $side"
    echo "Amount:   ${amount} FOMA"

    local amount_wei="${amount}000000000000000000"

    # Step 1: Approve BettingPool
    echo "[1/2] Approving BettingPool..."
    cast send "$FOMA_ADDR" "approve(address,uint256)" "$POOL_ADDR" "$amount_wei" \
        --private-key "$human_key" --rpc-url "$RPC" > /dev/null
    echo "       Approved"

    # Step 2: Place bet
    echo "[2/2] Placing bet ($side)..."
    cast send "$POOL_ADDR" "bet(uint256,bool,uint256)" "$proposal_id" "$bet_yes" "$amount_wei" \
        --private-key "$human_key" --rpc-url "$RPC"
    echo "       Bet placed!"
}

cmd_agent_vote() {
    local proposal_id="${1:?Missing PROPOSAL_ID}"
    local side="${2:-for}"
    local agent_key="${3:-${AGENT_KEY:-}}"

    if [[ -z "$agent_key" ]]; then
        echo "Error: pass AGENT_KEY as 3rd arg or set AGENT_KEY env var"
        exit 1
    fi

    local support
    case "$side" in
        for|FOR|f|F|yes|y)       support=1 ;;
        against|AGAINST|a|no|n)  support=0 ;;
        *) echo "Error: side must be for or against"; exit 1 ;;
    esac

    local agent_addr
    agent_addr=$(cast wallet address "$agent_key" 2>/dev/null)
    echo "=== AgentVote ==="
    echo "Agent:    $agent_addr"
    echo "Proposal: $proposal_id"
    echo "Vote:     $side"

    # Approve governor to spend FOMA
    echo "[1/2] Approving Governor..."
    cast send "$FOMA_ADDR" "approve(address,uint256)" "$GOVERNOR_ADDR" \
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" \
        --private-key "$agent_key" --rpc-url "$RPC" > /dev/null
    echo "       Approved"

    # Cast vote
    echo "[2/2] Casting vote..."
    cast send "$GOVERNOR_ADDR" "castVote(uint256,uint8)" "$proposal_id" "$support" \
        --private-key "$agent_key" --rpc-url "$RPC"
    echo "       Vote cast!"
}

cmd_agent_propose() {
    local title="${1:?Missing TITLE}"
    local body="${2:?Missing BODY}"
    local category_or_new="${3:?Missing CATEGORY_ID (0-4) or 'new'}"

    # Description format: "Title\nBody" (indexer splits first line as title)
    local description
    description=$(printf '%s\n%s' "$title" "$body")

    # Two modes:
    #   agent-propose "title" "body" <CATEGORY_ID> [AGENT_KEY]            -- regular proposal
    #   agent-propose "title" "body" new <CATEGORY_NAME> [AGENT_KEY]      -- new category proposal
    local is_new_category=false
    local category_id
    local new_category_name=""
    local agent_key

    if [[ "$category_or_new" == "new" ]]; then
        is_new_category=true
        new_category_name="${4:?Missing CATEGORY_NAME}"
        agent_key="${5:-${AGENT_KEY:-}}"
        category_id=0  # tag new-category proposals under Tech
    else
        category_id="$category_or_new"
        agent_key="${4:-${AGENT_KEY:-}}"
    fi

    if [[ -z "$agent_key" ]]; then
        echo "Error: pass AGENT_KEY as last arg or set AGENT_KEY env var"
        exit 1
    fi

    local agent_addr
    agent_addr=$(cast wallet address "$agent_key" 2>/dev/null)

    if [[ "$is_new_category" == "true" ]]; then
        echo "=== AgentPropose (New Category) ==="
        echo "Agent:        $agent_addr"
        echo "Title:        $title"
        echo "Body:         $body"
        echo "New Category: $new_category_name"
    else
        echo "=== AgentPropose ==="
        echo "Agent:    $agent_addr"
        echo "Title:    $title"
        echo "Body:     $body"
        echo "Category: $category_id"
    fi

    # Step 1: Approve Governor to spend FOMA (up to 100 FOMA proposal cost)
    echo "[1/2] Approving Governor..."
    cast send "$FOMA_ADDR" "approve(address,uint256)" "$GOVERNOR_ADDR" \
        "115792089237316195423570985008687907853269984665640564039457584007913129639935" \
        --private-key "$agent_key" --rpc-url "$RPC" > /dev/null
    echo "       Approved"

    local tx_output
    if [[ "$is_new_category" == "true" ]]; then
        # New category: calldata calls addCategory() on Governor if passed
        local calldata
        calldata=$(cast calldata "addCategory(string)" "$new_category_name")

        echo "[2/2] Creating new-category proposal..."
        tx_output=$(cast send "$GOVERNOR_ADDR" \
            "proposeWithCategory(address[],uint256[],bytes[],string,uint256)" \
            "[${GOVERNOR_ADDR}]" "[0]" "[${calldata}]" \
            "$description" "$category_id" \
            --private-key "$agent_key" --rpc-url "$RPC" --json)
    else
        # Regular proposal: no on-chain action (Governor receives 0 ETH, no-op)
        echo "[2/2] Creating proposal..."
        tx_output=$(cast send "$GOVERNOR_ADDR" \
            "proposeWithCategory(address[],uint256[],bytes[],string,uint256)" \
            "[${GOVERNOR_ADDR}]" "[0]" "[0x]" \
            "$description" "$category_id" \
            --private-key "$agent_key" --rpc-url "$RPC" --json)
    fi

    # Extract proposal ID from ProposalCreated event (topic 0x7d84a6...)
    local proposal_id
    proposal_id=$(echo "$tx_output" | jq -r '.logs[] | select(.topics[0] == "0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0") | .data[0:66]')

    echo ""
    echo "Proposal created!"
    echo "Proposal ID: $proposal_id"
    echo ""
    echo "Next steps:"
    echo "  ./interact.sh state $proposal_id"
    echo "  ./interact.sh agent-vote $proposal_id for <AGENT_KEY>"
}

cmd_execute() {
    local proposal_id="${1:?Missing PROPOSAL_ID}"

    echo "=== Execute Proposal ==="
    echo "Proposal: $proposal_id"

    # Check state first
    local state
    state=$(cast call "$GOVERNOR_ADDR" "state(uint256)(uint8)" "$proposal_id" --rpc-url "$RPC")
    local states=("Pending" "Active" "Canceled" "Defeated" "Succeeded" "Queued" "Expired" "Executed")
    echo "State: ${states[$state]}"

    if [[ "$state" != "4" ]]; then
        echo "Error: proposal must be in Succeeded state (4) to execute"
        exit 1
    fi

    # Fetch ProposalCreated event to recover original params
    echo "[1/2] Fetching proposal params from on-chain event..."
    local event_topic="0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0"

    # Get proposal snapshot (voteStart block), creation is 1-2 blocks before
    local snapshot
    snapshot=$(cast call "$GOVERNOR_ADDR" "proposalSnapshot(uint256)(uint256)" "$proposal_id" --rpc-url "$RPC" | awk '{print $1}')
    local search_from=$((snapshot - 5))
    local search_to=$((snapshot + 1))

    # proposalId is NOT indexed -- fetch all ProposalCreated events in range, match by data
    local logs
    logs=$(cast logs --from-block "$search_from" --to-block "$search_to" \
        --address "$GOVERNOR_ADDR" "$event_topic" \
        --rpc-url "$RPC" --json)

    # Find the log whose data starts with proposal_id (first 32 bytes)
    local padded_id
    padded_id=$(echo "$proposal_id" | sed 's/0x//')
    local event_data
    event_data=$(echo "$logs" | jq -r --arg pid "$padded_id" \
        '.[] | select(.data | startswith("0x" + $pid)) | .data')

    if [[ -z "$event_data" ]]; then
        echo "Error: could not find ProposalCreated event for this proposal"
        exit 1
    fi

    # Decode: ProposalCreated(uint256 proposalId, address proposer, address[] targets,
    #   uint256[] values, string[] signatures, bytes[] calldatas,
    #   uint256 voteStart, uint256 voteEnd, string description)
    local decoded
    decoded=$(cast abi-decode \
        "f()(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)" \
        "$event_data")

    # Parse decoded: line 3=targets, 4=values, 6=calldatas, 9=description
    local targets values calldatas description_str description_hash
    targets=$(echo "$decoded" | sed -n '3p')
    values=$(echo "$decoded" | sed -n '4p')
    calldatas=$(echo "$decoded" | sed -n '6p')
    description_str=$(echo "$decoded" | sed -n '9p' | sed 's/^"//;s/"$//')
    description_hash=$(cast keccak "$description_str")

    echo "       Found"
    echo "[2/2] Executing..."
    cast send "$GOVERNOR_ADDR" \
        "execute(address[],uint256[],bytes[],bytes32)" \
        "$targets" "$values" "$calldatas" "$description_hash" \
        --private-key "${PRIVATE_KEY:?PRIVATE_KEY not set}" \
        --rpc-url "$RPC"
    echo "       Executed!"
}

cmd_resolve() {
    local proposal_id="${1:?Missing PROPOSAL_ID}"

    echo "=== Resolve Market ==="
    echo "Proposal: $proposal_id"

    # Check state first
    local state
    state=$(cast call "$GOVERNOR_ADDR" "state(uint256)(uint8)" "$proposal_id" --rpc-url "$RPC")
    local states=("Pending" "Active" "Canceled" "Defeated" "Succeeded" "Queued" "Expired" "Executed")
    echo "Governor state: ${states[$state]}"

    if [[ "$state" != "3" && "$state" != "4" && "$state" != "7" ]]; then
        echo "Error: proposal must be finalized (Defeated/Succeeded/Executed) to resolve"
        exit 1
    fi

    echo "Resolving..."
    cast send "$POOL_ADDR" "resolve(uint256)" "$proposal_id" \
        --private-key "${PRIVATE_KEY:?PRIVATE_KEY not set}" \
        --rpc-url "$RPC"
    echo "       Resolved!"
}

cmd_state() {
    local proposal_id="${1:?Missing PROPOSAL_ID}"

    # Use cast calls for reliability (avoids Foundry fork issues)
    echo "=== Proposal State ==="
    local state
    state=$(cast call "$GOVERNOR_ADDR" \
        "state(uint256)(uint8)" "$proposal_id" --rpc-url "$RPC")

    local states=("Pending" "Active" "Canceled" "Defeated" "Succeeded" "Queued" "Expired" "Executed")
    echo "State: ${states[$state]}"

    local votes
    votes=$(cast call "$GOVERNOR_ADDR" \
        "proposalVotes(uint256)(uint256,uint256,uint256)" "$proposal_id" --rpc-url "$RPC")

    # Parse the 3 return values (strip cast's [annotation])
    local against for_votes
    against=$(echo "$votes" | sed -n '1p' | awk '{print $1}')
    for_votes=$(echo "$votes" | sed -n '2p' | awk '{print $1}')
    echo "For:     $(echo "scale=0; $for_votes / 1000000000000000000" | bc) votes"
    echo "Against: $(echo "scale=0; $against / 1000000000000000000" | bc) votes"

    echo "--- Betting Market ---"
    local market
    market=$(cast call "$POOL_ADDR" \
        "markets(uint256)(bool,bool,bool,uint256,uint256,uint256)" "$proposal_id" --rpc-url "$RPC")

    local exists total_yes total_no resolved
    exists=$(echo "$market" | sed -n '1p' | awk '{print $1}')
    resolved=$(echo "$market" | sed -n '2p' | awk '{print $1}')
    total_yes=$(echo "$market" | sed -n '4p' | awk '{print $1}')
    total_no=$(echo "$market" | sed -n '5p' | awk '{print $1}')

    if [[ "$exists" == "true" ]]; then
        echo "YES bets: $(echo "scale=0; $total_yes / 1000000000000000000" | bc) FOMA"
        echo "NO bets:  $(echo "scale=0; $total_no / 1000000000000000000" | bc) FOMA"
        echo "Resolved: $resolved"
    else
        echo "No market"
    fi
}

cmd_claim() {
    local proposal_id="${1:?Missing PROPOSAL_ID}"
    local human_key="${2:-${HUMAN_KEY:-}}"

    if [[ -z "$human_key" ]]; then
        echo "Error: pass HUMAN_KEY as 2nd arg or set HUMAN_KEY env var"
        exit 1
    fi

    local human_addr
    human_addr=$(cast wallet address "$human_key" 2>/dev/null)
    echo "=== Claim Winnings ==="
    echo "Human:    $human_addr"
    echo "Proposal: $proposal_id"

    # Check claimable amount
    local claimable
    claimable=$(cast call "$POOL_ADDR" "getClaimable(uint256,address)(uint256)" \
        "$proposal_id" "$human_addr" --rpc-url "$RPC" | awk '{print $1}')

    if [[ "$claimable" == "0" ]]; then
        echo "Nothing to claim"
        exit 1
    fi

    echo "Claimable: $(echo "scale=0; $claimable / 1000000000000000000" | bc) FOMA"

    echo "Claiming..."
    cast send "$POOL_ADDR" "claim(uint256)" "$proposal_id" \
        --private-key "$human_key" --rpc-url "$RPC"
    echo "       Claimed!"
}

cmd_categories() {
    echo "=== Categories ==="
    local count
    count=$(cast call "$GOVERNOR_ADDR" "categoryCount()(uint256)" --rpc-url "$RPC")
    echo "Total: $count"
    echo ""
    for i in $(seq 0 $((count - 1))); do
        local name
        name=$(cast call "$GOVERNOR_ADDR" "categories(uint256)(string)" "$i" --rpc-url "$RPC")
        echo "$i: $name"
    done
}

# --- Main ---

case "${1:-}" in
    balance)        shift; cmd_balance "$@" ;;
    human-bet)      shift; cmd_human_bet "$@" ;;
    agent-vote)     shift; cmd_agent_vote "$@" ;;
    agent-propose)  shift; cmd_agent_propose "$@" ;;
    setup-agent)    shift; cmd_setup_agent "$@" ;;
    fund)           shift; cmd_fund "$@" ;;
    state)          shift; cmd_state "$@" ;;
    execute)        shift; cmd_execute "$@" ;;
    resolve)        shift; cmd_resolve "$@" ;;
    claim)          shift; cmd_claim "$@" ;;
    categories)     cmd_categories ;;
    new-wallet)     cmd_new_wallet ;;
    *)              usage ;;
esac
