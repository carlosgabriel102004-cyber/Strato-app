
import React from 'react';

interface SummaryCardsProps {
  stats: {
    incomeTotal: number;
    incomePix: number;
    incomeCredit: number;
    expensesTotal: number;
    expensesPix: number;
    expensesCredit: number;
    balance: number;
    balancePix: number;
    balanceCredit: number;
  };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  const formatCurrency = (val: number) => {
    const isNegative = val < 0;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(val));
    return isNegative ? `-${formatted}` : formatted;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Entradas Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entradas Consolidadas</p>
        <p className="text-2xl font-black text-emerald-600 mt-1">{formatCurrency(stats.incomeTotal)}</p>
        <div className="mt-3 flex gap-3 border-t border-slate-50 pt-3">
          <div className="text-[10px]">
            <span className="text-slate-400 uppercase font-bold mr-1">Pix:</span>
            <span className="text-emerald-600 font-bold">{formatCurrency(stats.incomePix)}</span>
          </div>
          <div className="text-[10px]">
            <span className="text-slate-400 uppercase font-bold mr-1">Crédito:</span>
            <span className="text-emerald-600 font-bold">{formatCurrency(stats.incomeCredit)}</span>
          </div>
        </div>
      </div>

      {/* Saídas Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saídas Consolidadas</p>
        <p className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(stats.expensesTotal)}</p>
        <div className="mt-3 flex gap-3 border-t border-slate-50 pt-3">
          <div className="text-[10px]">
            <span className="text-slate-400 uppercase font-bold mr-1">Pix:</span>
            <span className="text-rose-600 font-bold">{formatCurrency(stats.expensesPix)}</span>
          </div>
          <div className="text-[10px]">
            <span className="text-slate-400 uppercase font-bold mr-1">Crédito:</span>
            <span className="text-rose-600 font-bold">{formatCurrency(stats.expensesCredit)}</span>
          </div>
        </div>
      </div>

      {/* Saldo Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo do Mês</p>
        <p className={`text-2xl font-black mt-1 ${stats.balance >= 0 ? 'text-indigo-600' : 'text-rose-700'}`}>
          {formatCurrency(stats.balance)}
        </p>
        <div className="mt-3 flex gap-3 border-t border-slate-50 pt-3">
          <div className="text-[10px]">
            <span className="text-slate-400 uppercase font-bold mr-1">Pix:</span>
            <span className={`${stats.balancePix >= 0 ? 'text-indigo-600' : 'text-rose-600'} font-bold`}>{formatCurrency(stats.balancePix)}</span>
          </div>
          <div className="text-[10px]">
            <span className="text-slate-400 uppercase font-bold mr-1">Crédito:</span>
            <span className={`${stats.balanceCredit >= 0 ? 'text-indigo-600' : 'text-rose-600'} font-bold`}>{formatCurrency(stats.balanceCredit)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
