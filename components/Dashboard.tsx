
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Transaction, SourceKey } from '../types';

interface DashboardProps {
  transactions: Transaction[];
}

type TimeFilter = 'all' | 'today' | '7days' | '15days' | '30days' | 'custom';

const SOURCE_CONFIG: Record<string, { label: string; color: string }> = {
  nubank_pj_pix: { label: 'Nubank PJ', color: '#492261' },
  nubank_pf_pix: { label: 'Nubank PF', color: '#AB11DE' },
  nubank_cc: { label: 'Nubank Cartão', color: '#D4373F' },
  picpay_pf_pix: { label: 'PicPay PF', color: '#15CE6A' },
  picpay_pj_pix: { label: 'PicPay PJ', color: '#0A442E' },
  manual: { label: 'Manual', color: '#6366f1' }
};

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const parseDate = (dStr: string) => {
    const [day, month, year] = dStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredTransactions = useMemo(() => {
    if (timeFilter === 'all') return transactions;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return transactions.filter(t => {
      const tDate = parseDate(t.date);
      tDate.setHours(0, 0, 0, 0);

      switch (timeFilter) {
        case 'today':
          return tDate.getTime() === now.getTime();
        case '7days': {
          const limit = new Date(now);
          limit.setDate(now.getDate() - 7);
          return tDate >= limit;
        }
        case '15days': {
          const limit = new Date(now);
          limit.setDate(now.getDate() - 15);
          return tDate >= limit;
        }
        case '30days': {
          const limit = new Date(now);
          limit.setDate(now.getDate() - 30);
          return tDate >= limit;
        }
        case 'custom': {
          if (!customRange.start || !customRange.end) return true;
          const start = new Date(customRange.start);
          const end = new Date(customRange.end);
          return tDate >= start && tDate <= end;
        }
        default:
          return true;
      }
    });
  }, [transactions, timeFilter, customRange]);

  const chartData = useMemo(() => {
    // 1. Gastos por Fonte
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    const expensesTotal = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenseSourceMap: Record<string, number> = {};
    expenses.forEach(t => {
      const config = SOURCE_CONFIG[t.source] || SOURCE_CONFIG.manual;
      const label = t.source === 'manual' && t.manualSourceLabel ? t.manualSourceLabel : config.label;
      expenseSourceMap[label] = (expenseSourceMap[label] || 0) + Math.abs(t.amount);
    });
    const expenseSourceData = Object.entries(expenseSourceMap)
      .map(([name, value]) => ({ 
        name, value, 
        color: Object.values(SOURCE_CONFIG).find(c => c.label === name)?.color || '#94a3b8' 
      }))
      .sort((a, b) => b.value - a.value);

    // 2. Saldo por Fonte
    const balanceSourceMap: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const config = SOURCE_CONFIG[t.source] || SOURCE_CONFIG.manual;
      const label = t.source === 'manual' && t.manualSourceLabel ? t.manualSourceLabel : config.label;
      balanceSourceMap[label] = (balanceSourceMap[label] || 0) + t.amount;
    });
    const balanceSourceData = Object.entries(balanceSourceMap)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ 
        name, value, 
        color: Object.values(SOURCE_CONFIG).find(c => c.label === name)?.color || '#94a3b8' 
      }))
      .sort((a, b) => b.value - a.value);
    const balanceTotal = balanceSourceData.reduce((sum, item) => sum + item.value, 0);

    // 3. Evolução Mensal (Ganhos, Gastos, Saldo)
    const monthlyMap: Record<string, { income: number; expense: number; month: string; sortKey: string }> = {};
    filteredTransactions.forEach(t => {
      const [d, m, y] = t.date.split('/');
      const monthKey = `${m}/${y}`;
      const sortKey = `${y}-${m}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0, month: monthKey, sortKey };
      }
      if (t.type === 'income') monthlyMap[monthKey].income += t.amount;
      else monthlyMap[monthKey].expense += Math.abs(t.amount);
    });

    const evolutionData = Object.values(monthlyMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(item => ({
        ...item,
        balance: item.income - item.expense
      }));

    return { expenseSourceData, balanceSourceData, expensesTotal, balanceTotal, evolutionData };
  }, [filteredTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-xs font-bold">
          {label && <p className="text-slate-400 mb-2 uppercase tracking-widest text-[9px]">{label}</p>}
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                <span className="text-slate-600 font-medium">{p.name}:</span>
              </div>
              <span className="text-slate-900">{formatCurrency(p.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const FilterButton = ({ id, label }: { id: TimeFilter; label: string }) => (
    <button
      onClick={() => setTimeFilter(id)}
      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
        timeFilter === id 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Período */}
      <div className="flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-full px-4 py-2 flex items-center gap-4 shadow-sm">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
            <i className="far fa-calendar-alt text-slate-400 text-sm"></i>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <FilterButton id="all" label="Tudo" />
            <FilterButton id="today" label="Hoje" />
            <FilterButton id="7days" label="7 Dias" />
            <FilterButton id="15days" label="15 Dias" />
            <FilterButton id="30days" label="30 Dias" />
            <FilterButton id="custom" label="Custom" />
          </div>
        </div>
      </div>

      {timeFilter === 'custom' && (
        <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <input 
            type="date" 
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={customRange.start}
            onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
          />
          <span className="text-slate-300 text-xs">até</span>
          <input 
            type="date" 
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={customRange.end}
            onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
          />
        </div>
      )}

      {/* Grid de Gráficos de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Fonte */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-arrow-down text-rose-500"></i>
              Gastos por Fonte
            </h3>
            <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full uppercase">Saídas</span>
          </div>
          <div className="h-[250px] relative">
            {chartData.expenseSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.expenseSourceData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {chartData.expenseSourceData.map((entry, index) => (
                      <Cell key={`cell-exp-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs text-center px-4">Sem saídas no período</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total Saídas</span>
              <span className="text-sm font-black text-slate-800">{formatCurrency(chartData.expensesTotal)}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
            {chartData.expenseSourceData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                  <span className="truncate font-medium">{entry.name}</span>
                </div>
                <span className="font-black text-slate-900 ml-1">{chartData.expensesTotal > 0 ? Math.round((entry.value / chartData.expensesTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Saldo por Fonte */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <i className="fas fa-wallet text-indigo-500"></i>
              Saldo por Fonte
            </h3>
            <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase">Líquido</span>
          </div>
          <div className="h-[250px] relative">
            {chartData.balanceSourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData.balanceSourceData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {chartData.balanceSourceData.map((entry, index) => (
                      <Cell key={`cell-bal-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-xs text-center px-4">Sem saldo positivo no período</div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total Positivo</span>
              <span className="text-sm font-black text-slate-800">{formatCurrency(chartData.balanceTotal)}</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2">
            {chartData.balanceSourceData.map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                  <span className="truncate font-medium">{entry.name}</span>
                </div>
                <span className="font-black text-slate-900 ml-1">{chartData.balanceTotal > 0 ? Math.round((entry.value / chartData.balanceTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução de Vendas/Finanças (Smooth Line/Area) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <i className="fas fa-chart-line text-indigo-600"></i>
            Evolução Mensal
          </h3>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Ganhos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Gastos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Saldo</span>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          {chartData.evolutionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Ganhos"
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Gastos"
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fill="transparent"
                  dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  name="Saldo"
                  stroke="#4f46e5" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                  dot={{ r: 5, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-6">
              <i className="fas fa-chart-area text-4xl mb-4 opacity-20"></i>
              <p className="text-sm font-medium italic">Selecione mais períodos para visualizar a evolução financeira.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
