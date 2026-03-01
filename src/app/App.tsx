import { useState } from 'react';
import { Leaf } from 'lucide-react';
import { useBlockchainStore } from './store/blockchain-store';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import { MobileDashboard } from './components/MobileDashboard';
import { MobileMarketplace } from './components/MobileMarketplace';
import { Portfolio } from './components/Portfolio';
import { MobileHistory } from './components/MobileHistory';
import { FloatingSellButton } from './components/FloatingSellButton';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MobileDashboard />;
      case 'marketplace':
        return <MobileMarketplace />;
      case 'portfolio':
        return <Portfolio />;
      case 'history':
        return <MobileHistory />;
      default:
        return <MobileDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] max-w-md mx-auto relative">
      <MobileHeader />
      
      <main className="min-h-[calc(100vh-140px)]">
        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <FloatingSellButton />

      <Toaster 
        position="top-center" 
        theme="dark"
        toastOptions={{
          className: 'max-w-sm',
        }}
      />
    </div>
  );
}
