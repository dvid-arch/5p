/**
 * Triple Hit Prediction Engine
 * Generates and tracks triple hit predictions with chase windows
 */

const GRID_SIZE = 7;

/**
 * Detect inverse clusters (seed origins) from a draw
 */
export function detectInverseClusters(draw) {
    const results = [];
    const n = draw.length;

    const areAdj = (n1, n2) => {
        const r1 = Math.floor((n1 - 1) / GRID_SIZE);
        const c1 = (n1 - 1) % GRID_SIZE;
        const r2 = Math.floor((n2 - 1) / GRID_SIZE);
        const c2 = (n2 - 1) % GRID_SIZE;
        return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && (r1 !== r2 || c1 !== c2);
    };

    const areOrtho = (n1, n2) => {
        const r1 = Math.floor((n1 - 1) / GRID_SIZE);
        const c1 = (n1 - 1) % GRID_SIZE;
        const r2 = Math.floor((n2 - 1) / GRID_SIZE);
        const c2 = (n2 - 1) % GRID_SIZE;
        return (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1);
    };

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const A = draw[i];
            const B = draw[j];

            for (let M = 1; M <= 49; M++) {
                const configs = [
                    { type: 'addition', s1: A - M, s2: B - M },
                    { type: 'multiplication', s1: A % M === 0 ? A / M : -1, s2: B % M === 0 ? B / M : -1 }
                ];

                configs.forEach(cfg => {
                    const { s1, s2, type } = cfg;
                    if (s1 >= 1 && s1 <= 49 && s2 >= 1 && s2 <= 49 && s1 !== s2 && s1 !== M && s2 !== M) {
                        if (areAdj(M, s1) && areAdj(M, s2)) {
                            results.push({
                                pair: [A, B].sort((a, b) => a - b),
                                seed: [M, s1, s2].sort((a, b) => a - b),
                                middle: M,
                                type,
                                isOrtho: areOrtho(M, s1) && areOrtho(M, s2)
                            });
                        }
                    }
                });
            }
        }
    }

    const unique = [];
    results.forEach(res => {
        const key = `${res.pair.join(',')}-${res.seed.join(',')}`;
        if (!unique.some(u => `${u.pair.join(',')}-${u.seed.join(',')}` === key)) {
            unique.push(res);
        }
    });

    return unique;
}

/**
 * Build historical triple hit database
 * Returns Map of seed -> { tripleHits, avgWeeksToHit, grades, types }
 */
export function buildTripleHitDatabase(historicalData, getHubStats) {
    const seedsWithTriples = new Map();

    historicalData.forEach((draw, idx) => {
        const origins = detectInverseClusters(draw);

        origins.forEach(s => {
            const stats = getHubStats(s.type, s.middle);

            // Look for triple hits in future
            for (let fIdx = idx - 1; fIdx >= 0; fIdx--) {
                const futureDraw = historicalData[fIdx];
                if (!futureDraw) continue;

                const matches = s.seed.filter(n => futureDraw.includes(n));
                if (matches.length === 3) {
                    const weeks = idx - fIdx;
                    const key = s.seed.join('-');

                    if (!seedsWithTriples.has(key)) {
                        seedsWithTriples.set(key, {
                            seed: s.seed,
                            tripleHits: 0,
                            totalWeeks: 0,
                            grades: [],
                            types: [],
                            orthoCounts: 0
                        });
                    }

                    const data = seedsWithTriples.get(key);
                    data.tripleHits++;
                    data.totalWeeks += weeks;
                    data.grades.push(stats.grade);
                    data.types.push(s.type);
                    if (s.isOrtho) data.orthoCounts++;
                    break; // Only count first triple hit
                }
            }
        });
    });

    // Calculate averages
    seedsWithTriples.forEach((data, key) => {
        data.avgWeeksToHit = parseFloat((data.totalWeeks / data.tripleHits).toFixed(1));
        data.mostCommonGrade = data.grades.sort((a, b) =>
            data.grades.filter(v => v === a).length - data.grades.filter(v => v === b).length
        ).pop();
        data.orthoPercentage = parseFloat(((data.orthoCounts / data.tripleHits) * 100).toFixed(0));
    });

    return seedsWithTriples;
}


/**
 * Generate top 4 triple predictions for a specific week
 */
