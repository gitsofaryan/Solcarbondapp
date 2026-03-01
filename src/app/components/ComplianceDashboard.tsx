import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';
import { useBlockchainStore } from '../store/blockchain-store';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { mockProjects } from '../data/mock-projects';

export function ComplianceDashboard() {
  const { carbonCredits, complianceTarget, autoFillDeficit, isLoading } = useBlockchainStore();
  
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
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#121212] border-[#2a2a2a] p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Compliance Dashboard</h2>
            <p className="text-gray-400">Monitor your carbon credit compliance status</p>
          </div>
          {isCompliant ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Compliant</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Action Required</span>
            </div>
          )}
        </div>

        {/* Carbon Gauge */}
        <div className="mb-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-sm text-gray-400 mb-1">Carbon Credits</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">{carbonCredits}</span>
                <span className="text-xl text-gray-500">/ {complianceTarget} CC</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Progress</p>
              <p className="text-2xl font-bold text-emerald-400">{percentage.toFixed(0)}%</p>
            </div>
          </div>
          <Progress 
            value={percentage} 
            className="h-3 bg-[#2a2a2a]"
            style={{
              // @ts-ignore
              '--progress-background': percentage >= 100 ? '#10b981' : '#f59e0b'
            }}
          />
        </div>

        {/* Deficit/Surplus Alert */}
        {!isCompliant && deficit > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-1">Carbon Credit Deficit</h3>
                <p className="text-sm text-gray-300">
                  You need <span className="font-bold text-red-400">{deficit} CC</span> more to meet your compliance target.
                  Purchase carbon credits from the marketplace to avoid penalties.
                </p>
              </div>
            </div>
          </div>
        )}

        {surplus > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-400 mb-1">Surplus Credits Available</h3>
                <p className="text-sm text-gray-300">
                  You have <span className="font-bold text-emerald-400">{surplus} CC</span> surplus.
                  List them on the marketplace to generate revenue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {!isCompliant && (
          <Button
            onClick={handleAutoFill}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-6 text-lg"
          >
            {isLoading ? 'Processing...' : `Auto-Fill Deficit (${deficit} CC)`}
          </Button>
        )}
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4">
          <p className="text-sm text-gray-400 mb-1">Current Holdings</p>
          <p className="text-2xl font-bold text-white">{carbonCredits} CC</p>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4">
          <p className="text-sm text-gray-400 mb-1">Compliance Target</p>
          <p className="text-2xl font-bold text-white">{complianceTarget} CC</p>
        </Card>
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-4">
          <p className="text-sm text-gray-400 mb-1">Status</p>
          <p className={`text-2xl font-bold ${isCompliant ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isCompliant ? surplus > 0 ? `+${surplus}` : 'Met' : `-${deficit}`}
          </p>
        </Card>
      </div>
    </div>
  );
}
