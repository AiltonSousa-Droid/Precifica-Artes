import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  LineChart,
  Calendar,
  ChevronDown,
  ChevronUp,
  Percent,
  Sparkles,
} from 'lucide-react';
import { BudgetRecord } from '../../types';
import { formatBRL } from '../../utils/calculations';

interface BudgetFinancialAnalyticsProps {
  budgets: BudgetRecord[];
}

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export const BudgetFinancialAnalytics: React.FC<BudgetFinancialAnalyticsProps> = ({
  budgets,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'bars' | 'area'>('bars');
  const [viewMode, setViewMode] = useState<'monthly' | 'projects'>('monthly');
  const [timeRange, setTimeRange] = useState<'all' | '6months' | '3months'>('all');

  // Classification of Closed status
  const isClosed = (status: string) =>
    ['aprovado', 'producao', 'entregue'].includes(status);

  // Filter budgets by time range
  const filteredBudgets = useMemo(() => {
    if (timeRange === 'all') return budgets;
    const now = new Date();
    const monthsBack = timeRange === '3months' ? 3 : 6;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).getTime();

    return budgets.filter((b) => {
      const bTime = new Date(b.date || b.createdAt).getTime();
      return bTime >= cutoff;
    });
  }, [budgets, timeRange]);

  // Overall KPIs
  const metrics = useMemo(() => {
    let totalOrcado = 0;
    let totalFechado = 0;
    let countOrcado = budgets.length;
    let countFechado = 0;
    let countPendente = 0;
    let countPerdido = 0;
    let totalPendente = 0;

    budgets.forEach((b) => {
      const val = b.totalValue || 0;
      totalOrcado += val;

      if (isClosed(b.status)) {
        countFechado += 1;
        totalFechado += b.closedValue ?? val;
      } else if (b.status === 'perdido') {
        countPerdido += 1;
      } else {
        // rascunho, enviado
        countPendente += 1;
        totalPendente += val;
      }
    });

    const conversionRateValue =
      totalOrcado > 0 ? Math.round((totalFechado / totalOrcado) * 100) : 0;
    const conversionRateCount =
      countOrcado > 0 ? Math.round((countFechado / countOrcado) * 100) : 0;
    const averageClosedTicket =
      countFechado > 0 ? Math.round(totalFechado / countFechado) : 0;

    return {
      totalOrcado,
      totalFechado,
      totalPendente,
      countOrcado,
      countFechado,
      countPendente,
      countPerdido,
      conversionRateValue,
      conversionRateCount,
      averageClosedTicket,
    };
  }, [budgets]);

  // Monthly aggregated data
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        year: number;
        month: number;
        orcado: number;
        fechado: number;
        countTotal: number;
        countFechado: number;
      }
    >();

    // Sort budgets chronologically
    const sorted = [...filteredBudgets].sort((a, b) => {
      const da = new Date(a.date || a.createdAt).getTime();
      const db = new Date(b.date || b.createdAt).getTime();
      return da - db;
    });

    sorted.forEach((b) => {
      const d = new Date(b.date || b.createdAt);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[month]}/${String(year).slice(2)}`;

      const current = map.get(key) || {
        key,
        label,
        year,
        month,
        orcado: 0,
        fechado: 0,
        countTotal: 0,
        countFechado: 0,
      };

      const val = b.totalValue || 0;
      current.orcado += val;
      current.countTotal += 1;

      if (isClosed(b.status)) {
        current.fechado += b.closedValue ?? val;
        current.countFechado += 1;
      }

      map.set(key, current);
    });

    const result = Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    return result.map((item) => ({
      ...item,
      taxaConversao:
        item.orcado > 0 ? Math.round((item.fechado / item.orcado) * 100) : 0,
    }));
  }, [filteredBudgets]);

  // Per-project data (recent 10 projects)
  const projectsData = useMemo(() => {
    const sorted = [...filteredBudgets]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10)
      .reverse();

    return sorted.map((b) => {
      const closed = isClosed(b.status);
      const clientTruncated =
        b.client.length > 14 ? b.client.slice(0, 13) + '…' : b.client;

      return {
        id: b.id,
        name: clientTruncated,
        fullName: `${b.client} - ${b.projectName}`,
        orcado: b.totalValue || 0,
        fechado: closed ? b.closedValue ?? b.totalValue : 0,
        status: b.status,
        date: new Date(b.date || b.createdAt).toLocaleDateString('pt-BR'),
      };
    });
  }, [filteredBudgets]);

  const activeChartData = viewMode === 'monthly' ? monthlyData : projectsData;

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const orcadoVal = data.orcado ?? 0;
      const fechadoVal = data.fechado ?? 0;
      const taxa =
        orcadoVal > 0 ? Math.round((fechadoVal / orcadoVal) * 100) : 0;

      return (
        <div className="bg-neutral-900/95 backdrop-blur-md text-white text-xs p-3.5 rounded-xl border border-neutral-800 shadow-2xl space-y-1.5 min-w-[200px]">
          <div className="font-bold text-neutral-200 border-b border-neutral-800 pb-1 flex items-center justify-between">
            <span>{data.fullName || label}</span>
            {data.date && (
              <span className="text-[10px] text-neutral-400 font-normal">
                {data.date}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Valor Orçado:
            </span>
            <strong className="text-indigo-300 font-black">
              {formatBRL(orcadoVal, 0)}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Valor Fechado:
            </span>
            <strong className="text-emerald-400 font-black">
              {formatBRL(fechadoVal, 0)}
            </strong>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-800 text-[11px]">
            <span className="text-neutral-400">Taxa de Conversão:</span>
            <span
              className={`font-black ${
                taxa >= 70
                  ? 'text-emerald-400'
                  : taxa >= 40
                  ? 'text-amber-300'
                  : 'text-neutral-400'
              }`}
            >
              {taxa}%
            </span>
          </div>

          {data.countTotal !== undefined && (
            <div className="text-[10px] text-neutral-400 pt-0.5">
              {data.countFechado} de {data.countTotal} projetos convertidos
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs mb-6 overflow-hidden">
      {/* Analytics Card Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-neutral-100 bg-gradient-to-r from-neutral-50/70 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Desempenho Financeiro: Orçado vs Fechado</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Sparkles className="w-3 h-3" /> Recharts
              </span>
            </h2>
            <p className="text-xs text-neutral-500">
              Acompanhe sua taxa de conversão comercial e o histórico de faturamento
              real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Quick toggle expanded */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-900 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 transition"
            id="btn-toggle-analytics-panel"
          >
            <span>{isExpanded ? 'Recolher Gráfico' : 'Expandir Gráfico'}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-500" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="p-4 sm:p-6 space-y-6"
          >
            {/* KPI Metric Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total Orçado */}
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200/70">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
                  <span>Total Orçado</span>
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-lg sm:text-xl font-black text-neutral-900">
                  {formatBRL(metrics.totalOrcado, 0)}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {metrics.countOrcado} propostas geradas
                </div>
              </div>

              {/* Total Fechado (Receita Ganha) */}
              <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-200/70">
                <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
                  <span>Total Fechado (Ganho)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-950">
                  {formatBRL(metrics.totalFechado, 0)}
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {metrics.countFechado} projetos convertidos
                </div>
              </div>

              {/* Taxa de Conversão */}
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200/70">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
                  <span>Taxa de Conversão</span>
                  <Percent className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-indigo-950">
                    {metrics.conversionRateValue}%
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    em valor ({metrics.conversionRateCount}% em qtd)
                  </span>
                </div>
                <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, metrics.conversionRateValue)}%` }}
                  />
                </div>
              </div>

              {/* Ticket Médio Fechado */}
              <div className="bg-neutral-50 rounded-xl p-3.5 border border-neutral-200/70">
                <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1">
                  <span>Ticket Médio Fechado</span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-lg sm:text-xl font-black text-neutral-900">
                  {formatBRL(metrics.averageClosedTicket, 0)}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  por projeto aprovado
                </div>
              </div>
            </div>

            {/* Controls Bar for Chart: View Type, Chart Style, Time Range */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl text-xs font-bold text-neutral-600">
                <button
                  type="button"
                  onClick={() => setViewMode('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewMode === 'monthly'
                      ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  Agrupado por Mês
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('projects')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewMode === 'projects'
                      ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                      : 'hover:text-neutral-900'
                  }`}
                >
                  Últimos Orçamentos
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Chart Style (Bars vs Area) */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs text-neutral-600">
                  <button
                    type="button"
                    onClick={() => setChartType('bars')}
                    className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                      chartType === 'bars'
                        ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                        : 'hover:text-neutral-900'
                    }`}
                    title="Gráfico de Barras"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Barras</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('area')}
                    className={`p-1.5 rounded-lg transition flex items-center gap-1 ${
                      chartType === 'area'
                        ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                        : 'hover:text-neutral-900'
                    }`}
                    title="Gráfico de Área"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Área</span>
                  </button>
                </div>

                {/* Range Filter */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-neutral-300 bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">Todo Histórico</option>
                  <option value="6months">Últimos 6 meses</option>
                  <option value="3months">Últimos 3 meses</option>
                </select>
              </div>
            </div>

            {/* Recharts Container */}
            <div className="bg-neutral-50/50 rounded-2xl p-3 sm:p-4 border border-neutral-200/80">
              {activeChartData.length === 0 ? (
                <div className="py-16 text-center text-xs text-neutral-500">
                  Não há dados suficientes no período selecionado para exibir o
                  gráfico.
                </div>
              ) : (
                <div className="h-[280px] sm:h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bars' ? (
                      <BarChart
                        data={activeChartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                          vertical={false}
                        />
                        <XAxis
                          dataKey={viewMode === 'monthly' ? 'label' : 'name'}
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `R$ ${val}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{
                            fontSize: '11px',
                            fontWeight: 600,
                            paddingBottom: '12px',
                          }}
                        />
                        <Bar
                          dataKey="orcado"
                          name="Valor Orçado"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                        <Bar
                          dataKey="fechado"
                          name="Valor Fechado"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                      </BarChart>
                    ) : (
                      <AreaChart
                        data={activeChartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorOrcado"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#6366f1"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="95%"
                              stopColor="#6366f1"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="colorFechado"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0.0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                          vertical={false}
                        />
                        <XAxis
                          dataKey={viewMode === 'monthly' ? 'label' : 'name'}
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={{ stroke: '#e5e7eb' }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#6b7280' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => `R$ ${val}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{
                            fontSize: '11px',
                            fontWeight: 600,
                            paddingBottom: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="orcado"
                          name="Valor Orçado"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorOrcado)"
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                        <Area
                          type="monotone"
                          dataKey="fechado"
                          name="Valor Fechado"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorFechado)"
                          isAnimationActive={true}
                          animationDuration={800}
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legend note / Insight */}
              <div className="mt-3 pt-3 border-t border-neutral-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-neutral-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                    <strong>Orçado:</strong> propostas enviadas
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <strong>Fechado:</strong> status aprovado, produção ou entregue
                  </span>
                </div>
                <span className="text-neutral-400">
                  Valores atualizados em tempo real conforme você altera status dos orçamentos
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
