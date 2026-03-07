import { History, ArrowUpRight, ArrowDownRight, ExternalLink, Filter } from 'lucide-react';
import { Card } from './ui/card';
import { useBlockchainStore } from '../store/blockchain-store';
import { format } from 'date-fns';
import { useState } from 'react';
import { Button } from './ui/button';

export function MobileHistory() {
  const { transactions } = useBlockchainStore();
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  const filteredTxs = transactions.filter(tx =>
    filter === 'all' ? true : tx.type === filter
  );

  if (transactions.length === 0) {
    return (
      <div className="space-y-6 pb-24 px-4 pt-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-1">Transaction History</h2>
          <p className="text-sm text-gray-400">View your activity</p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-12 text-center">
          <div className="bg-[#2a2a2a] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-gray-400 mb-2">No Transactions Yet</p>
          <p className="text-xs text-gray-500">Your transaction history will appear here</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Transaction History</h2>
          <p className="text-sm text-gray-400">{transactions.length} transactions</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFilter('all')}
          className={`flex-1 rounded-full ${filter === 'all'
              ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
        >
          All
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFilter('buy')}
          className={`flex-1 rounded-full ${filter === 'buy'
              ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
        >
          Purchases
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setFilter('sell')}
          className={`flex-1 rounded-full ${filter === 'sell'
              ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:bg-[#2a2a2a]'
            }`}
        >
          Sales
        </Button>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTxs.map((tx) => (
          <Card key={tx.id} className="bg-[#1a1a1a] border-[#2a2a2a] p-4 active:scale-[0.98] transition-transform">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${tx.type === 'buy'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
                }`}>
                {tx.type === 'buy' ? (
                  <ArrowDownRight className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {tx.type === 'buy' ? 'Purchased' : 'Sold'} Credits
                    </h3>
                    <p className="text-xs text-gray-400 truncate">{tx.projectName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-bold ${tx.type === 'buy' ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                      {tx.type === 'buy' ? '-' : '+'}${(tx.amount * tx.pricePerCC).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500">USDC</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="font-semibold text-white">{tx.amount} CC</span>
                    <span>•</span>
                    <span>${tx.pricePerCC} each</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]">
                  <span className="text-[10px] text-gray-500">
                    {format(new Date(tx.timestamp), 'MMM d, yyyy • h:mm a')}
                  </span>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 p-1 rounded"
                    title="View on Solana Explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Signature */}
                <div className="mt-2 bg-[#121212] rounded-lg p-2">
                  <p className="text-[9px] text-gray-500 font-mono truncate">
                    {tx.signature}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center justify-end mt-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${tx.status === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : tx.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                {tx.status.toUpperCase()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
