'use client';
import { Home, FileText, Users, BarChart, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as string || 'student').toLowerCase();
  const isStudent = role === 'student';

  const teacherLinks = [
    { icon: Home, label: 'Dashboard', href: '/teacher/dashboard' },
    { icon: FileText, label: 'Exams', href: '/teacher/exams' },
    { icon: Users, label: 'Students', href: '/teacher/students' },
    { icon: BarChart, label: 'Results', href: '/teacher/results' },
    { icon: Settings, label: 'Settings', href: '/teacher/settings' },
  ];

  const studentLinks = [
    { icon: Home, label: 'Dashboard', href: '/student/dashboard' },
    { icon: FileText, label: 'My Exams', href: '/student/exams' },
    { icon: BarChart, label: 'My Gallery', href: '/student/gallery' }, // Placeholder for future
    { icon: Settings, label: 'Settings', href: '/student/settings' },
  ];

  const navLinks = isStudent ? studentLinks : teacherLinks;

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
        fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-100 flex flex-col z-50
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-100">
                S
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">SmartAssess</span>
            </div>
            <button 
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-100'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                  }`}
                >
                  <link.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                  <span className="text-sm font-bold tracking-tight">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Support Section */}
        <div className="px-8 mb-6 mt-4">
           <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Platform Status</p>
              <div className="flex items-center gap-2 px-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[11px] font-bold text-slate-600">All systems operational</span>
              </div>
           </div>
        </div>

        {/* User Profile Section - STITCH Style */}
        <div className="mt-auto p-6 border-t border-slate-50">
          <div className="flex items-center gap-3 px-2 py-2">
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-10 h-10 rounded-xl shadow-md border border-slate-100",
                }
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-black text-slate-900 truncate tracking-tight">
                {user?.fullName || 'Teacher'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {user?.publicMetadata?.role?.toString() || 'Instructor'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
