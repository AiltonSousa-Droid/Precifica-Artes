import React, { useState } from 'react';
import {
  DollarSign,
  Percent,
  Sliders,
  Clock,
  Wrench,
  FileCheck,
  RotateCcw,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Check,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { RoundingMode, ToolItem } from '../../types';
import { formatBRL } from '../../utils/calculations';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportAllDataJSON,
    importAllDataJSON,
    resetAllToDefaults,
  } = useApp();

  const [savedMessage, setSavedMessage] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // New tool form
  const [toolName, setToolName] = useState('');
  const [toolCost, setToolCost] = useState('');
  const [toolProjects, setToolProjects] = useState('10');

  const showSaveNotice = () => {
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleAddTool = () => {
    if (!toolName.trim()) return;
    const cost = parseFloat(toolCost.replace(',', '.')) || 0;
    const proj = parseInt(toolProjects) || 1;

    const newTool: ToolItem = {
      id: `tool-${Date.now()}`,
      name: toolName.trim(),
      monthlyCost: cost,
      projectsPerMonth: proj,
      active: true,
    };

    updateSettings({
      ...settings,
      recurringTools: [...settings.recurringTools, newTool],
    });

    setToolName('');
    setToolCost('');
    setToolProjects('10');
    showSaveNotice();
  };

  const handleRemoveTool = (id: string) => {
    updateSettings({
      ...settings,
      recurringTools: settings.recurringTools.filter((t) => t.id !== id),
    });
    showSaveNotice();
  };

  const handleExport = () => {
    const json = exportAllDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `precifica-artes-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllDataJSON(content);
      if (success) {
        setImportError(null);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
        showSaveNotice();
      } else {
        setImportError('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-28 md:pb-16 space-y-8" id="settings-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            Configurações do Sistema
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500">
            Ajuste multiplicadores, taxas, ferramentas e informações comerciais padrão. Salvo automaticamente.
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Configurações salvas!</span>
          </div>
        )}
      </div>

      {/* 1. FINANCEIRO */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-base text-neutral-900">
            Parâmetros Financeiros Padrão
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Valor da hora padrão (R$)
            </label>
            <input
              type="number"
              min={1}
              value={settings.financial.defaultHourlyRate}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  financial: {
                    ...settings.financial,
                    defaultHourlyRate: Math.max(0, parseFloat(e.target.value) || 0),
                  },
                });
                showSaveNotice();
              }}
              className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Alíquota de impostos padrão (%)
            </label>
            <input
              type="number"
              min={0}
              max={80}
              step={0.5}
              value={settings.financial.defaultTaxPercent}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  financial: {
                    ...settings.financial,
                    defaultTaxPercent: Math.max(0, parseFloat(e.target.value) || 0),
                  },
                });
                showSaveNotice();
              }}
              className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Margem de lucro padrão (%)
            </label>
            <input
              type="number"
              min={0}
              max={80}
              step={1}
              value={settings.financial.defaultMarginPercent}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  financial: {
                    ...settings.financial,
                    defaultMarginPercent: Math.max(0, parseFloat(e.target.value) || 0),
                  },
                });
                showSaveNotice();
              }}
              className="w-full text-sm font-bold px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Arredondamento Comercial
            </label>
            <select
              value={settings.financial.roundingMode}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  financial: {
                    ...settings.financial,
                    roundingMode: e.target.value as RoundingMode,
                  },
                });
                showSaveNotice();
              }}
              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white"
            >
              <option value="final_7">Final 7 (Ex: R$297, R$497)</option>
              <option value="final_9">Final 9 (Ex: R$279, R$349)</option>
              <option value="commercial">Valores Comerciais (7 ou 9)</option>
              <option value="none">Sem Arredondamento (Centavos)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. MULTIPLICADORES: COMPLEXIDADE, URGÊNCIA & FAIXAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Complexidade */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-sm text-neutral-900">
              Multiplicadores de Complexidade
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Simples
              </label>
              <input
                type="number"
                step={0.1}
                min={0.5}
                value={settings.complexityMultipliers.simples}
                onChange={(e) => {
                  updateSettings({
                    ...settings,
                    complexityMultipliers: {
                      ...settings.complexityMultipliers,
                      simples: parseFloat(e.target.value) || 1.0,
                    },
                  });
                  showSaveNotice();
                }}
                className="w-full text-xs font-bold p-2 rounded-xl border border-neutral-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Média
              </label>
              <input
                type="number"
                step={0.1}
                min={0.5}
                value={settings.complexityMultipliers.media}
                onChange={(e) => {
                  updateSettings({
                    ...settings,
                    complexityMultipliers: {
                      ...settings.complexityMultipliers,
                      media: parseFloat(e.target.value) || 1.5,
                    },
                  });
                  showSaveNotice();
                }}
                className="w-full text-xs font-bold p-2 rounded-xl border border-neutral-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Complexa
              </label>
              <input
                type="number"
                step={0.1}
                min={0.5}
                value={settings.complexityMultipliers.complexa}
                onChange={(e) => {
                  updateSettings({
                    ...settings,
                    complexityMultipliers: {
                      ...settings.complexityMultipliers,
                      complexa: parseFloat(e.target.value) || 2.0,
                    },
                  });
                  showSaveNotice();
                }}
                className="w-full text-xs font-bold p-2 rounded-xl border border-neutral-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Urgência */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-sm text-neutral-900">
              Multiplicadores de Urgência
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Normal (1.0x)
              </label>
              <input
                type="number"
                step={0.05}
                min={1}
                value={settings.urgencyMultipliers.normal}
                onChange={(e) => {
                  updateSettings({
                    ...settings,
                    urgencyMultipliers: {
                      ...settings.urgencyMultipliers,
                      normal: parseFloat(e.target.value) || 1.0,
                    },
                  });
                  showSaveNotice();
                }}
                className="w-full text-xs font-bold p-2 rounded-xl border border-neutral-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Urgente (ex: 1.2x)
              </label>
              <input
                type="number"
                step={0.05}
                min={1}
                value={settings.urgencyMultipliers.urgente}
                onChange={(e) => {
                  updateSettings({
                    ...settings,
                    urgencyMultipliers: {
                      ...settings.urgencyMultipliers,
                      urgente: parseFloat(e.target.value) || 1.2,
                    },
                  });
                  showSaveNotice();
                }}
                className="w-full text-xs font-bold p-2 rounded-xl border border-neutral-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Muito Urgente (1.4x)
              </label>
              <input
                type="number"
                step={0.05}
                min={1}
                value={settings.urgencyMultipliers.muito_urgente}
                onChange={(e) => {
                  updateSettings({
                    ...settings,
                    urgencyMultipliers: {
                      ...settings.urgencyMultipliers,
                      muito_urgente: parseFloat(e.target.value) || 1.4,
                    },
                  });
                  showSaveNotice();
                }}
                className="w-full text-xs font-bold p-2 rounded-xl border border-neutral-300 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. FERRAMENTAS RECORRENTES (Section 6 & 19) */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-base text-neutral-900">
                Ferramentas Mensais Recorrentes
              </h2>
              <p className="text-xs text-neutral-500">
                Cadastre suas assinaturas (Canva, Adobe, bancos de imagem) para calcular o rateio automático por projeto.
              </p>
            </div>
          </div>
        </div>

        {/* Existing tools list */}
        <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
          {settings.recurringTools.map((tool) => {
            const perProject =
              tool.projectsPerMonth > 0 ? tool.monthlyCost / tool.projectsPerMonth : 0;
            return (
              <div
                key={tool.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/50 hover:bg-neutral-50 transition"
              >
                <div>
                  <h4 className="font-bold text-xs text-neutral-900">{tool.name}</h4>
                  <div className="text-[11px] text-neutral-500">
                    {formatBRL(tool.monthlyCost, 0)}/mês ÷ {tool.projectsPerMonth} projetos estimados
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-black text-indigo-700 block">
                      +{formatBRL(perProject, 2)}
                    </span>
                    <span className="text-[10px] text-neutral-400">custo/projeto</span>
                  </div>

                  <button
                    onClick={() => handleRemoveTool(tool.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Excluir Ferramenta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add new tool */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-neutral-700 mb-2">
            Cadastrar Nova Ferramenta
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Nome (ex: Figma Pro, Midjourney)"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="number"
                placeholder="Valor/mês (R$)"
                value={toolCost}
                onChange={(e) => setToolCost(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <input
                type="number"
                placeholder="Projetos/mês"
                value={toolProjects}
                onChange={(e) => setToolProjects(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddTool}
                className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PERSONALIZAÇÃO DO ORÇAMENTO (Section 15 & 19) */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <FileCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="font-bold text-base text-neutral-900">
              Dados do Profissional & Modelo de Proposta
            </h2>
            <p className="text-xs text-neutral-500">
              Usados automaticamente na geração de orçamentos para WhatsApp e e-mail.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Seu Nome Profissional
            </label>
            <input
              type="text"
              value={settings.proposal.professionalName}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: { ...settings.proposal, professionalName: e.target.value },
                });
                showSaveNotice();
              }}
              placeholder="Ex: Lucas Mendes"
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Nome da Empresa / Estúdio
            </label>
            <input
              type="text"
              value={settings.proposal.companyName}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: { ...settings.proposal, companyName: e.target.value },
                });
                showSaveNotice();
              }}
              placeholder="Ex: LM Design Criativo"
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              WhatsApp para Contato
            </label>
            <input
              type="text"
              value={settings.proposal.whatsapp}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: { ...settings.proposal, whatsapp: e.target.value },
                });
                showSaveNotice();
              }}
              placeholder="(11) 99999-9999"
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Instagram
            </label>
            <input
              type="text"
              value={settings.proposal.instagram}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: { ...settings.proposal, instagram: e.target.value },
                });
                showSaveNotice();
              }}
              placeholder="@lucasdesign"
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Prazo de Entrega Padrão (dias úteis)
            </label>
            <input
              type="number"
              min={1}
              value={settings.proposal.defaultDeadlineDays}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: {
                    ...settings.proposal,
                    defaultDeadlineDays: parseInt(e.target.value) || 5,
                  },
                });
                showSaveNotice();
              }}
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Condições de Pagamento Padrão
            </label>
            <input
              type="text"
              value={settings.proposal.paymentTerms}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: { ...settings.proposal, paymentTerms: e.target.value },
                });
                showSaveNotice();
              }}
              placeholder="50% entrada + 50% na entrega"
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Política de Alterações
            </label>
            <input
              type="text"
              value={settings.proposal.revisionPolicy}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: { ...settings.proposal, revisionPolicy: e.target.value },
                });
                showSaveNotice();
              }}
              placeholder="Alterações adicionais fora do escopo ou após aprovação são cobradas à parte."
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Observações Gerais Padrão
            </label>
            <input
              type="text"
              value={settings.proposal.defaultNotes}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  proposal: { ...settings.proposal, defaultNotes: e.target.value },
                });
                showSaveNotice();
              }}
              placeholder="Proposta válida por 10 dias corridos."
              className="w-full text-xs px-3 py-2 rounded-xl border border-neutral-300 bg-white"
            />
          </div>
        </div>
      </div>

      {/* 5. BACKUP & RESTAURAÇÃO (Section 23: Persistência e backup) */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
          <Download className="w-5 h-5 text-neutral-600" />
          <div>
            <h2 className="font-bold text-base text-neutral-900">
              Backup & Dados Locais
            </h2>
            <p className="text-xs text-neutral-500">
              Exporte seus dados para arquivo JSON ou restaure em outro dispositivo.
            </p>
          </div>
        </div>

        {importError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>{importError}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-bold border border-neutral-300 cursor-pointer transition">
            <Upload className="w-4 h-4 text-neutral-500" />
            <span>Importar Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Deseja realmente restaurar todos os dados e presets aos padrões de fábrica?')) {
                resetAllToDefaults();
                showSaveNotice();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-neutral-500 hover:text-red-600 text-xs font-semibold hover:bg-red-50 rounded-xl transition ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões de Fábrica</span>
          </button>
        </div>
      </div>
    </div>
  );
};