export function generateTriplePredictionsForWeek(weekIndex, historicalData, trioScoreMap, getHubStats, tripleHitDatabase) {
    // Legacy function preserved for compatibility or alternative strategies
    const draw = historicalData[weekIndex];
    if (!draw) return null;

    const origins = detectInverseClusters(draw);
    if (origins.length === 0) return null;

    const processed = origins.map(s => {
        const stats = getHubStats(s.type, s.middle);
        const seedKey = [...s.seed].sort((a, b) => a - b).join('-');
        const analysisScore = trioScoreMap.get(seedKey) || 0;

        let gradeScore = 1;
        if (stats.grade === "Elite Alpha") gradeScore = 4;
        else if (stats.grade === "Premium Beta") gradeScore = 3;
        else if (stats.grade === "Standard Gamma") gradeScore = 2;

        // Get historical triple hit data
        const history = tripleHitDatabase.get(seedKey);
        // Note: We might want some history, but the user wants to "study combinations"
        // so we'll allow all clusters but score them.

        const predictionScore = analysisScore + (history?.tripleHits || 0 * 10) + (gradeScore * 5);

        return {
            seed: s.seed,
            pair: s.pair,
            middle: s.middle,
            type: s.type,
            isOrtho: s.isOrtho,
            grade: stats.grade,
            historicalTripleHits: history?.tripleHits || 0,
            avgWeeksToTripleHit: history?.avgWeeksToHit || 50,
            predictionScore
        };
    });

    processed.sort((a, b) => b.predictionScore - a.predictionScore);
    const seenSeeds = new Set();
    const unique = processed.filter(p => {
        const key = p.seed.join('-');
        if (seenSeeds.has(key)) return false;
        seenSeeds.add(key);
        return true;
    });

    return unique.slice(0, 4);
}

/**
 * Track predictions over chase window
 * Returns outcome object with success status and details
 */
export function trackTriplePredictions(predictions, weekIndex, historicalData, chaseWindow = 10) {
    if (!predictions || predictions.length === 0) {
        return { success: false, reason: 'No predictions' };
    }

    const allResults = [];
    let firstHit = null;

    // Check each prediction
    predictions.forEach(pred => {
        let hit = false;
        let hitWeek = null;
        let weeksToHit = null;

        // Look in future draws within chase window
        for (let offset = 1; offset <= chaseWindow; offset++) {
            const futureIdx = weekIndex - offset;
            if (futureIdx < 0) break; // No more future data

            const futureDraw = historicalData[futureIdx];
            if (!futureDraw) break;

            // Check if all 3 numbers from seed appear
            const matches = pred.seed.filter(n => futureDraw.includes(n));
            if (matches.length === 3) {
                hit = true;
                hitWeek = futureIdx + 1; // Convert to week number
                weeksToHit = offset;

                if (!firstHit) {
                    firstHit = {
                        seed: pred.seed,
                        hitWeek,
                        weeksToHit
                    };
                }
                break;
            }
        }

        allResults.push({
            seed: pred.seed,
            hit,
            hitWeek,
            weeksToHit
        });
    });

    const success = allResults.some(r => r.hit);

    return {
        success,
        hitWeek: firstHit?.hitWeek || null,
        weeksToHit: firstHit?.weeksToHit || null,
        winningTriple: firstHit?.seed || null,
        allResults
    };
}

/**
 * Generate predictions for all weeks
 */
export function generateAllWeekPredictions(historicalData, trioScoreMap, getHubStats, chaseWindow = 10) {
    const weekPredictions = {};
    let totalPredictions = 0;
    let successfulChases = 0;
    let totalWeeksToSuccess = 0;

    console.log(`\nGenerating predictions for all weeks (Strategy: Legacy Origins)...`);

    console.log('Building triple hit database for legacy strategy...');
    const tripleHitDatabase = buildTripleHitDatabase(historicalData, getHubStats);

    historicalData.forEach((draw, idx) => {
        const weekNumber = idx + 1;

        // Generate predictions using the legacy strategy
        const predictions = generateTriplePredictionsForWeek(idx, historicalData, trioScoreMap, getHubStats, tripleHitDatabase);

        if (!predictions || predictions.length === 0) return;

        // Track outcome over the 10-week chase window
        const outcome = trackTriplePredictions(predictions, idx, historicalData, chaseWindow);

        weekPredictions[weekNumber] = {
            weekNumber,
            originWeek: weekNumber,
            draw,
            predictions,
            chaseWindow,
            outcome
        };

        totalPredictions++;
        if (outcome.success) {
            successfulChases++;
            totalWeeksToSuccess += outcome.weeksToHit;
        }
    });

    const successRate = totalPredictions > 0 ? ((successfulChases / totalPredictions) * 100).toFixed(1) : 0;
    const avgWeeksToSuccess = successfulChases > 0
        ? (totalWeeksToSuccess / successfulChases).toFixed(1)
        : 0;

    return {
        weekPredictions,
        stats: {
            totalWeeks: historicalData.length,
            totalPredictions,
            successfulChases,
            failedChases: totalPredictions - successfulChases,
            successRate: parseFloat(successRate),
            avgWeeksToSuccess: parseFloat(avgWeeksToSuccess),
            chaseWindow,
            strategy: 'Legacy Origins'
        }
    };
}
