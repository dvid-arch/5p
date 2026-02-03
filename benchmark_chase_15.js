
import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { detectIsolatedClusters } from './src/pages/PatternUtils.js';
import { truestdata } from './src/constant/data.js';

function runChaseBenchmark() {
    console.log("--- 10-15 Week Chase Strategy Benchmark ---");
    console.log(`Analyzing ${truestdata.length} total draws...`);

    let stats = {
        clusterPairs: { total: 0, hits10: 0, hits15: 0, totalWait: 0, successes: 0 },
        enginePairs: { total: 0, hits10: 0, hits15: 0, totalWait: 0, successes: 0 }
    };

    const data = [...truestdata].reverse(); // Oldest first
    const CHASE_WINDOW_MAX = 20;
    const SAMPLE_STEP = 10; // Sample every 10th week for speed

    // To prevent over-sampling, we step through history
    for (let i = 100; i < data.length - CHASE_WINDOW_MAX; i += SAMPLE_STEP) {
        if (i % 50 === 0) process.stdout.write(`\rProgress: Week ${i}/${data.length - CHASE_WINDOW_MAX}...`);
        const slice = data.slice(0, i + 1).reverse(); // newest-first slice for engine
        const analysis = analyzeLotteryData(slice);
        if (!analysis) continue;

        const { pairs, latestClusters } = analysis.predictions;

        // 1. CLUSTER PAIRS (Top Cluster only)
        if (latestClusters && latestClusters.length > 0) {
            const cp = latestClusters[0].predictions;
            stats.clusterPairs.total++;

            let hit1 = -1, hit2 = -1;
            for (let w = 1; w <= 20; w++) {
                const draw = data[i + w];
                if (hit1 === -1 && draw.includes(cp[0])) hit1 = w;
                if (hit2 === -1 && draw.includes(cp[1])) hit2 = w;
                if (hit1 !== -1 && hit2 !== -1) {
                    const res = Math.max(hit1, hit2);
                    stats.clusterPairs.successes++;
                    stats.clusterPairs.totalWait += res;
                    if (res <= 10) stats.clusterPairs.hits10++;
                    if (res <= 15) stats.clusterPairs.hits15++;
                    break;
                }
            }
        }

        // 2. ENGINE PAIRS (Top 1 signalPair)
        if (pairs && pairs.length > 0) {
            const ep = pairs[0].numbers;
            stats.enginePairs.total++;

            let hit1 = -1, hit2 = -1;
            for (let w = 1; w <= 20; w++) {
                const draw = data[i + w];
                if (hit1 === -1 && draw.includes(ep[0])) hit1 = w;
                if (hit2 === -1 && draw.includes(ep[1])) hit2 = w;
                if (hit1 !== -1 && hit2 !== -1) {
                    const res = Math.max(hit1, hit2);
                    stats.enginePairs.successes++;
                    stats.enginePairs.totalWait += res;
                    if (res <= 10) stats.enginePairs.hits10++;
                    if (res <= 15) stats.enginePairs.hits15++;
                    break;
                }
            }
        }
    }
    console.log("\n");

    const clusterAvg = stats.clusterPairs.successes > 0 ? (stats.clusterPairs.totalWait / stats.clusterPairs.successes).toFixed(1) : "N/A";
    const engineAvg = stats.enginePairs.successes > 0 ? (stats.enginePairs.totalWait / stats.enginePairs.successes).toFixed(1) : "N/A";

    console.log("\n--- RESULTS OVERVIEW ---");
    console.log("------------------------------------------------");
    console.log("STRATEGY: CLUSTER-BASED PAIRS");
    console.log(`- Samples Found: ${stats.clusterPairs.total}`);
    console.log(`- Hit within 10 Weeks: ${((stats.clusterPairs.hits10 / stats.clusterPairs.total) * 100).toFixed(1)}%`);
    console.log(`- Hit within 15 Weeks: ${((stats.clusterPairs.hits15 / stats.clusterPairs.total) * 100).toFixed(1)}%`);
    console.log(`- Average Wait (Hits only): ${clusterAvg} weeks`);
    console.log("------------------------------------------------");
    console.log("STRATEGY: STANDARD ENGINE PAIRS (SIGNALPAIRS)");
    console.log(`- Samples Found: ${stats.enginePairs.total}`);
    console.log(`- Hit within 10 Weeks: ${((stats.enginePairs.hits10 / stats.enginePairs.total) * 100).toFixed(1)}%`);
    console.log(`- Hit within 15 Weeks: ${((stats.enginePairs.hits15 / stats.enginePairs.total) * 100).toFixed(1)}%`);
    console.log(`- Average Wait (Hits only): ${engineAvg} weeks`);
    console.log("------------------------------------------------");

    console.log("\n--- RECOMMENDATION BASIS ---");
    const diff10 = ((stats.clusterPairs.hits10 / stats.clusterPairs.total) - (stats.enginePairs.hits10 / stats.enginePairs.total)) * 100;
    if (diff10 > 0) {
        console.log(`Cluster signals outperform standard pairs by ${diff10.toFixed(1)}% in the 10-week window.`);
        console.log("Recommendation: Boost pairs that align with active Spatial Clusters.");
    } else {
        console.log("Standard signals remain more consistent for short-term targets.");
    }
}

runChaseBenchmark();
