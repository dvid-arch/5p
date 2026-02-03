
import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { truestdata } from './src/constant/data.js';

/**
 * Evaluates a list of predictions against a actual draw.
 * Returns the number of hits.
 */
function getHits(predictions, actualDraw) {
    return predictions.filter(num => actualDraw.includes(num)).length;
}

/**
 * Runs a comparative benchmark across historical draws.
 */
function runBenchmark() {
    console.log("--- Strategy Benchmark: Standard vs Resonant ---");
    console.log(`Total Dataset Size: ${truestdata.length} weeks.`);

    let stats = {
        standardBankerHits: 0,
        resonantBankerHits: 0,
        standardDoubleHits: 0,
        resonantDoubleHits: 0,
        standardTop20Hits: 0,
        resonantTop20Hits: 0,
        weeksWithResonance: 0,
        totalWeeksAnalyzed: 0
    };

    // Analyze the last 200 weeks for performance (Sampling every 2nd week for speed)
    const lookbackRange = 200;

    for (let i = lookbackRange; i >= 1; i -= 2) {
        process.stdout.write(`\rProgress: Analyzing Week ${truestdata.length - i}...`);
        const slice = truestdata.slice(i);
        const nextDraw = truestdata[i - 1];
        if (!nextDraw) continue;

        const analysis = analyzeLotteryData(slice);
        if (!analysis) continue;

        stats.totalWeeksAnalyzed++;

        const { bankers, ensemble, latestClusters } = analysis.predictions;
        const resonanceActive = latestClusters.length > 0;
        if (resonanceActive) stats.weeksWithResonance++;

        // 1. BANKER PERFORMANCE (Top 4)
        const standardBankers = [...bankers].sort((a, b) => {
            const aBase = a.resonance ? a.strength / 1.5 : a.strength;
            const bBase = b.resonance ? b.strength / 1.5 : b.strength;
            return bBase - aBase;
        }).slice(0, 4);

        const resonantBankers = [...bankers].slice(0, 4);

        // Banker Hit (1-to-play)
        const stdBankerHit = standardBankers.some(b => b.numbers.some(n => nextDraw.includes(n))) ? 1 : 0;
        const resBankerHit = resonantBankers.some(b => b.numbers.some(n => nextDraw.includes(n))) ? 1 : 0;

        // Double Hit (Special Target)
        const stdDoubleHit = standardBankers.filter(b => b.numbers.every(n => nextDraw.includes(n))).length;
        const resDoubleHit = resonantBankers.filter(b => b.numbers.every(n => nextDraw.includes(n))).length;

        stats.standardBankerHits += stdBankerHit;
        stats.resonantBankerHits += resBankerHit;
        stats.standardDoubleHits += stdDoubleHit;
        stats.resonantDoubleHits += resDoubleHit;

        // 2. TOP 20 SINGLES PERFORMANCE
        const stdTop20 = ensemble.slice(0, 20).map(e => e.number);

        const resonanceNums = new Set(latestClusters.flatMap(c => c.predictions));
        const resTop20 = [...ensemble].map(e => {
            const isResonant = resonanceNums.has(e.number);
            return {
                ...e,
                boostedScore: isResonant ? e.score * 1.5 : e.score
            };
        }).sort((a, b) => b.boostedScore - a.boostedScore).slice(0, 20).map(e => e.number);

        stats.standardTop20Hits += getHits(stdTop20, nextDraw);
        stats.resonantTop20Hits += getHits(resTop20, nextDraw);
    }
    console.log("\n--- BENCHMARK COMPLETE ---");

    const bankerStandardRate = (stats.standardBankerHits / stats.totalWeeksAnalyzed) * 100;
    const bankerResonantRate = (stats.resonantBankerHits / stats.totalWeeksAnalyzed) * 100;
    const top20StandardAvg = stats.standardTop20Hits / stats.totalWeeksAnalyzed;
    const top20ResonantAvg = stats.resonantTop20Hits / stats.totalWeeksAnalyzed;

    console.log("--- FINAL RESULTS ---");
    console.log(`Weeks Analyzed: ${stats.totalWeeksAnalyzed}`);
    console.log(`Weeks with Resonance Signals: ${stats.weeksWithResonance} (${((stats.weeksWithResonance / stats.totalWeeksAnalyzed) * 100).toFixed(1)}%)`);
    console.log("------------------------------------------------");
    console.log(`Banker (1-to-Play) Standard: ${bankerStandardRate.toFixed(2)}% | Resonant: ${bankerResonantRate.toFixed(2)}%`);
    console.log(`Banker (Double Hit) Standard: ${stats.standardDoubleHits} | Resonant: ${stats.resonantDoubleHits}`);
    console.log(`Double Hit Improvement: ${((stats.resonantDoubleHits - stats.standardDoubleHits) / (stats.standardDoubleHits || 1) * 100).toFixed(2)}%`);
    console.log("------------------------------------------------");
    console.log(`Singles Top 20 Avg Hits (Standard): ${top20StandardAvg.toFixed(2)}`);
    console.log(`Singles Top 20 Avg Hits (Resonant): ${top20ResonantAvg.toFixed(2)}`);
    console.log(`Singles Improvement: ${((top20ResonantAvg - top20StandardAvg) / (top20StandardAvg || 1) * 100).toFixed(2)}%`);
    console.log("------------------------------------------------");
}

runBenchmark();
