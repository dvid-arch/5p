/**
 * Grid ML Training Functions
 * Feature extraction for client-side ML
 */

import { findOptimalGridCenters } from './gridPredictor.js';
import { truestdata } from '../constant/data.js';

/**
 * Calculate 20+ features from lottery numbers
 */
export function calculateDrawFeatures(numbers) {
    if (!numbers || numbers.length === 0) return {};

    const count = numbers.length;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const sorted = [...numbers].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[count - 1];
    const range = max - min;

    // Quadrants/Distribution
    let odd = 0, low = 0, mid = 0;
    sorted.forEach(n => {
        if (n % 2 !== 0) odd++;
        if (n <= 24) low++;
        if (n >= 13 && n <= 36) mid++;
    });

    // Gaps
    let maxGap = 0, sumGap = 0;
    for (let i = 1; i < count; i++) {
        const g = sorted[i] - sorted[i - 1];
        if (g > maxGap) maxGap = g;
        sumGap += g;
    }
    const avgGap = sumGap / (count - 1);

    return {
        average: avg.toFixed(1),
        sum,
        min,
        max,
        range,
        oddCount: odd,
        evenCount: count - odd,
        lowCount: low,
        highCount: count - low,
        midCount: mid, // Zone 13-36
        avgGap: avgGap.toFixed(1),
        maxGap
    };
}

/**
 * Generate training data for TensorFlow.js / JSON export
 */
export function generateTrainingData() {
    // 80/20 Split
    const splitIdx = Math.floor(truestdata.length * 0.8);
    const trainingRaw = truestdata.slice(0, splitIdx);
    const testRaw = truestdata.slice(splitIdx);

    const process = (draws) => draws.map(d => {
        const nums = Array.isArray(d) ? d : (d.numbers || d.value || []);
        const features = calculateDrawFeatures(nums);
        const best = findOptimalGridCenters(nums, 1)[0];

        return {
            features: Object.values(features).map(Number), // Vector for ML
            label: best ? best.center : 0,
            meta: features // Human readable
        };
    });

    return {
        trainingData: process(trainingRaw),
        testData: process(testRaw),
        featureNames: [
            'average', 'sum', 'min', 'max', 'range',
            'oddCount', 'evenCount', 'lowCount', 'highCount',
            'midCount', 'avgGap', 'maxGap'
        ]
    };
}

export function exportForMachineLearning() {
    const data = generateTrainingData();
    return {
        metadata: {
            description: "Grid Predictor Training Data",
            generated: new Date().toISOString(),
            features: data.featureNames
        },
        training: data.trainingData,
        test: data.testData
    };
}
