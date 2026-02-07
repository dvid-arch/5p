import { truestdata } from "../constant/data";
import { getHubStats } from "../constant/HubRegistry";
import trioData from "../../advanced_combination_analysis.json";

/**
 * Cluster Seed Origins JSON Exporter
 * Add this component to your app temporarily to generate the statistics JSON
 */

const GRID_SIZE = 7;

const detectInverseClusters = (draw) => {
    const results = [];
    const n = draw.length;

    const areAdj = (n1, n2) => {
        const r1 = Math.floor((n1 - 1) / GRID_SIZE);
        const c1 = (n1 - 1) % GRID_SIZE;
        const r2 = Math.floor((n2 - 1) / GRID_SIZE);
        const c2 = (n2 - 1) % GRID_SIZE;
        return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2);
    };

    const areOrtho = (n1, n2) => {
        const r1 = Math.floor((n1 - 1) / GRID_SIZE);
        const c1 = (n1 - 1) % GRID_SIZE;
        const r2 = Math.floor((n2 - 1) / GRID_SIZE);
        const c2 = (n2 - 1) % GRID_SIZE;
        return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
    };

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const A = draw[i];
            const B = draw[j];

            for (let M = 1; M <= 49; M++) {
                const configs = [
                    { type: 'addition', s1: A - M, s2: B - M },
                    { type: 'multiplication', s1: A % M === 0 ? A / M : -1, s2: B % M === 0 ? B / M : -1 }
                ];

                configs.forEach(cfg => {
                    const { s1, s2, type } = cfg;
                    if (s1 >= 1 && s1 <= 49 && s2 >= 1 && s2 <= 49 && s1 !== s2 && s1 !== M && s2 !== M) {
                        if (areAdj(M, s1) && areAdj(M, s2)) {
                            results.push({
                                pair: [A, B].sort((a, b) => a - b),
                                seed: [M, s1, s2].sort((a, b) => a - b),
                                middle: M,
                                type,
                                isOrtho: areOrtho(M, s1) && areOrtho(M, s2)
                            });
                        }
                    }
                });
            }
        }
    }

    const unique = [];
    results.forEach(res => {
        const key = `${res.pair.join(',')}-${res.seed.join(',')}`;
        if (!unique.some(u => `${u.pair.join(',')}-${u.seed.join(',')}` === key)) {
            unique.push(res);
        }
    });

    return unique;
};

