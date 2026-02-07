/**
 * Grid Predictor Logic
 * Core algorithms for 8-cell sliding grid analysis
 */

// 7x7 Grid Constants
const GRID_SIZE = 7;
const TOTAL_CELLS = 49;

/**
 * Get the 8+ cells covered by a grid center
 * Implements a sliding 3x3 pattern minus center, mapped to linear 1-49
 * Adjusted to ensure valid bounds for 7x7 grid
 */
export function getGridCells(center) {
    // Convert 1-based center to 0-based row/col
    const centerIdx = center - 1;
    const row = Math.floor(centerIdx / GRID_SIZE);
    const col = centerIdx % GRID_SIZE;

    const cells = [];

    // Define relative offsets for a "grid" around the center
    // This creates a pattern. Let's use a 3x3 box centered on 'center', clipped to grid
    // Offsets: [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]
    // + the center itself? The example says "Center #10 covers: [2, 3, 4, 9, 10, 11, ...]"
    // Center 10 is Row 1, Col 2 (0-indexed: Row 1, Col 2).
    // Let's deduce the pattern from Example 10:
    // 10 is at (1, 2).
    // Cells listed: 1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18
    // Row 0: 1, 2, 3, 4 (Indices 0, 1, 2, 3) -> relative (row-1) cols 0-3
    // Row 1: 8, 9, 10, 11 (Indices 7, 8, 9, 10) -> relative (row) cols 0-3
    // Row 2: 15, 16, 17, 18 (Indices 14, 15, 16, 17) -> relative (row+1) cols 0-3
    // It seems to be a 3x4 block? Or a sliding window?
    // Let's try a standard 3x4 block around the center?
    // Let's assume a fixed "coverage template" relative to center.
    // Based on example "Center #10 (1,2) -> 1,2,3,4, 8,9,10,11, 15,16,17,18"
    // This creates a 3-row x 4-col block. Top-left is at (0, 0).
    // Center 10 (1,2) seems to be at grid (row, col) = (1, 2).
    // The block is Rows 0-2, Cols 0-3.
    // So relative to center (r, c), the block is [r-1..r+1] x [c-2..c+1] ?
    // Let's check center 25 (Row 3, Col 3).
    // Example says: 17, 18, 19, 24, 25, 26, 31, 32, 33...
    // Block: Rows 2-4. Cols 2-4?
    // 17,18,19 are Row 2, cols 2,3,4.
    // 24,25,26 are Row 3, cols 2,3,4.
    // 31,32,33 are Row 4, cols 2,3,4.
    // This looks like a 3x3 block centered on 25.

    // RE-EVALUATING BASED ON "8-cell sliding grid" description but example shows 12.
    // "Each Grid Center Covers 12-13 Cells" says the doc.
    // Let's implement a dynamic 3x4 or 4x3 area, or simpler 3x3 + extra.
    // Let's stick to a robust 3x4 area centered somewhat on the node.

    // Heuristic: 3x3 Grid (9 cells) - Standard Moore Neighborhood
    // Center Row offset: -1 to +1
    // Center Col offset: -1 to +1
    for (let rOffset = -1; rOffset <= 1; rOffset++) {
        for (let cOffset = -1; cOffset <= 1; cOffset++) {
            const r = row + rOffset;
            const c = col + cOffset;

            // Check bounds
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                // Convert back to 1-based index
                cells.push(r * GRID_SIZE + c + 1);
            }
        }
    }

    return cells.sort((a, b) => a - b);
}

/**
 * Extract exactly 20 best numbers from a portfolio of grids
 */
export function getSmart20Numbers(portfolio) {
    // 1. Collect all unique numbers
    const allNumbers = new Set();
    const frequency = {};

    portfolio.forEach(grid => {
        grid.cells.forEach(num => {
            allNumbers.add(num);
            frequency[num] = (frequency[num] || 0) + 1;
        });
    });

    // 2. Convert to array
    let candidates = Array.from(allNumbers);

    // 3. Sort candidates:
    // Priority A: Overlap (in multiple grids)
    candidates.sort((a, b) => {
        const freqDiff = frequency[b] - frequency[a];
        if (freqDiff !== 0) return freqDiff;
        return a - b; // Ascending order for ties
    });

    // 4. Slice Top 20
    return candidates.slice(0, 20).sort((a, b) => a - b);
}

/**
 * Calculate how many winning numbers a grid center catches
 */
export function calculateGridCoverage(numbers, center) {
    const gridCells = getGridCells(center);
    const covered = numbers.filter(n => gridCells.includes(n));
    return {
        hits: covered.length,
        coveredNumbers: covered,
        cells: gridCells
    };
}

/**
 * Find the optimal grid centers that capture the most numbers for a specific draw
 */
