import React, { useState } from 'react';
import {
  BookmarkCheck,
  Plus,
  Clock,
  Layers,
  ArrowRight,
  Edit2,
  Trash2,
  Sparkles,
  X,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { ArtType, Complexity, PresetItem } from '../../types';
import { formatMinutes } from '../../utils/calculations';

export const PresetsView: React.FC = () => {
  const { presets, addPreset, updatePreset, deletePreset, applyPreset, setActiveTab } =
    useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [artType, setArtType] = useState<ArtType>('feed_simples');
  const [timePerArtMinutes, setTimePerArtMinutes] = useState(30);
  const [complexity, setComplexity] = useState<Complexity>('simples');
  const [briefingMinutes, setBriefingMinutes] = useState(30);
  const [exportMinutes, setExportMinutes] = useState(30);

  const handleOpenCreate = () => {
    setEditingPresetId(null);
    setName('');
    setDescription('');
    setQuantity(10);
    setArtType('feed_simples');
    setTimePerArtMinutes(30);
    setComplexity('simples');
    setBriefingMinutes(30);
    setExportMinutes(30);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (preset: PresetItem) => {
    setEditingPresetId(preset.id);
    setName(preset.name);
    setDescription(preset.description);
    setQuantity(preset.quantity);
    setArtType(preset.artType);
    setTimePerArtMinutes(preset.timePerArtMinutes);
    setComplexity(preset.complexity);
    setBriefingMinutes(preset.briefingMinutes ?? 30);
    setExportMinutes(preset.exportMinutes ?? 30);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPresetId) {
      updatePreset(editingPresetId, {
        name: name.trim(),
        description: description.trim(),
        items: [
          {
            id: `item-${Date.now()}`,
            artType,
            quantity,
            timePerArtMinutes,
            complexity,
            producedQuantity: 0,
            status: 'pendente',
          },
        ],
        quantity,
        artType,
        timePerArtMinutes,
        complexity,
        briefingMinutes,
        exportMinutes,
      });
    } else {
      addPreset({
        name: name.trim(),
        description: description.trim(),
        items: [
          {
            id: `item-${Date.now()}`,
            artType,
            quantity,
            timePerArtMinutes,
            complexity,
            producedQuantity: 0,
            status: 'pendente',
          },
        ],
        quantity,
        artType,
        timePerArtMinutes,
        complexity,
        briefingMinutes,
        exportMinutes,
        isDefault: false,
      });
    }

    setIsModalOpen(false);
  };

  const handleApply = (preset: PresetItem) => {
    applyPreset(preset);
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
    });
    setActiveTab('calculadora');
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24 md:pb-12" id="presets-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            Meus Presets de Precificação
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            Pacotes pré-configurados para você precificar com 1 clique e padronizar suas propostas.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition"
          id="btn-create-preset"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Preset</span>
        </button>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((preset) => {
          const hasItems = preset.items && preset.items.length > 0;
          const totalVolume = hasItems
            ? preset.items.reduce((s, it) => s + it.quantity, 0)
            : preset.quantity || 0;
          const totalEstimatedMinutes = hasItems
            ? preset.items.reduce((s, it) => s + it.quantity * it.timePerArtMinutes, 0) +
              (preset.briefingMinutes ?? 30) +
              (preset.exportMinutes ?? 30)
            : (preset.quantity || 0) * (preset.timePerArtMinutes || 30) +
              (preset.briefingMinutes ?? 30) +
              (preset.exportMinutes ?? 30);

          return (
            <div
              key={preset.id}
              className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between group"
              id={`preset-card-${preset.id}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                    <BookmarkCheck className="w-4 h-4" />
                  </span>
                  {preset.isDefault && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      Padrão
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-neutral-900 mb-1 group-hover:text-indigo-600 transition">
                  {preset.name}
                </h3>
                <p className="text-xs text-neutral-500 mb-3 min-h-[32px] leading-relaxed">
                  {preset.description || 'Configuração rápida para projetos desse formato.'}
                </p>

                {/* Multi-item breakdown tags if combo */}
                {hasItems && preset.items.length > 1 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {preset.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50/70 text-indigo-700 border border-indigo-100"
                      >
                        {it.quantity}× {it.artType.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Specs */}
                <div className="space-y-2 bg-neutral-50 p-3 rounded-xl border border-neutral-100 text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Volume Total:</span>
                    <strong className="text-neutral-900">{totalVolume} peças</strong>
                  </div>
                  {!hasItems || preset.items.length <= 1 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Tempo por arte:</span>
                        <strong className="text-neutral-900">
                          {hasItems ? preset.items[0].timePerArtMinutes : preset.timePerArtMinutes} min
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500">Complexidade:</span>
                        <strong className="text-neutral-900 capitalize">
                          {hasItems ? preset.items[0].complexity : preset.complexity}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Serviços no pacote:</span>
                      <strong className="text-neutral-900">{preset.items.length} tipos</strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                    <span className="text-neutral-500">Tempo total aprox:</span>
                    <strong className="text-indigo-600 font-extrabold">
                      {formatMinutes(totalEstimatedMinutes)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div>
                <button
                  type="button"
                  onClick={() => handleApply(preset)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs transition mb-2 shadow-2xs"
                  id={`btn-apply-preset-${preset.id}`}
                >
                  <span>Aplicar na Calculadora</span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(preset)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                    title="Editar Preset"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!preset.isDefault && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Excluir o preset "${preset.name}"?`)) {
                          deletePreset(preset.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Excluir Preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preset Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
              <h3 className="font-bold text-base text-neutral-900">
                {editingPresetId ? 'Editar Preset' : 'Criar Novo Preset'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nome do Preset *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 8 Thumbnails YouTube"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descrição breve
                </label>
                <input
                  type="text"
                  placeholder="Ex: 8 thumbs chamativas com 45min cada"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Quantidade de peças
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Tipo de arte
                  </label>
                  <select
                    value={artType}
                    onChange={(e) => setArtType(e.target.value as ArtType)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-neutral-300 bg-white font-medium"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Tempo por arte (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={timePerArtMinutes}
                    onChange={(e) =>
                      setTimePerArtMinutes(Math.max(5, parseInt(e.target.value) || 5))
                    }
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Complexidade
                  </label>
                  <select
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value as Complexity)}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-neutral-300 bg-white font-medium"
                  >
                    <option value="simples">Simples (1,0x)</option>
                    <option value="media">Média (1,5x)</option>
                    <option value="complexa">Complexa (2,0x)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {editingPresetId ? 'Atualizar Preset' : 'Salvar Preset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
