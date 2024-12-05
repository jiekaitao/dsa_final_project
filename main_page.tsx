
"use client";

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

const ForceGraph2D = dynamic(
  () => import('react-force-graph').then(mod => mod.ForceGraph2D),
  { ssr: false }
);

interface Link {
  source: string;
  target: string;
}

interface Node {
  id: string;
  name: string;
  val: number;
  color: string;
  x?: number;
  y?: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

// generating synthetic data
const generateSyntheticData = (): GraphData => {
  const links: Link[] = [];
  const nodes: Node[] = [];
  

  for (let i = 0; i < 100; i++) {
    nodes.push({
      id: `node${i}`,
      name: `Research Paper ${i}`,
      val: Math.random() * 5 + 1, // random node size
      color: '#ADD8E6', // Light blue color I don't want it too dark
    });
  }

  for (let i = 0; i < 200; i++) {
    const source = nodes[Math.floor(Math.random() * nodes.length)].id;
    const target = nodes[Math.floor(Math.random() * nodes.length)].id;
    if (source !== target) {
      links.push({ source, target }); //using edge list
    }
  }

  return { nodes, links };
};

const Page: React.FC = () => {
  const [data, setData] = useState<GraphData>(generateSyntheticData());
  const [hoverNode, setHoverNode] = useState<Node | null>(null); //tracks which node the user si hovering
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState(''); //search bar state initialized to empty
  const [suggestions, setSuggestions] = useState<Node[]>([]); //a vector of nodes that match match with serach
  const fgRef = useRef<any>();


  const searchNode = (nodeName: string) => {
    const matchedNode = data.nodes.find(node => node.name.toLowerCase() === nodeName.toLowerCase());

    if (matchedNode) {
      setSearchTerm(matchedNode.name);
      setSuggestions([]);
      setHighlightNodes(new Set([matchedNode.id]));

      if (fgRef.current) {
        fgRef.current.centerAt(matchedNode.x, matchedNode.y, 1000);
        fgRef.current.zoom(8, 2000);
      }
    } else {
      alert('No matching article found.');
    }
  };

  const handleNodeHover = (node: Node | null) => {
    setHoverNode(node);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length > 0) {
      const regex = new RegExp(term, 'i'); //made it case insensitive
      const matchedNodes = data.nodes.filter((node) => regex.test(node.name));

      setSuggestions(matchedNodes);

      const highlightSet = new Set(matchedNodes.map((node) => node.id));
      setHighlightNodes(highlightSet);
    } else {
      setSuggestions([]);
      setHighlightNodes(new Set());
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setHighlightNodes(new Set());
  };
  
  const handleSuggestionClick = (node: Node) => {
    searchNode(node.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim() !== '') {
        searchNode(searchTerm.trim());
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Research Visualization</h1>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Enter the name of an article or author"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.clearButton}
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              ✖
            </button>
          )}
          {suggestions.length > 0 && (
            <ul className={styles.suggestionsList}>
              {suggestions.map((node) => (
                <li
                  key={node.id}
                  onClick={() => handleSuggestionClick(node)}
                  className={styles.suggestionItem}
                >
                  {node.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeAutoColorBy="group"
        nodeVal="val"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1}
        onNodeHover={handleNodeHover}
        onNodeClick={(node: any) => handleSuggestionClick(node)}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (highlightNodes.has(node.id)) {
            ctx.fillStyle = 'yellow';
          } else {
            ctx.fillStyle = node.color;
          }

          const radius = node.val * 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fill();


          let borderColor = '#188ff0'; // Darker blue??? //#188ff0
          if (highlightNodes.has(node.id)) {
            borderColor = '#FFD700'; // Gold for highlighted nodes
          } else if (hoverNode === node) {
            borderColor = '#FF4500'; // OrangeRed when hovered?
          }

          //drawing it out
          ctx.lineWidth = hoverNode === node ? 3 : 1.5;
          ctx.strokeStyle = borderColor;
          ctx.stroke();

      
        }}
        linkColor={(link: any) => {
          if (
            highlightNodes.has(link.source.id) ||
            highlightNodes.has(link.target.id)
          ) {
            return 'orange';
          }
          return '#999';
        }}
        linkWidth={(link: any) => {
          if (
            highlightNodes.has(link.source.id) ||
            highlightNodes.has(link.target.id)
          ) {
            return 2;
          }
          return 1;
        }}
      />
    </div>
  );
};

export default Page;