function ClusterSeedOriginsExporter() {
    const generateJSON = () => {
        console.log('Starting analysis...');

        // Build trio score map
        const trioScoreMap = new Map();
        if (trioData && trioData.topCombinations) {
            trioData.topCombinations.forEach(t => {
                const key = [...t.combination].sort((a, b) => a - b).join('-');
                trioScoreMap.set(key, parseFloat(t.compositeScore));
            });
        }

        const allDrawsData = [];

        // Process each draw
        truestdata.forEach((draw, idx) => {
            const weekNumber = idx + 1;
            const origins = detectInverseClusters(draw);

            if (origins.length === 0) return;

            const processed = origins.map(s => {
                const stats = getHubStats(s.type, s.middle);
                const seedKey = [...s.seed].sort((a, b) => a - b).join('-');
                const analysisScore = trioScoreMap.get(seedKey) || 0;

                let gradeScore = 1;
                if (stats.grade === "Elite Alpha") gradeScore = 4;
                else if (stats.grade === "Premium Beta") gradeScore = 3;
                else if (stats.grade === "Standard Gamma") gradeScore = 2;

                const jointHits = [];
                let foundDouble = false;
                let foundTriple = false;

                for (let fIdx = idx - 1; fIdx >= 0; fIdx--) {
                    const futureDraw = truestdata[fIdx];
                    if (!futureDraw) continue;

                    const matches = s.seed.filter(n => futureDraw.includes(n));
                    const count = matches.length;
                    const weeks = idx - fIdx;

                    if (count === 3 && !foundTriple) {
                        jointHits.push({
                            nums: matches.sort((a, b) => a - b),
                            weeks,
                            targetWeek: fIdx + 1,
                            count: 3,
                            type: 'triple'
                        });
                        foundTriple = true;
                        foundDouble = true;
                    } else if (count === 2 && !foundDouble) {
                        jointHits.push({
                            nums: matches.sort((a, b) => a - b),
                            weeks,
                            targetWeek: fIdx + 1,
                            count: 2,
                            type: 'double'
                        });
                        foundDouble = true;
                    }

                    if (foundDouble && foundTriple) break;
                }

                return {
                    pair: s.pair,
                    seed: s.seed,
                    middle: s.middle,
                    type: s.type,
                    isOrtho: s.isOrtho,
                    analysisScore,
                    gradeScore,
                    hubStats: {
                        grade: stats.grade,
                        winRate: stats.winRate,
                        roi: stats.roi,
                        label: stats.label
                    },
                    jointManifestations: jointHits
                };
            });

            processed.sort((a, b) => {
                if (b.analysisScore !== a.analysisScore) return b.analysisScore - a.analysisScore;
                if (b.gradeScore !== a.gradeScore) return b.gradeScore - a.gradeScore;
                const wrB = parseFloat(b.hubStats.winRate) || 0;
                const wrA = parseFloat(a.hubStats.winRate) || 0;
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

            allDrawsData.push({
                weekNumber,
                drawIndex: idx,
                draw,
                seedOriginsCount: unique.length,
                seedOrigins: unique
            });
        });

        // Calculate statistics
        const stats = {
            totalDrawsAnalyzed: truestdata.length,
            drawsWithSeedOrigins: allDrawsData.length,
            totalSeedOriginsFound: allDrawsData.reduce((sum, d) => sum + d.seedOriginsCount, 0),
            typeDistribution: { addition: 0, multiplication: 0 },
            geometryDistribution: { orthogonal: 0, diagonal: 0 },
            gradeDistribution: { 'Elite Alpha': 0, 'Premium Beta': 0, 'Standard Gamma': 0, 'Standard': 0 },
            manifestationStats: {
                totalWithManifestations: 0,
                totalDoubleHits: 0,
                totalTripleHits: 0,
                avgWeeksToDouble: 0,
                avgWeeksToTriple: 0
            }
        };

        let doubleWeeksSum = 0;
        let tripleWeeksSum = 0;

        allDrawsData.forEach(drawData => {
            drawData.seedOrigins.forEach(origin => {
                stats.typeDistribution[origin.type]++;
                if (origin.isOrtho) stats.geometryDistribution.orthogonal++;
                else stats.geometryDistribution.diagonal++;
                stats.gradeDistribution[origin.hubStats.grade]++;

                if (origin.jointManifestations.length > 0) {
                    stats.manifestationStats.totalWithManifestations++;
                    origin.jointManifestations.forEach(hit => {
                        if (hit.type === 'double') {
                            stats.manifestationStats.totalDoubleHits++;
                            doubleWeeksSum += hit.weeks;
                        } else if (hit.type === 'triple') {
                            stats.manifestationStats.totalTripleHits++;
                            tripleWeeksSum += hit.weeks;
                        }
                    });
                }
            });
        });

        if (stats.manifestationStats.totalDoubleHits > 0) {
            stats.manifestationStats.avgWeeksToDouble = (doubleWeeksSum / stats.manifestationStats.totalDoubleHits).toFixed(2);
        }
        if (stats.manifestationStats.totalTripleHits > 0) {
            stats.manifestationStats.avgWeeksToTriple = (tripleWeeksSum / stats.manifestationStats.totalTripleHits).toFixed(2);
        }

        // Top seeds
        const seedPerformance = new Map();
        allDrawsData.forEach(drawData => {
            drawData.seedOrigins.forEach(origin => {
                const key = [...origin.seed].sort((a, b) => a - b).join('-');
                if (!seedPerformance.has(key)) {
                    seedPerformance.set(key, {
                        seed: origin.seed,
                        occurrences: 0,
                        totalAnalysisScore: 0,
                        hubType: origin.type,
                        hubMiddle: origin.middle,
                        grade: origin.hubStats.grade,
                        manifestations: { double: 0, triple: 0 }
                    });
                }
                const perf = seedPerformance.get(key);
                perf.occurrences++;
                perf.totalAnalysisScore += origin.analysisScore;
                perf.manifestations.double += origin.jointManifestations.filter(h => h.type === 'double').length;
                perf.manifestations.triple += origin.jointManifestations.filter(h => h.type === 'triple').length;
            });
        });

        const topSeeds = Array.from(seedPerformance.values())
            .map(s => ({ ...s, avgAnalysisScore: (s.totalAnalysisScore / s.occurrences).toFixed(2) }))
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, 50);

        // Create human-readable format
        const humanReadable = {
            "📊 SUMMARY": {
                "Total Draws Analyzed": stats.totalDrawsAnalyzed,
                "Draws with Seed Origins": stats.drawsWithSeedOrigins,
                "Total Seed Origins Found": stats.totalSeedOriginsFound,
                "Coverage": `${((stats.drawsWithSeedOrigins / stats.totalDrawsAnalyzed) * 100).toFixed(1)}%`
            },

            "🔢 TYPE BREAKDOWN": {
                "Addition Paths": stats.typeDistribution.addition,
                "Multiplication Paths": stats.typeDistribution.multiplication,
                "Addition %": `${((stats.typeDistribution.addition / stats.totalSeedOriginsFound) * 100).toFixed(1)}%`,
                "Multiplication %": `${((stats.typeDistribution.multiplication / stats.totalSeedOriginsFound) * 100).toFixed(1)}%`
            },

            "📐 GEOMETRY BREAKDOWN": {
                "Orthogonal (Gold Standard)": stats.geometryDistribution.orthogonal,
                "Diagonal": stats.geometryDistribution.diagonal,
                "Orthogonal %": `${((stats.geometryDistribution.orthogonal / stats.totalSeedOriginsFound) * 100).toFixed(1)}%`
            },

            "🏆 GRADE DISTRIBUTION": {
                "Elite Alpha": stats.gradeDistribution['Elite Alpha'],
                "Premium Beta": stats.gradeDistribution['Premium Beta'],
                "Standard Gamma": stats.gradeDistribution['Standard Gamma'],
                "Standard": stats.gradeDistribution['Standard']
            },

            "⚡ JOINT MANIFESTATIONS": {
                "Seeds with Future Hits": stats.manifestationStats.totalWithManifestations,
                "Total Double Hits": stats.manifestationStats.totalDoubleHits,
                "Total Triple Hits": stats.manifestationStats.totalTripleHits,
                "Avg Weeks to Double Hit": stats.manifestationStats.avgWeeksToDouble,
                "Avg Weeks to Triple Hit": stats.manifestationStats.avgWeeksToTriple
            },

            "🌟 TOP 20 MOST FREQUENT SEEDS": topSeeds.slice(0, 20).map((s, i) => ({
                "Rank": i + 1,
                "Seed Cluster": `[${s.seed.join(', ')}]`,
                "Hub Number": s.hubMiddle,
                "Path Type": s.hubType === 'addition' ? '+ Addition' : '× Multiplication',
                "Occurrences": s.occurrences,
                "Grade": s.grade,
                "Avg Analysis Score": s.avgAnalysisScore,
                "Double Hits": s.manifestations.double,
                "Triple Hits": s.manifestations.triple
            })),

            "📅 EXAMPLE DRAWS": allDrawsData.slice(0, 10).map(d => ({
                "Week": d.weekNumber,
                "Draw": d.draw.join(', '),
                "Seed Origins Found": d.seedOriginsCount,
                "Seeds": d.seedOrigins.map(s => ({
                    "From Pair": `#${s.pair[0]} + #${s.pair[1]}`,
                    "→ Seed Cluster": `[${s.seed.join(', ')}]`,
                    "Hub": `#${s.middle}`,
                    "Path": s.type === 'addition' ? '+ Addition' : '× Multiplication',
                    "Geometry": s.isOrtho ? '✓ Orthogonal (Gold)' : 'Diagonal',
                    "Grade": s.hubStats.grade,
                    "Win Rate": s.hubStats.winRate,
                    "ROI": s.hubStats.roi,
                    "Analysis Score": s.analysisScore || 'N/A',
                    "Future Hits": s.jointManifestations.length > 0
                        ? s.jointManifestations.map(h =>
                            `${h.type === 'triple' ? '🏆 TRIPLE' : '⚡ DOUBLE'} [${h.nums.join(', ')}] after ${h.weeks} weeks`
                        )
                        : ['No manifestations yet']
                }))
            })),

            "📦 FULL DATA": {
                "Note": "Complete draw-by-draw data available below",
                "All Draws": allDrawsData
            }
        };

        // Download JSON
        const blob = new Blob([JSON.stringify(humanReadable, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cluster_seed_origins_statistics.json';
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ JSON Downloaded!');
        console.log(`📊 Total Draws: ${stats.totalDrawsAnalyzed}`);
        console.log(`🌱 Draws with Seeds: ${stats.drawsWithSeedOrigins}`);
        console.log(`🎯 Total Seeds Found: ${stats.totalSeedOriginsFound}`);
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Cluster Seed Origins Exporter</h1>
                <p className="text-gray-600 mb-6">
                    Click the button below to generate and download a comprehensive JSON file containing all cluster seed origins statistics.
                </p>
                <button
                    onClick={generateJSON}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                >
                    Generate & Download JSON
                </button>
            </div>
        </div>
    );
}

export default ClusterSeedOriginsExporter;
