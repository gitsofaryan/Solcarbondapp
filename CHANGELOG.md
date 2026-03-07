# SolCarbon — Changelog

> All notable changes to the SolCarbon dApp are documented here.
> Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Dates in IST (UTC+5:30).

---

## [1.0.0] — 2026-03-07

### 🔗 Smart Contract — Anchor Program

- **Program deployed** to Solana Devnet: `CUmu7iSDj5RavATJnm2Xsrvkgo7iqAb7MeT3GVsgmg7o`
- Fixed buy/sell mechanism — amounts now use base units with `CC_DECIMALS_FACTOR = 100` (2 decimals)
- Treasury PDA (`EM1yn6t5cbyQWSeNmQziqRVhgnjPASZEF92MM8sgMaK4`, bump 255) initialized on devnet
- Mint authority transferred from treasury keypair to Treasury PDA
- IDL converted to Anchor 0.30+ format (fixed `_bn` runtime deserialization error)
- All client-side Anchor calls migrated to `accountsStrict` with SHA256 discriminators
- Added `init-treasury-pda.mjs` script for PDA initialization

### 🏗 Blockchain Store (blockchain-store.ts)

- Replaced simulated trades with real Anchor program calls (`buy_credits`, `sell_credits`, `retire_credits`)
- Amount normalization: `normalizeCCAmount()`, `toCCBaseUnits()`, `fromRawCCAmount()`
- `sendWithRetry()` helper — 3-attempt exponential backoff for transient devnet RPC errors
- `stampBlockhash()` helper — proper blockhash assignment for `@solana/web3.js` v1
- SPL mint transaction fixed: uses `tx.sign(treasury)` (treasury is sole signer)
- Sell flow split into two confirmed transactions (CC transfer + SOL payout)
- NFT mint made non-fatal — SPL purchase succeeds regardless of Metaplex Core errors
- Moved `delay()` after wallet-check to prevent blockhash expiry

### 🪙 Wallet & Provider (WalletProvider.tsx)

- Treasury address updated from keypair to PDA `EM1yn6t5cbyQWSeNmQziqRVhgnjPASZEF92MM8sgMaK4`
- Added SKR (Solana Mobile ecosystem token) balance fetching from mainnet
- `refreshBalance()` now fetches SOL from devnet AND SKR from mainnet via ATA lookup
- Context type extended with `skrBalance: number | null`
- Fixed wallet auto-detection for Phantom/Solflare/Backpack

### 🧭 Header (Header.tsx)

- CC balance pill now only shows when wallet is connected
- Added SKR balance pill (📱 icon, green `#14F195`) — visible when SKR balance > 0
- Balance pills show real on-chain data

### 📋 DisconnectModal

- Fixed clipboard copy — uses `navigator.clipboard.writeText()` for web (removed `expo-clipboard` dependency)
- Added working Solana Explorer link (opens `explorer.solana.com/address/...?cluster=devnet`)
- Added SKR balance display box (green-tinted) when balance > 0

### 📊 HistoryScreen

- Fixed price display: changed from `$` (USD) to `◎ SOL` for Price/CC and Total
- Transaction list now shows `◎ {totalSOL} SOL` instead of incorrect dollar amounts
- Detail modal Price/CC and Total rows corrected

### 💼 PortfolioScreen

- Fixed portfolio value calculation — uses actual per-project `pricePerCC` from `verifiedProjects` instead of hardcoded `totalCC * 0.1`

### 💰 SellProjectScreen

- Added `wallet.refreshBalance()` after successful sell for immediate balance update

### ℹ️ ProtocolInfoModal

- Label updated to "Treasury PDA (Mint Authority)" to reflect PDA-based architecture

### 🎨 DynamicCertificate — Complete Redesign

- **Background**: 4-stop gradient `#0f0326 → #0a1628 → #021a0e → #0a0a14` (purple → navy → green → dark)
- **3 animation layers**:
  - Shimmer sweep (3.5s bezier curve)
  - Pulsing glow orbs — purple top-right + green bottom-left (2s breathing)
  - Rotating border glow (8s full rotation with `#9945FF → #14F195` gradient)
- Coin-style logo header in `LinearGradient` circle with verified badge
- Centered hero amount display with separated "TONNES / CO₂e" units
- Project name in a pill badge with leaf icon
- Metadata grid with purple dividers
- Chain badge ("SOLANA DEVNET") in footer
- Purple-tinted QR code
- Pop-out modal with purple + green glow shadow
- Aspect ratio changed from 1.4 to 1.55, border radius 16 → 20

### 🖼 Branding & Icons

- All app icons regenerated from SolCarbon logo (`solcarbon-logo.png`):
  - `icon.png` (1024×1024), `favicon.png` (48×48), `splash-icon.png` (200×200)
  - Android adaptive: foreground (66% safe zone), background (`#0f0326`), monochrome
- Splash screen background → `#0f0326` (dark purple)
- `userInterfaceStyle` → `"dark"`
- Added iOS `bundleIdentifier`: `com.solcarbon.app`

### 🚀 Deployment

