import { Wallet, Leaf } from 'lucide-react';
import { useBlockchainStore } from '../store/blockchain-store';

export function WalletHeader() {
  const { usdcBalance, carbonCredits } = useBlockchainStore();

  return (
    <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-white">SolCarbon</h1>
            <p className="text-xs text-gray-400">Carbon Credit Exchange</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-[#121212] px-4 py-2 rounded-lg border border-[#2a2a2a]">
            <Wallet className="w-4 h-4 text-blue-400" />
            <div>
              <p className="text-xs text-gray-400">USDC Balance</p>
              <p className="font-semibold text-white">${usdcBalance.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#121212] px-4 py-2 rounded-lg border border-emerald-500/30">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-xs text-gray-400">Carbon Credits</p>
              <p className="font-semibold text-emerald-400">{carbonCredits} CC</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
