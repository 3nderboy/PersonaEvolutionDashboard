// Helper for Point Generation
const generateClusterPoints = (count, baseCoords, spread, clusterId) => {
    const points = [];
    const baseX = parseFloat(baseCoords.x.replace('%', ''));
    const baseY = parseFloat(baseCoords.y.replace('%', ''));
    
    // Y-axis is inverted in Tailwind/CSS (0% is top), so invert base Y for calculation
    const effectiveBaseY = 100 - baseY;

    for (let i = 0; i < count; i++) {
        // Generate random offset within the spread
        const offsetX = (Math.random() - 0.5) * spread; 
        const offsetY = (Math.random() - 0.5) * spread; 
        
        // Calculate new position, ensuring it stays within boundaries (0-100)
        let newX = Math.min(100, Math.max(0, baseX + offsetX));
        let newY = Math.min(100, Math.max(0, effectiveBaseY + offsetY));
        
        points.push({
            id: `${clusterId}-${i}`,
            clusterId,
            x: `${newX}%`,
            // Revert Y back to the CSS coordinate system (0% is top)
            y: `${100 - newY}%`, 
        });
    }
    return points;
};

// Cluster Coordinates for Chart Simulation
export const CLUSTER_COORDS = {
  // Coordinates (x, y) from 0% (left/bottom) to 100% (right/top)
  "C1": { x: "25%", y: "80%", color: "bg-sky-500", dotColor: "bg-sky-500/50", labelPos: "top-left" },
  "C2": { x: "75%", y: "20%", color: "bg-orange-500", dotColor: "bg-orange-500/50", labelPos: "bottom-right" },
  "C1'": { x: "10%", y: "90%", color: "bg-sky-500", dotColor: "bg-sky-500/50", labelPos: "top-left" },
  "C2'": { x: "55%", y: "60%", color: "bg-green-500", dotColor: "bg-green-500/50", labelPos: "bottom-left" },
  "C3'": { x: "85%", y: "10%", color: "bg-rose-500", dotColor: "bg-rose-500/50", labelPos: "top-right" },
};

// Simulated Data Points for Visualization
export const SIMULATED_DATA_POINTS = {
    "2025-01": [
        ...generateClusterPoints(2, CLUSTER_COORDS["C1"], 15, "C1"),
        ...generateClusterPoints(3, CLUSTER_COORDS["C2"], 20, "C2"),
    ],
    "2025-07": [
        ...generateClusterPoints(2, CLUSTER_COORDS["C1'"], 10, "C1'"),
        ...generateClusterPoints(2, CLUSTER_COORDS["C2'"], 15, "C2'"),
        ...generateClusterPoints(1, CLUSTER_COORDS["C3'"], 18, "C3'"),
    ]
};

// Demo Data
export const CLUSTERS_BY_TIME = {
  "2025-01": [
    {
      id: "C1",
      label: "Young Active Learners",
      size: 2,
      avgRating: 4.5,
      avgSessionsPerWeek: 4,
    },
    {
      id: "C2",
      label: "Older / Struggling Users",
      size: 3,
      avgRating: 3.0,
      avgSessionsPerWeek: 1,
    },
  ],
  "2025-07": [
    {
      id: "C1'",
      label: "Young Power Users",
      size: 2,
      avgRating: 4.7,
      avgSessionsPerWeek: 3,
    },
    {
      id: "C2'",
      label: "Older Confident Users",
      size: 2,
      avgRating: 4.5,
      avgSessionsPerWeek: 3,
    },
    {
      id: "C3'",
      label: "Disengaging Traditionalists",
      size: 1,
      avgRating: 2.0,
      avgSessionsPerWeek: 0.5,
    },
  ],
};

// Personas
export const PERSONAS = [
  {
    id: "A",
    name: "Lena, the Young Driven Learner",
    description:
      "Young, career-focused learner who uses the platform frequently and appreciates quick, focused content.",
    status: "stable",
    timeWindows: ["2025-01", "2025-07"],
    representativeClusterIds: ["C1", "C1'"],
  },
  {
    id: "B1",
    name: "Hans, now Confident After Redesign",
    description:
      "Older user who was initially confused but now feels comfortable after accessibility improvements.",
    status: "drifting",
    timeWindows: ["2025-01", "2025-07"],
    representativeClusterIds: ["C2", "C2'"],
  },
  {
    id: "B2",
    name: "Marta, the Disappointed Traditionalist",
    description:
      "Previously moderate user now disengaging and unhappy with the new layout.",
    status: "split",
    timeWindows: ["2025-07"],
    // 0/null for time windows where the cluster/persona does not exist
    representativeClusterIds: [null, "C3'"], 
  },
];