
import React from 'react';
import { Target, CheckCircle2, RotateCcw, TrendingDown } from 'lucide-react';

const HistoryExplorer = ({ history }) => {
    // Filter history for significant events (Hits or Resets)
    const events = history.filter(h => h.hits.length > 0 || h.resetTriggered).slice(0, 50);

    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Hit & Reset History</h3>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Last 50 Major Events</p>
                </div>
                <div className="flex gap-4 text-xs font-bold text-gray-400">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div> Hits
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Global Resets
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Week</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event Type</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Targets</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Resulting Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {events.map((ev, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-gray-700">W-{621 - ev.week}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {ev.hits.length > 0 && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase">
                                                <CheckCircle2 size={12} /> Elite Pair Hit
                                            </span>
                                        )}
                                        {ev.resetTriggered && (
                                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase">
                                                <RotateCcw size={12} /> 50% Profit Reset
                                            </span>
                                        )}
                                        {ev.hits.length === 0 && !ev.resetTriggered && (
                                            <span className="text-[10px] font-bold text-gray-300 uppercase">Natural Growth</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {ev.hits.map((h, hIdx) => (
                                            <div key={hIdx} className="flex gap-1">
                                                {h.pair.map(num => (
                                                    <span key={num} className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-blue-100">
                                                        {num}
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                        {ev.hits.length === 0 && <span className="text-xs text-gray-400">—</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-gray-600">
                                        {ev.hits.length > 0 ? `Level ${ev.hits[0].step + 1}` : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-bold ${ev.revenue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                        {ev.revenue > 0 ? `+${ev.revenue.toLocaleString()}` : '0'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${ev.profit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {ev.profit > 0 ? `+${ev.profit.toLocaleString()}` : ev.profit.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">Debt: {ev.totalDebt.toLocaleString()}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                <p className="text-xs text-gray-500 italic">Showing deep hits that satisfied the 50% Profit rule across the 621-week archive.</p>
                <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <TrendingDown size={18} />
                </button>
            </div>
        </div>
    );
};

export default HistoryExplorer;
