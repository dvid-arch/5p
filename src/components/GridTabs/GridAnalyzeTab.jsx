import React, { useState } from 'react';
import { Play, AlertCircle } from 'lucide-react';
import GridVisualization from './GridVisualization';
import { findOptimalGridCenters } from '../../utils/gridPredictor';

const GridAnalyzeTab = ({ data }) => {
    const [inputNumbers, setInputNumbers] = useState('2, 9, 15, 27, 38, 40');
    const [topN, setTopN] = useState(3);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [selectedCenter, setSelectedCenter] = useState(null);

    const handleAnalyze = () => {
        try {
            setError('');
            const nums = inputNumbers
                .split(',')
                .map(n => {
                    const parsed = parseInt(n.trim());
                    if (isNaN(parsed) || parsed < 1 || parsed > 49) {
                        throw new Error(`Invalid number: ${n.trim()}. Must be between 1-49.`);
                    }
                    return parsed;
                });

            if (nums.length === 0) {
                throw new Error('Please enter at least one number');
            }

            const analysisResults = findOptimalGridCenters(nums, topN);
            setResults(analysisResults);
            setSelectedCenter(analysisResults.length > 0 ? analysisResults[0].center : null);
        } catch (err) {
            setError(err.message);
            setResults(null);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analyze Grid Coverage</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter Lottery Numbers (comma-separated)
                        </label>
                        <textarea
                            value={inputNumbers}
                            onChange={(e) => setInputNumbers(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="e.g., 2, 9, 15, 27, 38, 40"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="3"
                        />
                        <p className="text-xs text-gray-500 mt-1">Numbers must be between 1-49</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Top N Results: {topN}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={topN}
                            onChange={(e) => setTopN(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Play size={20} />
                        Analyze Grid Coverage
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                    <div className="text-red-800">{error}</div>
                </div>
            )}

            {/* Results Section */}
            {results && results.length > 0 && (
                <div className="space-y-6">
                    {/* Results Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Rank</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Center</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Coverage</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Efficiency</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Cells</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((result, idx) => (
                                        <tr
                                            key={idx}
                                            onClick={() => setSelectedCenter(result.center)}
                                            className={`border-b cursor-pointer transition-colors ${
                                                selectedCenter === result.center
                                                    ? 'bg-blue-50'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-6 py-4 font-semibold text-gray-900">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold">
                                                    #{result.center}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {result.coverage} / {inputNumbers.split(',').length}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {result.efficiency.toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {result.cells.slice(0, 5).join(', ')}
                                                {result.cells.length > 5 ? '...' : ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Grid Visualization */}
                    {selectedCenter !== null && (
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Grid Visualization - Center #{selectedCenter}
                            </h3>
                            <GridVisualization
                                center={selectedCenter}
                                winningNumbers={inputNumbers
                                    .split(',')
                                    .map(n => parseInt(n.trim()))
                                    .filter(n => !isNaN(n))}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!results && !error && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-lg">Enter numbers and click "Analyze Grid Coverage" to get started</p>
                </div>
            )}
        </div>
    );
};

export default GridAnalyzeTab;
