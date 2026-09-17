import {
  AppSettings,
  ArtType,
  CalculationInput,
  CalculationResult,
  ItemCalculationResult,
  ItemStatus,
  ProjectItem,
  RoundingMode,
  TimeBreakdown,
} from '../types';

/**
 * Get human friendly label for an art type
 */
export function getItemLabel(artType: ArtType, customName?: string): string {
  switch (artType) {
    case 'feed_simples':
      return 'Feed simples';
    case 'feed_elaborado':
      return 'Feed elaborado';
    case 'story':
      return 'Stories';
    case 'carrossel':
      return 'Carrossel';
    case 'capa':
      return 'Capa';
    case 'thumbnail':
      return 'Thumbnail';
    case 'outro':
      return customName?.trim() || 'Outro serviço';
    default:
      return 'Arte gráfica';
  }
}

/**
 * Get plural / formatted label for proposals and cards
 */
export function getItemPluralLabel(
  artType: ArtType,
  quantity: number,
  customName?: string
): string {
  const plural = quantity > 1;
  switch (artType) {
    case 'feed_simples':
      return plural ? `${quantity} artes para Feed simples` : `${quantity} arte para Feed simples`;
    case 'feed_elaborado':
      return plural ? `${quantity} artes para Feed elaborado` : `${quantity} arte para Feed elaborado`;
    case 'story':
      return plural ? `${quantity} Stories` : `${quantity} Story`;
    case 'carrossel':
      return plural ? `${quantity} Carrosséis` : `${quantity} Carrossel`;
    case 'capa':
      return plural ? `${quantity} Capas personalizadas` : `${quantity} Capa personalizada`;
    case 'thumbnail':
      return plural ? `${quantity} Thumbnails` : `${quantity} Thumbnail`;
    case 'outro':
      return customName?.trim()
        ? `${quantity}x ${customName.trim()}`
        : plural
        ? `${quantity} peças personalizadas`
        : `${quantity} peça personalizada`;
    default:
      return `${quantity} artes`;
  }
}

/**
 * Format minutes into human readable string e.g. "7h00" or "45min" or "5h30"
 */
export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours === 0) {
    return `${minutes}min`;
  }
  if (minutes === 0) {
    return `${hours}h00`;
  }
  return `${hours}h${minutes < 10 ? '0' : ''}${minutes}`;
}

/**
 * Format currency in Brazilian Real (BRL)
 */
