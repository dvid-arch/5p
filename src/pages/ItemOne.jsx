import { useParams, useNavigate } from "react-router-dom";
import Grid from "../components/Grid"
import { useState, useMemo } from "react";
import { ArrowLeft, Copy, CheckCircle2, TrendingUp, AlertCircle, Zap, Target, Award, Activity, ChevronLeft, ChevronRight, Calculator, History, RotateCw, AlertTriangle } from "lucide-react";
import { truestdata } from "../constant/data";
import { getHubStats } from "../constant/HubRegistry";
import { useLotteryAnalysis } from "../hooks/useLotteryAnalysis";
import { detectAlgebraicBonds, detectIsolatedClusters, detectInverseClusters } from "./PatternUtils";
import { findOptimalGridPortfolio, getSmart20Numbers, getBaselineTop20 } from "../utils/gridPredictor";
import tripleSetAudit from "../constant/triple_set_historical_audit.json";

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
            case 'truestdata':
            case 'bestdata':
            case 'datamod':
            default: raw = truestdata || [];
        }

        // Since Week 1 is the latest, past data is everything AFTER the current index
        const idx = parseInt(itemIndex);
        const pastData = Array.isArray(raw) ? raw.slice(idx + 1) : [];

        // Keep as Newest-First to allow hook to flip it once correctly
        return [...pastData];
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

    const algebraicBonds = useMemo(() => {
        return detectAlgebraicBonds(data);
    }, [data]);

    const isolatedClusters = useMemo(() => {
        const clusters = detectIsolatedClusters(data);
        const idx = parseInt(itemIndex);

        return clusters.map(cluster => {
            const hits = [];
            // For each prediction, find when it first hit (starting from current draw)
            cluster.predictions.forEach(p => {
                let hitWeek = -1;
                // Search from idx (current) down to 0 (newest)
                for (let fIdx = idx; fIdx >= 0; fIdx--) {
                    if (truestdata[fIdx].includes(p)) {
                        hitWeek = idx - fIdx;
                        break;
                    }
                }
                if (hitWeek !== -1) hits.push({ num: p, weeks: hitWeek });
            });

            // Calculate Completion Week: the max of the individual first hits
            const isCompleted = hits.length === cluster.predictions.length;
            const completionWeek = isCompleted ? Math.max(...hits.map(h => h.weeks)) : null;

            return { ...cluster, futureHits: hits, isCompleted, completionWeek };
        });
    }, [data, itemIndex]);


    const seedOrigins = useMemo(() => {
        const origins = detectInverseClusters(data);
        const idx = parseInt(itemIndex);

        const processed = origins.map(s => {
            const stats = getHubStats(s.type, s.middle);

            const jointHits = [];
            let foundDouble = false;
            let foundTriple = false;

            for (let fIdx = idx - 1; fIdx >= 0; fIdx--) {
                const draw = truestdata[fIdx];
                if (!draw) continue;

                const matches = s.seed.filter(n => draw.includes(n));
                const count = matches.length;
                const weeks = idx - fIdx;

                if (count === 3 && !foundTriple) {
                    jointHits.push({
                        nums: matches.sort((a, b) => a - b),
                        weeks,
                        targetWeek: fIdx,
                        count: 3
                    });
                    foundTriple = true;
                    foundDouble = true;
                } else if (count === 2 && !foundDouble) {
                    jointHits.push({
                        nums: matches.sort((a, b) => a - b),
                        weeks,
                        targetWeek: fIdx,
                        count: 2
                    });
                    foundDouble = true;
                }

                if (foundDouble && foundTriple) break;
            }
            return { ...s, jointHits, stats };
        });

        // Sort by Grade Score and Win Rate
        processed.sort((a, b) => {
            const gradePriority = { "Elite Alpha": 4, "Premium Beta": 3, "Standard Gamma": 2, "Standard": 1 };
            const gradeB = gradePriority[b.stats.grade] || 0;
            const gradeA = gradePriority[a.stats.grade] || 0;
            if (gradeB !== gradeA) return gradeB - gradeA;

            const wrB = parseFloat(b.stats.winRate) || 0;
            const wrA = parseFloat(a.stats.winRate) || 0;
            return wrB - wrA;
        });

        const unique = [];
        const seenSeeds = new Set();
        processed.forEach(s => {
            const seedKey = [...s.seed].sort((a, b) => a - b).join('-');
            if (!seenSeeds.has(seedKey)) {
                unique.push(s);
                seenSeeds.add(seedKey);
            }
        });

        return unique;
    }, [data, itemIndex]);

    const ringedNums = useMemo(() => {
        const ringMap = new Map();

        // General Algebraic Bonds (Cyan)
        algebraicBonds.forEach(b => {
            ringMap.set(b.a, 'cyan-400');
            if (b.b) ringMap.set(b.b, 'cyan-400');
            ringMap.set(b.result, 'cyan-400');
        });

        // Isolated Spatial Clusters (Amber) - OVERWRITE if conflict
        isolatedClusters.forEach(c => {
            c.numbers.forEach(n => ringMap.set(n, 'amber-500'));
        });

        // Seed Origins (Indigo) - Indicate the decomposition sources
        seedOrigins.forEach(s => {
            s.pair.forEach(n => ringMap.set(n, 'indigo-400'));
        });

        return Array.from(ringMap.entries()).map(([n, color]) => ({ n, color }));
    }, [algebraicBonds, isolatedClusters]);

    // --- GRID STRATEGY AUDIT (NEW) ---
    const gridAudit = useMemo(() => {
        if (!historicalData || historicalData.length < 13) return null;

        // 1. Get Institutional Signals (Fast Hybrid for backtest speed)
        // We use the same simplified 'Fast Hybrid' as the main backtester to be consistent
        const baselineResult = getBaselineTop20(historicalData, 13);
        const scoreMap = baselineResult.scoreMap;

        // 2. Predict Grids using History
        const portfolioPool = findOptimalGridPortfolio(historicalData, 5, 13, scoreMap);

        // 3. Get Top 20 Candidates
        const predicted20 = getSmart20Numbers(portfolioPool, scoreMap);

        // 4. Calculate Hits against ACTUAL current data
        const currentDrawSet = new Set(data);
        const hits = predicted20.filter(n => currentDrawSet.has(n));

        return {
            predicted20,
            hits,
            gridCenters: portfolioPool.slice(0, 3).map(p => p.center),
            score: hits.length,
            success: hits.length >= 3
        };
    }, [historicalData, data]);

    const tripleAudit = useMemo(() => {
        return tripleSetAudit[itemIndex] || null;
    }, [itemIndex]);

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
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-800">Week #{parseInt(itemIndex) + 1} Detail</h1>
                            <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm ml-2">
                                <button
                                    onClick={() => {
                                        const prevIdx = parseInt(itemIndex) + 1;
                                        if (prevIdx < truestdata.length) {
                                            const prevNums = truestdata[prevIdx].join('-');
                                            navigate(`/one/${datasetName}/${prevIdx}/${prevNums}`);
                                        }
                                    }}
                                    disabled={parseInt(itemIndex) >= truestdata.length - 1}
                                    className="p-1 px-2 hover:bg-gray-50 border-r border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
                                    title="Go to Older Week"
                                >
                                    <ChevronLeft size={20} className="text-gray-400 group-hover:text-blue-600" />
                                </button>
                                <button
                                    onClick={() => {
                                        const nextIdx = parseInt(itemIndex) - 1;
                                        if (nextIdx >= 0) {
                                            const nextNums = truestdata[nextIdx].join('-');
                                            navigate(`/one/${datasetName}/${nextIdx}/${nextNums}`);
                                        }
                                    }}
                                    disabled={parseInt(itemIndex) <= 0}
                                    className="p-1 px-2 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed group transition-colors"
                                    title="Go to Newer Week"
                                >
                                    <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600" />
                                </button>
                            </div>
                        </div>
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
                                ringedNums={ringedNums}
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
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-sm border-2 border-cyan-400"></div>
                                        <span>Algebraic Bond</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-sm border-2 border-amber-500"></div>
                                        <span>Isolated Cluster</span>
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
                        {/* ... existing AI content ... */}
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
                                                    <div>Binary: <span className="text-blue-400">{((m.binary || 0) * 100).toFixed(0)}%</span></div>
                                                    <div>Bayesian: <span className="text-indigo-400">{((m.bayesian || 0) * 100).toFixed(0)}%</span></div>
                                                    <div>Root: <span className="text-purple-400">{((m.root || 0) * 100).toFixed(0)}%</span></div>
                                                    <div>Pattern: <span className="text-green-400">{((m.pattern || 0) * 100).toFixed(0)}%</span></div>
                                                </div>
                                                <div className="mt-2 text-gray-400 italic">Urgency: {(m.urgency || 0).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* GRID STRATEGY AUDIT CARD (NEW) */}
                    {gridAudit && (
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                <TrendingUp size={64} className="text-blue-400" />
                            </div>
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Target size={20} className="text-blue-400" />
                                Grid Strategy Check
                            </h3>

                            <div className="flex items-center gap-6 mb-4">
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hits Caught</div>
                                    <div className="text-3xl font-black text-white">{gridAudit.score} <span className="text-base font-medium text-slate-500">/ 20</span></div>
                                </div>
                                <div className="h-8 w-px bg-slate-700"></div>
                                <div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Result</div>
                                    <div className={`text-lg font-bold ${gridAudit.success ? 'text-green-400' : 'text-red-400'}`}>
                                        {gridAudit.success ? 'Success' : 'Miss'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span>Top Grids Used:</span>
                                    {gridAudit.gridCenters.map(c => (
                                        <span key={c} className="bg-slate-700 text-white px-2 py-0.5 rounded border border-slate-600 font-bold">#{c}</span>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {gridAudit.predicted20.map(n => {
                                        const isHit = data.includes(n);
                                        return (
                                            <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isHit
                                                ? 'bg-green-500 text-white border-green-400 shadow-lg shadow-green-900/50'
                                                : 'bg-slate-700 text-slate-400 border-slate-600'
                                                }`}>
                                                {n}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TRIPLE SET AUDIT CARD (NEW) */}
                    {tripleAudit && (() => {
                        const maxProx = tripleAudit.primary.maxGapProximity;
                        const isExhausted = maxProx >= 100;
                        const isCritical = maxProx >= 90;

                        return (
                            <div className={`p-6 rounded-3xl text-white shadow-xl relative overflow-hidden group transition-all duration-500 ${isExhausted
                                ? 'bg-gradient-to-br from-red-600 via-orange-600 to-amber-700 shadow-red-500/50 border-2 border-white/30 animate-pulse-subtle'
                                : isCritical
                                    ? 'bg-gradient-to-br from-orange-600 to-amber-700 shadow-orange-500/30 border border-white/20'
                                    : 'bg-gradient-to-br from-amber-600 to-orange-700 shadow-orange-100'
                                }`}>
                                {/* Exhaustion Badge */}
                                {(isExhausted || isCritical) && (
                                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1 z-10 ${isExhausted ? 'bg-white text-red-600 shadow-lg' : 'bg-amber-200 text-amber-900'
                                        }`}>
                                        <AlertTriangle size={12} />
                                        {isExhausted ? 'Exhaustion Limit Hit' : 'Critical Exhaustion'}
                                    </div>
                                )}

                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                    <History size={64} className="text-white" />
                                </div>
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <Target size={20} className={isExhausted ? 'text-white' : 'text-amber-200'} />
                                    Institutional Triple Portfolio
                                </h3>

                                <div className="flex items-center gap-6 mb-6">
                                    <div>
                                        <div className="text-xs text-amber-200 font-bold uppercase tracking-wider opacity-80">Backtest Result (15w)</div>
                                        <div className={`text-2xl font-black ${tripleAudit.audit.outcome === 'Hit' ? 'text-green-300' :
                                            tripleAudit.audit.outcome === 'Pending' ? 'text-blue-200' :
                                                isExhausted ? 'text-white underline decoration-wavy' : 'text-orange-200'
                                            }`}>
                                            {tripleAudit.audit.outcome === 'Hit' ? `HIT (Week +${tripleAudit.audit.weeksToHit})` : tripleAudit.audit.outcome}
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-white/20"></div>
                                    <div>
                                        <div className="text-xs text-amber-200 font-bold uppercase tracking-wider opacity-80">Consensus Score</div>
                                        <div className={`text-2xl font-black ${isExhausted ? 'text-white' : 'text-white'}`}>{tripleAudit.primary.consensusScore}</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {tripleAudit.top4.slice(0, 3).map((candidate, cIdx) => {
                                        const cMaxProx = candidate.maxGapProximity;
                                        const cIsExhausted = cMaxProx >= 100;
                                        const isPrimary = cIdx === 0;

                                        return (
                                            <div key={cIdx} className={`p-4 rounded-2xl border transition-all ${isPrimary ? 'bg-white/10 border-white/20' : 'bg-black/10 border-white/5 opacity-70 hover:opacity-100'
                                                }`}>
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="text-[10px] font-black text-amber-200 uppercase tracking-widest opacity-80">
                                                        {isPrimary ? 'Primary Candidate' : `Portfolio Hedge #${cIdx + 1}`}
                                                    </div>
                                                    <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                                                        Score: {candidate.consensusScore}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 mb-3">
                                                    {candidate.triples.map((triple, tIdx) => {
                                                        const isFutureHit = tripleAudit.audit.outcome === 'Hit' &&
                                                            tripleAudit.audit.weeksToHit <= 15 &&
                                                            triple.every(num => truestdata[parseInt(itemIndex) - tripleAudit.audit.weeksToHit]?.includes(num));

                                                        return (
                                                            <div key={tIdx} className="flex gap-1.5 p-2 bg-black/20 rounded-xl border border-white/5">
                                                                {triple.map(n => (
                                                                    <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-sm ${isFutureHit ? 'bg-green-500 text-white border border-green-400 animate-pulse' : 'bg-white/10 text-white/80 border border-white/5'
                                                                        }`}>
                                                                        {n}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 px-1">
                                                    <div className="text-center border-r border-white/10">
                                                        <div className="text-[8px] font-bold text-amber-200/60 uppercase">Mode Overdue</div>
                                                        <div className="text-xs font-black">{candidate.overdueFactor}x</div>
                                                    </div>
                                                    <div className="text-center border-r border-white/10">
                                                        <div className="text-[8px] font-bold text-amber-200/60 uppercase">Mode Gap</div>
                                                        <div className="text-xs font-black">{candidate.modeGap}w</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-[8px] font-bold text-amber-200/60 uppercase">Max Prox</div>
                                                        <div className={`text-xs font-black ${cIsExhausted ? 'text-white animate-pulse' : ''}`}>{cMaxProx}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

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

                    {/* Isolated Spatial Clusters */}
                    {isolatedClusters.length > 0 && (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group border-t-4 border-t-amber-500">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                <Activity size={64} className="text-amber-600" />
                            </div>
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Activity size={20} className="text-amber-500" />
                                Isolated Spatial Clusters
                            </h3>
                            <div className="space-y-4">
                                <p className="text-xs text-gray-500">
                                    Found <span className="text-amber-600 font-bold">{isolatedClusters.length} clean clusters</span> that produce exactly two external results.
                                </p>
                                <div className="grid grid-cols-1 gap-4">
                                    {isolatedClusters.map((cluster, i) => (
                                        <div key={i} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex gap-2">
                                                    {cluster.numbers.map(n => (
                                                        <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm bg-white border ${n === cluster.middle ? 'border-amber-500 text-amber-700 ring-1 ring-amber-200' : 'border-gray-200 text-gray-600'}`}>
                                                            {n}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Mid: #{cluster.middle}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Results:</span>
                                                    <div className="flex gap-1.5">
                                                        {cluster.predictions.map(p => (
                                                            <div key={p} className={`px-2.5 py-1 rounded-lg text-xs font-black border ${data.includes(p) ? 'bg-green-500 text-white border-green-600' : 'bg-white text-amber-700 border-amber-200'}`}>
                                                                #{p}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-white rounded-lg border border-amber-100">
                                                    <span className="text-[10px] font-black text-amber-600">{cluster.type === 'multiplication' ? '×' : '+'}</span>
                                                </div>
                                            </div>

                                            {/* Future Outcome Status */}
                                            <div className="mt-4 pt-4 border-t border-amber-100/50">
                                                {cluster.isCompleted ? (
                                                    <div className="bg-green-50 rounded-2xl p-4 border border-green-100 shadow-sm flex items-center justify-between group/hit">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-200">
                                                                <CheckCircle2 size={24} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none mb-1">Double Hit Confirmed</div>
                                                                <div className="text-sm font-bold text-green-800">Resolved in {cluster.completionWeek} Weeks</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex -space-x-2">
                                                            {cluster.predictions.map(p => (
                                                                <div key={p} className="w-8 h-8 rounded-full bg-white border-2 border-green-500 flex items-center justify-center text-[10px] font-black text-green-700 shadow-sm">
                                                                    {p}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : cluster.futureHits.length > 0 ? (
                                                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                                                <TrendingUp size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Double Hit Pending</div>
                                                                <div className="text-sm font-bold text-blue-800">1 of 2 Numbers Captured</div>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 bg-white rounded-lg border border-blue-200 text-[10px] font-bold text-blue-600 uppercase">
                                                            Partial Hit
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between opacity-60">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-400">
                                                                <Activity size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">No Future Action</div>
                                                                <div className="text-sm font-medium text-gray-500 italic">No hits recorded to date</div>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-[10px] font-bold text-gray-400 uppercase">
                                                            Pending
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inverse Cluster Seed Origins */}
                    {seedOrigins && seedOrigins.length > 0 && (
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group border-t-4 border-t-indigo-500">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform text-indigo-600">
                                <RotateCw size={64} />
                            </div>
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <History size={20} className="text-indigo-500" />
                                Cluster Seed Origins
                            </h3>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Pairs in the current draw that decompose back into a valid 3-number
                                <span className="font-bold text-indigo-600"> Seed Cluster</span> geometry.
                            </p>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {seedOrigins.map((s, idx) => (
                                    <div key={idx} className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-1.5">
                                                    {s.pair.map(num => (
                                                        <div key={num} className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black border-2 border-white shadow-sm">
                                                            #{num}
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">From Pair</span>
                                            </div>
                                            <div className="px-1.5 py-0.5 bg-white rounded-lg border border-indigo-200 text-[9px] font-black text-indigo-600 whitespace-nowrap">
                                                {s.type === 'multiplication' ? '× PATH' : '+ PATH'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 p-3 bg-white rounded-xl border border-indigo-50 shadow-sm relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Seed Cluster Origin</div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-tighter bg-indigo-600 text-indigo-50 border-indigo-700`}>
                                                            {s.stats.grade}: {s.stats.winRate}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-1.5">
                                                        {s.seed.map(n => (
                                                            <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${n === s.middle ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                                                {n}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-black text-gray-400 block leading-none">HUB</span>
                                                        <span className="text-sm font-black text-indigo-600">#{s.middle}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {s.isOrtho && (
                                            <div className="flex items-center gap-1.5 text-indigo-500 mb-1">
                                                <Zap size={10} strokeWidth={3} />
                                                <span className="text-[9px] font-black uppercase tracking-tighter">Gold Standard Geometry (Ortho Hub)</span>
                                            </div>
                                        )}

                                        {/* Joint Manifestations Section */}
                                        <div className="mt-2 pt-3 border-t border-indigo-100/30 flex flex-col gap-2">
                                            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Joint Manifestations (Future)</div>
                                            {s.jointHits && s.jointHits.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {s.jointHits.map((h, hIdx) => (
                                                        <div key={hIdx} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border shadow-sm ${h.count === 3 ? 'bg-amber-50 border-amber-200' : 'bg-white border-indigo-100'}`}>
                                                            <div className="flex -space-x-1.5">
                                                                {h.nums.map(n => (
                                                                    <div key={n} className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-black border border-white shadow-xs ${h.count === 3 ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                                                                        {n}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex flex-col leading-none">
                                                                <span className={`text-[8px] font-black uppercase tracking-tighter ${h.count === 3 ? 'text-amber-600' : 'text-indigo-400'}`}>
                                                                    {h.count === 3 ? 'Triple Hit' : 'Double Hit Early Capture'}
                                                                </span>
                                                                <span className={`text-[10px] font-black ${h.count === 3 ? 'text-amber-700' : 'text-indigo-600'}`}>
                                                                    {h.weeks} Weeks Later (Week #{h.targetWeek})
                                                                </span>
                                                            </div>
                                                            {h.count === 3 && (
                                                                <div className="ml-1 text-amber-500">
                                                                    <Award size={12} strokeWidth={3} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-bold text-indigo-300 italic tracking-tighter opacity-60">
                                                    * No joint manifestations discovered in historical window.
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Algebraic Resonance Card */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group border-t-4 border-t-cyan-500">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                            <Calculator size={64} className="text-cyan-600" />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Zap size={20} className="text-cyan-500" />
                            Algebraic Resonance
                        </h3>
                        {algebraicBonds.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-500">
                                    Found <span className="text-cyan-600 font-bold">{algebraicBonds.length} mathematical bonds</span> within this sequence.
                                </p>
                                <div className="grid grid-cols-1 gap-2">
                                    {algebraicBonds.map((bond, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 capitalize">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-white rounded-lg shadow-xs text-cyan-600">
                                                    {bond.type === 'multiplication' ? <Zap size={14} /> : bond.type === 'addition' ? <Activity size={14} /> : <Target size={14} />}
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">
                                                    {bond.type === 'square'
                                                        ? <><span className="text-cyan-600">{bond.a}</span>² = <span className="text-cyan-600">{bond.result}</span></>
                                                        : <><span className="text-cyan-600">{bond.a}</span> {bond.type === 'multiplication' ? '×' : '+'} <span className="text-cyan-600">{bond.b}</span> = <span className="text-cyan-600">{bond.result}</span></>
                                                    }
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-cyan-500 uppercase">{bond.type}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <Calculator className="mx-auto text-gray-300 mb-2" size={32} />
                                <p className="text-xs text-gray-400 italic">No algebraic bonds detected in this draw.</p>
                            </div>
                        )}
                    </div>
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
        </div >
    );
}

export default ItemOne;
