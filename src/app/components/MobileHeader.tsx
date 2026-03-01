import { Leaf, User, Menu } from 'lucide-react';
import { useBlockchainStore } from '../store/blockchain-store';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { format } from 'date-fns';

export function MobileHeader() {
  const { usdcBalance, carbonCredits, userProfile } = useBlockchainStore();

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-b from-[#1a1a1a] to-[#121212] border-b border-[#2a2a2a] px-4 py-3 backdrop-blur-lg">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">SolCarbon</h1>
            <p className="text-[10px] text-gray-400">Carbon Exchange</p>
          </div>
        </div>

        {/* Balance Pills */}
        <div className="flex items-center gap-2">
          <div className="bg-[#121212] px-3 py-1.5 rounded-full border border-emerald-500/30">
            <p className="text-[10px] text-gray-400 mb-0.5">Credits</p>
            <p className="font-bold text-xs text-emerald-400">{carbonCredits} CC</p>
          </div>
          <div className="bg-[#121212] px-3 py-1.5 rounded-full border border-blue-500/30">
            <p className="text-[10px] text-gray-400 mb-0.5">Balance</p>
            <p className="font-bold text-xs text-blue-400">${usdcBalance.toLocaleString()}</p>
          </div>

          {/* Profile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="ml-1">
                <Avatar className="w-9 h-9 border-2 border-emerald-500/30">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm">
                    {userProfile.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#1a1a1a] border-l border-[#2a2a2a] text-white w-80">
              <div className="py-4">
                <div className="flex items-center gap-3 mb-6">
                  <Avatar className="w-16 h-16 border-2 border-emerald-500/30">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl">
                      {userProfile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{userProfile.name}</h3>
                    <p className="text-sm text-gray-400 capitalize">{userProfile.type}</p>
                  </div>
                </div>

                <Separator className="bg-[#2a2a2a] my-4" />

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                    <p className="text-sm font-mono text-white">{userProfile.walletAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Member Since</p>
                    <p className="text-sm text-white">{format(userProfile.joinDate, 'MMMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">USDC Balance</p>
                    <p className="text-2xl font-bold text-blue-400">${usdcBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Carbon Credits</p>
                    <p className="text-2xl font-bold text-emerald-400">{carbonCredits} CC</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
