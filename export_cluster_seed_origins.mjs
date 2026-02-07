import { truestdata } from './src/constant/data.js';
import { getHubStats } from './src/constant/HubRegistry.js';
import trioData from './advanced_combination_analysis.json' assert { type: 'json' };
import fs from 'fs';

/**
 * Export Cluster Seed Origins Statistics
 * Generates comprehensive JSON data for all historical draws
 */

// Pattern detection functions
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

    // Deduplicate
    const unique = [];
    results.forEach(res => {
        const key = `${res.pair.join(',')}-${res.seed.join(',')}`;
        if (!unique.some(u => `${u.pair.join(',')}-${u.seed.join(',')}` === key)) {
            unique.push(res);
        }
    });

    return unique;
};

// Build trio score map
const trioScoreMap = new Map();
if (trioData && trioData.topCombinations) {
    trioData.topCombinations.forEach(t => {
        const key = [...t.combination].sort((a, b) => a - b).join('-');
        trioScoreMap.set(key, parseFloat(t.compositeScore));
    });
}

const allDrawsData = [];

console.log(`Analyzing ${truestdata.length} historical draws...`);

// Process each draw
truestdata.forEach((draw, idx) => {
    const weekNumber = idx + 1;
    const origins = detectInverseClusters(draw);

    if (origins.length === 0) {
        return; // Skip draws with no seed origins
    }

    const processed = origins.map(s => {
        const stats = getHubStats(s.type, s.middle);

        // Look up dynamic score from analysis data
        const seedKey = [...s.seed].sort((a, b) => a - b).join('-');
        const analysisScore = trioScoreMap.get(seedKey) || 0;

        // Grade priority scoring
        let gradeScore = 1;
        if (stats.grade === "Elite Alpha") gradeScore = 4;
        else if (stats.grade === "Premium Beta") gradeScore = 3;
        else if (stats.grade === "Standard Gamma") gradeScore = 2;

        // Track joint manifestations
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

    // Sort by analysis score (primary), then grade score (secondary)
    processed.sort((a, b) => {
        if (b.analysisScore !== a.analysisScore) return b.analysisScore - a.analysisScore;
        if (b.gradeScore !== a.gradeScore) return b.gradeScore - a.gradeScore;
        const wrB = parseFloat(b.hubStats.winRate) || 0;
        const wrA = parseFloat(a.hubStats.winRate) || 0;
        return wrB - wrA;
    });

    // Deduplicate by seed cluster
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

// Calculate aggregate statistics
const stats = {
    totalDrawsAnalyzed: truestdata.length,
    drawsWithSeedOrigins: allDrawsData.length,
    totalSeedOriginsFound: allDrawsData.reduce((sum, d) => sum + d.seedOriginsCount, 0),

    // Type distribution
    typeDistribution: {
        addition: 0,
        multiplication: 0
    },

    // Geometry distribution
    geometryDistribution: {
        orthogonal: 0,
        diagonal: 0
    },

    // Grade distribution
    gradeDistribution: {
        'Elite Alpha': 0,
        'Premium Beta': 0,
        'Standard Gamma': 0,
        'Standard': 0
    },

    // Joint manifestation stats
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
        // Type
        stats.typeDistribution[origin.type]++;

        // Geometry
        if (origin.isOrtho) {
            stats.geometryDistribution.orthogonal++;
        } else {
            stats.geometryDistribution.diagonal++;
        }

        // Grade
        stats.gradeDistribution[origin.hubStats.grade]++;

        // Manifestations
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

// Calculate averages
if (stats.manifestationStats.totalDoubleHits > 0) {
    stats.manifestationStats.avgWeeksToDouble = (doubleWeeksSum / stats.manifestationStats.totalDoubleHits).toFixed(2);
}
if (stats.manifestationStats.totalTripleHits > 0) {
    stats.manifestationStats.avgWeeksToTriple = (tripleWeeksSum / stats.manifestationStats.totalTripleHits).toFixed(2);
}

// Top performing seed clusters
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
    .map(s => ({
        ...s,
        avgAnalysisScore: (s.totalAnalysisScore / s.occurrences).toFixed(2)
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 50);

// Final output
const output = {
    metadata: {
        generatedAt: new Date().toISOString(),
        description: "Cluster Seed Origins - Complete Statistical Analysis"
    },
    aggregateStatistics: stats,
    topPerformingSeeds: topSeeds,
    drawByDrawData: allDrawsData
};

// Write to file
const outputPath = './cluster_seed_origins_statistics.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('\n✅ Export Complete!');
console.log(`📊 Total Draws Analyzed: ${stats.totalDrawsAnalyzed}`);
console.log(`🌱 Draws with Seed Origins: ${stats.drawsWithSeedOrigins}`);
console.log(`🎯 Total Seed Origins Found: ${stats.totalSeedOriginsFound}`);
console.log(`📁 Output saved to: ${outputPath}`);
console.log('\nTop 5 Most Frequent Seeds:');
topSeeds.slice(0, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. [${s.seed.join(', ')}] - ${s.occurrences} occurrences (${s.grade})`);
});
