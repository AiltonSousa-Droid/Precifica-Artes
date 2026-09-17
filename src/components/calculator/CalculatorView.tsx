import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Zap,
  Copy,
  Check,
  Send,
  Save,
  BookmarkCheck,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import {
  ArtType,
  Complexity,
  ProjectCostItem,
  UrgencyLevel,
  PricingTier,
} from '../../types';
import { formatBRL, formatMinutes } from '../../utils/calculations';
import { generateProposalText } from '../../utils/proposalGenerator';
import { DashboardMetrics } from '../DashboardMetrics';
import { QuickPricingView } from './QuickPricingView';
import { ProposalModal } from './ProposalModal';
import { SaveBudgetModal } from './SaveBudgetModal';
import { ServiceCart } from './ServiceCart';
import { AddServiceModal } from './AddServiceModal';
import { AnimatedPrice } from './AnimatedPrice';

export const CalculatorView: React.FC = () => {
  const {
    input,
    updateInput,
    resetInput,
    result,
    settings,
    quickMode,
    setActiveTab,
  } = useApp();

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [showAdvancedTimes, setShowAdvancedTimes] = useState(false);

  // New cost item state
  const [newCostName, setNewCostName] = useState('');
  const [newCostValue, setNewCostValue] = useState('');

  // Handle direct copy of proposal text
  const handleDirectCopy = async () => {
    const text = generateProposalText(input, result, settings.proposal);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDirect(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
      setTimeout(() => setCopiedDirect(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDirectCost = () => {
    if (!newCostName.trim() || !newCostValue) return;
    const valueNum = parseFloat(newCostValue.replace(',', '.')) || 0;
    if (valueNum <= 0) return;

    const newItem: ProjectCostItem = {
      id: `cost-${Date.now()}`,
      name: newCostName.trim(),
      value: valueNum,
    };

    updateInput({
      directCosts: [...(input.directCosts || []), newItem],
    });
    setNewCostName('');
    setNewCostValue('');
  };

  const handleRemoveDirectCost = (id: string) => {
    updateInput({
      directCosts: (input.directCosts || []).filter((c) => c.id !== id),
    });
  };

  const toggleTool = (toolId: string) => {
    const current = new Set(input.selectedToolIds || []);
    if (current.has(toolId)) {
      current.delete(toolId);
    } else {
      current.add(toolId);
    }
    updateInput({ selectedToolIds: Array.from(current) });
  };

  if (quickMode) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24 md:pb-12">
        <DashboardMetrics />
        <QuickPricingView
          onOpenProposalModal={() => setIsProposalModalOpen(true)}
          onOpenSaveModal={() => setIsSaveModalOpen(true)}
        />
        <ProposalModal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          onOpenSaveModal={() => {
            setIsProposalModalOpen(false);
            setIsSaveModalOpen(true);
          }}
        />
        <SaveBudgetModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24 md:pb-12">
      {/* 1. Top Dashboard Metrics */}
      <DashboardMetrics />

      {/* Top Banner & Reset */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            Calculadora de Precificação
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            Descubra o valor real do seu trabalho considerando tempo, custos, impostos e margem.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setActiveTab('presets')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-2xs transition"
            id="btn-open-presets-shortcut"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Usar Preset</span>
          </button>

          <button
            onClick={resetInput}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 transition"
            id="btn-reset-calc"
            title="Redefinir para o exemplo padrão"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar Padrão</span>
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {result.isInvalid && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm font-semibold">
            {result.validationError || 'Preencha os campos com valores válidos para calcular o preço.'}
          </div>
        </div>
      )}

      {/* Main Grid: Inputs (Left) and Pricing Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Sections A through E (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SEÇÃO A: CARRINHO DE SERVIÇOS DO PROJETO */}
          <ServiceCart
            onOpenAddItemModal={() => setIsAddServiceModalOpen(true)}
          />

          {/* SEÇÃO B: TEMPOS ADICIONAIS & ETAPAS DO PROJETO */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs" id="section-tempo">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                  B
                </span>
                <div>
                  <h2 className="font-bold text-base text-neutral-900">
                    Etapas do Projeto & Tempos Adicionais
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Briefing, pesquisa, atendimento e fechamento somados à produção dos itens.
                  </p>
                </div>
              </div>

              {/* Total time pill */}
              <div className="flex items-center gap-1.5 bg-neutral-900 text-white px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Total: {formatMinutes(result.timeBreakdown.totalMinutes)}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Etapas breakdown cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                  <span className="text-neutral-500 block text-[10px] font-medium">Produção (Itens)</span>
                  <strong className="text-indigo-950 font-black text-sm">
                    {formatMinutes(result.timeBreakdown.productionMinutes)}
                  </strong>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {result.totalDeliverables} {result.totalDeliverables === 1 ? 'arte' : 'artes'}
                  </span>
                </div>

                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/80">
                  <span className="text-neutral-500 block text-[10px] font-medium">Briefing & Alinhamento</span>
                  <strong className="text-neutral-900 font-black text-sm">
                    {formatMinutes(result.timeBreakdown.briefingMinutes + (input.communicationMinutes || 0))}
                  </strong>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Reuniões/Chat</span>
                </div>

                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/80">
                  <span className="text-neutral-500 block text-[10px] font-medium">Pesquisa & Exportação</span>
                  <strong className="text-neutral-900 font-black text-sm">
                    {formatMinutes(result.timeBreakdown.exportMinutes + (input.researchMinutes || 0))}
                  </strong>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">Arquivos finais</span>
                </div>

                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/80">
                  <span className="text-neutral-500 block text-[10px] font-medium">Alterações Estimadas</span>
                  <strong className="text-neutral-900 font-black text-sm">
                    {formatMinutes(result.timeBreakdown.revisionMinutes)}
                  </strong>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    {input.includedRevisionRounds} {input.includedRevisionRounds === 1 ? 'rodada' : 'rodadas'}
                  </span>
                </div>
              </div>

              {/* Adjust extra times toggle */}
              <div className="bg-neutral-50/70 rounded-xl p-3.5 border border-neutral-200/70">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-neutral-700">Ajustar minutos das etapas de apoio:</span>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedTimes(!showAdvancedTimes)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    id="btn-toggle-time-breakdown"
                  >
                    <span>{showAdvancedTimes ? 'Recolher etapas' : 'Personalizar minutos de cada etapa'}</span>
                    {showAdvancedTimes ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {showAdvancedTimes && (
                  <div className="mt-3 pt-3 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Briefing inicial (minutos)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={input.briefingMinutes}
                        onChange={(e) =>
                          updateInput({
                            briefingMinutes: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                        id="input-briefing-minutes"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Comunicação & Atendimento (minutos)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={input.communicationMinutes}
                        onChange={(e) =>
                          updateInput({
                            communicationMinutes: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                        id="input-comm-minutes"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Pesquisa & Referências (minutos)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={input.researchMinutes}
                        onChange={(e) =>
                          updateInput({
                            researchMinutes: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                        id="input-research-minutes"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                        Exportação & Entrega de arquivos (minutos)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={input.exportMinutes}
                        onChange={(e) =>
                          updateInput({
                            exportMinutes: Math.max(0, parseInt(e.target.value) || 0),
                          })
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white"
                        id="input-export-minutes"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEÇÃO C: VALOR DA HORA & CUSTOS */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs" id="section-hora-custos">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                C
              </span>
              <h2 className="font-bold text-base text-neutral-900">
                Valor da Hora & Custos Operacionais
              </h2>
            </div>

            <div className="space-y-5">
              {/* Valor da Hora */}
              <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Quanto vale sua hora de trabalho? *
                  </label>
                  <span className="text-xs font-bold text-indigo-700">
                    Custo do trabalho: {result.timeBreakdown.totalHours.toFixed(1)}h × {formatBRL(input.hourlyRate, 0)} = {formatBRL(result.laborCost, 2)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={input.hourlyRate}
                    onChange={(e) =>
                      updateInput({
                        hourlyRate: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full text-base font-bold pl-9 pr-3 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-neutral-900"
                    id="input-hourly-rate"
                  />
                </div>
              </div>

              {/* Ferramentas Recorrentes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-700">
                    Ferramentas Recorrentes (Custo proporcional por projeto)
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('configuracoes')}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Gerenciar ferramentas
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {settings.recurringTools.map((tool) => {
                    const isSelected = (input.selectedToolIds || []).includes(tool.id);
                    const perProject =
                      tool.projectsPerMonth > 0
                        ? tool.monthlyCost / tool.projectsPerMonth
                        : 0;

                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => toggleTool(tool.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50'
                        }`}
                        id={`tool-toggle-${tool.id}`}
                      >
                        <div>
                          <div className="text-xs font-bold text-neutral-900">
                            {tool.name}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {formatBRL(tool.monthlyCost, 0)}/mês ÷ {tool.projectsPerMonth} proj
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-indigo-600 block">
                            +{formatBRL(perProject, 2)}
                          </span>
                          <span className="text-[10px] text-neutral-400">por projeto</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custos diretos do projeto (Ferramentas extras, banco de imagens, freelancer) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-700">
                    Custos extras deste projeto
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">
                    Total: {formatBRL(result.operationalCosts, 2)}
                  </span>
                </div>

                {/* List existing */}
                <div className="space-y-1.5 mb-2.5">
                  {(input.directCosts || []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-xs"
                    >
                      <span className="font-medium text-neutral-800">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">
                          {formatBRL(item.value, 2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDirectCost(item.id)}
                          className="text-neutral-400 hover:text-red-600 p-1 transition"
                          title="Remover custo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Banco de imagens pago, Fonte, Terceirização"
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
                    id="input-new-cost-name"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-2 text-xs text-neutral-500 font-semibold">
                      R$
                    </span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={newCostValue}
                      onChange={(e) => setNewCostValue(e.target.value)}
                      className="w-full text-xs pl-7 pr-2 py-2 rounded-xl border border-neutral-300 bg-white font-bold"
                      id="input-new-cost-value"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDirectCost}
                    className="px-3 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1 shrink-0"
                    id="btn-add-cost"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO D: ALTERAÇÕES */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs" id="section-alteracoes">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                D
              </span>
              <h2 className="font-bold text-base text-neutral-900">
                Alterações & Revisões
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Rodadas de alteração incluídas
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={input.includedRevisionRounds}
                  onChange={(e) =>
                    updateInput({
                      includedRevisionRounds: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full text-sm font-bold px-3.5 py-2 rounded-xl border border-neutral-300 bg-white"
                  id="input-revision-rounds"
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Padrão do mercado: 1 ou 2 rodadas
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Tempo estimado por rodada (minutos)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10}
                  value={input.revisionMinutesPerRound}
                  onChange={(e) =>
                    updateInput({
                      revisionMinutesPerRound: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                  className="w-full text-sm font-bold px-3.5 py-2 rounded-xl border border-neutral-300 bg-white"
                  id="input-revision-minutes"
                />
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Total de alterações: {formatMinutes(result.timeBreakdown.revisionMinutes)}
                </span>
              </div>
            </div>

            {/* Alterações adicionais (Section 7) */}
            <div className="mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-700">
                  Política para rodadas adicionais (fora do pacote)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-600 mb-1">
                    Modelo de cobrança adicional
                  </label>
                  <select
                    value={input.additionalRevisionModel}
                    onChange={(e) =>
                      updateInput({
                        additionalRevisionModel: e.target.value as 'fixed' | 'hourly',
                      })
                    }
                    className="w-full p-2 rounded-xl border border-neutral-300 bg-white font-medium"
                    id="select-additional-rev-model"
                  >
                    <option value="fixed">Valor fixo por rodada</option>
                    <option value="hourly">Tempo estimado × valor/hora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 mb-1">
                    {input.additionalRevisionModel === 'fixed'
                      ? 'Preço por rodada extra (R$)'
                      : 'Minutos por rodada extra'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={
                      input.additionalRevisionModel === 'fixed'
                        ? input.additionalRevisionPrice
                        : input.additionalRevisionMinutes
                    }
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      if (input.additionalRevisionModel === 'fixed') {
                        updateInput({ additionalRevisionPrice: val });
                      } else {
                        updateInput({
                          additionalRevisionMinutes: val,
                          additionalRevisionPrice: (val / 60) * input.hourlyRate,
                        });
                      }
                    }}
                    className="w-full p-2 rounded-xl border border-neutral-300 bg-white font-bold"
                    id="input-additional-rev-value"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO E: IMPOSTOS, MARGEM & URGÊNCIA */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs" id="section-impostos-margem">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
              <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                E
              </span>
              <h2 className="font-bold text-base text-neutral-900">
                Impostos, Margem & Prazo
              </h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Impostos */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      Impostos (%) *
                    </label>
                    <span className="text-[10px] text-neutral-500">
                      Informe sua alíquota efetiva
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      step={0.5}
                      value={input.taxRatePercent}
                      onChange={(e) =>
                        updateInput({
                          taxRatePercent: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full text-sm font-bold px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      id="input-tax-rate"
                    />
                    <Percent className="w-3.5 h-3.5 absolute right-3 top-3 text-neutral-400" />
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    MEI: ~R$75/mês ou Simples Nacional (~6%)
                  </span>
                </div>

                {/* Margem de lucro */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      Margem de lucro desejada (%) *
                    </label>
                    <span className="text-[10px] text-neutral-500">
                      Sobre o preço final
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={90}
                      step={1}
                      value={input.marginPercent}
                      onChange={(e) =>
                        updateInput({
                          marginPercent: Math.max(0, parseFloat(e.target.value) || 0),
                        })
                      }
                      className="w-full text-sm font-bold px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      id="input-margin"
                    />
                    <Percent className="w-3.5 h-3.5 absolute right-3 top-3 text-neutral-400" />
                  </div>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Fórmula: Custos ÷ (1 − impostos − margem)
                  </span>
                </div>
              </div>

              {/* Prazo & Urgência */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Prazo de entrega & Adicional de urgência
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {(['normal', 'urgente', 'muito_urgente'] as UrgencyLevel[]).map((lvl) => {
                    const mult = settings.urgencyMultipliers[lvl];
                    const percentAdd = Math.round((mult - 1) * 100);
                    const isSelected = input.urgency === lvl;
                    const labels = {
                      normal: 'Normal',
                      urgente: 'Urgente',
                      muito_urgente: 'Muito urgente',
                    };
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => updateInput({ urgency: lvl })}
                        className={`py-2.5 px-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-600'
                            : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-medium'
                        }`}
                        id={`btn-urgency-${lvl}`}
                      >
                        <span className="text-xs">{labels[lvl]}</span>
                        <span className="text-[10px] text-neutral-500 font-semibold">
                          {percentAdd > 0 ? `+${percentAdd}%` : 'Padrão (1,0x)'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Column: Final Price Focal Point & Breakdown (5 cols on lg) */}
        <motion.div layout className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
          {/* Main Price Card */}
          <motion.div
            layout
            className="bg-neutral-900 text-white rounded-3xl p-6 shadow-xl border border-neutral-800 relative overflow-hidden"
            id="pricing-card-focal"
          >
            {/* Background Glow subtle */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest font-extrabold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Preço Recomendado</span>
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-neutral-200">
                <AnimatedPrice value={result.averagePricePerArt} decimals={2} /> / arte
              </span>
            </div>

            {/* Main Focal Display */}
            <div className="my-3">
              <div className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                <AnimatedPrice value={result.priceRecomendado} decimals={0} />
              </div>
              <AnimatePresence>
                {result.urgencyAddPercent > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-1 text-xs text-amber-300 font-semibold"
                  >
                    Adicional de urgência: +{result.urgencyAddPercent}%
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3 Tiers Selection (Section 11: Mínimo, Recomendado, Premium) */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                Escolha a faixa para a proposta:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {/* Mínimo */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => updateInput({ chosenTier: 'minimo' })}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    input.chosenTier === 'minimo'
                      ? 'border-indigo-400 bg-white/15 text-white font-bold ring-1 ring-indigo-400'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  id="btn-tier-minimo"
                >
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">Mínimo</div>
                  <div className="text-sm font-extrabold mt-0.5">
                    <AnimatedPrice value={result.priceMinimo} decimals={0} />
                  </div>
                  <div className="text-[9px] text-neutral-400">Menor margem</div>
                </motion.button>

                {/* Recomendado */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => updateInput({ chosenTier: 'recomendado' })}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    input.chosenTier === 'recomendado'
                      ? 'border-indigo-400 bg-indigo-600/40 text-white font-bold ring-2 ring-indigo-400'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  id="btn-tier-recomendado"
                >
                  <div className="text-[10px] text-amber-300 uppercase font-bold">Recomendado</div>
                  <div className="text-sm font-black mt-0.5 text-white">
                    <AnimatedPrice value={result.priceRecomendado} decimals={0} />
                  </div>
                  <div className="text-[9px] text-neutral-300">Ideal</div>
                </motion.button>

                {/* Premium */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => updateInput({ chosenTier: 'premium' })}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    input.chosenTier === 'premium'
                      ? 'border-indigo-400 bg-white/15 text-white font-bold ring-1 ring-indigo-400'
                      : 'border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                  id="btn-tier-premium"
                >
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">Premium</div>
                  <div className="text-sm font-extrabold mt-0.5">
                    <AnimatedPrice value={result.pricePremium} decimals={0} />
                  </div>
                  <div className="text-[9px] text-neutral-400">Alto valor</div>
                </motion.button>
              </div>
            </div>

            {/* Quick Actions inside Card */}
            <div className="mt-6 space-y-2.5">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setIsProposalModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-900/50"
                id="btn-gerar-orcamento"
              >
                <Send className="w-4 h-4" />
                <span>GERAR ORÇAMENTO</span>
              </motion.button>

              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={handleDirectCopy}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/10"
                  id="btn-copiar-orcamento"
                >
                  {copiedDirect ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPIAR ORÇAMENTO</span>
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setIsSaveModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/10"
                  id="btn-salvar-orcamento"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>SALVAR ORÇAMENTO</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* DETALHAMENTO DO PREÇO (Section 12) */}
          <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 pb-2 border-b border-neutral-100">
              Composição & Detalhamento Interno
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Escopo total do projeto:</span>
                <span className="font-bold text-neutral-900">
                  {result.totalDeliverables} {result.totalDeliverables === 1 ? 'arte' : 'artes'} ({input.items?.length || 0} {input.items?.length === 1 ? 'serviço' : 'serviços'})
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Tempo total estimado:</span>
                <span className="font-bold text-neutral-900">
                  {formatMinutes(result.timeBreakdown.totalMinutes)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Custo do trabalho (suas horas):</span>
                <span className="font-bold text-neutral-900">
                  <AnimatedPrice value={result.laborCost} decimals={2} />
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Custos operacionais diretos:</span>
                <span className="font-bold text-neutral-900">
                  <AnimatedPrice value={result.operationalCosts} decimals={2} />
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Custo das ferramentas (rateio):</span>
                <span className="font-bold text-neutral-900">
                  <AnimatedPrice value={result.toolsCost} decimals={2} />
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Impostos estimados ({input.taxRatePercent}%):</span>
                <span className="font-bold text-neutral-900">
                  <AnimatedPrice value={result.estimatedTaxes} decimals={2} />
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Lucro líquido estimado:</span>
                <span className="font-bold text-emerald-600">
                  <AnimatedPrice value={result.estimatedProfit} decimals={2} />
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <span className="text-neutral-600">Valor efetivo da sua hora:</span>
                <span className="font-bold text-indigo-700">
                  <AnimatedPrice value={result.effectiveHourlyRate} decimals={2} />/hora
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-neutral-600 font-medium">Preço médio por arte:</span>
                <span className="font-black text-neutral-900 text-sm">
                  <AnimatedPrice value={result.averagePricePerArt} decimals={2} />
                </span>
              </div>
            </div>

            <div className="bg-neutral-50 p-2.5 rounded-xl text-[11px] text-neutral-500 leading-normal border border-neutral-200/70">
              ℹ️ <strong>Nota:</strong> O valor médio por arte é apenas uma referência interna. O orçamento é fechado como um <strong>pacote fechado de valor</strong> para proteger sua margem contra pedidos unitários avulsos.
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Mobile Sticky Result Bar (lg:hidden) */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="lg:hidden fixed bottom-16 left-3 right-3 z-30 bg-neutral-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl border border-neutral-800 shadow-2xl flex items-center justify-between gap-3"
        id="mobile-sticky-result-bar"
      >
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
            Total Recomendado ({result.totalDeliverables} {result.totalDeliverables === 1 ? 'arte' : 'artes'})
          </span>
          <div className="flex items-baseline gap-1.5">
            <AnimatedPrice
              value={result.priceRecomendado}
              decimals={0}
              className="text-lg font-black text-white"
            />
            <span className="text-[10px] text-neutral-400">
              (~<AnimatedPrice value={result.averagePricePerArt} decimals={0} />/un)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              const el = document.getElementById('pricing-card-focal');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setIsProposalModalOpen(true);
              }
            }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition"
          >
            Ver Detalhes
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsProposalModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-indigo-900/50 transition"
            id="mobile-btn-gerar-orcamento"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Proposta</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Modals */}
      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        onOpenSaveModal={() => {
          setIsProposalModalOpen(false);
          setIsSaveModalOpen(true);
        }}
      />

      <SaveBudgetModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />

      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
      />
    </div>
  );
};
