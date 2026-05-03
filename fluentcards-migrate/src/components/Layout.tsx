import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, Globe, Home as HomeIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';

export function Layout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="flex-1 flex flex-col h-[100dvh] w-full max-w-md mx-auto relative z-10 bg-white dark:bg-slate-900/60 shadow-xl border-x border-white dark:border-slate-800 backdrop-blur-md transition-colors duration-200">
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900/80 backdrop-blur-md shrink-0 rounded-b-3xl shadow-sm z-20">
        <Link to="/" className="flex items-center gap-3 font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity text-slate-800 dark:text-slate-100">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_4px_10px_rgba(79,70,229,0.2)] border-2 border-white dark:border-slate-800">
            <span className="font-extrabold text-white leading-none text-xl"></span>
          </div>
          <span className="text-slate-600 dark:text-slate-300 font-bold">FluentCards</span>
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full" title="Toggle Theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          {user && (
            <>
              {location.pathname === '/' ? (
                <Link to="/discover">
                  <Button variant="ghost" size="icon" className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full" title="Discover Public Decks">
                    <Globe size={22} />
                  </Button>
                </Link>
              ) : (
                <Link to="/">
                  <Button variant="ghost" size="icon" className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full" title="My Decks">
                    <HomeIcon size={22} />
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={logout} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:text-slate-100 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full" title="Log out">
                <LogOut size={22} />
              </Button>
            </>
          )}
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto w-full relative pt-4 pb-10">
        <Outlet />
      </main>
    </div>
  );
}
