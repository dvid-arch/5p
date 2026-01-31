import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, TrendingDown, Settings, Upload, Play, Repeat, X, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Radio } from 'lucide-react';
import { truestdata } from '../constant/data';
import { useLotteryAnalysis, analyzeLotteryData } from '../hooks/useLotteryAnalysis';

// Components
import OverviewTab from '../components/AnalysisTabs/OverviewTab';
import MarkovTab from '../components/AnalysisTabs/MarkovTab';
import GapTab from '../components/AnalysisTabs/GapTab';
import PatternTab from '../components/AnalysisTabs/PatternTab';
import ChaseTab from '../components/AnalysisTabs/ChaseTab';
import PredictionTab from '../components/AnalysisTabs/PredictionTab';
import SignalTab from '../components/AnalysisTabs/SignalTab';


// Helper functions
const generateSampleData = (weeks = 52, settings = { numberRange: { min: 1, max: 49 } }) => {
    const sampleData = [];
    const hotNumbers = [7, 12, 23, 35, 42];
    const coldNumbers = [1, 13, 26, 39, 48];

    for (let week = 1; week <= weeks; week++) {
        const weekNumbers = [];
        const numbersPerWeek = 5;

        while (weekNumbers.length < numbersPerWeek) {
            let num;
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
    return sampleData;
};

const convertTruestdataToExpectedFormat = (dm) => {
    if (!dm) return [];
    // dm is [Newest, ..., Oldest]
    const total = dm.length;
    return dm.map((nums, i) => ({
        week: i + 1, // Newest gets 1
        numbers: [...nums].sort((a, b) => a - b),
        date: new Date(2024, 0, (total - i) * 7).toISOString().split('T')[0]
    })); // Keep as [Newest, ..., Oldest] to allow hook to flip it once correctly
};

const TemporalSequenceAnalyzer = () => {
    const [data, setData] = useState(() => {
        return truestdata && truestdata.length > 0
            ? convertTruestdataToExpectedFormat(truestdata)
            : generateSampleData(52);
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [settings, setSettings] = useState({
        numberRange: { min: 1, max: 49 },
        recentWeeksWeight: 3,
        overdueThreshold: 1.5,
        hotThreshold: 0.21,
        coldThreshold: 0.19,
    });
    const [selectedDraw, setSelectedDraw] = useState(null);
    const [historicalPrediction, setHistoricalPrediction] = useState(null);

    // Hook for analysis
    const analysis = useLotteryAnalysis(data, settings);

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            // In a real app, we might trigger a re-fetch here
        }, 800);
    };

    const generateNewData = () => {
        const newData = generateSampleData(Math.floor(Math.random() * 100) + 20);
        setData(newData);
    };

    const handleDrawSelect = (draw) => {
        // Since data is [Newest, ..., Oldest], the "Past Data" for a specific week 
        // is everything AFTER its index in the array.
        const drawIndex = data.findIndex(d => d.week === draw.week);

        // We need at least 50 weeks of history to make a valid prediction
        const historyAvailable = data.length - drawIndex - 1;

        if (historyAvailable < 50) {
            alert(`Not enough historical data before Week ${draw.week} to simulate a prediction. (Need 50+ weeks of prior history)`);
            return;
        }

        const pastData = data.slice(drawIndex + 1);
        const prediction = analyzeLotteryData(pastData, settings);

        setHistoricalPrediction(prediction);
        setSelectedDraw(draw);
    };

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

    const HistoricalModal = () => {
        if (!selectedDraw || !historicalPrediction) return null;

        const actualNumbers = selectedDraw.numbers;

        // UNIFIED AUDIT LOGIC: Use Signal Intelligence for Historical Reviews
        const { signalPredictions, chasePairs } = historicalPrediction;
        const top5Singles = signalPredictions.singles?.slice(0, 5) || [];
        const topPair = signalPredictions.bankers?.length > 0 ? signalPredictions.bankers[0] : null;

        // Chase Strategy Logic

        // TIME TRAVEL: Look up what we predicted BACK THEN
        const historyLog = historicalPrediction.backtest?.historyLog || {};
        const pastPrediction = historyLog[selectedDraw.week];

        // 1. Chase Pairs
        // Use historical record if available, otherwise fallback to current best (which might be anachronistic)
        const bestChasePair = pastPrediction?.bestChasePair || (chasePairs && chasePairs.length > 0
            ? [...chasePairs].sort((a, b) => b.readiness - a.readiness)[0]
            : null);

        let chaseOutcome = null;

        if (bestChasePair) {
            // Smart Harvest Window Lookup
            // We trust the hook's "expectedIn" calculation which accounts for volatility
            const expectedIn = bestChasePair.expectedIn || 1;
            const dueInWeeks = expectedIn;

            const currentDrawIndex = data.findIndex(d => d.week === selectedDraw.week);
            if (currentDrawIndex !== -1) {
                let winWeekOffset = -1;
                let hitWeek = -1;
                // If it's a historical object, it has 'pair' property directly
                const pairStr = bestChasePair.pair;
                const targetNums = pairStr.split('-').map(Number);

                // Check up to 10 weeks beyond current to see if the chase hit
                for (let i = 1; i <= Math.max(10, expectedIn + 3); i++) {
                    const futureDraw = data[currentDrawIndex - i]; // Subtraction because descending [Newest, ..., Oldest]
                    if (!futureDraw) break;
                    // Alpha Strategy: 2-to-play requires BOTH numbers to hit
                    const hasP1 = futureDraw.numbers.includes(targetNums[0]);
                    const hasP2 = futureDraw.numbers.includes(targetNums[1]);
                    if (hasP1 && hasP2) {
                        winWeekOffset = i;
                        hitWeek = futureDraw.week;
                        break;
                    }
                }
                chaseOutcome = { hit: winWeekOffset !== -1, weeksToHit: winWeekOffset, dueIn: dueInWeeks, hitWeek };
            }
        }

        // 2. Chase Singles
        // Prioritize historical lookup
        const diffChases = historicalPrediction.chaseSingles || [];
        const bestChaseSingle = pastPrediction?.bestChaseSingle || (diffChases.length > 0 ? diffChases[0] : null);
        let singleChaseOutcome = null;

        if (bestChaseSingle) {
            const expectedIn = bestChaseSingle.expectedIn || 1;

            const currentDrawIndex = data.findIndex(d => d.week === selectedDraw.week);
            if (currentDrawIndex !== -1) {
                let winWeekOffset = -1;
                let hitWeek = -1;
                for (let i = 1; i <= Math.max(10, expectedIn + 3); i++) { // Check window + buffer
                    const futureDraw = data[currentDrawIndex - i]; // Subtraction because descending
                    if (!futureDraw) break;
                    if (futureDraw.numbers.includes(bestChaseSingle.number)) {
                        winWeekOffset = i;
                        hitWeek = futureDraw.week;
                        break;
                    }
                }
                singleChaseOutcome = { hit: winWeekOffset !== -1, weeksToHit: winWeekOffset, hitWeek };
            }
        }

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="sticky top-0 bg-white/90 backdrop-blur-md p-6 border-b border-gray-100 flex justify-between items-center z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="text-xs font-bold text-blue-500 uppercase tracking-wider">Historical Review</div>
                                <span className="bg-blue-100 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Blind Simulation</span>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                Predicting Week {selectedDraw.week}
                                <div className="flex gap-1 ml-4">
                                    <button
                                        onClick={() => {
                                            const currIdx = data.findIndex(d => d.week === selectedDraw.week);
                                            if (currIdx > 0) handleDrawSelect(data[currIdx - 1]);
                                        }}
                                        disabled={data.findIndex(d => d.week === selectedDraw.week) <= 0}
                                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                        title="Previous Week"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            const currIdx = data.findIndex(d => d.week === selectedDraw.week);
                                            if (currIdx < data.length - 1) handleDrawSelect(data[currIdx + 1]);
                                        }}
                                        disabled={data.findIndex(d => d.week === selectedDraw.week) >= data.length - 1}
                                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 disabled:opacity-30"
                                        title="Next Week"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </h3>
                            <div className="text-sm text-gray-500 mt-1">Actual Result:
                                <span className="ml-2 font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                                    {actualNumbers.join(' - ')}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedDraw(null)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* 1. Banker Pairs Performance */}
                        {topPair ? (
                            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Target size={100} className="text-indigo-900" />
                                </div>
                                <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                    <span className="bg-indigo-200 text-indigo-800 p-1 rounded-md text-xs">STRATEGY 1</span>
                                    Top Banker Pair (1-to-Play)
                                </h4>

                                <div className="flex items-center gap-6">
                                    <div className="text-center bg-white p-4 rounded-xl shadow-sm min-w-[120px] relative">
                                        <div className="text-xs text-gray-400 uppercase font-bold mb-1">Predicted</div>
                                        <div className="text-2xl font-black text-indigo-600">
                                            {topPair.numbers.join('-')}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-1">
                                            {(topPair.strength * 100).toFixed(0)}% Hits (Sim)
                                        </div>
                                        {/* Show Smart Timing if this banker is also a Chase candidate */}
                                        {(() => {
                                            const chaseMatch = historicalPrediction.chaseBankers?.find(cb => cb.pair === topPair.pair);
                                            // Only show if it matches and has a positive expectedIn (meaning it's due)
                                            if (chaseMatch && chaseMatch.expectedIn) {
                                                const days = chaseMatch.expectedIn * 7;
                                                return (
                                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm border border-white">
                                                        Due in ~{chaseMatch.expectedIn} Wks
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-600 mb-2">Outcome</div>
                                        <div className="flex gap-2">
                                            {topPair.numbers.map(n => {
                                                const isHit = actualNumbers.includes(n);
                                                return (
                                                    <div key={n} className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 ${isHit ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-200 transform scale-105' : 'bg-white border-gray-200 text-gray-400'}`}>
                                                        <span className="font-bold text-lg">{n}</span>
                                                        {isHit && <Target size={16} />}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                                {topPair.numbers.some(n => actualNumbers.includes(n)) ? (
                                    <div className="mt-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg text-center font-bold text-sm">
                                        ✅ SUCCESS: At least one number hit!
                                    </div>
                                ) : (
                                    <div className="mt-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-center font-bold text-sm">
                                        ❌ MISS: No numbers hit from pair.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center text-gray-500">
                                No confident banker pairs found for this week in historical data.
                            </div>
                        )}

                        {/* 2. Top 5 Single Bankers */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-500" />
                                Top 5 Single Bankers
                            </h4>
                            <div className="grid grid-cols-5 gap-2">
                                {top5Singles.map((pred, i) => {
                                    const isHit = actualNumbers.includes(pred.number);
                                    return (
                                        <div key={pred.number} className={`relative p-3 rounded-xl border flex flex-col items-center justify-center ${isHit ? 'bg-green-500 text-white border-green-600 shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            <span className="text-xs font-semibold opacity-70 mb-1">#{i + 1}</span>
                                            <span className="text-xl font-black">{pred.number}</span>
                                            {isHit && <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">HIT</div>}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="mt-3 text-right text-xs text-gray-400">
                                Total Hits: <span className="font-bold text-gray-900">{top5Singles.filter(p => actualNumbers.includes(p.number)).length} / 5</span>
                            </div>
                        </div>

                        {/* 3. Chase Tracker (New) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Chase Pair */}
                            {bestChasePair && (
                                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 animate-in slide-in-from-bottom-6 duration-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-amber-900 flex items-center gap-2">
                                            <AlertTriangle size={20} className="text-amber-500" />
                                            Chase Pair (2-to-Play)
                                        </h4>
                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-1 rounded-full">
                                            Due in ~{Math.max(1, bestChasePair.expectedIn || 1)} Wks
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="text-center">
                                            <div className="text-xs text-amber-700/60 uppercase font-bold mb-1">Pair</div>
                                            <div className="flex gap-1 justify-center">
                                                {bestChasePair.pair.split('-').map(n => (
                                                    <div key={n} className="w-10 h-10 bg-white border-2 border-amber-200 text-amber-900 rounded-xl flex items-center justify-center font-black shadow-sm">
                                                        {n}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white/50 rounded-xl p-3 border border-amber-100">
                                            <div className="text-xs font-bold text-amber-800 mb-2">Outcome</div>
                                            {chaseOutcome && chaseOutcome.hit ? (
                                                <div className="flex items-center gap-2 text-green-700">
                                                    <div className="bg-green-100 p-1 rounded-full"><CheckCircle2 size={16} /></div>
                                                    <span className="font-bold text-xs italic">
                                                        Hit in {chaseOutcome.weeksToHit} weeks (Verified at Week {chaseOutcome.hitWeek})
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <div className="bg-gray-100 p-1 rounded-full"><X size={16} /></div>
                                                    <span className="font-medium text-xs">Did not hit in 10 wks.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Chase Single (New) */}
                            {bestChaseSingle && (
                                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100 animate-in slide-in-from-bottom-6 duration-500 delay-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-rose-900 flex items-center gap-2">
                                            <Target size={20} className="text-rose-500" />
                                            Chase Single
                                        </h4>
                                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2 py-1 rounded-full">
                                            Due in ~{Math.max(1, bestChaseSingle.expectedIn || 1)} Wks
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <div className="text-center">
                                            <div className="text-xs text-rose-700/60 uppercase font-bold mb-1">Number</div>
                                            <div className="w-12 h-12 mx-auto bg-white border-2 border-rose-200 text-rose-900 rounded-xl flex items-center justify-center font-black shadow-sm text-xl">
                                                {bestChaseSingle.number}
                                            </div>
                                        </div>

                                        <div className="bg-white/50 rounded-xl p-3 border border-rose-100">
                                            <div className="text-xs font-bold text-rose-800 mb-2">Outcome</div>
                                            {singleChaseOutcome && singleChaseOutcome.hit ? (
                                                <div className="flex items-center gap-2 text-green-700">
                                                    <div className="bg-green-100 p-1 rounded-full"><CheckCircle2 size={16} /></div>
                                                    <span className="font-bold text-xs italic">
                                                        Hit in {singleChaseOutcome.weeksToHit} weeks (Verified at Week {singleChaseOutcome.hitWeek})
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <div className="bg-gray-100 p-1 rounded-full"><X size={16} /></div>
                                                    <span className="font-medium text-xs">Did not hit in 10 wks.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Top Stats & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Advanced temporal Analysis</h1>
                    <p className="text-sm text-gray-500">Processing {data.length} data points</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={generateNewData}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                    >
                        <Upload size={18} />
                        New Data
                    </button>
                    <button
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium disabled:opacity-50"
                    >
                        <Play size={18} />
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                    </button>
                </div>
            </div>

            {/* Navigation tabs - Refined */}
            <div className="bg-white border border-gray-100 rounded-2xl p-2 mb-6 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                <div className="flex gap-1">
                    <TabButton id="overview" label="Overview" icon={BarChart3} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton id="signals" label="Signal Intelligence" icon={Radio} active={activeTab === 'signals'} onClick={() => setActiveTab('signals')} />
                    <TabButton id="markov" label="Markov Analysis" icon={TrendingUp} active={activeTab === 'markov'} onClick={() => setActiveTab('markov')} />
                    <TabButton id="gaps" label="Gap Analysis" icon={Clock} active={activeTab === 'gaps'} onClick={() => setActiveTab('gaps')} />
                    <TabButton id="patterns" label="Pattern Recognition" icon={Target} active={activeTab === 'patterns'} onClick={() => setActiveTab('patterns')} />
                    <TabButton id="predictions" label="Predictions" icon={TrendingDown} active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')} />
                    <TabButton id="chase" label="Chase Tracker" icon={Repeat} active={activeTab === 'chase'} onClick={() => setActiveTab('chase')} />
                    <TabButton id="settings" label="Settings" icon={Settings} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </div>
            </div>

            <HistoricalModal />

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'overview' && <OverviewTab analysis={analysis} data={data} onSelectDraw={handleDrawSelect} />}
                {activeTab === 'signals' && <SignalTab analysis={analysis} />}
                {activeTab === 'markov' && <MarkovTab analysis={analysis} />}
                {activeTab === 'gaps' && <GapTab analysis={analysis} />}
                {activeTab === 'patterns' && <PatternTab analysis={analysis} />}
                {activeTab === 'predictions' && <PredictionTab analysis={analysis} />}
                {activeTab === 'chase' && <ChaseTab analysis={analysis} />}

                {activeTab === 'settings' && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">Analysis Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-lg font-semibold mb-3">Number Range</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Number</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Number</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Recent Weeks Weight ({settings.recentWeeksWeight})</label>
                                        <input
                                            type="range" min="1" max="10"
                                            value={settings.recentWeeksWeight}
                                            onChange={(e) => setSettings(prev => ({ ...prev, recentWeeksWeight: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Overdue Threshold ({settings.overdueThreshold})</label>
                                        <input
                                            type="range" min="1" max="3" step="0.1"
                                            value={settings.overdueThreshold}
                                            onChange={(e) => setSettings(prev => ({ ...prev, overdueThreshold: parseFloat(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hot Threshold ({settings.hotThreshold})</label>
                                        <input
                                            type="range" min="0.1" max="0.5" step="0.05"
                                            value={settings.hotThreshold}
                                            onChange={(e) => setSettings(prev => ({ ...prev, hotThreshold: parseFloat(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cold Threshold ({settings.coldThreshold})</label>
                                        <input
                                            type="range" min="0.01" max="0.2" step="0.01"
                                            value={settings.coldThreshold}
                                            onChange={(e) => setSettings(prev => ({ ...prev, coldThreshold: parseFloat(e.target.value) }))}
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
        </div>
    );
};

export default TemporalSequenceAnalyzer;
