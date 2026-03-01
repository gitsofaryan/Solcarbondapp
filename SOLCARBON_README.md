# SolCarbon - Solana Carbon Credit Exchange

A mobile-first decentralized application (dApp) for trading carbon credit certificates on the Solana blockchain.

## 🌟 Features

### 1. **Compliance Dashboard**
- **Real-time Carbon Gauge**: Visual progress bar showing current holdings vs. compliance target (80/100 CC)
- **Deficit/Surplus Alerts**: Dynamic alerts highlighting 20 CC deficit or surplus credits
- **Quick Fill Action**: One-tap auto-purchase of cheapest available credits to meet compliance
- **Market Insights**: Average market price, available projects, and total supply statistics
- **Animated Stats Grid**: Target, Held, and Status cards with smooth animations

### 2. **Carbon Marketplace**
- **8 Verified Indian Projects**:
  - Rajasthan Solar Park (Solar Energy)
  - Karnataka Wind Farm (Wind Energy)
  - Maharashtra Reforestation (Reforestation)
  - Gujarat Biomass Energy (Biomass)
  - Tamil Nadu Hydro Project (Hydroelectric)
  - Kerala Coastal Mangrove (Conservation)
  - Madhya Pradesh Solar (Solar Energy)
  - Uttarakhand Forest Carbon (Forest Conservation)
  
- **Project Cards**: High-quality images, verification badges, ratings, and availability
- **Bottom Sheet Purchase Flow**: 
  - Full project details with descriptions
  - Visual amount selector with +/- buttons
  - Quick select amounts (10, 25, 50, 100)
  - Real-time cost calculation
  - Touch-friendly large buttons

### 3. **Portfolio (NFT Certificates)**
- **NFT Certificate Generation**: Each purchase mints a unique SPL token certificate
- **Certificate Display**: Grid view of owned carbon credit NFTs
- **Detailed NFT View**:
  - Full-screen certificate visualization
  - Token ID, mint date, and blockchain info
  - Solana network details (SPL Token standard)
  - View on Explorer link
- **Portfolio Summary**: Total holdings and compliance rate

### 4. **Transaction History**
- **Complete Audit Trail**: All buy/sell transactions with timestamps
- **Filter Options**: View all, purchases only, or sales only
- **Transaction Details**:
  - Amount, price per CC, total cost
  - Full Solana transaction signature
  - Transaction status (completed/pending/failed)
  - Link to blockchain explorer
- **Visual Indicators**: Color-coded buy (green) and sell (amber) transactions

### 5. **Mobile-Optimized UI**
- **Sticky Header**: Balance pills showing USDC and CC in real-time
- **Profile Drawer**: User info, wallet address, member since date
- **Bottom Navigation**: 4 tabs (Dashboard, Market, Portfolio, History)
- **Floating Sell Button**: Appears when user has surplus credits
- **Smooth Animations**: Page transitions, card reveals, and micro-interactions
- **Touch-Friendly**: Large buttons, easy-to-tap controls, gesture-ready

### 6. **Blockchain Simulation**
- **Zustand State Management**: Mock blockchain state
- **Phantom Wallet Integration**: Simulated connection flow
- **Transaction Signatures**: Real-looking 88-character Solana signatures
- **Network Delay**: 1.5-2.5s realistic blockchain confirmation time
- **Balance Updates**: Automatic USDC deduction/addition
- **NFT Minting**: Generates unique token IDs for each purchase

## 🎨 Design System

### Color Palette
- **Background**: `#121212` (Deep dark slate)
- **Card Background**: `#1a1a1a` (Slightly lighter)
- **Borders**: `#2a2a2a` (Subtle borders)
- **Carbon Credits**: `#10b981` (Emerald green)
- **Warnings/Deficit**: `#f59e0b` (Amber)
- **USDC/Info**: `#60a5fa` (Blue)

