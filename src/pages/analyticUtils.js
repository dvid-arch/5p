/**
 * =================================================================
 * K-MEANS CLUSTERING IMPLEMENTATION
 * =================================================================
 * A straightforward implementation of the k-means algorithm.
 */

/**
 * Calculates the Euclidean distance between two points (arrays of numbers).
 */
const euclideanDistance = (a, b) => {
  return Math.sqrt(a.map((val, i) => val - b[i]).reduce((sum, diff) => sum + diff * diff, 0));
};

/**
 * Implements the k-means clustering algorithm.
 * @param {Array<Array<number>>} data - An array of data points, e.g., [[length, sum], [length, sum], ...]
 * @param {number} k - The number of clusters to find.
 * @returns {{assignments: Array<number>, centroids: Array<Array<number>>}}
 */
export function kmeans(data, k) {
  if (!data || data.length < k) {
    // Cannot compute if data is insufficient
    return { assignments: data.map(() => 0), centroids: [] };
  }

  // 1. Initialize centroids by picking k random points from the data
  let centroids = data.slice(0, k);

  let assignments = new Array(data.length);
  let changed = true;
  let maxIterations = 100;

  while (changed && maxIterations > 0) {
    changed = false;
    maxIterations--;

    // 2. Assignment step: Assign each point to the nearest centroid
    for (let i = 0; i < data.length; i++) {
      let minDistance = Infinity;
      let closestCentroidIndex = 0;
      for (let j = 0; j < k; j++) {
        const distance = euclideanDistance(data[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = j;
        }
      }
      if (assignments[i] !== closestCentroidIndex) {
        assignments[i] = closestCentroidIndex;
        changed = true;
      }
    }

    // 3. Update step: Recalculate centroids as the mean of assigned points
    const newCentroids = Array.from({ length: k }, () => []);
    const counts = new Array(k).fill(0);
    
    for (let i = 0; i < data.length; i++) {
        const clusterIndex = assignments[i];
        counts[clusterIndex]++;
        const point = data[i];
        if (newCentroids[clusterIndex].length === 0) {
            newCentroids[clusterIndex] = [...point];
        } else {
            for(let j = 0; j < point.length; j++) {
                newCentroids[clusterIndex][j] += point[j];
            }
        }
    }

    for (let j = 0; j < k; j++) {
        if(counts[j] > 0) {
            for(let d = 0; d < newCentroids[j].length; d++){
                newCentroids[j][d] /= counts[j];
            }
        } else {
            // Re-initialize centroid if it has no points
            newCentroids[j] = data[Math.floor(Math.random() * data.length)];
        }
    }
    centroids = newCentroids;
  }

  return { assignments, centroids };
}


/**
 * =================================================================
 * NETWORK ANALYSIS UTILITIES (for Force Graph)
 * =================================================================
 */

/**
 * Calculates the degree for each node (number of connections).
 * @param {number} nodeId - The ID of the node to calculate centrality for.
 * @param {Array<{source: number, target: number}>} links - The list of links in the network.
 * @returns {number} The degree of the node.
 */
export function calculateDegreeCentrality(nodeId, links) {
    return links.reduce((acc, link) => {
        return acc + (link.source.id === nodeId || link.target.id === nodeId ? 1 : 0);
    }, 0);
}

/**
 * Detects communities using a simple Connected Components algorithm.
 * Note: For production, a more robust algorithm like Louvain is recommended.
 * @param {Array<{id: number}>} nodes - The list of nodes.
 * @param {Array<{source: number, target: number}>} links - The list of links.
 * @returns {{communities: {[nodeId: number]: number}}} A map of node ID to community ID.
 */
export function detectCommunities(nodes, links) {
    const adj = new Map(nodes.map(n => [n.id, []]));
    links.forEach(l => {
        adj.get(l.source.id)?.push(l.target.id);
        adj.get(l.target.id)?.push(l.source.id);
    });

    const visited = new Set();
    const communities = {};
    let communityId = 0;

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            const stack = [node.id];
            visited.add(node.id);
            while (stack.length > 0) {
                const u = stack.pop();
                communities[u] = communityId;
                adj.get(u)?.forEach(v => {
                    if (!visited.has(v)) {
                        visited.add(v);
                        stack.push(v);
                    }
                });
            }
            communityId++;
        }
    }
    return { communities };
}