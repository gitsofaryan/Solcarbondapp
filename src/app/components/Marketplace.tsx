import { useState } from 'react';
import { ShoppingCart, TrendingUp, MapPin, Zap } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useBlockchainStore } from '../store/blockchain-store';
import { mockProjects } from '../data/mock-projects';
import { toast } from 'sonner';
import { SellModal } from './SellModal';

export function Marketplace() {
  const { buyCredits, isLoading, carbonCredits, complianceTarget } = useBlockchainStore();
  const [purchaseAmounts, setPurchaseAmounts] = useState<Record<string, number>>({});
  const [showSellModal, setShowSellModal] = useState(false);

  const surplus = carbonCredits > complianceTarget ? carbonCredits - complianceTarget : 0;

  const handleBuy = async (projectId: string, projectName: string, pricePerCC: number) => {
    const amount = purchaseAmounts[projectId] || 0;
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      toast.loading('Connecting to Phantom Wallet...', { id: `buy-${projectId}` });
      const signature = await buyCredits(amount, pricePerCC, projectName);
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Transaction Confirmed!</p>
          <p className="text-xs text-gray-400">Purchased {amount} CC from {projectName}</p>
          <p className="text-xs text-gray-500">Sig: {signature.slice(0, 16)}...{signature.slice(-8)}</p>
        </div>,
        { id: `buy-${projectId}`, duration: 5000 }
      );
      setPurchaseAmounts(prev => ({ ...prev, [projectId]: 0 }));
    } catch (error) {
      toast.error((error as Error).message, { id: `buy-${projectId}` });
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('Solar')) return '☀️';
    if (type.includes('Wind')) return '💨';
    if (type.includes('Hydro')) return '💧';
    if (type.includes('Forest') || type.includes('Reforestation')) return '🌳';
    if (type.includes('Mangrove') || type.includes('Conservation')) return '🌿';
    return '⚡';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Carbon Credit Marketplace</h2>
          <p className="text-gray-400">Browse and purchase verified carbon projects</p>
        </div>
        {surplus > 0 && (
          <Button
            onClick={() => setShowSellModal(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            List Surplus ({surplus} CC)
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockProjects.map((project) => (
          <Card key={project.id} className="bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden hover:border-emerald-500/30 transition-all">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={project.image} 
                alt={project.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-white">
                {getTypeIcon(project.type)} {project.type}
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-lg text-white mb-1">{project.name}</h3>
              <div className="flex items-center gap-1 text-gray-400 text-sm mb-4">
                <MapPin className="w-3 h-3" />
                {project.location}
              </div>

              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#2a2a2a]">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Price per Credit</p>
                  <p className="text-xl font-bold text-emerald-400">${project.pricePerCC}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Available</p>
                  <p className="text-lg font-semibold text-white">{project.availableCC.toLocaleString()} CC</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor={`amount-${project.id}`} className="text-gray-400 text-sm">
                    Amount to Purchase
                  </Label>
                  <Input
                    id={`amount-${project.id}`}
                    type="number"
                    min="1"
                    max={project.availableCC}
                    value={purchaseAmounts[project.id] || ''}
                    onChange={(e) => setPurchaseAmounts(prev => ({
                      ...prev,
                      [project.id]: parseInt(e.target.value) || 0
                    }))}
                    placeholder="Enter CC amount"
                    className="bg-[#121212] border-[#2a2a2a] text-white"
                  />
                </div>

                {purchaseAmounts[project.id] > 0 && (
                  <div className="bg-[#121212] rounded-lg p-3 border border-[#2a2a2a]">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Total Cost:</span>
                      <span className="font-bold text-white">
                        ${(purchaseAmounts[project.id] * project.pricePerCC).toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleBuy(project.id, project.name, project.pricePerCC)}
                  disabled={isLoading || !purchaseAmounts[project.id] || purchaseAmounts[project.id] <= 0}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {isLoading ? 'Processing...' : 'Buy Carbon Credits'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SellModal open={showSellModal} onOpenChange={setShowSellModal} />
    </div>
  );
}