### Typography
- **Headers**: Bold, white text
- **Body**: Gray-400 for secondary text
- **Numbers**: Large, bold, color-coded

### Animations
- **Framer Motion**: Page transitions, card reveals
- **Staggered Animations**: Sequential loading of cards
- **Spring Physics**: Natural feel for modals and sheets
- **Active States**: Scale transforms on touch

## 📱 Mobile Features

### Touch Interactions
- **Active States**: Cards scale down on press
- **Large Touch Targets**: 44px minimum for all buttons
- **Swipeable Sheets**: Bottom sheets for detailed views
- **Gesture Ready**: Prepared for swipe-to-refresh patterns

### Responsive Layout
- **Max Width**: 448px (md breakpoint) centered on larger screens
- **Safe Areas**: Proper padding for notched devices
- **Bottom Bar**: Fixed navigation with backdrop blur
- **Floating Actions**: Context-aware sell button

## 🔧 Technical Stack

- **React 18.3.1**: Modern hooks and concurrent features
- **TypeScript**: Type-safe development
- **Zustand**: Lightweight state management
- **Tailwind CSS v4**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Modern icon library
- **date-fns**: Date formatting
- **Sonner**: Toast notifications

## 🚀 User Flows

### Buy Flow
1. Browse marketplace projects
2. Tap project card to open details sheet
3. Adjust amount with +/- or quick select
4. Review total cost calculation
5. Tap "Buy Carbon Credits"
6. See "Connecting to Phantom..." loader
7. Transaction confirmed with signature
8. NFT certificate minted automatically
9. View in Portfolio tab

### Sell Flow
1. Navigate to Dashboard (surplus > 0)
2. Floating amber sell button appears
3. Tap to open sell modal
4. Enter amount and price per CC
5. See total revenue preview
6. Tap "List Credits on Marketplace"
7. Transaction confirmed
8. Balance updated immediately

### Compliance Check
1. Dashboard shows 80/100 CC gauge
2. Red alert: "You need 20 CC more"
3. Tap "Quick Fill Deficit (20 CC)"
4. System finds cheapest project
5. Auto-purchases required amount
6. Gauge updates to 100/100 ✓

## 🎯 Use Cases

### For Companies
- **Scenario**: Manufacturing firm needs 100 CC compliance
- **Start**: 80 CC held, 20 CC deficit
- **Action**: Purchase from Gujarat Biomass ($11.8/CC = $236 total)
- **Result**: 100 CC compliance achieved, NFT certificate received

### For Verified Projects
- **Scenario**: Solar park has 5000 CC to sell
- **Action**: Listed on marketplace at $12.5/CC
- **Result**: Companies/individuals purchase credits, project generates revenue

### For Traders
- **Scenario**: Company has 120 CC, only needs 100
- **Action**: List 20 CC surplus at $16/CC
- **Result**: $320 revenue, other companies meet compliance

## 📊 Mock Data

- **Initial State**: 
  - USDC Balance: $5,000
  - Carbon Credits: 80 CC
  - Compliance Target: 100 CC
  
- **Projects**: 8 verified Indian carbon projects
- **Price Range**: $11.80 - $22.30 per CC
- **Total Available**: 25,400 CC across all projects

## 🔐 Security Notes

This is a **prototype/MVP** with simulated blockchain interactions. In production:
- Implement real Phantom wallet connection
- Use actual Solana web3.js library
- Add transaction signing and submission
- Implement NFT minting via Metaplex
- Add proper error handling and retry logic
- Implement rate limiting and validation

## 📝 Future Enhancements

- [ ] Real Solana wallet integration
- [ ] Live price feeds from oracles
- [ ] Project verification smart contracts
- [ ] Peer-to-peer trading
- [ ] Carbon credit retirement mechanism
- [ ] Multi-language support (Hindi, etc.)
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] QR code scanner for quick transfers
- [ ] Social sharing of achievements

---

**Built with ❤️ for a sustainable future 🌱**
