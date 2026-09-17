import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  FileText,
  Copy,
  Check,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
  Send,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { BudgetRecord, BudgetStatus } from '../../types';
import { formatBRL } from '../../utils/calculations';
import { generateWhatsAppLink } from '../../utils/proposalGenerator';
import { BudgetFinancialAnalytics } from './BudgetFinancialAnalytics';

const STATUS_CONFIG: Record<
  BudgetStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  rascunho: {
    label: 'Rascunho',
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    dot: 'bg-neutral-400',
  },
  enviado: {
    label: 'Enviado',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  aprovado: {
    label: 'Aprovado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  producao: {
    label: 'Em produção',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
  },
  entregue: {
    label: 'Entregue',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
  },
  perdido: {
    label: 'Perdido',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

const ART_TYPE_LABELS: Record<string, string> = {
  feed_simples: 'Feed simples',
  feed_elaborado: 'Feed elaborado',
  story: 'Story',
  carrossel: 'Carrossel',
  capa: 'Capa',
  thumbnail: 'Thumbnail',
  outro: 'Outro',
};

export const BudgetsView: React.FC = () => {
  const {
    budgets,
    deleteBudget,
    duplicateBudget,
    updateBudget,
    updateBudgetItemProgress,
    updateBudgetItemStatus,
    loadBudgetToCalculator,
    setActiveTab,
    settings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [periodFilter, setPeriodFilter] = useState<'todos' | 'mes' | '30dias'>('todos');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'highest' | 'lowest'>('recent');

  // Selected budget for viewing modal
  const [viewingBudget, setViewingBudget] = useState<BudgetRecord | null>(null);
  const [modalTab, setModalTab] = useState<'proposta' | 'entrega'>('proposta');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter and sort
  const filteredBudgets = useMemo(() => {
    return budgets
      .filter((b) => {
        // Search term
        const matchesSearch =
          b.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.projectName.toLowerCase().includes(searchTerm.toLowerCase());

        // Status
        const matchesStatus =
          statusFilter === 'todos' || b.status === statusFilter;

        // Period
        let matchesPeriod = true;
        const now = new Date();
        const budgetDate = new Date(b.date || b.createdAt);

        if (periodFilter === 'mes') {
          matchesPeriod =
            budgetDate.getMonth() === now.getMonth() &&
            budgetDate.getFullYear() === now.getFullYear();
        } else if (periodFilter === '30dias') {
          const diffDays =
            (now.getTime() - budgetDate.getTime()) / (1000 * 3600 * 24);
          matchesPeriod = diffDays <= 30;
        }

        return matchesSearch && matchesStatus && matchesPeriod;
      })
      .sort((a, b) => {
        if (sortOrder === 'recent') {
          return (b.createdAt || 0) - (a.createdAt || 0);
        }
        if (sortOrder === 'oldest') {
          return (a.createdAt || 0) - (b.createdAt || 0);
        }
        if (sortOrder === 'highest') {
          return b.totalValue - a.totalValue;
        }
        if (sortOrder === 'lowest') {
          return a.totalValue - b.totalValue;
        }
        return 0;
      });
  }, [budgets, searchTerm, statusFilter, periodFilter, sortOrder]);

  const handleCopyProposal = async (budget: BudgetRecord) => {
    try {
      await navigator.clipboard.writeText(budget.proposalText);
      setCopiedId(budget.id);
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
      });
      setTimeout(() => setCopiedId(null), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = (budget: BudgetRecord, newStatus: BudgetStatus) => {
    updateBudget(budget.id, { status: newStatus });
    if (viewingBudget && viewingBudget.id === budget.id) {
      setViewingBudget({ ...viewingBudget, status: newStatus });
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24 md:pb-12" id="budgets-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            Meus Orçamentos
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            Gerencie propostas, acompanhe status de fechamento e recupere orçamentos salvos.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('calculadora')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
          id="btn-new-budget-from-list"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Orçamento</span>
        </button>
      </div>

      {/* Financial Performance Analytics (Recharts) */}
      <BudgetFinancialAnalytics budgets={budgets} />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por cliente ou projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50 focus:bg-white"
              id="input-search-budgets"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-neutral-800"
              id="select-status-filter"
            >
              <option value="todos">Todos os status</option>
              <option value="rascunho">Rascunhos</option>
              <option value="enviado">Enviados</option>
              <option value="aprovado">Aprovados</option>
              <option value="producao">Em produção</option>
              <option value="entregue">Entregues</option>
              <option value="perdido">Perdidos</option>
            </select>
          </div>

          {/* Period Filter */}
          <div className="sm:col-span-2">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-neutral-800"
              id="select-period-filter"
            >
              <option value="todos">Todo período</option>
              <option value="mes">Este mês</option>
              <option value="30dias">Últimos 30 dias</option>
            </select>
          </div>

          {/* Sort */}
          <div className="sm:col-span-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-neutral-800"
              id="select-sort-order"
            >
              <option value="recent">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="highest">Maior valor</option>
              <option value="lowest">Menor valor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budgets List / Grid */}
      {filteredBudgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-neutral-900 text-base mb-1">
            Nenhum orçamento encontrado
          </h3>
          <p className="text-xs text-neutral-500 mb-5 max-w-xs mx-auto">
            {searchTerm || statusFilter !== 'todos'
              ? 'Tente remover os filtros de busca para ver outros resultados.'
              : 'Calcule seu primeiro projeto na calculadora e salve para montar seu histórico profissional.'}
          </p>
          <button
            onClick={() => setActiveTab('calculadora')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            Ir para a Calculadora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBudgets.map((budget) => {
            const statusStyle = STATUS_CONFIG[budget.status] || STATUS_CONFIG.enviado;
            const hasItems = budget.items && budget.items.length > 0;
            const totalContracted = hasItems
              ? budget.items.reduce((s, it) => s + it.quantity, 0)
              : budget.quantity;
            const totalProduced = hasItems
              ? budget.items.reduce((s, it) => s + (it.producedQuantity || 0), 0)
              : 0;
            const progressPercent =
              totalContracted > 0 ? Math.round((totalProduced / totalContracted) * 100) : 0;

            return (
              <div
                key={budget.id}
                className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition flex flex-col justify-between group"
                id={`budget-card-${budget.id}`}
              >
                <div>
                  {/* Top bar: Date & Status */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(budget.date || budget.createdAt).toLocaleDateString('pt-BR')}
                    </span>

                    {/* Status Pill with Quick Dropdown */}
                    <select
                      value={budget.status}
                      onChange={(e) =>
                        handleStatusChange(budget, e.target.value as BudgetStatus)
                      }
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border-0 focus:ring-1 focus:ring-indigo-500 cursor-pointer ${statusStyle.bg} ${statusStyle.text}`}
                      id={`status-select-${budget.id}`}
                    >
                      <option value="rascunho">Rascunho</option>
                      <option value="enviado">Enviado</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="producao">Em produção</option>
                      <option value="entregue">Entregue</option>
                      <option value="perdido">Perdido</option>
                    </select>
                  </div>

                  {/* Client & Project Name */}
                  <h3 className="font-extrabold text-base text-neutral-900 group-hover:text-indigo-600 transition truncate">
                    {budget.client}
                  </h3>
                  <p className="text-xs text-neutral-600 font-medium truncate mb-3">
                    {budget.projectName}
                  </p>

                  {/* Quantity and Price */}
                  <div className="bg-neutral-50 rounded-xl p-3 flex items-center justify-between mb-3 border border-neutral-100">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">
                        {totalContracted} {totalContracted === 1 ? 'arte' : 'artes'}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        {hasItems ? `${budget.items.length} formatos de arte` : (budget.artType ? budget.artType.replace('_', ' ') : 'Design')}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-neutral-900 block">
                        {formatBRL(budget.totalValue, 0)}
                      </span>
                      {['aprovado', 'producao', 'entregue'].includes(budget.status) &&
                      budget.closedValue !== undefined &&
                      budget.closedValue !== budget.totalValue ? (
                        <span className="text-[10px] text-emerald-700 font-black block">
                          Fechado: {formatBRL(budget.closedValue, 0)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500 capitalize">
                          Faixa {budget.chosenTier}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Multi-item Scope Badges */}
                  {hasItems && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {budget.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200/60"
                        >
                          {it.quantity}× {ART_TYPE_LABELS[it.artType] || it.artType}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Delivery Progress Bar (for active / approved / production / delivered projects) */}
                  {hasItems && totalContracted > 0 && (
                    <div className="bg-neutral-50/80 rounded-xl p-2.5 mb-3 border border-neutral-100">
                      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                        <span className="text-neutral-500">Progresso da Entrega:</span>
                        <span className={totalProduced === totalContracted ? 'text-teal-700' : 'text-indigo-700'}>
                          {totalProduced}/{totalContracted} prontas ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            totalProduced === totalContracted ? 'bg-teal-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {budget.notes && (
                    <p className="text-[11px] text-neutral-500 italic bg-neutral-50/50 p-2 rounded-lg border border-neutral-100/80 line-clamp-2 mb-3">
                      "{budget.notes}"
                    </p>
                  )}
                </div>

                {/* Actions bottom */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => setViewingBudget(budget)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition"
                    title="Visualizar Proposta"
                    id={`btn-view-${budget.id}`}
                  >
                    <Eye className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Ver</span>
                  </button>

                  <button
                    onClick={() => handleCopyProposal(budget)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition"
                    title="Copiar texto do orçamento"
                    id={`btn-copy-${budget.id}`}
                  >
                    {copiedId === budget.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                    <span>{copiedId === budget.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => loadBudgetToCalculator(budget)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition"
                    title="Abrir e Editar na Calculadora"
                    id={`btn-edit-${budget.id}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => duplicateBudget(budget.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                    title="Duplicar Orçamento"
                    id={`btn-dup-${budget.id}`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Excluir o orçamento de "${budget.client}"?`)) {
                        deleteBudget(budget.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Excluir Orçamento"
                    id={`btn-del-${budget.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal to view / regenerate proposal */}
      {viewingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Orçamento Salvo
                </span>
                <h3 className="font-extrabold text-base text-neutral-900">
                  {viewingBudget.client} — {viewingBudget.projectName}
                </h3>
              </div>
              <button
                onClick={() => setViewingBudget(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs within Modal */}
            <div className="flex border-b border-neutral-200 px-6 bg-white gap-4">
              <button
                type="button"
                onClick={() => setModalTab('proposta')}
                className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === 'proposta'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Texto da Proposta</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('entrega')}
                className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === 'entrega'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Controle de Escopo & Entrega</span>
                {viewingBudget.items && viewingBudget.items.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold">
                    {viewingBudget.items.reduce((s, it) => s + (it.producedQuantity || 0), 0)}/
                    {viewingBudget.items.reduce((s, it) => s + it.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Meta stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs">
                <div>
                  <span className="text-neutral-400 block text-[10px]">Valor Orçado</span>
                  <span className="font-black text-neutral-900 text-sm">
                    {formatBRL(viewingBudget.totalValue, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Valor Fechado</span>
                  {['aprovado', 'producao', 'entregue'].includes(viewingBudget.status) ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-emerald-600 font-bold">R$</span>
                      <input
                        type="number"
                        min="0"
                        value={viewingBudget.closedValue ?? viewingBudget.totalValue}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          updateBudget(viewingBudget.id, { closedValue: val });
                          setViewingBudget({ ...viewingBudget, closedValue: val });
                        }}
                        className="w-20 font-black text-emerald-700 text-xs bg-white px-1.5 py-0.5 rounded border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        title="Ajuste o valor final fechado se houve desconto ou acréscimo"
                      />
                    </div>
                  ) : (
                    <span className="text-neutral-400 font-medium text-xs mt-1 block italic">
                      Em aberto
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Total de Peças</span>
                  <span className="font-bold text-neutral-800">
                    {viewingBudget.items && viewingBudget.items.length > 0
                      ? viewingBudget.items.reduce((s, it) => s + it.quantity, 0)
                      : viewingBudget.quantity}{' '}
                    artes
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Status do Projeto</span>
                  <select
                    value={viewingBudget.status}
                    onChange={(e) =>
                      handleStatusChange(
                        viewingBudget,
                        e.target.value as BudgetStatus
                      )
                    }
                    className="text-xs font-bold bg-white border border-neutral-200 rounded-md px-1.5 py-0.5 mt-0.5"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="enviado">Enviado</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="producao">Em produção</option>
                    <option value="entregue">Entregue</option>
                    <option value="perdido">Perdido</option>
                  </select>
                </div>
              </div>

              {modalTab === 'proposta' ? (
                /* Proposal Text Tab */
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                    Texto da Proposta Comercial:
                  </label>
                  <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 text-xs whitespace-pre-wrap leading-relaxed text-neutral-800 select-all max-h-72 overflow-y-auto">
                    {viewingBudget.proposalText}
                  </div>
                </div>
              ) : (
                /* Delivery and Scope Tracking Tab */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      Itens contratados e entregas:
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Clique em + ou - para atualizar o que já foi produzido.
                    </span>
                  </div>

                  {(!viewingBudget.items || viewingBudget.items.length === 0) ? (
                    <div className="p-4 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500">
                      Nenhum item individual registrado neste orçamento antigo.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {viewingBudget.items.map((item) => {
                        const produced = item.producedQuantity || 0;
                        const isCompleted = produced >= item.quantity;

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isCompleted
                                ? 'bg-teal-50/40 border-teal-200'
                                : 'bg-white border-neutral-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-neutral-900">
                                  {item.customName || ART_TYPE_LABELS[item.artType] || item.artType}
                                </span>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                                  {item.quantity} {item.quantity === 1 ? 'peça' : 'peças'}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                  {item.notes}
                                </p>
                              )}
                            </div>

                            {/* Quantity progress controls & Status selector */}
                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              {/* Quantity stepper */}
                              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
                                <button
                                  type="button"
                                  disabled={produced <= 0}
                                  onClick={() => {
                                    updateBudgetItemProgress(viewingBudget.id, item.id, -1);
                                    setViewingBudget((prev) => {
                                      if (!prev) return null;
                                      return {
                                        ...prev,
                                        items: (prev.items || []).map((it) =>
                                          it.id === item.id
                                            ? { ...it, producedQuantity: Math.max(0, (it.producedQuantity || 0) - 1) }
                                            : it
                                        ),
                                      };
                                    });
                                  }}
                                  className="w-6 h-6 rounded-lg bg-white text-neutral-700 font-black text-xs flex items-center justify-center hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                                >
                                  -
                                </button>

                                <span className="text-xs font-black text-neutral-900 px-2 min-w-[50px] text-center">
                                  {produced} / {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  disabled={produced >= item.quantity}
                                  onClick={() => {
                                    updateBudgetItemProgress(viewingBudget.id, item.id, 1);
                                    setViewingBudget((prev) => {
                                      if (!prev) return null;
                                      return {
                                        ...prev,
                                        items: (prev.items || []).map((it) =>
                                          it.id === item.id
                                            ? {
                                                ...it,
                                                producedQuantity: Math.min(
                                                  it.quantity,
                                                  (it.producedQuantity || 0) + 1
                                                ),
                                              }
                                            : it
                                        ),
                                      };
                                    });
                                  }}
                                  className="w-6 h-6 rounded-lg bg-white text-neutral-700 font-black text-xs flex items-center justify-center hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                                >
                                  +
                                </button>
                              </div>

                              {/* Status badge / selector */}
                              <select
                                value={item.status || 'pendente'}
                                onChange={(e) => {
                                  const newStatus = e.target.value as any;
                                  updateBudgetItemStatus(viewingBudget.id, item.id, newStatus);
                                  setViewingBudget((prev) => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      items: (prev.items || []).map((it) =>
                                        it.id === item.id ? { ...it, status: newStatus } : it
                                      ),
                                    };
                                  });
                                }}
                                className={`text-[11px] font-bold py-1 px-2 rounded-lg border cursor-pointer ${
                                  item.status === 'entregue'
                                    ? 'bg-teal-100 text-teal-800 border-teal-300'
                                    : item.status === 'em_producao'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : item.status === 'aprovado'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                                }`}
                              >
                                <option value="pendente">Pendente</option>
                                <option value="em_producao">Em produção</option>
                                <option value="revisao">Em alteração</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="entregue">Entregue</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  loadBudgetToCalculator(viewingBudget);
                  setViewingBudget(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-200/70 transition border border-neutral-300 bg-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Carregar na Calculadora</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const link = generateWhatsAppLink(
                      settings.proposal.whatsapp,
                      viewingBudget.proposalText
                    );
                    window.open(link, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() => handleCopyProposal(viewingBudget)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Proposta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
