# SolCarbon 🌿◎

**On-chain carbon credit exchange built on Solana — tokenize, trade, and retire verified carbon credits as a mobile-first dApp.**

> Built for the [Monolith Hackathon](https://align.nexus/organizations/8b216ce8-dd0e-4f96-85a1-0d95ba3022e2/hackathons/6unDGXkWmY1Yw99SsKMt6pPCQTpSSQh5kSiJRgqTwHXE)

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana&logoColor=white)](https://explorer.solana.com/address/CUmu7iSDj5RavATJnm2Xsrvkgo7iqAb7MeT3GVsgmg7o?cluster=devnet)
[![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo_SDK-55-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Anchor](https://img.shields.io/badge/Anchor-0.32-blue)](https://www.anchor-lang.com)

---

## What is SolCarbon?

SolCarbon brings **voluntary carbon markets on-chain**. Users can browse verified Indian carbon projects (solar, mangrove, wind, bamboo), purchase fractional carbon credits as SPL tokens, receive NFT certificates as proof of offset, and permanently retire credits for ESG/BRSR compliance — all on Solana with zero platform fees.

### Why Solana?
- **Sub-second finality** for real-time carbon trading
- **< $0.001 transaction fees** making micro-offsets viable
- **Solana dApp Store** — 150,000+ Seeker devices, 0% platform fees
- **Mobile Wallet Adapter (MWA)** for native mobile wallet signing

---

## Features

### Carbon Marketplace
- 6 verified Indian carbon projects (Solar, Mangrove, Wind, Bamboo, Biogas, Reforestation)
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

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Framework | React Native 0.83 + Expo SDK 55 |
| Language | TypeScript 5.9 |
| Blockchain | Solana (Devnet) via `@solana/web3.js` 1.98 |
| Smart Contract | Anchor 0.32 (Rust) |
| Token Standard | SPL Token (`@solana/spl-token` 0.4) |
| NFT Standard | Metaplex Core via UMI |
| State Management | Zustand 5 + AsyncStorage persistence |
| Wallet | MWA 2.2 + Web wallet adapters |
| Navigation | React Navigation 7 (tabs + native stack) |
| Animations | React Native Reanimated 4 + Animated API |
| Gradients | expo-linear-gradient |

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

### Run (Android)
```bash
npm run android
```

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

## License

MIT

---

*Built for the future of Regenerative Finance (ReFi) on Solana.* 🌍
