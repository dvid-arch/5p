import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { truestdata } from '../constant/data';

const LotteryAnalysis = () => {
    const [data, setData] = useState([]);
    const [analysis, setAnalysis] = useState({});
    const [activeTab, setActiveTab] = useState('frequency');

    useEffect(() => {
        const chronologicalData = [...truestdata].reverse();
        setData(chronologicalData);
        analyzeData(chronologicalData);
    }, []);

    const tabList = [
        { key: 'frequency', label: 'Frequency' },
        { key: 'hot-cold', label: 'Hot/Cold' },
        { key: 'gaps', label: 'Number Gaps' },
        { key: 'distribution', label: 'Distributions' },
        { key: 'pairs', label: 'Pairs' }
    ];

    const analyzeData = (draws) => {
        const totalDraws = draws.length;
        const frequency = Object.fromEntries(Array.from({ length: 49 }, (_, i) => [i + 1, 0]));
        const gaps = [], sums = [], sizes = [], evenOddCounts = [], lowHighCounts = [], ranges = [], repetitions = [];

        draws.forEach((draw, index) => {
            const numbers = Array.isArray(draw) ? draw : (draw.value || []);
            numbers.forEach(num => {
                if (frequency[num] !== undefined) frequency[num]++;
            });
            sizes.push(numbers.length);
            const sum = numbers.reduce((a, b) => a + b, 0);
            sums.push(sum);

            const even = numbers.filter(n => n % 2 === 0).length;
            const odd = numbers.length - even;
            evenOddCounts.push({ even, odd });

            const low = numbers.filter(n => n <= 24).length;
            const high = numbers.length - low;
            lowHighCounts.push({ low, high });

            if (numbers.length > 0) {
                ranges.push(Math.max(...numbers) - Math.min(...numbers));
            }
        });

        const sortedFreq = Object.entries(frequency)
            .map(([number, count]) => ({ number: parseInt(number), frequency: count }))
            .sort((a, b) => b.frequency - a.frequency);

        // Pairs Analysis
        const pairCounts = {};
        draws.forEach(draw => {
            const numbers = Array.isArray(draw) ? draw : (draw.value || []);
            for (let i = 0; i < numbers.length; i++) {
                for (let j = i + 1; j < numbers.length; j++) {
                    const pair = [numbers[i], numbers[j]].sort((a, b) => a - b).join(',');
                    pairCounts[pair] = (pairCounts[pair] || 0) + 1;
                }
            }
        });

        const sortedPairs = Object.entries(pairCounts)
            .map(([pair, count]) => ({ pair, count }))
            .sort((a, b) => b.count - a.count);

        // Actual Gap Distribution Analysis
        const numLastSeen = {};
        const gapCounts = {};
        draws.forEach((draw, drawIndex) => {
            const numbers = Array.isArray(draw) ? draw : (draw.value || []);
            numbers.forEach(num => {
                if (numLastSeen[num] !== undefined) {
                    const gap = drawIndex - numLastSeen[num] - 1;
                    if (gap < 20) { // Cap gaps at 20 for distribution
                        gapCounts[gap] = (gapCounts[gap] || 0) + 1;
                    }
                }
                numLastSeen[num] = drawIndex;
            });
        });

        const gapData = Array.from({ length: 15 }, (_, i) => ({
            gap: i,
            count: gapCounts[i] || 0
        }));

        setAnalysis({
            frequencyData: sortedFreq.slice().sort((a, b) => a.number - b.number),
            hotNumbers: sortedFreq.slice(0, 10),
            coldNumbers: sortedFreq.slice(-10),
            hotPairs: sortedPairs.slice(0, 10),
            coldPairs: sortedPairs.slice(-10),
            gapData,
            sizeDistribution: Array.from(new Set(sizes)).sort((a, b) => a - b),
            sumDistribution: [Math.min(...sums), Math.max(...sums)],
            stats: {
                totalDraws,
                avgSize: (sizes.reduce((a, b) => a + b, 0) / totalDraws).toFixed(1),
                avgSum: (sums.reduce((a, b) => a + b, 0) / totalDraws).toFixed(0),
                avgRange: (ranges.reduce((a, b) => a + b, 0) / totalDraws).toFixed(1),
                avgEvenOdd: {
                    even: (evenOddCounts.reduce((a, b) => a + b.even, 0) / totalDraws).toFixed(1),
                    odd: (evenOddCounts.reduce((a, b) => a + b.odd, 0) / totalDraws).toFixed(1)
                },
                avgLowHigh: {
                    low: (lowHighCounts.reduce((a, b) => a + b.low, 0) / totalDraws).toFixed(1),
                    high: (lowHighCounts.reduce((a, b) => a + b.high, 0) / totalDraws).toFixed(1)
                }
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Pattern Explorer</h1>
                <p className="text-gray-500 text-sm">In-depth statistical breakdown of historical data</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {['totalDraws', 'avgSize', 'avgSum', 'avgRange'].map((key, i) => (
                    <div key={key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            {key.replace('avg', 'Avg ').replace(/([A-Z])/g, ' $1')}
                        </h3>
                        <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            {analysis.stats?.[key] || '–'}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        Even/Odd Balance
                    </h3>
                    <div className="flex items-end gap-1">
                        <div className="flex-1">
                            <div className="text-sm text-gray-500 mb-1 flex justify-between">
                                <span>Even</span>
                                <span className="font-bold text-blue-600">{analysis.stats?.avgEvenOdd?.even}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full" style={{ width: `${(analysis.stats?.avgEvenOdd?.even / (parseFloat(analysis.stats?.avgEvenOdd?.even) + parseFloat(analysis.stats?.avgEvenOdd?.odd))) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        Low/High Split
                    </h3>
                    <div className="flex items-end gap-1">
                        <div className="flex-1">
                            <div className="text-sm text-gray-500 mb-1 flex justify-between">
                                <span>Low (1-24)</span>
                                <span className="font-bold text-green-600">{analysis.stats?.avgLowHigh?.low}</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-600 h-full" style={{ width: `${(analysis.stats?.avgLowHigh?.low / (parseFloat(analysis.stats?.avgLowHigh?.low) + parseFloat(analysis.stats?.avgLowHigh?.high))) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-2 mb-8 shadow-sm flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {tabList.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === key
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm min-h-[400px]">
                {/* Tab content ... */}
                {activeTab === 'frequency' && (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analysis.frequencyData?.slice(0)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="number" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="frequency" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                )}

                {activeTab === 'hot-cold' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[['Hot Numbers', 'text-red-600', 'bg-red-100', analysis.hotNumbers], ['Cold Numbers', 'text-blue-600', 'bg-blue-100', analysis.coldNumbers]].map(([title, textColor, bgColor, list], i) => (
                            <div key={i}>
                                <h3 className={`text-lg font-semibold mb-2 ${textColor}`}>{title}</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {list?.map(item => (
                                        <div key={item.number} className={`${bgColor} p-2 rounded text-center`}>
                                            <div className="font-bold">{item.number}</div>
                                            <div className="text-xs">{item.frequency}x</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'gaps' && (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={analysis.gapData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="gap" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10B981" />
                        </BarChart>
                    </ResponsiveContainer>
                )}

                {activeTab === 'distribution' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[['Draw Sizes', analysis.sizeDistribution, 'bg-purple-100 text-purple-800'], ['Draw Sums', analysis.sumDistribution, 'bg-orange-100 text-orange-800']].map(([title, data, classes], i) => (
                            <div key={i}>
                                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {data?.map((val, idx) => (
                                        <span key={idx} className={`${classes} px-2 py-1 rounded text-sm`}>{val}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'pairs' && (
                    <div>
                        <h2 className="text-xl font-bold mb-4">Hot and Cold Number Pairs</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-red-600">🔥 Hot Pairs</h3>
                                <ul className="space-y-1 text-sm">
                                    {analysis.hotPairs?.map(pair => (
                                        <li key={pair.pair} className="bg-red-100 p-2 rounded">{pair.pair} — <strong>{pair.count} times</strong></li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-blue-600">❄️ Cold Pairs</h3>
                                <ul className="space-y-1 text-sm">
                                    {analysis.coldPairs?.map(pair => (
                                        <li key={pair.pair} className="bg-blue-100 p-2 rounded">{pair.pair} — <strong>{pair.count} times</strong></li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default LotteryAnalysis;
