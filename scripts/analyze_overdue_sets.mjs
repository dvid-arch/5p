import fs from 'fs';
import path from 'path';

/**
 * Script to analyze triple_set_report.json and predict the most overdue/plausible set
 * for a 5-week chase based on historical absence and performance metrics.
 */

// Paths
const REPORT_PATH = './triple_set_report.json';
const OUTPUT_PATH = './triple_set_predictions_audit.json';

// Shared Helper: Find the most frequent gap
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

async function analyze() {
    console.log('--- Triple Set Overdue Analysis (Mode-Based) ---');

    if (!fs.existsSync(REPORT_PATH)) {
        console.error(`Error: ${REPORT_PATH} not found.`);
        return;
    }

    const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'));
    const topSets = report.topSets;

    console.log(`Processing ${topSets.length} sets...`);

    const analyzedSets = topSets.map((set, index) => {
        const modeGap = calculateMode(set.gaps || []);

        // 1. Overdue Factor: Current gap vs Mode gap, fallback to Average gap if mode is 0
        const overdueFactor = modeGap > 0 ? set.currentGap / modeGap : (set.avgGap > 0 ? set.currentGap / set.avgGap : 0);

        // 2. Max Gap Proximity: How close is the current gap to the historical max?
        const maxGapProximity = set.maxGap > 0 ? (set.currentGap / set.maxGap) * 100 : 0;

        // 3. Consensus Score: Rebalanced to prevent "Mode 1" stagnation
        // Consensus = (OverdueFactor * 30) + (HitFrequency * 0.5) + (MaxGapProximity * 0.6)
        const consensusScore = (overdueFactor * 30) + (set.hitFrequency * 0.5) + (maxGapProximity * 0.6);

        return {
            ...set,
            id: index,
            modeGap,
            overdueFactor: parseFloat(overdueFactor.toFixed(2)),
            maxGapProximity: parseFloat(maxGapProximity.toFixed(1)),
            consensusScore: parseFloat(consensusScore.toFixed(2)),
            rank: index + 1
        };
    });

    // Sort by consensusScore descending
    analyzedSets.sort((a, b) => b.consensusScore - a.consensusScore);

    console.log('\nTop 4 Mode-Based Predictions for 5-Week Chase:');
    const predictions = analyzedSets.slice(0, 4).map((p, i) => {
        console.log(`\n${i + 1}. CONSENSUS SCORE: ${p.consensusScore}`);
        console.log(`   Triples: ${JSON.stringify(p.triples)}`);
        console.log(`   Current Gap: ${p.currentGap} | Mode Gap: ${p.modeGap} | Factor: ${p.overdueFactor}x`);
        console.log(`   Max Gap: ${p.maxGap} | Max Proximity: ${p.maxGapProximity}%`);
        console.log(`   Hits: ${p.hits} | Hit Frequency: ${p.hitFrequency}%`);

        return p;
    });

    const topPrediction = predictions[0];
    const rationale = `Set #${topPrediction.id} is the most plausible target for a 5-week chase based on rhythmic hit patterns. ` +
        `It is currently ${topPrediction.overdueFactor}x overdue relative to its most frequent (Mode) gap of ${topPrediction.modeGap}. ` +
        `Additionally, it is at ${topPrediction.maxGapProximity}% of its historical maximum gap (${topPrediction.maxGap}). ` +
        `Using Mode instead of Average focuses on the set's typical behavior rather than outliers, suggesting a high-conviction entry point.`;

    console.log(`\nRationale: ${rationale}`);

    const results = {
        generatedAt: new Date().toISOString(),
        top4Predictions: predictions,
        primaryPrediction: {
            ...topPrediction,
            rationale
        }
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\nSuccess: Results saved to ${OUTPUT_PATH}`);
}

analyze().catch(err => console.error(err));
