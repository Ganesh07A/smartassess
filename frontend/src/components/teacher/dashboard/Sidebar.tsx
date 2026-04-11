'use client';
import { Home, FileText, Users, BarChart2, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    { icon: Home, label: 'Dashboard', href: '/teacher/dashboard' },
    { icon: FileText, label: 'Exams', href: '/teacher/exams' },
    { icon: Users, label: 'Students', href: '/teacher/students' },
    { icon: BarChart2, label: 'Results', href: '/teacher/results' },
    { icon: Settings, label: 'Settings', href: '/teacher/settings' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-[#f8f9fc] border-r border-gray-200 flex flex-col z-50
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                S
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">SmartAssess</span>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'text-gray-600 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-900 line-clamp-1">Platform Status</span>
              <span className="text-[10px] text-gray-500">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
