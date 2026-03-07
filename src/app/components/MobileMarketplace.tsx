import { useState } from 'react';
import { ShoppingCart, MapPin, Star, Info, Shield } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { useBlockchainStore } from '../store/blockchain-store';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

export function MobileMarketplace() {
  const { buyCredits, isBuying, projects } = useBlockchainStore();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState<number>(0);

  const project = projects.find(p => p.id === selectedProject);

  // Reset amount whenever a different project is opened
  const openProject = (id: string) => {
    if (id !== selectedProject) setPurchaseAmount(0);
    setSelectedProject(id);
  };

  const closeSheet = () => {
    setSelectedProject(null);
    setPurchaseAmount(0);
  };

  const handleBuy = async () => {
    if (!project || purchaseAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (purchaseAmount > project.availableCC) {
      toast.error(`Only ${project.availableCC} CC available for this project`);
      return;
    }

    try {
      toast.loading('Connecting to Phantom Wallet...', { id: 'buy' });
      const signature = await buyCredits(purchaseAmount, project.pricePerCC, project.name, project.id, project.image);
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Purchase Successful!</p>
          <p className="text-xs text-gray-400">Acquired {purchaseAmount} CC from {project.name}</p>
          <p className="text-xs text-gray-500 font-mono">Sig: {signature.slice(0, 12)}...</p>
        </div>,
        { id: 'buy', duration: 5000 }
      );
      closeSheet();
    } catch (error) {
      toast.error((error as Error).message, { id: 'buy' });
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
    <div className="space-y-4 pb-24 px-4 pt-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">Carbon Marketplace</h2>
        <p className="text-sm text-gray-400">Browse verified carbon projects</p>
      </div>

      {/* Project Cards */}
      <div className="space-y-3">
        {projects.map((proj) => (
          <Card
            key={proj.id}
            className={`bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden transition-transform ${proj.availableCC > 0 ? 'active:scale-[0.98]' : 'opacity-60'
              }`}
            onClick={() => proj.availableCC > 0 && openProject(proj.id)}
          >
            {/* Image */}
            <div className="relative h-40">
              <img
                src={proj.image}
                alt={proj.name}
                className="w-full h-full object-cover"
              />
              {/* Overlays */}
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
                {getTypeIcon(proj.type)} {proj.type}
              </div>
              {proj.verified && (
                <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verified
                </div>
              )}
              {proj.availableCC === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-red-500/80 text-white text-sm font-bold px-4 py-2 rounded-full">Sold Out</span>
                </div>
              )}
              {/* Price Badge */}
              <div className="absolute bottom-2 left-2 bg-emerald-500 px-3 py-1.5 rounded-full">
                <p className="text-xs text-white/80">Price</p>
                <p className="text-lg font-bold text-white">${proj.pricePerCC}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-base text-white mb-1">{proj.name}</h3>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
                    <MapPin className="w-3 h-3" />
                    {proj.location}
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-full">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">{proj.rating}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                <div>
                  <p className="text-[10px] text-gray-400">Available</p>
                  <p className="text-sm font-bold text-white">{proj.availableCC.toLocaleString()} CC</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Total Supply</p>
                  <p className="text-sm font-bold text-white">{proj.totalSupply.toLocaleString()} CC</p>
                </div>
                <Button
                  size="sm"
                  className={`${proj.availableCC > 0
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    } rounded-full h-9 px-4`}
                  disabled={proj.availableCC === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (proj.availableCC > 0) openProject(proj.id);
                  }}
                >
                  {proj.availableCC > 0 ? 'Buy Now' : 'Sold Out'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Purchase Sheet */}
      <Sheet open={!!selectedProject} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent side="bottom" className="bg-[#1a1a1a] border-t-2 border-emerald-500/30 text-white h-[85vh] rounded-t-3xl">
          {project && (
            <div className="flex flex-col h-full">
              <SheetHeader className="text-left mb-4">
                <div className="relative h-48 -mx-6 -mt-6 mb-4 rounded-t-3xl overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
                        {getTypeIcon(project.type)} {project.type}
                      </div>
                      {project.verified && (
                        <div className="bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <SheetTitle className="text-2xl font-bold text-white">{project.name}</SheetTitle>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {/* Location & Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-amber-400">{project.rating}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    About this Project
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed">{project.description}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-[#121212] border-[#2a2a2a] p-3">
                    <p className="text-xs text-gray-400 mb-1">Price per Credit</p>
                    <p className="text-2xl font-bold text-emerald-400">${project.pricePerCC}</p>
                  </Card>
                  <Card className="bg-[#121212] border-[#2a2a2a] p-3">
                    <p className="text-xs text-gray-400 mb-1">Available</p>
                    <p className="text-2xl font-bold text-white">{project.availableCC.toLocaleString()}</p>
                  </Card>
                </div>

                {/* Purchase Amount */}
                <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl p-4">
                  <label className="text-sm font-medium text-gray-300 mb-3 block">
                    Amount to Purchase
                  </label>
                  <div className="flex items-center gap-3 mb-4">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a] flex-1 h-12 text-xl font-bold rounded-xl"
                      onClick={() => setPurchaseAmount(Math.max(0, purchaseAmount - 10))}
                    >
                      -
                    </Button>
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        min="0"
                        max={project.availableCC}
                        value={purchaseAmount || ''}
                        onChange={(e) => setPurchaseAmount(parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-3xl font-bold text-center text-white outline-none"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-400 mt-1">Carbon Credits</p>
                    </div>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a] flex-1 h-12 text-xl font-bold rounded-xl"
                      onClick={() => setPurchaseAmount(Math.min(project.availableCC, purchaseAmount + 10))}
                    >
                      +
                    </Button>
                  </div>

                  {/* Quick Select */}
                  <div className="flex gap-2">
                    {[10, 25, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        size="sm"
                        variant="outline"
                        disabled={amount > project.availableCC}
                        className={`flex-1 rounded-lg ${amount > project.availableCC
                          ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-600 cursor-not-allowed'
                          : 'bg-[#1a1a1a] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                        onClick={() => setPurchaseAmount(Math.min(amount, project.availableCC))}
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Total Cost */}
                {purchaseAmount > 0 && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Credits:</span>
                      <span className="text-sm font-semibold text-white">{purchaseAmount} CC</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-300">Price per CC:</span>
                      <span className="text-sm font-semibold text-white">${project.pricePerCC}</span>
                    </div>
                    <div className="pt-3 border-t border-emerald-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium text-white">Total Cost:</span>
                        <span className="text-2xl font-bold text-emerald-400">
                          ${(purchaseAmount * project.pricePerCC).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed Bottom Button */}
              <div className="pt-4 border-t border-[#2a2a2a]">
                <Button
                  onClick={handleBuy}
                  disabled={isBuying || purchaseAmount <= 0}
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold h-14 text-base rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {isBuying ? 'Processing Transaction...' : 'Buy Carbon Credits'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}