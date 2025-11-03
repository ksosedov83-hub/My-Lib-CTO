"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Book, Connection, ConnectionType } from "@/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface GraphNode {
  id: string;
  name: string;
  author: string;
  year?: number;
  themes: string[];
  color: string;
  val: number;
  book: Book;
}

interface GraphLink {
  source: string;
  target: string;
  type: ConnectionType;
  strength: number;
  label?: string;
  color: string;
  width: number;
  connection: Connection;
}

interface LibraryGraphProps {
  onNodeClick?: (book: Book) => void;
  onNodeHover?: (book: Book | null) => void;
  selectedBookId?: string | null;
  highlightedBookIds?: string[];
  className?: string;
}

const CONNECTION_COLORS: Record<ConnectionType, string> = {
  influences: "#7c3aed",
  references: "#3b82f6",
  contradicts: "#ec4899",
  expands: "#06b6d4",
  "similar-theme": "#a855f7",
  chronological: "#f59e0b",
  "author-connection": "#10b981",
  custom: "#6b7280",
};

export default function LibraryGraph({
  onNodeClick,
  onNodeHover,
  selectedBookId,
  highlightedBookIds = [],
  className = "",
}: LibraryGraphProps) {
  const books = useLibraryStore((state) => state.books);
  const connections = useLibraryStore((state) => state.connections);
  const themes = useLibraryStore((state) => state.themes);
  const getTheme = useLibraryStore((state) => state.getTheme);

  const graphRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());

  const getBookColor = useCallback(
    (book: Book): string => {
      if (book.themes.length === 0) return "#6b7280";
      const primaryThemeName = book.themes[0];
      const theme = themes.find((t) => t.name === primaryThemeName);
      return theme?.color || "#7c3aed";
    },
    [themes]
  );

  const graphData = useMemo(() => {
    const nodes: GraphNode[] = books.map((book) => {
      const connectionCount = connections.filter(
        (c) => c.sourceId === book.id || c.targetId === book.id
      ).length;
      return {
        id: book.id,
        name: book.title,
        author: book.author,
        year: book.year,
        themes: book.themes,
        color: getBookColor(book),
        val: Math.max(3, connectionCount * 2),
        book,
      };
    });

    const links: GraphLink[] = connections.map((conn) => ({
      source: conn.sourceId,
      target: conn.targetId,
      type: conn.type,
      strength: conn.strength,
      label: conn.label,
      color: CONNECTION_COLORS[conn.type],
      width: Math.max(1, conn.strength * 3),
      connection: conn,
    }));

    return { nodes, links };
  }, [books, connections, getBookColor]);

  const handleNodeHover = useCallback(
    (node: GraphNode | null) => {
      setHoveredNode(node);
      if (onNodeHover) {
        onNodeHover(node?.book || null);
      }

      if (!node) {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        return;
      }

      const neighbors = new Set<string>();
      const linkIds = new Set<string>();

      graphData.links.forEach((link) => {
        if (link.source === node.id || (link.source as any).id === node.id) {
          const targetId = typeof link.target === "string" ? link.target : (link.target as any).id;
          neighbors.add(targetId);
          linkIds.add(`${link.source}-${link.target}`);
        }
        if (link.target === node.id || (link.target as any).id === node.id) {
          const sourceId = typeof link.source === "string" ? link.source : (link.source as any).id;
          neighbors.add(sourceId);
          linkIds.add(`${link.source}-${link.target}`);
        }
      });

      neighbors.add(node.id);
      setHighlightNodes(neighbors);
      setHighlightLinks(linkIds);
    },
    [graphData.links, onNodeHover]
  );

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (onNodeClick) {
        onNodeClick(node.book);
      }
    },
    [onNodeClick]
  );

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge")?.strength(-300);
      graphRef.current.d3Force("link")?.distance(100);
      graphRef.current.d3Force("center")?.strength(0.1);

      graphRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isHighlighted =
        highlightNodes.size === 0 ||
        highlightNodes.has(node.id) ||
        highlightedBookIds.includes(node.id);
      const isSelected = selectedBookId === node.id;
      const isHovered = hoveredNode?.id === node.id;

      const size = node.val || 5;
      const opacity = isHighlighted ? 1 : 0.3;

      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? "rgba(124, 58, 237, 0.3)" : "rgba(59, 130, 246, 0.3)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI);
        ctx.fillStyle = isSelected ? "rgba(124, 58, 237, 0.5)" : "rgba(59, 130, 246, 0.5)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.globalAlpha = opacity;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = isSelected ? "#7c3aed" : isHovered ? "#3b82f6" : "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = isSelected || isHovered ? 2 : 1;
      ctx.stroke();

      if (globalScale > 1.5 || isHovered || isSelected) {
        const label = node.name;
        const fontSize = Math.max(10, 12 / globalScale);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const textY = node.y + size + 4;

        ctx.fillStyle = "rgba(10, 1, 24, 0.8)";
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(node.x - textWidth / 2 - 4, textY - 2, textWidth + 8, fontSize + 4);

        ctx.fillStyle = isHighlighted ? "#e0e7ff" : "#a5b4fc";
        ctx.fillText(label, node.x, textY);
      }
    },
    [highlightNodes, highlightedBookIds, selectedBookId, hoveredNode]
  );

  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const linkId = `${link.source.id}-${link.target.id}`;
      const isHighlighted = highlightLinks.size === 0 || highlightLinks.has(linkId);

      const start = link.source;
      const end = link.target;

      ctx.save();
      ctx.globalAlpha = isHighlighted ? 0.6 : 0.15;
      ctx.strokeStyle = link.color;
      ctx.lineWidth = link.width || 1;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      if (isHighlighted && highlightLinks.size > 0 && link.label) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textWidth = ctx.measureText(link.label).width;
        ctx.fillStyle = "rgba(10, 1, 24, 0.9)";
        ctx.fillRect(midX - textWidth / 2 - 3, midY - 7, textWidth + 6, 14);

        ctx.fillStyle = "#e0e7ff";
        ctx.fillText(link.label, midX, midY);
      }

      ctx.restore();
    },
    [highlightLinks]
  );

  const nodeLabel = useCallback((node: any) => {
    const book = node.book as Book;
    return `
      <div style="
        background: rgba(10, 1, 24, 0.95);
        border: 1px solid rgba(124, 58, 237, 0.5);
        border-radius: 8px;
        padding: 12px;
        color: #e0e7ff;
        font-family: Inter, sans-serif;
        font-size: 14px;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      ">
        <div style="font-weight: 600; margin-bottom: 4px; color: #c4b5fd;">${book.title}</div>
        <div style="font-size: 12px; color: #a5b4fc; margin-bottom: 4px;">by ${book.author}</div>
        ${book.year ? `<div style="font-size: 11px; color: #818cf8; margin-bottom: 6px;">${book.year}</div>` : ""}
        ${book.themes.length > 0 ? `<div style="font-size: 11px; color: #6366f1; margin-top: 6px;">Themes: ${book.themes.join(", ")}</div>` : ""}
      </div>
    `;
  }, []);

  const handleEngineStop = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, []);

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-xl ${className}`}
      role="img"
      aria-label="Interactive library knowledge graph showing books and their connections"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={nodeLabel}
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObject={linkCanvasObject}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDrag={handleNodeHover}
        onNodeDragEnd={handleNodeHover}
        onEngineStop={handleEngineStop}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTime={3000}
        warmupTicks={100}
        backgroundColor="rgba(0, 0, 0, 0)"
        linkDirectionalParticles={0}
        linkDirectionalParticleWidth={0}
        d3VelocityDecay={0.3}
        nodeRelSize={1}
      />

      {hoveredNode && (
        <div
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gradient-to-br from-purple-900/80 to-blue-900/80 backdrop-blur-xl border border-purple-500/30 rounded-lg p-4 shadow-2xl"
          role="status"
          aria-live="polite"
        >
          <h3 className="text-lg font-semibold text-purple-100 mb-1">{hoveredNode.name}</h3>
          <p className="text-sm text-purple-200 mb-2">by {hoveredNode.author}</p>
          {hoveredNode.year && (
            <p className="text-xs text-purple-300 mb-2">Published: {hoveredNode.year}</p>
          )}
          {hoveredNode.themes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hoveredNode.themes.map((theme) => {
                const themeObj = themes.find((t) => t.name === theme);
                return (
                  <span
                    key={theme}
                    className="text-xs px-2 py-1 rounded-full border"
                    style={{
                      backgroundColor: themeObj?.color
                        ? `${themeObj.color}20`
                        : "rgba(124, 58, 237, 0.2)",
                      borderColor: themeObj?.color
                        ? `${themeObj.color}60`
                        : "rgba(124, 58, 237, 0.6)",
                      color: "#e0e7ff",
                    }}
                  >
                    {theme}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
