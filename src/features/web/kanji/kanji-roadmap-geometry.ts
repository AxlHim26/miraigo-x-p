import { roadmapNodeLayout, type KanjiRoadmapLevel, type OrbitPlacement, type RoadmapNodeLayout } from "@/features/web/kanji/kanji-roadmap";

const ORBIT_SPAN = 220;
const ORBIT_RADIUS_X = 112;
const ORBIT_RADIUS_Y = 90;
const ROADMAP_BLOCK_HEIGHT = 620;
const ROADMAP_TOP_PADDING = 0;
const ROADMAP_BOTTOM_PADDING = 0;
const ROADMAP_STAGE_INSET = 22;


type RoadmapNode = KanjiRoadmapLevel["days"][number] & RoadmapNodeLayout;

const orbitAngleCenter: Record<OrbitPlacement, number> = {
  top: 270,
  right: 0,
  bottom: 90,
  left: 180,
};


export const buildConnectorPath = (
  start: { x: number; y: number },
  end: { x: number; y: number },
  index: number,
) => {
  const horizontalOffset = index % 2 === 0 ? -14 : 14;
  const controlX = (start.x + end.x) / 2 + horizontalOffset;
  const controlY = (start.y + end.y) / 2 - 4;

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
};

export const getOrbitOffset = (index: number, total: number, placement: OrbitPlacement) => {
  const center = orbitAngleCenter[placement];
  const startAngle = center - ORBIT_SPAN / 2;
  const step = total > 1 ? ORBIT_SPAN / (total - 1) : 0;
  const angle = ((startAngle + step * index) * Math.PI) / 180;

  return {
    x: Math.cos(angle) * ORBIT_RADIUS_X,
    y: Math.sin(angle) * ORBIT_RADIUS_Y,
  };
};

export const buildOrbitArcPath = (placement: OrbitPlacement) => {
  const center = orbitAngleCenter[placement];
  const startAngle = ((center - ORBIT_SPAN / 2) * Math.PI) / 180;
  const endAngle = ((center + ORBIT_SPAN / 2) * Math.PI) / 180;
  const cx = 140;
  const cy = 130;
  const radiusX = ORBIT_RADIUS_X + 16;
  const radiusY = ORBIT_RADIUS_Y + 16;
  const startX = cx + Math.cos(startAngle) * radiusX;
  const startY = cy + Math.sin(startAngle) * radiusY;
  const endX = cx + Math.cos(endAngle) * radiusX;
  const endY = cy + Math.sin(endAngle) * radiusY;

  return `M ${startX} ${startY} A ${radiusX} ${radiusY} 0 1 1 ${endX} ${endY}`;
};


const getBlockLayoutY = (layout: RoadmapNodeLayout) =>
  (layout.y / 100) * ROADMAP_BLOCK_HEIGHT - ROADMAP_STAGE_INSET;

export const buildRoadmapNodes = (
  level: KanjiRoadmapLevel,
): { canvasHeight: number; nodes: RoadmapNode[] } => {
  const blockCount = Math.max(1, Math.ceil(level.days.length / roadmapNodeLayout.length));
  const innerCanvasHeight = Math.max(
    ROADMAP_BLOCK_HEIGHT,
    ROADMAP_TOP_PADDING + ROADMAP_BOTTOM_PADDING + blockCount * ROADMAP_BLOCK_HEIGHT,
  );

  const nodes = level.days.flatMap((day, index) => {
    const layoutIndex = roadmapNodeLayout.length - 1 - (index % roadmapNodeLayout.length);
    const blockIndex = Math.floor(index / roadmapNodeLayout.length);
    const layout = roadmapNodeLayout[layoutIndex];

    if (!layout) {
      return [];
    }

    const blockTop =
      innerCanvasHeight - ROADMAP_BOTTOM_PADDING - (blockIndex + 1) * ROADMAP_BLOCK_HEIGHT;

    return [
      {
        ...day,
        ...layout,
        y: blockTop + getBlockLayoutY(layout),
      },
    ];
  });

  const topBlockNodeCount =
    level.days.length % roadmapNodeLayout.length || roadmapNodeLayout.length;
  const topBlockNodes = nodes.slice(-topBlockNodeCount);
  const topBlockMinY = Math.min(...topBlockNodes.map((node) => node.y));
  const fullBlockTopY = getBlockLayoutY(
    roadmapNodeLayout[0] ?? roadmapNodeLayout[roadmapNodeLayout.length - 1]!,
  );
  const cropTop = Math.max(0, topBlockMinY - fullBlockTopY);

  if (cropTop === 0) {
    return { canvasHeight: innerCanvasHeight, nodes };
  }

  return {
    canvasHeight: innerCanvasHeight - cropTop,
    nodes: nodes.map((node) => ({
      ...node,
      y: node.y - cropTop,
    })),
  };
};
