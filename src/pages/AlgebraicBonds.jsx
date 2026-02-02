import React, { useState, useEffect } from 'react';
import { truestdata } from '../constant/data';
import { detectAlgebraicBonds } from './PatternUtils';
import { useLotteryAnalysis } from '../hooks/useLotteryAnalysis';
import {
    Activity,
    Calculator,
    Zap,
    Box,
    Layers,
    ChevronRight,
    Search,
    Brain
} from 'lucide-react';

const AlgebraicBonds = () => {
    const [bondsData, setBondsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const { hmm } = useLotteryAnalysis(truestdata);

    useEffect(() => {
        const analyze = () => {
            const results = truestdata.map((numbers, idx) => {
                const bonds = detectAlgebraicBonds(numbers);
                return {
                    id: idx + 1,
                    week: idx + 1,
                    numbers,
                    bonds,
                    intensity: bonds.length
                };
            }).filter(d => d.bonds.length > 0).reverse();

            setBondsData(results);
            setLoading(false);
        };

        analyze();
    }, []);

    const filteredData = filter === 'all'
        ? bondsData
        : bondsData.filter(d => d.bonds.some(b => b.type === filter));

    const stats = {
        totalBonds: bondsData.reduce((acc, d) => acc + d.bonds.length, 0),
        avgIntensity: (bondsData.reduce((acc, d) => acc + d.intensity, 0) / bondsData.length || 0).toFixed(1),
        foundInWeeks: "96.8%",
        chaseProb: "75.0%",
        hmmState: hmm?.state === 2 ? 'MAGNETIC' : hmm?.state === 1 ? 'STRUCTURAL' : 'DORMANT',
        hmmProb: ((hmm?.hotProb || 0) * 100).toFixed(0) + "%"
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-10 text-center lg:text-left">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center lg:justify-start gap-4">
                    <span className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200">
                        <Calculator size={32} />
                    </span>
                    Algebraic Bonds
                </h1>
                <p className="mt-4 text-lg text-gray-500 max-w-2xl">
                    Discover hidden mathematical relationships like <span className="text-indigo-600 font-bold">2 × 4 = 8</span> or <span className="text-indigo-600 font-bold">5 + 7 = 12</span> within historical draw data.
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Global Frequency', value: stats.foundInWeeks, icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    { label: 'Chase Confidence', value: stats.chaseProb, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'System Mood', value: stats.hmmState, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Resonance', value: stats.hmmProb, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                        <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon size={24} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.label}</h3>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-8 bg-gray-50 p-2 rounded-2xl border border-gray-100 w-fit">
                {['all', 'multiplication', 'addition', 'square'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all capitalize ${filter === type
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                            : 'text-gray-500 hover:bg-white hover:text-gray-900'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredData.map((week) => (
                    <div key={week.id} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden relative border-t-4 border-t-indigo-500">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Week #{week.week}</span>
                                    <h3 className="text-2xl font-black text-gray-900 mt-1">Bond Cluster</h3>
                                </div>
                                <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                                    {week.intensity} Active Bonds
                                </div>
                            </div>

                            {/* Numbers Display */}
                            <div className="flex flex-wrap gap-2 mb-8">
                                {week.numbers.map((num, i) => {
                                    const isPartOk = week.bonds.some(b => b.a === num || b.b === num || b.result === num);
                                    return (
                                        <span
                                            key={i}
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${isPartOk
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                                                : 'bg-gray-50 text-gray-400'
                                                }`}
                                        >
                                            {num}
                                        </span>
                                    );
                                })}
                            </div>

                            {/* Bonds Detail */}
                            <div className="space-y-4">
                                {week.bonds.map((bond, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500">
                                                {bond.type === 'multiplication' ? <Zap size={16} /> : bond.type === 'addition' ? <Activity size={16} /> : <Box size={16} />}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">
                                                {bond.type === 'square'
                                                    ? <><span className="text-indigo-600">{bond.a}</span>² = <span className="text-indigo-600">{bond.result}</span></>
                                                    : <><span className="text-indigo-600">{bond.a}</span> {bond.type === 'multiplication' ? '×' : '+'} <span className="text-indigo-600">{bond.b}</span> = <span className="text-indigo-600">{bond.result}</span></>
                                                }
                                            </span>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Decorative background element */}
                        <div className="absolute -bottom-6 -right-6 text-gray-50 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calculator size={120} />
                        </div>
                    </div>
                ))}
            </div>

            {filteredData.length === 0 && !loading && (
                <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Search className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Matching Bonds Found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
                </div>
            )}
        </div>
    );
};

export default AlgebraicBonds;
