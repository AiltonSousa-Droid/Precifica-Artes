export type ArtType =
  | 'feed_simples'
  | 'feed_elaborado'
  | 'story'
  | 'carrossel'
  | 'capa'
  | 'thumbnail'
  | 'outro';

export type Complexity = 'simples' | 'media' | 'complexa';

export type UrgencyLevel = 'normal' | 'urgente' | 'muito_urgente';

export type RoundingMode = 'none' | 'final_9' | 'final_7' | 'commercial';

export type BudgetStatus =
  | 'rascunho'
  | 'enviado'
  | 'aprovado'
  | 'producao'
  | 'entregue'
  | 'perdido';

export type ItemStatus =
  | 'pendente'
  | 'em_producao'
  | 'em_revisao'
  | 'aprovado'
  | 'entregue';

export type PricingTier = 'minimo' | 'recomendado' | 'premium';

export interface ProjectCostItem {
  id: string;
  name: string;
  value: number;
}

export interface ProjectItem {
  id: string;
  artType: ArtType;
  customName?: string;
  quantity: number;
  timePerArtMinutes: number;
  complexity: Complexity;
  notes?: string;
  producedQuantity?: number;
  status?: ItemStatus;
}

export interface ItemCalculationResult {
  itemId: string;
  artType: ArtType;
  label: string;
  customName?: string;
  quantity: number;
  timePerArtMinutes: number;
  complexity: Complexity;
  complexityMultiplier: number;
  totalMinutes: number;
  estimatedValue: number;
  producedQuantity: number;
  remainingQuantity: number;
  status: ItemStatus;
}

export interface ToolItem {
  id: string;
  name: string;
  monthlyCost: number;
  projectsPerMonth: number;
  active: boolean;
}

export interface ProposalSettings {
  professionalName: string;
  companyName: string;
  whatsapp: string;
  instagram: string;
  paymentTerms: string;
  defaultDeadlineDays: number;
  revisionPolicy: string;
  defaultNotes: string;
}

export interface AppSettings {
  financial: {
    defaultHourlyRate: number;
    defaultTaxPercent: number;
    defaultMarginPercent: number;
    roundingMode: RoundingMode;
  };
  complexityMultipliers: {
    simples: number;
    media: number;
    complexa: number;
  };
  urgencyMultipliers: {
    normal: number;
    urgente: number;
    muito_urgente: number;
  };
  pricingTiersMultipliers: {
    minimo: number;
    recomendado: number;
    premium: number;
  };
  revisions: {
    includedRounds: number;
    timePerRoundMinutes: number;
    additionalModel: 'fixed' | 'hourly';
    additionalFixedPrice: number;
    additionalMinutes: number;
  };
  recurringTools: ToolItem[];
  proposal: ProposalSettings;
}

export interface CalculationInput {
  clientName: string;
  projectName: string;
  items: ProjectItem[];
  
  // Optional extra times in minutes for the whole project
  briefingMinutes: number;
  communicationMinutes: number;
  researchMinutes: number;
  exportMinutes: number;
  
  // Alterações
  includedRevisionRounds: number;
  revisionMinutesPerRound: number;
  additionalRevisionModel: 'fixed' | 'hourly';
  additionalRevisionPrice: number;
  additionalRevisionMinutes: number;

  // Hourly Rate & Direct Costs
  hourlyRate: number;
  directCosts: ProjectCostItem[];
  selectedToolIds: string[];

  // Taxes, Margin, Urgency
  taxRatePercent: number;
  marginPercent: number;
  urgency: UrgencyLevel;

  // Selected tier
  chosenTier: PricingTier;
  deadlineDays: number;

  // Backward compatibility fields
  quantity?: number;
  artType?: ArtType;
  complexity?: Complexity;
  timePerArtMinutes?: number;
}

export interface TimeBreakdown {
  productionMinutes: number;
  complementaryMinutes: number;
  briefingMinutes: number;
  communicationMinutes: number;
  researchMinutes: number;
  exportMinutes: number;
  revisionMinutes: number;
  totalMinutes: number;
  totalHours: number;
}

export interface CalculationResult {
  itemsBreakdown: ItemCalculationResult[];
  totalDeliverables: number;
  timeBreakdown: TimeBreakdown;
  laborCost: number;
  operationalCosts: number;
  toolsCost: number;
  totalCost: number; // labor + operational + tools
  
  urgencyMultiplier: number;
  urgencyAddPercent: number;

  rawBasePrice: number; // before urgency
  rawRecommendedPrice: number; // with urgency

  priceMinimo: number;
  priceRecomendado: number;
  pricePremium: number;

  effectivePrice: number; // based on chosen tier
  averagePricePerArt: number;
  effectiveHourlyRate: number;

  estimatedTaxes: number;
  estimatedProfit: number;

  isInvalid: boolean;
  validationError?: string;
}

export interface BudgetRecord {
  id: string;
  client: string;
  projectName: string;
  date: string; // YYYY-MM-DD or ISO
  totalValue: number;
  chosenTier: PricingTier;
  totalDeliverables: number;
  items: ProjectItem[];
  status: BudgetStatus;
  deadlineDays: number;
  proposalText: string;
  notes?: string;
  inputSnapshot: CalculationInput;
  calculationSnapshot: CalculationResult;
  createdAt: number;
  updatedAt: number;
  closedValue?: number; // Valor efetivamente fechado/negociado
  closedDate?: string; // Data de aprovação/fechamento

  // Backward compatibility
  quantity?: number;
  artType?: ArtType;
  complexity?: Complexity;
}

export interface PresetItem {
  id: string;
  name: string;
  description: string;
  items: ProjectItem[];
  briefingMinutes?: number;
  exportMinutes?: number;
  includedRevisionRounds?: number;
  isDefault?: boolean;

  // Backward compatibility
  quantity?: number;
  artType?: ArtType;
  timePerArtMinutes?: number;
  complexity?: Complexity;
}
