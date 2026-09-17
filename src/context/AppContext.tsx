import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppSettings,
  BudgetRecord,
  BudgetStatus,
  CalculationInput,
  CalculationResult,
  ItemStatus,
  PresetItem,
  PricingTier,
  ProjectItem,
} from '../types';
import { calculatePricing } from '../utils/calculations';
import {
  DEFAULT_PRESETS,
  DEFAULT_SETTINGS,
  INITIAL_INPUT,
} from '../utils/defaults';
import { generateProposalText } from '../utils/proposalGenerator';

interface DashboardMetrics {
  totalBudgetsThisMonth: number;
  totalValueThisMonth: number;
  approvedCount: number;
  approvalRatePercent: number;
}

interface AppContextType {
  activeTab: 'calculadora' | 'orcamentos' | 'presets' | 'configuracoes';
  setActiveTab: (tab: 'calculadora' | 'orcamentos' | 'presets' | 'configuracoes') => void;
  quickMode: boolean;
  setQuickMode: (quick: boolean) => void;
  input: CalculationInput;
  updateInput: (updates: Partial<CalculationInput>) => void;
  resetInput: () => void;
  addItem: (itemData: Omit<ProjectItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<ProjectItem>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  result: CalculationResult;
  budgets: BudgetRecord[];
  presets: PresetItem[];
  metrics: DashboardMetrics;
  saveBudget: (
    client: string,
    projectName: string,
    status: BudgetStatus,
    notes?: string,
    tierOverride?: PricingTier
  ) => BudgetRecord;
  updateBudget: (id: string, updates: Partial<BudgetRecord>) => void;
  deleteBudget: (id: string) => void;
  duplicateBudget: (id: string) => BudgetRecord | null;
  loadBudgetToCalculator: (budget: BudgetRecord) => void;
  updateBudgetItemProgress: (
    budgetId: string,
    itemId: string,
    delta: number,
    newStatus?: ItemStatus
  ) => void;
  updateBudgetItemStatus: (
    budgetId: string,
    itemId: string,
    newStatus: ItemStatus
  ) => void;
  addPreset: (preset: Omit<PresetItem, 'id'>) => void;
  updatePreset: (id: string, updates: Partial<PresetItem>) => void;
  deletePreset: (id: string) => void;
  applyPreset: (preset: PresetItem) => void;
  exportAllDataJSON: () => string;
  importAllDataJSON: (jsonString: string) => boolean;
  resetAllToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SETTINGS_KEY = 'precifica_artes_settings_v1';
const INPUT_KEY = 'precifica_artes_input_v1';
const BUDGETS_KEY = 'precifica_artes_budgets_v1';
const PRESETS_KEY = 'precifica_artes_presets_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'orcamentos' | 'presets' | 'configuracoes'>('calculadora');
  const [quickMode, setQuickMode] = useState<boolean>(false);

  // Load Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          financial: { ...DEFAULT_SETTINGS.financial, ...parsed.financial },
          complexityMultipliers: { ...DEFAULT_SETTINGS.complexityMultipliers, ...parsed.complexityMultipliers },
          urgencyMultipliers: { ...DEFAULT_SETTINGS.urgencyMultipliers, ...parsed.urgencyMultipliers },
          pricingTiersMultipliers: { ...DEFAULT_SETTINGS.pricingTiersMultipliers, ...parsed.pricingTiersMultipliers },
          revisions: { ...DEFAULT_SETTINGS.revisions, ...parsed.revisions },
          proposal: { ...DEFAULT_SETTINGS.proposal, ...parsed.proposal },
          recurringTools: parsed.recurringTools || DEFAULT_SETTINGS.recurringTools,
        };
      }
    } catch (e) {
      console.error('Error loading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Load Input
  const [input, setInput] = useState<CalculationInput>(() => {
    try {
      const saved = localStorage.getItem(INPUT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure items array exists and is populated
        let items: ProjectItem[] = Array.isArray(parsed.items) && parsed.items.length > 0 ? parsed.items : [];
        if (items.length === 0) {
          if (parsed.quantity || parsed.artType) {
            items = [
              {
                id: `item-${Date.now()}`,
                artType: parsed.artType || 'feed_simples',
                quantity: parsed.quantity || 10,
                timePerArtMinutes: parsed.timePerArtMinutes || 30,
                complexity: parsed.complexity || 'simples',
                producedQuantity: 0,
                status: 'pendente',
              },
            ];
          } else {
            items = INITIAL_INPUT.items;
          }
        }
        return { ...INITIAL_INPUT, ...parsed, items };
      }
    } catch (e) {
      console.error('Error loading input from localStorage', e);
    }
    return INITIAL_INPUT;
  });

  // Load Presets
  const [presets, setPresets] = useState<PresetItem[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize presets to ensure items array exists
          return parsed.map((p: PresetItem) => {
            if (!p.items || p.items.length === 0) {
              return {
                ...p,
                items: [
                  {
                    id: `p-${Date.now()}`,
                    artType: p.artType || 'feed_simples',
                    quantity: p.quantity || 10,
                    timePerArtMinutes: p.timePerArtMinutes || 30,
                    complexity: p.complexity || 'simples',
                  },
                ],
              };
            }
            return p;
          });
        }
      }
    } catch (e) {
      console.error('Error loading presets from localStorage', e);
    }
    return DEFAULT_PRESETS;
  });

  // Load Budgets
  const [budgets, setBudgets] = useState<BudgetRecord[]>(() => {
    const createSampleBudgets = (calc: CalculationResult, proposal: string): BudgetRecord[] => {
      const now = Date.now();
      const DAY = 86400000;
      return [
        {
          id: 'budget-sample-1',
          client: 'Studio Glow Cosméticos',
          projectName: 'Campanha Social Feed & Stories (16 Artes)',
          date: new Date(now - DAY * 2).toISOString().split('T')[0],
          totalValue: calc.priceRecomendado || 780,
          closedValue: calc.priceRecomendado || 780,
          chosenTier: 'recomendado',
          totalDeliverables: calc.totalDeliverables,
          items: [
            {
              id: 'item-demo-1',
              artType: 'feed_simples',
              quantity: 10,
              timePerArtMinutes: 30,
              complexity: 'simples',
              notes: 'Posts promocionais',
              producedQuantity: 6,
              status: 'em_producao',
            },
            {
              id: 'item-demo-2',
              artType: 'story',
              quantity: 5,
              timePerArtMinutes: 20,
              complexity: 'simples',
              notes: 'Stories de engajamento',
              producedQuantity: 5,
              status: 'entregue',
            },
            {
              id: 'item-demo-3',
              artType: 'carrossel',
              quantity: 1,
              timePerArtMinutes: 60,
              complexity: 'media',
              notes: 'Carrossel educativo 7 telas',
              producedQuantity: 0,
              status: 'pendente',
            },
          ],
          status: 'producao',
          deadlineDays: 5,
          proposalText: proposal,
          notes: 'Cliente solicitou identidade minimalista nas cores rosé e dourado.',
          inputSnapshot: INITIAL_INPUT,
          calculationSnapshot: calc,
          createdAt: now - DAY * 2,
          updatedAt: now - DAY * 2,
        },
        {
          id: 'budget-sample-2',
          client: 'Barbearia Don Corleone',
          projectName: 'Posts Mensais & Cartazes Promo (8 Artes)',
          date: new Date(now - DAY * 12).toISOString().split('T')[0],
          totalValue: 560,
          closedValue: 560,
          chosenTier: 'recomendado',
          totalDeliverables: 8,
          items: [
            {
              id: 'item-demo-bc1',
              artType: 'feed_elaborado',
              quantity: 8,
              timePerArtMinutes: 45,
              complexity: 'media',
              producedQuantity: 8,
              status: 'aprovado',
            },
          ],
          status: 'aprovado',
          deadlineDays: 4,
          proposalText: proposal,
          notes: 'Aprovado pelo proprietário com 50% de entrada.',
          inputSnapshot: INITIAL_INPUT,
          calculationSnapshot: calc,
          createdAt: now - DAY * 12,
          updatedAt: now - DAY * 10,
        },
        {
          id: 'budget-sample-3',
          client: 'Dra. Camila Nutrição',
          projectName: 'Carrosséis Informativos e Capas Reels (10 Artes)',
          date: new Date(now - DAY * 34).toISOString().split('T')[0],
          totalValue: 920,
          closedValue: 920,
          chosenTier: 'premium',
          totalDeliverables: 10,
          items: [
            {
              id: 'item-demo-cn1',
              artType: 'carrossel',
              quantity: 4,
              timePerArtMinutes: 70,
              complexity: 'complexa',
              producedQuantity: 4,
              status: 'entregue',
            },
            {
              id: 'item-demo-cn2',
              artType: 'capa',
              quantity: 6,
              timePerArtMinutes: 30,
              complexity: 'simples',
              producedQuantity: 6,
              status: 'entregue',
            },
          ],
          status: 'entregue',
          deadlineDays: 7,
          proposalText: proposal,
          notes: 'Projeto finalizado com sucesso e feedback excelente.',
          inputSnapshot: INITIAL_INPUT,
          calculationSnapshot: calc,
          createdAt: now - DAY * 34,
          updatedAt: now - DAY * 24,
        },
        {
          id: 'budget-sample-4',
          client: 'Academia Iron Fit',
          projectName: 'Campanha de Inauguração e Banners (14 Artes)',
          date: new Date(now - DAY * 48).toISOString().split('T')[0],
          totalValue: 1250,
          chosenTier: 'recomendado',
          totalDeliverables: 14,
          items: [
            {
              id: 'item-demo-aif1',
              artType: 'feed_elaborado',
              quantity: 10,
              timePerArtMinutes: 40,
              complexity: 'media',
              producedQuantity: 0,
              status: 'pendente',
            },
          ],
          status: 'perdido',
          deadlineDays: 10,
          proposalText: proposal,
          notes: 'Cliente preferiu aguardar o próximo trimestre.',
          inputSnapshot: INITIAL_INPUT,
          calculationSnapshot: calc,
          createdAt: now - DAY * 48,
          updatedAt: now - DAY * 42,
        },
        {
          id: 'budget-sample-5',
          client: 'Cafeteria Grão Nobre',
          projectName: 'Cardápio Digital & Stories de Ofertas (12 Artes)',
          date: new Date(now - DAY * 68).toISOString().split('T')[0],
          totalValue: 1100,
          closedValue: 1050,
          chosenTier: 'recomendado',
          totalDeliverables: 12,
          items: [
            {
              id: 'item-demo-cgn1',
              artType: 'feed_elaborado',
              quantity: 6,
              timePerArtMinutes: 45,
              complexity: 'media',
              producedQuantity: 6,
              status: 'entregue',
            },
            {
              id: 'item-demo-cgn2',
              artType: 'story',
              quantity: 6,
              timePerArtMinutes: 25,
              complexity: 'simples',
              producedQuantity: 6,
              status: 'entregue',
            },
          ],
          status: 'entregue',
          deadlineDays: 6,
          proposalText: proposal,
          notes: 'Fechado com desconto de R$ 50 para pagamento à vista.',
          inputSnapshot: INITIAL_INPUT,
          calculationSnapshot: calc,
          createdAt: now - DAY * 68,
          updatedAt: now - DAY * 60,
        },
        {
          id: 'budget-sample-6',
          client: 'TechSolutions Software',
          projectName: 'Kit Lançamento de Plataforma SaaS (15 Artes)',
          date: new Date(now - DAY * 95).toISOString().split('T')[0],
          totalValue: 1800,
          closedValue: 1800,
          chosenTier: 'premium',
          totalDeliverables: 15,
          items: [
            {
              id: 'item-demo-ts1',
              artType: 'feed_elaborado',
              quantity: 8,
              timePerArtMinutes: 50,
              complexity: 'complexa',
              producedQuantity: 8,
              status: 'entregue',
            },
            {
              id: 'item-demo-ts2',
              artType: 'carrossel',
              quantity: 4,
              timePerArtMinutes: 65,
              complexity: 'complexa',
              producedQuantity: 4,
              status: 'entregue',
            },
          ],
          status: 'entregue',
          deadlineDays: 12,
          proposalText: proposal,
          notes: 'Contrato corporativo recorrente.',
          inputSnapshot: INITIAL_INPUT,
          calculationSnapshot: calc,
          createdAt: now - DAY * 95,
          updatedAt: now - DAY * 80,
        },
      ];
    };

    try {
      const saved = localStorage.getItem(BUDGETS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const initialCalc = calculatePricing(INITIAL_INPUT, DEFAULT_SETTINGS);
          const initialProposal = generateProposalText(INITIAL_INPUT, initialCalc, DEFAULT_SETTINGS.proposal);
          const defaultSamples = createSampleBudgets(initialCalc, initialProposal);

          let list = parsed;
          // If only 1 old sample budget existed, supplement with the rich sample history
          if (parsed.length <= 1) {
            const existingIds = new Set(parsed.map((p: any) => p.id));
            const newSamples = defaultSamples.filter((s) => !existingIds.has(s.id));
            list = [...parsed, ...newSamples];
          }

          return list.map((b: BudgetRecord) => {
            // Guarantee items array
            let items: ProjectItem[] = Array.isArray(b.items) && b.items.length > 0 ? b.items : [];
            if (items.length === 0) {
              items = [
                {
                  id: `b-item-migrated-1`,
                  artType: b.artType || 'feed_simples',
                  quantity: b.quantity || 1,
                  timePerArtMinutes: 30,
                  complexity: b.complexity || 'simples',
                  producedQuantity: b.status === 'entregue' ? b.quantity || 1 : 0,
                  status: b.status === 'entregue' ? 'entregue' : 'pendente',
                },
              ];
            }
            const totalDeliverables = b.totalDeliverables || items.reduce((s, it) => s + (it.quantity || 0), 0);
            const isClosed = ['aprovado', 'producao', 'entregue'].includes(b.status);
            return {
              ...b,
              items,
              totalDeliverables,
              closedValue: b.closedValue ?? (isClosed ? b.totalValue : undefined),
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading budgets from localStorage', e);
    }
    const initialCalc = calculatePricing(INITIAL_INPUT, DEFAULT_SETTINGS);
    const initialProposal = generateProposalText(INITIAL_INPUT, initialCalc, DEFAULT_SETTINGS.proposal);
    return createSampleBudgets(initialCalc, initialProposal);
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(INPUT_KEY, JSON.stringify(input));
    } catch (e) {
      console.error('Error saving input', e);
    }
  }, [input]);

  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('Error saving presets', e);
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
    } catch (e) {
      console.error('Error saving budgets', e);
    }
  }, [budgets]);

  // Real-time calculation result
  const result = useMemo(() => {
    return calculatePricing(input, settings);
  }, [input, settings]);

  // Dashboard Metrics calculation
  const metrics: DashboardMetrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let thisMonthCount = 0;
    let thisMonthValue = 0;
    let approved = 0;

    budgets.forEach((b) => {
      const budgetDate = new Date(b.date || b.createdAt);
      if (
        budgetDate.getMonth() === currentMonth &&
        budgetDate.getFullYear() === currentYear
      ) {
        thisMonthCount += 1;
        thisMonthValue += b.totalValue;
      }
      if (b.status === 'aprovado' || b.status === 'producao' || b.status === 'entregue') {
        approved += 1;
      }
    });

    const totalDecided = budgets.filter((b) => b.status !== 'rascunho').length;
    const approvalRate = totalDecided > 0 ? Math.round((approved / totalDecided) * 100) : 0;

    return {
      totalBudgetsThisMonth: thisMonthCount,
      totalValueThisMonth: thisMonthValue,
      approvedCount: approved,
      approvalRatePercent: approvalRate,
    };
  }, [budgets]);

  const updateInput = (updates: Partial<CalculationInput>) => {
    setInput((prev) => {
      const next = { ...prev, ...updates };

      // If single-item legacy/quick fields were updated without explicit items, keep items array synced
      if (
        (updates.quantity !== undefined ||
          updates.artType !== undefined ||
          updates.timePerArtMinutes !== undefined ||
          updates.complexity !== undefined) &&
        !updates.items
      ) {
        if (next.items && next.items.length === 1) {
          next.items = [
            {
              ...next.items[0],
              quantity: updates.quantity !== undefined ? updates.quantity : next.items[0].quantity,
              artType: updates.artType !== undefined ? updates.artType : next.items[0].artType,
              timePerArtMinutes:
                updates.timePerArtMinutes !== undefined
                  ? updates.timePerArtMinutes
                  : next.items[0].timePerArtMinutes,
              complexity:
                updates.complexity !== undefined ? updates.complexity : next.items[0].complexity,
            },
          ];
        } else if (!next.items || next.items.length === 0) {
          next.items = [
            {
              id: `item-${Date.now()}`,
              artType: next.artType || 'feed_simples',
              quantity: next.quantity || 1,
              timePerArtMinutes: next.timePerArtMinutes || 30,
              complexity: next.complexity || 'simples',
              status: 'pendente',
              producedQuantity: 0,
            },
          ];
        }
      }

      return next;
    });
  };

  const resetInput = () => {
    setInput({
      ...INITIAL_INPUT,
      hourlyRate: settings.financial.defaultHourlyRate,
      taxRatePercent: settings.financial.defaultTaxPercent,
      marginPercent: settings.financial.defaultMarginPercent,
      includedRevisionRounds: settings.revisions.includedRounds,
      revisionMinutesPerRound: settings.revisions.timePerRoundMinutes,
      additionalRevisionPrice: settings.revisions.additionalFixedPrice,
      deadlineDays: settings.proposal.defaultDeadlineDays,
    });
  };

  const addItem = (itemData: Omit<ProjectItem, 'id'>) => {
    const newItem: ProjectItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      producedQuantity: itemData.producedQuantity || 0,
      status: itemData.status || 'pendente',
    };
    setInput((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const updateItem = (id: string, updates: Partial<ProjectItem>) => {
    setInput((prev) => ({
      ...prev,
      items: (prev.items || []).map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    setInput((prev) => {
      const remaining = (prev.items || []).filter((item) => item.id !== id);
      return {
        ...prev,
        items: remaining,
      };
    });
  };

  const duplicateItem = (id: string) => {
    setInput((prev) => {
      const original = (prev.items || []).find((item) => item.id === id);
      if (!original) return prev;
      const copy: ProjectItem = {
        ...original,
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        customName: original.customName ? `${original.customName} (Cópia)` : undefined,
        notes: original.notes ? `${original.notes}` : undefined,
        producedQuantity: 0,
        status: 'pendente',
      };
      return {
        ...prev,
        items: [...prev.items, copy],
      };
    });
  };

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const applyPreset = (preset: PresetItem) => {
    const newItems: ProjectItem[] =
      preset.items && preset.items.length > 0
        ? preset.items.map((it, idx) => ({
            ...it,
            id: `item-preset-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
            producedQuantity: 0,
            status: 'pendente' as ItemStatus,
          }))
        : [
            {
              id: `item-preset-${Date.now()}`,
              artType: preset.artType || 'feed_simples',
              quantity: preset.quantity || 10,
              timePerArtMinutes: preset.timePerArtMinutes || 30,
              complexity: preset.complexity || 'simples',
              producedQuantity: 0,
              status: 'pendente' as ItemStatus,
            },
          ];

    setInput((prev) => ({
      ...prev,
      items: newItems,
      briefingMinutes: preset.briefingMinutes ?? prev.briefingMinutes,
      exportMinutes: preset.exportMinutes ?? prev.exportMinutes,
      includedRevisionRounds: preset.includedRevisionRounds ?? prev.includedRevisionRounds,
    }));
  };

  const saveBudget = (
    client: string,
    projectName: string,
    status: BudgetStatus,
    notes?: string,
    tierOverride?: PricingTier
  ): BudgetRecord => {
    const tier = tierOverride || input.chosenTier;
    let finalValue = result.priceRecomendado;
    if (tier === 'minimo') finalValue = result.priceMinimo;
    if (tier === 'premium') finalValue = result.pricePremium;

    const proposalText = generateProposalText(
      { ...input, clientName: client, projectName, chosenTier: tier },
      result,
      settings.proposal
    );

    const snapshotItems: ProjectItem[] = (input.items || []).map((it) => ({
      ...it,
      producedQuantity: it.producedQuantity || 0,
      status: it.status || 'pendente',
    }));

    const isInitialClosed = ['aprovado', 'producao', 'entregue'].includes(status);

    const newRecord: BudgetRecord = {
      id: `budget-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      client: client.trim() || 'Cliente sem nome',
      projectName: projectName.trim() || 'Projeto de Design',
      date: new Date().toISOString().split('T')[0],
      totalValue: finalValue,
      closedValue: isInitialClosed ? finalValue : undefined,
      chosenTier: tier,
      totalDeliverables: result.totalDeliverables,
      items: snapshotItems,
      status,
      deadlineDays: input.deadlineDays,
      proposalText,
      notes,
      inputSnapshot: {
        ...input,
        clientName: client,
        projectName,
        items: snapshotItems,
      },
      calculationSnapshot: result,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setBudgets((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updateBudget = (id: string, updates: Partial<BudgetRecord>) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const next = { ...b, ...updates, updatedAt: Date.now() };
        if (
          updates.status &&
          ['aprovado', 'producao', 'entregue'].includes(updates.status) &&
          next.closedValue === undefined
        ) {
          next.closedValue = next.totalValue;
        }
        return next;
      })
    );
  };

  const updateBudgetItemProgress = (
    budgetId: string,
    itemId: string,
    delta: number,
    newStatusOverride?: ItemStatus
  ) => {
    setBudgets((prev) =>
      prev.map((budget) => {
        if (budget.id !== budgetId) return budget;

        const updatedItems = (budget.items || []).map((item) => {
          if (item.id !== itemId) return item;
          const currentProduced = item.producedQuantity || 0;
          const targetProduced = Math.max(0, Math.min(item.quantity, currentProduced + delta));
          let status = item.status || 'pendente';

          if (newStatusOverride) {
            status = newStatusOverride;
          } else if (targetProduced === item.quantity) {
            status = 'entregue';
          } else if (targetProduced > 0) {
            status = 'em_producao';
          } else {
            status = 'pendente';
          }

          return {
            ...item,
            producedQuantity: targetProduced,
            status,
          };
        });

        // Check if overall budget status should advance
        const totalContracted = updatedItems.reduce((s, it) => s + it.quantity, 0);
        const totalProduced = updatedItems.reduce((s, it) => s + (it.producedQuantity || 0), 0);
        let budgetStatus = budget.status;
        if (totalProduced === totalContracted && totalContracted > 0 && budgetStatus !== 'entregue') {
          budgetStatus = 'entregue';
        } else if (totalProduced > 0 && budgetStatus === 'rascunho') {
          budgetStatus = 'producao';
        }

        return {
          ...budget,
          items: updatedItems,
          status: budgetStatus,
          updatedAt: Date.now(),
        };
      })
    );
  };

  const updateBudgetItemStatus = (
    budgetId: string,
    itemId: string,
    newStatus: ItemStatus
  ) => {
    setBudgets((prev) =>
      prev.map((budget) => {
        if (budget.id !== budgetId) return budget;

        const updatedItems = (budget.items || []).map((item) => {
          if (item.id !== itemId) return item;
          let produced = item.producedQuantity || 0;
          if (newStatus === 'entregue') {
            produced = item.quantity;
          }
          return {
            ...item,
            status: newStatus,
            producedQuantity: produced,
          };
        });

        return {
          ...budget,
          items: updatedItems,
          updatedAt: Date.now(),
        };
      })
    );
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const duplicateBudget = (id: string): BudgetRecord | null => {
    const original = budgets.find((b) => b.id === id);
    if (!original) return null;

    const copyItems: ProjectItem[] = (original.items || []).map((it) => ({
      ...it,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      producedQuantity: 0,
      status: 'pendente',
    }));

    const copy: BudgetRecord = {
      ...original,
      id: `budget-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      projectName: `${original.projectName} (Cópia)`,
      date: new Date().toISOString().split('T')[0],
      items: copyItems,
      status: 'rascunho',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setBudgets((prev) => [copy, ...prev]);
    return copy;
  };

  const loadBudgetToCalculator = (budget: BudgetRecord) => {
    if (budget.inputSnapshot) {
      // Re-hydrate items if needed
      const itemsToLoad =
        budget.inputSnapshot.items && budget.inputSnapshot.items.length > 0
          ? budget.inputSnapshot.items
          : budget.items && budget.items.length > 0
          ? budget.items
          : INITIAL_INPUT.items;

      setInput({
        ...budget.inputSnapshot,
        items: itemsToLoad,
      });
    } else if (budget.items && budget.items.length > 0) {
      setInput((prev) => ({
        ...prev,
        clientName: budget.client,
        projectName: budget.projectName,
        items: budget.items,
        chosenTier: budget.chosenTier,
        deadlineDays: budget.deadlineDays,
      }));
    }
    setActiveTab('calculadora');
  };

  const addPreset = (presetData: Omit<PresetItem, 'id'>) => {
    const newPreset: PresetItem = {
      ...presetData,
      id: `preset-${Date.now()}`,
    };
    setPresets((prev) => [...prev, newPreset]);
  };

  const updatePreset = (id: string, updates: Partial<PresetItem>) => {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  const exportAllDataJSON = (): string => {
    const exportData = {
      version: 2,
      appName: 'Precifica Artes',
      exportedAt: new Date().toISOString(),
      settings,
      presets,
      budgets,
      input,
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importAllDataJSON = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.settings) setSettings(data.settings);
      if (data.presets && Array.isArray(data.presets)) setPresets(data.presets);
      if (data.budgets && Array.isArray(data.budgets)) setBudgets(data.budgets);
      if (data.input) setInput(data.input);
      return true;
    } catch (err) {
      console.error('Failed to import JSON data', err);
      return false;
    }
  };

  const resetAllToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setPresets(DEFAULT_PRESETS);
    setInput(INITIAL_INPUT);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(INPUT_KEY);
    localStorage.removeItem(PRESETS_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        quickMode,
        setQuickMode,
        input,
        updateInput,
        resetInput,
        addItem,
        updateItem,
        removeItem,
        duplicateItem,
        settings,
        updateSettings,
        result,
        budgets,
        presets,
        metrics,
        saveBudget,
        updateBudget,
        deleteBudget,
        duplicateBudget,
        loadBudgetToCalculator,
        updateBudgetItemProgress,
        updateBudgetItemStatus,
        addPreset,
        updatePreset,
        deletePreset,
        applyPreset,
        exportAllDataJSON,
        importAllDataJSON,
        resetAllToDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
