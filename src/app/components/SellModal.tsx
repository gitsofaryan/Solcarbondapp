import { useState } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useBlockchainStore } from '../store/blockchain-store';
import { toast } from 'sonner';

interface SellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SellModal({ open, onOpenChange }: SellModalProps) {
  const { sellCredits, carbonCredits, complianceTarget, isLoading } = useBlockchainStore();
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
          <p className="font-semibold">Credits Listed Successfully!</p>
          <p className="text-xs text-gray-400">Listed {sellAmount} CC at ${price} per credit</p>
          <p className="text-xs text-gray-500">Sig: {signature.slice(0, 16)}...{signature.slice(-8)}</p>
        </div>,
        { id: 'sell', duration: 5000 }
      );
      setAmount('');
      setPricePerCC('');
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message, { id: 'sell' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Sell Carbon Credits
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            List your surplus carbon credits on the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Available Surplus:</span>
              <span className="text-lg font-bold text-emerald-400">{surplus} CC</span>
            </div>
          </div>

          <div>
            <Label htmlFor="sell-amount" className="text-gray-300">
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
              className="bg-[#121212] border-[#2a2a2a] text-white mt-2"
            />
          </div>

          <div>
            <Label htmlFor="price-per-cc" className="text-gray-300">
              Price per Credit (USDC)
            </Label>
            <div className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="price-per-cc"
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerCC}
                onChange={(e) => setPricePerCC(e.target.value)}
                placeholder="e.g., 15.50"
                className="bg-[#121212] border-[#2a2a2a] text-white pl-9"
              />
            </div>
          </div>

          {amount && pricePerCC && totalRevenue > 0 && (
            <div className="bg-[#121212] rounded-lg p-4 border border-[#2a2a2a]">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">{amount} CC</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Price per CC:</span>
                  <span className="text-white">${pricePerCC}</span>
                </div>
                <div className="pt-2 border-t border-[#2a2a2a]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium">Total Revenue:</span>
                    <span className="text-xl font-bold text-emerald-400">
                      ${totalRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSell}
            disabled={isLoading || !amount || !pricePerCC || parseFloat(amount) <= 0}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold"
          >
            {isLoading ? 'Listing...' : 'List Credits on Marketplace'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
