
export const HUB_REGISTRY = {
    "addition-7": { grade: "Elite Alpha", winRate: "100.0%", roi: "108.5%", label: "Absolute Anchor" },
    "addition-13": { grade: "Elite Alpha", winRate: "100.0%", roi: "-74.0%", label: "High Frequency" },
    "addition-3": { grade: "Elite Alpha", winRate: "75.0%", roi: "45.0%", label: "Early Capture" },
    "addition-12": { grade: "Elite Alpha", winRate: "100.0%", roi: "-78.1%", label: "Institutional" },
    "addition-10": { grade: "Elite Alpha", winRate: "100.0%", roi: "-84.8%", label: "Steady Flow" },
    "multiplication-11": { grade: "Elite Alpha", winRate: "100.0%", roi: "-30.0%", label: "Power Multiplier" },
    "multiplication-3": { grade: "Premium Beta", winRate: "83.3%", roi: "-97.9%", label: "Strategic Play" },
    "addition-21": { grade: "Premium Beta", winRate: "80.0%", roi: "-94.1%", label: "Mid-Grid Alpha" },
    "addition-20": { grade: "Premium Beta", winRate: "85.7%", roi: "-87.4%", label: "Core Cluster" },
    "addition-18": { grade: "Premium Beta", winRate: "80.0%", roi: "-38.0%", label: "Resilience Seed" },
    "addition-23": { grade: "Standard Gamma", winRate: "66.7%", roi: "254.3%", label: "High Reward" },
};

export const getHubStats = (type, mid) => {
    return HUB_REGISTRY[`${type}-${mid}`] || { grade: "Standard", winRate: "N/A", roi: "N/A", label: "Speculative" };
};
