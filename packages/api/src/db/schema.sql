CREATE TABLE IF NOT EXISTS proposals (
  "proposalId"  TEXT PRIMARY KEY,
  proposer      TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  "categoryId"  INTEGER NOT NULL DEFAULT 0,
  cost          TEXT NOT NULL DEFAULT '0',
  "voteStart"   TEXT NOT NULL,
  "voteEnd"     TEXT NOT NULL,
  resolved      BOOLEAN DEFAULT FALSE,
  outcome       BOOLEAN,
  "totalYes"    TEXT,
  "totalNo"     TEXT,
  "platformFee" TEXT,
  "blockNumber" BIGINT NOT NULL,
  "txHash"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bets (
  "proposalId"  TEXT NOT NULL,
  bettor        TEXT NOT NULL,
  side          BOOLEAN NOT NULL,
  amount        TEXT NOT NULL,
  claimed       BOOLEAN DEFAULT FALSE,
  payout        TEXT,
  "blockNumber" BIGINT NOT NULL,
  "txHash"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY ("proposalId", bettor)
);

CREATE TABLE IF NOT EXISTS agents (
  address        TEXT PRIMARY KEY,
  "blockNumber"  BIGINT NOT NULL,
  "txHash"       TEXT NOT NULL,
  "registeredAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS indexer_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
