import { Search, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-24 bg-white/40 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between px-8 sm:px-12 sticky top-0 z-30 w-full lg:w-[calc(100%-16rem)] lg:ml-64 transition-all duration-500">
      <div className="flex items-center gap-6 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all active:scale-95"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="relative w-full max-w-xl group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600 text-slate-400">
            <Search className="w-5 h-5 transition-transform group-focus-within:scale-110" />
          </div>
          <input
            type="text"
            placeholder="Search for assessments, students, or reports..."
            className="w-full bg-slate-50/50 border-2 border-transparent focus:border-blue-50 focus:bg-white rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-bold focus:ring-4 focus:ring-blue-50/50 transition-all outline-none"
          />
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-8 pl-8">
        <button className="relative p-3.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group">
          <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-rose-500 border-[2.5px] border-white rounded-full" />
        </button>
      </div>
    </header>
  );
}

