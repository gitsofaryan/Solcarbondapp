# SolCarbon 🌿◎

**On-chain carbon credit exchange built on Solana — tokenize, trade, and retire verified carbon credits as a mobile-first dApp.**

> Built for the [Monolith Hackathon](https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE)

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana&logoColor=white)](https://explorer.solana.com/address/CUmu7iSDj5RavATJnm2Xsrvkgo7iqAb7MeT3GVsgmg7o?cluster=devnet)
[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo_SDK-55-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Anchor](https://img.shields.io/badge/Anchor-0.32-blue)](https://www.anchor-lang.com)

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Impact](#impact)
- [Indian Market Opportunity](#indian-market-opportunity)
- [Global Market Opportunity](#global-market-opportunity)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [On-Chain Addresses](#on-chain-addresses-devnet)
- [Project Structure](#project-structure)
- [License](#license)

---

## Problem

The voluntary carbon credit market is broken. Despite being valued at **$2B globally** and growing rapidly, it suffers from deep structural flaws that block real climate action:

| Issue | What's Happening |
|---|---|
| **Opaque & Centralized** | Credits trade through closed-door OTC brokers. Buyers can't verify origin, retirement, or double-counting. There's no transparent ledger. |
| **Double Counting** | The same credit is sold to multiple buyers across fragmented registries (Verra, Gold Standard, CDM) with no unified source of truth. In 2023, investigations flagged over 90% of Verra's rainforest credits as phantom offsets. |
| **High Entry Barrier** | Minimum trade sizes of $10K–$50K+ lock out MSMEs, individuals, and small businesses. The average Indian MSME has zero access to offset markets. |
| **India-Specific Gap** | India is the world's **3rd-largest emitter** and hosts 1,700+ registered CDM projects, yet has no domestic carbon exchange accessible to its 63 million MSMEs. SEBI's BRSR mandate (2023) now requires top-1000 listed companies to report carbon data — but there's no easy tool to buy, retire, or report offsets. |
| **Greenwashing Risk** | Without on-chain proof-of-retirement, companies can claim offsets without actually burning credits. There's no verifiable, immutable record. |
| **No Mobile Access** | Existing platforms (Toucan, KlimaDAO) are desktop-only DeFi protocols on Polygon/Ethereum requiring high gas fees and DeFi literacy. None target mobile-first emerging markets. |

**In short:** the people who need carbon credits most — Indian MSMEs, small businesses, climate-conscious individuals — can't access them. And the ones who can access them can't trust what they're buying.

---

## Solution

SolCarbon is a **mobile-first, on-chain carbon credit exchange** built on Solana that makes it possible for anyone — from an individual offsetting a flight to an MSME filing BRSR reports — to buy, trade, and permanently retire verified carbon credits in under 5 seconds for less than $0.001.

### How It Works

```
  Browse Projects     Buy Credits      Get NFT Certificate     Retire Credits
  ┌──────────┐      ┌──────────┐      ┌──────────────────┐    ┌──────────────┐
  │ 8 verified│ ──▶  │ Pay SOL  │ ──▶  │  Mint SPL tokens │──▶ │ Burn tokens  │
  │ Indian    │      │ on-chain │      │  + NFT proof     │    │ permanently  │
  │ projects  │      │ < $0.001 │      │  with QR code    │    │ on-chain     │
  └──────────┘      └──────────┘      └──────────────────┘    └──────────────┘
```

### Key Design Decisions

| Decision | Why |
|---|---|
| **Solana over Ethereum/Polygon** | Sub-second finality, <$0.001 fees, Mobile Wallet Adapter (MWA) for native Android, and the Solana dApp Store (150K+ Seeker devices, 0% platform fees) |
| **Mobile-first (React Native)** | India has 800M+ smartphone users but low desktop penetration. Mobile is the only way to reach MSMEs and individuals at scale. |
| **SPL tokens (not wrapped ERC-20s)** | Native Solana tokens avoid bridge risk and enable instant settlement with 2-decimal precision matching real-world credit fractions. |
| **NFT certificates (Metaplex Core)** | Every purchase generates an on-chain NFT with project metadata, quantity, and QR code — verifiable proof that can't be faked or double-counted. |
| **Permanent retirement via burn** | Retiring credits calls `token::burn` on-chain. Once burned, the credit is gone forever — no double-counting, no greenwashing. |
| **Zero platform fees** | The protocol charges nothing. Users only pay Solana network fees (~$0.0005/tx). Revenue model shifts to optional premium features and B2B API access. |

### Why Solana?
- **Sub-second finality** for real-time carbon trading
- **< $0.001 transaction fees** making micro-offsets viable
- **Solana dApp Store** — 150,000+ Seeker devices, 0% platform fees
- **Mobile Wallet Adapter (MWA)** for native mobile wallet signing

---

## Impact

### Environmental Impact
- **Democratizes carbon offsetting** — anyone with a phone and a Solana wallet can offset their footprint, starting from fractions of a credit (~$0.01 worth)
- **Eliminates double-counting** — every credit is an SPL token on a public ledger; retirement = permanent on-chain burn
- **Supports 8 verified Indian climate projects** across solar, mangrove restoration, wind, biogas, hydro, tidal energy, agroforestry, and bamboo — each tied to real registries (Gold Standard, Verra VCS)

### Economic Impact
- **Opens the market to 63M+ Indian MSMEs** that currently have zero access to carbon credit markets
- **Reduces transaction costs by 99%** — from broker-mediated OTC trades ($50–$500 per deal) to on-chain settlement at <$0.001
- **Creates liquidity** — tokenized credits can be traded 24/7 on a permissionless marketplace, unlike traditional registries with T+3 settlement

### Social Impact
- **BRSR compliance tooling** — helps India's top-1000 listed companies meet SEBI's mandatory sustainability disclosure requirements with auto-generated Section C Principle 6 reports
- **MSME Carbon Wizard** — 5-step guided audit that breaks down Scope 1/2/3 emissions for small businesses with zero carbon accounting experience
- **Climate education** — the dashboard and project pages surface real data (registry IDs, methodologies, audit dates) to combat greenwashing and build trust

### Measurable Outcomes (Projected at Scale)

| Metric | Current (Devnet) | Target (Mainnet Year 1) |
|---|---|---|
| Verified projects listed | 8 | 50+ |
| Credits tokenized | Demo supply | 100,000 tCO2e |
| MSME users | — | 10,000+ |
| Avg. transaction cost | ~$0.0005 | ~$0.0005 |
| Double-counting incidents | 0 (by design) | 0 (by design) |

---

## Indian Market Opportunity

India presents a unique and urgent opportunity for on-chain carbon markets:

### Regulatory Tailwinds
- **CERC Carbon Credit Trading Regulations (March 2026):** CERC has issued the *CERC (Terms and Conditions for Purchase and Sale of Carbon Credit Certificates) Regulations, 2026*, operationalizing CCC trading on power exchanges. Key provisions: **compliance market** for obligated entities + **offset market** for non-obligated entities, monthly trading sessions, 1 CCC = 1 tCO2e, floor/forbearance price bands, and the Grid Controller of India as the CCC registry. BEE acts as administrator, and market oversight is shared between CERC and BEE. ([Source: Mercom India, Mar 2, 2026](https://www.mercomindia.com/))
- **Union Budget 2026-27 — Rs 20,000 Crore CCUS Programme:** The government has announced a dedicated **Rs 20,000 crore Carbon Capture, Utilisation, and Storage (CCUS)** support programme that formally integrates farmers into India's carbon market. Farmers can now earn carbon credits through agroforestry, soil improvement, and methane reduction — with trading on CERC-regulated electronic platforms expected by mid-2026. ([Source: The Better India, Feb 2026](https://www.thebetterindia.com/))
- **SEBI BRSR Framework (2023):** Top-1000 listed companies must now disclose carbon data under Section C, Principle 6. This creates immediate demand for easy-to-use offset and reporting tools.
- **Carbon Credit Trading Scheme (CCTS) 2023:** India's Bureau of Energy Efficiency is building a national compliance carbon market under the Indian Carbon Market (ICM). Projects are registered, verified by accredited Carbon Verification Agencies (ACVAs), and issued Triple C certificates recorded in the ICM registry.
- **India's NDC Commitments:** 50% cumulative electric power from non-fossil sources by 2030, 1 billion tonnes CO2e reduction by 2030 — massive supply of credits incoming.

### CERC CCC Trading Framework (2026)

The CERC regulations create the institutional backbone for India's carbon credit exchange:

```
┌───────────────┐    issues CCCs     ┌─────────────┐    credited to     ┌──────────────────┐
│      BEE      │ ─────────────────▶ │  ICM/CCTS   │ ─────────────────▶ │  Grid Controller │
│ (Administrator)│   after Central   │  Registry    │   registry upon   │  of India        │
└───────────────┘    Govt approval   └─────────────┘   fee payment      │  (CCC Registry)  │
                                                                         └────────┬─────────┘
                                                                                  │
                                                            placed for dealing    │
                                                                                  ▼
┌───────────────────┐    buy/sell    ┌──────────────────┐    transaction    ┌─────────────┐
│  Obligated Entity │ ◀────────────▶ │ Power Exchanges  │ ──────reports──▶ │   Registry   │
│ (compliance mkt)  │               │ (CERC-approved)  │                  │ debit/credit │
├───────────────────┤               │                  │                  └─────────────┘
│Non-Obligated Entity│ ◀────────────▶│   1 CCC = 1 tCO2e │
│  (offset market)  │               │  floor ↔ forbear  │
└───────────────────┘               └──────────────────┘
```

| Provision | Detail |
|---|---|
| **CCC denomination** | 1 CCC = 1 tonne CO2 equivalent (tCO2e) |
| **Markets** | Compliance market (obligated entities) + Offset market (non-obligated) |
| **Trading frequency** | Monthly or as CERC specifies |
| **Registry** | Grid Controller of India |
| **Administrator** | Bureau of Energy Efficiency (BEE) |
| **Price discovery** | Market-driven on power exchanges, within floor/forbearance band (compliance) |
| **Anti-manipulation** | Bids exceeding registry holdings are void; 3+ defaults in a quarter = 6-month trading ban |
| **Oversight** | CERC + BEE joint market oversight |

> **Why this matters for SolCarbon:** The CERC framework creates the regulatory rails for CCC trading — but power exchanges are centralized, opaque, and inaccessible to retail participants. SolCarbon can serve as the **on-chain bridge** that tokenizes CCCs for transparent, permissionless, mobile-first trading at a fraction of the cost.

### Budget 2026: How Farmers Earn Carbon Credits (11-Step Process)

The Rs 20,000 crore programme creates a structured pipeline for farmers to participate in carbon trading:

| Step | Action | Who Handles It |
|---|---|---|
| 1. Join a project | Farmers enroll through an FPO, cooperative, or aggregator | FPO / Aggregator |
| 2. KYC documentation | Aadhaar, land records, cultivation history, bank details | Farmer |
| 3. Select carbon activities | Agroforestry, reduced tillage, organic fertilizers, methane reduction (e.g., direct-seeded rice) | Farmer + Aggregator |
| 4. Develop project plan | Plot details, activity design, monitoring strategy, benefit-sharing agreements | Aggregator |
| 5. Register under ICM/CCTS | Official registration in India's Carbon Credit Trading Scheme | Aggregator |
| 6. Record baseline | Soil tests, current practices, land status documentation | Verified third-party |
| 7. Implement practices | Planting trees, improved farming, no stubble burning | Farmer |
| 8. Monitor & maintain evidence | Geotagged photos, plantation records, satellite monitoring | Farmer + Remote tools |
| 9. Third-party verification | Accredited Carbon Verification Agencies (ACVAs) audit the project | ACVAs |
| 10. Issue Triple C certificates | Carbon credits recorded in the ICM registry | ICM Registry |
| 11. Trade & receive payment | Credits sold on CERC-regulated electronic platforms | Aggregator / Farmer |

> **SolCarbon's role:** Steps 10-11 are where on-chain infrastructure becomes critical. SolCarbon can tokenize Triple C certificates as SPL tokens on Solana, enabling instant settlement, fractional trading, and transparent price discovery — replacing opaque OTC broker deals with a permissionless mobile marketplace.

### Market Size
- **Rs 20,000 crore ($2.4B) government allocation** dedicated to carbon market infrastructure (Budget 2026-27)
- **1,700+ CDM-registered projects** already generating credits in India (solar, wind, biomass, hydro)
- **63 million MSMEs** contributing ~30% of GDP — most have no carbon accounting tools and are now facing supply-chain pressure from ESG-conscious MNCs
- **$50B+ annual climate finance gap** in India — tokenized carbon markets can unlock micro-financing and retail participation
- **800M+ smartphone users** — mobile-first distribution is the only viable channel
- **Millions of farmers** newly eligible to earn carbon credits through the Budget 2026 programme via FPOs and aggregators

### Why India Needs SolCarbon
Traditional carbon registries (Verra, Gold Standard) are headquartered in Geneva and Washington. Indian project developers pay high listing fees, face 6-12 month issuance delays, and get low prices for credits because they have no direct access to retail buyers. The Budget 2026 programme creates supply — SolCarbon creates the demand-side marketplace:

```
  Traditional Path                          SolCarbon Path
  ─────────────────                         ──────────────
  Developer → Registry → Broker → Buyer     Developer → SolCarbon → Buyer
  (6-12 months, $5K+ fees)                  (instant, <$0.001 fee)

  Budget 2026 Farmer Path + SolCarbon
  ────────────────────────────────────
  Farmer → FPO → ICM Registry → Triple C Certificate → SolCarbon (tokenize) → Buyer
  (on-chain settlement, fractional trading, mobile-first)
```

### Projects Currently Listed

| Project | Location | Type | Registry |
|---|---|---|---|
| Gujarat Solar Farm | Gujarat | Solar | Gold Standard GS8273 |
| Sundarbans Mangrove | West Bengal | Reforestation | Verra VCS 1928 |
| Rajasthan Wind Energy | Rajasthan | Wind | — |
| Kerala Biogas Initiative | Kerala | Biomass | — |
| Himachal Hydro Power | Himachal Pradesh | Hydro | — |
| Tamil Nadu Tidal Energy | Tamil Nadu | Tidal | — |
| MP Agroforest | Madhya Pradesh | Agroforestry | — |
| Assam Bamboo Restoration | Assam | Bamboo | — |

---

## Global Market Opportunity

### Market Size & Growth
- **Voluntary Carbon Market:** Valued at **$2B in 2023**, projected to reach **$50B by 2030** and **$250B by 2050** (McKinsey, Taskforce on Scaling Voluntary Carbon Markets)
- **Compliance Carbon Market:** Already **$900B+** (EU ETS, China ETS), with India's CCTS launching soon
- **Tokenized Carbon (ReFi):** On-chain carbon protocols (Toucan, KlimaDAO, Flowcarbon) have tokenized 25M+ tonnes, but are concentrated on Polygon/Ethereum with high fees and no mobile presence

### Competitive Landscape

| Platform | Chain | Mobile App | India Focus | Fees | Retirement Proof |
|---|---|---|---|---|---|
| **SolCarbon** | **Solana** | **Yes (React Native)** | **Yes (8 projects)** | **< $0.001** | **NFT + on-chain burn** |
| Toucan Protocol | Polygon | No | No | $0.50–$2 gas | On-chain |
| KlimaDAO | Polygon | No | No | $0.50–$2 gas | On-chain |
| Flowcarbon | Celo | No | No | Variable | On-chain |
| Carbonmark | Polygon | No | No | Variable | On-chain |
| Traditional brokers | Off-chain | No | Limited | $50–$500/trade | PDF certificate |

### SolCarbon's Global Edge
1. **Only mobile-first carbon dApp** — no competitor has a native mobile app targeting emerging markets
2. **Solana dApp Store distribution** — 150K+ Seeker phones, 0% platform fees (vs. Apple/Google's 30%)
3. **India-first, global-ready** — starting with the world's 3rd-largest emitter, expandable to LATAM, Africa, Southeast Asia
4. **MSME tooling** — no existing protocol offers guided carbon auditing, BRSR report generation, or EU CBAM alerts
5. **EU CBAM compliance** — as the EU Carbon Border Adjustment Mechanism comes into force (2026), Indian exporters will need proof of embedded carbon offsets. SolCarbon's NFT certificates provide this.

---

## Features

### Carbon Marketplace
- 8 verified Indian carbon projects (Solar, Mangrove, Wind, Biogas, Hydro, Tidal, Agroforestry, Bamboo)
- Real-time pricing in SOL with 7-day sparkline charts
- Registry verification (Gold Standard, Verra VCS, CDM)
- Interactive buy/sell flows with on-chain settlement

### Portfolio & Certificates
- NFT certificate grid with animated premium cards
- Purple/green gradient design matching SolCarbon branding
- 3-layer animations: shimmer sweep, pulsing glow orbs, rotating border
- QR codes linking to on-chain proof
- One-tap retire with purpose selection (ESG, BRSR, Personal, Climate Gift)

### MSME Carbon Tools
- **Fractional Offset Calculator** — 6 presets (flights, commute, electricity, office, carbon neutral)
- **MSME Carbon Wizard** — 5-step guided audit with Scope 1/2/3 breakdown
- **BRSR Report Generator** — SEBI-compliant Section C Principle 6 formatted tables
- EU CBAM compliance alerts for exporters

### Wallet Integration
- Phantom, Solflare, Backpack auto-detection
- Mobile Wallet Adapter (MWA) for native Android
- SOL + CC + SKR balance display in header
- Solana Explorer deep links for every transaction

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Mobile Framework** | React Native 0.83 + Expo SDK 55 | Cross-platform (Android + Web) with native performance. Expo simplifies builds and OTA updates. |
| **Language** | TypeScript 5.9 | Type safety across the entire codebase — screens, stores, and on-chain interactions. |
| **Blockchain** | Solana (Devnet) via `@solana/web3.js` 1.98 | Sub-second finality, <$0.001 fees, MWA for mobile, dApp Store distribution. |
| **Smart Contract** | Anchor 0.32 (Rust) | Type-safe Solana program framework. 4 instructions: `initialize_treasury`, `buy_credits`, `sell_credits`, `retire_credits`. |
| **Token Standard** | SPL Token (`@solana/spl-token` 0.4) | Native Solana tokens with 2-decimal precision for fractional carbon credits (CC). |
| **NFT Standard** | Metaplex Core via UMI | Lightweight on-chain NFTs for retirement certificates — no collection overhead. |
| **State Management** | Zustand 5 + AsyncStorage | Minimal boilerplate, persistent across app restarts, reactive UI updates. |
| **Wallet** | MWA 2.2 + Web wallet adapters | Android-native signing via MWA; browser-based signing via Phantom/Solflare/Backpack adapters. |
| **Navigation** | React Navigation 7 (tabs + native stack) | Tab-based UX (Dashboard, Market, Portfolio, History, Tools) with stack-based detail screens. |
| **Animations** | React Native Reanimated 4 + Animated API | 60fps certificate animations (shimmer, glow orbs, rotating border gradient). |
| **Gradients** | expo-linear-gradient | Purple/green gradient branding across cards, headers, and certificates. |

### Smart Contract Overview

The Anchor program (`CUmu7iSDj5RavATJnm2Xsrvkgo7iqAb7MeT3GVsgmg7o`) has 4 instructions:

```
initialize_treasury  → Sets up Treasury PDA as mint authority
buy_credits          → User pays SOL → Treasury PDA mints CC tokens to user's ATA
sell_credits         → User sends CC to Treasury ATA → Treasury PDA returns SOL
retire_credits       → Burns CC tokens permanently (irreversible on-chain retirement)
```

All arithmetic uses `checked_mul` / `checked_div` to prevent overflow. The Treasury PDA is derived from `[b"treasury", mint.key()]` and holds SOL reserves + mint authority.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native / Expo 55                │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │ Screens  │  │Components │  │   Providers          │  │
│  │Dashboard │  │Header     │  │ WalletProvider       │  │
│  │Market    │  │Certificate│  │  ├─ SOL balance      │  │
│  │Portfolio │  │ConnectBtn │  │  ├─ CC balance       │  │
│  │History   │  │Disconnect │  │  └─ SKR balance      │  │
│  │Tools     │  │Modal      │  │                      │  │
│  └────┬─────┘  └───────────┘  └──────────┬───────────┘  │
│       │                                   │              │
│  ┌────▼───────────────────────────────────▼───────────┐  │
│  │          Zustand Store (blockchain-store.ts)       │  │
│  │  buyCredits · sellCredits · retireCredits          │  │
│  │  sendWithRetry · stampBlockhash · normalizeCCAmount│  │
│  └────────────────────┬──────────────────────────────┘  │
│                       │                                  │
├───────────────────────┼──────────────────────────────────┤
│   Solana Devnet       │                                  │
│  ┌────────────────────▼──────────────────────────────┐  │
│  │  Anchor Program: CUmu7iSD...Mg7o                  │  │
│  │  ├─ initialize_treasury                           │  │
│  │  ├─ buy_credits                                   │  │
│  │  ├─ sell_credits                                  │  │
│  │  └─ retire_credits                                │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Treasury PDA: EM1yn6t5...MaK4 (mint authority)   │  │
│  │  CC Token Mint: HVvtKeii...zpAa (2 decimals)     │  │
│  │  NFT Certificates: Metaplex Core                  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- A Solana wallet (Phantom, Solflare, or Backpack)

### Install
```bash
git clone https://github.com/gitsofaryan/Solcarbondapp.git
cd Solcarbondapp
npm install
```

### Run (Web)
```bash
npm run web
```
Opens on `http://localhost:8081`. Connect Phantom or Solflare browser extension. Switch wallet to **Devnet**.

### Run (Android)
```bash
npm run android
```
Requires Android Studio or a connected device. Uses MWA for native wallet signing.

---

## On-Chain Addresses (Devnet)

| Resource | Address |
|---|---|
| Anchor Program | [`CUmu7iSDj5RavATJnm2Xsrvkgo7iqAb7MeT3GVsgmg7o`](https://explorer.solana.com/address/CUmu7iSDj5RavATJnm2Xsrvkgo7iqAb7MeT3GVsgmg7o?cluster=devnet) |
| Treasury PDA | [`EM1yn6t5cbyQWSeNmQziqRVhgnjPASZEF92MM8sgMaK4`](https://explorer.solana.com/address/EM1yn6t5cbyQWSeNmQziqRVhgnjPASZEF92MM8sgMaK4?cluster=devnet) |
| CC Token Mint | [`HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa`](https://explorer.solana.com/address/HVvtKeii8fyygZE1iFygm9HpcdTVDe6ig1uUFe8aZpAa?cluster=devnet) |

---

## Project Structure

```
├── contract/                    # Anchor smart contract (Rust)
│   └── programs/sol-carbon/src/lib.rs
├── src/
│   ├── components/              # Reusable UI (Header, Certificate, Modals)
│   ├── data/                    # IDL (sol_carbon.json), verified projects
│   ├── hooks/                   # useWallet
│   ├── navigation/              # Tab navigator
│   ├── providers/               # WalletProvider (SOL/CC/SKR balances)
│   ├── screens/                 # Dashboard, Market, Portfolio, History, Tools
│   ├── store/                   # Zustand blockchain store
│   ├── theme/                   # Colors, typography
│   └── utils/                   # Solana helpers, price utils
├── assets/                      # Icons, logos, metadata
├── app.json                     # Expo config
└── package.json
```

---

## Hackathon Context

**Built for the [Monolith Hackathon](https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE)** on the Solana track.

### What We Built in the Hackathon
- Full Anchor smart contract with 4 instructions (buy, sell, retire, initialize)
- Mobile-first React Native dApp with 5 main screens and 3 modal flows
- 8 verified Indian carbon project profiles with live pricing data
- NFT certificate generation with animated UI and QR codes
- MSME carbon audit wizard and BRSR report generator
- Full wallet integration (MWA + browser adapters)

### What's Next (Post-Hackathon Roadmap)
1. **Mainnet deployment** with real registry-backed credits
2. **On-chain oracle** for live carbon credit pricing (Pyth/Switchboard)
3. **Metaplex compressed NFTs** for cheaper certificate minting at scale
4. **B2B API** for enterprises to integrate carbon retirement into their apps
5. **DAO governance** for credit verification and project listing
6. **LATAM & Southeast Asia expansion** with regional project listings

---

## License

MIT

---

<p align="center">
  <strong>SolCarbon</strong> — Regenerative Finance (ReFi) on Solana 🌍<br/>
  <em>Making carbon markets transparent, accessible, and permanent.</em>
</p>
