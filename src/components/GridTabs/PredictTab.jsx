import React, { useMemo, useState } from 'react';
import { findOptimalGridPortfolio, backtestPortfolio, getSmart20Numbers, getBaselineTop20, getInstitutional20 } from '../../utils/gridPredictor';
import GridVisualization from './GridVisualization';
import { TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const PredictTab = ({ data }) => {
    const [recentWeeks, setRecentWeeks] = useState(13);
    const [portfolioSize, setPortfolioSize] = useState(3);
    const [showBacktest, setShowBacktest] = useState(false);

    const portfolio = useMemo(() => {
        return findOptimalGridPortfolio(data, portfolioSize, recentWeeks);
    }, [data, recentWeeks, portfolioSize]);

    const backtestResults = useMemo(() => {
        if (!showBacktest) return null;
        return backtestPortfolio(data, 20, portfolioSize, recentWeeks);
    }, [data, showBacktest, portfolioSize, recentWeeks]);

    const totalCoverage = portfolio.length > 0 ? portfolio[portfolio.length - 1].coveragePercent : 0;

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                <h3 className="text-xl font-bold text-indigo-900 mb-2">Optimized Grid Portfolio</h3>
                <p className="text-indigo-700 text-sm mb-4">
                    Selects a set of complementary grids that cover the maximum number of unique winning numbers together.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Recency Weight (Weeks): {recentWeeks}</label>
                        <input
                            type="range" min="5" max="52" step="1"
                            value={recentWeeks}
                            onChange={e => setRecentWeeks(parseInt(e.target.value))}
                            className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Portfolio Size: {portfolioSize} Grids</label>
                        <input
                            type="range" min="1" max="5" step="1"
                            value={portfolioSize}
                            onChange={e => setPortfolioSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Stat */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <span className="font-bold text-green-900 text-lg">Combined Coverage Efficiency</span>
                    <p className="text-green-700 text-sm">Percentage of winning numbers caught by these {portfolioSize} grids in the last {recentWeeks} weeks.</p>
                </div>
                <div className="text-3xl font-bold text-green-600">
                    {totalCoverage}%
                </div>
            </div>

            {/* Predictions Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {portfolio.map((pred, idx) => (
                    <div key={pred.center} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col relative">
                        {idx > 0 && (
                            <div className="absolute top-0 left-0 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 z-10">
                                +{((pred.marginalGain / pred.totalPossible) * 100).toFixed(1)}% Unique Boost
                            </div>
                        )}
                        <div className="bg-gray-50 p-4 border-b text-center pt-8">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pick #{idx + 1}</span>
                            <div className="text-3xl font-bold text-indigo-600 mt-1">Center {pred.center}</div>
                            <div className="text-xs text-gray-400">Adds {pred.marginalGain} unique hits</div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col items-center">
                            <GridVisualization
                                center={pred.center}
                                activeCells={pred.cells}
                                winningNumbers={[]}
                            />

                            <div className="w-full mt-4 space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`${pred.gap <= 5 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                        {pred.gap <= 3 ? '🔥 VERY HOT' : pred.gap <= 8 ? '⚡ HOT' : '🧊 COLD'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                    <span className="text-gray-600">Contribution:</span>
                                    <span className="font-bold text-green-600">{(pred.cumulativeHits / pred.totalPossible * 100).toFixed(1)}% Cumulative</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {'}'}
            </div>

            {/* Strategy Comparison Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. New Strategy */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-500 p-2 rounded-lg">
                            <CheckCircle className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Grid Strategy</h3>
                            <p className="text-slate-400 text-sm">Smart 20 (Portfolio Optimized)</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {useMemo(() => getSmart20Numbers(portfolio), [portfolio]).map(num => (
                            <div key={num} className="w-9 h-9 bg-white text-slate-900 rounded-full font-bold flex items-center justify-center shadow-lg border-2 border-blue-400 text-sm">
                                {num}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Institutional Strategy */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-gray-200 p-2 rounded-lg">
                            <TrendingUp className="text-gray-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-700">Institutional Strategy</h3>
                            <p className="text-gray-500 text-sm">Top 20 Ensemble Predictions (Deep Learning)</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {/* Uses Full Engine for Display */}
                        {useMemo(() => getInstitutional20(data), [data]).map(num => (
                            <div key={num} className="w-9 h-9 bg-gray-100 text-gray-600 rounded-full font-bold flex items-center justify-center border border-gray-300 text-sm" title={`Top predicted number from Institutional Analysis Engine`}>
                                {num}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Backtest Toggle */}
            <div className="flex justify-center border-t pt-4">
                <button
                    onClick={() => setShowBacktest(!showBacktest)}
                    className="flex items-center gap-2 text-indigo-600 font-semibold hover:bg-indigo-50 px-4 py-2 rounded transition"
                >
                    <TrendingUp size={20} />
                    {showBacktest ? "Hide Performance Report" : "Show Historical Performance Report (Last 20 Draws)"}
                </button>
            </div>

            {/* Backtest Report */}
            {
                showBacktest && backtestResults && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 animate-fade-in">
                        <h4 className="font-bold text-lg text-slate-800 mb-4">Performance: How did this strategy perform?</h4>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded shadow-sm">
                                <div className="text-gray-500 text-sm">Average Hits / Week</div>
                                <div className="text-2xl font-bold text-indigo-600">
                                    {backtestResults.summary.avgHits} <span className="text-sm text-gray-400">/ {backtestResults.draws[0]?.totalPossible || 6}</span>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded shadow-sm">
                                <div className="text-gray-500 text-sm">Success Rate (3+ Hits)</div>
                                <div className="text-2xl font-bold text-green-600">
                                    {backtestResults.summary.successRate}%
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded shadow-sm">
                                <div className="text-gray-500 text-sm">Simulated Weeks</div>
                                <div className="text-2xl font-bold text-slate-700">
                                    {backtestResults.summary.simulationCount}
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded shadow-sm text-white">
                                <div className="text-indigo-100 text-sm font-semibold">High Accuracy (8+ Hits)</div>
                                <div className="text-2xl font-bold">
                                    {backtestResults.summary.hits8Plus}% <span className="text-sm opacity-75">({backtestResults.summary.rawCount8Plus} times)</span>
                                </div>
                            </div>
                        </div>

                        {/* Strategy Comparison Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
                                <h5 className="font-bold text-indigo-900 mb-2">🏆 Grid Strategy (Smart 20)</h5>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-3xl font-bold text-indigo-600">{backtestResults.summary.avgHits}</div>
                                        <div className="text-xs text-indigo-400">Avg Hits / Week</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-green-600">{backtestResults.summary.successRate}%</div>
                                        <div className="text-xs text-gray-400">Success Rate</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 opacity-75">
                                <h5 className="font-bold text-gray-700 mb-2">📉 Institutional (Baseline)</h5>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-3xl font-bold text-gray-600">{backtestResults.summary.avgBaselineHits}</div>
                                        <div className="text-xs text-gray-400">Avg Hits / Week</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-gray-500">{backtestResults.summary.successRateBaseline}%</div>
                                        <div className="text-xs text-gray-400">Success Rate</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Explanation Alert */}
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        <strong>Note on Performance Shift:</strong> You noticed the score dropped from 9.2 to ~7.3 after fixing data order.
                                        The previous high score was due to <em>"Look-Ahead Bias"</em> (the system accidentally used future patterns to predict past results).
                                        The current score is the <strong>real world accuracy</strong> using only past data.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Log */}
                        <div className="bg-white rounded border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 font-semibold text-slate-600">
                                    <tr>
                                        <th className="p-3">Draw</th>
                                        <th className="p-3">Predicted Grids</th>
                                        <th className="p-3 hidden md:table-cell">Winning Numbers</th>
                                        <th className="p-3">Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {backtestResults.draws.map((log, idx) => (
                                        <tr key={idx} className="border-b hover:bg-slate-50">
                                            <td className="p-3 text-slate-500">Week -{idx}</td>
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    {log.predictedGrids.map(g => (
                                                        <span key={g} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">
                                                            #{g}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-400 font-mono text-xs hidden md:table-cell">
                                                {log.numbers.join(', ')}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${log.hits >= 3 ? 'text-green-600' : 'text-orange-500'}`}>
                                                        {log.hits} Hits
                                                    </span>
                                                    <span className="text-slate-400 text-xs">
                                                        ({log.coveredNumbers.join(', ')})
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 italic">
                            * Based on {portfolioSize} grids prediction using only data available prior to each draw.
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PredictTab;
