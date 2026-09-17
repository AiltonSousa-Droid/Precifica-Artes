import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Send,
  Save,
  FileCheck,
  Edit3,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { generateProposalText, generateWhatsAppLink } from '../../utils/proposalGenerator';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSaveModal: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  onOpenSaveModal,
}) => {
  const { input, result, settings } = useApp();
  const [proposalText, setProposalText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const generated = generateProposalText(input, result, settings.proposal);
      setProposalText(generated);
      setIsCopied(false);
      setIsEditing(false);
    }
  }, [isOpen, input, result, settings.proposal]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposalText);
      setIsCopied(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleWhatsApp = () => {
    const link = generateWhatsAppLink(settings.proposal.whatsapp, proposalText);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Orçamento Pronto para o Cliente
              </h3>
              <p className="text-xs text-neutral-500">
                Texto limpo sem métricas ou custos internos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-200/60 transition"
            id="btn-close-proposal-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-medium">Mensagem formatada para WhatsApp / E-mail</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold transition"
              id="btn-toggle-edit-proposal"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Visualizar formato' : 'Editar texto antes de enviar'}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              rows={14}
              className="w-full text-sm font-sans p-4 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-neutral-50 resize-y leading-relaxed text-neutral-800"
              placeholder="Edite a mensagem..."
              id="textarea-proposal-content"
            />
          ) : (
            <div
              className="w-full text-sm font-sans p-4.5 rounded-xl border border-neutral-200/90 bg-neutral-50/80 whitespace-pre-wrap leading-relaxed text-neutral-800 shadow-inner select-all"
              id="div-proposal-preview"
            >
              {proposalText}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-amber-600 font-bold text-sm">🔒</span>
            <div>
              <strong className="font-semibold">Privacidade garantida:</strong> Custos de ferramentas, horas detalhadas, valor da hora, impostos e margens de lucro foram ocultados e permanecem 100% confidenciais.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={onOpenSaveModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 text-sm font-semibold transition shadow-xs"
              id="btn-proposal-save-budget"
            >
              <Save className="w-4 h-4 text-neutral-500" />
              <span>Salvar Orçamento</span>
            </button>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition shadow-xs"
              id="btn-proposal-whatsapp"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopy}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition shadow-xs ${
                isCopied
                  ? 'bg-neutral-800'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              }`}
              id="btn-proposal-copy"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Orçamento</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
