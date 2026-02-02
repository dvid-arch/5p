import React from 'react';
import { TrendingUp, Target, Zap, Shield, ChevronRight, Calculator } from 'lucide-react';

const PredictionTab = ({ analysis }) => {
    const [activeStrategy, setActiveStrategy] = React.useState('banker');

    if (!analysis || !analysis.predictions) return null;

    const strategies = analysis.backtest?.strategies || {};
    const stats = strategies[activeStrategy] || { investment: 0, return: 0, netProfit: 0 };

    const { predictions } = analysis;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Predictions for Next Week</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-gray-500 max-w-lg">
                        Unified Engine synchronizing **Signal Intelligence** with ensemble models. Now using a **10-Draw Strategic Window** and exhausted gap buffers for institutional reliability.
                    </p>

                    {/* REASSURANCE: Latest Anchor Draw */}
                    {analysis.stats?.latestDraw && (
                        <div className="bg-white border-2 border-blue-600 px-5 py-3 rounded-[2rem] flex items-center gap-4 self-start shadow-xl animate-bounce-subtle">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 leading-none">Latest<br />Anchor</span>
                            <div className="flex gap-2">
                                {(analysis.stats.latestDraw.numbers || analysis.stats.latestDraw).map(num => (
                                    <div key={num} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center text-base font-black shadow-lg">
                                        {num}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ensemble Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Premium Banker Pairs - ULTRA RELIABLE */}
                    <div className="bg-gradient-to-br from-indigo-600 to-slate-900 rounded-[2.5rem] p-1 shadow-xl overflow-hidden">
                        <div className="bg-white/5 backdrop-blur-3xl rounded-[2.2rem] p-6 text-white border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-xl font-bold flex items-center gap-2">
                                    <Shield className="text-indigo-400 fill-indigo-400/20" size={24} />
                                    Premium Banker Pairs (1 to Play)
                                </h4>
                                <div className="px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                    Target 90%+ Reliability
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {predictions.bankers?.slice(0, 4).map((bp) => (
                                    <div key={bp.pair} className="bg-white/10 border border-white/5 rounded-3xl p-5 hover:bg-white/15 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex gap-2">
                                                {bp.numbers.map(num => (
                                                    <div key={num} className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-white/20">
                                                        {num}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-tighter">Prob. Hit</div>
                                                <div className="text-xl font-black text-indigo-400">{bp.reliability?.toFixed(1) || '0.0'}%</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-indigo-400 h-full rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                                                    style={{ width: `${bp.reliability || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-black text-indigo-300 uppercase">{bp.confidence || 'Low'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-[11px] text-white/40 italic font-medium px-2">
                                * These pairs are statistically optimized for 1-hit minimum. Recommended for banker-based systems.
                            </p>
                        </div>
                    </div>

                    {/* Cluster-Powered Predictions */}
                    {predictions.latestClusters && predictions.latestClusters.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] p-1 shadow-xl overflow-hidden">
                            <div className="bg-white/5 backdrop-blur-xl rounded-[2.2rem] p-6 text-white border border-white/10">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-xl font-bold flex items-center gap-2">
                                        <Activity className="text-white fill-white/20" size={24} />
                                        Cluster-Powered Predictions
                                    </h4>
                                    <div className="px-3 py-1 bg-white/20 rounded-full border border-white/30 text-[10px] font-black uppercase tracking-widest text-white">
                                        Algebraic Resonance Detected
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {predictions.latestClusters.map((cluster, idx) => (
                                        <div key={idx} className="bg-black/20 rounded-3xl p-5 border border-white/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex gap-2">
                                                    {cluster.numbers.map(num => (
                                                        <div key={num} className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${num === cluster.middle ? 'bg-amber-400 text-amber-950 shadow-lg shadow-amber-500/50' : 'bg-white/20 text-white'}`}>
                                                            {num}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[9px] font-black text-white/60 uppercase tracking-widest">Operation</div>
                                                    <div className="text-lg font-black">{cluster.type === 'addition' ? '+' : '×'}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 p-3 bg-white/10 rounded-2xl border border-white/5">
                                                    <div className="text-[9px] font-black text-white/60 uppercase mb-2">Generated Predictions</div>
                                                    <div className="flex gap-2">
                                                        {cluster.predictions.map(p => (
                                                            <div key={p} className="bg-white text-orange-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg">
                                                                {p}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Single Number Predictions */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                            <Zap className="text-amber-500" size={20} />
                            Top Individual Bankers
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {predictions.ensemble?.slice(0, 10).map((pred, idx) => (
                                <div key={pred.number} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-transparent hover:border-blue-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-900 text-white rounded-xl w-10 h-10 flex items-center justify-center text-lg font-bold group-hover:scale-110 transition-transform">
                                            {pred.number}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Rank #{idx + 1}</div>
                                            <div className="text-xs font-bold text-gray-600 capitalize">{pred.confidence} confidence</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-blue-600">
                                            {(pred.score * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* High Conviction Pairs */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                            <TrendingUp className="text-blue-500" size={20} />
                            High-Conviction Pairs (2 to Play)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {predictions.pairs?.slice(0, 6).map((pp) => (
                                <div key={pp.pair} className="bg-gradient-to-br from-blue-50/50 to-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-bl-2xl ${pp.confidence === 'high' ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                                        }`}>
                                        {pp.confidence}
                                    </div>

                                    <div className="flex bg-amber-500/20 px-4 py-2 rounded-2xl border border-white/10">
                                        <div className="flex flex-col border-r border-white/10 pr-4 mr-4">
                                            <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Double Hit Rate</span>
                                            <span className="text-lg font-black text-white">{analysis.stats.clusterStats.successRate.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">Avg Resolution</span>
                                            <span className="text-lg font-black text-white">{analysis.stats.clusterStats.avgWait} Weeks</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Synergy Score</div>
                                                <div className="text-sm font-black text-slate-800">{(pp.score * 100).toFixed(1)}% Match</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Wait Index</div>
                                                <div className="text-sm font-black text-blue-600">{pp.gapScore.toFixed(1)}x avg</div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min(pp.score * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Method Breakdown & Stats */}
                <div className="space-y-8">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                            <Target className="text-purple-500" size={20} />
                            Strategy Insights
                        </h4>

                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100/50">
                                <h5 className="text-[10px] font-black text-blue-600 uppercase mb-2">Binary Transition</h5>
                                <div className="flex flex-wrap gap-2">
                                    {predictions.binary?.slice(0, 5).map(p => (
                                        <span key={p.number} className="text-xs font-bold bg-white text-blue-700 px-2 py-1 rounded-lg border border-blue-100">#{p.number}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/50">
                                <h5 className="text-[10px] font-black text-purple-600 uppercase mb-2">Bayesian Scores</h5>
                                <div className="flex flex-wrap gap-2">
                                    {predictions.bayesian?.slice(0, 5).map(p => (
                                        <span key={p.number} className="text-xs font-bold bg-white text-purple-700 px-2 py-1 rounded-lg border border-purple-100">#{p.number}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                                <h5 className="text-[10px] font-black text-amber-600 uppercase mb-2">Urgency (Chase)</h5>
                                <div className="flex flex-wrap gap-2">
                                    {predictions.urgency?.slice(0, 5).map(p => (
                                        <span key={p.number} className="text-xs font-bold bg-white text-amber-700 px-2 py-1 rounded-lg border border-amber-100">#{p.number}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h4 className="text-lg font-bold mb-6 text-gray-800">Model Distribution</h4>
                        <div className="space-y-4">
                            {['high', 'medium', 'low'].map(conf => {
                                const count = predictions.ensemble.filter(p => p.confidence === conf).length;
                                return (
                                    <div key={conf} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${conf === 'high' ? 'bg-green-500' : conf === 'medium' ? 'bg-yellow-500' : 'bg-slate-300'}`} />
                                            <span className="text-xs font-bold text-gray-600 capitalize">{conf} Confidence</span>
                                        </div>
                                        <span className="text-xs font-black text-gray-900">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Model Performance (Backtest) */}
                    {analysis.backtest && (
                        <>
                            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-200">
                                <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                                    <Target className="text-green-500" size={20} />
                                    Strategy Performance Review
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="text-xs font-bold text-gray-500 uppercase">
                                            {stats.type === 'cycle' ? 'Cycle Success Rate' : 'Strategy Success Rate'}
                                        </span>
                                        <span className={`text-lg font-black ${stats.successRate > 50 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {(stats.successRate || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 italic text-[10px] text-gray-400 text-center">
                                        Performance data based on {stats.totalBets} simulated {stats.type === 'cycle' ? 'chase cycles' : 'bets'}
                                    </div>
                                </div>
                            </div>

                            {/* Strategy Selector */}
                            <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
                                {['banker', 'chase', 'singles'].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setActiveStrategy(s)}
                                        className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${activeStrategy === s
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-200'
                                            }`}
                                    >
                                        {s === 'banker' ? 'BANKER' : s === 'chase' ? 'PAIRS CHASE' : 'SINGLES'}
                                    </button>
                                ))}
                            </div>

                            {/* Profitability Tracker */}
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-white/10 animate-in slide-in-from-bottom-4 duration-1000">
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Calculator className="text-indigo-400" size={20} />
                                    {stats.name} ROI
                                </h4>
                                <p className="text-[10px] text-indigo-300/60 mb-6 uppercase tracking-widest font-bold">
                                    {stats.type === 'cycle' ? '5-Week Chase Window' : 'Selective Play'} | $3.33 Odds
                                </p>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <span className="text-xs text-white/60">
                                            {stats.type === 'cycle' ? 'Total Cycles' : 'Bets Placed'}
                                        </span>
                                        <span className="font-mono font-bold">{stats.totalBets}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <span className="text-xs text-white/60">Total Investment</span>
                                        <span className="font-mono font-bold">${stats.investment.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <span className="text-xs text-white/60">Total Returns</span>
                                        <span className="font-mono font-bold text-green-400">${stats.return.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2">
                                        <div className="flex justify-between items-center px-3 mb-2">
                                            <span className="text-sm font-bold">Net Profit</span>
                                            <span className={`text-xl font-black ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${stats.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                                style={{ width: `${Math.min(100, (stats.return / (stats.investment || 1)) * 50)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[8px] text-white/30 text-center leading-tight">
                                        {stats.type === 'cycle'
                                            ? '* A "Cycle" ends on a win or after 5 iterations. Failure results in cumulative loss of all 5 weeks.'
                                            : '* ROI assumes fixed $1,000 stake per played week with 3.33x payout per hit.'}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionTab;
