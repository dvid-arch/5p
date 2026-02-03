
import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';
import { truestdata } from './src/constant/data.js';

try {
    console.log("Starting minimal test...");
    const result = analyzeLotteryData(truestdata.slice(0, 100));
    console.log("Success! Ensemble count:", result.predictions.ensemble.length);
    console.log("Active Clusters:", result.predictions.latestClusters.length);
} catch (err) {
    console.error("MINIMAL TEST FAILED:", err);
}
