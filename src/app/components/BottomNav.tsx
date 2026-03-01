import { LayoutDashboard, Store, History, Award } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'marketplace', label: 'Market', icon: Store },
    { id: 'portfolio', label: 'Portfolio', icon: Award },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#2a2a2a] px-2 py-2 backdrop-blur-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all ${
                isActive 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'text-gray-400 active:bg-[#2a2a2a]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
