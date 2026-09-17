import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  Layers,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Package,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArtType, Complexity, ProjectItem } from '../../types';
import {
  formatBRL,
  formatMinutes,
  getItemLabel,
} from '../../utils/calculations';
import { AnimatedPrice } from './AnimatedPrice';

interface ServiceCartProps {
  onOpenAddItemModal: () => void;
}

export const ServiceCart: React.FC<ServiceCartProps> = ({
  onOpenAddItemModal,
}) => {
  const { input, updateItem, removeItem, duplicateItem, result, settings } =
    useApp();

  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);

  const items = input.items || [];
  const itemsBreakdown = result.itemsBreakdown || [];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-neutral-200/90 shadow-xs" id="section-servicos-carrinho">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center ring-1 ring-indigo-100">
            A
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-neutral-900">
                Carrinho de Serviços do Projeto
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                {result.totalDeliverables} {result.totalDeliverables === 1 ? 'arte' : 'artes'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Adicione diferentes formatos e quantidades. Cada item é calculado individualmente.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddItemModal}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition shrink-0 active:scale-[0.98]"
          id="btn-add-service-open"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Serviço</span>
        </button>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-10 px-4 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50"
        >
          <Package className="w-10 h-10 text-neutral-400 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-neutral-800">
            Nenhum serviço adicionado ainda
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Monte o escopo do seu projeto adicionando feeds, stories, carrosséis ou capas.
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            type="button"
            onClick={onOpenAddItemModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar primeiro serviço</span>
          </motion.button>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-3.5">
          <AnimatePresence initial={false}>
            {items.map((item, index) => {
              const breakdown = itemsBreakdown.find((b) => b.itemId === item.id);
              const itemValue = breakdown ? breakdown.estimatedValue : 0;
              const itemTotalMinutes = breakdown ? breakdown.totalMinutes : 0;
              const mult = settings.complexityMultipliers[item.complexity] ?? 1.0;

              const isNotesExpanded = expandedNotesId === item.id;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    y: -12,
                    transition: { duration: 0.2 },
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                  className="group relative bg-neutral-50/70 hover:bg-white rounded-xl p-4 border border-neutral-200/80 hover:border-indigo-300 transition-colors shadow-2xs hover:shadow-xs"
                  id={`cart-item-${item.id}`}
                >
                  {/* Top Row: Title, Tag, Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-md bg-neutral-200/80 text-neutral-700 text-[10px] font-bold flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-bold text-neutral-900">
                        {getItemLabel(item.artType, item.customName)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-200 text-neutral-700">
                        {item.complexity} ({mult.toFixed(1)}x)
                      </span>
                    </div>

                    {/* Value & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-neutral-200/60">
                      <div className="text-right">
                        <span className="text-[11px] text-neutral-400 block font-medium">
                          Valor estimado
                        </span>
                        <AnimatedPrice
                          value={itemValue}
                          decimals={2}
                          className="text-sm font-black text-indigo-950"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => duplicateItem(item.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Duplicar este serviço"
                          id={`btn-duplicate-item-${item.id}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </motion.button>

                        {items.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Remover serviço"
                            id={`btn-remove-item-${item.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid of Inputs: Quantidade, Tempo por Arte, Complexidade */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantidade */}
                    <div className="bg-white rounded-lg p-2.5 border border-neutral-200/70">
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Quantidade
                      </label>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              quantity: Math.max(1, item.quantity - 1),
                            })
                          }
                          className="w-7 h-7 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center transition select-none"
                        >
                          -
                        </motion.button>
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                            })
                          }
                          className="w-full text-center font-black text-sm text-neutral-900 border-none bg-transparent focus:outline-none focus:ring-0"
                          id={`input-item-qty-${item.id}`}
                        />
                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          type="button"
                          onClick={() =>
                            updateItem(item.id, {
                              quantity: item.quantity + 1,
                            })
                          }
                          className="w-7 h-7 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs flex items-center justify-center transition select-none"
                        >
                          +
                        </motion.button>
                      </div>
                    </div>

                    {/* Tempo por unidade */}
                    <div className="bg-white rounded-lg p-2.5 border border-neutral-200/70">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-neutral-600">
                          Tempo / unidade
                        </label>
                        <span className="text-[10px] font-semibold text-indigo-600">
                          Total: {formatMinutes(itemTotalMinutes)}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={item.timePerArtMinutes}
                          onChange={(e) =>
                            updateItem(item.id, {
                              timePerArtMinutes: Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              ),
                            })
                          }
                          className="w-full text-xs font-bold px-2 py-1 rounded border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          id={`input-item-time-${item.id}`}
                        />
                        <span className="absolute right-2 top-1 text-[10px] text-neutral-400">
                          min
                        </span>
                      </div>
                    </div>

                    {/* Complexidade */}
                    <div className="bg-white rounded-lg p-2.5 border border-neutral-200/70">
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Complexidade
                      </label>
                      <select
                        value={item.complexity}
                        onChange={(e) =>
                          updateItem(item.id, {
                            complexity: e.target.value as Complexity,
                          })
                        }
                        className="w-full text-xs font-semibold px-2 py-1 rounded border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        id={`select-item-complexity-${item.id}`}
                      >
                        <option value="simples">Simples (1.0x)</option>
                        <option value="media">Média (1.5x)</option>
                        <option value="complexa">Complexa (2.0x)</option>
                      </select>
                    </div>
                  </div>

                  {/* Item Notes (Optional) */}
                  <div className="mt-2.5">
                    {isNotesExpanded || item.notes ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Observação do item (ex: Carrossel de 7 telas com infográfico)"
                          value={item.notes || ''}
                          onChange={(e) =>
                            updateItem(item.id, { notes: e.target.value })
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          id={`input-item-notes-${item.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedNotesId(null)}
                          className="text-[11px] text-neutral-400 hover:text-neutral-600 shrink-0 px-1"
                        >
                          Fechar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedNotesId(item.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-indigo-600 transition"
                        id={`btn-open-notes-${item.id}`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Adicionar observação sobre este item...</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Summary Table: Escopo e Distribuição */}
      {items.length > 0 && (
        <div className="mt-5 pt-4 border-t border-neutral-100">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Resumo de Escopo & Tempo de Produção</span>
            <span className="text-indigo-600 font-semibold lowercase">
              soma de todos os serviços
            </span>
          </h3>

          <div className="overflow-x-auto rounded-xl border border-neutral-200/80 bg-neutral-50/50">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100/70 text-neutral-600 font-semibold border-b border-neutral-200/80">
                <tr>
                  <th className="py-2.5 px-3">Serviço</th>
                  <th className="py-2.5 px-3 text-center">Quantidade</th>
                  <th className="py-2.5 px-3 text-center">Tempo Est.</th>
                  <th className="py-2.5 px-3 text-right">Valor Est.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 font-medium text-neutral-700">
                {itemsBreakdown.map((row) => (
                  <tr key={row.itemId} className="hover:bg-white/80 transition">
                    <td className="py-2 px-3">
                      <span className="font-bold text-neutral-900">{row.label}</span>
                      {row.customName && (
                        <span className="text-[11px] text-neutral-500 block">
                          {row.customName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      {row.quantity} un
                    </td>
                    <td className="py-2 px-3 text-center text-neutral-600">
                      {formatMinutes(row.totalMinutes)}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-neutral-900">
                      <AnimatedPrice value={row.estimatedValue} decimals={2} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-neutral-100 font-bold text-neutral-900 border-t border-neutral-200">
                <tr>
                  <td className="py-2.5 px-3">Total do Escopo</td>
                  <td className="py-2.5 px-3 text-center text-indigo-700">
                    {result.totalDeliverables} unidades
                  </td>
                  <td className="py-2.5 px-3 text-center text-indigo-700">
                    {formatMinutes(result.timeBreakdown.productionMinutes)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-indigo-700 font-black">
                    <AnimatedPrice value={result.effectivePrice} decimals={2} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
