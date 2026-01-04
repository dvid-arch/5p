import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { GRID_SIZE } from "./PatternUtils"; // Assuming GRID_SIZE is defined elsewhere
import { kmeans } from './analyticUtils'; 
import { detectCommunities, calculateDegreeCentrality } from './analyticUtils';
import { useResponsiveContainer } from '../hooks/useResponsiveContainer.js';



// A reusable hook for creating a responsive SVG container
const useResponsiveSvg = (ref) => {
  useEffect(() => {
    const svg = d3.select(ref.current);
    const container = svg.node().parentElement;

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      svg.attr("viewBox", [0, 0, width, height]);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [ref]);
  
  return d3.select(ref.current);
};

/**
 * EnhancedHeatmap: A responsive, analytically-rich frequency heatmap.
 */

export function Heatmap({ freqMap, maxFreq }) {
  // 1. Get the ref and dimensions from our new hook
  const { ref: containerRef, width, height } = useResponsiveContainer();
  // 2. Create a separate ref for the SVG element itself
  const svgRef = useRef(null);

  useEffect(() => {
    // 3. Guard clause: Wait until we have data AND the container has valid dimensions.
    if (!freqMap || width === 0 || height === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous renders

    // Set SVG dimensions directly
    svg.attr('width', width).attr('height', height);

    // The rest of your D3 logic uses the width and height from the hook.
    // This code is now safe because it only runs when width and height are > 0.
    const margin = { top: 20, right: 80, bottom: 20, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // ... (All the rest of your D3 drawing logic from the previous answer)
    // ... (It remains exactly the same)

  }, [freqMap, maxFreq, width, height]); // Re-run the effect if data or dimensions change

  return (
    // 4. Attach the containerRef to a wrapper div. This is the element we measure.
    <div ref={containerRef} className="rounded-lg shadow-xl bg-slate-900 w-full h-full min-h-[400px]">
      {/* 5. Attach the svgRef to the SVG element. This is the element we draw on. */}
      <svg ref={svgRef} />
    </div>
  );
}


export function ClusteredScatterPlot({ sets }) {
  const ref = useRef(null);
  const svg = useResponsiveSvg(ref);

  useEffect(() => {
    if (!sets || sets.length === 0 || !svg) return;
    
    svg.selectAll("*").remove();

    // --- Sophisticated Analysis: K-Means Clustering ---
    const K = 3; // Example: find 3 clusters
    const { assignments, centroids } = kmeans(sets.map(d => [d.length, d.sum]), K);
    const clusteredData = sets.map((d, i) => ({ ...d, cluster: assignments[i] }));
    
    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // --- Scales ---
    const x = d3.scaleLinear()
      .domain([0, d3.max(sets, d => d.length) * 1.1])
      .range([0, chartWidth]);
    const y = d3.scaleLinear()
      .domain([0, d3.max(sets, d => d.sum) * 1.1])
      .range([chartHeight, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // --- Axes ---
    g.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(x)).attr("color", "#94a3b8");
    g.append("g").call(d3.axisLeft(y)).attr("color", "#94a3b8");
    
    g.append("text").attr("x", chartWidth / 2).attr("y", chartHeight + margin.bottom - 5).text("Set Length").attr("fill", "#e2e8f0").attr("text-anchor", "middle");
    g.append("text").attr("transform", "rotate(-90)").attr("x", -chartHeight / 2).attr("y", -margin.left + 15).text("Set Sum").attr("fill", "#e2e8f0").attr("text-anchor", "middle");

    // --- Tooltip ---
    const tooltip = d3.select("body").append("div").attr("class", "d3-tooltip").style("position", "absolute").style("z-index", "10").style("visibility", "hidden").style("background", "#334155").style("padding", "8px").style("border-radius", "4px").style("color", "#fff");

    // --- Render Points ---
    g.selectAll("circle.point")
      .data(clusteredData, d => d.id)
      .enter()
      .append("circle")
      .attr("class", "point")
      .attr("cx", d => x(d.length))
      .attr("cy", d => y(d.sum))
      .attr("r", 5)
      .attr("fill", d => color(d.cluster))
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).attr("r", 8).attr("opacity", 1);
          tooltip.style("visibility", "visible").html(`ID: <strong>${d.id}</strong><br/>Length: ${d.length}<br/>Sum: ${d.sum}<br/>Cluster: ${d.cluster}`);
      })
      .on("mousemove", (event) => tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px"))
      .on("mouseout", (event) => d3.select(event.currentTarget).attr("r", 5).attr("opacity", 0.7));

    // --- Render Cluster Centroids ---
    g.selectAll("path.centroid")
      .data(centroids)
      .enter()
      .append("path")
      .attr("class", "centroid")
      .attr("d", d3.symbol().type(d3.symbolCross).size(100))
      .attr("transform", d => `translate(${x(d[0])}, ${y(d[1])})`)
      .attr("fill", (d, i) => color(i))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

  }, [sets, svg]);

  return <svg ref={ref} className="rounded-lg shadow-xl bg-slate-900 w-full h-full min-h-[300px]"></svg>;
}


export function CommunityForceGraph({ sets }) {
  const ref = useRef(null);
  const svg = useResponsiveSvg(ref);
  
  useEffect(() => {
    if (!sets || sets.length === 0 || !svg) return;
    
    svg.selectAll("*").remove();

    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // --- Data Preparation: Nodes and Links ---
    const shapeMap = new Map();
    sets.forEach(s => {
      const key = s.shapeSig;
      if (!shapeMap.has(key)) shapeMap.set(key, { sig: key, ids: [], numbers: s.numbers });
      shapeMap.get(key).ids.push(s.id);
    });

    const nodes = Array.from(shapeMap.values()).map((d, i) => ({
      id: i,
      label: d.ids.join(","),
      sig: d.sig,
    }));
    
    // Create links based on overlap
    const links = [];
    // ... (link creation logic remains the same)

    // --- Sophisticated Analysis: Community Detection & Centrality ---
    const { communities } = detectCommunities(nodes, links);
    nodes.forEach(node => {
      node.community = communities[node.id];
      node.degree = calculateDegreeCentrality(node.id, links);
    });
    
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    const sizeScale = d3.scaleSqrt().domain(d3.extent(nodes, d => d.degree)).range([8, 25]);

    // --- D3 Force Simulation ---
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(60))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => sizeScale(d.degree) + 4));

    // --- Render Links and Nodes ---
    const link = svg.append("g").attr("stroke", "#475569").attr("stroke-opacity", 0.6).selectAll("line").data(links).join("line").attr("stroke-width", d => Math.sqrt(d.weight));
    const node = svg.append("g").selectAll("circle").data(nodes).join("circle").attr("r", d => sizeScale(d.degree)).attr("fill", d => color(d.community)).call(drag(simulation));

    const labels = svg.append("g").selectAll("text").data(nodes).join("text").text(d => d.label).attr("fill", "#f1f5f9").attr("font-size", 10).attr("text-anchor", "middle").attr("dy", d => sizeScale(d.degree) + 12);

    // --- Tooltip & Highlighting ---
    node
      .on("mouseover", (event, d) => {
        // Highlight logic
        link.attr("stroke-opacity", l => (l.source === d || l.target === d) ? 1 : 0.2);
        node.attr("opacity", n => (isNeighbor(d, n) || n === d) ? 1 : 0.3);
      })
      .on("mouseout", () => {
        link.attr("stroke-opacity", 0.6);
        node.attr("opacity", 1);
      });

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("cx", d => d.x).attr("cy", d => d.y);
      labels.attr("x", d => d.x).attr("y", d => d.y);
    });

    // Drag helper function
    function drag(simulation) { /* ... implementation ... */ }
    function isNeighbor(a, b) { /* ... implementation ... */ }

  }, [sets, svg]);

  return <svg ref={ref} className="rounded-lg shadow-xl bg-slate-900 w-full h-full min-h-[500px]"></svg>;
}