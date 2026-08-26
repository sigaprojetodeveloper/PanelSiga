import React from 'react';
import { Award } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

interface FinancialTabProps {
  financialData: {
    grandTotal: number;
    totalBanners: number;
    totalStories: number;
    totalContracts: number;
    totalStores?: number;
    days: Array<{
      dateStr: string;
      dateLabel: string;
      banners: number;
      stories: number;
      contracts: number;
      stores?: number;
      total: number;
    }>;
  };
  financialStartDate: string;
  setFinancialStartDate: (val: string) => void;
  financialEndDate: string;
  setFinancialEndDate: (val: string) => void;
  financialIncludeBanners: boolean;
  setFinancialIncludeBanners: (val: boolean) => void;
  financialIncludeStories: boolean;
  setFinancialIncludeStories: (val: boolean) => void;
  financialIncludeContracts: boolean;
  setFinancialIncludeContracts: (val: boolean) => void;
  financialIncludeStores?: boolean;
  setFinancialIncludeStores?: (val: boolean) => void;
}

export const FinancialTab: React.FC<FinancialTabProps> = ({
  financialData,
  financialStartDate,
  setFinancialStartDate,
  financialEndDate,
  setFinancialEndDate,
  financialIncludeBanners,
  setFinancialIncludeBanners,
  financialIncludeStories,
  setFinancialIncludeStories,
  financialIncludeContracts,
  setFinancialIncludeContracts,
  financialIncludeStores = true,
  setFinancialIncludeStores
}) => {
  const { info } = useToast();

  return (
    <div>
      {/* Grand Total Highlight */}
      <div className="financial-total-card">
        <div>
          <span className="financial-total-label">
            Total Geral (Período Selecionado)
          </span>
          <h1 className="financial-total-value">
            R$ {financialData.grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
        </div>
        <div className="financial-total-icon-container">
          <Award size={32} />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar financial-filters-bar">
        <div className="financial-filters-group">
          <div className="filter-control">
            <label>Data de Início</label>
            <input
              type="date"
              className="input-field"
              value={financialStartDate}
              onChange={(e) => setFinancialStartDate(e.target.value)}
            />
          </div>
          <div className="filter-control">
            <label>Data de Término</label>
            <input
              type="date"
              className="input-field"
              value={financialEndDate}
              onChange={(e) => setFinancialEndDate(e.target.value)}
            />
          </div>
          <div className="financial-checkboxes-container">
            <div className="filter-control filter-control-checkbox">
              <input
                type="checkbox"
                id="incBanners"
                checked={financialIncludeBanners}
                onChange={(e) => setFinancialIncludeBanners(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="incBanners" style={{ cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '13px', fontWeight: 600 }}>Exibir Banners</label>
            </div>
            <div className="filter-control filter-control-checkbox">
              <input
                type="checkbox"
                id="incStories"
                checked={financialIncludeStories}
                onChange={(e) => setFinancialIncludeStories(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="incStories" style={{ cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '13px', fontWeight: 600 }}>Exibir Stories</label>
            </div>
            <div className="filter-control filter-control-checkbox">
              <input
                type="checkbox"
                id="incContracts"
                checked={financialIncludeContracts}
                onChange={(e) => setFinancialIncludeContracts(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="incContracts" style={{ cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '13px', fontWeight: 600 }}>Exibir Contratos</label>
            </div>
            {setFinancialIncludeStores && (
              <div className="filter-control filter-control-checkbox">
                <input
                  type="checkbox"
                  id="incStores"
                  checked={financialIncludeStores}
                  onChange={(e) => setFinancialIncludeStores(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="incStores" style={{ cursor: 'pointer', margin: 0, textTransform: 'none', fontSize: '13px', fontWeight: 600 }}>Exibir Lojas</label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid for Charts */}
      <div className="financial-charts-grid">
        {/* Left: Line Chart */}
        <div className="financial-chart-card">
          <h3 style={{ fontSize: '16px', marginBottom: '24px', fontFamily: 'var(--font-title)' }}>
            Histórico de Receitas
          </h3>

          {/* Legend */}
          <div className="financial-chart-legend">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '4px', backgroundColor: '#ef4444', borderRadius: '2px' }} />
              <span style={{ fontWeight: 600 }}>Total Geral</span>
            </div>
            {financialIncludeBanners && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '4px', backgroundColor: '#3b82f6', borderRadius: '2px' }} />
                <span>Banners</span>
              </div>
            )}
            {financialIncludeStories && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '4px', backgroundColor: '#8b5cf6', borderRadius: '2px' }} />
                <span>Stories</span>
              </div>
            )}
            {financialIncludeContracts && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '4px', backgroundColor: '#10b981', borderRadius: '2px' }} />
                <span>Contratos</span>
              </div>
            )}
            {financialIncludeStores && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '4px', backgroundColor: '#f59e0b', borderRadius: '2px' }} />
                <span>Lojas</span>
              </div>
            )}
          </div>

          {/* SVG Chart */}
          {financialData.days.length === 0 ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Carregando dados financeiros...
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <svg viewBox="0 0 650 300" style={{ width: '100%', height: 'auto', minWidth: '600px' }}>
                {/* Grid Lines */}
                {(() => {
                  const maxVal = Math.max(...financialData.days.map(d => d.total), 100) * 1.1;
                  const gridLines = [0, 0.25, 0.5, 0.75, 1];
                  return gridLines.map((ratio) => {
                    const y = 40 + (1 - ratio) * 220;
                    const val = ratio * maxVal;
                    return (
                      <g key={ratio}>
                        <line x1="50" y1={y} x2="600" y2={y} stroke="var(--border-light)" strokeDasharray="4 4" />
                        <text x="40" y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
                          R$ {val.toFixed(0)}
                        </text>
                      </g>
                    );
                  });
                })()}

                {/* X Axis Labels */}
                {financialData.days.map((day, index) => {
                  const step = Math.max(1, Math.ceil(financialData.days.length / 10));
                  if (index % step !== 0) return null;
                  const x = 50 + index * ((600 - 50) / (financialData.days.length - 1 || 1));
                  return (
                    <text key={day.dateStr} x={x} y="280" textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">
                      {day.dateLabel}
                    </text>
                  );
                })}

                {/* Line Paths & Dots */}
                {(() => {
                  const maxVal = Math.max(...financialData.days.map(d => d.total), 100) * 1.1;
                  const pointsBanners: string[] = [];
                  const pointsStories: string[] = [];
                  const pointsContracts: string[] = [];
                  const pointsStores: string[] = [];
                  const pointsTotal: string[] = [];
                  const stepX = (600 - 50) / (financialData.days.length - 1 || 1);

                  financialData.days.forEach((day, index) => {
                    const x = 50 + index * stepX;
                    const yBanners = 260 - ((day.banners / maxVal) * 220);
                    const yStories = 260 - ((day.stories / maxVal) * 220);
                    const yContracts = 260 - (((day.contracts || 0) / maxVal) * 220);
                    const yStores = 260 - (((day.stores || 0) / maxVal) * 220);
                    const yTotal = 260 - ((day.total / maxVal) * 220);

                    pointsBanners.push(`${x},${yBanners}`);
                    pointsStories.push(`${x},${yStories}`);
                    pointsContracts.push(`${x},${yContracts}`);
                    pointsStores.push(`${x},${yStores}`);
                    pointsTotal.push(`${x},${yTotal}`);
                  });

                  return (
                    <>
                      {financialIncludeBanners && (
                        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={pointsBanners.join(' ')} />
                      )}
                      {financialIncludeStories && (
                        <polyline fill="none" stroke="#8b5cf6" strokeWidth="2" points={pointsStories.join(' ')} />
                      )}
                      {financialIncludeContracts && (
                        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={pointsContracts.join(' ')} />
                      )}
                      {financialIncludeStores && (
                        <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={pointsStores.join(' ')} />
                      )}
                      <polyline fill="none" stroke="#ef4444" strokeWidth="3" points={pointsTotal.join(' ')} />

                      {financialData.days.length <= 15 && financialData.days.map((day, index) => {
                        const x = 50 + index * stepX;
                        const yTotal = 260 - ((day.total / maxVal) * 220);
                        return (
                          <circle
                            key={day.dateStr}
                            cx={x}
                            cy={yTotal}
                            r="4"
                            fill="#ef4444"
                            stroke="#fff"
                            strokeWidth="1.5"
                            style={{ cursor: 'pointer' }}
                            onClick={() => info(`${day.dateLabel} - Total: R$ ${day.total.toFixed(2)} (Banners: R$ ${day.banners.toFixed(2)}, Stories: R$ ${day.stories.toFixed(2)}, Contratos: R$ ${(day.contracts || 0).toFixed(2)}, Lojas: R$ ${(day.stores || 0).toFixed(2)})`)}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>

        {/* Right: Pie Chart Card */}
        <div className="financial-chart-card financial-pie-card">
          <h3 style={{ fontSize: '16px', marginBottom: '24px', fontFamily: 'var(--font-title)', alignSelf: 'flex-start' }}>
            Divisão de Receitas (Pizza)
          </h3>

          {(() => {
            const totalVal = financialData.totalBanners + financialData.totalStories + (financialData.totalContracts || 0) + (financialData.totalStores || 0);
            const bannerPct = totalVal > 0 ? (financialData.totalBanners / totalVal) * 100 : 0;
            const storyPct = totalVal > 0 ? (financialData.totalStories / totalVal) * 100 : 0;
            const contractPct = totalVal > 0 ? ((financialData.totalContracts || 0) / totalVal) * 100 : 0;
            const storePct = totalVal > 0 ? ((financialData.totalStores || 0) / totalVal) * 100 : 0;

            const p1 = bannerPct;
            const p2 = p1 + storyPct;
            const p3 = p2 + contractPct;

            return (
              <div className="financial-pie-wrapper">
                <div className="financial-pie-circle" style={{
                  background: totalVal > 0
                    ? `conic-gradient(#3b82f6 0% ${p1}%, #8b5cf6 ${p1}% ${p2}%, #10b981 ${p2}% ${p3}%, #f59e0b ${p3}% 100%)`
                    : '#e5e7eb',
                }}>
                  <div className="financial-pie-inner">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total</span>
                    <span className="financial-pie-total-value">R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="financial-pie-legend">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
                      <span>Banners</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      R$ {financialData.totalBanners.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({bannerPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#8b5cf6' }} />
                      <span>Stories</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      R$ {financialData.totalStories.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({storyPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                      <span>Contratos</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      R$ {(financialData.totalContracts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({contractPct.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
                      <span>Lojas</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>
                      R$ {(financialData.totalStores || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({storePct.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Table details */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Banners</th>
                <th>Stories</th>
                <th>Contratos</th>
                <th>Lojas</th>
                <th>Total do Dia</th>
              </tr>
            </thead>
            <tbody>
              {financialData.days.map((day) => (
                <tr key={day.dateStr}>
                  <td style={{ fontWeight: 600 }}>{day.dateLabel}</td>
                  <td>R$ {day.banners.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>R$ {day.stories.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>R$ {(day.contracts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>R$ {(day.stores || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    R$ {day.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

