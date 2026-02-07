import { analyzeLotteryData } from './src/hooks/useLotteryAnalysis.js';

// We need 50+ weeks for full engine features
const robustMockData = Array.from({ length: 60 }, (_, i) =>
    Array.from({ length: 5 }, (_, j) => ((i + j) % 49) + 1)
);

try {
    console.log("Running Analysis on Robust Mock Data...");
    const analysis = analyzeLotteryData(robustMockData);

    if (!analysis) {
        console.error("FAILED: Analysis returned null");
        process.exit(1);
    }

    // Check 1: Metrics in ensemble
    const ensemble = analysis.predictions.ensemble;
    if (!ensemble || ensemble.length === 0) {
        console.error("FAILED: No ensemble predictions found");
    } else {
        const first = ensemble[0];
        console.log(`Checking metrics for number #${first.number}:`, JSON.stringify(first.metrics));

        const requiredMetrics = ['binary', 'bayesian', 'root', 'pattern', 'urgency'];
        const missing = requiredMetrics.filter(m => !first.metrics || first.metrics[m] === undefined);

        if (missing.length > 0) {
            console.error(`FAILED: Missing metrics: ${missing.join(', ')}`);
        } else {
            console.log("SUCCESS: All required metrics found in ensemble.");
        }
    }

    // Check 2: Backtest Returns initialization
    const bankerStats = analysis.backtest.strategies.banker;
    console.log(`Checking Banker Returns: ${bankerStats.return}`);

    if (bankerStats.return === 1 && bankerStats.totalBets === 0) {
        console.error("FAILED: Banker returns still incorrectly initialized to 1.");
    } else if (bankerStats.return === 0 && bankerStats.totalBets === 0) {
        console.log("SUCCESS: Banker returns correctly initialized to 0.");
    } else {
        console.log(`INFO: Banker returns is ${bankerStats.return} for ${bankerStats.totalBets} bets.`);
    }

    console.log("Verification checks completed.");

} catch (err) {
    console.error("ERROR during verification:", err);
    process.exit(1);
}
