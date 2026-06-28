/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, LayoutDashboard, Smartphone, Compass, ChevronDown } from 'lucide-react';
import LandingPage from './components/LandingPage';
import AdminPanel from './components/AdminPanel';
import ClientPWA from './components/ClientPWA';
import SuperAdminPanel from './components/SuperAdminPanel';
import { Barbearia } from './lib/db';

export default function App() {
  // Navigation states: 'landing' (SaaS site), 'admin' (private dashboard), 'pwa' (mobile booking), 'superadmin' (global admin)
  const [currentView, setCurrentView] = useState<'landing' | 'admin' | 'pwa' | 'superadmin'>('landing');
  const [activeBarbearia, setActiveBarbearia] = useState<Barbearia | null>(() => {
    try {
      const saved = localStorage.getItem('barbersflow_active_barbearia');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isNavigatorExpanded, setIsNavigatorExpanded] = useState(false);

  // Initialize and check Supabase session
  useEffect(() => {
    const initSession = async () => {
      const { supabase } = await import('./lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Prevent overwriting activeBarbearia if we are on a custom slug route
        const pathname = window.location.pathname;
        const normalizedPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
        
        if (
          normalizedPath === '' ||
          normalizedPath === 'admin' ||
          normalizedPath === 'pwa' ||
          normalizedPath === 'superadmin' ||
          normalizedPath === 'features' ||
          normalizedPath === 'bento' ||
          normalizedPath === 'pricing'
        ) {
          const { data } = await supabase
            .from('barbearias')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data) handleSetActiveBarbearia(data as Barbearia);
        }
      }
    };
    initSession();

    // Listen for auth changes
    const setupAuthListener = async () => {
      const { supabase } = await import('./lib/supabase');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!session) {
          if (event === 'SIGNED_OUT') {
            handleSetActiveBarbearia(null);
          }
        } else {
          // Prevent overwriting if we are on a custom slug route
          const pathname = window.location.pathname;
          const normalizedPath = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
          
          if (
            normalizedPath === '' ||
            normalizedPath === 'admin' ||
            normalizedPath === 'pwa' ||
            normalizedPath === 'superadmin' ||
            normalizedPath === 'features' ||
            normalizedPath === 'bento' ||
            normalizedPath === 'pricing'
          ) {
            // If we have a session but no activeBarbearia, try to fetch it
            const { data } = await supabase
              .from('barbearias')
              .select('*')
              .eq('id', session.user.id)
              .single();
            if (data) handleSetActiveBarbearia(data as Barbearia);
          }
        }
      });
      return subscription;
    };

    const authSubPromise = setupAuthListener();
    
    return () => {
      authSubPromise.then(sub => sub.unsubscribe());
    };
  }, []);

  const handleSetActiveBarbearia = (barbearia: Barbearia | null, persist: boolean = true) => {
    setActiveBarbearia(barbearia);
    if (persist) {
      if (barbearia) {
        localStorage.setItem('barbersflow_active_barbearia', JSON.stringify(barbearia));
      } else {
        localStorage.removeItem('barbersflow_active_barbearia');
      }
    }
  };

  // Handle URL path/hash or direct parameter simulation on first mount if any
  useEffect(() => {
    const handleNavigation = async () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;

      if (pathname === '/superadmin' || hash === '#superadmin') {
        setCurrentView('superadmin');
        return;
      }

      if (pathname === '/admin' || hash === '#admin') {
        setCurrentView('admin');
        return;
      }

      if (pathname === '/pwa' || hash === '#pwa') {
        setCurrentView('pwa');
        return;
      }

      const normalizedSlug = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

      // Check if it's a slug routing (e.g. /barbearia-do-joao)
      if (
        normalizedSlug.length > 0 && 
        normalizedSlug !== 'admin' && 
        normalizedSlug !== 'pwa' && 
        normalizedSlug !== 'superadmin' &&
        normalizedSlug !== 'features' &&
        normalizedSlug !== 'bento' &&
        normalizedSlug !== 'pricing'
      ) {
        // 1. Fast fallback: check memory or localStorage
        const saved = localStorage.getItem('barbersflow_active_barbearia');
        let localBarbearia: Barbearia | null = null;
        if (saved) {
          try {
            localBarbearia = JSON.parse(saved);
          } catch {}
        }

        if (localBarbearia && localBarbearia.slug && localBarbearia.slug.toLowerCase() === normalizedSlug) {
          handleSetActiveBarbearia(localBarbearia, false);
          setCurrentView('pwa');
          return;
        }

        if (activeBarbearia && activeBarbearia.slug && activeBarbearia.slug.toLowerCase() === normalizedSlug) {
          setCurrentView('pwa');
          return;
        }

        if (normalizedSlug === 'barbersflow-demo') {
          const { mockBarbearia } = await import('./lib/db');
          handleSetActiveBarbearia(mockBarbearia, false);
          setCurrentView('pwa');
          return;
        }

        // 2. Query Supabase
        try {
          const { supabase } = await import('./lib/supabase');
          const { data, error } = await supabase
            .from('barbearias')
            .select('*')
            .eq('slug', normalizedSlug)
            .single();

          if (data && !error) {
            handleSetActiveBarbearia(data as Barbearia, false);
            setCurrentView('pwa');
          } else {
            // Check listing as fallback
            const { getAllBarbearias } = await import('./lib/db');
            const all = await getAllBarbearias();
            const matched = all.find(b => b.slug && b.slug.toLowerCase() === normalizedSlug);
            if (matched) {
              handleSetActiveBarbearia(matched, false);
              setCurrentView('pwa');
            } else {
              setCurrentView('landing');
            }
          }
        } catch (err) {
          // Fallback listing check on network/parsing failure
          try {
            const { getAllBarbearias } = await import('./lib/db');
            const all = await getAllBarbearias();
            const matched = all.find(b => b.slug && b.slug.toLowerCase() === normalizedSlug);
            if (matched) {
              handleSetActiveBarbearia(matched, false);
              setCurrentView('pwa');
            } else {
              setCurrentView('landing');
            }
          } catch {
            setCurrentView('landing');
          }
        }
        return;
      }

      setCurrentView('landing');
    };
    
    handleNavigation();
    
    const onPopState = () => {
      handleNavigation();
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onPopState);
    };
  }, []);

  const handleNavigate = (view: 'landing' | 'admin' | 'pwa' | 'superadmin') => {
    setCurrentView(view);
    const path = view === 'landing' ? '/' : `/${view}`;
    window.history.pushState({}, '', path);
    setIsNavigatorExpanded(false); // Collapses the navigator whenever we change page/view
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col justify-between relative selection:bg-amber-500 selection:text-black">
      
      {/* Dynamic Screen Transition and Rendering */}
      <div className="flex-1 w-full h-full relative">
        <AnimatePresence mode="wait">
          {currentView === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full"
            >
              <LandingPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full"
            >
              <AdminPanel 
                onNavigate={handleNavigate} 
                activeBarbearia={activeBarbearia} 
                onSetActiveBarbearia={handleSetActiveBarbearia} 
              />
            </motion.div>
          )}

          {currentView === 'pwa' && (
            <motion.div
              key="pwa"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'circOut' }}
              className="w-full h-full"
            >
              <ClientPWA 
                onNavigate={handleNavigate} 
                activeBarbearia={activeBarbearia}
                onSetActiveBarbearia={handleSetActiveBarbearia}
                isStandalone={
                  window.location.pathname.length > 1 && 
                  window.location.pathname !== '/superadmin' && 
                  window.location.pathname !== '/admin' && 
                  window.location.pathname !== '/pwa'
                }
              />
            </motion.div>
          )}

          {currentView === 'superadmin' && (
            <motion.div
              key="superadmin"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full bg-white h-full min-h-[100dvh]"
            >
              <SuperAdminPanel onBack={() => {
                window.history.pushState({}, '', '/');
                handleNavigate('landing');
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FLOATING DEVELOPER NAVIGATOR (Sleek Social-Media Style Dock) */}
      {(() => {
        const isStandalonePWA = 
          window.location.pathname.length > 1 && 
          window.location.pathname !== '/superadmin' && 
          window.location.pathname !== '/admin' && 
          window.location.pathname !== '/pwa';
        if (currentView === 'pwa' && isStandalonePWA) return null;

        const showExpanded = isNavigatorExpanded;

        return (
          <motion.div 
            layout
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 p-2 rounded-full bg-[#131317]/95 border border-white/10 backdrop-blur-md shadow-[0_15px_35px_-5px_rgba(0,0,0,0.8)] flex items-center gap-2.5 select-none"
          >
            {!showExpanded ? (
              <button
                onClick={() => setIsNavigatorExpanded(true)}
                className="p-2.5 rounded-full text-amber-500 hover:text-amber-400 hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center relative group active:scale-90"
                title="Navegar Telas"
              >
                <Compass className="w-5 h-5 animate-pulse" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1 text-[10px] font-bold text-gray-200 bg-[#16161c] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md font-mono">
                  Navegar Telas
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleNavigate('landing')}
                  className={`p-2.5 rounded-full transition-all cursor-pointer relative group ${
                    currentView === 'landing' 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-110' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Globe className="w-5 h-5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1 text-[10px] font-bold text-gray-200 bg-[#16161c] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md font-mono">
                    Landing Page
                  </span>
                </button>
                
                <button
                  onClick={() => handleNavigate('admin')}
                  className={`p-2.5 rounded-full transition-all cursor-pointer relative group ${
                    currentView === 'admin' 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-110' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1 text-[10px] font-bold text-gray-200 bg-[#16161c] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md font-mono">
                    Painel Admin
                  </span>
                </button>
                
                <button
                  onClick={() => handleNavigate('pwa')}
                  className={`p-2.5 rounded-full transition-all cursor-pointer relative group ${
                    currentView === 'pwa' 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-110' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1 text-[10px] font-bold text-gray-200 bg-[#16161c] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md font-mono">
                    App Cliente (PWA)
                  </span>
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />
                <button
                  onClick={() => setIsNavigatorExpanded(false)}
                  className="p-2.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer relative group"
                  title="Recolher"
                >
                  <ChevronDown className="w-5 h-5" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1 text-[10px] font-bold text-gray-200 bg-[#16161c] border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md font-mono">
                    Recolher
                  </span>
                </button>
              </>
            )}
          </motion.div>
        );
      })()}

    </div>
  );
}
