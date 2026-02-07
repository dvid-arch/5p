
import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { truestdata } from './src/constant/data.js';

function verifyResonance() {
    // We analyze the full truestdata
    const analysis = analyzeLotteryData(truestdata);

    if (!analysis) {
        console.error("Analysis failed to run.");
        return;
    }

    const { bankers, latestClusters } = analysis.predictions;

    console.log("--- Resonance Verification ---");
    console.log(`Latest Clusters Detected: ${latestClusters.length}`);

    if (latestClusters.length > 0) {
        const resonantBankers = bankers.filter(b => b.resonance);
        console.log(`Resonant Bankers Found: ${resonantBankers.length}`);

        resonantBankers.forEach(b => {
            console.log(`Pair: ${b.pair}, Strength: ${b.strength.toFixed(2)}, Confidence: ${b.confidence}`);
        });

        if (resonantBankers.length > 0) {
            console.log("SUCCESS: Resonance flagging is active.");
        } else {
            console.log("WARNING: Clusters detected but no bankers flagged. Check synergy thresholds.");
        }
    } else {
        console.log("No clusters in latest draw. Seeking previous draw with clusters...");
        // Check historical slices if latest has no clusters
        for (let i = 1; i < 20; i++) {
            const slice = truestdata.slice(i);
            const subAnalysis = analyzeLotteryData(slice);
            if (subAnalysis.predictions.latestClusters.length > 0) {
                console.log(`Found clusters at slice offset ${i}`);
                const resB = subAnalysis.predictions.bankers.filter(b => b.resonance);
                console.log(`Resonant Bankers at offset ${i}: ${resB.length}`);
                break;
            }
        }
    }
}

verifyResonance();
