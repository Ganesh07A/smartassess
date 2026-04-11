import { Search, Bell, Menu } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 sm:px-10 sticky top-0 z-30 w-full lg:w-[calc(100%-16rem)] lg:ml-64 transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative w-full max-w-md group hidden sm:block">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search exams or students..."
            className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all outline-none"
          />
        </div>
        
        {/* Mobile Search Icon Only */}
        <button className="sm:hidden p-2 text-gray-400 hover:text-blue-600 transition-colors">
          <Search className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-6">
        <button className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
        </button>

        <div className="h-10 w-[1px] bg-gray-200" />

        <div className="flex items-center gap-3">
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-10 h-10 rounded-2xl shadow-lg shadow-blue-100",
                userButtonTrigger: "focus:shadow-none hover:opacity-80 transition-all"
              }
            }} 
          />
        </div>
      </div>
    </header>
  );
}

