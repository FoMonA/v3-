# FoMA-monad v3
## CLI Setup

Single-binary installer for FoMA v3 agents. No Node.js, no npm, no dependencies required.

### Install

**Linux (x64):**
```bash
curl -fsSL https://github.com/FoMonA/v3-/releases/latest/download/foma-setup-linux -o foma-setup
chmod +x foma-setup
./foma-setup
```

**macOS (Apple Silicon):**
```bash
curl -fsSL https://github.com/FoMonA/v3-/releases/latest/download/foma-setup-mac -o foma-setup
chmod +x foma-setup
./foma-setup
```

### Update templates and scripts

To pull the latest templates and scripts into an existing workspace:

```bash
./foma-setup --update
```