- Created `eas.json` with `dappstore` build profile (APK output, not AAB)
- EAS project linked: `909c03d8-4120-4010-8925-da3fb992d100`
- Ready for Solana dApp Store submission via publisher.solanamobile.com

---

## [0.4.0] — 2026-03-07

### 🆕 Added — Phase 1: Fractional CC + Retirement Flow

#### Credit Retirement (Portfolio Screen)
- Added **🔥 Retire** button below every NFT certificate card in the Portfolio tab
- New retirement bottom-sheet modal with:
- Added **On-Chain Sync**: The app now derives your Carbon Credit balance and portfolio directly from the blockchain (Metaplex Core assets). This ensures that when you switch wallets, only the certificates owned by that specific address are displayed.
- **Brand Refresh**: Integrated the new official SolCarbon logo across the app (Header, Dynamic Certificate, Favicon, and App Icon).

  - Purpose selection (ESG / BRSR Compliance, Personal Carbon Neutral, Supply Chain Offset, Climate Gift)
  - ⚠️ Irreversibility warning banner
  - Animated loading state during on-chain burn
- **Retired Credits** counter added to the Portfolio summary bar (replaces unused SOL display)
- On retirement success: shows tx signature and removes certificate from the grid

#### Fractional Offset Calculator (Tools Tab)
- 6 pre-built offset presets:
  - ✈️ Delhi → Mumbai (domestic flight, 0.15 CC)
  - ✈️ Delhi → London (international, 0.82 CC)
  - 🚗 Monthly Commute (petrol 15km/day, 0.31 CC)
  - 💡 Monthly Electricity (500 kWh, 0.41 CC)
  - 🏭 Small Office per year (10 employees, 25 CC)
  - 🌱 Go Carbon Neutral (Indian annual average, 1.9 CC)
- Custom decimal input supporting fractional CC (min 0.1 CC)
- Live cost display in **₹ and USD** (`₹1,050/CC` baseline)
- One-tap buy flow with demo confirmation alert

### 🆕 Added — Phase 2: MSME Wizard & BRSR Generator (Tools Tab)

#### MSME Carbon Wizard
- 5-step guided audit wizard:
  1. **Industry type** selection (Manufacturing, IT, Retail, Food, Healthcare, Logistics)
  2. **Energy inputs** — electricity kWh, diesel litres, petrol litres per month
  3. **Employees** count for Scope 3 estimation
  4. **Export markets** — flags EU CBAM compliance where applicable
  5. **Review & Calculate** summary before computation
- Results screen:
  - Scope 1 (fuel) / Scope 2 (grid) / Scope 3 (value chain) breakdown with visual progress bars
  - 3 offset packages: 🥉 Bronze (33%), 🥈 Silver (50%), 🥇 Gold (100% neutral)
  - EU CBAM amber alert when exporting to Europe
  - Prices shown in ₹ and USD

#### BRSR Report Generator
- Input form for electricity, diesel, petrol, employees
- Generates **SEBI BRSR Section C — Principle 6** formatted tables:
  - GHG emissions table (Scope 1 / 2 / 3 / Total in tCO₂e)
  - Energy parameters table (kWh consumed, renewable %, intensity per employee)
  - Methodology notes citing **CEA 2023-24** and **BEE** emission factors
- "Export BRSR PDF" demo button (production flow: Phase 3)

#### New Tools Tab
- Added **5th tab** to the bottom navigator: 🔧 **Tools** (`construct` icon)
- Tools home screen shows Phase 1 and Phase 2 cards with gradient visuals

### 🐛 Fixed — Devnet Smart Contract Trade Execution

All five root causes of failed on-chain trades were identified and fixed in `src/store/blockchain-store.ts`:

| # | Bug | Fix Applied |
|---|---|---|
| 1 | `delay()` ran before wallet-check, causing blockhash to expire | Moved delay to simulation-only path |
| 2 | `new Web3Tx({ blockhash })` constructor arg doesn't exist in `@solana/web3.js` v1 | Use `tx.recentBlockhash = …` via new `stampBlockhash()` helper |
| 3 | SPL mint tx used `partialSign(treasury)` leaving it unsigned on some paths | Switch to `tx.sign(treasury)` — treasury is sole signer for mint |
| 4 | Sell tried CC transfer + SOL payout in a single tx needing two interactive signers | Split into two separate confirmed transactions |
| 5 | No retry on transient devnet RPC errors (`blockhash not found`, rate limits) | Added `sendWithRetry()` helper with 3-attempt exponential backoff |
| 6 | Metaplex NFT mint failure crashed entire purchase | NFT mint is now non-fatal; SPL purchase succeeds regardless |

### 🆕 Added — Devnet Scripts

| Script | Purpose |
|---|---|
| `scripts/diagnose.mjs` | Checks treasury balance, mint existence, RPC reachability, auto-airdrops if low |
| `scripts/test-trades.mjs` | Full integration test: BUY → SELL → RETIRE against live devnet |

---

## [0.3.0] — Earlier session

