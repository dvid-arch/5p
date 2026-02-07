
import { detectIsolatedClusters } from './src/pages/PatternUtils.js';
import { truestdata } from './src/constant/data.js';

function analyzeChasePerformance() {
    console.log("--- Resonant Signal: 20-Week Chase Audit ---");
    console.log(`Analyzing ${truestdata.length} total draws...`);

    let totalClusters = 0;
    let doubleHitsWithin20 = 0;
    let totalWaitWeeks = 0;
    let doubleHitDetails = [];

    // Reverse truestdata to be oldest-first for easier forward scanning
    const data = [...truestdata].reverse();

    for (let i = 0; i < data.length - 20; i++) {
        const currentDraw = data[i].numbers || data[i];
        const clusters = detectIsolatedClusters(currentDraw);

        clusters.forEach(cluster => {
            totalClusters++;
            const preds = cluster.predictions;

            // Look ahead up to 20 weeks for a DOUBLE HIT
            let hit1 = -1;
            let hit2 = -1;

            for (let j = i + 1; j <= i + 20 && j < data.length; j++) {
                const futureDraw = data[j].numbers || data[j];

                if (hit1 === -1 && futureDraw.includes(preds[0])) hit1 = j - i;
                if (hit2 === -1 && futureDraw.includes(preds[1])) hit2 = j - i;

                if (hit1 !== -1 && hit2 !== -1) {
                    doubleHitsWithin20++;
                    const resolutionWeek = Math.max(hit1, hit2);
                    totalWaitWeeks += resolutionWeek;
                    doubleHitDetails.push(resolutionWeek);
                    break;
                }
            }
        });
    }

    const doubleHitRate = (doubleHitsWithin20 / totalClusters) * 100;
    const avgWait = doubleHitsWithin20 > 0 ? (totalWaitWeeks / doubleHitsWithin20).toFixed(1) : 0;

    console.log("------------------------------------------------");
    console.log(`Total Clusters Detected: ${totalClusters}`);
    console.log(`Successful Double Hits (within 20 weeks): ${doubleHitsWithin20}`);
    console.log(`Double Hit Success Rate: ${doubleHitRate.toFixed(2)}%`);
    console.log(`Average Wait Period for Double Hit: ${avgWait} weeks`);

    // Distribution
    const distribution = {};
    doubleHitDetails.forEach(w => distribution[w] = (distribution[w] || 0) + 1);

    console.log("--- Wait Time Distribution (Successes Only) ---");
    Object.keys(distribution).sort((a, b) => a - b).forEach(w => {
        console.log(`Week ${w}: ${distribution[w]} hits`);
    });
    console.log("------------------------------------------------");
}

analyzeChasePerformance();
