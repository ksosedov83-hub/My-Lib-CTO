"use client";

import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useAppStore, PerformanceMode } from "@/stores/useAppStore";
import { Book, Connection, ConnectionType } from "@/types";
import * as THREE from "three";
import { Maximize2, Minimize2, Zap, Home } from "lucide-react";

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

// Unified neutral color for all connections
const UNIFIED_CONNECTION_COLOR = "#8b9dc3";

const CONNECTION_TYPE_NAMES: Record<ConnectionType, string> = {
  influences: "Влияние",
  references: "Ссылка",
  contradicts: "Противоречит",
  expands: "Расширяет",
  "similar-theme": "Схожая тема",
  chronological: "Хронология",
  "author-connection": "Связь автора",
  custom: "Пользовательская",
};

// Performance configuration based on mode
interface PerformanceConfig {
  starCount: number;
  nebulaCount: number;
  nodeLODLevels: {
    high: number;
    medium: number;
    low: number;
  };
  sphereSegments: {
    high: number;
    medium: number;
    low: number;
  };
  curvePoints: {
    high: number;
    medium: number;
    low: number;
  };
  enableHalo: boolean;
  enableGlow: boolean;
  enableParticles: boolean;
  enableAnimations: boolean;
  lightCount: number;
}

const PERFORMANCE_CONFIGS: Record<Exclude<PerformanceMode, "auto">, PerformanceConfig> = {
  low: {
    starCount: 400,
    nebulaCount: 50,
    nodeLODLevels: { high: 100, medium: 250, low: 500 },
    sphereSegments: { high: 8, medium: 6, low: 4 },
    curvePoints: { high: 15, medium: 10, low: 8 },
    enableHalo: false,
    enableGlow: false,
    enableParticles: false,
    enableAnimations: false,
    lightCount: 1,
  },
  medium: {
    starCount: 600,
    nebulaCount: 100,
    nodeLODLevels: { high: 150, medium: 350, low: 600 },
    sphereSegments: { high: 12, medium: 8, low: 6 },
    curvePoints: { high: 25, medium: 15, low: 10 },
    enableHalo: true,
    enableGlow: false,
    enableParticles: false,
    enableAnimations: true,
    lightCount: 2,
  },
  high: {
    starCount: 800,
    nebulaCount: 150,
    nodeLODLevels: { high: 200, medium: 400, low: 700 },
    sphereSegments: { high: 16, medium: 10, low: 6 },
    curvePoints: { high: 35, medium: 20, low: 12 },
    enableHalo: true,
    enableGlow: true,
    enableParticles: true,
    enableAnimations: true,
    lightCount: 2,
  },
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
  const performanceMode = useAppStore((state) => state.performanceMode);
  const setPerformanceMode = useAppStore((state) => state.setPerformanceMode);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const fpsRef = useRef<number>(60);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const [detectedMode, setDetectedMode] = useState<Exclude<PerformanceMode, "auto">>("high");

  // Store initial camera position for reset
  const initialCameraPositionRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const initialCameraLookAtRef = useRef<{ x: number; y: number; z: number } | null>(null);

  // Shared geometry and material cache for better performance
  const geometryCache = useRef<Map<string, THREE.BufferGeometry>>(new Map());
  const materialCache = useRef<Map<string, THREE.Material>>(new Map());

  // Get active performance config
  const activeMode = performanceMode === "auto" ? detectedMode : performanceMode;
  const config = PERFORMANCE_CONFIGS[activeMode];

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
      color: UNIFIED_CONNECTION_COLOR,
      width: Math.max(0.5, conn.strength * 1.5),
      connection: conn,
    }));

    return { nodes, links };
  }, [books, connections, getBookColor]);

  // Get or create cached geometry
  const getCachedGeometry = useCallback((key: string, create: () => THREE.BufferGeometry) => {
    if (!geometryCache.current.has(key)) {
      geometryCache.current.set(key, create());
    }
    return geometryCache.current.get(key)!;
  }, []);

  // Get or create cached material
  const getCachedMaterial = useCallback((key: string, create: () => THREE.Material) => {
    if (!materialCache.current.has(key)) {
      materialCache.current.set(key, create());
    }
    return materialCache.current.get(key)!;
  }, []);

  // Calculate distance-based LOD level
  const getNodeLOD = useCallback(
    (node: GraphNode): "high" | "medium" | "low" => {
      if (!cameraRef.current || !node.x || !node.y || !node.z) return "low";

      const nodePos = new THREE.Vector3(node.x, node.y, node.z);
      const distance = cameraRef.current.position.distanceTo(nodePos);

      if (distance < config.nodeLODLevels.high) return "high";
      if (distance < config.nodeLODLevels.medium) return "medium";
      return "low";
    },
    [config]
  );

  // Optimized node creation with LOD
  const createNodeObject = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      const graphNode = node as GraphNode;
      const group = new THREE.Group();

      const matchesFilter = bookMatchesFilter(graphNode.book);
      const filteredThemeCount = getFilteredThemeCount(graphNode.book);
      const isSelected = selectedBookId === graphNode.id;
      const isHovered = hoveredNode?.id === graphNode.id;

      // Calculate base size from node value
      const baseSize = graphNode.val / 2 || 3;
      const color = new THREE.Color(graphNode.color);

      // Determine if node is active (matches filter or no filter active)
      const isFiltered = selectedThemes.length > 0;
      const isActive = !isFiltered || matchesFilter;

      // ✅ NEW: Active nodes are 1.8x larger for better visibility
      const size = isActive && isFiltered ? baseSize * 1.8 : baseSize;

      // ✅ NEW: Inactive nodes now 50% opacity (was 10%) - structure stays visible
      let opacity = highlightNodes.size === 0 || highlightNodes.has(graphNode.id) ? 1 : 0.3;
      if (isFiltered) {
        opacity = matchesFilter ? 1.0 : 0.5;
      }

      const lod = getNodeLOD(graphNode);
      const segments = config.sphereSegments[lod];

      // Use cached or create geometry
      const geometryKey = `sphere-${size.toFixed(1)}-${segments}`;
      const geometry = getCachedGeometry(
        geometryKey,
        () => new THREE.SphereGeometry(size, segments, segments)
      );

      // Choose material based on LOD and config
      // Disable glow for non-matching nodes when filter is active
      let material: THREE.Material;
      const enableGlowForNode = config.enableGlow && (selectedThemes.length === 0 || matchesFilter);
      if (lod === "high" && enableGlowForNode) {
        const materialKey = `phong-${graphNode.color}`;
        material = getCachedMaterial(
          materialKey,
          () =>
            new THREE.MeshLambertMaterial({
              color: color,
              emissive: color,
              emissiveIntensity: 0.2,
              transparent: true,
              opacity: opacity,
            })
        );
        // CRITICAL: Always update opacity and emissive properties for current state
        const lambertMat = material as THREE.MeshLambertMaterial;
        lambertMat.opacity = opacity;
        // ✅ NEW: Brighter emissive for active nodes when filter is active
        if (isActive && isFiltered) {
          lambertMat.emissive = color;
          lambertMat.emissiveIntensity = 0.3; // Increased from 0.2
        } else {
          lambertMat.emissive = color;
          lambertMat.emissiveIntensity = 0.2;
        }
        lambertMat.needsUpdate = true; // CRITICAL: Tell Three.js to re-render
      } else {
        const materialKey = `basic-${graphNode.color}`;
        material = getCachedMaterial(
          materialKey,
          () =>
            new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: opacity,
            })
        );
        // CRITICAL: Always update opacity to current value (for filter changes)
        const basicMat = material as THREE.MeshBasicMaterial;
        basicMat.opacity = opacity;
        basicMat.needsUpdate = true; // CRITICAL: Tell Three.js to re-render
      }

      const sphere = new THREE.Mesh(geometry, material);

      // Add animation data only if enabled and LOD is high
      if (config.enableAnimations && lod === "high") {
        sphere.userData = {
          pulsePhase: Math.random() * Math.PI * 2,
          baseSize: size,
          baseOpacity: opacity,
          color: graphNode.color,
        };
      }

      group.add(sphere);

      // Halo only for high detail, if enabled, and for matching nodes when filter is active
      const enableHaloForNode = config.enableHalo && (selectedThemes.length === 0 || matchesFilter);
      if (enableHaloForNode && lod === "high") {
        // ✅ NEW: Larger halo for active nodes (2.0x vs 1.8x)
        const baseHaloMultiplier = isActive && isFiltered ? 2.0 : 1.8;
        const haloSize = size * (isSelected ? 2.5 : isHovered ? 2.2 : baseHaloMultiplier);
        const haloGeometryKey = `sphere-${haloSize.toFixed(1)}-8`;
        const haloGeometry = getCachedGeometry(
          haloGeometryKey,
          () => new THREE.SphereGeometry(haloSize, 8, 8)
        );

        // ✅ NEW: Brighter halo for active nodes (1.5x opacity boost)
        const baseHaloOpacity = isSelected || isHovered ? 0.3 : 0.15;
        const haloOpacityMultiplier = isActive && isFiltered ? 1.5 : 1.0;
        const haloOpacity = baseHaloOpacity * haloOpacityMultiplier * opacity;

        const haloMaterialKey = `halo-${graphNode.color}`;
        const haloMaterial = getCachedMaterial(
          haloMaterialKey,
          () =>
            new THREE.MeshBasicMaterial({
              color: color,
              transparent: true,
              opacity: haloOpacity,
              side: THREE.BackSide,
            })
        );
        // CRITICAL: Always update opacity to current value (for filter changes)
        const haloMat = haloMaterial as THREE.MeshBasicMaterial;
        haloMat.opacity = haloOpacity;
        haloMat.needsUpdate = true; // CRITICAL: Tell Three.js to re-render

        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        group.add(halo);
      }

      // Selection/hover ring (only for selected/hovered)
      if ((isSelected || isHovered) && lod !== "low") {
        const ringGeometryKey = `torus-${size.toFixed(1)}`;
        const ringGeometry = getCachedGeometry(
          ringGeometryKey,
          () => new THREE.TorusGeometry(size * 1.5, 0.3, 8, 16)
        );

        const ringColor = isSelected ? "#7c3aed" : "#3b82f6";
        const ringMaterialKey = `ring-${ringColor}`;
        const ringMaterial = getCachedMaterial(
          ringMaterialKey,
          () =>
            new THREE.MeshBasicMaterial({
              color: ringColor,
              transparent: true,
              opacity: 0.8,
            })
        );

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }

      // Badge only for high LOD with multiple themes
      if (filteredThemeCount > 1 && matchesFilter && lod === "high") {
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
      config,
      getNodeLOD,
      getCachedGeometry,
      getCachedMaterial,
    ]
  );

  // Optimized link creation
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
        // ✅ NEW: Higher contrast for links - 80% between active, 30% to inactive
        linkAlpha = bothMatch ? 0.8 : 0.3;
      }

      const start = new THREE.Vector3(sourceNode.x || 0, sourceNode.y || 0, sourceNode.z || 0);
      const end = new THREE.Vector3(targetNode.x || 0, targetNode.y || 0, targetNode.z || 0);

      // Calculate LOD for edges based on camera distance
      const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
      let edgeLOD: "high" | "medium" | "low" = "low";
      if (cameraRef.current) {
        const distance = cameraRef.current.position.distanceTo(midPoint);
        if (distance < config.nodeLODLevels.high) edgeLOD = "high";
        else if (distance < config.nodeLODLevels.medium) edgeLOD = "medium";
      }

      const curvePoints = config.curvePoints[edgeLOD];

      // Create curved line
      const distance = start.distanceTo(end);
      const offset = distance * 0.2;

      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const perpendicular = new THREE.Vector3(
        -direction.y,
        direction.x,
        direction.z * 0.5
      ).normalize();
      const controlPoint = new THREE.Vector3().lerpVectors(start, end, 0.5);
      controlPoint.add(perpendicular.multiplyScalar(offset));

      const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
      const points = curve.getPoints(curvePoints);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      const color = new THREE.Color(graphLink.color);
      const material = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: linkAlpha,
      });

      const line = new THREE.Line(geometry, material);

      const group = new THREE.Group();
      group.add(line);

      // Particles only for highlighted, high LOD, and if enabled
      if (
        config.enableParticles &&
        isHighlighted &&
        highlightLinks.size > 0 &&
        edgeLOD === "high"
      ) {
        const particleCount = 2;
        const particleGeometryKey = "particle-0.5";
        const particleGeometry = getCachedGeometry(
          particleGeometryKey,
          () => new THREE.SphereGeometry(0.5, 4, 4)
        );

        for (let i = 0; i < particleCount; i++) {
          const particleMaterialKey = `particle-${graphLink.color}`;
          const particleMaterial = getCachedMaterial(
            particleMaterialKey,
            () =>
              new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
              })
          );

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
    [
      highlightLinks,
      selectedThemes,
      bookMatchesFilter,
      config,
      getCachedGeometry,
      getCachedMaterial,
    ]
  );

  // FPS monitoring for auto mode
  useEffect(() => {
    if (performanceMode !== "auto") return;

    // Initialize the timer
    lastFrameTimeRef.current = Date.now();

    const monitorFPS = () => {
      const now = Date.now();
      const delta = now - lastFrameTimeRef.current;
      frameCountRef.current++;

      if (delta >= 1000) {
        fpsRef.current = (frameCountRef.current * 1000) / delta;
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;

        // Adjust quality based on FPS
        if (fpsRef.current < 30) {
          setDetectedMode("low");
        } else if (fpsRef.current < 45) {
          setDetectedMode("medium");
        } else {
          setDetectedMode("high");
        }
      }
    };

    const interval = setInterval(monitorFPS, 100);
    return () => clearInterval(interval);
  }, [performanceMode]);

  // Optimized animation loop
  useEffect(() => {
    const animate = () => {
      if (!isVisibleRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!config.enableAnimations) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const time = Date.now() * 0.001;

      if (graphRef.current) {
        const scene = graphRef.current.scene();
        if (scene) {
          // Only animate objects that need animation
          scene.traverse((object: THREE.Object3D) => {
            // Animate node pulsing (only high LOD nodes)
            if (object.userData?.pulsePhase !== undefined && config.enableGlow) {
              const pulse = Math.sin(time * 2 + object.userData.pulsePhase) * 0.05 + 1;
              object.scale.set(pulse, pulse, pulse);

              const material = (object as THREE.Mesh).material as THREE.MeshLambertMaterial;
              if (material.emissiveIntensity !== undefined) {
                material.emissiveIntensity =
                  0.15 + Math.sin(time * 2 + object.userData.pulsePhase) * 0.1;
              }
            }

            // Animate particles along edges (only if enabled)
            if (object.userData?.curve && config.enableParticles) {
              object.userData.offset = (object.userData.offset + object.userData.speed) % 1;
              const pos = object.userData.curve.getPoint(object.userData.offset);
              object.position.copy(pos);
            }

            // Rotate starfield
            if (object.name === "starfield") {
              object.rotation.y = time * 0.01;
            }

            // Animate nebula (throttled)
            if (object.name === "nebula" && frameCountRef.current % 2 === 0) {
              object.rotation.y = time * 0.005;
              const material = (object as THREE.Points).material as THREE.PointsMaterial;
              if (material.opacity !== undefined) {
                material.opacity = 0.1 + Math.sin(time * 0.5) * 0.03;
              }
            }
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
  }, [config]);

  // Page visibility API - pause when tab not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleNodeHover = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      const graphNode = node as GraphNode | null;

      if (!graphNode) {
        setHoveredNode(null);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        if (onNodeHover) {
          onNodeHover(null);
        }
        return;
      }

      // Only allow hover on matching nodes when filter is active
      if (selectedThemes.length > 0 && !bookMatchesFilter(graphNode.book)) {
        // Do not set hover state for non-matching books
        return;
      }

      setHoveredNode(graphNode);
      if (onNodeHover) {
        onNodeHover(graphNode.book);
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
    [graphData.links, onNodeHover, selectedThemes, bookMatchesFilter]
  );

  const handleNodeClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any) => {
      const graphNode = node as GraphNode;
      if (onNodeClick) {
        onNodeClick(graphNode.book);
      }

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

  // Setup scene with optimized lighting and particles
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force("charge")?.strength(-800);
      graphRef.current.d3Force("link")?.distance(150);
      graphRef.current.d3Force("center")?.strength(0.1);

      const scene = graphRef.current.scene();
      const camera = graphRef.current.camera();
      cameraRef.current = camera;

      // Configure orbit controls for better panning
      const controls = graphRef.current.controls();
      if (controls) {
        console.log("🔧 Configuring OrbitControls for pan...");

        // CRITICAL: Enable panning with right and middle mouse buttons
        controls.enablePan = true;
        controls.panSpeed = 1.0;
        controls.screenSpacePanning = true; // Pan in screen space (more intuitive)

        // КРИТИЧНО: Переназначить кнопки мыши
        // Импортировать THREE если нужно: import * as THREE from 'three';
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE, // 0 - left button for rotation
          MIDDLE: THREE.MOUSE.PAN, // 1 - middle button for pan
          RIGHT: THREE.MOUSE.PAN, // 2 - right button for pan (было DOLLY!)
        };

        // Apply changes
        controls.update();

        console.log("✅ Pan enabled:", controls.enablePan);
        console.log("✅ Pan speed:", controls.panSpeed);
        console.log("✅ Screen space panning:", controls.screenSpacePanning);
        console.log("✅ Mouse buttons:", controls.mouseButtons);
        console.log(
          "✅ Mouse buttons RIGHT:",
          controls.mouseButtons.RIGHT,
          "(should be 2 for PAN)"
        );
      } else {
        console.error("❌ Controls not found!");
      }

      // Store initial camera position (only once)
      if (!initialCameraPositionRef.current && camera) {
        initialCameraPositionRef.current = {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z,
        };
        // Look at center by default
        initialCameraLookAtRef.current = { x: 0, y: 0, z: 0 };
      }

      if (scene) {
        // Clear existing environment
        const existingLights = scene.children.filter(
          (child: THREE.Object3D) => child instanceof THREE.Light
        );
        existingLights.forEach((light: THREE.Object3D) => scene.remove(light));

        const existingStars = scene.children.filter(
          (child: THREE.Object3D) => child.name === "starfield" || child.name === "nebula"
        );
        existingStars.forEach((obj: THREE.Object3D) => scene.remove(obj));

        // Simplified lighting setup - realistic space lighting (neutral white)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        if (config.lightCount >= 2) {
          // Neutral white directional light (like distant starlight)
          const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
          directionalLight.position.set(100, 200, 100);
          scene.add(directionalLight);
        }

        // Optimized starfield
        const starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(config.starCount * 3);
        const colors = new Float32Array(config.starCount * 3);
        const sizes = new Float32Array(config.starCount);

        // Realistic star colors: white, yellowish, light blue (like real stars)
        const starColors = [
          new THREE.Color(0xffffff), // White stars
          new THREE.Color(0xffffcc), // Yellowish stars
          new THREE.Color(0xaaddff), // Light blue stars
        ];

        for (let i = 0; i < config.starCount; i++) {
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

          sizes[i] = Math.random() * 3 + 1;
        }

        starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        starsGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

        const starsMaterial = new THREE.PointsMaterial({
          size: 3,
          vertexColors: true,
          transparent: true,
          opacity: 0.7,
          sizeAttenuation: true,
        });

        const starField = new THREE.Points(starsGeometry, starsMaterial);
        starField.name = "starfield";
        scene.add(starField);

        // Optimized nebula
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaPositions = new Float32Array(config.nebulaCount * 3);
        const nebulaColors = new Float32Array(config.nebulaCount * 3);

        // Realistic nebula colors: deep blue, cyan, light blue (like cosmic gas clouds)
        const nebulaColors1 = [
          new THREE.Color(0x1e3a8a), // Deep blue
          new THREE.Color(0x0891b2), // Cyan
          new THREE.Color(0x60a5fa), // Light blue
        ];

        for (let i = 0; i < config.nebulaCount; i++) {
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
        }

        nebulaGeometry.setAttribute("position", new THREE.BufferAttribute(nebulaPositions, 3));
        nebulaGeometry.setAttribute("color", new THREE.BufferAttribute(nebulaColors, 3));

        const nebulaMaterial = new THREE.PointsMaterial({
          size: 25,
          vertexColors: true,
          transparent: true,
          opacity: 0.12,
          sizeAttenuation: true,
          blending: THREE.AdditiveBlending,
        });

        const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        nebula.name = "nebula";
        scene.add(nebula);
      }
    }
  }, [graphData, config]);

  // Cleanup on unmount
  useEffect(() => {
    const geomCache = geometryCache.current;
    const matCache = materialCache.current;

    return () => {
      // Dispose cached geometries
      geomCache.forEach((geometry) => geometry.dispose());
      geomCache.clear();

      // Dispose cached materials
      matCache.forEach((material) => material.dispose());
      matCache.clear();
    };
  }, []);

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

  // Camera reset function
  const resetCamera = useCallback(() => {
    if (graphRef.current && initialCameraPositionRef.current) {
      const pos = initialCameraPositionRef.current;
      const lookAt = initialCameraLookAtRef.current || { x: 0, y: 0, z: 0 };

      // Smooth transition to initial position
      graphRef.current.cameraPosition(
        pos,
        lookAt,
        1500 // 1.5 second transition
      );
    }
  }, []);

  // Autofocus function - using useRef to avoid circular dependency
  const focusOnFilteredNodesRef = useRef<(filteredNodeIds: string[], retryCount?: number) => void>(
    () => {}
  );

  // Update the ref function in useEffect to avoid ref mutation during render
  const focusOnFilteredNodes = useCallback(
    (filteredNodeIds: string[], retryCount: number = 0) => {
      console.log(
        "🎯 focusOnFilteredNodes called with IDs:",
        filteredNodeIds,
        "retry:",
        retryCount
      );

      if (!graphRef.current || filteredNodeIds.length === 0) {
        console.log("❌ Early return: no graph or no IDs");
        return;
      }

      // Get filtered nodes with positions
      const filteredNodes = graphData.nodes.filter(
        (n) =>
          filteredNodeIds.includes(n.id) &&
          n.x !== undefined &&
          n.y !== undefined &&
          n.z !== undefined
      );

      console.log(
        "📍 Filtered nodes with coordinates:",
        filteredNodes.length,
        "/",
        filteredNodeIds.length
      );

      // If positions aren't ready yet, retry up to 5 times
      if (filteredNodes.length === 0 && retryCount < 5) {
        console.log("⏳ No coordinates yet, retrying in 500ms...");
        setTimeout(() => {
          focusOnFilteredNodesRef.current(filteredNodeIds, retryCount + 1);
        }, 500);
        return;
      }

      if (filteredNodes.length === 0) {
        console.log("❌ No nodes with coordinates after retries");
        return;
      }

      // Calculate bounding box
      const xs = filteredNodes.map((n) => n.x!);
      const ys = filteredNodes.map((n) => n.y!);
      const zs = filteredNodes.map((n) => n.z!);

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const minZ = Math.min(...zs);
      const maxZ = Math.max(...zs);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const centerZ = (minZ + maxZ) / 2;

      console.log("📐 Center position:", { x: centerX, y: centerY, z: centerZ });

      const sizeX = maxX - minX;
      const sizeY = maxY - minY;
      const sizeZ = maxZ - minZ;
      const maxDim = Math.max(sizeX, sizeY, sizeZ, 50); // Minimum size of 50 for single nodes

      console.log("📏 Bounding box size:", { sizeX, sizeY, sizeZ, maxDim });

      // Calculate camera distance with padding
      const fov = 75; // field of view
      const paddingFactor = 2.0; // Increased padding for better visibility
      const cameraDistance = (maxDim / 2 / Math.tan((fov / 2) * (Math.PI / 180))) * paddingFactor;

      console.log("📷 Camera distance:", cameraDistance);

      // Smooth transition to the filtered nodes
      graphRef.current.cameraPosition(
        { x: centerX, y: centerY, z: centerZ + cameraDistance },
        { x: centerX, y: centerY, z: centerZ },
        1800 // 1.8 second transition
      );

      console.log("✅ Camera moved to filtered nodes!");
    },
    [graphData]
  );

  // Assign to ref in useEffect to avoid ref mutation during render
  useEffect(() => {
    focusOnFilteredNodesRef.current = focusOnFilteredNodes;
  }, [focusOnFilteredNodes]);

  // Trigger autofocus when filter changes
  useEffect(() => {
    console.log("🔄 Filter changed, selectedThemes:", selectedThemes);

    // CRITICAL: Force graph refresh when filter changes to apply new opacity values
    if (graphRef.current) {
      console.log("🔄 Forcing graph refresh to update node visibility...");
      const currentData = graphRef.current.graphData();

      // Trigger re-render of all nodeThreeObject by creating new array references
      graphRef.current.graphData({
        nodes: [...currentData.nodes], // Create new array to trigger update
        links: currentData.links,
      });

      console.log("✅ Graph refreshed with updated opacity values");
    }

    if (selectedThemes.length > 0) {
      // Get IDs of filtered nodes
      const filteredIds = graphData.nodes
        .filter((node) => node.themes.some((t) => selectedThemes.includes(t)))
        .map((n) => n.id);

      console.log("📚 Filtered book IDs:", filteredIds);

      // Small delay to let the force simulation stabilize
      setTimeout(() => {
        focusOnFilteredNodesRef.current(filteredIds);
      }, 800);
    } else {
      console.log("🏠 Filter cleared, returning to initial view");
      // Return to initial view when filter is cleared
      resetCamera();
    }
  }, [selectedThemes, graphData.nodes, resetCamera]);

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
      // H or Home key to reset camera
      if (e.key === "h" || e.key === "H" || e.key === "Home") {
        resetCamera();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [toggleFullscreen, resetCamera]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkLabel = useCallback((link: any) => {
    const graphLink = link as GraphLink;
    const sourceNode = graphLink.source as GraphNode;
    const targetNode = graphLink.target as GraphNode;

    const typeName = CONNECTION_TYPE_NAMES[graphLink.type] || graphLink.type;
    const sourceTitle = typeof sourceNode === "object" ? sourceNode.name : sourceNode;
    const targetTitle = typeof targetNode === "object" ? targetNode.name : targetNode;

    return `
      <div style="
        background: rgba(10, 1, 24, 0.95);
        border: 1px solid rgba(139, 157, 195, 0.5);
        border-radius: 8px;
        padding: 12px;
        color: #e0e7ff;
        font-family: Inter, sans-serif;
        font-size: 13px;
        max-width: 280px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      ">
        <div style="font-weight: 600; margin-bottom: 6px; color: #c4b5fd; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Связь</div>
        <div style="margin-bottom: 8px;">
          <div style="font-size: 12px; color: #a5b4fc;">Тип: <span style="color: #8b9dc3; font-weight: 500;">${typeName}</span></div>
          <div style="font-size: 12px; color: #a5b4fc;">Сила: <span style="color: #8b9dc3; font-weight: 500;">${graphLink.strength}/10</span></div>
        </div>
        ${graphLink.label ? `<div style="font-size: 11px; color: #818cf8; margin-bottom: 8px; font-style: italic;">"${graphLink.label}"</div>` : ""}
        <div style="border-top: 1px solid rgba(139, 157, 195, 0.3); padding-top: 8px; margin-top: 8px;">
          <div style="font-size: 11px; color: #a5b4fc; margin-bottom: 4px;">${sourceTitle}</div>
          <div style="font-size: 10px; color: #818cf8; text-align: center; margin: 4px 0;">↓</div>
          <div style="font-size: 11px; color: #a5b4fc;">${targetTitle}</div>
        </div>
      </div>
    `;
  }, []);

  const cyclePerformanceMode = useCallback(() => {
    const modes: PerformanceMode[] = ["auto", "low", "medium", "high"];
    const currentIndex = modes.indexOf(performanceMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPerformanceMode(modes[nextIndex]);
  }, [performanceMode, setPerformanceMode]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-xl cursor-grab active:cursor-grabbing ${className}`}
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
        linkLabel={linkLabel}
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

      {/* Performance mode toggle */}
      <button
        onClick={cyclePerformanceMode}
        className="absolute top-4 left-4 z-10 px-4 py-2 rounded-lg bg-purple-900/80 backdrop-blur-md border border-purple-500/30 hover:bg-purple-800/80 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 group flex items-center gap-2"
        aria-label="Toggle performance mode"
        title={`Performance: ${activeMode.toUpperCase()} (Click to cycle)`}
      >
        <Zap className="h-4 w-4 text-purple-200 group-hover:text-purple-100" />
        <span className="text-sm text-purple-200 group-hover:text-purple-100">
          {performanceMode === "auto" ? `Auto (${activeMode})` : activeMode.toUpperCase()}
        </span>
      </button>

      {/* Filter indicator */}
      {selectedThemes.length > 0 && (
        <div
          className="absolute top-16 left-4 z-10 px-4 py-2 rounded-lg bg-purple-900/80 backdrop-blur-md border border-purple-500/30 shadow-lg animate-in fade-in duration-300"
          role="status"
          aria-live="polite"
        >
          <span className="text-sm text-purple-200">
            Показано:{" "}
            <span className="font-semibold text-purple-100">
              {
                graphData.nodes.filter((node) =>
                  node.themes.some((t) => selectedThemes.includes(t))
                ).length
              }
            </span>{" "}
            из {graphData.nodes.length} книг
          </span>
        </div>
      )}

      {/* Camera reset button */}
      <button
        onClick={resetCamera}
        className="absolute top-4 right-16 z-10 p-3 rounded-lg bg-purple-900/80 backdrop-blur-md border border-purple-500/30 hover:bg-purple-800/80 transition-all duration-300 shadow-lg hover:shadow-purple-500/50 group"
        aria-label="Вернуться в исходное положение"
        title="Вернуться в исходное положение (H или Home)"
      >
        <Home className="h-5 w-5 text-purple-200 group-hover:text-purple-100" />
      </button>

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

      {/* 3D Controls hint */}
      <div
        className="absolute bottom-4 left-4 z-10 px-3 py-2 rounded-lg bg-purple-900/70 backdrop-blur-md border border-purple-500/20 shadow-lg"
        role="region"
        aria-label="3D navigation controls"
      >
        <div className="flex flex-col gap-0.5 text-xs text-purple-200">
          <div>
            <span className="font-semibold text-purple-100">ЛКМ</span> - вращать
          </div>
          <div>
            <span className="font-semibold text-purple-100">ПКМ/СКМ</span> - переместить
          </div>
          <div>
            <span className="font-semibold text-purple-100">Колёсико</span> - зум
          </div>
        </div>
      </div>

      {/* Info card for hovered node */}
      {hoveredNode && (
        <div
          className="absolute bottom-4 right-4 w-80 bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border border-purple-500/30 rounded-lg p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300"
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
