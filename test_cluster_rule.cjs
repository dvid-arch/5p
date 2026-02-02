const { checkCluster, findClusters } = require('./src/utils/clusterRule.cjs');

const tests = [
    {
        name: "Example 1: 9, 17, 18",
        draw: [9, 17, 18, 40, 41, 42], // Added some distant numbers
        expectedPredictions: [26, 35],
        expectedMid: 17
    },
    {
        name: "Example 2: 1, 8, 15",
        draw: [1, 8, 15, 30, 31],
        expectedPredictions: [9, 23],
        expectedMid: 8
    },
    {
        name: "Example 3: 3, 4, 5",
        draw: [3, 4, 5, 45, 46],
        expectedPredictions: [[12, 20], [7, 9]], // Based on prompt mentioning (12, 20 || 7, 9)
        expectedMid: 4
    },
    {
        name: "Example 4: Diagonal 7, 13, 19",
        draw: [7, 13, 19, 40, 41],
        expectedPredictions: [20, 32],
        expectedMid: 13
    },
    {
        name: "Example 5: Triangle Cluster 5, 6, 12",
        draw: [5, 6, 12, 30, 31],
        expectedPredictions: [11, 17],
        expectedMid: 5
    },
    {
        name: "Isolation Test: 9, 17, 18 but something touches them",
        draw: [9, 17, 18, 10], // 10 is next to 9
        expectedPredictions: null
    },
    {
        name: "Sequential Cluster 1, 2, 3",
        draw: [1, 2, 3, 40, 41],
        expectedPredictions: [[3, 5], [2, 6]], // Addition (3,5) and Multiplication (2,6)
        expectedMid: 2
    }
];

tests.forEach(t => {
    console.log(`Running: ${t.name}`);
    const clusterHits = findClusters(t.draw);

    if (t.expectedPredictions === null) {
        if (clusterHits.length === 0) {
            console.log("✅ Passed (Isolated correctly)");
        } else {
            console.log("❌ Failed (Should have been isolated)");
        }
        return;
    }

    // For 1,2,3 we expect TWO hits (addition and multiplication)
    const matches = clusterHits.filter(c => {
        const predStr = JSON.stringify(c.predictions);
        if (Array.isArray(t.expectedPredictions[0])) {
            return t.expectedPredictions.some(pool => JSON.stringify(pool) === predStr);
        }
        return JSON.stringify(t.expectedPredictions) === predStr;
    });

    if (matches.length > 0) {
        console.log(`✅ Passed. Found ${matches.length} matching interpretations.`);
        matches.forEach(m => console.log(`   - Mid: ${m.middle}, Type: ${m.type}, Preds: ${m.predictions}`));
    } else {
        console.log(`❌ Failed. Found: ${JSON.stringify(clusterHits)}`);
    }
});
