import { AlertTriangle, TrendingUp, CheckCircle, Zap, Target } from 'lucide-react';
import { useBlockchainStore } from '../store/blockchain-store';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { mockProjects } from '../data/mock-projects';

export function MobileDashboard() {
  const { carbonCredits, complianceTarget, autoFillDeficit, isLoading, usdcBalance } = useBlockchainStore();
  
  const deficit = complianceTarget - carbonCredits;
  const surplus = carbonCredits > complianceTarget ? carbonCredits - complianceTarget : 0;
  const percentage = (carbonCredits / complianceTarget) * 100;
  const isCompliant = carbonCredits >= complianceTarget;

  const handleAutoFill = async () => {
    try {
      toast.loading('Connecting to Phantom Wallet...', { id: 'autofill' });
      const signature = await autoFillDeficit(mockProjects);
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Transaction Confirmed!</p>
          <p className="text-xs text-gray-400">Signature: {signature.slice(0, 20)}...</p>
        </div>,
        { id: 'autofill', duration: 4000 }
      );
    } catch (error) {
      toast.error((error as Error).message, { id: 'autofill' });
    }
  };

  return (
    <div className="space-y-4 pb-24 px-4 pt-4">
      {/* Hero Card with Gauge */}
      <Card className="bg-gradient-to-br from-[#1a1a1a] via-[#121212] to-[#0a0a0a] border-[#2a2a2a] p-6 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="relative">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Compliance Status</h2>
              <p className="text-sm text-gray-400">Current Period: Q1 2026</p>
            </div>
            {isCompliant ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Compliant</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Action Needed</span>
              </div>
            )}
          </div>

          {/* Carbon Gauge */}
          <div className="mb-6">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Carbon Credits Held</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">{carbonCredits}</span>
                  <span className="text-xl text-gray-500">/ {complianceTarget}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Progress</p>
                <p className="text-3xl font-bold text-emerald-400">{percentage.toFixed(0)}%</p>
              </div>
            </div>
            <Progress 
              value={percentage} 
              className="h-4 bg-[#2a2a2a] rounded-full"
              style={{
                // @ts-ignore
                '--progress-background': percentage >= 100 ? '#10b981' : '#f59e0b'
              }}
            />
          </div>

          {/* Alert Box */}
          {!isCompliant && deficit > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-500/20 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-400 text-sm mb-1">Carbon Credit Deficit</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    You need <span className="font-bold text-red-400">{deficit} CC</span> more to meet compliance.
                    Purchase credits from the marketplace to avoid penalties.
                  </p>
                </div>
              </div>
            </div>
          )}

          {surplus > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-400 text-sm mb-1">Surplus Available</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    You have <span className="font-bold text-emerald-400">{surplus} CC</span> surplus.
                    List them on the marketplace to generate revenue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Action */}
          {!isCompliant && (
            <Button
              onClick={handleAutoFill}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl h-14 text-base shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-5 h-5 mr-2" />
              {isLoading ? 'Processing...' : `Quick Fill Deficit (${deficit} CC)`}
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4 text-center">
          <div className="bg-emerald-500/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-gray-400 mb-1">Target</p>
          <p className="text-lg font-bold text-white">{complianceTarget}</p>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4 text-center">
          <div className="bg-blue-500/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-[10px] text-gray-400 mb-1">Held</p>
          <p className="text-lg font-bold text-white">{carbonCredits}</p>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4 text-center">
          <div className={`${isCompliant ? 'bg-emerald-500/10' : 'bg-amber-500/10'} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2`}>
            <TrendingUp className={`w-5 h-5 ${isCompliant ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <p className="text-[10px] text-gray-400 mb-1">Status</p>
          <p className={`text-lg font-bold ${isCompliant ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isCompliant ? surplus > 0 ? `+${surplus}` : 'Met' : `-${deficit}`}
          </p>
        </Card>
      </div>

      {/* Market Insights */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4">
        <h3 className="font-semibold text-white mb-3 text-sm">Market Insights</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Avg. Market Price</span>
            <span className="text-sm font-semibold text-emerald-400">$15.20 / CC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Projects Available</span>
            <span className="text-sm font-semibold text-white">{mockProjects.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Total Supply</span>
            <span className="text-sm font-semibold text-white">
              {mockProjects.reduce((sum, p) => sum + p.availableCC, 0).toLocaleString()} CC
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}