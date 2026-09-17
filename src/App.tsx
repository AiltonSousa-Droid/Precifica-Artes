/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { CalculatorView } from './components/calculator/CalculatorView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { PresetsView } from './components/presets/PresetsView';
import { SettingsView } from './components/settings/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div>
        {activeTab === 'calculadora' && <CalculatorView />}
        {activeTab === 'orcamentos' && <BudgetsView />}
        {activeTab === 'presets' && <PresetsView />}
        {activeTab === 'configuracoes' && <SettingsView />}
      </div>

      {/* Clean, subtle footer */}
      <footer className="border-t border-neutral-200/80 bg-white/70 py-6 text-center text-xs text-neutral-400 mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium text-neutral-500">
            <strong>Precifica Artes</strong> — Valorize o seu design e cobre com segurança.
          </p>
          <p className="text-[11px] text-neutral-400">
            Tempo + Custos + Complexidade + Alterações + Impostos + Margem + Urgência
          </p>
        </div>
      </footer>
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-neutral-50/60 font-sans text-neutral-900 selection:bg-indigo-500 selection:text-white">
        <Header />
        <MainContent />
      </div>
    </AppProvider>
  );
}
