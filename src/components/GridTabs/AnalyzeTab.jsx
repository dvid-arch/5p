import React, { useState } from 'react';
import { findOptimalGridCenters } from '../../utils/gridPredictor';
import GridVisualization from './GridVisualization';

const AnalyzeTab = () => {
    const [input, setInput] = useState('');
    const [topN, setTopN] = useState(3);
    const [results, setResults] = useState(null);
    const [selectedResult, setSelectedResult] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = () => {
        setError('');
        try {
            // Parse input: "2, 9, 15..." -> [2, 9, 15]
            const nums = input.split(/[\s,]+/)
                .map(n => parseInt(n.trim()))
                .filter(n => !isNaN(n) && n > 0 && n <= 49);

            if (nums.length < 3) {
                setError('Please enter at least 3 valid numbers (1-49)');
                return;
            }

            const analysis = findOptimalGridCenters(nums, topN);
            setResults({ numbers: nums, analysis });
            setSelectedResult(analysis[0]); // Auto-select first
        } catch (err) {
            setError('Invalid input format');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold mb-4">Analyze a Draw</h3>

                <div className="flex gap-4 mb-4">
                    <input
                        className="flex-1 p-2 border rounded"
                        placeholder="Enter numbers (e.g. 2, 9, 15, 27, 38, 40)"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button
                        onClick={handleAnalyze}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                    >
                        Analyze
                    </button>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <label>Show Top:</label>
                    <input
                        type="range" min="1" max="10"
                        value={topN} onChange={e => setTopN(parseInt(e.target.value))}
                    />
                    <span>{topN}</span>
                </div>
            </div>

            {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Results Table */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h4 className="font-bold mb-3">Top Grid Centers</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="p-2">Rank</th>
                                        <th className="p-2">Center</th>
                                        <th className="p-2">Coverage</th>
                                        <th className="p-2">Efficiency</th>
                                        <th className="p-2">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.analysis.map((item, idx) => (
                                        <tr key={item.center} className={`border-b ${selectedResult?.center === item.center ? 'bg-blue-50' : ''}`}>
                                            <td className="p-2 font-bold text-gray-500">#{idx + 1}</td>
                                            <td className="p-2 font-bold text-blue-600">{item.center}</td>
                                            <td className="p-2 text-green-600 font-bold">{item.coverage}</td>
                                            <td className="p-2">{item.efficiency}%</td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => setSelectedResult(item)}
                                                    className="text-indigo-600 hover:underline"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Visualization */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col items-center justify-center">
                        <h4 className="font-bold mb-3">
                            Visualizing Center #{selectedResult?.center}
                        </h4>
                        {selectedResult && (
                            <GridVisualization
                                winningNumbers={results.numbers}
                                activeCells={selectedResult.cells}
                                center={selectedResult.center}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyzeTab;
