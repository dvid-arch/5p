import React, { useState } from 'react';
import { Repeat, ShieldCheck, Calculator, History, AlertTriangle, CheckCircle2 } from 'lucide-react';

const ChaseTab = ({ analysis }) => {
    if (!analysis) return null;
    const { chasePairs, chaseStats, historicalChaseWins } = analysis;
    const [selectedPair, setSelectedPair] = useState(null);

    const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Strategy Header */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Repeat size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase tracking-widest text-xs mb-3">
                        <ShieldCheck size={14} />
                        Wait-for-Result Strategy
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Fibonacci Chase Tracker</h2>
                    <p className="text-indigo-100/80 max-w-2xl leading-relaxed">
                        The "Chase" strategy identifies co-draw pairs entering their 10-15 week "Hot Window."
                        By skipping the initial 10 weeks and starting a Fibonacci stake progression ($1, $1, $2, $3...)
                        until the win, we maximize capital efficiency and win probability.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Strategy Reliability</div>
                            <div className="text-2xl font-bold">{chaseStats?.winRate || 0}%</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Historical Wins</div>
                            <div className="text-2xl font-bold">{chaseStats?.wins || 0}</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase mb-1">Avg. Wait (After W10)</div>
                            <div className="text-2xl font-bold">{chaseStats?.avgWait || 0} Weeks</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ready Chases List */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Strategy 1: Banker Pairs (1-to-Play) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="text-green-500" size={18} />
                            Banker Pair Trackers (1-to-Play)
                            <span className="text-[10px] font-normal text-gray-400 ml-2">Based on historical rhythm & consistency</span>
                        </h3>

                        {analysis.chaseBankers && analysis.chaseBankers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analysis.chaseBankers.slice(0, 4).map((bp) => (
                                    <div
                                        key={bp.pair}
                                        className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-green-200 transition-all shadow-sm group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-2">
                                                {bp.numbers.map(num => (
                                                    <div key={num} className="w-10 h-10 bg-green-50 text-green-700 border border-green-100 rounded-xl flex items-center justify-center font-black">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className={`text-[9px] font-bold px-2 py-1 rounded-lg uppercase ${bp.status === 'OVERDUE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {bp.status}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="bg-gray-50 p-2 rounded-xl">
                                                <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Consistency</div>
                                                <div className="text-sm font-black text-gray-700">{(bp.consistency * 100).toFixed(0)}%</div>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-xl">
                                                <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Avg Hit</div>
                                                <div className="text-sm font-black text-gray-700">Every {bp.avgGap.toFixed(1)} Wks</div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[11px]">
                                            <span className="text-gray-500">Last hit: <span className="font-bold text-gray-900">{bp.weeksSinceLast} wks ago</span></span>
                                            <span className="text-green-600 font-bold">Due in ~{bp.expectedIn} Wks</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50/50 p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                                No banker pairs currently in the harvest window.
                            </div>
                        )}
                    </div>

                    <hr className="border-gray-100" />

                    {/* Strategy 2: Co-Draw Chases (2-to-Play) */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={18} />
                            Pairs Entering Hot Window (W10-W15)
                            <span className="text-[10px] font-normal text-gray-400 ml-2">Co-draw probability strategy</span>
                        </h3>

                        {chasePairs && chasePairs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {chasePairs.map((cp) => (
                                    <button
                                        key={cp.pair}
                                        onClick={() => setSelectedPair(cp)}
                                        className={`p-6 rounded-2xl border transition-all text-left group ${selectedPair?.pair === cp.pair
                                            ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20'
                                            : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-2">
                                                {cp.pair.split('-').map(num => (
                                                    <div key={num} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-[10px] font-black px-2 py-1 bg-amber-100 text-amber-700 rounded-lg uppercase">
                                                {cp.weeksSinceLast} Wks Empty
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="bg-gray-50 p-2 rounded-xl">
                                                <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Consistency</div>
                                                <div className="text-xs font-black text-gray-700">{(cp.consistency * 100).toFixed(0)}%</div>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded-xl">
                                                <div className="text-[9px] text-gray-400 font-bold uppercase mb-0.5">Avg Hit</div>
                                                <div className="text-xs font-black text-gray-700">~{cp.avgGap.toFixed(0)} Wks</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-12 rounded-3xl border border-dashed border-gray-200 text-center">
                                <Repeat className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-500 font-medium">No pairs currently in the W10-W15 ready window.</p>
                                <p className="text-xs text-gray-400 mt-1">Check back next week for fresh opportunities.</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Fibonacci Calculator (Conditional) */}
                {selectedPair && (
                    <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm animate-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <Calculator className="text-indigo-500" size={18} />
                                Fibonacci Stake Calculator
                            </h3>
                            <button
                                onClick={() => setSelectedPair(null)}
                                className="text-xs text-indigo-500 font-bold hover:underline"
                            >
                                Close Calculator
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            {fibonacci.map((stake, idx) => (
                                <div key={idx} className={`p-3 rounded-2xl border text-center ${idx === 0 ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-100'}`}>
                                    <div className="text-[9px] font-bold opacity-60 uppercase mb-1">Week {idx + 1}</div>
                                    <div className="text-lg font-black">${stake}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 items-start">
                            <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                            <div className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                <span className="font-bold">Recommendation:</span> High conviction chase for Pair {selectedPair.pair}.
                                Start at $1 in Week 1. If no win, progress to the next Fibonacci step.
                                Stop and reset immediately after a win.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Historical Log */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <History className="text-slate-500" size={18} />
                    Historical Successes
                </h3>
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pair</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wait Time</span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                        {historicalChaseWins && historicalChaseWins.slice().reverse().map((win, idx) => (
                            <div key={idx} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        {win.pair.split('-').map(num => (
                                            <div key={num} className="w-6 h-6 bg-slate-100 border border-white text-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold">
                                                {num}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">Pair Hit</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                        {win.weeksToWin} Wks
                                    </span>
                                    <CheckCircle2 className="text-green-500" size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChaseTab;
