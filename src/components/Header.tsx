import React from 'react';
import {
  Calculator,
  FileText,
  BookmarkCheck,
  Settings,
  Zap,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, quickMode, setQuickMode, budgets } = useApp();

  const navItems = [
    {
      id: 'calculadora',
      label: 'Calculadora',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'orcamentos',
      label: 'Orçamentos',
      icon: FileText,
      badge: budgets.length > 0 ? budgets.length : null,
    },
    {
      id: 'presets',
      label: 'Presets',
      icon: BookmarkCheck,
      badge: null,
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      badge: null,
    },
  ] as const;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('calculadora')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
              id="brand-logo-btn"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-neutral-900">
                    Precifica<span className="text-indigo-600">Artes</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium hidden sm:block">
                  Precificação inteligente para designers
                </p>
              </div>
            </button>
          </div>

          {/* Quick Mode Toggle (Calculadora only) */}
          {activeTab === 'calculadora' && (
            <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
              <button
                type="button"
                onClick={() => setQuickMode(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  !quickMode
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                id="btn-mode-full"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Modo Completo</span>
                <span className="md:hidden">Completo</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickMode(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  quickMode
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                id="btn-mode-quick"
              >
                <Zap className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Precificação Rápida</span>
                <span className="md:hidden">Rápido</span>
              </button>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-tab-${item.id}`}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`ml-1 text-xs px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-neutral-700 text-neutral-100'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-neutral-200 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-4 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                id={`mobile-nav-tab-${item.id}`}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 font-bold bg-indigo-50/70'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== null && (
                    <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
