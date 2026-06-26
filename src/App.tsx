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
import { seedDefaultData, Barbearia } from './lib/db';

export default function App() {
  // Navigation states: 'landing' (SaaS site), 'admin' (private dashboard), 'pwa' (mobile booking)
  const [currentView, setCurrentView] = useState<'landing' | 'admin' | 'pwa'>('landing');
  const [activeBarbearia, setActiveBarbearia] = useState<Barbearia | null>(null);
  const [isNavigatorExpanded, setIsNavigatorExpanded] = useState(false);

  // Initialize and seed default data
  useEffect(() => {
    const initDb = async () => {
      try {
        const stored = localStorage.getItem('barbersflow_active_barbearia');
        if (stored) {
          setActiveBarbearia(JSON.parse(stored));
        } else {
          // Seed & set default
          const defaultBarbearia = await seedDefaultData();
          setActiveBarbearia(defaultBarbearia);
          localStorage.setItem('barbersflow_active_barbearia', JSON.stringify(defaultBarbearia));
        }
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }
    };
    initDb();
  }, []);

  const handleSetActiveBarbearia = (barbearia: Barbearia | null) => {
    setActiveBarbearia(barbearia);
    if (barbearia) {
      localStorage.setItem('barbersflow_active_barbearia', JSON.stringify(barbearia));
    } else {
      localStorage.removeItem('barbersflow_active_barbearia');
    }
  };

  // Handle URL hash or direct parameter simulation on first mount if any
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin') setCurrentView('admin');
      if (hash === '#pwa') setCurrentView('pwa');
      if (hash === '#landing') setCurrentView('landing');
    };
    
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavigate = (view: 'landing' | 'admin' | 'pwa') => {
    setCurrentView(view);
    window.location.hash = view;
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
              className="w-full"
            >
              <ClientPWA 
                onNavigate={handleNavigate} 
                activeBarbearia={activeBarbearia}
                onSetActiveBarbearia={handleSetActiveBarbearia}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FLOATING DEVELOPER NAVIGATOR (Sleek Social-Media Style Dock) */}
      {(() => {
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
