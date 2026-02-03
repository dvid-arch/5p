
import { detectIsolatedClusters } from './src/pages/PatternUtils.js';
import { truestdata } from './src/constant/data.js';

function runAnalysis() {
    let totalClusters = 0;
    let singleHits = 0;
    let doubleHits = 0;
    let weeksWithClusters = 0;

    let clusterWaitTimes = [];

    // Index 0 is newest. Index 1 is future for Index 2.
    // So we iterate i from truestdata.length - 1 down to 1.
    // Prediction made at i, checked at i-1.
    for (let i = truestdata.length - 1; i >= 1; i--) {
        const currentDraw = truestdata[i];

        if (!currentDraw || currentDraw.length === 0) continue;

        const clusters = detectIsolatedClusters(currentDraw);

        if (clusters.length > 0) {
            weeksWithClusters++;

            clusters.forEach(cluster => {
                totalClusters++;
                const [p1, p2] = cluster.predictions;

                // Track how many weeks until hit
                let wait = 0;
                let hitFound = false;
                for (let next = i - 1; next >= 0; next--) {
                    wait++;
                    const draw = truestdata[next];
                    if (draw.includes(p1) || draw.includes(p2)) {
                        hitFound = true;
                        break;
                    }
                    if (wait >= 20) break; // Cap search at 20 weeks for practical limits
                }

                if (hitFound) {
                    clusterWaitTimes.push(wait);
                    if (wait === 1) {
                        singleHits++;
                    }
                    // Check if both hit in the SAME week they finally hit
                    const hitDraw = truestdata[i - wait];
                    if (hitDraw.includes(p1) && hitDraw.includes(p2)) {
                        doubleHits++;
                    }
                }
            });
        }
    }

    const avgWait = clusterWaitTimes.length > 0
        ? (clusterWaitTimes.reduce((a, b) => a + b, 0) / clusterWaitTimes.length).toFixed(2)
        : "N/A";

    console.log("--- Isolated Spatial Cluster Analysis Report ---");
    console.log(`Total Draws Analyzed: ${truestdata.length}`);
    console.log(`Total Clusters Detected: ${totalClusters}`);
    console.log("------------------------------------------------");
    console.log(`Immediate Success (Week 1): ${((singleHits / totalClusters) * 100).toFixed(2)}%`);
    console.log(`Average Wait Period (1-to-Play): ${avgWait} weeks`);
    console.log(`Max Wait Observed (in 20-wk cap): ${Math.max(...clusterWaitTimes, 0)} weeks`);
    console.log(`Total Hits Captured (within 20 weeks): ${clusterWaitTimes.length} / ${totalClusters}`);
    console.log("------------------------------------------------");
}

try {
    runAnalysis();
} catch (err) {
    console.error(err);
}
