import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Play } from 'lucide-react';
import { calculateDrawFeatures } from '../../utils/gridMLTraining';

const GridFeaturesTab = ({ data }) => {
    const [inputNumbers, setInputNumbers] = useState('2, 9, 15, 27, 38, 40');
    const [features, setFeatures] = useState(null);
    const [error, setError] = useState('');

    const handleCalculateFeatures = () => {
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

            const calculatedFeatures = calculateDrawFeatures(nums);
            setFeatures(calculatedFeatures);
        } catch (err) {
            setError(err.message);
            setFeatures(null);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCalculateFeatures();
        }
    };

    // Prepare chart data from features
    const chartData = features
        ? Object.entries(features)
            .map(([key, value]) => ({
                name: key.replace(/([A-Z])/g, ' $1').trim(),
                value: typeof value === 'number' ? parseFloat(value.toFixed(2)) : value
            }))
            .filter(item => typeof item.value === 'number')
            .slice(0, 10)
        : [];

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-6 border border-emerald-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Extraction</h2>

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
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows="3"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Extract 20+ statistical and distributional features from lottery numbers
                        </p>
                    </div>

                    <button
                        onClick={handleCalculateFeatures}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        <Play size={20} />
                        Extract Features
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800">{error}</div>
                </div>
            )}

            {/* Features Display */}
            {features && (
                <div className="space-y-6">
                    {/* Chart */}
                    {chartData.length > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Features Visualization</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) => value.toFixed(2)}
                                    />
                                    <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Features Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                            <h3 className="text-lg font-semibold text-gray-900">All Extracted Features</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Feature</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Value</th>
                                        <th className="text-left px-6 py-3 font-semibold text-gray-700">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(features).map(([key, value], idx) => {
                                        const featureDescriptions = {
                                            count: 'Total numbers provided',
                                            sum: 'Sum of all numbers',
                                            average: 'Arithmetic mean',
                                            median: 'Middle value',
                                            min: 'Smallest number',
                                            max: 'Largest number',
                                            range: 'Max - Min',
                                            oddCount: 'Count of odd numbers',
                                            evenCount: 'Count of even numbers',
                                            lowCount: 'Numbers ≤ 24',
                                            highCount: 'Numbers > 24',
                                            standardDeviation: 'Statistical spread',
                                            variance: 'Squared standard deviation'
                                        };

                                        return (
                                            <tr
                                                key={idx}
                                                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                            >
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-700">
                                                    {typeof value === 'number' ? value.toFixed(3) : value}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-sm">
                                                    {featureDescriptions[key] || 'Feature value'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Feature Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <div className="text-2xl font-bold text-blue-600">{features.count}</div>
                            <div className="text-sm text-gray-600">Total Numbers</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <div className="text-2xl font-bold text-purple-600">{features.sum}</div>
                            <div className="text-sm text-gray-600">Sum</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <div className="text-2xl font-bold text-green-600">{features.average.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">Average</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <div className="text-2xl font-bold text-orange-600">{features.range}</div>
                            <div className="text-sm text-gray-600">Range</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!features && !error && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-lg">Enter numbers and click "Extract Features" to analyze</p>
                </div>
            )}
        </div>
    );
};

export default GridFeaturesTab;
