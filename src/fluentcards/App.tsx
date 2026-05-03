import { Routes, Route, HashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { DeckDetail } from './views/DeckDetail';
import { StudyMode } from './views/StudyMode';
import { Marketplace } from './views/Marketplace';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <ThemeProvider>
      <div className="h-[100dvh] w-full bg-cream dark:bg-sumi-800 text-ink-700 dark:text-sumi-100 font-sans overflow-hidden relative overscroll-none flex flex-col transition-colors duration-200">
        {/* Decorative ambient background elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-cinnabar-100/30 dark:bg-cinnabar-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-2xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 right-10 w-40 h-40 bg-gold-100/20 dark:bg-gold-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-2xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-40 h-40 bg-slateblue-100/20 dark:bg-slateblue-900/20 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-2xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>

        <Toaster position="top-center" richColors />
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="deck/:id" element={<DeckDetail />} />
                <Route path="discover" element={<Marketplace />} />
              </Route>
              <Route path="/study/:id" element={
                <div className="flex flex-col w-full h-[100dvh] max-w-md mx-auto relative z-10 bg-white dark:bg-sumi-800/90 backdrop-blur-md shadow-2xl border-x border-parchment-100 dark:border-sumi-700">
                  <StudyMode />
                </div>
              } />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </div>
    </ThemeProvider>
  );
}
