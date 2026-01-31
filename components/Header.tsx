
import React, { useState } from 'react';

interface HeaderProps {
  selectedMonths: string[];
  onMonthsChange: (months: string[]) => void;
  onOpenSources: () => void;
  onOpenManual: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
  activeTab: 'extrato' | 'graficos';
  onTabChange: (tab: 'extrato' | 'graficos') => void;
}

const Header: React.FC<HeaderProps> = ({ 
  selectedMonths, 
  onMonthsChange,
  onOpenSources, 
  onOpenManual,
  isSyncing, 
  onRefresh,
  activeTab,
  onTabChange
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  
  // Gera anos de 2024 até 2070
  const startYear = 2024;
  const endYear = 2070;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const toggleMonth = (mId: string) => {
    if (selectedMonths.includes(mId)) {
      onMonthsChange(selectedMonths.filter(m => m !== mId));
    } else {
      onMonthsChange([...selectedMonths, mId]);
    }
  };

  const selectAllOfYear = () => {
    const all = months.map((_, i) => `${viewYear}-${String(i + 1).padStart(2, '0')}`);
    // Adiciona os meses do ano atual aos já selecionados de outros anos
    const filtered = selectedMonths.filter(m => !m.startsWith(`${viewYear}-`));
    onMonthsChange([...filtered, ...all]);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
              <i className="fas fa-wallet"></i>
            </div>
            <h1 className="text-lg font-black text-slate-900 hidden lg:block tracking-tighter uppercase">Strato</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 transition-all border border-slate-200"
              >
                <i className="far fa-calendar-alt text-indigo-500"></i>
                <span className="hidden xs:inline">Período</span>
                <span className="bg-indigo-600 text-white text-[10px] px-1.5 rounded-full ml-1">
                  {selectedMonths.length}
                </span>
                <i className={`fas fa-chevron-down text-[10px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute top-12 left-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="relative">
                        <button 
                          onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                          className="flex items-center gap-1.5 text-[11px] font-black text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest p-1 -ml-1 rounded-md"
                        >
                          {viewYear}
                          <i className={`fas fa-chevron-down text-[8px] transition-transform ${isYearPickerOpen ? 'rotate-180' : ''}`}></i>
                        </button>
                        
                        {isYearPickerOpen && (
                          <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-slate-100 rounded-lg shadow-xl py-1 z-[60] animate-in fade-in slide-in-from-top-1 duration-150 overflow-y-auto max-h-60 custom-scrollbar">
                            {years.map(y => (
                              <button 
                                key={y} 
                                onClick={() => {
                                  setViewYear(y);
                                  setIsYearPickerOpen(false);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-[10px] font-bold ${viewYear === y ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50'}`}
                              >
                                {y}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={selectAllOfYear} className="text-[10px] font-bold text-indigo-600 hover:underline">Selecionar {viewYear}</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto mt-1 custom-scrollbar">
                      {months.map((name, i) => {
                        const mId = `${viewYear}-${String(i + 1).padStart(2, '0')}`;
                        const isSelected = selectedMonths.includes(mId);
                        return (
                          <button
                            key={mId}
                            onClick={() => toggleMonth(mId)}
                            className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${isSelected ? 'bg-indigo-50/80 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                              {isSelected && <i className="fas fa-check text-[8px] text-white"></i>}
                            </div>
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl ml-2">
              <button 
                onClick={() => onTabChange('extrato')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'extrato' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <i className="fas fa-list-ul"></i>
                <span className="hidden sm:inline">Extrato</span>
              </button>
              <button 
                onClick={() => onTabChange('graficos')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'graficos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <i className="fas fa-chart-pie"></i>
                <span className="hidden sm:inline">Gráficos</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={onRefresh}
            disabled={isSyncing}
            className={`p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all ${isSyncing ? 'animate-spin' : ''}`}
            title="Sincronizar dados"
          >
            <i className="fas fa-sync-alt text-sm sm:text-base"></i>
          </button>
          
          <button 
            onClick={onOpenManual}
            className="p-2 sm:px-4 sm:py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs sm:text-sm font-bold transition-all border border-indigo-100 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            <span className="hidden sm:inline">Novo</span>
          </button>

          <button 
            onClick={onOpenSources}
            className="p-2 sm:px-4 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-all shadow-md flex items-center gap-2"
          >
            <i className="fas fa-cog"></i>
            <span className="hidden lg:inline">Configurar</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