### Added
- Full blockchain store with Zustand + AsyncStorage persistence
- `buyCredits`, `sellCredits`, `retireCredits` actions
- NFT certificate minting via Metaplex Core UMI
- `WalletProvider` with Phantom/Solflare/Backpack web3 injection + MWA for native
- `PortfolioScreen` — NFT grid, summary cards
- `DashboardScreen` — portfolio overview, quick actions, trending projects
- `TabNavigator` — 4 tabs (Dashboard, Market, Portfolio, History) with `ScreenWithHeader`
- `ProjectDetailScreen` — price chart, trade panel (Buy/Sell), stats grid
- Dark theme color palette (`src/theme/colors.ts`)

---

## How to Run

```bash
# Install dependencies
cd mobile && npm install

# Web (browser preview)
npm run web          # → http://localhost:8081

# Native (requires Expo Go app on your phone)
npm start            # Scan QR with Expo Go
```

---

## How to Test the Trade Flow (Devnet)

### Prerequisites
- Node.js 18+
- Treasury wallet already funded (run `diagnose.mjs` to verify)

### Step 1 — Run the diagnostics script
```bash
node scripts/diagnose.mjs
```
Expected output:
```
✅ Treasury funded   (~5 SOL)
✅ CC Mint exists    (decimals: 2, authority matches treasury)
✅ RPC Reachable
```

### Step 2 — Run the full integration test
```bash
node scripts/test-trades.mjs
```
This script:
1. Creates a fresh keypair as the "test user"
2. Funds it with 0.5 SOL from the treasury
3. Executes a real **BUY** (SOL payment + SPL CC token mint)
4. Verifies the CC balance on-chain
5. Executes a real **SELL** (CC transfer + SOL payout)
6. Executes a real **RETIRE** (CC token burn)
7. Prints final balances and pass/fail for each step

Expected output:
```
✅ User funded: 0.5 SOL
✅ SOL payment sent
✅ CC tokens minted
✅ User CC balance: 5 CC
✅ CC transfer (sell)
✅ SOL payout (sell)
✅ CC tokens burned (retire)
✅ All devnet trade tests PASSED!
```

### Step 3 — Test in the App UI

1. Open `http://localhost:8081` in Chrome with Phantom extension installed
2. Click **Connect Wallet** → select Phantom → approve on devnet
3. Go to **Market** tab → tap any project → tap **Buy 10 CC**
   - Phantom popup appears → approve → wait ~5-10s for 2 confirmations
   - Success screen shows tx signature + NFT asset ID
4. Go to **Portfolio** tab → see your new NFT certificate appear
   - Tap **🔥 Retire** → select purpose → **Confirm Retirement**
   - CC balance changes, certificate removed from grid
5. Go to **History** tab → see all 3 transaction types (buy / sell / retire)
6. Go to **Tools** tab → try MSME Wizard or Fractional Offset Calculator

### Key Addresses (Devnet)
```
Treasury : 4yEfgUdei5xQUrTwDA79vNTD9dPGS713qocD6XbkZcFB
CC Mint  : HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa
Cluster  : devnet (https://api.devnet.solana.com)
```

Verify any transaction on: https://explorer.solana.com/?cluster=devnet

---

## Emission Factors Used (India, 2024)

| Source | Factor |
|---|---|
| Grid electricity | 0.82 kg CO₂/kWh (CEA 2023-24) |
| Diesel | 2.68 kg CO₂/L |
| Petrol | 2.31 kg CO₂/L |
| LPG | 2.98 kg CO₂/kg |
| CNG | 2.21 kg CO₂/kg |
| Domestic flight | 0.255 kg CO₂/km per passenger |
| International flight | 0.195 kg CO₂/km per passenger |
| Scope 3 (employee services) | 2.5 tCO₂/employee/year |

Source: Bureau of Energy Efficiency (BEE), Central Electricity Authority (CEA), GHG Protocol 2024

---

## Architecture Notes

```
mobile/
├── src/
│   ├── store/
│   │   └── blockchain-store.ts   # Zustand store — all on-chain logic
│   ├── providers/
│   │   └── WalletProvider.tsx    # Wallet state, signTransaction, MWA
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── MarketplaceScreen.tsx
│   │   ├── PortfolioScreen.tsx   # + Retire flow
│   │   ├── ProjectDetailScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── ToolsScreen.tsx       # NEW: Offset calc + MSME wizard + BRSR
│   ├── navigation/
│   │   └── TabNavigator.tsx      # 5-tab bottom nav
│   ├── theme/
│   │   └── colors.ts
│   └── utils/
│       ├── ecosystem.ts          # Treasury keypair + CC Mint address
│       └── solana.ts             # UMI instance, mock NFT URIs
├── scripts/
│   ├── diagnose.mjs              # Devnet health check
│   ├── test-trades.mjs           # Full trade integration test ← START HERE
│   ├── init-ecosystem.mjs        # First-time treasury + mint setup
│   ├── check-balance.mjs
│   ├── init-metadata.mjs
│   ├── update-metadata.mjs
│   └── deploy-metadata-irys.mjs
└── contract/
    └── Anchor.toml               # Program ID placeholder (Carbon1111…)
```
