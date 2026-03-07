# SolCarbon - Solana Carbon Credit Exchange 🌿◎

SolCarbon is a premium, mobile-first decentralized application (dApp) built on the Solana blockchain, designed to facilitate the tokenization, exchange, and retirement of Carbon Credits.

This repository contains the mobile client built with React Native and Expo, deeply integrated with the Solana ecosystem using the Mobile Wallet Adapter (MWA) and Metaplex standards.

---

## 🏗️ Technical Architecture

### 1. Core Frameworks
*   **React Native & Expo**: Cross-platform mobile framework leveraging Expo SDK 55 for rapid iteration and native module access.
*   **Solana Web3.js**: Official Solana JavaScript API for interacting with the RPC network (Devnet).
*   **Zustand**: Scalable state management used to handle complex asynchronous blockchain states (wallet connections, token balances, transaction history).

### 2. Blockchain Integrations

#### Wallet Connectivity
*   **Mobile Wallet Adapter (MWA)**: Integrates `@solana-mobile/mobile-wallet-adapter-protocol` for native, secure Android/iOS wallet connections (Backpack, Phantom, Solflare).

#### SPL Token Standardization (SOLCC)
*   **On-Chain Metadata**: Leveraging Metaplex Token Metadata, the SPL Token represents 1 Ton of verified Carbon Credits ("SOLCC").
*   **Decentralized Storage**: Assets are pinned to **Arweave** via the **Irys SDK**, guaranteeing immutability.

#### Dynamic NFT Certificates
*   **Metaplex Core**: Upon purchase/retirement, the dApp dynamically mints a Metaplex Core NFT as immutable proof of offset.
*   **Programmatic Assets**: Real-time transaction data is stamped onto high-end graphical assets during the minting process.

---

## 🌟 Key Features

### 1. **Compliance Dashboard**
- **Real-time Carbon Gauge**: Progress tracking against compliance targets.
- **Deficit/Surplus Alerts**: Dynamic highlights for credit shortfalls or surpluses.
- **Quick Fill Action**: One-tap auto-purchase to meet compliance.

### 2. **Carbon Marketplace**
- **Verified Projects**: Detailed listings for Indian carbon projects (Solar, Wind, Reforestation, etc.).
- **Interactive Purchase Flow**: Bottom sheets with real-time cost calculation and quantity selection.

### 3. **Portfolio & History**
- **NFT Certificate Grid**: View and manage your unique carbon credit certificates.
- **Complete Audit Trail**: Filterable transaction history with direct links to Solana Explorer.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v18+
*   Expo CLI (`npm install -g expo-cli`)
*   Solana Wallet App (Phantom/Backpack) on your device.

### Installation
```bash
npm install
```

### Running the App
Start the Expo Metro bundler:
```bash
npm start
```

Press `a` to open the Android emulator or scan the QR code using the Expo Go app.

---

## 🔧 Application Structure
*   **/src/store/blockchain-store.ts**: Central state and RPC interaction logic.
*   **/src/screens/**: Main application views (Dashboard, Marketplace, Portfolio, etc.).
*   **/src/providers/WalletProvider.tsx**: Solana MWA context provider.
*   **/scripts/**: Utilities for metadata deployment and treasury initialization.
*   **/contract/**: Anchor-based Rust smart contract program.

---

## 🔒 Security Notes
*   **Prototype Environment**: This version utilizes simulated blockchain interactions and a test treasury keypair. In production, logic must be migrated behind secure APIs or fully on-chain programs.
*   **Network**: strictly bound to **Solana Devnet**.

---
*Built for the Future of ReFi (Regenerative Finance) on Solana.*