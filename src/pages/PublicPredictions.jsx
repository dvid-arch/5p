import React from 'react';
import { useLotteryAnalysis } from '../hooks/useLotteryAnalysis';
import { truestdata } from '../constant/data';
import { Target, TrendingUp, Lock, Crown, Calculator, ChevronRight, Zap, MessageSquare, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicPredictions = () => {
    const analysis = useLotteryAnalysis(truestdata);

    if (!analysis || !analysis.predictions) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const freeBankers = analysis.predictions.bankers?.slice(0, 3) || [];

    const UpgradeCard = ({ title, description }) => (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 rounded-3xl p-8 text-white shadow-2xl border border-white/10 group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Crown size={120} />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-yellow-400 p-2 rounded-xl text-yellow-900">
                        <Crown size={24} />
                    </div>
                    <span className="text-sm font-black tracking-widest uppercase text-yellow-400">Premium Access Only</span>
                </div>
                <h3 className="text-2xl font-black mb-2">{title}</h3>
                <p className="text-white/60 mb-6 max-w-sm">{description}</p>
                <button className="flex items-center gap-2 px-8 py-3 bg-yellow-400 text-yellow-900 rounded-2xl font-bold hover:bg-yellow-300 transition-all active:scale-95 shadow-lg shadow-yellow-500/20">
                    Unlock Strategy Now
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Hero Header */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Target size={150} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">Weekly High-Conviction Predictions</h1>
                <p className="text-gray-500 max-w-2xl">
                    Get institutional-grade lottery analysis. Below are our public banker numbers.
                    Access our <span className="text-blue-600 font-bold">2-to-play Fibonacci Chase</span> by upgrading.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Public Banker Pairs */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                        <TrendingUp className="text-blue-500" size={24} />
                        Free Banker Packs (1-to-Play)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {freeBankers.map((banker, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="text-2xl font-black text-gray-900 flex gap-2">
                                        {banker.numbers.map(n => (
                                            <span key={n} className="bg-blue-50 px-3 py-1 rounded-xl text-blue-700 border border-blue-100">
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="bg-green-50 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                                        {banker.confidence} Reliability
                                    </div>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Historical Hits</div>
                                        <div className="text-sm font-bold text-gray-700">{banker.reliability.toFixed(1)}%</div>
                                    </div>
                                    <div className="text-[8px] text-gray-400 italic">Recommended Stake: $1,000</div>
                                </div>
                            </div>
                        ))}

                        {/* Blurred Locked Section */}
                        <div className="bg-gray-100/50 rounded-3xl p-6 border border-gray-200 border-dashed relative overflow-hidden group min-h-[140px]">
                            <div className="absolute inset-0 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
                                <div className="bg-white p-3 rounded-full shadow-lg mb-3 text-gray-400 group-hover:scale-110 transition-transform">
                                    <Lock size={24} />
                                </div>
                                <p className="text-xs font-bold text-gray-500 mb-2">+ 12 More High-Conviction Pairs</p>
                                <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                    Unlock Full List
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Premium Pairs Section */}
                    <div className="pt-8 space-y-8">
                        <UpgradeCard
                            title="2-to-play Pairs (Fibonacci Strategy)"
                            description="Access our most profitable prediction strategy with a 5-week recovery chase system. Historically proven to deliver 50%+ monthly ROI."
                        />

                        {/* Institutional Philosophy Section */}
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-slate-900 p-2 rounded-xl text-white">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Institutional Capital Management</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2 italic">
                                        <TrendingUp size={16} className="text-blue-600" />
                                        Disciplined Growth Model
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        We don't "play" the lottery; we manage capital. Our institution uses algorithmic oversight to ensure your funds are deployed into <strong>5-week recovery cycles</strong>, neutralizing the volatility of single-week losses and turning them into long-term profit.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-800 flex items-center gap-2 italic">
                                        <Zap size={16} className="text-amber-500" />
                                        Risk Mitigation & Anti-Gambling
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        By automating the chase and enforcing strict exit criteria, we protect you from impulsive decisions. Our goal is to eliminate "Gambler's Fallacy" and replace it with <strong>Institutional Discipline</strong>. Consistent gains over time is our mandate.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <Crown className="text-amber-500" size={14} />
                                    Fund Management Grade Portfolio
                                </div>
                                <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 group">
                                    Learn About Our Managed Fund
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: ROI & Stats */}
                <div className="space-y-6">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
                        <Calculator className="text-indigo-500" size={24} />
                        Performance Monitoring
                    </h2>

                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden h-[400px]">
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center">
                            <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-200 mb-4 animate-bounce">
                                <Zap size={32} fill="currentColor" />
                            </div>
                            <h4 className="text-xl font-black text-gray-900 mb-2">Live Strategy ROI</h4>
                            <p className="text-sm text-gray-500 mb-6">Access real-time investment tracking and net profit analysis for the Fibonacci Chase system.</p>
                            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95">
                                VIEW PERFORMANCE
                            </button>
                        </div>

                        {/* Blurred Content Placeholder */}
                        <div className="space-y-4 opacity-10">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <div className="h-3 w-20 bg-gray-300 rounded-full"></div>
                                    <div className="h-4 w-12 bg-gray-400 rounded-full"></div>
                                </div>
                            ))}
                            <div className="h-24 w-full bg-gray-200 rounded-3xl mt-6"></div>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default PublicPredictions;
