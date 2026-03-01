import { History, ArrowUpRight, ArrowDownRight, ExternalLink } from 'lucide-react';
import { Card } from './ui/card';
import { useBlockchainStore } from '../store/blockchain-store';
import { format } from 'date-fns';

export function TransactionHistory() {
  const { transactions } = useBlockchainStore();

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Transaction History</h2>
          <p className="text-gray-400">View your carbon credit transaction history</p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-12 text-center">
          <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No transactions yet</p>
          <p className="text-sm text-gray-500 mt-2">Your transaction history will appear here</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Transaction History</h2>
        <p className="text-gray-400">View your carbon credit transaction history</p>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <Card key={tx.id} className="bg-[#1a1a1a] border-[#2a2a2a] p-5 hover:border-emerald-500/30 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${
                  tx.type === 'buy' 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {tx.type === 'buy' ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {tx.type === 'buy' ? 'Purchased' : 'Sold'} Carbon Credits
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      tx.type === 'buy'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {tx.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{tx.projectName}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-300">
                      <span className="font-semibold">{tx.amount} CC</span> @ ${tx.pricePerCC}
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400">
                      {format(new Date(tx.timestamp), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 font-mono">
                      {tx.signature.slice(0, 20)}...{tx.signature.slice(-20)}
                    </span>
                    <button className="text-emerald-400 hover:text-emerald-300">
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className={`text-xl font-bold ${
                  tx.type === 'buy' ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {tx.type === 'buy' ? '-' : '+'}${(tx.amount * tx.pricePerCC).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">USDC</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
