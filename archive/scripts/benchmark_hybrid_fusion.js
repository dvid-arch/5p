
import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { truestdata } from './src/constant/data.js';

function runHybridFusionBenchmark() {
    console.log("--- HYBRID ELITE FUSION STRATEGY BENCHMARK ---");
    console.log(`Analyzing ${truestdata.length} total draws...`);

    let stats = {
        fusionPairs: { total: 0, hits10: 0, hits15: 0, totalWait: 0, successes: 0, waitTimes: [] },
        clusterOnly: { total: 0, hits10: 0, hits15: 0, totalWait: 0, successes: 0, waitTimes: [] },
        standardOnly: { total: 0, hits10: 0, hits15: 0, totalWait: 0, successes: 0, waitTimes: [] }
    };

    const data = [...truestdata].reverse(); // Oldest first
    const CHASE_WINDOW_MAX = 20;
    const SAMPLE_STEP = 10;

    for (let i = 100; i < data.length - CHASE_WINDOW_MAX; i += SAMPLE_STEP) {
        if (i % 50 === 0) process.stdout.write(`\rProgress: Week ${i}/${data.length - CHASE_WINDOW_MAX}...`);

        const slice = data.slice(0, i + 1).reverse();
        const analysis = analyzeLotteryData(slice);
        if (!analysis) continue;

        const { pairs, latestClusters } = analysis.predictions;
        if (!pairs || pairs.length === 0) continue;

        // Extract cluster prediction numbers
        const clusterNumbers = new Set();
        if (latestClusters && latestClusters.length > 0) {
            latestClusters.forEach(cluster => {
                cluster.predictions.forEach(num => clusterNumbers.add(num));
            });
        }

        // Categorize top 5 pairs
        const topPairs = pairs.slice(0, 5);

        topPairs.forEach(pair => {
            const [n1, n2] = pair.numbers;
            const bothInCluster = clusterNumbers.has(n1) && clusterNumbers.has(n2);
            const category = bothInCluster ? 'fusionPairs' : 'standardOnly';

            stats[category].total++;

            // Chase forward to see resolution time
            let hit1 = -1, hit2 = -1;
            for (let w = 1; w <= 20; w++) {
                const draw = data[i + w];
                if (!draw) break;
                if (hit1 === -1 && draw.includes(n1)) hit1 = w;
                if (hit2 === -1 && draw.includes(n2)) hit2 = w;
                if (hit1 !== -1 && hit2 !== -1) {
                    const res = Math.max(hit1, hit2);
                    stats[category].successes++;
                    stats[category].totalWait += res;
                    stats[category].waitTimes.push(res);
                    if (res <= 10) stats[category].hits10++;
                    if (res <= 15) stats[category].hits15++;
                    break;
                }
            }
        });

        // Track cluster-only pairs (not in top 5 standard)
        if (latestClusters && latestClusters.length > 0) {
            const topPairStrings = new Set(topPairs.map(p => `${p.numbers[0]}-${p.numbers[1]}`));

            latestClusters.forEach(cluster => {
                const cp = cluster.predictions;
                const clusterPairStr = `${cp[0]}-${cp[1]}`;
                const reverseStr = `${cp[1]}-${cp[0]}`;

                if (!topPairStrings.has(clusterPairStr) && !topPairStrings.has(reverseStr)) {
                    stats.clusterOnly.total++;

                    let hit1 = -1, hit2 = -1;
                    for (let w = 1; w <= 20; w++) {
                        const draw = data[i + w];
                        if (!draw) break;
                        if (hit1 === -1 && draw.includes(cp[0])) hit1 = w;
                        if (hit2 === -1 && draw.includes(cp[1])) hit2 = w;
                        if (hit1 !== -1 && hit2 !== -1) {
                            const res = Math.max(hit1, hit2);
                            stats.clusterOnly.successes++;
                            stats.clusterOnly.totalWait += res;
                            stats.clusterOnly.waitTimes.push(res);
                            if (res <= 10) stats.clusterOnly.hits10++;
                            if (res <= 15) stats.clusterOnly.hits15++;
                            break;
                        }
                    }
                }
            });
        }
    }
    console.log("\n");

    // Calculate metrics
    function getMetrics(category) {
        const c = stats[category];
        return {
            samples: c.total,
            success10: c.total > 0 ? ((c.hits10 / c.total) * 100).toFixed(1) : "0.0",
            success15: c.total > 0 ? ((c.hits15 / c.total) * 100).toFixed(1) : "0.0",
            avgWait: c.successes > 0 ? (c.totalWait / c.successes).toFixed(1) : "N/A",
            median: c.waitTimes.length > 0 ? c.waitTimes.sort((a, b) => a - b)[Math.floor(c.waitTimes.length / 2)] : "N/A"
        };
    }

    const fusion = getMetrics('fusionPairs');
    const clusterOnly = getMetrics('clusterOnly');
    const standardOnly = getMetrics('standardOnly');

    console.log("=== HYBRID STRATEGY PERFORMANCE ===\n");

    console.log("🌟 ELITE FUSION PAIRS (Both Engine + Cluster)");
    console.log(`   Samples Found: ${fusion.samples}`);
    console.log(`   10-Week Success: ${fusion.success10}%`);
    console.log(`   15-Week Success: ${fusion.success15}%`);
    console.log(`   Average Wait: ${fusion.avgWait} weeks`);
    console.log(`   Median Wait: ${fusion.median} weeks`);
    console.log("   ─────────────────────────────────────");

    console.log("\n⚙️  STANDARD ENGINE ONLY (Not in Clusters)");
    console.log(`   Samples Found: ${standardOnly.samples}`);
    console.log(`   10-Week Success: ${standardOnly.success10}%`);
    console.log(`   15-Week Success: ${standardOnly.success15}%`);
    console.log(`   Average Wait: ${standardOnly.avgWait} weeks`);
    console.log(`   Median Wait: ${standardOnly.median} weeks`);
    console.log("   ─────────────────────────────────────");

    console.log("\n🔮 CLUSTER ONLY (Not in Top 5 Engine)");
    console.log(`   Samples Found: ${clusterOnly.samples}`);
    console.log(`   10-Week Success: ${clusterOnly.success10}%`);
    console.log(`   15-Week Success: ${clusterOnly.success15}%`);
    console.log(`   Average Wait: ${clusterOnly.avgWait} weeks`);
    console.log(`   Median Wait: ${clusterOnly.median} weeks`);
    console.log("   ─────────────────────────────────────");

    console.log("\n📊 STRATEGIC INSIGHTS");
    if (fusion.samples > 0) {
        const fusionAdvantage = (parseFloat(fusion.success10) - parseFloat(standardOnly.success10)).toFixed(1);
        const speedGain = (parseFloat(standardOnly.avgWait) - parseFloat(fusion.avgWait)).toFixed(1);

        console.log(`   • Fusion pairs appear ${fusion.samples} times (double-validated signals)`);
        console.log(`   • Fusion 10-week advantage: ${fusionAdvantage > 0 ? '+' : ''}${fusionAdvantage}%`);
        console.log(`   • Fusion speed gain: ${speedGain > 0 ? '+' : ''}${speedGain} weeks faster`);

        if (parseFloat(fusion.success10) > parseFloat(standardOnly.success10)) {
            console.log(`   ✅ RECOMMENDED: Prioritize Elite Fusion pairs for optimal results`);
        } else {
            console.log(`   ℹ️  Standard pairs remain competitive, fusion adds validation confidence`);
        }
    } else {
        console.log(`   ⚠️  No fusion pairs detected in sample. Clusters and Engine may have low overlap.`);
    }
}

runHybridFusionBenchmark();
