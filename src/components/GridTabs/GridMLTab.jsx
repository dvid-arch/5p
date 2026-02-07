import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { generateTrainingData, exportForMachineLearning } from '../../utils/gridMLTraining';

const GridMLTab = () => {
    const [viewType, setViewType] = useState('summary');
    const [mlData, setMlData] = useState(null);

    useMemo(() => {
        const data = exportForMachineLearning();
        setMlData(data);
    }, []);

    const handleDownloadJSON = () => {
        if (!mlData) return;
        const exportData = exportForMachineLearning();
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'grid-ml-data.json';
        link.click();
    };

    const handleDownloadCSV = () => {
        if (!mlData) return;

        // Combine training and test data
        const allData = [...mlData.training, ...mlData.test];
        const headers = mlData.features || [];

        // Create CSV
        let csv = headers.join(',') + '\n';
        allData.forEach(row => {
            csv += headers.map(h => row[h] || '').join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'grid-ml-data.csv';
        link.click();
    };

    if (!mlData) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-lg">Unable to load ML training data</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Machine Learning Data Export</h2>
                <p className="text-gray-600">
                    Prepare training and test datasets with {mlData.features?.length || '20+'} features for TensorFlow.js or other ML frameworks
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{mlData.training?.length || 496}</div>
                    <div className="text-sm text-gray-600">Training Samples</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{mlData.test?.length || 124}</div>
                    <div className="text-sm text-gray-600">Test Samples</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{mlData.features?.length || 20}</div>
                    <div className="text-sm text-gray-600">Features Per Sample</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">80/20</div>
                    <div className="text-sm text-gray-600">Train/Test Split</div>
                </div>
            </div>

            {/* Download Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Dataset</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={handleDownloadJSON}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        <Download size={20} />
                        JSON Format (TensorFlow.js)
                    </button>
                    <button
                        onClick={handleDownloadCSV}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                        <Download size={20} />
                        CSV Format (Excel/Python)
                    </button>
                </div>
            </div>

            {/* View Controls */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex flex-wrap gap-4 items-center mb-6">
                    <div className="flex gap-2">
                        {[
                            { label: 'Summary', value: 'summary' },
                            { label: 'Training Data', value: 'training' },
                            { label: 'Test Data', value: 'test' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setViewType(option.value)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewType === option.value
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {viewType !== 'summary' && (
                        <div className="flex items-center gap-2 ml-auto">
                            <label htmlFor="sampleSize" className="text-sm text-gray-600">
                                Show:
                            </label>
                            <input
                                id="sampleSize"
                                type="number"
                                min="1"
                                max={viewType === 'training' ? (mlData.training?.length || 496) : (mlData.test?.length || 124)}
                                value={sampleSize}
                                onChange={(e) => setSampleSize(Math.min(Math.max(parseInt(e.target.value) || 1, 1), viewType === 'training' ? (mlData.training?.length || 496) : (mlData.test?.length || 124)))}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            />
                            <span className="text-sm text-gray-600">rows</span>
                        </div>
                    )}
                </div>

                {/* Summary View */}
                {viewType === 'summary' && (
                    <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Dataset Overview</h4>
                            <div className="text-sm text-gray-700 space-y-1">
                                <p>• <span className="font-semibold">Total Samples:</span> {(mlData.training?.length || 496) + (mlData.test?.length || 124)}</p>
                                <p>• <span className="font-semibold">Training Set:</span> {mlData.training?.length || 496} samples (80%)</p>
                                <p>• <span className="font-semibold">Test Set:</span> {mlData.test?.length || 124} samples (20%)</p>
                                <p>• <span className="font-semibold">Features:</span> {mlData.features?.length || 20} per sample</p>
                            </div>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Features Included</h4>
                            <div className="text-sm text-gray-700 space-y-1">
                                {mlData.features ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {mlData.features.map((feature, idx) => (
                                            <div key={idx}>• {feature}</div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>Average, Range, Odd/Even Distribution, Low/High Distribution, Standard Deviation, Variance, and more...</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <h4 className="font-semibold text-gray-900 mb-2">Usage Instructions</h4>
                            <div className="text-sm text-gray-700 space-y-2">
                                <p>1. Download the dataset in your preferred format (JSON or CSV)</p>
                                <p>2. Load into your ML framework (TensorFlow.js, PyTorch, Scikit-learn)</p>
                                <p>3. Use features as input and grid center predictions as output</p>
                                <p>4. Train and evaluate on the provided train/test split</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Tables */}
                {viewType !== 'summary' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-2 font-semibold text-gray-700">#</th>
                                    {mlData.features?.slice(0, 5).map((feature) => (
                                        <th key={feature} className="text-left px-4 py-2 font-semibold text-gray-700">
                                            {feature.substring(0, 12)}...
                                        </th>
                                    ))}
                                    <th className="text-left px-4 py-2 font-semibold text-gray-700">...</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(viewType === 'training' ? mlData.training : mlData.test)
                                    ?.slice(0, sampleSize)
                                    .map((row, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-2 font-medium text-gray-900">{idx + 1}</td>
                                            {mlData.features?.slice(0, 5).map((feature) => (
                                                <td key={feature} className="px-4 py-2 text-gray-700">
                                                    {typeof row[feature] === 'number'
                                                        ? row[feature].toFixed(2)
                                                        : row[feature]}
                                                </td>
                                            ))}
                                            <td className="px-4 py-2 text-gray-500">...</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-sm text-gray-700">
                <strong>Ready for ML:</strong> This dataset is normalized and formatted for immediate use with TensorFlow.js, PyTorch, or scikit-learn.
                Features are extracted from historical lottery data and optimized for grid prediction tasks.
            </div>
        </div>
    );
};

export default GridMLTab;
