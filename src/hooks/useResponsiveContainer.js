import { useState, useRef, useEffect } from 'react';

/**
 * A custom hook that returns the dimensions of a container element
 * using a ResizeObserver. It's highly performant and resilient.
 * @returns {{ ref: React.RefObject, width: number, height: number }}
 */
export const useResponsiveContainer = () => {
  // A ref to attach to the container element we want to measure
  const ref = useRef(null);
  
  // State to hold the dimensions
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const containerNode = ref.current;
    
    // Guard clause: If the ref isn't attached yet, do nothing
    if (!containerNode) return;

    // Create a ResizeObserver to watch the container element
    const resizeObserver = new ResizeObserver(entries => {
      if (!entries || entries.length === 0) {
        return;
      }
      // Update the state with the new dimensions
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    // Start observing the container node
    resizeObserver.observe(containerNode);

    // Cleanup function to disconnect the observer when the component unmounts
    return () => {
      resizeObserver.disconnect();
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount

  return { ref, ...dimensions };
}