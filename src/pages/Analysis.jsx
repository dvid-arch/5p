import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { ata, datamod } from '../constant/data';

const LotteryAnalysis = () => {
    const [data, setData] = useState([]);
    const [analysis, setAnalysis] = useState({});
    const [activeTab, setActiveTab] = useState('frequency');

    useEffect(() => {
        setData(datamod);
        analyzeData(datamod);
    }, []);

    const analyzeData = (draws) => {
        const totalDraws = draws.length;
        const frequency = Object.fromEntries(Array.from({ length: 49 }, (_, i) => [i + 1, 0]));
        const gaps = [], sums = [], sizes = [], evenOddCounts = [], lowHighCounts = [], ranges = [], repetitions = [];

        draws.forEach((draw, index) => {
            draw.forEach(num => frequency[num]++);
            sizes.push(draw.length);
            sums.push(draw.reduce((a, b) => a + b, 0));

            const even = draw.filter(n => n % 2 === 0).length;
            const odd = draw.length - even;
            evenOddCounts.push({ even, odd });

            const low = draw.filter(n => n <= 24).length;
            const high = draw.length - low;
            lowHighCounts.push({ low, high });

            const sorted = [...draw].sort((a, b) => a - b);
            ranges.push(sorted[sorted.length - 1] - sorted[0]);
            for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);

            if (index > 0) {
                const overlap = draw.filter(n => draws[index - 1].includes(n)).length;
                repetitions.push(overlap);
            }
        });

        const frequencyData = Object.entries(frequency)
            .map(([number, count]) => ({
                number: parseInt(number),
                frequency: count,
                percentage: ((count / totalDraws) * 100).toFixed(1)
            }))
            .filter(n => !isNaN(n.frequency))
            .sort((a, b) => b.frequency - a.frequency);
        console.log(frequencyData.map(n=>n.number))
        const gapCount = {};
        gaps.forEach(gap => { gapCount[gap] = (gapCount[gap] || 0) + 1; });

        const gapData = Object.entries(gapCount)
            .map(([gap, count]) => ({
                gap: parseInt(gap),
                count,
                percentage: ((count / gaps.length) * 100).toFixed(1)
            }))
            .sort((a, b) => a.gap - b.gap);

        const avg = arr => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
        // --- Pair frequency analysis ---
        const pairFrequency = {};

        draws.forEach(draw => {
            const sorted = [...new Set(draw)].sort((a, b) => a - b);
            for (let i = 0; i < sorted.length; i++) {
                for (let j = i + 1; j < sorted.length; j++) {
                    const key = `${sorted[i]}-${sorted[j]}`;
                    pairFrequency[key] = (pairFrequency[key] || 0) + 1;
                }
            }
        });

        const pairFrequencyData = Object.entries(pairFrequency)
            .map(([pair, count]) => ({ pair, count })).filter(n=>n.count)
            .sort((a, b) => b.count - a.count);

        const hotPairs = pairFrequencyData.slice(0, 300);
        const coldPairs = pairFrequencyData.slice(-30).reverse();

        setAnalysis({
            frequencyData,
            gapData,
            hotPairs,
            coldPairs,
            stats: {
                totalDraws,
                avgSize: avg(sizes),
                avgSum: avg(sums),
                avgRange: avg(ranges),
                avgRepetition: repetitions.length ? avg(repetitions) : '0',
                avgEvenOdd: {
                    even: avg(evenOddCounts.map(e => e.even)),
                    odd: avg(evenOddCounts.map(e => e.odd))
                },
                avgLowHigh: {
                    low: avg(lowHighCounts.map(e => e.low)),
                    high: avg(lowHighCounts.map(e => e.high))
                }
            },
            hotNumbers: frequencyData.slice(0, 60),
            coldNumbers: frequencyData.slice(-15).reverse(),
            sizeDistribution: sizes,
            sumDistribution: sums
        });
    };

    const tabList = [
        { key: 'frequency', label: 'Frequency Analysis' },
        { key: 'hot-cold', label: 'Hot & Cold Numbers' },
        { key: 'gaps', label: 'Gap Analysis' },
        { key: 'distribution', label: 'Draw Distributions' },
        { key: 'pairs', label: 'Hot & Cold Pairs' }

    ];

    return (
        <div className="w-full max-w-6xl mx-auto p-6 bg-white">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">Pattern Analysis Dashboard</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {['totalDraws', 'avgSize', 'avgSum', 'avgRange'].map((key, i) => (
                    <div key={key} className={`p-4 rounded-lg ${['bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-orange-50'][i]}`}>
                        <h3 className="font-semibold">{key.replace('avg', 'Average ').replace(/([A-Z])/g, ' $1')}</h3>
                        <p className="text-2xl font-bold">
                            {analysis.stats?.[key] || '–'}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Even/Odd Balance</h3>
                    <p>Even: <span className="font-bold text-blue-600">{analysis.stats?.avgEvenOdd?.even}</span></p>
                    <p>Odd: <span className="font-bold text-red-600">{analysis.stats?.avgEvenOdd?.odd}</span></p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Low/High Split</h3>
                    <p>Low (1–24): <span className="font-bold text-green-600">{analysis.stats?.avgLowHigh?.low}</span></p>
                    <p>High (25–49): <span className="font-bold text-purple-600">{analysis.stats?.avgLowHigh?.high}</span></p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {tabList.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`px-4 py-2 rounded-lg font-medium ${activeTab === key ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
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
