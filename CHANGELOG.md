# SolCarbon — Changelog

## [1.0.0] — 2026-03-07

### Smart Contract
- Anchor program on Solana Devnet (`CUmu7iSDj5RavATJnm2Xsrvkjo7iqAb7MeT3GVsgmg7o`)
- Treasury PDA with buy, sell, and retire instructions
- CC Token Mint with 2 decimal places

### App Features
- **Dashboard** — portfolio overview, quick actions, trending projects
- **Marketplace** — browse and buy verified carbon credit projects
- **Portfolio** — NFT certificate grid with retire flow
- **History** — filterable transaction log (buy / sell / retire)
- **Tools** — fractional offset calculator, MSME carbon wizard, BRSR report generator
- **Certificate Detail** — animated NFT card, on-chain details, share/download, burn & retire
- **Wallet** — multi-wallet support (Phantom, Solflare, Backpack, MWA)

### Technical
- React Native 0.83 + Expo SDK 55 (web, Android, iOS)
- Zustand state management with AsyncStorage persistence
- Metaplex Core NFT minting for certificates
- On-chain sync — portfolio derived from blockchain state

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
