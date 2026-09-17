import React from 'react';
import { Calendar, DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatBRL } from '../utils/calculations';

export const DashboardMetrics: React.FC = () => {
  const { metrics, setActiveTab } = useApp();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6" id="dashboard-metrics-container">
      {/* 1. Orçamentos este mês */}
      <div
        onClick={() => setActiveTab('orcamentos')}
        className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition cursor-pointer group"
        id="metric-card-month-count"
      >
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Orçamentos este mês
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          {metrics.totalBudgetsThisMonth}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          Criados no mês atual
        </div>
      </div>

      {/* 2. Valor total orçado */}
      <div
        onClick={() => setActiveTab('orcamentos')}
        className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition cursor-pointer group"
        id="metric-card-total-value"
      >
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Valor total orçado
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          {formatBRL(metrics.totalValueThisMonth, 0)}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          Propostas deste mês
        </div>
      </div>

      {/* 3. Projetos aprovados */}
      <div
        onClick={() => setActiveTab('orcamentos')}
        className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition cursor-pointer group"
        id="metric-card-approved-count"
      >
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Projetos aprovados
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          {metrics.approvedCount}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          Fechados com clientes
        </div>
      </div>

      {/* 4. Taxa de aprovação */}
      <div
        onClick={() => setActiveTab('orcamentos')}
        className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200/80 shadow-xs hover:border-neutral-300 transition cursor-pointer group"
        id="metric-card-conversion-rate"
      >
        <div className="flex items-center justify-between text-neutral-500 mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Taxa de aprovação
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
          {metrics.approvalRatePercent}%
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5">
          Conversão de propostas
        </div>
      </div>
    </div>
  );
};
