import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { detectInverseClusters } from './src/pages/PatternUtils.js';
import { truestdata } from './src/constant/data.js';

function benchmarkTop20WithSeedBoost() {
    console.log("=== TOP 20 PREDICTIONS: SEED ORIGIN IMPACT ANALYSIS ===\n");
    console.log(`Analyzing ${truestdata.length} draws...\n`);

    const stats = {
        standard: { total: 0, hits: 0, hitDistribution: [] },
        seedBoosted: { total: 0, hits: 0, hitDistribution: [] }
    };

    const CHASE_WINDOW = 1; // Predict next immediate draw
    const SAMPLE_STEP = 5; // Sample every 5th week for speed

    for (let i = 100; i < truestdata.length - CHASE_WINDOW; i += SAMPLE_STEP) {
        if (i % 50 === 0) process.stdout.write(`\rProgress: ${i}/${truestdata.length - CHASE_WINDOW}...`);

        const slice = truestdata.slice(i).reverse(); // Newest-first for analysis
        const analysis = analyzeLotteryData(slice);
        if (!analysis) continue;

        const { ensemble } = analysis.predictions;
        if (!ensemble || ensemble.length === 0) continue;

        const nextDraw = truestdata[i - 1]; // Next actual draw
        if (!nextDraw) continue;

        // Get current draw for seed origin detection
        const currentDraw = truestdata[i];
        const seedOrigins = detectInverseClusters(currentDraw);

        // Extract all numbers that appear in seed origins
        const seedNumbers = new Set();
        seedOrigins.forEach(origin => {
            origin.seed.forEach(num => seedNumbers.add(num));
            origin.pair.forEach(num => seedNumbers.add(num));
        });

        // STANDARD Top 20
        const standardTop20 = ensemble.slice(0, 20).map(e => e.number);
        const standardHits = standardTop20.filter(num => nextDraw.includes(num)).length;
        stats.standard.total++;
        stats.standard.hits += standardHits;
        stats.standard.hitDistribution.push(standardHits);

        // SEED-BOOSTED Top 20
        // Apply a 30% boost to numbers in seed origins
        const boostedEnsemble = ensemble.map(e => ({
            ...e,
            boostedScore: seedNumbers.has(e.number) ? e.score * 1.3 : e.score
        })).sort((a, b) => b.boostedScore - a.boostedScore);

        const boostedTop20 = boostedEnsemble.slice(0, 20).map(e => e.number);
        const boostedHits = boostedTop20.filter(num => nextDraw.includes(num)).length;
        stats.seedBoosted.total++;
        stats.seedBoosted.hits += boostedHits;
        stats.seedBoosted.hitDistribution.push(boostedHits);
    }
    console.log("\n");

    // Calculate metrics
    const standardAvg = (stats.standard.hits / stats.standard.total).toFixed(2);
    const boostedAvg = (stats.seedBoosted.hits / stats.seedBoosted.total).toFixed(2);
    const improvement = ((boostedAvg - standardAvg) / standardAvg * 100).toFixed(1);

    console.log("📊 PERFORMANCE RESULTS\n");
    console.log("─".repeat(60));
    console.log("STANDARD TOP 20 (Current Logic)");
    console.log(`   Total Predictions: ${stats.standard.total}`);
    console.log(`   Total Hits: ${stats.standard.hits}`);
    console.log(`   Average Hits per Draw: ${standardAvg}`);
    console.log("─".repeat(60));

    console.log("\n🔮 SEED-BOOSTED TOP 20 (+30% to seed origin numbers)");
    console.log(`   Total Predictions: ${stats.seedBoosted.total}`);
    console.log(`   Total Hits: ${stats.seedBoosted.hits}`);
    console.log(`   Average Hits per Draw: ${boostedAvg}`);
    console.log("─".repeat(60));

    console.log("\n📈 IMPROVEMENT ANALYSIS\n");
    if (parseFloat(improvement) > 0) {
        console.log(`   ✅ POSITIVE IMPACT: +${improvement}% improvement`);
        console.log(`   📊 Absolute gain: +${(boostedAvg - standardAvg).toFixed(2)} hits per draw`);
        console.log(`   💡 RECOMMENDATION: Integrate seed origin boost into Top 20`);
    } else if (parseFloat(improvement) < 0) {
        console.log(`   ⚠️  NEGATIVE IMPACT: ${improvement}% decline`);
        console.log(`   📊 Absolute loss: ${(boostedAvg - standardAvg).toFixed(2)} hits per draw`);
        console.log(`   💡 RECOMMENDATION: Do NOT boost seed origins in Top 20`);
    } else {
        console.log(`   ⚖️  NEUTRAL: No significant change`);
        console.log(`   💡 Seed origins neither help nor hurt Top 20 accuracy`);
    }

    // Distribution analysis
    console.log("\n📊 HIT DISTRIBUTION\n");

    const getDistribution = (arr) => {
        const dist = {};
        arr.forEach(hits => dist[hits] = (dist[hits] || 0) + 1);
        return dist;
    };

    const stdDist = getDistribution(stats.standard.hitDistribution);
    const boostDist = getDistribution(stats.seedBoosted.hitDistribution);

    console.log("Hits | Standard | Seed-Boosted | Difference");
    console.log("─".repeat(60));
    for (let i = 0; i <= 8; i++) {
        const std = stdDist[i] || 0;
        const boost = boostDist[i] || 0;
        const diff = boost - std;
        const arrow = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
        console.log(`  ${i}  |   ${std.toString().padStart(3)}    |     ${boost.toString().padStart(3)}      |    ${arrow} ${Math.abs(diff)}`);
    }

    console.log("\n💡 STRATEGIC INSIGHTS\n");

    // Check if seed boost increases high-hit draws
    const stdHigh = (stdDist[5] || 0) + (stdDist[6] || 0) + (stdDist[7] || 0) + (stdDist[8] || 0);
    const boostHigh = (boostDist[5] || 0) + (boostDist[6] || 0) + (boostDist[7] || 0) + (boostDist[8] || 0);

    if (boostHigh > stdHigh) {
        console.log(`   ✅ Seed boost increases high-hit draws (5+ hits): ${stdHigh} → ${boostHigh}`);
        console.log(`   📈 This means better "jackpot" draws with 5+ correct predictions`);
    } else if (boostHigh < stdHigh) {
        console.log(`   ⚠️  Seed boost reduces high-hit draws (5+ hits): ${stdHigh} → ${boostHigh}`);
        console.log(`   📉 Trade-off: more consistent but fewer "jackpot" predictions`);
    }

    // Consistency check
    const stdMedian = stats.standard.hitDistribution.sort((a, b) => a - b)[Math.floor(stats.standard.hitDistribution.length / 2)];
    const boostMedian = stats.seedBoosted.hitDistribution.sort((a, b) => a - b)[Math.floor(stats.seedBoosted.hitDistribution.length / 2)];

    console.log(`\n   Median Hits: Standard = ${stdMedian}, Boosted = ${boostMedian}`);

    if (boostMedian > stdMedian) {
        console.log(`   ✅ Seed boost provides more consistent performance`);
    }
}

benchmarkTop20WithSeedBoost();
