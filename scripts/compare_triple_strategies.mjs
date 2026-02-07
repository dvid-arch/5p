import fs from 'fs';
import { truestdata } from '../src/constant/data.js';

/**
 * Script to compare Triple Set Strategies:
 * 1. Mean-based Overdue
 * 2. Mode-based Overdue
 * 3. Frequency-based
 * 
 * Target: ROI and Success Rate within a 15-week Chase.
 */

const REPORT_PATH = './triple_set_report.json';
const BACKTEST_RANGE = 400; // Large range for statistical significance
const CHASE_WINDOW = 15;

// Helper: Find the most frequent gap (Mode)
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

// Helper: Check if set hits in a draw
const doesSetHit = (set, draw) => {
    return set.triples.some(triple => {
        return triple.every(num => draw.includes(num));
    });
};

async function runComparison() {
    console.log('--- Strategy Comparison Simulation (15-Week Chase) ---');

    if (!fs.existsSync(REPORT_PATH)) {
        console.error('Error: triple_set_report.json not found');
        return;
    }

    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    const topSets = report.topSets;

    const strategies = [
        { name: 'Mean-Based Overdue', hits: 0, total: 0, totalWeeksToHit: 0 },
        { name: 'Mode-Based Overdue', hits: 0, total: 0, totalWeeksToHit: 0 },
        { name: 'Frequency-Based', hits: 0, total: 0, totalWeeksToHit: 0 }
    ];

    // Pre-calculate hit indices for all top sets for speed
    const setsWithHits = topSets.map(set => {
        const hitIndices = [];
        truestdata.forEach((draw, idx) => {
            if (doesSetHit(set, draw)) hitIndices.push(idx);
        });
        return { ...set, hitIndices };
    });

    for (let i = BACKTEST_RANGE; i >= CHASE_WINDOW; i--) {
        const weekIndex = i;

        // Simulate at weekIndex
        const setsAtTime = setsWithHits.map(set => {
            const pastHits = set.hitIndices.filter(idx => idx > weekIndex);

            let currentGap = 0;
            if (pastHits.length > 0) {
                currentGap = pastHits[0] - weekIndex;
            } else {
                currentGap = truestdata.length - weekIndex;
            }

            const pastGaps = [];
            for (let g = 0; g < pastHits.length - 1; g++) {
                pastGaps.push(pastHits[g + 1] - pastHits[g] - 1);
            }

            const avgGap = pastGaps.length > 0
                ? pastGaps.reduce((a, b) => a + b, 0) / pastGaps.length
                : 6;

            const modeGap = calculateMode(pastGaps);
            const frequency = pastHits.length;

            return {
                ...set,
                currentGap,
                avgGap,
                modeGap,
                frequency,
                overdueMean: avgGap > 0 ? currentGap / avgGap : 0,
                overdueMode: modeGap > 0 ? currentGap / modeGap : (avgGap > 0 ? currentGap / avgGap : 0)
            };
        });

        // Pick top for each strategy
        const pickMean = [...setsAtTime].sort((a, b) => b.overdueMean - a.overdueMean)[0];
        const pickMode = [...setsAtTime].sort((a, b) => b.overdueMode - a.overdueMode)[0];
        const pickFreq = [...setsAtTime].sort((a, b) => b.frequency - a.frequency)[0];

        const picks = [pickMean, pickMode, pickFreq];

        picks.forEach((pick, sIdx) => {
            strategies[sIdx].total++;
            let hitFound = false;
            for (let offset = 1; offset <= CHASE_WINDOW; offset++) {
                const futureIdx = weekIndex - offset;
                if (futureIdx < 0) break;
                if (doesSetHit(pick, truestdata[futureIdx])) {
                    strategies[sIdx].hits++;
                    strategies[sIdx].totalWeeksToHit += offset;
                    hitFound = true;
                    break;
                }
            }
        });
    }

    console.log('\n--- Simulation Results ---');
    strategies.forEach(s => {
        const successRate = (s.hits / s.total * 100).toFixed(2);
        const avgWait = (s.totalWeeksToHit / s.hits).toFixed(2);
        console.log(`${s.name}:`);
        console.log(`  Success Rate: ${successRate}% (${s.hits}/${s.total})`);
        console.log(`  Avg Chase Duration: ${avgWait} weeks`);
    });

    const winner = strategies.reduce((a, b) => (a.hits > b.hits ? a : b));
    console.log(`\nWinner: ${winner.name}`);
}

runComparison().catch(err => console.error(err));
