import React from 'react';
import { Zap, Radio, Target, Shield, Activity, TrendingUp, AlertCircle, Clock } from 'lucide-react';

const SensorBadge = ({ label, value, color }) => (
    <div className={`p-2 rounded-xl border ${color} flex flex-col items-center gap-1`}>
        <span className="text-[10px] font-black uppercase opacity-60 leading-none">{label}</span>
        <div className="w-full bg-black/5 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-current transition-all duration-1000" style={{ width: `${value * 100}%` }} />
        </div>
        <span className="text-xs font-bold">{(value * 100).toFixed(0)}%</span>
    </div>
);

const PredictionCard = ({ item, type, isBanker, analysis }) => {
    const isPair = !!item.pair;
    const strength = item.strength * 100;

    return (
        <div className={`relative bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group`}>
            {/* Strength Bar */}
            <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-1000" style={{ width: `${strength}%` }} />

            <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                    <div className="flex gap-2 mb-2">
                        {isPair ? item.numbers.map(n => (
                            <div key={n} className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-slate-100 group-hover:scale-110 transition-transform">
                                {n}
                            </div>
                        )) : (
                            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-200 group-hover:scale-110 transition-transform">
                                {item.number}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        {isBanker ? '1-to-Play Signal' : isPair ? '2-to-Play Alpha' : 'Primary Signal'}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-blue-600 leading-none">{strength.toFixed(1)}%</div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Strength</span>
                </div>
            </div>

            {/* Strategic Window UI */}
            {item.window && (
                <div className="mb-4 bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Strategic Window</span>
                        <div className="flex items-center gap-1">
                            <Clock size={10} className="text-blue-500" />
                            <span className="text-[10px] font-black text-blue-800">
                                {item.window.expected === 0 ? 'IMMEDIATE (Today)' : `In ${item.window.expected} Wks`}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(w => {
                            const isInitial = w === 0;
                            const isTarget = w >= item.window.start && w <= item.window.end;
                            const isExpected = w === item.window.expected;

                            return (
                                <div
                                    key={w}
                                    className={`flex-1 h-1.5 rounded-full transition-all ${isExpected ? 'bg-blue-600 scale-y-125 shadow-[0_0_8px_rgba(37,99,235,0.5)]' :
                                        isTarget ? 'bg-blue-300' :
                                            'bg-gray-200'
                                        }`}
                                    title={w === 0 ? 'Today' : `Week ${w}`}
                                />
                            );
                        })}
                    </div>
                    <div className="mt-2 text-[9px] font-bold text-blue-500/70 italic text-center">
                        {item.window.overdue ? 'High Probability: Overdue' : 'Cycle Prediction: Active'}
                    </div>
                </div>
            )}

            {/* Neural Brain Indicator */}
            {item.sensors?.neural && (
                <div className="mb-4 bg-slate-900 rounded-2xl p-4 text-white relative overflow-hidden shadow-lg shadow-slate-200">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Activity size={40} />
                    </div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-2">
                            <Zap size={14} className="text-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Window Confidence (10W)</span>
                        </div>
                        <span className="text-lg font-black text-yellow-400">{(item.sensors.neural * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 text-[9px] font-bold text-slate-400 leading-tight">
                        ML Layer optimized for **10-Draw Strategic Windows**. Using a **10-Week Exhaustion Buffer** for Alphas.
                    </div>
                </div>
            )}

            {/* Sensor Array for singles */}
            {!isPair && item.sensors && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <SensorBadge label="Velocity" value={item.sensors.velocity} color="text-amber-600 bg-amber-50 border-amber-100" />
                    <SensorBadge label="Gap" value={item.sensors.gap} color="text-indigo-600 bg-indigo-50 border-indigo-100" />
                    <SensorBadge label="Markov" value={item.sensors.markov} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
                    <SensorBadge label="Neural AI" value={item.sensors.neural} color="text-yellow-600 bg-yellow-50 border-yellow-100" />
                </div>
            )}

            {/* Pair Specific Info */}
            {isPair && (
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-500 uppercase tracking-tight">Signal Sync</span>
                        <div className="flex gap-1 items-center">
                            <span className="font-black text-slate-800">{(item.s1 * 100).toFixed(0)}%</span>
                            <Zap size={10} className="text-amber-500" />
                            <span className="font-black text-slate-800">{(item.s2 * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-blue-400 border-r border-white" style={{ width: `${item.s1 * 50}%` }} />
                        <div className="h-full bg-blue-600" style={{ width: `${item.s2 * 50}%` }} />
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.confidence === 'Elite' ? 'bg-purple-100 text-purple-600' :
                    item.confidence === 'Strong' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                    }`}>
                    {item.confidence || (strength > 45 ? 'Validated' : 'Scanning')}
                </div>
                <button className="text-gray-400 group-hover:text-blue-600 transition-colors">
                    <Activity size={18} />
                </button>
            </div>
        </div>
    );
};

const SignalTab = ({ analysis }) => {
    if (!analysis || !analysis.signalPredictions) return null;
    const { singles, pairs, bankers } = analysis.signalPredictions;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header: Signal Overview */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm">
                    <Radio size={200} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-500 p-2 rounded-xl shadow-lg shadow-blue-500/40">
                            <Activity size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Signal Intelligence Engine</h2>
                    </div>
                    <p className="text-blue-100/70 max-w-2xl text-lg font-medium leading-relaxed">
                        Processing cross-frequency noise through four distinct sensors.
                        Targeting algorithmic spikes in <strong>Velocity</strong>, <strong>Gap exhaustion</strong>, and <strong>Markov state transitions</strong>.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest">Sensors Active: 90 / 90</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                            <Target size={14} className="text-blue-400" />
                            <span className="text-xs font-black uppercase tracking-widest">Coverage: High-Fidelity</span>
                        </div>

                        {/* REASSURANCE: Latest Anchor Draw */}
                        {analysis.stats?.latestDraw && (
                            <div className="bg-white border-2 border-blue-500/50 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-xl">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Latest Anchor:</span>
                                <div className="flex gap-1.5">
                                    {(analysis.stats.latestDraw.numbers || analysis.stats.latestDraw).map(num => (
                                        <span key={num} className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-black shadow-md">
                                            {num}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Stats */}
            {analysis.backtest?.signalAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Signal Success (Window)</div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-slate-900">{analysis.backtest.signalAnalytics.windowHitRate.toFixed(1)}%</span>
                            <span className="text-xs font-bold text-green-500 mb-1 flex items-center gap-1">
                                <TrendingUp size={12} /> Cycle Validated
                            </span>
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${analysis.backtest.signalAnalytics.windowHitRate}%` }} />
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Immediate Accuracy (Day 0)</div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-slate-900">{analysis.backtest.signalAnalytics.immediateHitRate.toFixed(1)}%</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 font-medium">Likelihood of target landing in the current session.</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between ring-2 ring-blue-500 ring-offset-2">
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Alpha Consistency</div>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-blue-900">High</span>
                        </div>
                        <p className="text-[10px] text-blue-500/70 mt-2 font-bold italic">Strategy optimized for 4-week recovery loops.</p>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200 text-white flex flex-col justify-between">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Historical Samples</div>
                        <div className="text-3xl font-black">{analysis.backtest.signalAnalytics.totalSignals}</div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Data points analyzed for this simulation.</p>
                    </div>
                </div>
            )}

            {/* Grid Sections */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Column 1: Priority Singles */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Zap size={20} className="text-amber-500" />
                            High-Intensity Singles
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">Top 5</span>
                    </div>
                    <div className="space-y-4">
                        {singles.slice(0, 10).map(item => (
                            <PredictionCard key={item.number} item={item} analysis={analysis} />
                        ))}
                    </div>
                </div>

                {/* Column 2: 1-to-Play Banker Pairs */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Shield size={20} className="text-blue-500" />
                            Reinforced Pairs (1 to Play)
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">High Reliability</span>
                    </div>
                    <div className="space-y-4">
                        {bankers.slice(0, 15).map(item => (
                            <PredictionCard key={item.pair} item={item} isBanker analysis={analysis} />
                        ))}
                    </div>
                </div>

                {/* Column 3: 2-to-Play Alpha Pairs */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                            <Target size={20} className="text-purple-500" />
                            Synchronized Alphas (2 to Play)
                        </h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-lg">Synergy Max</span>
                    </div>
                    <div className="space-y-4">
                        {pairs.slice(0, 15).map(item => (
                            <PredictionCard key={item.pair} item={item} analysis={analysis} />
                        ))}
                    </div>
                </div>

            </div>

            {/* Signal Legend / How it works */}
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-indigo-600">
                        <Activity size={18} />
                        <h4 className="font-black text-xs uppercase tracking-widest">Velocity Sensor</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Detects sudden shifts in momentum where a number is breaking its historical frequency baseline within recent draws.</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle size={18} />
                        <h4 className="font-black text-xs uppercase tracking-widest">Gap Exhaustion</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Triggers when a number or pair approaches its maximum historical latency, indicating a high-probability expiration of the current gap.</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <TrendingUp size={18} />
                        <h4 className="font-black text-xs uppercase tracking-widest">Markov State</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Analyzes the relationship between the last draw state and potential next-sequences based on first-order probability transitions.</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-rose-600">
                        <Radio size={18} />
                        <h4 className="font-black text-xs uppercase tracking-widest">Pattern Resonance</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Scans for structural co-occurrence where numbers appear in clusters that have historically preceded high-variance events.</p>
                </div>
            </div>
        </div>
    );
};

export default SignalTab;
