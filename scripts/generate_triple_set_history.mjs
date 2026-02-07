import fs from 'fs';
import { truestdata } from '../src/constant/data.js';

/**
 * Script to backtest triple set predictions over historical weeks.
 * It simulates the prediction engine at each point in time and tracks outcomes.
 */

const REPORT_PATH = './triple_set_report.json';
const OUTPUT_PATH = './src/constant/triple_set_historical_audit.json';
const BACKTEST_WEEKS = 150; // How far back to audit
const CHASE_WINDOW = 15;

async function generateHistory() {
    console.log('--- Generating Triple Set Historical Audit ---');

    if (!fs.existsSync(REPORT_PATH)) {
        console.error('Error: triple_set_report.json not found');
        return;
    }

    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    const topSets = report.topSets;

    const auditData = {};

    // Helper: Check if a set hits in a specific draw
    const doesSetHit = (set, draw) => {
        return set.triples.some(triple => {
            return triple.every(num => draw.includes(num));
        });
    };

    // Helper: Find all hit indices for a set in the entire truestdata
    const getHitIndices = (set) => {
        const indices = [];
        truestdata.forEach((draw, idx) => {
            if (doesSetHit(set, draw)) indices.push(idx);
        });
        return indices;
    };

    // Pre-calculate hit indices for all top sets
    const setsWithHits = topSets.map(set => ({
        ...set,
        hitIndices: getHitIndices(set)
    }));

    // Process each week (starting from最新的 valid backtest week)
    // We need at least CHASE_WINDOW weeks of future data to audit, but we'll audit even recent ones as 'pending'
    for (let i = 0; i < BACKTEST_WEEKS; i++) {
        const weekIndex = i;
        const weekNumber = i + 1;

        if (!truestdata[weekIndex]) continue;

        // Calculate metrics for each set AS IF we were at weekIndex
        const candidates = setsWithHits.map((set, setIdx) => {
            // History is everything AFTER weekIndex (e.g., if i=10, history is 11, 12, ...)
            const pastHits = set.hitIndices.filter(idx => idx > weekIndex);

            let currentGap = 0;
            if (pastHits.length > 0) {
                currentGap = pastHits[0] - weekIndex;
            } else {
                currentGap = truestdata.length - weekIndex; // Approximate if no hits
            }

            // Gaps between past hits
            const pastGaps = [];
            for (let g = 0; g < pastHits.length - 1; g++) {
                // Since pastHits are sorted ascending (latest to oldest index)
                // idx 5 is newer than idx 10. Gap is 10 - 5 - 1.
                pastGaps.push(pastHits[g + 1] - pastHits[g] - 1);
            }

            const avgGap = pastGaps.length > 0
                ? pastGaps.reduce((a, b) => a + b, 0) / pastGaps.length
                : 6.0;

            // Mode Calculation: Find the most frequent gap
            let modeGap = 6.0;
            if (pastGaps.length > 0) {
                const counts = {};
                let maxCount = 0;
                pastGaps.forEach(g => {
                    counts[g] = (counts[g] || 0) + 1;
                    if (counts[g] > maxCount) {
                        maxCount = counts[g];
                        modeGap = g;
                    }
                });
                // If every gap is unique, fallback to Median or Mean,
                // but for lottery data, mode is usually recurring numbers.
                if (maxCount === 1) modeGap = avgGap;
            }

            const maxGap = pastGaps.length > 0 ? Math.max(...pastGaps) : 30;

            const hitFrequency = ((pastHits.length / (truestdata.length - weekIndex)) * 100).toFixed(1);

            const overdueFactor = modeGap > 0 ? currentGap / modeGap : currentGap / avgGap;
            const maxGapProximity = (currentGap / maxGap) * 100;
            // Consensus Score - Rebalanced to prevent stagnation
            const consensusScore = (overdueFactor * 30) + (parseFloat(hitFrequency) * 0.5) + (maxGapProximity * 0.6);

            return {
                id: setIdx,
                triples: set.triples,
                currentGap,
                avgGap: parseFloat(avgGap.toFixed(2)),
                modeGap: parseFloat(modeGap.toFixed(2)),
                maxGap,
                overdueFactor: parseFloat(overdueFactor.toFixed(2)),
                maxGapProximity: parseFloat(maxGapProximity.toFixed(1)),
                hitFrequency: parseFloat(hitFrequency),
                consensusScore: parseFloat(consensusScore.toFixed(2))
            };
        });

        // Pick top prediction
        candidates.sort((a, b) => b.consensusScore - a.consensusScore);
        const top4 = candidates.slice(0, 4);
        const primary = top4[0];

        // Audit forward hits (indexes before weekIndex, e.g., i-1, i-2, ...)
        let hitWeek = null;
        let weeksToHit = null;
        let outcome = 'Miss';

        for (let offset = 1; offset <= CHASE_WINDOW; offset++) {
            const futureIdx = weekIndex - offset;
            if (futureIdx < 0) {
                outcome = 'Pending';
                break;
            }

            if (doesSetHit(primary, truestdata[futureIdx])) {
                hitWeek = futureIdx + 1;
                weeksToHit = offset;
                outcome = 'Hit';
                break;
            }
        }

        auditData[weekIndex] = {
            weekNumber,
            primary,
            top4,
            audit: {
                outcome,
                hitWeek,
                weeksToHit,
                chaseWindow: CHASE_WINDOW
            }
        };
    }

    // Save to src/constant so UI can import it
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(auditData, null, 2));
    console.log(`Success: Audit saved to ${OUTPUT_PATH}`);
}

generateHistory().catch(err => console.error(err));
