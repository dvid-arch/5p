import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Clock, BarChart3, Target, Upload, Play, Settings } from 'lucide-react';
import { datamod } from '../constant/data';

const TemporalSequenceAnalyzer = () => {
    const [data, setData] = useState([])
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [settings, setSettings] = useState({
        numberRange: { min: 1, max: 49 },
        recentWeeksWeight: 3,
        overdueThreshold: 1.5,
        hotThreshold: 0.3,
        coldThreshold: 0.1
    });

    // Generate sample large dataset
    const generateSampleData = (weeks = 52) => {
        const sampleData = [];
        const frequencyBias = {};

        // Create some numbers that appear more frequently (hot numbers)
        const hotNumbers = [7, 12, 23, 35, 42];
        const coldNumbers = [1, 13, 26, 39, 48];

        for (let week = 1; week <= weeks; week++) {
            const weekNumbers = [];
            const numbersPerWeek = 5;

            while (weekNumbers.length < numbersPerWeek) {
                let num;

                // Bias towards hot numbers early, cold numbers later
                if (Math.random() < 0.3 && hotNumbers.some(h => !weekNumbers.includes(h))) {
                    num = hotNumbers[Math.floor(Math.random() * hotNumbers.length)];
                } else if (week > weeks * 0.7 && Math.random() < 0.2 && coldNumbers.some(c => !weekNumbers.includes(c))) {
                    num = coldNumbers[Math.floor(Math.random() * coldNumbers.length)];
                } else {
                    num = Math.floor(Math.random() * (settings.numberRange.max - settings.numberRange.min + 1)) + settings.numberRange.min;
                }

                if (!weekNumbers.includes(num)) {
                    weekNumbers.push(num);
                }
            }

            weekNumbers.sort((a, b) => a - b);
            sampleData.push({
                week,
                numbers: weekNumbers,
                date: new Date(2024, 0, week * 7).toISOString().split('T')[0]
            });
        }
        // console.log(sampleData)
        return sampleData;
    };

    // Initialize with sample data
    const convertDatamodToExpectedFormat = (datamod) => {
        return datamod.map((weekNumbers, index) => ({
            week: index + 1,
            numbers: weekNumbers.sort((a, b) => a - b), // Sort numbers in ascending order
            date: new Date(2024, 0, (index + 1) * 7).toISOString().split('T')[0]
        }));
    };

    // Usage in your useEffect:
    useEffect(() => {
        const convertedData = datamod && datamod.length > 0
            ? convertDatamodToExpectedFormat(datamod)
            : generateSampleData(52);

        setData(convertedData);
    }, []);

    // Robust temporal analysis engine
    const analyzeTemporalSequence = useMemo(() => {
        if (data.length < 2) return null;

        const analyzer = {
            // Temporal Markov Chain Analysis
            buildMarkovTransitions: () => {
                const transitions = {};
                const persistenceStats = {};

                for (let i = 0; i < data.length - 1; i++) {
                    const currentWeek = data[i].numbers;
                    const nextWeek = data[i + 1].numbers;

                    currentWeek.forEach(num => {
                        if (!transitions[num]) {
                            transitions[num] = { appears: 0, total: 0, probability: 0 };
                        }
                        transitions[num].total++;

                        if (nextWeek.includes(num)) {
                            transitions[num].appears++;
                        }
                    });
                }

                // Calculate probabilities
                Object.keys(transitions).forEach(num => {
                    transitions[num].probability = transitions[num].appears / transitions[num].total;
                });

                return transitions;
            },

            // Gap Analysis with statistical significance
            analyzeGaps: () => {
                const numberHistory = {};
                const currentWeek = data.length;

                // Build appearance history
                data.forEach((week, idx) => {
                    week.numbers.forEach(num => {
                        if (!numberHistory[num]) {
                            numberHistory[num] = [];
                        }
                        numberHistory[num].push(idx + 1);
                    });
                });

                const gapAnalysis = {};

                // Analyze gaps for each number
                for (let num = settings.numberRange.min; num <= settings.numberRange.max; num++) {
                    const appearances = numberHistory[num] || [];

                    if (appearances.length === 0) {
                        gapAnalysis[num] = {
                            status: 'never_appeared',
                            weeksSinceLastAppearance: Infinity,
                            avgGap: null,
                            dueScore: Infinity,
                            frequency: 0
                        };
                    } else {
                        const lastAppearance = appearances[appearances.length - 1];
                        const weeksSinceLastAppearance = currentWeek - lastAppearance;

                        if (appearances.length > 1) {
                            const gaps = [];
                            for (let i = 1; i < appearances.length; i++) {
                                gaps.push(appearances[i] - appearances[i - 1]);
                            }

                            const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
                            const gapVariance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
                            const gapStdDev = Math.sqrt(gapVariance);

                            gapAnalysis[num] = {
                                status: weeksSinceLastAppearance >= avgGap * settings.overdueThreshold ? 'overdue' : 'normal',
                                weeksSinceLastAppearance,
                                avgGap,
                                gapStdDev,
                                dueScore: weeksSinceLastAppearance / avgGap,
                                frequency: appearances.length / data.length,
                                appearances: appearances.length
                            };
                        } else {
                            gapAnalysis[num] = {
                                status: weeksSinceLastAppearance >= 3 ? 'potentially_due' : 'normal',
                                weeksSinceLastAppearance,
                                avgGap: null,
                                dueScore: weeksSinceLastAppearance / 3,
                                frequency: 1 / data.length,
                                appearances: 1
                            };
                        }
                    }
                }

                return gapAnalysis;
            },

            // Pattern Recognition with trend analysis
            analyzePatterns: () => {
                const patterns = {
                    frequency: {},
                    recentTrend: {},
                    cyclical: {},
                    momentum: {}
                };

                // Calculate frequency and recent trends
                data.forEach((week, idx) => {
                    const recentWeight = idx >= data.length - settings.recentWeeksWeight ? 2 : 1;

                    week.numbers.forEach(num => {
                        patterns.frequency[num] = (patterns.frequency[num] || 0) + 1;
                        patterns.recentTrend[num] = (patterns.recentTrend[num] || 0) + recentWeight;
                    });
                });

                // Calculate momentum (recent vs historical frequency)
                Object.keys(patterns.frequency).forEach(num => {
                    const totalFreq = patterns.frequency[num] / data.length;
                    const recentFreq = patterns.recentTrend[num] / (settings.recentWeeksWeight * 2 + (data.length - settings.recentWeeksWeight));
                    patterns.momentum[num] = recentFreq - totalFreq;
                });

                // Classify numbers
                const classification = {
                    hot: [],
                    cold: [],
                    trending: [],
                    declining: []
                };

                Object.keys(patterns.frequency).forEach(num => {
                    const freq = patterns.frequency[num] / data.length;
                    const momentum = patterns.momentum[num];

                    if (freq >= settings.hotThreshold) {
                        classification.hot.push(parseInt(num));
                    } else if (freq <= settings.coldThreshold) {
                        classification.cold.push(parseInt(num));
                    }

                    if (momentum > 0.1) {
                        classification.trending.push(parseInt(num));
                    } else if (momentum < -0.1) {
                        classification.declining.push(parseInt(num));
                    }
                });

                return { patterns, classification };
            },

            // Prediction engine
            generatePredictions: (markov, gaps, patterns) => {
                const predictions = {
                    markov: [],
                    gaps: [],
                    patterns: [],
                    ensemble: []
                };

                // Markov-based predictions
                const lastWeek = data[data.length - 1].numbers;
                lastWeek.forEach(num => {
                    const transition = markov[num];
                    if (transition && transition.probability > 0.3) {
                        predictions.markov.push({
                            number: num,
                            probability: transition.probability,
                            confidence: transition.total >= 5 ? 'high' : 'medium'
                        });
                    }
                });

                // Gap-based predictions
                Object.entries(gaps).forEach(([num, data]) => {
                    if (data.dueScore > settings.overdueThreshold && data.frequency > 0.05) {
                        predictions.gaps.push({
                            number: parseInt(num),
                            dueScore: data.dueScore,
                            confidence: data.appearances >= 3 ? 'high' : 'medium'
                        });
                    }
                });

                // Pattern-based predictions
                patterns.classification.trending.forEach(num => {
                    predictions.patterns.push({
                        number: num,
                        momentum: patterns.patterns.momentum[num],
                        confidence: 'medium'
                    });
                });

                // Ensemble prediction (combine all methods)
                const ensembleScores = {};

                predictions.markov.forEach(p => {
                    ensembleScores[p.number] = (ensembleScores[p.number] || 0) + p.probability * 0.4;
                });

                predictions.gaps.forEach(p => {
                    ensembleScores[p.number] = (ensembleScores[p.number] || 0) + Math.min(p.dueScore / 2, 0.5) * 0.3;
                });

                predictions.patterns.forEach(p => {
                    ensembleScores[p.number] = (ensembleScores[p.number] || 0) + Math.max(p.momentum, 0) * 0.3;
                });

                predictions.ensemble = Object.entries(ensembleScores)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([num, score]) => ({
                        number: parseInt(num),
                        score: score,
                        confidence: score > 0.3 ? 'high' : score > 0.15 ? 'medium' : 'low'
                    }));

                return predictions;
            }
        };

        // Run analysis
        const markovTransitions = analyzer.buildMarkovTransitions();
        const gapAnalysis = analyzer.analyzeGaps();
        const patternAnalysis = analyzer.analyzePatterns();
        const predictions = analyzer.generatePredictions(markovTransitions, gapAnalysis, patternAnalysis);

        return {
            markov: markovTransitions,
            gaps: gapAnalysis,
            patterns: patternAnalysis,
            predictions,
            metadata: {
                totalWeeks: data.length,
                totalNumbers: Object.keys(markovTransitions).length,
                analysisDate: new Date().toISOString()
            }
        };
    }, [data, settings]);

    // Analyze data
    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setAnalysis(analyzeTemporalSequence);
            setIsAnalyzing(false);
        }, 500);
    };

    // Generate new sample data
    const generateNewData = () => {
        const newData = generateSampleData(Math.floor(Math.random() * 100) + 20);
        console.log(newData)
        setData(newData);
        setAnalysis(null);
    };

    // Prepare chart data
    const prepareChartData = () => {
        if (!analysis) return {};

        // Frequency over time
        const frequencyData = [];
        const numberFreq = {};

        data.forEach((week, idx) => {
            week.numbers.forEach(num => {
                numberFreq[num] = (numberFreq[num] || 0) + 1;
            });

            if (idx % 4 === 0) { // Every 4 weeks
                frequencyData.push({
                    week: idx + 1,
                    ...Object.fromEntries(Object.entries(numberFreq).slice(0, 5))
                });
            }
        });

        // Hot/Cold distribution
        const hotColdData = [
            { name: 'Hot Numbers', value: analysis.patterns.classification.hot.length, color: '#ff4444' },
            { name: 'Cold Numbers', value: analysis.patterns.classification.cold.length, color: '#4444ff' },
            { name: 'Trending', value: analysis.patterns.classification.trending.length, color: '#44ff44' },
            { name: 'Declining', value: analysis.patterns.classification.declining.length, color: '#ffaa44' }
        ];

        // Gap analysis scatter
        const gapScatterData = Object.entries(analysis.gaps)
            .filter(([num, data]) => data.avgGap !== null)
            .map(([num, data]) => ({
                number: parseInt(num),
                avgGap: data.avgGap,
                dueScore: Math.min(data.dueScore, 5),
                frequency: data.frequency
            }));

        return { frequencyData, hotColdData, gapScatterData };
    };

    const chartData = prepareChartData();

    const TabButton = ({ id, label, icon: Icon, active, onClick }) => (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${active
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                Temporal Sequence Analysis Dashboard
                            </h1>
                            <p className="text-gray-600">
                                Advanced analysis of temporal patterns with {data.length} weeks of data
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={generateNewData}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                <Upload size={18} />
                                New Data
                            </button>
                            <button
                                onClick={runAnalysis}
                                disabled={isAnalyzing}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                                <Play size={18} />
                                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                    <div className="flex gap-2 overflow-x-auto">
                        <TabButton
                            id="overview"
                            label="Overview"
                            icon={BarChart3}
                            active={activeTab === 'overview'}
                            onClick={() => setActiveTab('overview')}
                        />
                        <TabButton
                            id="markov"
                            label="Markov Analysis"
                            icon={TrendingUp}
                            active={activeTab === 'markov'}
                            onClick={() => setActiveTab('markov')}
                        />
                        <TabButton
                            id="gaps"
                            label="Gap Analysis"
                            icon={Clock}
                            active={activeTab === 'gaps'}
                            onClick={() => setActiveTab('gaps')}
                        />
                        <TabButton
                            id="patterns"
                            label="Pattern Recognition"
                            icon={Target}
                            active={activeTab === 'patterns'}
                            onClick={() => setActiveTab('patterns')}
                        />
                        <TabButton
                            id="predictions"
                            label="Predictions"
                            icon={TrendingDown}
                            active={activeTab === 'predictions'}
                            onClick={() => setActiveTab('predictions')}
                        />
                        <TabButton
                            id="settings"
                            label="Settings"
                            icon={Settings}
                            active={activeTab === 'settings'}
                            onClick={() => setActiveTab('settings')}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">Data Summary</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                                        <div className="text-sm text-gray-600">Total Weeks</div>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-green-600">
                                            {analysis ? Object.keys(analysis.markov).length : 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Unique Numbers</div>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {analysis ? analysis.patterns.classification.hot.length : 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Hot Numbers</div>
                                    </div>
                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {analysis ? analysis.patterns.classification.cold.length : 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Cold Numbers</div>
                                    </div>
                                </div>
                            </div>

                            {analysis && chartData.hotColdData && (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">Number Classification</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={chartData.hotColdData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {chartData.hotColdData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {analysis && (
                                <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
                                    <h3 className="text-xl font-semibold mb-4">Recent Data</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Week</th>
                                                    <th className="text-left p-2">Date</th>
                                                    <th className="text-left p-2">Numbers</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.slice(-10).reverse().map((week, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 font-medium">{week.week}</td>
                                                        <td className="p-2">{week.date}</td>
                                                        <td className="p-2">
                                                            <div className="flex gap-1">
                                                                {week.numbers.map((num, i) => (
                                                                    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                                        {num}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Markov Analysis Tab */}
                    {activeTab === 'markov' && analysis && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">Markov Chain Transitions</h3>
                                <p className="text-gray-600 mb-4">
                                    Shows the probability of each number appearing in the next week based on its current appearance.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {Object.entries(analysis.markov)
                                        .sort(([, a], [, b]) => b.probability - a.probability)
                                        .slice(0, 20)
                                        .map(([num, data]) => (
                                            <div key={num} className="bg-gray-50 rounded-lg p-4">
                                                <div className="text-lg font-bold text-gray-800">{num}</div>
                                                <div className="text-sm text-gray-600">
                                                    {(data.probability * 100).toFixed(1)}% chance
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {data.appears}/{data.total} times
                                                </div>
                                                <div className="mt-2 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${data.probability * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gap Analysis Tab */}
                    {activeTab === 'gaps' && analysis && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">Gap Analysis</h3>
                                <p className="text-gray-600 mb-4">
                                    Identifies numbers that are overdue based on their historical appearance patterns.
                                </p>

                                {chartData.gapScatterData && (
                                    <div className="mb-6">
                                        <h4 className="text-lg font-semibold mb-2">Average Gap vs Due Score</h4>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <ScatterChart data={chartData.gapScatterData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis
                                                    dataKey="avgGap"
                                                    name="Average Gap"
                                                    label={{ value: 'Average Gap (weeks)', position: 'insideBottom', offset: -5 }}
                                                />
                                                <YAxis
                                                    dataKey="dueScore"
                                                    name="Due Score"
                                                    label={{ value: 'Due Score', angle: -90, position: 'insideLeft' }}
                                                />
                                                <Tooltip
                                                    formatter={(value, name) => [value.toFixed(2), name]}
                                                    labelFormatter={(label) => `Number: ${label}`}
                                                />
                                                <Scatter name="Numbers" dataKey="dueScore" fill="#8884d8" />
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold mb-3">Most Overdue Numbers</h4>
                                        <div className="space-y-2">
                                            {Object.entries(analysis.gaps)
                                                .filter(([num, data]) => data.status === 'overdue')
                                                .sort(([, a], [, b]) => b.dueScore - a.dueScore)
                                                .slice(0, 10)
                                                .map(([num, data]) => (
                                                    <div key={num} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                                                        <div>
                                                            <span className="font-bold text-red-800">{num}</span>
                                                            <span className="text-sm text-red-600 ml-2">
                                                                {data.weeksSinceLastAppearance} weeks ago
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-medium text-red-700">
                                                                {data.dueScore.toFixed(1)}x overdue
                                                            </div>
                                                            <div className="text-xs text-red-500">
                                                                Avg gap: {data.avgGap?.toFixed(1)} weeks
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold mb-3">Never Appeared</h4>
                                        <div className="space-y-2">
                                            {Object.entries(analysis.gaps)
                                                .filter(([num, data]) => data.status === 'never_appeared')
                                                .slice(0, 10)
                                                .map(([num, data]) => (
                                                    <div key={num} className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                                                        <span className="font-bold text-yellow-800">{num}</span>
                                                        <span className="text-sm text-yellow-600">Never appeared</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pattern Recognition Tab */}
                    {activeTab === 'patterns' && analysis && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">Pattern Recognition</h3>
                                <p className="text-gray-600 mb-4">
                                    Identifies hot, cold, trending, and declining numbers based on frequency and momentum analysis.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold mb-3 text-red-600">Hot Numbers</h4>
                                        <div className="space-y-2">
                                            {analysis.patterns.classification.hot.map(num => (
                                                <div key={num} className="bg-red-50 rounded-lg p-3">
                                                    <div className="font-bold text-red-800">{num}</div>
                                                    <div className="text-sm text-red-600">
                                                        {((analysis.patterns.patterns.frequency[num] / data.length) * 100).toFixed(1)}% freq
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold mb-3 text-blue-600">Cold Numbers</h4>
                                        <div className="space-y-2">
                                            {analysis.patterns.classification.cold.map(num => (
                                                <div key={num} className="bg-blue-50 rounded-lg p-3">
                                                    <div className="font-bold text-blue-800">{num}</div>
                                                    <div className="text-sm text-blue-600">
                                                        {((analysis.patterns.patterns.frequency[num] / data.length) * 100).toFixed(1)}% freq
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold mb-3 text-green-600">Trending Up</h4>
                                        <div className="space-y-2">
                                            {analysis.patterns.classification.trending.map(num => (
                                                <div key={num} className="bg-green-50 rounded-lg p-3">
                                                    <div className="font-bold text-green-800">{num}</div>
                                                    <div className="text-sm text-green-600">
                                                        +{(analysis.patterns.patterns.momentum[num] * 100).toFixed(1)}% momentum
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-semibold mb-3 text-orange-600">Declining</h4>
                                        <div className="space-y-2">
                                            {analysis.patterns.classification.declining.map(num => (
                                                <div key={num} className="bg-orange-50 rounded-lg p-3">
                                                    <div className="font-bold text-orange-800">{num}</div>
                                                    <div className="text-sm text-orange-600">
                                                        {(analysis.patterns.patterns.momentum[num] * 100).toFixed(1)}% momentum
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Predictions Tab */}
                    {activeTab === 'predictions' && analysis && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-semibold mb-4">Predictions for Next Week</h3>
                                <p className="text-gray-600 mb-6">
                                    Combined predictions using Markov chains, gap analysis, and pattern recognition.
                                </p>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold mb-3">Ensemble Predictions</h4>
                                        <div className="space-y-3">
                                            {analysis.predictions.ensemble.slice(0, 10).map((pred, idx) => (
                                                <div key={pred.number} className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-lg">{pred.number}</div>
                                                            <div className="text-sm text-gray-600 capitalize">{pred.confidence} confidence</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-purple-600">
                                                            {(pred.score * 100).toFixed(1)}%
                                                        </div>
                                                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                                                            <div
                                                                className="bg-purple-500 h-2 rounded-full"
                                                                style={{ width: `${Math.min(pred.score * 200, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-lg font-semibold mb-3">Method Breakdown</h4>

                                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                                <h5 className="font-semibold text-blue-800 mb-2">Markov Chain</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysis.predictions.markov.slice(0, 5).map(pred => (
                                                        <span key={pred.number} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                                            {pred.number} ({(pred.probability * 100).toFixed(1)}%)
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-red-50 rounded-lg p-4 mb-4">
                                                <h5 className="font-semibold text-red-800 mb-2">Gap Analysis</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysis.predictions.gaps.slice(0, 5).map(pred => (
                                                        <span key={pred.number} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                                                            {pred.number} ({pred.dueScore.toFixed(1)}x)
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="bg-green-50 rounded-lg p-4">
                                                <h5 className="font-semibold text-green-800 mb-2">Pattern Recognition</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {analysis.predictions.patterns.slice(0, 5).map(pred => (
                                                        <span key={pred.number} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                                                            {pred.number} (+{(pred.momentum * 100).toFixed(1)}%)
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-lg font-semibold mb-3">Prediction Confidence</h4>
                                            <div className="space-y-2">
                                                {['high', 'medium', 'low'].map(confidence => {
                                                    const count = analysis.predictions.ensemble.filter(p => p.confidence === confidence).length;
                                                    const percentage = (count / analysis.predictions.ensemble.length) * 100;
                                                    return (
                                                        <div key={confidence} className="flex items-center justify-between">
                                                            <span className="capitalize text-gray-700">{confidence} Confidence</span>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className={`h-2 rounded-full ${confidence === 'high' ? 'bg-green-500' :
                                                                            confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                                                            }`}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-sm text-gray-600">{count}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">Analysis Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-lg font-semibold mb-3">Number Range</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Minimum Number
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.numberRange.min}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    numberRange: { ...prev.numberRange, min: parseInt(e.target.value) }
                                                }))}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Maximum Number
                                            </label>
                                            <input
                                                type="number"
                                                value={settings.numberRange.max}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    numberRange: { ...prev.numberRange, max: parseInt(e.target.value) }
                                                }))}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold mb-3">Analysis Parameters</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Recent Weeks Weight ({settings.recentWeeksWeight})
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={settings.recentWeeksWeight}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    recentWeeksWeight: parseInt(e.target.value)
                                                }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Overdue Threshold ({settings.overdueThreshold})
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="3"
                                                step="0.1"
                                                value={settings.overdueThreshold}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    overdueThreshold: parseFloat(e.target.value)
                                                }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Hot Threshold ({settings.hotThreshold})
                                            </label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="0.5"
                                                step="0.05"
                                                value={settings.hotThreshold}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    hotThreshold: parseFloat(e.target.value)
                                                }))}
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Cold Threshold ({settings.coldThreshold})
                                            </label>
                                            <input
                                                type="range"
                                                min="0.01"
                                                max="0.2"
                                                step="0.01"
                                                value={settings.coldThreshold}
                                                onChange={(e) => setSettings(prev => ({
                                                    ...prev,
                                                    coldThreshold: parseFloat(e.target.value)
                                                }))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                                <h5 className="font-semibold text-yellow-800 mb-2">Important Notes</h5>
                                <ul className="text-sm text-yellow-700 space-y-1">
                                    <li>• This is a demonstration of temporal analysis methods</li>
                                    <li>• Results are based on historical patterns and statistical analysis</li>
                                    <li>• Larger datasets provide more reliable predictions</li>
                                    <li>• No prediction method can guarantee future outcomes</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Advanced Temporal Sequence Analysis Dashboard</p>
                    <p>Built with React, Recharts, and statistical analysis methods</p>
                </div>
            </div>
        </div>
    );
};

export default TemporalSequenceAnalyzer;