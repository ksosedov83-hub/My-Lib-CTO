"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Book, Connection, ConnectionType } from "@/types";
import * as THREE from "three";
import { Maximize2, Minimize2 } from "lucide-react";

const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
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
  x?: number;
  y?: number;
  z?: number;
  __threeObj?: THREE.Object3D;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: ConnectionType;
  strength: number;
  label?: string;
  color: string;
  width: number;
  connection: Connection;
  __lineObj?: THREE.Object3D;
}

interface LibraryGraphProps {
  onNodeClick?: (book: Book) => void;
  onNodeHover?: (book: Book | null) => void;
  selectedBookId?: string | null;
  highlightedBookIds?: string[];
  selectedThemes?: string[];
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
  highlightedBookIds: _highlightedBookIds = [],
  selectedThemes = [],
  className = "",
}: LibraryGraphProps) {
  const books = useLibraryStore((state) => state.books);
  const connections = useLibraryStore((state) => state.connections);
  const themes = useLibraryStore((state) => state.themes);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const bookMatchesFilter = useCallback(
    (book: Book): boolean => {
      if (selectedThemes.length === 0) return true;
      return book.themes.some((theme) => selectedThemes.includes(theme));
    },
    [selectedThemes]
  );

  const getFilteredThemeCount = useCallback(
    (book: Book): number => {
      if (selectedThemes.length === 0) return 0;
      return book.themes.filter((theme) => selectedThemes.includes(theme)).length;
    },
    [selectedThemes]
  );

  const getBookColor = useCallback(
    (book: Book): string => {
      if (book.themes.length === 0) return "#6b7280";

      if (selectedThemes.length > 0) {
        const matchingThemes = book.themes.filter((themeName) =>
          selectedThemes.includes(themeName)
        );
        if (matchingThemes.length > 0) {
          const themeColors = matchingThemes
            .map((themeName) => themes.find((t) => t.name === themeName)?.color)
            .filter((color): color is string => color !== undefined);

          if (themeColors.length >= 1) {
            return themeColors[0];
          }
        }
      }

      const primaryThemeName = book.themes[0];
      const theme = themes.find((t) => t.name === primaryThemeName);
      return theme?.color || "#7c3aed";
    },
    [themes, selectedThemes]
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
        val: Math.max(5, connectionCount * 3),
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
      width: Math.max(0.5, conn.strength * 1.5),
      connection: conn,
    }));

    return { nodes, links };
  }, [books, connections, getBookColor]);

  // Create beautiful 3D node with gradient material and glow
  const createNodeObject = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      const graphNode = node as GraphNode;
      const group = new THREE.Group();

      const matchesFilter = bookMatchesFilter(graphNode.book);
      const filteredThemeCount = getFilteredThemeCount(graphNode.book);
      const isSelected = selectedBookId === graphNode.id;
      const isHovered = hoveredNode?.id === graphNode.id;

      const size = graphNode.val / 2 || 3;
      const color = new THREE.Color(graphNode.color);

      let opacity = highlightNodes.size === 0 || highlightNodes.has(graphNode.id) ? 1 : 0.3;
      if (selectedThemes.length > 0) {
        opacity = matchesFilter ? 1 : 0.2;
      }

      // Main sphere with gradient material
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        shininess: 100,
        transparent: true,
        opacity: opacity,
      });
      const sphere = new THREE.Mesh(geometry, material);

      // Add pulsing animation
      const userData = {
        pulsePhase: Math.random() * Math.PI * 2,
        baseSize: size,
        baseOpacity: opacity,
        color: graphNode.color,
      };
      sphere.userData = userData;

      group.add(sphere);

      // Glowing halo
      const haloSize = size * (isSelected ? 2.5 : isHovered ? 2.2 : 1.8);
      const haloGeometry = new THREE.SphereGeometry(haloSize, 16, 16);
      const haloMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: (isSelected || isHovered ? 0.3 : 0.15) * opacity,
        side: THREE.BackSide,
      });
      const halo = new THREE.Mesh(haloGeometry, haloMaterial);
      group.add(halo);

      // Selection/hover ring
      if (isSelected || isHovered) {
        const ringGeometry = new THREE.TorusGeometry(size * 1.5, 0.3, 16, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: isSelected ? "#7c3aed" : "#3b82f6",
          transparent: true,
          opacity: 0.8,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }

      // Badge for multiple filtered themes
      if (filteredThemeCount > 1 && matchesFilter) {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#7c3aed";
          ctx.beginPath();
          ctx.arc(32, 32, 30, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 32px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(filteredThemeCount.toString(), 32, 32);
        }

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(size * 0.8, size * 0.8, 1);
        sprite.position.set(size * 0.8, size * 0.8, 0);
        group.add(sprite);
      }

      return group;
    },
    [
      bookMatchesFilter,
      getFilteredThemeCount,
      selectedBookId,
      hoveredNode,
      highlightNodes,
      selectedThemes,
    ]
  );

  // Create curved edge with particles
  const createLinkObject = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (link: any) => {
      const graphLink = link as GraphLink;
      const sourceNode = graphLink.source as GraphNode;
      const targetNode = graphLink.target as GraphNode;

      if (!sourceNode || !targetNode) return new THREE.Group();

      const linkId = `${sourceNode.id}-${targetNode.id}`;
      const isHighlighted = highlightLinks.size === 0 || highlightLinks.has(linkId);

      const sourceMatches = bookMatchesFilter(sourceNode.book);
      const targetMatches = bookMatchesFilter(targetNode.book);
      const bothMatch = sourceMatches && targetMatches;

      let linkAlpha = isHighlighted ? 0.6 : 0.15;
      if (selectedThemes.length > 0) {
        linkAlpha = bothMatch ? 0.6 : 0.1;
      }

      const start = new THREE.Vector3(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0);
      const end = new THREE.Vector3(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0);

      // Create curved line using quadratic bezier
      const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
      const distance = start.distanceTo(end);
      const offset = distance * 0.2;

      // Offset perpendicular to the line
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const perpendicular = new THREE.Vector3(
        -direction.y,
        direction.x,
        direction.z * 0.5
      ).normalize();
      midPoint.add(perpendicular.multiplyScalar(offset));

      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const color = new THREE.Color(graphLink.color);
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: linkAlpha,
        linewidth: graphLink.width,
      });

      const line = new THREE.Line(geometry, material);

      const group = new THREE.Group();
      group.add(line);

      // Animated particles along the edge
      if (isHighlighted && highlightLinks.size > 0) {
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
          const particleGeometry = new THREE.SphereGeometry(0.5, 8, 8);
          const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
          });
          const particle = new THREE.Mesh(particleGeometry, particleMaterial);

          const t = i / particleCount;
          const pos = curve.getPoint(t);
          particle.position.copy(pos);

          particle.userData = {
            curve: curve,
            offset: t,
            speed: 0.01,
          };

          group.add(particle);
        }
      }

      return group;
    },
    [highlightLinks, selectedThemes, bookMatchesFilter]
  );

  // Animation loop for pulsing nodes, particle movement, and cosmic effects
  useEffect(() => {
    const animate = () => {
      const time = Date.now() * 0.001;

      if (graphRef.current) {
        const scene = graphRef.current.scene();
        if (scene) {
          scene.traverse((object: THREE.Object3D) => {
            // Animate node pulsing
            if (object.userData?.pulsePhase !== undefined) {
              const pulse = Math.sin(time * 2 + object.userData.pulsePhase) * 0.1 + 1;
              object.scale.set(pulse, pulse, pulse);

              // Breathing glow
              const material = (object as THREE.Mesh).material as THREE.MeshPhongMaterial;
              if (material.emissiveIntensity !== undefined) {
                material.emissiveIntensity =
                  0.2 + Math.sin(time * 2 + object.userData.pulsePhase) * 0.15;
              }
            }

            // Animate particles along edges
            if (object.userData?.curve) {
              object.userData.offset = (object.userData.offset + object.userData.speed) % 1;
              const pos = object.userData.curve.getPoint(object.userData.offset);
              object.position.copy(pos);
            }

            // Rotate starfield slowly
            if (object.name === "starfield") {
              object.rotation.y = time * 0.02;
            }

            // Animate nebula with breathing effect
            if (object.name === "nebula") {
              object.rotation.y = time * 0.01;
              object.rotation.x = time * 0.005;
              const material = (object as THREE.Points).material as THREE.PointsMaterial;
              if (material.opacity !== undefined) {
                material.opacity = 0.1 + Math.sin(time * 0.5) * 0.05;
              }
            }
          });

          // Animate point lights
          const lights = scene.children.filter(
            (child: THREE.Object3D) => child instanceof THREE.PointLight
          );
          lights.forEach((light: THREE.Object3D, index: number) => {
            const pointLight = light as THREE.PointLight;
            pointLight.intensity = (index === 0 ? 0.8 : 0.6) + Math.sin(time * 1.5 + index) * 0.2;
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleNodeHover = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      const graphNode = node as GraphNode | null;
      setHoveredNode(graphNode);
      if (onNodeHover) {
        onNodeHover(graphNode?.book || null);
      }

      if (!graphNode) {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        return;
      }

      const neighbors = new Set<string>();
      const linkIds = new Set<string>();

      graphData.links.forEach((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;

        if (sourceId === graphNode.id) {
          neighbors.add(targetId);
          linkIds.add(`${sourceId}-${targetId}`);
        }
        if (targetId === graphNode.id) {
          neighbors.add(sourceId);
          linkIds.add(`${sourceId}-${targetId}`);
        }
      });

      neighbors.add(graphNode.id);
      setHighlightNodes(neighbors);
      setHighlightLinks(linkIds);
    },
    [graphData.links, onNodeHover]
  );

  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      const graphNode = node as GraphNode;
      if (onNodeClick) {
        onNodeClick(graphNode.book);
      }

      // Smooth camera transition to node
      if (
        graphRef.current &&
        graphNode.x !== undefined &&
        graphNode.y !== undefined &&
        graphNode.z !== undefined
      ) {
        const distance = 300;
        graphRef.current.cameraPosition(
          { x: graphNode.x, y: graphNode.y, z: graphNode.z + distance },
          graphNode,
          1000
        );
      }
    },
    [onNodeClick]
  );

  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge")?.strength(-800);
      graphRef.current.d3Force("link")?.distance(150);
      graphRef.current.d3Force("center")?.strength(0.1);

      // Add enhanced lighting to the scene
      const scene = graphRef.current.scene();
      if (scene) {
        // Clear existing lights
        const existingLights = scene.children.filter(
          (child: THREE.Object3D) => child instanceof THREE.Light
        );
        existingLights.forEach((light: THREE.Object3D) => scene.remove(light));

        // Ambient light for base illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Main directional light (key light)
        const directionalLight1 = new THREE.DirectionalLight(0xa855f7, 1);
        directionalLight1.position.set(100, 200, 100);
        scene.add(directionalLight1);

        // Fill light (opposite side)
        const directionalLight2 = new THREE.DirectionalLight(0x3b82f6, 0.6);
        directionalLight2.position.set(-100, -50, -100);
        scene.add(directionalLight2);

        // Rim light (back)
        const directionalLight3 = new THREE.DirectionalLight(0x06b6d4, 0.4);
        directionalLight3.position.set(0, -100, -200);
        scene.add(directionalLight3);

        // Point lights for cosmic atmosphere
        const pointLight1 = new THREE.PointLight(0x7c3aed, 0.8, 500);
        pointLight1.position.set(200, 100, 0);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xec4899, 0.6, 500);
        pointLight2.position.set(-200, -100, 100);
        scene.add(pointLight2);

        // Add starfield background
        const starsGeometry = new THREE.BufferGeometry();
        const starCount = 3000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        const starColors = [
          new THREE.Color(0xffffff),
          new THREE.Color(0xc4b5fd),
          new THREE.Color(0xa5b4fc),
          new THREE.Color(0x818cf8),
          new THREE.Color(0xfbc2eb),
        ];

        for (let i = 0; i < starCount; i++) {
          const i3 = i * 3;
          const radius = 1000 + Math.random() * 1000;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i3 + 2] = radius * Math.cos(phi);

          const color = starColors[Math.floor(Math.random() * starColors.length)];
          colors[i3] = color.r;
          colors[i3 + 1] = color.g;
          colors[i3 + 2] = color.b;

          sizes[i] = Math.random() * 2 + 0.5;
        }

        starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        starsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        const starsMaterial = new THREE.PointsMaterial({
          size: 2,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true,
        });

        const starField = new THREE.Points(starsGeometry, starsMaterial);
        starField.name = "starfield";
        scene.add(starField);

        // Add nebula effect using particles
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaCount = 500;
        const nebulaPositions = new Float32Array(nebulaCount * 3);
        const nebulaColors = new Float32Array(nebulaCount * 3);
        const nebulaSizes = new Float32Array(nebulaCount);

        const nebulaColors1 = [
          new THREE.Color(0x7c3aed),
          new THREE.Color(0xec4899),
          new THREE.Color(0x3b82f6),
          new THREE.Color(0x06b6d4),
        ];

        for (let i = 0; i < nebulaCount; i++) {
          const i3 = i * 3;
          const radius = 500 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          nebulaPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
          nebulaPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          nebulaPositions[i3 + 2] = radius * Math.cos(phi);

          const color = nebulaColors1[Math.floor(Math.random() * nebulaColors1.length)];
          nebulaColors[i3] = color.r;
          nebulaColors[i3 + 1] = color.g;
          nebulaColors[i3 + 2] = color.b;

          nebulaSizes[i] = Math.random() * 20 + 10;
        }

        nebulaGeometry.setAttribute("position", new THREE.BufferAttribute(nebulaPositions, 3));
        nebulaGeometry.setAttribute("color", new THREE.BufferAttribute(nebulaColors, 3));
        nebulaGeometry.setAttribute("size", new THREE.BufferAttribute(nebulaSizes, 1));

        const nebulaMaterial = new THREE.PointsMaterial({
          size: 30,
          vertexColors: true,
          transparent: true,
          opacity: 0.15,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending,
        });

        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        nebula.name = "nebula";
        scene.add(nebula);
      }
    }
  }, [graphData]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          toggleFullscreen();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [toggleFullscreen]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-xl ${className}`}
      role="img"
      aria-label="Interactive 3D library knowledge graph showing books and their connections"
    >
      {/* Cosmic background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(124,58,237,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={nodeLabel}
        nodeThreeObject={createNodeObject}
        nodeThreeObjectExtend={false}
        linkThreeObject={createLinkObject}
        linkThreeObjectExtend={false}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
        backgroundColor="rgba(0, 0, 0, 0)"
        controlType="orbit"
        d3VelocityDecay={0.3}
      />

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 p-3 rounded-lg bg-purple-900/80 backdrop-blur-md border border-purple-500/30 hover:bg-purple-800/80 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 group"
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen (ESC)" : "Enter fullscreen (F)"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-5 w-5 text-purple-200 group-hover:text-purple-100" />
        ) : (
          <Maximize2 className="h-5 w-5 text-purple-200 group-hover:text-purple-100" />
        )}
      </button>

      {/* Info card for hovered node */}
      {hoveredNode && (
        <div
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border border-purple-500/30 rounded-lg p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300"
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
