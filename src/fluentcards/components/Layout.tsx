import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Moon, Sun, LogOut, Globe, Home as HomeIcon, Search, Trophy } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';

export function Layout() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="flex-1 flex flex-col h-[100dvh] w-full max-w-md mx-auto relative z-10 bg-white dark:bg-sumi-800 shadow-xl border-x border-parchment-100 dark:border-sumi-700 backdrop-blur-md transition-colors duration-200">
      <header className="h-16 border-b border-parchment-100 dark:border-sumi-700 flex items-center justify-between px-5 bg-white/80 dark:bg-sumi-800/80 backdrop-blur-md shrink-0 shadow-sm z-20">
        <Link to="/" className="flex items-center gap-3 font-display text-xl font-bold tracking-tight hover:opacity-80 transition-opacity text-ink-800 dark:text-sumi-50">
          <div className="w-9 h-9 rounded-lg bg-cinnabar-500 flex items-center justify-center shadow-sm">
            <span className="font-extrabold text-white leading-none text-lg">FC</span>
          </div>
          <span className="text-ink-700 dark:text-sumi-100">FluentCards</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link to="/search">
            <Button variant="ghost" size="icon" className="text-ink-400 hover:text-ink-700 hover:bg-cinnabar-50 dark:text-sumi-300 dark:hover:text-sumi-50 dark:hover:bg-sumi-600 rounded-full" title="Search Cards">
              <Search size={20} />
            </Button>
          </Link>
          <Link to="/achievements">
            <Button variant="ghost" size="icon" className="text-ink-400 hover:text-ink-700 hover:bg-cinnabar-50 dark:text-sumi-300 dark:hover:text-sumi-50 dark:hover:bg-sumi-600 rounded-full" title="Achievements">
              <Trophy size={20} />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="text-ink-400 hover:text-ink-700 hover:bg-cinnabar-50 dark:text-sumi-300 dark:hover:text-sumi-50 dark:hover:bg-sumi-600 rounded-full" title="Toggle Theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          {user && (
            <>
              {location.pathname === '/' ? (
                <Link to="/discover">
                  <Button variant="ghost" size="icon" className="text-ink-400 hover:text-ink-700 hover:bg-cinnabar-50 dark:text-sumi-300 dark:hover:text-sumi-50 dark:hover:bg-sumi-600 rounded-full" title="Discover Public Decks">
                    <Globe size={22} />
                  </Button>
                </Link>
              ) : (
                <Link to="/">
                  <Button variant="ghost" size="icon" className="text-ink-400 hover:text-ink-700 hover:bg-cinnabar-50 dark:text-sumi-300 dark:hover:text-sumi-50 dark:hover:bg-sumi-600 rounded-full" title="My Decks">
                    <HomeIcon size={22} />
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={logout} className="text-ink-400 hover:text-ink-700 hover:bg-cinnabar-50 dark:text-sumi-300 dark:hover:text-sumi-50 dark:hover:bg-sumi-600 rounded-full" title="Log out">
                <LogOut size={22} />
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full relative bg-cream dark:bg-sumi-800">
        <Outlet />
      </main>
    </div>
  );
}
