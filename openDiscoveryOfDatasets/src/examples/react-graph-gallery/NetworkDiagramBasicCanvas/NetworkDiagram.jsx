import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { RADIUS, drawNetwork } from './drawNetwork';
// import { Data, Link, Node } from './data';
import React from 'react';



export default function NetworkDiagram ({
  width,
  height,
  data,
}) {


  // The force simulation mutates links and nodes, so create a copy first
  // Node positions are initialized by d3
  const links= data.links.map((d) => ({ ...d }));
  const nodes= data.nodes.map((d) => ({ ...d }));

  const canvasRef = useRef(null);

  useEffect(() => {
    // set dimension of the canvas element
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!context) {
      return;
    }

    // run d3-force to find the position of nodes on the canvas
    d3.forceSimulation(nodes)

      // list of forces we apply to get node positions
      .force(
        'link',
        d3.forceLink(links).id((d) => d.id) // Force #1: links between nodes
      )
      .force('collide', d3.forceCollide().radius(RADIUS)) // Force #2: avoid node overlaps
      .force('charge', d3.forceManyBody()) // Force #3: attraction or repulsion between nodes
      .force('center', d3.forceCenter(width / 2, height / 2)) // Force #4: nodes are attracted by the center of the chart area

      // at each iteration of the simulation, draw the network diagram with the new node positions
      .on('tick', () => {
        drawNetwork(context, width, height, nodes, links);
      });
  }, [width, height, nodes, links]);

  return (
    <div>
      (termInfo.term)?(
        <canvas
          ref={canvasRef}
          style={{
            width,
            height,
          }}
          width={width}
          height={height}
        />
      )
    </div>
  );
};