export function formatBRL(value: number, decimals = 2): string {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Commercial rounding helper
 */
export function applyRounding(value: number, mode: RoundingMode): number {
  if (value <= 0) return 0;

  switch (mode) {
    case 'none':
      return Math.round(value * 100) / 100;

    case 'final_9': {
      const base = Math.floor(value);
      const tens = Math.floor(base / 10);
      let candidate = tens * 10 + 9;
      if (candidate < value) {
        candidate += 10;
      }
      return candidate;
    }

    case 'final_7': {
      const base = Math.floor(value);
      const tens = Math.floor(base / 10);
      let candidate = tens * 10 + 7;
      if (candidate < value) {
        candidate += 10;
      }
      return candidate;
    }

    case 'commercial': {
      const base = Math.ceil(value);
      const lastDigit = base % 10;
      if (lastDigit === 7 || lastDigit === 9) return base;
      if (lastDigit < 7) {
        return Math.floor(base / 10) * 10 + 7;
      }
      return Math.floor(base / 10) * 10 + 9;
    }

    default:
      return Math.round(value);
  }
}

/**
 * Calculate full pricing for a project with multiple items (shopping cart)
 */
export function calculatePricing(
  input: CalculationInput,
  settings: AppSettings
): CalculationResult {
  const emptyResult: CalculationResult = {
    itemsBreakdown: [],
    totalDeliverables: 0,
    timeBreakdown: {
      productionMinutes: 0,
      complementaryMinutes: 0,
      briefingMinutes: 0,
      communicationMinutes: 0,
      researchMinutes: 0,
      exportMinutes: 0,
      revisionMinutes: 0,
      totalMinutes: 0,
      totalHours: 0,
    },
    laborCost: 0,
    operationalCosts: 0,
    toolsCost: 0,
    totalCost: 0,
    urgencyMultiplier: 1,
    urgencyAddPercent: 0,
    rawBasePrice: 0,
    rawRecommendedPrice: 0,
    priceMinimo: 0,
    priceRecomendado: 0,
    pricePremium: 0,
    effectivePrice: 0,
    averagePricePerArt: 0,
    effectiveHourlyRate: 0,
    estimatedTaxes: 0,
    estimatedProfit: 0,
    isInvalid: true,
  };

  // Normalize items array with backward-compatibility for single item legacy input
  const items: ProjectItem[] =
    input.items && input.items.length > 0
      ? input.items
      : [
          {
            id: 'item-default-1',
            artType: input.artType || 'feed_simples',
            quantity: Math.max(1, input.quantity || 1),
            timePerArtMinutes: Math.max(1, input.timePerArtMinutes || 30),
            complexity: input.complexity || 'simples',
            producedQuantity: 0,
            status: 'pendente',
          },
        ];

  const totalDeliverables = items.reduce(
    (sum, item) => sum + (Math.max(0, item.quantity) || 0),
    0
  );

  // Validation 1: Negative checks or zero deliverables
  if (
    items.length === 0 ||
    totalDeliverables <= 0 ||
    input.hourlyRate < 0 ||
    input.taxRatePercent < 0 ||
    input.marginPercent < 0
  ) {
    return {
      ...emptyResult,
      validationError:
        'Adicione ao menos um serviço com quantidade válida. Valores financeiros não podem ser negativos.',
    };
  }

  // Validation 2: Impostos + margem >= 100%
  const totalTaxMargin = input.taxRatePercent + input.marginPercent;
  if (totalTaxMargin >= 100) {
    return {
      ...emptyResult,
      validationError: 'Impostos + margem precisam ser menores que 100%.',
    };
  }

  // 1. Time Calculations across all project items
  let totalProductionMinutes = 0;

  const rawItemsBreakdown = items.map((item) => {
    const complexityMultiplier =
      settings.complexityMultipliers[item.complexity] ?? 1.0;
    const qty = Math.max(0, item.quantity);
    const unitTime = Math.max(0, item.timePerArtMinutes);
    const itemMinutes = qty * unitTime * complexityMultiplier;
    totalProductionMinutes += itemMinutes;

    const produced = Math.min(qty, Math.max(0, item.producedQuantity || 0));
    const remaining = Math.max(0, qty - produced);
    const status: ItemStatus =
      item.status ||
      (produced >= qty && qty > 0 ? 'entregue' : produced > 0 ? 'em_producao' : 'pendente');

    return {
      itemId: item.id,
      artType: item.artType,
      label: getItemLabel(item.artType, item.customName),
      customName: item.customName,
      quantity: qty,
      timePerArtMinutes: unitTime,
      complexity: item.complexity,
      complexityMultiplier,
      totalMinutes: itemMinutes,
      estimatedValue: 0, // filled below
      producedQuantity: produced,
      remainingQuantity: remaining,
      status,
    };
  });

  // Complementary project times (belonging to whole project)
  const briefingMinutes = Math.max(0, input.briefingMinutes || 0);
  const communicationMinutes = Math.max(0, input.communicationMinutes || 0);
  const researchMinutes = Math.max(0, input.researchMinutes || 0);
  const exportMinutes = Math.max(0, input.exportMinutes || 0);
  const revisionMinutes = Math.max(
    0,
    (input.includedRevisionRounds || 0) * (input.revisionMinutesPerRound || 0)
  );

  const complementaryMinutes =
    briefingMinutes +
    communicationMinutes +
    researchMinutes +
    exportMinutes +
    revisionMinutes;

  const totalMinutes = totalProductionMinutes + complementaryMinutes;
  const totalHours = totalMinutes / 60;

  const timeBreakdown: TimeBreakdown = {
    productionMinutes: totalProductionMinutes,
    complementaryMinutes,
    briefingMinutes,
    communicationMinutes,
    researchMinutes,
    exportMinutes,
    revisionMinutes,
    totalMinutes,
    totalHours,
  };

  // 2. Labor Cost
  const laborCost = totalHours * input.hourlyRate;

  // 3. Operational Costs (direct costs)
  const operationalCosts = (input.directCosts || []).reduce(
    (acc, item) => acc + (Math.max(0, item.value) || 0),
    0
  );

  // 4. Tools Cost (proportional monthly tools)
  const selectedToolIds = new Set(input.selectedToolIds || []);
  const toolsCost = (settings.recurringTools || []).reduce((acc, tool) => {
    if (selectedToolIds.has(tool.id) && tool.projectsPerMonth > 0) {
      const perProject = tool.monthlyCost / tool.projectsPerMonth;
      return acc + perProject;
    }
    return acc;
  }, 0);

  // Total Direct Cost
  const totalCost = laborCost + operationalCosts + toolsCost;

  // 5. Margin & Tax calculation
  // Formula: Preço base = (Custos + trabalho) ÷ (1 − impostos − margem)
  const taxFraction = input.taxRatePercent / 100;
  const marginFraction = input.marginPercent / 100;
  const denominator = 1 - taxFraction - marginFraction;

  const rawBasePrice = denominator > 0 ? totalCost / denominator : totalCost;

  // 6. Urgency
  const urgencyMultiplier =
    settings.urgencyMultipliers[input.urgency] ?? 1.0;
  const urgencyAddPercent = Math.round((urgencyMultiplier - 1) * 100);

  const rawRecommendedPrice = rawBasePrice * urgencyMultiplier;

  // 7. Pricing Tiers
  const tierMultipliers = settings.pricingTiersMultipliers || {
    minimo: 0.9,
    recomendado: 1.0,
    premium: 1.25,
  };

  const roundingMode = settings.financial.roundingMode;

  const priceRecomendado = applyRounding(rawRecommendedPrice, roundingMode);
  const priceMinimo = applyRounding(
    rawRecommendedPrice * (tierMultipliers.minimo || 0.9),
    roundingMode
  );
  const pricePremium = applyRounding(
    rawRecommendedPrice * (tierMultipliers.premium || 1.25),
    roundingMode
  );

  // Effective price based on chosen tier
  let effectivePrice = priceRecomendado;
  if (input.chosenTier === 'minimo') effectivePrice = priceMinimo;
  if (input.chosenTier === 'premium') effectivePrice = pricePremium;

  // Average price per art / deliverable
  const averagePricePerArt =
    totalDeliverables > 0 ? effectivePrice / totalDeliverables : 0;

  // Distribute estimated value per item proportionally according to production time
  const itemsBreakdown: ItemCalculationResult[] = rawItemsBreakdown.map((item) => {
    let estimatedValue = 0;
    if (totalProductionMinutes > 0) {
      estimatedValue = effectivePrice * (item.totalMinutes / totalProductionMinutes);
    } else if (rawItemsBreakdown.length > 0) {
      estimatedValue = effectivePrice / rawItemsBreakdown.length;
    }
    return {
      ...item,
      estimatedValue,
    };
  });

  // Estimated taxes & profit
  const estimatedTaxes = effectivePrice * taxFraction;
  const estimatedProfit = effectivePrice * marginFraction;

  // Effective hourly rate: (price - costs - taxes) / total hours
  const effectiveHourlyRate =
    totalHours > 0
      ? (effectivePrice - operationalCosts - toolsCost - estimatedTaxes) /
        totalHours
      : 0;

  return {
    itemsBreakdown,
    totalDeliverables,
    timeBreakdown,
    laborCost,
    operationalCosts,
    toolsCost,
    totalCost,
    urgencyMultiplier,
    urgencyAddPercent,
    rawBasePrice,
    rawRecommendedPrice,
    priceMinimo,
    priceRecomendado,
    pricePremium,
    effectivePrice,
    averagePricePerArt,
    effectiveHourlyRate,
    estimatedTaxes,
    estimatedProfit,
    isInvalid: false,
  };
}
