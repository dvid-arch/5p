
import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { truestdata } from './src/constant/data.js';

function verifyNeuralSensitivity() {
    console.log("--- Neural Resonance Sensitivity Audit ---");

    // Run analysis on latest data
    const analysis = analyzeLotteryData(truestdata);
    if (!analysis) return;

    const { latestClusters } = analysis.predictions;
    const sensors = analysis.signals;

    if (latestClusters.length === 0) {
        console.log("No active clusters in latest draw to verify. Scanning history...");
        // Handle no current cluster by slicing?
    }

    const resonantNums = new Set(latestClusters.flatMap(c => c.predictions));

    console.log("\nSample Model Comparison:");
    console.log("Num | Reson | Neural Score | Top Sensor Contributions");
    console.log("-----------------------------------------------------");

    const sortedNums = Object.keys(sensors).map(Number).sort((a, b) => sensors[b].neural - sensors[a].neural);

    sortedNums.slice(0, 10).forEach(num => {
        const s = sensors[num];
        const resLabel = resonantNums.has(num) ? "YES" : " no";
        console.log(`${num.toString().padStart(3)} | ${resLabel} | ${s.neural.toFixed(4)} | ` +
            `Gap:${s.gap.toFixed(2)} Vel:${s.velocity.toFixed(2)} HMM:${s.hmmState.toFixed(2)}`);
    });

    // Strategy verification
    const resCount = resonantNums.size;
    const resInTop10 = sortedNums.slice(0, 10).filter(num => resonantNums.has(num)).length;

    console.log("\n--- Impact Assessment ---");
    console.log(`Active Resonant Numbers: ${resCount}`);
    console.log(`Resonant Numbers in Neural Top 10: ${resInTop10}`);

    if (resInTop10 > 0) {
        console.log("SUCCESS: Neural engine is prioritizing Resonant signals.");
    } else {
        console.log("NOTICE: Neural engine has not yet weighted Resonance above other combined sensors.");
    }
}

verifyNeuralSensitivity();
