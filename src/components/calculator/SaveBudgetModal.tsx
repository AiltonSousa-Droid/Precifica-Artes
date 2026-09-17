import React, { useState } from 'react';
import { X, Check, Save } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { BudgetStatus, PricingTier } from '../../types';
import { formatBRL } from '../../utils/calculations';

interface SaveBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SaveBudgetModal: React.FC<SaveBudgetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { input, result, saveBudget, setActiveTab } = useApp();

  const [client, setClient] = useState(input.clientName || '');
  const [projectName, setProjectName] = useState(
    input.projectName || 'Pacote de Artes Digitais'
  );
  const [status, setStatus] = useState<BudgetStatus>('enviado');
  const [tier, setTier] = useState<PricingTier>(input.chosenTier || 'recomendado');
  const [notes, setNotes] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const getTierValue = () => {
    if (tier === 'minimo') return result.priceMinimo;
    if (tier === 'premium') return result.pricePremium;
    return result.priceRecomendado;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveBudget(client, projectName, status, notes, tier);
    setSavedSuccess(true);
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      setActiveTab('orcamentos');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Salvar no Histórico de Orçamentos
              </h3>
              <p className="text-xs text-neutral-500">
                Acompanhe o status e recupere esta proposta a qualquer momento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-200/60 transition"
            id="btn-close-save-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Ex: Dra. Mariana Silva / Loja Bella"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              id="input-save-client-name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Identidade e 10 Posts Instagram"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              id="input-save-project-name"
            />
          </div>

          {/* Pricing Tier Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Valor / Faixa Selecionada
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTier('minimo')}
                className={`p-2 rounded-xl text-center border transition ${
                  tier === 'minimo'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold text-neutral-500">Mínimo</div>
                <div className="text-xs font-extrabold">{formatBRL(result.priceMinimo, 0)}</div>
              </button>

              <button
                type="button"
                onClick={() => setTier('recomendado')}
                className={`p-2 rounded-xl text-center border transition ${
                  tier === 'recomendado'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold ring-1 ring-indigo-600'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold text-neutral-500">Recomendado</div>
                <div className="text-xs font-extrabold">{formatBRL(result.priceRecomendado, 0)}</div>
              </button>

              <button
                type="button"
                onClick={() => setTier('premium')}
                className={`p-2 rounded-xl text-center border transition ${
                  tier === 'premium'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <div className="text-[10px] uppercase font-semibold text-neutral-500">Premium</div>
                <div className="text-xs font-extrabold">{formatBRL(result.pricePremium, 0)}</div>
              </button>
            </div>
          </div>

          {/* Quantity & Summary pill */}
          <div className="bg-neutral-100/80 rounded-xl p-3 flex items-center justify-between text-xs text-neutral-700">
            <div>
              <span className="font-semibold">{input.quantity} artes</span> ({input.timePerArtMinutes}min/arte)
            </div>
            <div className="font-black text-sm text-neutral-900">
              {formatBRL(getTierValue(), 0)}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Status Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BudgetStatus)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              id="select-save-status"
            >
              <option value="rascunho">Rascunho (Não enviado)</option>
              <option value="enviado">Enviado ao Cliente</option>
              <option value="aprovado">Aprovado pelo Cliente</option>
              <option value="producao">Em Produção</option>
              <option value="entregue">Entregue / Concluído</option>
              <option value="perdido">Perdido / Cancelado</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Observações Internas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex: Cliente prefere pagar via PIX à vista, solicitou entrega para sexta."
              className="w-full text-sm px-3.5 py-2 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              id="textarea-save-notes"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-neutral-600 hover:bg-neutral-100 text-sm font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savedSuccess}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs transition"
              id="btn-confirm-save-budget"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Salvo com sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Orçamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
