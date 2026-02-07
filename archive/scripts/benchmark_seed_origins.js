import { detectInverseClusters } from './src/pages/PatternUtils.js';
import { truestdata } from './src/constant/data.js';

function benchmarkSeedOrigins() {
    console.log("=== CLUSTER SEED ORIGIN PERFORMANCE BENCHMARK ===\n");
    console.log(`Analyzing ${truestdata.length} draws...\n`);

    const stats = {
        // Original pair (2-to-play - both numbers from the original pair)
        pairBoth: { total: 0, hits5: 0, hits10: 0, hits15: 0, hits20: 0, totalWait: 0, successes: 0, waitTimes: [] },

        // 2-out-of-3 from seed (any 2 of the 3 seed numbers)
        seed2of3: { total: 0, hits5: 0, hits10: 0, hits15: 0, hits20: 0, totalWait: 0, successes: 0, waitTimes: [] },

        // All 3 seed numbers (triple hit)
        seed3of3: { total: 0, hits5: 0, hits10: 0, hits15: 0, hits20: 0, totalWait: 0, successes: 0, waitTimes: [] }
    };

    const CHASE_WINDOW = 20;
    const SAMPLE_STEP = 5; // Sample every 5th week for speed

    for (let i = 100; i < truestdata.length - CHASE_WINDOW; i += SAMPLE_STEP) {
        if (i % 50 === 0) process.stdout.write(`\rProgress: ${i}/${truestdata.length - CHASE_WINDOW}...`);

        const currentDraw = truestdata[i];
        const seedOrigins = detectInverseClusters(currentDraw);

        if (seedOrigins.length === 0) continue;

        seedOrigins.forEach(origin => {
            const [pairA, pairB] = origin.pair;
            const [seed1, seed2, seed3] = origin.seed;

            // Track each prediction type
            stats.pairBoth.total++;
            stats.seed2of3.total++;
            stats.seed3of3.total++;

            // Chase forward to find hits
            for (let w = 1; w <= CHASE_WINDOW; w++) {
                const futureDraw = truestdata[i - w]; // Going forward (decreasing index in reversed data)
                if (!futureDraw) break;

                // 1. Original PAIR (both numbers)
                const pairHit = futureDraw.includes(pairA) && futureDraw.includes(pairB);
                if (pairHit && stats.pairBoth.waitTimes.length < stats.pairBoth.total) {
                    stats.pairBoth.successes++;
                    stats.pairBoth.totalWait += w;
                    stats.pairBoth.waitTimes.push(w);
                    if (w <= 5) stats.pairBoth.hits5++;
                    if (w <= 10) stats.pairBoth.hits10++;
                    if (w <= 15) stats.pairBoth.hits15++;
                    if (w <= 20) stats.pairBoth.hits20++;
                }

                // 2. SEED 2-out-of-3
                const seedMatches = [seed1, seed2, seed3].filter(n => futureDraw.includes(n));
                if (seedMatches.length >= 2 && stats.seed2of3.waitTimes.length < stats.seed2of3.total) {
                    stats.seed2of3.successes++;
                    stats.seed2of3.totalWait += w;
                    stats.seed2of3.waitTimes.push(w);
                    if (w <= 5) stats.seed2of3.hits5++;
                    if (w <= 10) stats.seed2of3.hits10++;
                    if (w <= 15) stats.seed2of3.hits15++;
                    if (w <= 20) stats.seed2of3.hits20++;
                }

                // 3. SEED 3-out-of-3 (all seed numbers)
                if (seedMatches.length === 3 && stats.seed3of3.waitTimes.length < stats.seed3of3.total) {
                    stats.seed3of3.successes++;
                    stats.seed3of3.totalWait += w;
                    stats.seed3of3.waitTimes.push(w);
                    if (w <= 5) stats.seed3of3.hits5++;
                    if (w <= 10) stats.seed3of3.hits10++;
                    if (w <= 15) stats.seed3of3.hits15++;
                    if (w <= 20) stats.seed3of3.hits20++;
                }
            }
        });
    }
    console.log("\n");

    // Calculate metrics
    function printMetrics(label, category) {
        const c = stats[category];
        const avg = c.successes > 0 ? (c.totalWait / c.successes).toFixed(1) : "N/A";
        const median = c.waitTimes.length > 0 ? c.waitTimes.sort((a, b) => a - b)[Math.floor(c.waitTimes.length / 2)] : "N/A";

        console.log(`\n${label}`);
        console.log(`   Total Predictions: ${c.total}`);
        console.log(`   Success within 5 weeks:  ${((c.hits5 / c.total) * 100).toFixed(1)}% (${c.hits5}/${c.total})`);
        console.log(`   Success within 10 weeks: ${((c.hits10 / c.total) * 100).toFixed(1)}% (${c.hits10}/${c.total})`);
        console.log(`   Success within 15 weeks: ${((c.hits15 / c.total) * 100).toFixed(1)}% (${c.hits15}/${c.total})`);
        console.log(`   Success within 20 weeks: ${((c.hits20 / c.total) * 100).toFixed(1)}% (${c.hits20}/${c.total})`);
        console.log(`   Average Wait Time: ${avg} weeks`);
        console.log(`   Median Wait Time: ${median} weeks`);
        console.log("   " + "─".repeat(50));
    }

    console.log("📊 PERFORMANCE RESULTS\n");
    printMetrics("🎯 ORIGINAL PAIR (2-to-Play - Both Numbers)", "pairBoth");
    printMetrics("🔮 SEED CLUSTER (2-out-of-3 Numbers)", "seed2of3");
    printMetrics("⭐ SEED CLUSTER (All 3 Numbers - Triple Hit)", "seed3of3");

    // Strategic Insights
    console.log("\n💡 STRATEGIC INSIGHTS\n");

    const seed2Success10 = (stats.seed2of3.hits10 / stats.seed2of3.total) * 100;
    const pairSuccess10 = (stats.pairBoth.hits10 / stats.pairBoth.total) * 100;

    if (seed2Success10 > 85) {
        console.log(`   ✅ EXCELLENT: Seed 2-out-of-3 achieves ${seed2Success10.toFixed(1)}% in 10 weeks`);
        console.log(`   📈 This outperforms many standard strategies`);
    }

    if (stats.seed2of3.waitTimes.length > 0) {
        const avgSeed = (stats.seed2of3.totalWait / stats.seed2of3.successes).toFixed(1);
        console.log(`   ⏱️  Average resolution: ${avgSeed} weeks for 2-out-of-3 seed hits`);
    }

    const advantage = seed2Success10 - pairSuccess10;
    if (advantage > 10) {
        console.log(`   ⚡ RECOMMENDATION: Prioritize 2-out-of-3 seed tracking (+${advantage.toFixed(1)}% vs original pair)`);
    } else if (advantage < -10) {
        console.log(`   📊 RECOMMENDATION: Original pair tracking performs better (+${Math.abs(advantage).toFixed(1)}%)`);
    } else {
        console.log(`   ⚖️  Both strategies perform similarly - use based on preference`);
    }

    // Frequency analysis
    console.log(`\n📈 FREQUENCY ANALYSIS`);
    console.log(`   Seed origins detected per week (avg): ${(stats.seed2of3.total / ((truestdata.length - CHASE_WINDOW - 100) / SAMPLE_STEP)).toFixed(1)}`);
    console.log(`   Estimated weekly opportunities: ${(stats.seed2of3.total / ((truestdata.length - CHASE_WINDOW - 100) / SAMPLE_STEP) * SAMPLE_STEP).toFixed(1)}`);
}

benchmarkSeedOrigins();
