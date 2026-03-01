import { Award, Leaf, Calendar, ExternalLink, ImageIcon } from 'lucide-react';
import { Card } from './ui/card';
import { useBlockchainStore } from '../store/blockchain-store';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useState } from 'react';
import { NFTCertificate } from '../store/blockchain-store';

export function Portfolio() {
  const { nftCertificates, carbonCredits, complianceTarget } = useBlockchainStore();
  const [selectedNFT, setSelectedNFT] = useState<NFTCertificate | null>(null);

  const compliance = ((carbonCredits / complianceTarget) * 100).toFixed(1);

  return (
    <div className="space-y-4 pb-24 px-4 pt-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-1">My Portfolio</h2>
        <p className="text-sm text-gray-400">Your carbon credit NFT certificates</p>
      </div>

      {/* Portfolio Summary */}
      <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Holdings</p>
            <p className="text-3xl font-bold text-emerald-400">{carbonCredits} CC</p>
          </div>
          <div className="bg-emerald-500/20 p-3 rounded-full">
            <Award className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-300">Compliance Rate</span>
          <span className="font-bold text-white">{compliance}%</span>
        </div>
      </Card>

      {/* NFT Certificates */}
      {nftCertificates.length === 0 ? (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-12 text-center">
          <div className="bg-[#2a2a2a] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-gray-400 mb-2">No NFT Certificates Yet</p>
          <p className="text-xs text-gray-500">Purchase carbon credits to mint your first NFT certificate</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {nftCertificates.map((nft, index) => (
            <Card
              key={nft.id}
              className="bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden active:scale-[0.98] transition-transform"
              onClick={() => setSelectedNFT(nft)}
            >
              <div className="flex gap-4 p-4">
                {/* NFT Image */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                  <img 
                    src={nft.image} 
                    alt={nft.projectName}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Leaf className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* NFT Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm mb-1 truncate">{nft.projectName}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <Calendar className="w-3 h-3" />
                    Minted {format(new Date(nft.mintDate), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Amount</p>
                      <p className="text-lg font-bold text-emerald-400">{nft.amount} CC</p>
                    </div>
                    <button className="text-emerald-400 hover:text-emerald-300 p-2 hover:bg-emerald-500/10 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* NFT Detail Sheet */}
      <Sheet open={!!selectedNFT} onOpenChange={(open) => !open && setSelectedNFT(null)}>
        <SheetContent side="bottom" className="bg-[#1a1a1a] border-t-2 border-emerald-500/30 text-white h-[75vh] rounded-t-3xl">
          {selectedNFT && (
            <div className="flex flex-col h-full">
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  NFT Certificate
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto space-y-4">
                {/* NFT Display */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/30 aspect-square">
                  <img 
                    src={selectedNFT.image} 
                    alt={selectedNFT.projectName}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
                  
                  {/* NFT Badge */}
                  <div className="absolute top-4 left-4 bg-emerald-500 px-3 py-1.5 rounded-full">
                    <p className="text-xs font-semibold text-white flex items-center gap-1">
                      <Leaf className="w-3 h-3" />
                      Carbon Credit NFT
                    </p>
                  </div>

                  {/* NFT Info */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2">{selectedNFT.projectName}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-300">Credits</p>
                        <p className="text-3xl font-bold text-emerald-400">{selectedNFT.amount} CC</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Details */}
                <Card className="bg-[#121212] border-[#2a2a2a] p-4">
                  <h4 className="font-semibold text-white mb-3 text-sm">Certificate Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Token ID</span>
                      <span className="text-xs font-mono text-emerald-400">{selectedNFT.tokenId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Mint Date</span>
                      <span className="text-xs text-white">{format(new Date(selectedNFT.mintDate), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Amount</span>
                      <span className="text-xs font-bold text-white">{selectedNFT.amount} Carbon Credits</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Project</span>
                      <span className="text-xs text-white">{selectedNFT.projectName}</span>
                    </div>
                  </div>
                </Card>

                {/* Blockchain Info */}
                <Card className="bg-[#121212] border-[#2a2a2a] p-4">
                  <h4 className="font-semibold text-white mb-3 text-sm">Blockchain Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Network</span>
                      <span className="text-xs text-white">Solana Mainnet</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Standard</span>
                      <span className="text-xs text-white">SPL Token</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Status</span>
                      <span className="text-xs text-emerald-400 font-semibold">Active</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* View on Explorer Button */}
              <div className="pt-4 border-t border-[#2a2a2a]">
                <button className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white font-semibold h-12 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  View on Solana Explorer
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}