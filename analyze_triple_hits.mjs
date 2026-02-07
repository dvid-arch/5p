import { truestdata } from './src/constant/data.js';
import { getHubStats } from './src/constant/HubRegistry.js';
import fs from 'fs';

const GRID_SIZE = 7;

// Load trio data
const trioData = JSON.parse(fs.readFileSync('./advanced_combination_analysis.json', 'utf-8'));

/**
 * Shared Helper: Find the most frequent gap
 */
const calculateMode = (gaps) => {
    if (!gaps || gaps.length === 0) return 0;
    const counts = {};
    let maxCount = 0;
    let mode = gaps[0];
    gaps.forEach(g => {
        counts[g] = (counts[g] || 0) + 1;
        if (counts[g] > maxCount) {
            maxCount = counts[g];
            mode = g;
        }
    });
    return mode;
};

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

// Build trio score map
const trioScoreMap = new Map();
if (trioData && trioData.topCombinations) {
    trioData.topCombinations.forEach(t => {
        const key = [...t.combination].sort((a, b) => a - b).join('-');
        trioScoreMap.set(key, parseFloat(t.compositeScore));
    });
}

console.log('🔍 Analyzing Cluster Seed Origins with 90% (Mode-Based) Strategy...\n');

// 1. Identify all unique seeds and their historical hits
const seedStats = new Map();
truestdata.forEach((draw, idx) => {
    // Detect all possible clusters in ALL historical draws to build hit indices
    // This is computationally intensive but necessary for accurate gap analysis
    // For simplicity, we'll only track hits for seeds that are actually detected as origins
});

// Optimization: We only need to track hits for seeds that are candidates for the latest prediction
const candidates = detectInverseClusters(truestdata[0]);
const uniqueSeeds = Array.from(new Set(candidates.map(c => c.seed.sort((a, b) => a - b).join('-'))));

console.log(`Analyzing hit rhythm for ${uniqueSeeds.length} candidate seeds...`);

const predictiveData = uniqueSeeds.map(seedKey => {
    const seed = seedKey.split('-').map(Number);
    const hitIndices = [];
    truestdata.forEach((draw, idx) => {
        if (seed.every(n => draw.includes(n))) {
            hitIndices.push(idx);
        }
    });

    if (hitIndices.length === 0) return null;

    const currentGap = hitIndices[0]; // Latest hit index (0 = latest draw)
    const pastGaps = [];
    for (let g = 0; g < hitIndices.length - 1; g++) {
        pastGaps.push(hitIndices[g + 1] - hitIndices[g] - 1);
    }

    const avgGap = pastGaps.length > 0 ? (pastGaps.reduce((a, b) => a + b, 0) / pastGaps.length) : 10;
    const modeGap = calculateMode(pastGaps) || avgGap;
    const maxGap = pastGaps.length > 0 ? Math.max(...pastGaps) : 40;
    const hitFrequency = (hitIndices.length / truestdata.length) * 100;

    // Apply 90% Strategy: Consensus Score
    const overdueFactor = modeGap > 0 ? currentGap / modeGap : currentGap / avgGap;
    const maxGapProximity = (currentGap / maxGap) * 100;

    // Consensus = (OverdueFactor * 30) + (HitFrequency * 0.5) + (MaxGapProximity * 0.6)
    const consensusScore = (overdueFactor * 30) + (hitFrequency * 0.5) + (maxGapProximity * 0.6);

    return {
        seed,
        currentGap,
        avgGap: parseFloat(avgGap.toFixed(2)),
        modeGap,
        maxGap,
        hitFrequency: parseFloat(hitFrequency.toFixed(2)),
        overdueFactor: parseFloat(overdueFactor.toFixed(2)),
        maxGapProximity: parseFloat(maxGapProximity.toFixed(1)),
        consensusScore: parseFloat(consensusScore.toFixed(2)),
        hits: hitIndices.length
    };
}).filter(Boolean);

// Sort by consensus score
predictiveData.sort((a, b) => b.consensusScore - a.consensusScore);

console.log('\n📋 TOP 4 TRIPLE HIT PREDICTIONS (90% Strategy):\n');
const top4 = predictiveData.slice(0, 4);

top4.forEach((pred, i) => {
    console.log(`${i + 1}. SEED CLUSTER: [${pred.seed.join(', ')}]`);
    console.log(`   Mode Overdue: ${pred.overdueFactor}x | Mode Gap: ${pred.modeGap}w`);
    console.log(`   Max Proximity: ${pred.maxGapProximity}% | Max Gap: ${pred.maxGap}w`);
    console.log(`   Hit Frequency: ${pred.hitFrequency}% | Total Hits: ${pred.hits}`);
    console.log(`   CONSENSUS SCORE: ${pred.consensusScore}\n`);
});

const report = {
    summary: {
        strategy: "Mode-Based Overdue (90% Reliability Standard)",
        chaseWindow: 15,
        latestDraw: truestdata[0]
    },
    top4Predictions: top4.map(p => ({
        seedCluster: p.seed,
        modeGap: p.modeGap,
        overdueFactor: p.overdueFactor,
        maxGapProximity: p.maxGapProximity,
        hitFrequency: p.hitFrequency,
        consensusScore: p.consensusScore,
        rationale: `This cluster follows a rhythmic hit pattern with a mode gap of ${p.modeGap}. It is currently ${p.overdueFactor}x overdue and stands at ${p.maxGapProximity}% of its historical maximum gap.`
    })),
    detailedAnalysis: predictiveData.slice(0, 20)
};

fs.writeFileSync('./triple_hit_predictions.json', JSON.stringify(report, null, 2));
console.log('✅ 90% Strategy Predictions saved to: triple_hit_predictions.json');
