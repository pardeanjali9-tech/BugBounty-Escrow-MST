# VEIL — BugBounty Escrow (MST Coral Testnet)

> **Private Vulnerability Disclosure Protocol with Guaranteed Smart-Contract Settlement**  
> Operating exclusively on **MST Coral Testnet** via **BridgeKey Wallet**.

---

## 1. Executive Summary & Objective

**VEIL** is a privacy-first decentralized vulnerability coordination and escrow protocol. Security researchers can responsibly disclose vulnerabilities to project owners without exposing sensitive exploit details or plaintexts on public ledgers. 

Key pillars:
- **Zero Plaintext On-Chain:** Vulnerability titles, descriptions, affected components, and exploit steps are encrypted locally in the researcher's browser using authenticated **AES-256-GCM**.
- **Cryptographic Commitments:** A canonical 32-byte hash commitment (`keccak256`) is stored on-chain, proving submission timestamp, severity, and report integrity.
- **Escrow Accounting Invariant:** Escrow deposits are strictly partitioned: $\text{Available} = \text{TotalFunded} - \text{ReservedRewards} - \text{PaidRewards}$. Owners can never withdraw funds owed to researchers.
- **Pull-Payment Bounties:** Approved researchers withdraw rewards directly from the contract using reentrancy-guarded pull transactions.
- **Network & Wallet Exclusivity:** Operates **strictly on MST Coral Testnet** (Chain ID: `54635`) with **BridgeKey Wallet**. No fallbacks to Ethereum Sepolia, mainnet, MetaMask, or Coinbase Wallet.

---

## 2. MST Coral Testnet & BridgeKey Verification

Before developing blockchain code, network parameters were verified directly against the live RPC endpoint and official developer resources:

| Parameter | Verified Value |
| :--- | :--- |
| **Network Name** | `MST Coral Testnet` |
| **Chain ID** | `54635` (Hex: `0xd56b`) |
| **HTTP RPC Endpoint** | `https://coralrpc.mstblockchain.com` |
| **WebSocket RPC** | `wss://coralrpc.mstblockchain.com` |
| **Native Gas Token** | `tMSTC` (18 decimals) |
| **Current Gas Price** | `1.0 gwei` |
| **EVM Compatibility** | Osaka EVM / Geth v1.7.8+ (Shanghai/Osaka opcodes) |
| **Block Explorer** | [https://coral.mstscan.com](https://coral.mstscan.com) |
| **Official Faucet** | [https://coral-faucet.mstblockchain.com](https://coral-faucet.mstblockchain.com) |
| **Supported Wallet** | **BridgeKey** (`io.bridgekey` / `window.bridgekey` / EIP-6963) |

---

## 3. Cryptographic Privacy Architecture

```
[ Researcher Browser ]
   │
   ├─ 1. Generate random 16-byte nonce & 256-bit AES-GCM key
   ├─ 2. Canonical JSON Serialization:
   │     JSON.stringify({ programId, title, severity, affectedComponent, description, impact, poc, nonce })
   ├─ 3. Compute Commitment:
   │     commitment = keccak256(canonicalJson)
   ├─ 4. Encrypt:
   │     ciphertext = AES-GCM-256(canonicalJson, key, iv)
   ├─ 5. Wrap AES Key for Authorized Reviewer
   │
   ▼
[ Express Backend Storage ] ──── (Stores only ciphertext, IV, wrapped key; zero plaintext)
   │
   ▼
[ BugBountyEscrow Contract ] ── (Registers bytes32 commitment & storage reference on Coral)
   │
   ▼
[ Authorized Reviewer Browser ]
   │
   ├─ 1. Retrieve ciphertext & wrapped key
   ├─ 2. Unwrap AES key using reviewer key material
   ├─ 3. Decrypt ciphertext using Web Crypto API
   └─ 4. INTEGRITY CHECK:
         assert(keccak256(decryptedCanonicalJson) == onChainCommitment)
```

If any bit of the decrypted payload has been altered, the browser aborts rendering with an **Integrity Breach Detected** error.

---

## 4. Smart Contract State Machine

The `BugBountyEscrow.sol` contract enforces valid state transitions and role-based access control:

```
Submitted ───► Under Review ───► Approved ───► Claimed (Pull Payment)
                     │
                     ▼
                  Rejected ───► Appealed ───► Under Review
```

### Roles:
1. **Project Owner:** Launches programs, deposits `tMSTC` into escrow, authorizes reviewer addresses, closes programs, and withdraws unreserved funds.
2. **Security Researcher:** Submits encrypted reports with commitments, tracks review progress, files formal appeals if eligible, and claims approved bounty payouts.
3. **Authorized Reviewer:** Inspects reports, initiates review, approves bounties (locking escrow rewards), or rejects submissions with documented reasons.

---

## 5. Directory Structure

```
veil-bugbounty-escrow/
├── shared/
│   └── coralNetworkConfig.json       # Centralized verified Coral testnet parameters
├── contracts/
│   ├── contracts/
│   │   └── BugBountyEscrow.sol       # Hardened Solidity 0.8.20 escrow contract
│   ├── test/
│   │   └── BugBountyEscrow.test.ts   # 11 unit tests (invariants, ACL, state machine)
│   ├── scripts/
│   │   ├── deploy.ts                 # Coral deployment script
│   │   ├── verify-coral.ts           # Live Coral RPC connectivity verifier
│   │   └── generate-account.ts       # Testnet account generator
│   ├── hardhat.config.ts             # Hardhat config for Coral testnet
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/coralConfig.ts     # Coral RPC config
│   │   ├── services/
│   │   │   ├── coralRpcService.ts    # RPC query service
│   │   │   └── storageService.ts     # Persistent encrypted report storage
│   │   ├── routes/
│   │   │   ├── health.ts             # GET /api/health
│   │   │   ├── programs.ts           # GET /api/programs, GET /api/programs/:id
│   │   │   ├── storage.ts            # POST /api/storage/encrypted-report
│   │   │   ├── reports.ts            # GET /api/reports/:id
│   │   │   ├── transactions.ts       # GET /api/transactions/:hash
│   │   │   └── auth.ts               # GET /api/auth/challenge, POST /api/auth/verify
│   │   └── index.ts                  # Express server with Helmet, CORS, Rate Limit
│   ├── test/
│   │   └── api.test.ts               # 7 integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/               # Header, BridgeKeyModal, TransactionModal, ReportDetailModal
│   │   ├── hooks/
│   │   │   ├── useBridgeKeyWallet.ts # BridgeKey-only wallet integration
│   │   │   └── useVeilEscrow.ts      # Ethers v6 contract bridge
│   │   ├── pages/                    # Forensic Editorial views (10 screens)
│   │   ├── services/
│   │   │   ├── encryption.ts         # Web Crypto AES-256-GCM & commitment engine
│   │   │   └── api.ts                # Real backend client
│   │   ├── config/coralConfig.ts     # Frontend Coral config & ABI
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── test/
│   │   └── encryption.test.ts        # 4 cryptographic verification tests
│   ├── tailwind.config.js            # Forensic editorial palette (ivory, graphite, coral, mint)
│   ├── vite.config.ts
│   └── package.json
├── .env.example
├── package.json                      # Monorepo orchestrator
└── README.md
```

---

## 6. Installation & Verification

### Prerequisites
- Node.js v18+ (tested on Node v24.19)
- npm v9+

### Monorepo Setup
```bash
# 1. Install contract dependencies
cd contracts && npm install && cd ..

# 2. Install backend dependencies
cd backend && npm install && cd ..

# 3. Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## 7. Running Automated Test Suites

All 22 automated tests across smart contracts, backend API, and frontend cryptography are passing:

```bash
# 1. Run Hardhat Smart Contract Tests (11 passing)
npm run test:contracts

# 2. Run Backend REST API Integration Tests (7 passing)
npm run test:backend

# 3. Run Frontend Encryption & Commitment Tests (4 passing)
npm run test:frontend
```

---

## 8. Verifying MST Coral RPC & Deploying Contracts

### Verify MST Coral Testnet RPC
Run the verification script to inspect live Coral chain status:
```bash
cd contracts
npx hardhat run scripts/verify-coral.ts --network coral
```

Output:
```
====================================================
MST CORAL TESTNET CONNECTIVITY VERIFICATION
====================================================
Reported Chain ID: 54635 (Expected: 54635 / 0xd56b)
Latest Block Number: 399971
Current Gas Price:   1.0 gwei
MST Coral RPC Status: REACHABLE & VERIFIED
Block Explorer:      https://coral.mstscan.com
Faucet:              https://coral-faucet.mstblockchain.com
====================================================
```

### Acquiring Testnet Tokens (`tMSTC`)
1. Generate an account or use your BridgeKey address:
   ```bash
   cd contracts && npm run generate:account
   ```
2. Navigate to the official faucet: [https://coral-faucet.mstblockchain.com](https://coral-faucet.mstblockchain.com).
3. Paste your EVM address and complete the hCaptcha challenge to claim free `tMSTC`.

### Deploying BugBountyEscrow to Coral Testnet
Export your deployer private key (with `tMSTC` balance) in `contracts/.env`:
```env
PRIVATE_KEY=0x<your_private_key>
CORAL_RPC_URL=https://coralrpc.mstblockchain.com
```

Deploy:
```bash
npm run deploy:coral --prefix contracts
```

---

## 9. Running the Application

### Development Mode

**Start Backend API (Port 4000):**
```bash
cd backend
npm run dev
```

**Start Frontend Application (Port 5173):**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser with **BridgeKey Wallet** installed.

### Production Build
```bash
# Build backend
cd backend && npm run build && cd ..

# Build frontend
cd frontend && npm run build && cd ..
```

---

## 10. External Blockers & Security Notes

- **Coral Testnet Faucet Human Challenge:** The official MST Coral faucet (`https://coral-faucet.mstblockchain.com`) requires manual human hCaptcha completion to drip `tMSTC` tokens. Automated CLI dripping is blocked by design to prevent faucet draining.
- **BridgeKey Exclusivity:** As mandated, third-party wallets (MetaMask, Coinbase, Phantom) and foreign networks are refused. Users must connect with BridgeKey on Chain ID `54635`.

