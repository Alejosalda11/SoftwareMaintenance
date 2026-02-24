// Hotel Maintenance Pro - Mobile Bottom Navigation

import { LayoutDashboard, Wrench, History, BarChart3, Calendar, Calculator } from 'lucide-react';

type Page = 'dashboard' | 'damages' | 'history' | 'reports' | 'preventive' | 'comparison';

interface MobileNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'damages', label: 'Repairs', icon: Wrench },
  { id: 'history', label: 'History', icon: History },
  { id: 'preventive', label: 'Preventive', icon: Calendar },
  { id: 'comparison', label: 'Cost comparison', icon: Calculator },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export function MobileNav({ currentPage, onPageChange }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-blue-100' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-0.5 font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
