import { useState } from 'react';
import { DollarSign, TrendingUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { useBlockchainStore } from '../store/blockchain-store';
import { toast } from 'sonner';

export function FloatingSellButton() {
  const { sellCredits, carbonCredits, complianceTarget, isLoading } = useBlockchainStore();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [pricePerCC, setPricePerCC] = useState('');

  const surplus = carbonCredits > complianceTarget ? carbonCredits - complianceTarget : 0;
  const totalRevenue = (parseFloat(amount) || 0) * (parseFloat(pricePerCC) || 0);

  const handleSell = async () => {
    const sellAmount = parseFloat(amount);
    const price = parseFloat(pricePerCC);

    if (!sellAmount || sellAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!price || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (sellAmount > surplus) {
      toast.error(`You can only sell up to ${surplus} CC (surplus credits)`);
      return;
    }

    try {
      toast.loading('Listing on marketplace...', { id: 'sell' });
      const signature = await sellCredits(sellAmount, price);
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Credits Listed!</p>
          <p className="text-xs text-gray-400">Listed {sellAmount} CC at ${price} per credit</p>
          <p className="text-xs text-gray-500">Sig: {signature.slice(0, 12)}...</p>
        </div>,
        { id: 'sell', duration: 5000 }
      );
      setAmount('');
      setPricePerCC('');
      setIsOpen(false);
    } catch (error) {
      toast.error((error as Error).message, { id: 'sell' });
    }
  };

  if (surplus <= 0) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-gradient-to-r from-amber-500 to-orange-600 text-white w-14 h-14 rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <TrendingUp className="w-6 h-6" />
      </button>

      {/* Sell Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal Content */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto">
            <Card className="bg-[#1a1a1a] border-t-2 border-amber-500/30 text-white rounded-t-3xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Sell Carbon Credits</h3>
                    <p className="text-xs text-gray-400">List your surplus on marketplace</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Surplus Info */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Available Surplus:</span>
                  <span className="text-xl font-bold text-emerald-400">{surplus} CC</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="sell-amount" className="text-gray-300 text-sm mb-2 block">
                    Amount to Sell
                  </Label>
                  <Input
                    id="sell-amount"
                    type="number"
                    min="1"
                    max={surplus}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Max: ${surplus} CC`}
                    className="bg-[#121212] border-[#2a2a2a] text-white h-12 text-base rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="price-per-cc" className="text-gray-300 text-sm mb-2 block">
                    Price per Credit (USDC)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="price-per-cc"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={pricePerCC}
                      onChange={(e) => setPricePerCC(e.target.value)}
                      placeholder="e.g., 15.50"
                      className="bg-[#121212] border-[#2a2a2a] text-white pl-12 h-12 text-base rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Total Preview */}
              {amount && pricePerCC && totalRevenue > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Amount:</span>
                      <span className="text-white font-semibold">{amount} CC</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Price per CC:</span>
                      <span className="text-white font-semibold">${pricePerCC}</span>
                    </div>
                    <div className="pt-3 border-t border-amber-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium text-white">Total Revenue:</span>
                        <span className="text-2xl font-bold text-amber-400">
                          ${totalRevenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={handleSell}
                disabled={isLoading || !amount || !pricePerCC || parseFloat(amount) <= 0}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold h-14 text-base rounded-xl shadow-lg shadow-amber-500/20"
              >
                {isLoading ? 'Listing...' : 'List Credits on Marketplace'}
              </Button>
            </Card>
          </div>
        </>
      )}
    </>
  );
}