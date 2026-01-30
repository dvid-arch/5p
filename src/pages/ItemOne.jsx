import { useParams, useNavigate } from "react-router-dom";
import Grid from "../components/Grid"
import { useState, useMemo } from "react";
import { ArrowLeft, Copy, CheckCircle2, TrendingUp, AlertCircle, Zap, Target, Award, Activity } from "lucide-react";
import { testdata, bata, bata1, datamod, truestdata, simdata } from "../constant/data";
import { useLotteryAnalysis } from "../hooks/useLotteryAnalysis";

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 font-medium hover:bg-blue-100 transition-colors"
        >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Sequence'}
        </button>
    );
}

function ItemOne() {
    const { dataset: datasetName, index: itemIndex, id: dataString } = useParams();
    const navigate = useNavigate();
    const cols = 7;

    const data = useMemo(() => {
        return dataString?.split('-').map(n => Number(n)).filter(n => !isNaN(n)) || [];
    }, [dataString]);

    // Dataset mapping matching LandingPage
    const historicalData = useMemo(() => {
        let raw = [];
        switch (datasetName) {
            case 'testdata': raw = testdata; break;
            case 'bestdata': raw = truestdata ? [...truestdata].reverse() : []; break;
            case 'bata': raw = bata; break;
            case 'bata1': raw = bata1; break;
            case 'datamod': raw = datamod; break;
            case 'simdata': raw = simdata; break;
            default: raw = datamod;
        }

        // Since Week 1 is the latest, past data is everything AFTER the current index
        const idx = parseInt(itemIndex);
        const pastData = Array.isArray(raw) ? raw.slice(idx + 1) : [];

        // Reverse it to be Oldest -> Newest for the chronological analysis engine
        return [...pastData].reverse();
    }, [datasetName, itemIndex]);

    const rows = useMemo(() => {
        return Array.from({ length: 7 }, (_, n) =>
            Array.from({ length: cols }, (_, i) => (n * 7) + i + 1)
        );
    }, []);

    const analysis = useLotteryAnalysis(historicalData);

    const predictionScores = useMemo(() => {
        if (!analysis || !analysis.predictions) return {};
        const scores = {};
        analysis.predictions.ensemble.forEach(p => {
            scores[p.number] = {
                score: p.score,
                confidence: p.confidence,
                metrics: p.metrics // Binary, Bayesian, Root, Pattern, Urgency
            };
        });
        return scores;
    }, [analysis]);

    const historicalAccuracy = useMemo(() => {
        if (!analysis || !analysis.predictions) return null;
        const ensemble = analysis.predictions.ensemble;
        const top10 = ensemble.slice(0, 10).map(p => p.number);
        const top20 = ensemble.slice(0, 20).map(p => p.number);

        const hits10 = data.filter(n => top10.includes(n)).length;
        const hits20 = data.filter(n => top20.includes(n)).length;

        return { hits10, hits20, total: data.length, top10, top20 };
    }, [analysis, data]);

    const stats = useMemo(() => {
        const sum = data.reduce((a, b) => a + b, 0);
        const range = data.length > 0 ? Math.max(...data) - Math.min(...data) : 0;

        // Calculate average prediction score for this sequence
        const relevantScores = data.map(n => predictionScores[n]?.score || 0);
        const avgPredictionScore = relevantScores.length > 0
            ? (relevantScores.reduce((a, b) => a + b, 0) / relevantScores.length * 100).toFixed(1)
            : 0;

        return { sum, range, length: data.length, avgPredictionScore, historySize: historicalData.length };
    }, [data, predictionScores, historicalData]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header / Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-gray-600 shadow-sm hover:shadow-md"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Week #{parseInt(itemIndex) + 1} Detail</h1>
                        <p className="text-sm text-gray-500">Historical analysis using {stats.historySize} past weeks</p>
                    </div>
                </div>
                <CopyButton text={JSON.stringify(data)} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Primary Visualization */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 relative">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            7x7 Grid Representation
                        </h3>
                        <div className="relative">
                            <Grid
                                col={7}
                                data={data}
                                numbToColor={historicalAccuracy?.top20 || []}
                                length={49}
                            />

                            {/* Grid Legend */}
                            {historicalAccuracy && (
                                <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 bg-yellow-600 rounded-sm border border-yellow-500"></div>
                                        <span>AI Hit (Correct)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
                                        <span>Actual Draw</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 bg-purple-300 rounded-sm"></div>
                                        <span>AI Prediction</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Sum', value: stats.sum, color: 'text-indigo-600', icon: Zap },
                            { label: 'Range', value: stats.range, color: 'text-blue-600', icon: ArrowLeft },
                            { label: 'Hits (T20)', value: historicalAccuracy?.hits20 || 0, color: 'text-green-600', icon: Target },
                            { label: 'AI Match', value: `${stats.avgPredictionScore}%`, color: 'text-purple-600', icon: Award }
                        ].map((s, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
                                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* AI Insights Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-yellow-300 fill-yellow-300" />
                            AI Prediction Insights
                        </h3>
                        <div className="space-y-4 relative">
                            <p className="text-indigo-100 text-sm leading-relaxed">
                                Based on the {stats.historySize} weeks prior, the AI gave this result an overall match score of <span className="text-white font-bold">{stats.avgPredictionScore}%</span>.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {data.map(n => {
                                    const p = predictionScores[n];
                                    const isHit = historicalAccuracy?.top20?.includes(n);
                                    if (!p || p.confidence === 'low') return null;

                                    const m = p.metrics || {};
                                    return (
                                        <div key={n} className={`group relative px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border transition-all hover:pr-4 ${isHit
                                            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50 ring-1 ring-yellow-400/20'
                                            : p.confidence === 'high' ? 'bg-green-400/20 text-green-300 border-green-400/30' : 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
                                            }`}>
                                            {isHit ? <Target size={12} /> : <Activity size={12} />}
                                            #{n} {isHit ? 'HIT' : p.confidence}

                                            {/* Tooltip-like popup on hover */}
                                            <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-48 bg-gray-900 text-white p-3 rounded-xl text-[10px] z-50 shadow-2xl border border-gray-700 pointer-events-none">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>Binary: <span className="text-blue-400">{(m.binary * 100).toFixed(0)}%</span></div>
                                                    <div>Bayesian: <span className="text-indigo-400">{(m.bayesian * 100).toFixed(0)}%</span></div>
                                                    <div>Root: <span className="text-purple-400">{(m.root * 100).toFixed(0)}%</span></div>
                                                    <div>Pattern: <span className="text-green-400">{(m.pattern * 100).toFixed(0)}%</span></div>
                                                </div>
                                                <div className="mt-2 text-gray-400 italic">Urgency: {m.urgency?.toFixed(2)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Historical Performance Card */}
                    {historicalAccuracy && (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-3 transition-transform group-hover:scale-110">
                                <Award className="text-yellow-500 opacity-20" size={64} />
                            </div>
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Target size={20} className="text-red-500" />
                                Backtest Performance
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors hover:bg-gray-100">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hits in Top 10</div>
                                        <div className="text-2xl font-bold text-gray-800">{historicalAccuracy.hits10} / {historicalAccuracy.total}</div>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                                            <div
                                                className="bg-red-500 h-full rounded-full"
                                                style={{ width: `${(historicalAccuracy.hits10 / historicalAccuracy.total) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors hover:bg-gray-100">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hits in Top 20</div>
                                        <div className="text-2xl font-bold text-gray-800">{historicalAccuracy.hits20} / {historicalAccuracy.total}</div>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                                            <div
                                                className="bg-green-500 h-full rounded-full"
                                                style={{ width: `${(historicalAccuracy.hits20 / historicalAccuracy.total) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                                    <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-blue-700 leading-relaxed italic">
                                        This backtest simulates the AI engine state using only the data available up to Week #{parseInt(itemIndex)}.
                                        {historicalAccuracy.hits20 > 0 ? ` It successfully captured ${historicalAccuracy.hits20} numbers in its top 20 candidate list for this specific draw.` : ' No numbers from the actual draw were in the AI top 20 list for this week.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Structural Breakdown */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Columns Breakdown */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                Column Distribution
                            </div>
                            <span className="text-xs font-normal text-gray-400">Numbers grouped by vertical alignment</span>
                        </h3>
                        <div className="space-y-3">
                            {Array.from({ length: cols }, (_, i) => i).slice(1).concat([0]).map((colIdx, i) => {
                                const matchingNums = data.filter(m => m % 7 === colIdx || (colIdx === 0 && m % 7 === 0));
                                // Handle column 0 which is actual column 7
                                const actualCol = colIdx === 0 ? 7 : colIdx;
                                const isEmpty = matchingNums.length === 0;

                                return (
                                    <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${isEmpty ? 'bg-red-50/30 border-red-100 opacity-60' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-center font-bold text-gray-400 shrink-0">
                                            C{actualCol}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {matchingNums.length > 0 ? (
                                                matchingNums.map((k, j) => {
                                                    const p = predictionScores[k];
                                                    const isHigh = p?.confidence === 'high';
                                                    const isMed = p?.confidence === 'medium';
                                                    return (
                                                        <div
                                                            className={`bg-white shadow-sm border rounded-lg w-9 h-9 flex justify-center items-center font-bold relative group ${isHigh ? 'border-green-400 text-green-600 shadow-green-100' :
                                                                isMed ? 'border-yellow-400 text-yellow-600' : 'border-gray-200 text-blue-600'
                                                                }`}
                                                            key={j}
                                                        >
                                                            {k}
                                                            {(isHigh || isMed) && (
                                                                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isHigh ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                                                            )}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                                                                AI: {(p?.score * 100 || 0).toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-xs text-red-300 font-medium italic">No matches in this column</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rows Breakdown */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                                Row Distribution
                            </div>
                            <span className="text-xs font-normal text-gray-400">Numbers grouped by horizontal range</span>
                        </h3>
                        <div className="space-y-3">
                            {rows.map((row, i) => {
                                const matchingNums = row.filter(n => data.includes(n));
                                const isEmpty = matchingNums.length === 0;

                                return (
                                    <div key={i} className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${isEmpty ? 'bg-red-50/30 border-red-100 opacity-60' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-center font-bold text-gray-400 shrink-0 text-xs">
                                            {row[0]}-{row[6]}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {matchingNums.length > 0 ? (
                                                matchingNums.map((k, j) => {
                                                    const p = predictionScores[k];
                                                    const isHigh = p?.confidence === 'high';
                                                    const isMed = p?.confidence === 'medium';
                                                    return (
                                                        <div
                                                            className={`bg-white shadow-sm border rounded-lg w-9 h-9 flex justify-center items-center font-bold relative group ${isHigh ? 'border-green-400 text-green-600 shadow-green-100' :
                                                                isMed ? 'border-yellow-400 text-yellow-600' : 'border-gray-200 text-indigo-600'
                                                                }`}
                                                            key={j}
                                                        >
                                                            {k}
                                                            {(isHigh || isMed) && (
                                                                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isHigh ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                                            )}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                                                                AI: {(p?.score * 100 || 0).toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-xs text-red-300 font-medium italic">No matches in this row</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ItemOne;
