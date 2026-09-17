import React, { useState } from 'react';
import { X, Plus, Sparkles, Clock, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ArtType, Complexity } from '../../types';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickServiceTemplate {
  artType: ArtType;
  label: string;
  defaultQty: number;
  defaultTime: number;
  defaultComplexity: Complexity;
  iconText: string;
}

const QUICK_TEMPLATES: QuickServiceTemplate[] = [
  {
    artType: 'feed_simples',
    label: 'Feed Simples',
    defaultQty: 10,
    defaultTime: 30,
    defaultComplexity: 'simples',
    iconText: '📱',
  },
  {
    artType: 'feed_elaborado',
    label: 'Feed Elaborado',
    defaultQty: 5,
    defaultTime: 45,
    defaultComplexity: 'media',
    iconText: '🎨',
  },
  {
    artType: 'story',
    label: 'Stories',
    defaultQty: 5,
    defaultTime: 20,
    defaultComplexity: 'simples',
    iconText: '⚡',
  },
  {
    artType: 'carrossel',
    label: 'Carrossel',
    defaultQty: 1,
    defaultTime: 60,
    defaultComplexity: 'media',
    iconText: '📚',
  },
  {
    artType: 'capa',
    label: 'Capa / Banner',
    defaultQty: 1,
    defaultTime: 45,
    defaultComplexity: 'media',
    iconText: '🖼️',
  },
  {
    artType: 'thumbnail',
    label: 'Thumbnail',
    defaultQty: 3,
    defaultTime: 25,
    defaultComplexity: 'simples',
    iconText: '▶️',
  },
  {
    artType: 'outro',
    label: 'Outro Serviço',
    defaultQty: 1,
    defaultTime: 40,
    defaultComplexity: 'media',
    iconText: '✨',
  },
];

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addItem, settings } = useApp();

  const [artType, setArtType] = useState<ArtType>('feed_simples');
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [timePerArtMinutes, setTimePerArtMinutes] = useState(30);
  const [complexity, setComplexity] = useState<Complexity>('simples');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSelectTemplate = (tmpl: QuickServiceTemplate) => {
    setArtType(tmpl.artType);
    setQuantity(tmpl.defaultQty);
    setTimePerArtMinutes(tmpl.defaultTime);
    setComplexity(tmpl.defaultComplexity);
    if (tmpl.artType !== 'outro') {
      setCustomName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    addItem({
      artType,
      customName: artType === 'outro' ? customName.trim() || 'Serviço personalizado' : undefined,
      quantity: Math.max(1, quantity),
      timePerArtMinutes: Math.max(1, timePerArtMinutes),
      complexity,
      notes: notes.trim() || undefined,
      producedQuantity: 0,
      status: 'pendente',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Adicionar Serviço ao Projeto
              </h2>
              <p className="text-xs text-neutral-500">
                Selecione um formato ou configure as quantidades e tempos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Templates Buttons */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Modelos rápidos de serviço
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_TEMPLATES.map((tmpl) => {
              const isSelected = artType === tmpl.artType;
              return (
                <button
                  key={tmpl.artType}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-1 ring-indigo-600'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span className="text-sm">{tmpl.iconText}</span>
                  <span className="text-xs font-semibold truncate">{tmpl.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Custom Name if outro */}
          {artType === 'outro' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Nome do serviço customizado *
              </label>
              <input
                type="text"
                placeholder="Ex: Identidade Visual, Folder, Cardápio..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Quantidade & Tempo por unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Tempo por unidade (min) *
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={timePerArtMinutes}
                onChange={(e) =>
                  setTimePerArtMinutes(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Complexidade */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Complexidade técnica
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['simples', 'media', 'complexa'] as Complexity[]).map((level) => {
                const mult = settings.complexityMultipliers[level];
                const isSelected = complexity === level;
                const labels = {
                  simples: 'Simples',
                  media: 'Média',
                  complexa: 'Complexa',
                };
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setComplexity(level)}
                    className={`py-2 px-2 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-600'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600 text-xs'
                    }`}
                  >
                    <div className="text-xs">{labels[level]}</div>
                    <div className="text-[10px] text-neutral-400">{mult.toFixed(1)}x</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Observação do item (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Posts de ofertas com fotos de produtos enviadas pelo cliente"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral-600 hover:bg-neutral-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
              id="btn-confirm-add-service"
            >
              Adicionar ao Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