export function findOptimalGridCenters(numbers, topN = 3) {
    const results = [];

    // Test all 49 centers
    for (let center = 1; center <= 49; center++) {
        const { hits, coveredNumbers, cells } = calculateGridCoverage(numbers, center);
        results.push({
            center,
            coverage: hits,
            coveredNumbers,
            cells,
            efficiency: (hits / cells.length * 100).toFixed(1)
        });
    }

    // Sort by coverage descending, then center ascending
    results.sort((a, b) => b.coverage - a.coverage || a.center - b.center);

    return results.slice(0, topN);
}

/**
 * Analyze historical frequency of grid centers
 * @param {Array} history - Array of past draws
 * @param {number} weeks - Number of recent weeks to analyze (0 = all)
 */
export function analyzeGridCenterFrequency(history, weeks = 0) {
    const dataToAnalyze = weeks > 0 ? history.slice(0, weeks) : history;
    const frequency = {};

    // Initialize
    for (let i = 1; i <= 49; i++) frequency[i] = { count: 0, totalCoverage: 0 };

    dataToAnalyze.forEach(draw => {
        const numbers = Array.isArray(draw) ? draw : (draw.numbers || draw.value || []);
        if (!numbers || numbers.length === 0) return;

        // Find best center for this draw
        const best = findOptimalGridCenters(numbers, 1)[0];
        if (best) {
            frequency[best.center].count++;
        }

        // Also track coverage for all centers to get average
        for (let c = 1; c <= 49; c++) {
            const cov = calculateGridCoverage(numbers, c);
            frequency[c].totalCoverage += cov.hits;
        }
    });

    // Convert to array
    const sorted = Object.keys(frequency).map(center => ({
        center: parseInt(center),
        count: frequency[center].count,
        avgCoverage: (frequency[center].totalCoverage / dataToAnalyze.length).toFixed(2),
        percentage: (frequency[center].count / dataToAnalyze.length * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);

    return sorted;
}

/**
 * Predict best centers for next draw using weighted scoring with Gap Analysis
 */
/**
 * Predict best centers for next draw using weighted scoring with Gap Analysis
 * AND now incorporates "Institutional Signals" (Bottom-Up Number Scores)
 */
export function predictBestGridCenters(history, topN = 3, recentWeeks = 13, numberBoostMap = null) {
    // 1. All-time frequency
    const allTime = analyzeGridCenterFrequency(history);
    const allTimeMap = new Map(allTime.map(i => [i.center, i]));

    // 2. Recent frequency
    const recent = analyzeGridCenterFrequency(history, recentWeeks);
    const recentMap = new Map(recent.map(i => [i.center, i]));

    // 3. Gap Analysis (Time since last becoming the "best center")
    const gaps = {};
    for (let i = 1; i <= 49; i++) gaps[i] = 0;

    // Scan history to find last occurrence of each center being "optimal"
    for (let i = 0; i < history.length; i++) {
        const draw = history[i];
        const nums = Array.isArray(draw) ? draw : (draw.numbers || draw.value || []);
        if (!nums.length) continue;

        const best = findOptimalGridCenters(nums, 1)[0];
        if (best) {
            if (gaps[best.center] === 0 && i > 0) {
                gaps[best.center] = i; // Found last occurrence
            }
        }
    }

    const scores = [];
    for (let center = 1; center <= 49; center++) {
        const atStats = allTimeMap.get(center) || { count: 0, avgCoverage: 0 };
        const rcStats = recentMap.get(center) || { count: 0 };
        const gap = gaps[center] || history.length;
        const cells = getGridCells(center);

        // Scoring Components
        // A. Base Consistency (All-time freq)
        const baseScore = atStats.count;

        // B. Recent Momentum (Recent freq with 2x weight)
        const momentumScore = rcStats.count * 2;

        // C. Gap Factor (Due Theory vs Hot Hand)
        let gapBonus = 0;
        if (gap <= 3) gapBonus = 5; // Very hot
        else if (gap <= 8) gapBonus = 2; // Hot

        // D. Institutional Content Quality (NEW)
        // Check the quality of the numbers INSIDE this grid
        let qualityScore = 0;
        if (numberBoostMap) {
            let totalBoost = 0;
            cells.forEach(n => {
                totalBoost += (numberBoostMap[n] || 0);
            });
            // Normalized average boost * weight
            // If numbers score 0-1, avg is 0-1. 
            // We want this to be significant. 
            // Base scores are roughly 20-50.
            // So we multiply 0-1 score by ~20 to make it impactful.
            qualityScore = (totalBoost / cells.length) * 20;
        }

        // Final Score
        const finalScore = baseScore + momentumScore + gapBonus + qualityScore;

        scores.push({
            center,
            score: parseFloat(finalScore.toFixed(2)), // Clean float
            allTimeCount: atStats.count,
            recentCount: rcStats.count,
            avgCoverage: atStats.avgCoverage,
            gap,
            cells,
            components: { base: baseScore, momentum: momentumScore, gap: gapBonus, quality: qualityScore }
        });
    }

    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score).slice(0, topN);
}

/**
 * Optimize a portfolio of top N grids to maximize combined unique coverage
 * Now passes numberBoostMap down to prediction
 */
export function findOptimalGridPortfolio(history, topN = 3, recentWeeks = 13, numberBoostMap = null) {
    // Pool size: top 20 candidates to choose from (optimization space)
    const initialCandidates = predictBestGridCenters(history, 20, recentWeeks, numberBoostMap);
    const candidates = initialCandidates.sort((a, b) => b.score - a.score);

    const dataToAnalyze = history.slice(0, recentWeeks);
    const portfolio = [];
    // ... rest of logic remains same, just used smarter candidates ...

    // Universe of "Winning Numbers to Catch"
    // Each item is { dIdx, n, id }
    const flattenedHistory = [];
    dataToAnalyze.forEach((draw, dIdx) => {
        const numbers = Array.isArray(draw) ? draw : (draw.numbers || draw.value || []);
        numbers.forEach(n => {
            flattenedHistory.push({ dIdx, n, id: `${dIdx}-${n}` });
        });
    });

    let coveredItems = new Set(); // Set of IDs caught

    for (let step = 0; step < topN; step++) {
        let bestCandidate = null;
        let bestGain = -1;
        let bestGainItems = [];

        // Iterate through candidates
        for (let i = 0; i < candidates.length; i++) {
            const cand = candidates[i];
            if (portfolio.find(p => p.center === cand.center)) continue;

            let gain = 0;
            let gainItems = [];

            flattenedHistory.forEach(item => {
                if (!coveredItems.has(item.id)) {
                    if (cand.cells.includes(item.n)) {
                        gain++;
                        gainItems.push(item.id);
                    }
                }
            });

            if (gain > bestGain) {
                bestGain = gain;
                bestCandidate = cand;
                bestGainItems = gainItems;
            }
        }

        if (bestCandidate) {
            portfolio.push({
                ...bestCandidate,
                marginalGain: bestGain,
                cumulativeHits: coveredItems.size + bestGain,
                totalPossible: flattenedHistory.length,
                coveragePercent: ((coveredItems.size + bestGain) / flattenedHistory.length * 100).toFixed(1)
            });
            bestGainItems.forEach(id => coveredItems.add(id));
        }
    }

    return portfolio;
}

/**
 * Cluster frequency by 3x3 regions
 */
export function analyzeGridRegions(history) {
    const regions = Array(9).fill(0).map((_, i) => ({ id: i + 1, count: 0, percent: 0 }));

    // Map grid 1-49 to Regions 1-9
    // 1 2 3
    // 4 5 6
    // 7 8 9
    // Each region is approx 2x2 or 3x2 chunks of the 7x7 grid?
    // Let's use the logic:
    // Row 0-1 -> Region Row 0
    // Row 2-4 -> Region Row 1
    // Row 5-6 -> Region Row 2
    // Col 0-1 -> Region Col 0
    // ...

    const getRegion = (center) => {
        const r = Math.floor((center - 1) / 7);
        const c = (center - 1) % 7;

        let regR = 1;
        if (r < 2) regR = 0;
        else if (r > 4) regR = 2;

        let regC = 1;
        if (c < 2) regC = 0;
        else if (c > 4) regC = 2;

        return (regR * 3) + regC; // 0-8
    };

    const bestCenters = history.map(draw => {
        const nums = Array.isArray(draw) ? draw : (draw.numbers || draw.value || []);
        return findOptimalGridCenters(nums, 1)[0]?.center;
    }).filter(Boolean);

    bestCenters.forEach(center => {
        const regIdx = getRegion(center);
        regions[regIdx].count++;
    });

    regions.forEach(r => r.percent = (r.count / bestCenters.length * 100).toFixed(1));
    return regions;
}



import { analyzeLotteryData } from '../hooks/useLotteryAnalysis';

/**
 * Get Top 20 numbers based on Institutional Analysis (Ensemble Model) -- HEAVY
 * Use this ONLY for the single current-week display, NOT for backtesting loops.
 */
export function getInstitutional20(history) {
    const analysisResult = analyzeLotteryData(history, {
        recentWeeksWeight: 3,
        overdueThreshold: 1.5,
        hotThreshold: 0.21,
        coldThreshold: 0.19
    });

    if (!analysisResult || !analysisResult.predictions || !analysisResult.predictions.ensemble) {
        return [];
    }

    return analysisResult.predictions.ensemble
        .slice(0, 20)
        .map(p => p.number)
        .sort((a, b) => a - b);
}

/**
 * Get Top 20 numbers based on "Fast Hybrid" Strategy (Approximates Institutional)
 * Used for BACKTESTING to prevent browser crash (runs in O(N) instead of O(N^2))
 * Combines Frequency + Recency + Gap
 */
export function getBaselineTop20(history, recencyWeeks = 13) {
    const totalDraws = history.length;
    const dataToAnalyze = history.slice(0, recencyWeeks);
    const frequency = {};
    const recentFreq = {};
    const lastSeen = {};

    // 1. Calculate All-Time & Recent Frequencies
    history.forEach((draw, i) => {
        const nums = Array.isArray(draw) ? draw : (draw.numbers || draw.value || []);
        nums.forEach(n => {
            frequency[n] = (frequency[n] || 0) + 1;
            if (i < recencyWeeks) recentFreq[n] = (recentFreq[n] || 0) + 1;
            if (lastSeen[n] === undefined) lastSeen[n] = i; // 0 is most recent
        });
    });

    const scores = [];
    for (let n = 1; n <= 49; n++) { // Assuming 1-49
        const fScore = (frequency[n] || 0) / totalDraws;
        const rScore = (recentFreq[n] || 0) / recencyWeeks;
        const gap = lastSeen[n] !== undefined ? lastSeen[n] : totalDraws;

        // Simple weighting mimicking the Ensemble (Freq + Momentum + constant for Gap)
        // This is 100x faster than full HMM/Clustering
        const score = (fScore * 0.4) + (rScore * 0.4) + (Math.min(1, gap / 20) * 0.2);
        scores.push({ n, score });
    }

    // Return Top 20 by Score
    return scores.sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(s => s.n)
        .sort((a, b) => a - b);
}

/**
 * Run a backtest simulation to benchmark performance
 * Now compares "Grid Smart 20" vs "Baseline Top 20"
 */
export function backtestPortfolio(history, weeksToSimulate = 10, portfolioSize = 3, recencyWeeks = 13) {
    const results = [];

    // Safety check
    const maxWeeks = Math.min(weeksToSimulate, history.length - recencyWeeks - 1);

    for (let i = 0; i < maxWeeks; i++) {
        const targetDraw = history[i]; // The draw we try to predict
        const pastHistory = history.slice(i + 1); // Data available at that time

        // Skip if not enough history
        if (pastHistory.length < recencyWeeks) break;

        // 1. Grid Strategy
        const portfolio = findOptimalGridPortfolio(pastHistory, portfolioSize, recencyWeeks);
        const gridNumbers = getSmart20Numbers(portfolio);

        // 2. Baseline Strategy
        const baselineNumbers = getBaselineTop20(pastHistory, recencyWeeks);

        // Calculate hits
        const targetNums = Array.isArray(targetDraw) ? targetDraw : (targetDraw.numbers || targetDraw.value || []);
        const targetSet = new Set(targetNums);

        // Grid Hits
        const gridHits = gridNumbers.filter(n => targetSet.has(n)).length;

        // Baseline Hits
        const baselineHits = baselineNumbers.filter(n => targetSet.has(n)).length;

        results.push({
            drawId: targetDraw.draw || targetDraw.id || i,
            numbers: targetNums,
            predictedGrids: portfolio.map(p => p.center),

            // Grid Stats
            gridHits,
            gridNumbers,

            // Baseline Stats
            baselineHits,
            baselineNumbers,

            // Legacy support (to avoid breaking UI)
            hits: gridHits,
            coveredNumbers: gridNumbers.filter(n => targetSet.has(n)),
            totalPossible: targetNums.length
        });
    }

    // Calculate Summary Stats
    const totalGridHits = results.reduce((sum, r) => sum + r.gridHits, 0);
    const totalBaselineHits = results.reduce((sum, r) => sum + r.baselineHits, 0);

    return {
        summary: {
            simulationCount: results.length,
            avgHits: (totalGridHits / results.length).toFixed(1),
            avgBaselineHits: (totalBaselineHits / results.length).toFixed(1),

            successRate: (results.filter(r => r.gridHits >= 3).length / results.length * 100).toFixed(0),
            successRateBaseline: (results.filter(r => r.baselineHits >= 3).length / results.length * 100).toFixed(0),

            hits8Plus: (results.filter(r => r.gridHits >= 8).length / results.length * 100).toFixed(0),
            rawCount8Plus: results.filter(r => r.gridHits >= 8).length
        },
        draws: results
    };
}

export function getGridStatistics(history) {
    return {
        totalWeeks: history.length,
        optimalAvgCoverage: 5.1 // Placeholder or calculated
    };
}
