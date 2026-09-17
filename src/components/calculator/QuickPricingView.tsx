import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Sliders,
  Copy,
  Check,
  Send,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { ArtType, UrgencyLevel } from '../../types';
import { formatBRL, formatMinutes } from '../../utils/calculations';
import { generateProposalText } from '../../utils/proposalGenerator';
import { AnimatedPrice } from './AnimatedPrice';

interface QuickPricingViewProps {
  onOpenProposalModal: () => void;
  onOpenSaveModal: () => void;
}

export const QuickPricingView: React.FC<QuickPricingViewProps> = ({
  onOpenProposalModal,
}) => {
  const { input, updateInput, setQuickMode, result, settings } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopyQuick = async () => {
    const text = generateProposalText(input, result, settings.proposal);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="quick-pricing-view">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-200">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="font-bold text-neutral-900 text-base">
              Modo Precificação Rápida
            </h2>
            <p className="text-xs text-neutral-600">
              Ideal para quando um cliente chama no WhatsApp e você precisa responder na hora.
            </p>
          </div>
        </div>
        <button
          onClick={() => setQuickMode(false)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold border border-neutral-300 transition shadow-2xs self-end sm:self-auto"
          id="btn-switch-to-full-calculator"
        >
          <Sliders className="w-3.5 h-3.5 text-neutral-500" />
          <span>Personalizar cálculo completo</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {input.items && input.items.length > 1 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-indigo-900 font-medium">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Seu projeto contém <strong>{input.items.length} tipos de serviços</strong> no carrinho. No modo rápido, você edita o serviço principal.
            </span>
          </div>
          <button
            onClick={() => setQuickMode(false)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition shrink-0"
          >
            Ver Carrinho Completo
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Quick Input Controls (7 cols) */}
        <div className="md:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          {/* 1. Quantidade & Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Quantidade de artes
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={input.quantity}
                  onChange={(e) =>
                    updateInput({ quantity: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full text-base font-bold px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 bg-white"
                  id="quick-input-quantity"
                />
                <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-medium pointer-events-none">
                  peças
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Tipo de arte
              </label>
              <select
                value={input.artType}
                onChange={(e) => updateInput({ artType: e.target.value as ArtType })}
                className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 bg-white"
                id="quick-select-art-type"
              >
                <option value="feed_simples">Feed simples</option>
                <option value="feed_elaborado">Feed elaborado</option>
                <option value="story">Story</option>
                <option value="carrossel">Carrossel</option>
                <option value="capa">Capa</option>
                <option value="thumbnail">Thumbnail</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* 2. Tempo por arte & Valor da hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Tempo por arte (minutos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={input.timePerArtMinutes}
                  onChange={(e) =>
                    updateInput({
                      timePerArtMinutes: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 bg-white"
                  id="quick-input-time-per-art"
                />
                <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-medium pointer-events-none">
                  min
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Sua hora (R$/h)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-neutral-500 font-semibold pointer-events-none">
                  R$
                </span>
                <input
                  type="number"
                  min={10}
                  step={5}
                  value={input.hourlyRate}
                  onChange={(e) =>
                    updateInput({
                      hourlyRate: Math.max(1, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full text-sm font-bold pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 bg-white"
                  id="quick-input-hourly-rate"
                />
              </div>
            </div>
          </div>

          {/* 3. Alterações incluídas & Urgência */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Rodadas de alteração
              </label>
              <select
                value={input.includedRevisionRounds}
                onChange={(e) =>
                  updateInput({ includedRevisionRounds: parseInt(e.target.value) || 0 })
                }
                className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 bg-white"
                id="quick-select-revisions"
              >
                <option value={0}>Nenhuma (0 rodadas)</option>
                <option value={1}>1 rodada inclusa (Padrão)</option>
                <option value={2}>2 rodadas inclusas</option>
                <option value={3}>3 rodadas inclusas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Prazo / Urgência
              </label>
              <select
                value={input.urgency}
                onChange={(e) =>
                  updateInput({ urgency: e.target.value as UrgencyLevel })
                }
                className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900 bg-white"
                id="quick-select-urgency"
              >
                <option value="normal">Normal (1,0x)</option>
                <option value="urgente">Urgente (+20%)</option>
                <option value="muito_urgente">Muito urgente (+40%)</option>
              </select>
            </div>
          </div>

          {/* Time notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs text-neutral-600">
            <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>
              Tempo total estimado: <strong>{formatMinutes(result.timeBreakdown.totalMinutes)}</strong> ({input.quantity} artes + alterações/briefing)
            </span>
          </div>
        </div>

        {/* Quick Result Highlight (5 cols) */}
        <motion.div
          layout
          className="md:col-span-5 bg-gradient-to-br from-neutral-900 via-neutral-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-400">
                Preço Calculado
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 font-medium">
                <AnimatedPrice value={result.averagePricePerArt} decimals={2} /> / arte
              </span>
            </div>

            <div className="text-4xl sm:text-5xl font-black text-white tracking-tight my-2">
              <AnimatedPrice value={result.priceRecomendado} decimals={0} />
            </div>

            <AnimatePresence>
              {result.urgencyAddPercent > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-3"
                >
                  <span>Adicional de urgência: +{result.urgencyAddPercent}%</span>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Cobre o seu tempo estimado de {formatMinutes(result.timeBreakdown.totalMinutes)}, custos de ferramentas, impostos ({input.taxRatePercent}%) e margem ({input.marginPercent}%).
            </p>

            {/* Quick tiers */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 mb-6 text-xs">
              <div>
                <div className="text-neutral-400 text-[10px]">Preço Mínimo</div>
                <div className="font-bold text-neutral-200">
                  <AnimatedPrice value={result.priceMinimo} decimals={0} />
                </div>
              </div>
              <div>
                <div className="text-neutral-400 text-[10px]">Preço Premium</div>
                <div className="font-bold text-amber-300">
                  <AnimatedPrice value={result.pricePremium} decimals={0} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2.5">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onOpenProposalModal}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-md shadow-indigo-900/50"
              id="quick-btn-open-proposal"
            >
              <Send className="w-4 h-4" />
              <span>Gerar Orçamento Completo</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleCopyQuick}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition border border-white/10"
              id="quick-btn-copy"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiado para WhatsApp!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Mensagem Direta</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
