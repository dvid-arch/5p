import React, { useState } from 'react';
import { calculateDrawFeatures } from '../../utils/gridMLTraining';

const FeaturesTab = () => {
    const [input, setInput] = useState('');
    const [features, setFeatures] = useState(null);

    const handleCalculate = () => {
        try {
            const nums = input.split(/[\s,]+/)
                .map(n => parseInt(n.trim()))
                .filter(n => !isNaN(n));

            if (nums.length > 0) {
                setFeatures(calculateDrawFeatures(nums));
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold mb-4">Feature Inspector</h3>
                <div className="flex gap-4 mb-4">
                    <input
                        className="flex-1 p-2 border rounded font-mono"
                        placeholder="2, 9, 15, 27, 38, 40"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button
                        onClick={handleCalculate}
                        className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
                    >
                        Extract
                    </button>
                </div>
            </div>

            {features && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(features).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-4 rounded border">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-xl font-bold text-gray-800">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturesTab;
