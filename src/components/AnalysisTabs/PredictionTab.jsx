import React from 'react';
import { TrendingUp, Target, Zap, Shield, ChevronRight } from 'lucide-react';

const PredictionTab = ({ analysis }) => {
    if (!analysis || !analysis.predictions) return null;

    const { predictions } = analysis;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Predictions for Next Week</h3>
                <p className="text-gray-500">
                    Advanced ensemble modeling combining Markov transitions, Bayesian inference, and pair synergy.
                </p>
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
                                                <div className="text-xl font-black text-indigo-400">{bp.reliability.toFixed(1)}%</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-indigo-400 h-full rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                                                    style={{ width: `${bp.reliability}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-black text-indigo-300 uppercase">{bp.confidence}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="mt-4 text-[11px] text-white/40 italic font-medium px-2">
                                * These pairs are statistically optimized for 1-hit minimum. Recommended for banker-based systems.
                            </p>
                        </div>
                    </div>

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

                                    <div className="flex gap-2 mb-4">
                                        {pp.numbers.map(num => (
                                            <div key={num} className="w-12 h-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center font-black text-xl text-slate-900 shadow-sm">
                                                {num}
                                            </div>
                                        ))}
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
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-in slide-in-from-bottom-4 duration-700 delay-200">
                            <h4 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800">
                                <Target className="text-green-500" size={20} />
                                12-Week Backtest
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Ensemble Hit Rate</span>
                                    <span className={`text-lg font-black ${analysis.backtest.ensembleHitRate > 50 ? 'text-green-600' : 'text-gray-900'}`}>
                                        {(analysis.backtest.ensembleHitRate || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Banker Pair Hit Rate</span>
                                    <span className={`text-lg font-black ${analysis.backtest.bankerPairHitRate > 30 ? 'text-green-600' : 'text-gray-900'}`}>
                                        {(analysis.backtest.bankerPairHitRate || 0).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase mb-2 text-center">Recent Performance</div>
                                    <div className="flex justify-center gap-1">
                                        {analysis.backtest.history.slice(-10).map((h, i) => (
                                            <div
                                                key={i}
                                                className={`w-2 h-8 rounded-full ${h.ensembleHit ? 'bg-green-500' : 'bg-red-200'}`}
                                                title={`Week ${h.week}: ${h.ensembleHit ? 'Hit' : 'Miss'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[9px] text-gray-400 text-center mt-2 leading-relaxed">
                                    * Hit Rate = % of weeks where Top 5 Bankers or Top 1 Pair contained at least one winning number.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionTab;
