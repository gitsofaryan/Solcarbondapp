# Changelog

All notable changes to SolCarbon are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] – 2026-03-07

### Bug Fixes & Logical Gap Patches

A full audit of the application was conducted and the following logical gaps were identified and patched.

---

#### Fix 1 — `availableCC` now correctly decrements after purchase
**Files:** `src/app/store/blockchain-store.ts`, `src/app/data/mock-projects.ts`

**Problem:** The projects list was a static frozen import (`mockProjects`). Purchasing credits from a project never reduced its available supply — a user could buy 5,000 CC from a project with 5,000 available, then buy 5,000 again indefinitely.

**Fix:** Moved the projects array into Zustand state as a mutable copy (`projects: mockProjects.map(p => ({ ...p }))`). The `buyCredits` action now maps over projects and decrements `availableCC` for the purchased project before committing state.

Additionally added a `project.availableCC < amount` guard in `buyCredits` so purchases that exceed available supply are rejected with a clear error message.

---

#### Fix 2 — `autoFillDeficit` now self-sufficient and pre-validates USDC
**Files:** `src/app/store/blockchain-store.ts`, `src/app/components/MobileDashboard.tsx`

**Problem:** `autoFillDeficit` accepted a `projects` array as an argument from the caller (the Dashboard passed in the static `mockProjects`). This meant it was blind to live supply changes. It also had no USDC pre-validation — an error would only surface deep inside `buyCredits` after an unnecessary blockchain delay.

**Fix:** Signature changed to `autoFillDeficit(): Promise<string>` (no arguments). It now reads `state.projects` directly from the store and checks both `availableCC >= deficit` **and** `usdcBalance >= totalCost` before selecting a project. It also returns two distinct error messages depending on which constraint fails.

---

#### Fix 3 — Marketplace uses live projects; quick-select clamped; amount resets on project switch
**Files:** `src/app/components/MobileMarketplace.tsx`

**Problem (a):** Marketplace rendered the static `mockProjects` array, so sold-out projects still appeared available after purchases.

**Problem (b):** Quick-select buttons (`10 / 25 / 50 / 100`) would set `purchaseAmount` to values exceeding a project's `availableCC` with no clamping or feedback.

**Problem (c):** `purchaseAmount` state persisted when switching from one project to another — opening Project B after setting 100 CC on Project A would carry the stale amount across.

**Fix:**  
- Marketplace now reads `projects` from the Zustand store (live supply).  
- Projects with `availableCC === 0` show a **"Sold Out"** overlay and have their "Buy Now" button disabled/greyed.  
- Quick-select buttons are disabled when `amount > project.availableCC` and clamp via `Math.min(amount, project.availableCC)`.  
- An `openProject(id)` helper resets `purchaseAmount` to `0` whenever a different project is selected.  
- A `closeSheet()` helper resets both `selectedProject` and `purchaseAmount` on sheet dismiss.

---

#### Fix 4 — Global `isLoading` race condition resolved
**Files:** `src/app/store/blockchain-store.ts`, `src/app/components/MobileDashboard.tsx`, `src/app/components/MobileMarketplace.tsx`, `src/app/components/FloatingSellButton.tsx`

**Problem:** A single shared `isLoading: boolean` flag was used for all async actions (`buyCredits`, `sellCredits`, `autoFillDeficit`). Concurrent actions could overwrite each other's loading state — e.g., a sell completing and setting `isLoading: false` while a buy was still in-flight, leaving UI buttons incorrectly re-enabled.

**Fix:** Split into two independent flags:
- `isBuying: boolean` — set by `buyCredits` and `autoFillDeficit`
- `isSelling: boolean` — set by `sellCredits`

All UI components updated to destructure and react to the appropriate flag.

Also fixed sell transaction IDs to use the same unique `uid` pattern (`Date.now()-randomStr`) to avoid `Date.now()` collision risk on rapid actions.

---

#### Fix 5 — Progress bar color now actually renders
**Files:** `src/app/components/ui/progress.tsx`, `src/app/components/MobileDashboard.tsx`

**Problem:** The compliance gauge used a `// @ts-ignore` hack to set `--progress-background` as a CSS custom property on the Radix `Progress` root, but Radix's `Indicator` child uses `bg-primary` internally — the custom variable was never consumed and the bar always rendered in the default theme color regardless of compliance state.

**Fix:** Extended the `Progress` component with an `indicatorColor?: string` prop that is applied directly to `ProgressPrimitive.Indicator` via `style={{ backgroundColor: indicatorColor }}`. Also added a smooth `500ms ease-out` CSS transition for a polished animated fill.

Dashboard now passes `indicatorColor={percentage >= 100 ? '#10b981' : '#f59e0b'}` (emerald when compliant, amber when in deficit). Progress value is also clamped to `Math.min(percentage, 100)` to prevent overflow beyond 100%.

---

#### Fix 6 — Dead "View on Explorer" buttons now functional
**Files:** `src/app/components/Portfolio.tsx`, `src/app/components/MobileHistory.tsx`

**Problem:** Both the portfolio NFT cards and the transaction history rows had `ExternalLink` icon buttons with no `href`, `onClick`, or any navigation handler — they were purely decorative and did nothing when clicked.

**Fix:**  
- **Portfolio card** (row icon): `onClick` opens `https://explorer.solana.com/address/{nft.tokenId}?cluster=devnet` in a new tab.  
- **Portfolio detail sheet** ("View on Solana Explorer" button): Converted from `<button>` to `<a>` with the same URL pattern.  
- **Transaction history row**: Converted `<button>` to `<a>` linking to `https://explorer.solana.com/tx/{tx.signature}?cluster=devnet`.  
All external links use `target="_blank" rel="noopener noreferrer"` for security.

---

### Market Insights — Now Dynamic
**File:** `src/app/components/MobileDashboard.tsx`

**Problem:** "Avg. Market Price" was hardcoded as `$15.20 / CC` — stale and incorrect (actual average of the 8 projects is ~$15.76). "Projects Available" and "Total Supply" also read from the static import.

**Fix:** All three Market Insights values are now computed live from `state.projects`:
- **Avg. Market Price:** `(sum of pricePerCC) / projects.length`
- **Projects Available:** `projects.filter(p => p.availableCC > 0).length`
- **Total Supply:** `projects.reduce((sum, p) => sum + p.availableCC, 0)`

---

### Security Notes
This remains a **prototype/MVP** with simulated blockchain interactions. Real production use requires:
- Phantom / wallet adapter integration with actual transaction signing
- Solana web3.js for on-chain submissions
- Metaplex for real NFT minting
- Server-side rate limiting and input validation
- Proper error boundaries and retry logic

---

*Audited and patched by 0ptimusPrime — 2026-03-07*
