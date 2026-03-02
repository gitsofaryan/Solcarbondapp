# SolCarbon Mobile dApp 🌿◎

SolCarbon is a decentralized application (dApp) built on the Solana blockchain, designed to facilitate the tokenization, exchange, and retirement of Carbon Credits.

This repository contains the mobile client built with React Native and Expo, deeply integrated with the Solana ecosystem using the Mobile Wallet Adapter (MWA) and Metaplex standards.

## 🏗️ Technical Architecture

### 1. Core Frameworks
*   **React Native & Expo**: Cross-platform mobile framework leveraging Expo SDK 55 for rapid iteration and native module access.
*   **Solana Web3.js**: The official Solana JavaScript API for interacting with the RPC network (Devnet).
*   **Zustand**: A small, fast, and scalable state management solution used to handle complex asynchronous blockchain states (wallet connections, token balances, transaction history).

### 2. Blockchain Integrations

#### Wallet Connectivity
*   **Mobile Wallet Adapter (MWA)**: Integrates `@solana-mobile/mobile-wallet-adapter-protocol` to provide native, secure Android/iOS wallet connections. Users can connect, switch networks, and sign transactions using Backpack, Phantom, or Solflare seamlessly.

#### SPL Token Standardization (SOLCC)
*   The protocol revolves around a custom SPL Token representing 1 Ton of verified Carbon Credits.
*   **On-Chain Metadata**: Leveraging `@metaplex-foundation/mpl-token-metadata`, the SPL Token is fully branded ("SolCarbon Credit" / "SOLCC").
*   **Decentralized Storage**: Token imagery and JSON metadata are permanently pinned to the **Arweave** blockchain using the **Irys SDK** (`@metaplex-foundation/umi-uploader-irys`), guaranteeing immutability and preventing "spoofing" warnings on Solana Explorers.

#### Dynamic NFT Certificates
*   **Metaplex Core**: Upon purchasing/retiring Carbon Credits, the dApp dynamically mints a Metaplex Core NFT to the user's wallet.
*   **On-the-Fly Asset Generation**: Uses programmatic UI overlays to stamp real-time transaction data (Amount, Date, Tx Signature, Asset ID) onto a high-end "ATM Card" style graphical asset.
*   These non-fungible certificates act as immutable, cryptographically verifiable proof of corporate or individual carbon offsets.

### 3. Application Structure

*   **/src/store/blockchain-store.ts**: The central nervous system of the dApp. Handles all async RPC calls, SPL token transfers, ATA (Associated Token Account) creation, and NFT minting instructions.
*   **/src/providers/WalletProvider.tsx**: Wraps the application in the Solana MWA context, providing global access to the active authorization token and signing capabilities.
*   **/scripts/**: Contains critical Node.js utilities for backend operations, including:
    *   `deploy-metadata-irys.mjs`: Automates the upload of assets to Arweave and updates on-chain Master Mint metadata.
*   **/contract/**: Contains scaffolding for an **Anchor**-based Rust smart contract program, designed for future migration of business logic entirely on-chain.

## 🚀 Getting Started (Devnet)

### Prerequisites
*   Node.js v18+
*   Expo CLI (`npm install -g expo-cli`)
*   A Solana Wallet App installed on your Android emulator or physical device (e.g., Backpack, Phantom).

### Installation
```bash
cd mobile
npm install
```

### Running the App
Start the Expo Metro bundler:
```bash
npm start
```

Press `a` to open the Android emulator or scan the QR code using the Expo Go app on your physical device.

## 🔒 Security Notes
*   **Treasury Keypair**: The current test environment utilizes a hardcoded Treasury Native Array for demonstration of mint authority. In a production Mainnet environment, this logic MUST be migrated behind a secure backend API or fully integrated into the provided Anchor Smart Contract to secure the Mint Authority.
*   **Network Constraint**: The Application is strictly bound to the **Solana Devnet** cluster via `https://api.devnet.solana.com`.

---
*Built for the Future of ReFi (Regenerative Finance) on Solana.*