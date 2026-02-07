
import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { truestdata } from './src/constant/data.js';

function verifySlidingResonance() {
    console.log("--- Sliding Window Resonance Verification ---");

    // We'll walk back in history and check if a cluster at week N persists into week N-1, N-2 etc.
    // until it's resolved.

    let targetCluster = null;
    let triggerWeek = 0;

    // Scan history backwards starting from 10 weeks ago to find a cluster
    for (let i = 10; i < 50; i++) {
        const slice = truestdata.slice(i);
        const analysis = analyzeLotteryData(slice);
        //latestClusters here refers to activeClusters (from useLotteryAnalysis)
        const clusters = analysis.predictions.latestClusters.filter(c => c.weeksAgo === 0);

        if (clusters.length > 0) {
            targetCluster = clusters[0];
            triggerWeek = truestdata.length - i;
            console.log(`[TRIGGER] Found cluster at Week ${triggerWeek}. Predictions: [${targetCluster.predictions}]`);

            // Now simulate subsequent weeks
            for (let forward = 1; forward <= 4; forward++) {
                const currentWeek = triggerWeek + forward;
                const nextSliceIndex = i - forward;
                if (nextSliceIndex < 0) break;

                const nextSlice = truestdata.slice(nextSliceIndex);
                const nextAnalysis = analyzeLotteryData(nextSlice);
                const active = nextAnalysis.predictions.latestClusters.filter(c =>
                    c.predictions.join(',') === targetCluster.predictions.join(',')
                );

                // Check if it hit in this new week
                const latestDrawNumbers = truestdata[nextSliceIndex];
                const didHit = targetCluster.predictions.some(p => latestDrawNumbers.includes(p));

                if (active.length > 0) {
                    console.log(`[WEEK ${currentWeek}] Resonance PERSISTS. Active: ${active[0].weeksAgo} weeks ago. Hit in this draw? ${didHit}`);
                } else {
                    console.log(`[WEEK ${currentWeek}] Resonance CLEARED. Hit in this draw? ${didHit}`);
                    break;
                }
            }
            break;
        }
    }
}

try {
    verifySlidingResonance();
} catch (err) {
    console.error("CRASH:", err);
}
