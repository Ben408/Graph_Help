"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CATEGORY_COLORS,
  RELATIONSHIP_LABELS,
  type RelationshipType,
} from "@/data/concepts";
import { getActivePack } from "@/lib/knowledge";
import { conceptDegree, conceptsByIds, edgesAmong } from "@/lib/knowledge/graph-view";

interface GraphNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  category: string;
  isCurrent: boolean;
  dimmed: boolean;
  labeled: boolean;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: RelationshipType;
}

interface KnowledgeGraphProps {
  currentConceptId?: string;
  visibleIds?: string[];
  hops?: 1 | 2;
  onNodeClick?: (conceptId: string) => void;
  filterCategories?: string[];
  relationTypes?: RelationshipType[];
  sizeByDegree?: boolean;
  dimUnrelated?: boolean;
  fitToken?: number;
  className?: string;
}

function getNodeColor(node: GraphNode): string {
  if (node.isCurrent) return "#10b981";
  return CATEGORY_COLORS[node.category] || "#3b82f6";
}

export function KnowledgeGraph({
  currentConceptId,
  visibleIds,
  hops: _hops = 1,
  onNodeClick,
  filterCategories = [],
  relationTypes = [],
  sizeByDegree = true,
  dimUnrelated = true,
  fitToken = 0,
  className = "",
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animationRef = useRef(0);
  const dragNodeRef = useRef<GraphNode | null>(null);
  const didDragRef = useRef(false);
  const hoveredNodeRef = useRef<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const stabilizedRef = useRef(false);
  const frameCountRef = useRef(0);
  const pack = getActivePack();

  useEffect(() => {
    let ids = new Set(
      visibleIds && visibleIds.length > 0
        ? visibleIds
        : pack.concepts.map((c) => c.id)
    );
    if (filterCategories.length > 0) {
      ids = new Set(
        [...ids].filter((id) => {
          const concept = pack.concepts.find((c) => c.id === id);
          return concept && filterCategories.includes(concept.category);
        })
      );
    }
    const neighborIds = currentConceptId
      ? new Set(
          pack.concepts
            .filter((c) => {
              if (c.id === currentConceptId) return true;
              return (
                c.relationships.some((r) => r.targetId === currentConceptId) ||
                pack.concepts
                  .find((x) => x.id === currentConceptId)
                  ?.relationships.some((r) => r.targetId === c.id)
              );
            })
            .map((c) => c.id)
        )
      : ids;

    const visible = conceptsByIds(pack, ids);
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const existing = new Map(nodesRef.current.map((n) => [n.id, n]));
    const maxDeg = Math.max(1, ...visible.map((c) => conceptDegree(pack, c.id)));

    const nodes: GraphNode[] = visible.map((c, i) => {
      const prev = existing.get(c.id);
      const angle = (2 * Math.PI * i) / Math.max(visible.length, 1);
      const ring = Math.min(dimensions.width, dimensions.height) * 0.32;
      const degree = conceptDegree(pack, c.id);
      const base = 10 + (sizeByDegree ? (degree / maxDeg) * 14 : 8);
      const isCurrent = c.id === currentConceptId;
      const inNeighborhood = !currentConceptId || neighborIds.has(c.id);
      return {
        id: c.id,
        x: prev?.x ?? centerX + Math.cos(angle) * ring,
        y: prev?.y ?? centerY + Math.sin(angle) * ring,
        vx: 0,
        vy: 0,
        label: c.title,
        category: c.category,
        isCurrent,
        dimmed: Boolean(dimUnrelated && currentConceptId && !inNeighborhood),
        labeled: isCurrent || inNeighborhood,
        radius: isCurrent ? Math.max(base, 20) : base,
      };
    });

    const idSet = new Set(nodes.map((n) => n.id));
    const edges = edgesAmong(pack, idSet, relationTypes.length ? relationTypes : undefined);

    nodesRef.current = nodes;
    edgesRef.current = edges;
    stabilizedRef.current = false;
    frameCountRef.current = 0;
  }, [
    currentConceptId,
    visibleIds,
    _hops,
    filterCategories,
    relationTypes,
    dimensions,
    pack,
    sizeByDegree,
    dimUnrelated,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setDimensions({ width, height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const isDarkRef = useRef(true);
  useEffect(() => {
    const check = () => {
      isDarkRef.current = document.documentElement.classList.contains("dark");
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    const nodes = nodesRef.current;
    if (nodes.length === 0 || dimensions.width === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of nodes) {
      minX = Math.min(minX, node.x - node.radius);
      minY = Math.min(minY, node.y - node.radius);
      maxX = Math.max(maxX, node.x + node.radius);
      maxY = Math.max(maxY, node.y + node.radius);
    }
    const bw = Math.max(maxX - minX, 1);
    const bh = Math.max(maxY - minY, 1);
    const scale = Math.min(
      2.2,
      Math.max(0.35, Math.min((dimensions.width - 48) / bw, (dimensions.height - 48) / bh))
    );
    zoomRef.current = scale;
    panRef.current = {
      x: dimensions.width / 2 - ((minX + maxX) / 2) * scale,
      y: dimensions.height / 2 - ((minY + maxY) / 2) * scale,
    };
  }, [fitToken, dimensions.width, dimensions.height, visibleIds, currentConceptId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const simulate = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      if (nodes.length === 0) return;

      frameCountRef.current++;
      const damping = Math.max(0.01, 1 - frameCountRef.current * 0.005);
      if (damping <= 0.02) stabilizedRef.current = true;

      if (!stabilizedRef.current) {
        const centerX = dimensions.width / 2;
        const centerY = dimensions.height / 2;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const force = 2800 / (dist * dist);
            nodes[i].vx -= (dx / dist) * force;
            nodes[i].vy -= (dy / dist) * force;
            nodes[j].vx += (dx / dist) * force;
            nodes[j].vy += (dy / dist) * force;
          }
        }
        for (const edge of edges) {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) continue;
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = (dist - 150) * 0.006;
          source.vx += (dx / Math.max(dist, 1)) * force;
          source.vy += (dy / Math.max(dist, 1)) * force;
          target.vx -= (dx / Math.max(dist, 1)) * force;
          target.vy -= (dy / Math.max(dist, 1)) * force;
        }
        for (const node of nodes) {
          if (node === dragNodeRef.current) continue;
          node.vx += (centerX - node.x) * 0.001;
          node.vy += (centerY - node.y) * 0.001;
          node.vx *= damping * 0.6;
          node.vy *= damping * 0.6;
          node.x += node.vx;
          node.y += node.vy;
        }
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(zoomRef.current, zoomRef.current);
      const isDark = isDarkRef.current;

      for (const edge of edges) {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);
        if (!source || !target) continue;
        const hover =
          hoveredNodeRef.current &&
          (hoveredNodeRef.current.id === edge.source ||
            hoveredNodeRef.current.id === edge.target);
        const dimmed = source.dimmed || target.dimmed;
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = hover
          ? isDark
            ? "rgba(96,165,250,0.7)"
            : "rgba(59,130,246,0.7)"
          : dimmed
            ? isDark
              ? "rgba(255,255,255,0.03)"
              : "rgba(0,0,0,0.04)"
            : isDark
              ? "rgba(255,255,255,0.14)"
              : "rgba(0,0,0,0.14)";
        ctx.lineWidth = hover ? 2 : 1;
        ctx.stroke();
        if (hover) {
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;
          ctx.font = "10px Inter, system-ui, sans-serif";
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
          ctx.textAlign = "center";
          ctx.fillText(RELATIONSHIP_LABELS[edge.type], midX, midY - 4);
        }
      }

      for (const node of nodes) {
        const isHovered =
          hoveredNodeRef.current?.id === node.id ||
          keyboardFocusRef.current === node.id;
        const color = getNodeColor(node);
        const r = node.radius * (isHovered ? 1.12 : 1);
        ctx.globalAlpha = node.dimmed && !isHovered ? 0.18 : 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? color : `${color}dd`;
        ctx.fill();
        if (isHovered || node.isCurrent) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        if (node.labeled || isHovered) {
          ctx.font = `${node.isCurrent ? "600" : "500"} 11px Inter, system-ui, sans-serif`;
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.92)" : "rgba(15,17,23,0.92)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillText(node.label, node.x, node.y + r + 6);
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [dimensions]);

  const keyboardFocusRef = useRef<string | null>(null);
  const [keyboardFocusId, setKeyboardFocusId] = useState<string | null>(null);

  const getNodeAtPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left - panRef.current.x) / zoomRef.current;
    const y = (clientY - rect.top - panRef.current.y) / zoomRef.current;
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i];
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy < (node.radius + 6) * (node.radius + 6)) return node;
    }
    return null;
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="application"
        aria-label="Concept graph. Arrow keys move between concepts, Enter opens one, plus and minus zoom."
        className="w-full h-full cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-md"
        onMouseDown={(e) => {
          didDragRef.current = false;
          const node = getNodeAtPos(e.clientX, e.clientY);
          if (node) dragNodeRef.current = node;
          else isPanningRef.current = true;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e) => {
          if (dragNodeRef.current) {
            const dx = (e.clientX - lastMouseRef.current.x) / zoomRef.current;
            const dy = (e.clientY - lastMouseRef.current.y) / zoomRef.current;
            if (Math.abs(dx) + Math.abs(dy) > 0.5) didDragRef.current = true;
            dragNodeRef.current.x += dx;
            dragNodeRef.current.y += dy;
            dragNodeRef.current.vx = 0;
            dragNodeRef.current.vy = 0;
            lastMouseRef.current = { x: e.clientX, y: e.clientY };
          } else if (isPanningRef.current) {
            didDragRef.current = true;
            panRef.current.x += e.clientX - lastMouseRef.current.x;
            panRef.current.y += e.clientY - lastMouseRef.current.y;
            lastMouseRef.current = { x: e.clientX, y: e.clientY };
          } else {
            const node = getNodeAtPos(e.clientX, e.clientY);
            hoveredNodeRef.current = node;
            setHoveredNode(node);
            const rect = canvasRef.current?.getBoundingClientRect();
            if (node && rect) {
              setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }
          }
        }}
        onMouseUp={() => {
          dragNodeRef.current = null;
          isPanningRef.current = false;
        }}
        onMouseLeave={() => {
          dragNodeRef.current = null;
          isPanningRef.current = false;
          hoveredNodeRef.current = null;
          setHoveredNode(null);
        }}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.95 : 1.05;
          const newZoom = Math.max(0.3, Math.min(3, zoomRef.current * delta));
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            panRef.current.x =
              mouseX - ((mouseX - panRef.current.x) * newZoom) / zoomRef.current;
            panRef.current.y =
              mouseY - ((mouseY - panRef.current.y) * newZoom) / zoomRef.current;
          }
          zoomRef.current = newZoom;
        }}
        onClick={(e) => {
          if (didDragRef.current) return;
          const node = getNodeAtPos(e.clientX, e.clientY);
          if (node && onNodeClick) onNodeClick(node.id);
        }}
        onKeyDown={(e) => {
          const nodes = nodesRef.current;
          if (nodes.length === 0) return;
          const ids = nodes.map((n) => n.id);
          const current = keyboardFocusRef.current ?? currentConceptId ?? ids[0];
          const index = Math.max(0, ids.indexOf(current));
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = ids[(index + 1) % ids.length];
            keyboardFocusRef.current = next;
            setKeyboardFocusId(next);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            const next = ids[(index - 1 + ids.length) % ids.length];
            keyboardFocusRef.current = next;
            setKeyboardFocusId(next);
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const id = keyboardFocusRef.current ?? ids[0];
            if (id && onNodeClick) onNodeClick(id);
          } else if (e.key === "+" || e.key === "=") {
            e.preventDefault();
            zoomRef.current = Math.min(3, zoomRef.current * 1.08);
          } else if (e.key === "-" || e.key === "_") {
            e.preventDefault();
            zoomRef.current = Math.max(0.3, zoomRef.current * 0.92);
          } else if (e.key === "0") {
            e.preventDefault();
            panRef.current = { x: 0, y: 0 };
            zoomRef.current = 1;
          }
        }}
      />
      <p className="sr-only" aria-live="polite">
        {keyboardFocusId
          ? nodesRef.current.find((n) => n.id === keyboardFocusId)?.label
          : ""}
      </p>
      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-10 bg-card text-card-foreground border border-border rounded-lg px-3 py-2 shadow-lg max-w-[220px]"
          style={{
            left: tooltipPos.x + 16,
            top: tooltipPos.y - 10,
            transform: tooltipPos.x > dimensions.width - 220 ? "translateX(-110%)" : "none",
          }}
        >
          <p className="text-xs font-semibold">{hoveredNode.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{hoveredNode.category}</p>
        </div>
      )}
    </div>
  );
}
