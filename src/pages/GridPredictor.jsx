import React, { useState, useEffect } from 'react';
import { Grid3x3, TrendingUp, Brain, Zap, BarChart3, Settings } from 'lucide-react';
import AnalyzeTab from '../components/GridTabs/AnalyzeTab';
import TrendsTab from '../components/GridTabs/TrendsTab';
import PredictTab from '../components/GridTabs/PredictTab';
import RegionsTab from '../components/GridTabs/RegionsTab';
import FeaturesTab from '../components/GridTabs/FeaturesTab';
import GridMLTab from '../components/GridTabs/GridMLTab';
import { truestdata } from '../constant/data';

const GridPredictor = () => {
    const [activeTab, setActiveTab] = useState('predict');
    const [data, setData] = useState([]);

    useEffect(() => {
        // Initialize data from historical lottery draws
        // Data is already [Newest, ..., Oldest] in constants
        setData(truestdata);
    }, []);

    const tabs = [
        { key: 'analyze', label: 'Analyze', icon: Zap },
        { key: 'trends', label: 'Trends', icon: TrendingUp },
        { key: 'predict', label: 'Predict', icon: Brain },
        { key: 'regions', label: 'Regions', icon: Grid3x3 },
        { key: 'features', label: 'Features', icon: BarChart3 },
        { key: 'ml', label: 'ML Export', icon: Settings }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'analyze':
                return <AnalyzeTab data={data} />;
            case 'trends':
                return <TrendsTab data={data} />;
            case 'predict':
                return <PredictTab data={data} />;
            case 'regions':
                return <RegionsTab data={data} />;
            case 'features':
                return <FeaturesTab data={data} />;
            case 'ml':
                return <GridMLTab data={data} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Grid3x3 size={32} className="text-blue-600" />
                        <h1 className="text-4xl font-bold text-gray-900">
                            8-Cell Grid Predictor
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        Explore lottery predictions using 49 possible 8-cell grid positions
                    </p>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
                    <div className="flex overflow-x-auto">
                        {tabs.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === key
                                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={20} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {renderTabContent()}
                </div>

                {/* Footer Info */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="font-semibold text-gray-900">620 Weeks</div>
                        <div>Historical data analyzed</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="font-semibold text-gray-900">49 Positions</div>
                        <div>Possible grid centers</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                        <div className="font-semibold text-gray-900">99.99%</div>
                        <div>Complexity reduction</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GridPredictor;
