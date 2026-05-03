import { Routes, Route, HashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { DeckDetail } from './views/DeckDetail';
import { StudyMode } from './views/StudyMode';
import { Marketplace } from './views/Marketplace';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';

// Note: Using HashRouter because sometimes preview iframe paths 
// can be tricky with BrowserRouter on some hosts.
export default function App() {
  return (
    <ThemeProvider>
      <div className="h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans overflow-hidden relative overscroll-none flex flex-col transition-colors duration-200">
        {/* Decorative ambient background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-200 dark:bg-indigo-900/40 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-10 w-32 h-32 bg-blue-200 dark:bg-blue-900/40 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-32 h-32 bg-slate-200 dark:bg-slate-800/40 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

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
                <div className="flex flex-col w-full h-[100dvh] max-w-md mx-auto relative z-10 bg-white dark:bg-slate-900/80 backdrop-blur-md shadow-2xl border-x border-white dark:border-slate-800">
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
