import React, { useRef, useEffect, useState, useMemo, MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMockupById, GridLayout } from "@/lib/mockup-data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";
import SettingsPanel from "@/components/SettingsPanel";

interface MultiShirtCanvasProps {
  designImage: string | null;
  mockupId: number;
  designSize: number;
  designPosition: string; 
  editModeEnabled?: boolean; // New prop to control edit mode from parent
  onDownload: () => void;
  onSaveSettings?: (settings: PlacementSettings) => void;
  initialSettings?: PlacementSettings;
  onAutoButtonRef?: (fn: () => void) => void;
  onEditButtonRef?: (fn: () => void) => void;
  onGuidesButtonRef?: (fn: () => void) => void;
  onZoomInRef?: (fn: () => void) => void;
  onZoomOutRef?: (fn: () => void) => void;
  // JPEG quality settings
  jpegQuality?: number;
  onJpegQualityChange?: (quality: number) => void;
  onGetLastFileSize?: (size: number | null) => void;
}

// Define a placement settings type
export interface PlacementSettings {
  designWidthFactor: number;
  designHeightFactor: number;
  globalYOffset: number;
  placementSettings: string; // JSON string of shirt configs
}

// Size and position configuration
interface ShirtConfig {
  x: number;
  y: number;
  name: string;
  index: number;
  designOffset: { x: number; y: number };
}

// Define initial shirt positions based on optimal placement data - 2x4 grid (8 shirts)
const INITIAL_SHIRT_POSITIONS_2x4: ShirtConfig[] = [
  // TOP ROW (Left to Right)
  { x: 500, y: 750, name: "White", index: 0, designOffset: { x: 90, y: -90 } },
  { x: 1500, y: 750, name: "Ivory", index: 1, designOffset: { x: 30, y: -75 } },
  { x: 2500, y: 750, name: "Butter", index: 2, designOffset: { x: -45, y: -80 } },
  { x: 3500, y: 750, name: "Banana", index: 3, designOffset: { x: -90, y: -90 } },

  // BOTTOM ROW (Left to Right)
  { x: 500, y: 2250, name: "Mustard", index: 4, designOffset: { x: 95, y: -160 } },
  { x: 1500, y: 2250, name: "Peachy", index: 5, designOffset: { x: 30, y: -180 } },
  { x: 2500, y: 2250, name: "Yam", index: 6, designOffset: { x: -30, y: -170 } },
  { x: 3500, y: 2250, name: "Khaki", index: 7, designOffset: { x: -95, y: -170 } }
];

// Define initial shirt positions for 3x3 grid (9 shirts) - Calvary Apparel Studio mockups
// Canvas is 4000×4000 to match the actual 4125×4125 square source images (1:1 ratio).
// Coordinates derived by scaling the old 4000×3000 measurements by ×(4/3) on the y axis.
// x coordinates are unchanged (same x scale either way).
const INITIAL_SHIRT_POSITIONS_3x3: ShirtConfig[] = [
  // TOP ROW (Left to Right) - chest centers at canvas y≈627
  { x: 670, y: 627, name: "Shirt 1", index: 0, designOffset: { x: 10, y: -173 } },
  { x: 1995, y: 627, name: "Shirt 2", index: 1, designOffset: { x: 5, y: -173 } },
  { x: 3315, y: 620, name: "Shirt 3", index: 2, designOffset: { x: 0, y: -173 } },

  // MIDDLE ROW (Left to Right) - chest centers at canvas y≈1967
  { x: 665, y: 1967, name: "Shirt 4", index: 3, designOffset: { x: 10, y: -227 } },
  { x: 1990, y: 1960, name: "Shirt 5", index: 4, designOffset: { x: 5, y: -227 } },
  { x: 3310, y: 1953, name: "Shirt 6", index: 5, designOffset: { x: 0, y: -227 } },

  // BOTTOM ROW (Left to Right) - chest centers at canvas y≈3307
  { x: 660, y: 3307, name: "Shirt 7", index: 6, designOffset: { x: 10, y: -273 } },
  { x: 1985, y: 3300, name: "Shirt 8", index: 7, designOffset: { x: 5, y: -273 } },
  { x: 3305, y: 3293, name: "Shirt 9", index: 8, designOffset: { x: 0, y: -273 } }
];

// ── Calvary Light 1 — page1_light_v3 (4×2, 8 shirts) ──────────────────────────
// White, Ivory, Butter, Mustard / Peachy, Blossom, Orchid, Crunchberry
// x offsets: same as apparellaUS — shirt chest panels are inset from column edges
// (left shirts lean right, right shirts lean left — confirmed working for Light 1)
// y offsets: compensate for white-space above each shirt row
const INITIAL_SHIRT_POSITIONS_CALVARY_LIGHT1: ShirtConfig[] = [
  { x: 500,  y: 750,  name: "White",       index: 0, designOffset: { x:  90, y: -90  } },
  { x: 1500, y: 750,  name: "Ivory",       index: 1, designOffset: { x:  30, y: -90  } },
  { x: 2500, y: 750,  name: "Butter",      index: 2, designOffset: { x: -45, y: -90  } },
  { x: 3500, y: 750,  name: "Mustard",     index: 3, designOffset: { x: -90, y: -90  } },
  { x: 500,  y: 2250, name: "Peachy",      index: 4, designOffset: { x:  95, y: -170 } },
  { x: 1500, y: 2250, name: "Blossom",     index: 5, designOffset: { x:  30, y: -170 } },
  { x: 2500, y: 2250, name: "Orchid",      index: 6, designOffset: { x: -30, y: -170 } },
  { x: 3500, y: 2250, name: "Crunchberry", index: 7, designOffset: { x: -95, y: -170 } },
];

// ── Calvary Light 2 — page2_light (4×2, 8 shirts) ─────────────────────────────
// Chambray, Lagoon Blue, Bay, Island Reef / Khaki, Yam, Terracotta, Watermelon
const INITIAL_SHIRT_POSITIONS_CALVARY_LIGHT2: ShirtConfig[] = [
  { x: 500,  y: 750,  name: "Chambray",    index: 0, designOffset: { x:  90, y: -90  } },
  { x: 1500, y: 750,  name: "Lagoon Blue", index: 1, designOffset: { x:  30, y: -90  } },
  { x: 2500, y: 750,  name: "Bay",         index: 2, designOffset: { x: -45, y: -90  } },
  { x: 3500, y: 750,  name: "Island Reef", index: 3, designOffset: { x: -90, y: -90  } },
  { x: 500,  y: 2250, name: "Khaki",       index: 4, designOffset: { x:  95, y: -170 } },
  { x: 1500, y: 2250, name: "Yam",         index: 5, designOffset: { x:  30, y: -170 } },
  { x: 2500, y: 2250, name: "Terracotta",  index: 6, designOffset: { x: -30, y: -170 } },
  { x: 3500, y: 2250, name: "Watermelon",  index: 7, designOffset: { x: -95, y: -170 } },
];

// ── Calvary Dark 1 — page3_dark_v3 (5×2, 10 shirts) ──────────────────────────
// Grey, Pepper, Espresso, Black, Brick / Moss, Denim, Blue Spruce, Navy, True Navy
// 5 columns on 4000px: centers at 400,1200,2000,2800,3600 (800px each).
// x offsets scale the apparellaUS pattern to 5 cols: ±70, ±35, 0 (outer→inner→center)
const INITIAL_SHIRT_POSITIONS_CALVARY_DARK1: ShirtConfig[] = [
  { x: 400,  y: 750,  name: "Grey",        index: 0, designOffset: { x:  70, y: -90  } },
  { x: 1200, y: 750,  name: "Pepper",      index: 1, designOffset: { x:  35, y: -90  } },
  { x: 2000, y: 750,  name: "Espresso",    index: 2, designOffset: { x:   0, y: -90  } },
  { x: 2800, y: 750,  name: "Black",       index: 3, designOffset: { x: -35, y: -90  } },
  { x: 3600, y: 750,  name: "Brick",       index: 4, designOffset: { x: -70, y: -90  } },
  { x: 400,  y: 2250, name: "Moss",        index: 5, designOffset: { x:  70, y: -170 } },
  { x: 1200, y: 2250, name: "Denim",       index: 6, designOffset: { x:  35, y: -170 } },
  { x: 2000, y: 2250, name: "Blue Spruce", index: 7, designOffset: { x:   0, y: -170 } },
  { x: 2800, y: 2250, name: "Navy",        index: 8, designOffset: { x: -35, y: -170 } },
  { x: 3600, y: 2250, name: "True Navy",   index: 9, designOffset: { x: -70, y: -170 } },
];

// ── Calvary Dark 2 — page4_dark (5×2, 10 shirts) ──────────────────────────────
// Flo Blue, Royal Caribe, Seafoam, Light Green, Wine / Berry, Crimson, Red, Violet, Blue Jean
const INITIAL_SHIRT_POSITIONS_CALVARY_DARK2: ShirtConfig[] = [
  { x: 400,  y: 750,  name: "Flo Blue",     index: 0, designOffset: { x:  70, y: -90  } },
  { x: 1200, y: 750,  name: "Royal Caribe", index: 1, designOffset: { x:  35, y: -90  } },
  { x: 2000, y: 750,  name: "Seafoam",      index: 2, designOffset: { x:   0, y: -90  } },
  { x: 2800, y: 750,  name: "Light Green",  index: 3, designOffset: { x: -35, y: -90  } },
  { x: 3600, y: 750,  name: "Wine",         index: 4, designOffset: { x: -70, y: -90  } },
  { x: 400,  y: 2250, name: "Berry",        index: 5, designOffset: { x:  70, y: -170 } },
  { x: 1200, y: 2250, name: "Crimson",      index: 6, designOffset: { x:  35, y: -170 } },
  { x: 2000, y: 2250, name: "Red",          index: 7, designOffset: { x:   0, y: -170 } },
  { x: 2800, y: 2250, name: "Violet",       index: 8, designOffset: { x: -35, y: -170 } },
  { x: 3600, y: 2250, name: "Blue Jean",    index: 9, designOffset: { x: -70, y: -170 } },
];

// Keep 2x5 alias for grid position lookups (uses same layout as dark pages)
const INITIAL_SHIRT_POSITIONS_2x5 = INITIAL_SHIRT_POSITIONS_CALVARY_DARK1;

// Define initial shirt positions for MKPrintsUSA (2x4 grid, 8 shirts)
// Effective X/Y positions are derived from apparellaUS's proven calibration.
// MKPrintsUSA source images: 5760×3320 px → scaled to 4000×3000 canvas
// ── MKPrintsUSA Page 1 (ID 10) ────────────────────────────────────────────────
// Navy, Royal Blue, Sapphire, Indigo Blue / Heather Deep Teal, Heather Navy, Purple, Berry
const INITIAL_SHIRT_POSITIONS_MKP1: ShirtConfig[] = [
  { x: 500,  y: 640,  name: "Navy",             index: 0, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 640,  name: "Royal Blue",        index: 1, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 640,  name: "Sapphire",          index: 2, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 640,  name: "Indigo Blue",       index: 3, designOffset: { x:  0, y: 0 } },
  { x: 500,  y: 2130, name: "Heather Deep Teal", index: 4, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 2130, name: "Heather Navy",      index: 5, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 2130, name: "Purple",            index: 6, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 2130, name: "Berry",             index: 7, designOffset: { x:  0, y: 0 } },
];

// ── MKPrintsUSA Page 2 (ID 11) ────────────────────────────────────────────────
// Raspberry Heliconia, Red, Maroon, Heather Maroon / Heather Mauve, Irish Green, Military Green, Forest
const INITIAL_SHIRT_POSITIONS_MKP2: ShirtConfig[] = [
  { x: 500,  y: 640,  name: "Raspberry Heliconia", index: 0, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 640,  name: "Red",                 index: 1, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 640,  name: "Maroon",              index: 2, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 640,  name: "Heather Maroon",      index: 3, designOffset: { x:  0, y: 0 } },
  { x: 500,  y: 2130, name: "Heather Mauve",       index: 4, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 2130, name: "Irish Green",         index: 5, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 2130, name: "Military Green",      index: 6, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 2130, name: "Forest",              index: 7, designOffset: { x:  0, y: 0 } },
];

// ── MKPrintsUSA Page 3 (ID 12) ────────────────────────────────────────────────
// Heather Forest, Brown Savana, Dark Brown, Heather Dark Grey / Charcoal, Gravel, Midnight, Black
const INITIAL_SHIRT_POSITIONS_MKP3: ShirtConfig[] = [
  { x: 500,  y: 640,  name: "Heather Forest",    index: 0, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 640,  name: "Brown Savana",       index: 1, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 640,  name: "Dark Brown",         index: 2, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 640,  name: "Heather Dark Grey",  index: 3, designOffset: { x:  0, y: 0 } },
  { x: 500,  y: 2130, name: "Charcoal",           index: 4, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 2130, name: "Gravel",             index: 5, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 2130, name: "Midnight",           index: 6, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 2130, name: "Black",              index: 7, designOffset: { x:  0, y: 0 } },
];

// ── MKPrintsUSA Page 4 (ID 13) ────────────────────────────────────────────────
// White, Natural, Sand, Daisy / Yellow Haze, Gold, Texas Orange, Coral Silk
const INITIAL_SHIRT_POSITIONS_MKP4: ShirtConfig[] = [
  { x: 500,  y: 640,  name: "White",        index: 0, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 640,  name: "Natural",      index: 1, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 640,  name: "Sand",         index: 2, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 640,  name: "Daisy",        index: 3, designOffset: { x:  0, y: 0 } },
  { x: 500,  y: 2130, name: "Yellow Haze",  index: 4, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 2130, name: "Gold",         index: 5, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 2130, name: "Texas Orange", index: 6, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 2130, name: "Coral Silk",   index: 7, designOffset: { x:  0, y: 0 } },
];

// ── MKPrintsUSA Page 5 (ID 14) ────────────────────────────────────────────────
// Heather Peach, Azalea, Light Pink, Violet / Light Blue, Sport Grey, Ash, Mint
const INITIAL_SHIRT_POSITIONS_MKP5: ShirtConfig[] = [
  { x: 500,  y: 640,  name: "Heather Peach", index: 0, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 640,  name: "Azalea",        index: 1, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 640,  name: "Light Pink",    index: 2, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 640,  name: "Violet",        index: 3, designOffset: { x:  0, y: 0 } },
  { x: 500,  y: 2130, name: "Light Blue",    index: 4, designOffset: { x: 15, y: 0 } },
  { x: 1500, y: 2130, name: "Sport Grey",    index: 5, designOffset: { x: 10, y: 0 } },
  { x: 2500, y: 2130, name: "Ash",           index: 6, designOffset: { x:  5, y: 0 } },
  { x: 3500, y: 2130, name: "Mint",          index: 7, designOffset: { x:  0, y: 0 } },
];

// Legacy alias (kept for any code that referenced the old single array)
const INITIAL_SHIRT_POSITIONS_MKPrintsUSA = INITIAL_SHIRT_POSITIONS_MKP1;

// Keep for backward compatibility
const INITIAL_SHIRT_POSITIONS = INITIAL_SHIRT_POSITIONS_2x4;

// MKPrintsUSA mockup IDs (10-14)
const MKPRINTS_MOCKUP_IDS = new Set([10, 11, 12, 13, 14]);

// Helper to get initial positions based on grid layout and mockup id
function getInitialShirtPositions(gridLayout: GridLayout, mockupId?: number): ShirtConfig[] {
  if (gridLayout === "3x3") return INITIAL_SHIRT_POSITIONS_3x3;
  // Calvary pages — each has its own named position array
  if (mockupId === 6) return INITIAL_SHIRT_POSITIONS_CALVARY_LIGHT1;
  if (mockupId === 7) return INITIAL_SHIRT_POSITIONS_CALVARY_LIGHT2;
  if (mockupId === 8) return INITIAL_SHIRT_POSITIONS_CALVARY_DARK1;
  if (mockupId === 9) return INITIAL_SHIRT_POSITIONS_CALVARY_DARK2;
  // MKPrintsUSA — each page has its own color names
  if (mockupId === 10) return INITIAL_SHIRT_POSITIONS_MKP1;
  if (mockupId === 11) return INITIAL_SHIRT_POSITIONS_MKP2;
  if (mockupId === 12) return INITIAL_SHIRT_POSITIONS_MKP3;
  if (mockupId === 13) return INITIAL_SHIRT_POSITIONS_MKP4;
  if (mockupId === 14) return INITIAL_SHIRT_POSITIONS_MKP5;
  return INITIAL_SHIRT_POSITIONS_2x4;
}

// ─── Server-side layout type ──────────────────────────────────────────────────
// Saved layout for each mockup page — stored in /data/mockup-layouts.json on the
// server so it persists across browser clears and different devices.
export interface MockupLayout {
  shirtConfigs: ShirtConfig[];
  globalXOffset: number;
  globalYOffset: number;
  designWidthFactor: number;
  designHeightFactor: number;
  circleRadius?: number;
}

interface CustomPreset {
  name: string;
  widthFactor: number;
  heightFactor: number;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function MultiShirtCanvas({
  designImage,
  mockupId,
  designSize,
  designPosition,
  editModeEnabled = false, // Default to not showing edit panel
  onDownload,
  onSaveSettings,
  initialSettings,
  onAutoButtonRef,
  onEditButtonRef,
  onGuidesButtonRef,
  onZoomInRef,
  onZoomOutRef,
  jpegQuality: externalJpegQuality,
  onJpegQualityChange,
  onGetLastFileSize
}: MultiShirtCanvasProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mockupImg, setMockupImg] = useState<HTMLImageElement | null>(null);
  const [designImg, setDesignImg] = useState<HTMLImageElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100); // Full size view
  // Canvas height matches the mockup's natural aspect ratio:
  //   3x3 (Calvary) images are 4125×4125 (square) → use 4000×4000
  //   2x4 images are 4000×3000 → keep 4000×3000
  const canvasSize = useMemo(() => {
    const m = getMockupById(mockupId);
    // 3x3 (Calvary old) images are square → 4000×4000; all others → 4000×3000
    return { width: 4000, height: m?.gridLayout === "3x3" ? 4000 : 3000 };
  }, [mockupId]);
  const [showDebugAreas, setShowDebugAreas] = useState(true); 

  // Preset configurations for different aspect ratios
  interface DesignPreset {
    name: string;
    description: string;
    widthFactor: number;
    heightFactor: number;
    forRatio: string;
    globalXOffset: number;
    globalYOffset: number;
  }

  // Built-in presets: each stores its own size AND default position.
  // globalYOffset -200 = standard center-chest position for 2x4 grids.
  const DESIGN_PRESETS: DesignPreset[] = [
    {
      name: "Wide Banner",
      description: "For wide horizontal designs (ratio > 2:1)",
      widthFactor: 600,
      heightFactor: 200,
      forRatio: "> 2:1",
      globalXOffset: 0,
      globalYOffset: -200,
    },
    {
      name: "Landscape",
      description: "For landscape designs (ratio 4:3, 16:9)",
      widthFactor: 500,
      heightFactor: 300,
      forRatio: "4:3 to 16:9",
      globalXOffset: 0,
      globalYOffset: -200,
    },
    {
      name: "Square",
      description: "For square designs (ratio 1:1)",
      widthFactor: 400,
      heightFactor: 400,
      forRatio: "~1:1",
      globalXOffset: 0,
      globalYOffset: -200,
    },
    {
      name: "Portrait",
      description: "For portrait designs (ratio 3:4, 9:16)",
      widthFactor: 300,
      heightFactor: 450,
      forRatio: "3:4 to 9:16",
      globalXOffset: 0,
      globalYOffset: -200,
    },
    {
      name: "Tall",
      description: "For tall vertical designs (ratio < 1:2)",
      widthFactor: 250,
      heightFactor: 550,
      forRatio: "< 1:2",
      globalXOffset: 0,
      globalYOffset: -200,
    },
    {
      name: "Pocket",
      description: "Small pocket / chest logo design",
      widthFactor: 150,
      heightFactor: 150,
      forRatio: "~1:1 small",
      globalXOffset: 0,
      globalYOffset: -200,
    }
  ];

  // Get current mockup's grid layout
  const currentMockup = getMockupById(mockupId);
  const currentGridLayout: GridLayout = currentMockup?.gridLayout || "2x4";

  // Design placement adjustment controls
  const [shirtConfigs, setShirtConfigs] = useState<ShirtConfig[]>(() => getInitialShirtPositions(currentGridLayout, mockupId));
  const [selectedShirt, setSelectedShirt] = useState<number>(0);
  const [globalYOffset, setGlobalYOffset] = useState(-200);  // Default offset based on optimal positioning
  const [globalXOffset, setGlobalXOffset] = useState(0);  // Default X offset at center
  const [editMode, setEditMode] = useState<'none' | 'all' | 'individual'>('none');
  const [designWidthFactor, setDesignWidthFactor] = useState(450); // Default design width for avg design
  const [designHeightFactor, setDesignHeightFactor] = useState(300); // Default design height
  const [circleRadius, setCircleRadius] = useState(150); // Radius of landing-circle indicator
  const [syncAll, setSyncAll] = useState(true); // Sync all shirts by default
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null); // Track selected preset

  // Track the previous grid layout to detect layout changes
  const [prevGridLayout, setPrevGridLayout] = useState<GridLayout | null>(null);

  // ── Server-side layout load/save ──────────────────────────────────────────
  const queryClient = useQueryClient();

  // Fetch saved layout from server. The full URL is in queryKey[0] so the
  // default fetcher hits the right endpoint. 404 = no saved layout (that's fine).
  const layoutUrl = `/api/layouts/${mockupId}`;
  const { data: savedLayout } = useQuery<MockupLayout>({
    queryKey: [layoutUrl],
    retry: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  const { data: customPresets = [], refetch: refetchPresets } = useQuery<CustomPreset[]>({
    queryKey: ["/api/presets"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const savePresetMutation = useMutation({
    mutationFn: (preset: CustomPreset) => apiRequest("POST", "/api/presets", preset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Preset saved", description: "Your custom preset has been saved." });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save preset.", variant: "destructive" });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (name: string) => apiRequest("DELETE", `/api/presets/${encodeURIComponent(name)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      toast({ title: "Preset deleted" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (layout: MockupLayout) =>
      apiRequest("PUT", layoutUrl, layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [layoutUrl] });
      toast({ title: "Layout saved", description: "Positions saved — they'll reload on any browser or device." });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save to server.", variant: "destructive" });
    },
  });

  const resetLayoutMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", layoutUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [layoutUrl] });
    },
  });

  // Apply hardcoded defaults whenever the mockup page changes (instant — no flicker)
  useEffect(() => {
    const mockup = getMockupById(mockupId);
    if (!mockup) return;
    setShirtConfigs(getInitialShirtPositions(mockup.gridLayout, mockupId));
    setGlobalXOffset(0);
    setGlobalYOffset(mockup.gridLayout === "3x3" ? 0 : -200); // 2x4 and 2x5 use -200
    setDesignWidthFactor(450);
    setDesignHeightFactor(300);
    setSelectedShirt(0);
    setPrevGridLayout(mockup.gridLayout);
  }, [mockupId]);

  // Once server layout arrives (after the defaults above), override with saved values.
  useEffect(() => {
    if (!savedLayout) return;
    setShirtConfigs(savedLayout.shirtConfigs);
    setGlobalXOffset(savedLayout.globalXOffset);
    setGlobalYOffset(savedLayout.globalYOffset);
    if (savedLayout.designWidthFactor) setDesignWidthFactor(savedLayout.designWidthFactor);
    if (savedLayout.designHeightFactor) setDesignHeightFactor(savedLayout.designHeightFactor);
    if (savedLayout.circleRadius != null) setCircleRadius(savedLayout.circleRadius);
  }, [savedLayout]);
  // ─────────────────────────────────────────────────────────────────────────

  // Mutable refs to always-current function versions — initialized with no-ops,
  // updated below after each function is defined. This breaks the stale-closure
  // problem that caused Auto to use the original mockupId after switching shops.
  const autoPositionRef = useRef<() => void>(() => {});
  const toggleEditModeRef = useRef<() => void>(() => {});
  const toggleDebugAreasRef = useRef<() => void>(() => {});
  const handleZoomInRef = useRef<() => void>(() => {});
  const handleZoomOutRef = useRef<() => void>(() => {});

  // Expose functions to parent component through refs — runs once on mount.
  // Forwards through the *Ref pointers so the parent always calls the latest version.
  useEffect(() => {
    if (onAutoButtonRef) onAutoButtonRef(() => {
      console.log("Auto position callback called from parent");
      autoPositionRef.current();
    });
    if (onEditButtonRef) onEditButtonRef(() => toggleEditModeRef.current());
    if (onGuidesButtonRef) onGuidesButtonRef(() => toggleDebugAreasRef.current());
    if (onZoomInRef) onZoomInRef(() => handleZoomInRef.current());
    if (onZoomOutRef) onZoomOutRef(() => handleZoomOutRef.current());
  }, []);

  // We'll handle downloads directly through the hidden button now

  // Sync edit mode with parent component
  useEffect(() => {
    setEditMode(editModeEnabled ? 'all' : 'none');
  }, [editModeEnabled]);

  // Initialize canvas with exact mockup dimensions
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set initial canvas background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [canvasSize]);

  // Load mockup image when mockup ID changes
  useEffect(() => {
    const mockup = getMockupById(mockupId);
    if (mockup) {
      const img = new Image();
      img.onload = () => {
        setMockupImg(img);
      };
      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load mockup image",
          variant: "destructive",
        });
      };
      img.src = mockup.src;
    }
  }, [mockupId, toast]);

  // Load design image when it changes
  useEffect(() => {
    if (designImage) {
      const img = new Image();
      img.onload = () => {
        setDesignImg(img);
      };
      img.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load design image",
          variant: "destructive",
        });
      };
      img.src = designImage;
    } else {
      setDesignImg(null);
    }
  }, [designImage, toast]);

  // Load initial placement settings when provided
  useEffect(() => {
    if (initialSettings) {
      // Set design width and height
      setDesignWidthFactor(initialSettings.designWidthFactor);
      setDesignHeightFactor(initialSettings.designHeightFactor);

      // Set global Y offset
      setGlobalYOffset(initialSettings.globalYOffset);

      // Set shirt configurations if available
      if (initialSettings.placementSettings) {
        try {
          const parsedSettings = JSON.parse(initialSettings.placementSettings);
          // Accept both 8 (2x4 grid) and 9 (3x3 grid) shirt configurations
          if (Array.isArray(parsedSettings) && (parsedSettings.length === 8 || parsedSettings.length === 9)) {
            setShirtConfigs(parsedSettings);
          }
        } catch (error) {
          console.error("Failed to parse saved shirt configurations:", error);
        }
      }

      // Automatically enable edit mode for better user experience
      setEditMode('all');
    }
  }, [initialSettings]);

  // Handle mouse click on canvas for selecting shirts
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || editMode === 'none') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate click position adjusted for canvas scaling and zoom
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX * (100 / zoomLevel);
    const clickY = (e.clientY - rect.top) * scaleY * (100 / zoomLevel);

    // Find the nearest shirt within a generous hit radius
    let nearestIdx = -1;
    let nearestDist = Infinity;
    shirtConfigs.forEach((shirt, idx) => {
      const skipPositions = currentMockup?.skipPositions || [];
      if (skipPositions.includes(idx)) return;
      const dist = Math.sqrt(Math.pow(clickX - shirt.x, 2) + Math.pow(clickY - shirt.y, 2));
      if (dist < nearestDist) { nearestDist = dist; nearestIdx = idx; }
    });

    // Accept click if within ~600px of the nearest shirt center
    if (nearestIdx !== -1 && nearestDist < 600) {
      setSelectedShirt(nearestIdx);
      if (syncAll) setSyncAll(false);
    }
  };

  // Function to update a specific shirt's position
  const updateShirtOffset = (index: number, xOffset: number, yOffset: number) => {
    setShirtConfigs(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        designOffset: {
          x: xOffset,
          y: yOffset
        }
      };
      return updated;
    });
  };

  // Update all shirts with the same offset
  const updateAllShirtsOffset = (xOffset: number, yOffset: number) => {
    setShirtConfigs(prev => {
      return prev.map(shirt => ({
        ...shirt,
        designOffset: {
          x: xOffset,
          y: yOffset
        }
      }));
    });
  };

  // Handle X offset change
  const handleXOffsetChange = (value: number) => {
    if (syncAll) {
      updateAllShirtsOffset(value, shirtConfigs[0].designOffset.y);
    } else {
      updateShirtOffset(selectedShirt, value, shirtConfigs[selectedShirt].designOffset.y);
    }
  };

  // Handle Y offset change
  const handleYOffsetChange = (value: number) => {
    if (syncAll) {
      updateAllShirtsOffset(shirtConfigs[0].designOffset.x, value);
    } else {
      updateShirtOffset(selectedShirt, shirtConfigs[selectedShirt].designOffset.x, value);
    }
  };

  // Reset positions to default optimal settings and clear any server-saved overrides
  const resetPositions = () => {
    resetLayoutMutation.mutate();
    setShirtConfigs(getInitialShirtPositions(currentGridLayout, mockupId));
    setGlobalXOffset(0);
    setGlobalYOffset(currentGridLayout === "3x3" ? 0 : -200); // 2x4 and 2x5 both use -200
    setDesignWidthFactor(450);
    setDesignHeightFactor(300);
    setSelectedPreset(null);
    toast({ title: "Positions reset", description: "Reverted to default placement for this page." });
  };

  // Apply a preset based on index
  const applyPreset = (presetIndex: number) => {
    if (presetIndex >= 0 && presetIndex < DESIGN_PRESETS.length) {
      const preset = DESIGN_PRESETS[presetIndex];
      setDesignWidthFactor(preset.widthFactor);
      setDesignHeightFactor(preset.heightFactor);
      setGlobalXOffset(preset.globalXOffset);
      setGlobalYOffset(preset.globalYOffset);
      setSelectedPreset(presetIndex);
    }
  };

  // Auto-position based on the design's dimensions
  const autoPosition = () => {
    console.log("AutoPosition function called directly");
    if (!designImg) {
      toast({
        title: "No Design",
        description: "Please upload a design first to use auto-positioning",
        variant: "destructive"
      });
      return;
    }

    // Reset positions first for consistency
    setShirtConfigs(getInitialShirtPositions(currentGridLayout, mockupId));

    // Calculate the aspect ratio
    const aspectRatio = designImg.width / designImg.height;

    /**
     * IMPORTANT INSIGHT:
     * When using presets, we need to account for the additional multipliers that get applied in drawDesignsOnShirts():
     * - For portrait (aspectRatio < 0.7): width gets multiplied by 0.6 and height by 1.5
     * - For square (0.7 <= aspectRatio <= 1.3): width gets multiplied by 0.8 and height by 1.2 
     * 
     * So we need to counteract these multipliers by adjusting our preset values.
     */

    // Check if the design is an SVG by looking at its source
    const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                      designImage?.toLowerCase().startsWith('data:image/svg+xml');

    // For 3x3 grid, all positioning is built into designOffset, so globalYOffset = 0
    // For 2x4 grid, use globalYOffset for vertical adjustment
    let yOffset = currentGridLayout === "3x3" ? 0 : -200;

    // Choose preset and adjust for the right appearance
    if (aspectRatio > 2.0) {
      // Very wide - use wide banner preset
      setSelectedPreset(0);
      setDesignWidthFactor(DESIGN_PRESETS[0].widthFactor);
      setDesignHeightFactor(DESIGN_PRESETS[0].heightFactor);
      if (currentGridLayout !== "3x3") yOffset = -150; // Wide designs a bit lower (2x4 only)
    } 
    else if (aspectRatio > 1.3) {
      // Standard landscape designs
      setSelectedPreset(1);
      setDesignWidthFactor(DESIGN_PRESETS[1].widthFactor);
      setDesignHeightFactor(DESIGN_PRESETS[1].heightFactor);
      if (currentGridLayout !== "3x3") yOffset = -180;
    }
    else if (aspectRatio >= 0.7 && aspectRatio <= 1.3) {
      // Square designs
      setSelectedPreset(2);
      setDesignWidthFactor(DESIGN_PRESETS[2].widthFactor);
      setDesignHeightFactor(DESIGN_PRESETS[2].heightFactor);
      if (currentGridLayout !== "3x3") yOffset = -200;
    }
    else if (aspectRatio >= 0.4 && aspectRatio < 0.7) {
      // Portrait designs need larger size to counteract the 0.6 width multiplier
      // Use square preset but with adjusted values
      setSelectedPreset(2); // Still use square preset...

      // The drawDesignsOnShirts function will multiply width by 0.6 and height by 1.5
      // So we need to counter that by dividing width by 0.6 (multiplying by 1.67)
      // and dividing height by 1.5 (multiplying by 0.67)
      const adjustedWidth = Math.round(DESIGN_PRESETS[2].widthFactor * 1.67);
      const adjustedHeight = Math.round(DESIGN_PRESETS[2].heightFactor * 0.67);

      setDesignWidthFactor(adjustedWidth);
      setDesignHeightFactor(adjustedHeight);

      // Position portrait designs a bit lower than square designs (2x4 only)
      if (currentGridLayout !== "3x3") yOffset = -180;
    }
    else {
      // Very tall designs (aspectRatio < 0.4) need even more width adjustment
      setSelectedPreset(2); // Still use square preset...

      // The drawDesignsOnShirts function will multiply width by 0.6 and height by 1.5
      // For very tall designs, we need to counter even more
      const adjustedWidth = Math.round(DESIGN_PRESETS[2].widthFactor * 1.9); // Even more width
      const adjustedHeight = Math.round(DESIGN_PRESETS[2].heightFactor * 0.67);

      setDesignWidthFactor(adjustedWidth);
      setDesignHeightFactor(adjustedHeight);

      // Position tall designs at similar position to portrait (2x4 only)
      if (currentGridLayout !== "3x3") yOffset = -180;
    }

    // If it's an SVG, adjust the position to compensate for the larger scaling factor
    // SVGs are scaled by 1.5x in the rendering process, so need to position higher (2x4 only)
    if (isSvgImage && currentGridLayout !== "3x3") {
      yOffset -= 70; // SVGs should be positioned higher
    }

    // Apply calculated Y offset
    setGlobalYOffset(yOffset);

    // Force All Shirts mode but don't change edit mode
    // (let the parent component control this)
    setSyncAll(true);

    // Prepare appropriate description for toast - make it clearer what's happening
    let description;
    if (aspectRatio < 0.7) {
      const designType = (aspectRatio < 0.4) ? "tall" : "portrait";
      const size = `${designWidthFactor}×${designHeightFactor}`;
      description = `${designType.toUpperCase()} design optimized with size ${size} at Y=${yOffset}px`;
    } else {
      const presetName = DESIGN_PRESETS[getSelectedPresetIndex(aspectRatio)].name;
      description = `Applied "${presetName}" preset at Y=${yOffset}px`;
    }

    toast({
      title: "Auto-Positioned",
      description
    });
  };

  // Helper to get preset index based on aspect ratio
  const getSelectedPresetIndex = (aspectRatio: number): number => {
    if (aspectRatio > 2.0) return 0; // Wide banner
    if (aspectRatio > 1.3) return 1; // Landscape
    if (aspectRatio >= 0.7) return 2; // Square
    if (aspectRatio >= 0.4) return 3; // Portrait
    return 4; // Tall
  };

  // Draw canvas when any inputs change
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw mockup image
    if (mockupImg) {
      ctx.drawImage(mockupImg, 0, 0, canvas.width, canvas.height);

      // Draw designs if available
      if (designImg) {
        drawDesignsOnShirts(ctx);
      }

      // Always draw guides when settings panel is open; otherwise respect toggle
      if (editMode !== 'none' || showDebugAreas) {
        drawDebugAreas(ctx);
      }
    }
  }, [
    mockupImg, 
    designImg, 
    designSize, 
    showDebugAreas,
    editMode,
    selectedShirt, 
    shirtConfigs, 
    globalYOffset,
    globalXOffset,
    designWidthFactor,
    designHeightFactor,
    circleRadius,
  ]);

  // Draw designs on shirts based on configs
  const drawDesignsOnShirts = (ctx: CanvasRenderingContext2D) => {
    if (!designImg) return;

    // Get design's aspect ratio
    const aspectRatio = designImg.width / designImg.height;

    // Check if the design is an SVG by looking at its source or other characteristics
    // SVG images typically have perfect 1:1 pixel ratio regardless of content
    const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                      designImage?.toLowerCase().startsWith('data:image/svg+xml');

    // SVG scaling factor - we'll make SVGs larger by default
    const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

    // Get skip positions for current mockup
    const skipPositions = currentMockup?.skipPositions || [];

    // Place design on each shirt position
    shirtConfigs.forEach((shirt) => {
      // Skip positions that have logos or should not have designs
      if (skipPositions.includes(shirt.index)) {
        return;
      }
      // Calculate design dimensions based on aspect ratio
      let areaWidth, areaHeight;

      if (aspectRatio > 2.0) {
        // Very wide design (banner/text like "overstimulated")
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor / 2;
      } else if (aspectRatio > 1.3) {
        // Landscape design (like "ARE WE GREAT YET?")
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor;
      } else if (aspectRatio < 0.7) {
        // Tall/portrait design (like the bear design)
        areaWidth = designWidthFactor * 0.6;
        areaHeight = designHeightFactor * 1.5;
      } else {
        // Square-ish design (like the # symbol)
        areaWidth = designWidthFactor * 0.8;
        areaHeight = designHeightFactor * 1.2;
      }

      // Apply SVG scaling factor if detected
      if (isSvgImage) {
        areaWidth = areaWidth * svgScaleFactor;
        areaHeight = areaHeight * svgScaleFactor;
      }

      // Apply user's size preference 
      areaWidth = areaWidth * (designSize / 100);
      areaHeight = areaHeight * (designSize / 100);

      // Calculate final design dimensions preserving aspect ratio
      let designWidth, designHeight;

      if (aspectRatio > areaWidth / areaHeight) {
        // Width-constrained
        designWidth = areaWidth;
        designHeight = designWidth / aspectRatio;
      } else {
        // Height-constrained
        designHeight = areaHeight;
        designWidth = designHeight * aspectRatio;
      }

      // Draw the design with offsets
      const designX = shirt.x + shirt.designOffset.x + globalXOffset;
      const designY = shirt.y + shirt.designOffset.y + globalYOffset;

      // Draw from top point instead of center
      ctx.drawImage(
        designImg,
        designX - (designWidth / 2),
        designY, // No longer subtracting half the height
        designWidth,
        designHeight
      );
    });
  };

  // Draw debug visualizations and position guides.
  // Works with OR without a loaded design — so the user can set up positioning
  // before uploading a file.
  const drawDebugAreas = (ctx: CanvasRenderingContext2D) => {
    // Get skip positions for current mockup
    const skipPositions = currentMockup?.skipPositions || [];

    // Determine box dimensions:
    // If a design is loaded → mimic the real rendering dimensions.
    // If no design → use designWidthFactor × designHeightFactor directly.
    const aspectRatio = designImg ? designImg.width / designImg.height : 1;
    const isSvgImage = designImg && (
      designImage?.toLowerCase().includes('.svg') ||
      designImage?.toLowerCase().startsWith('data:image/svg+xml')
    );
    const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

    const computeBox = (): { w: number; h: number } => {
      if (!designImg) {
        // No design — show a representative box using raw width × height factors
        return {
          w: designWidthFactor * (designSize / 100),
          h: designHeightFactor * (designSize / 100),
        };
      }
      let areaWidth: number, areaHeight: number;
      if (aspectRatio > 2.0) {
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor / 2;
      } else if (aspectRatio > 1.3) {
        areaWidth = designWidthFactor;
        areaHeight = designHeightFactor;
      } else if (aspectRatio < 0.7) {
        areaWidth = designWidthFactor * 0.6;
        areaHeight = designHeightFactor * 1.5;
      } else {
        areaWidth = designWidthFactor * 0.8;
        areaHeight = designHeightFactor * 1.2;
      }
      if (isSvgImage) { areaWidth *= svgScaleFactor; areaHeight *= svgScaleFactor; }
      areaWidth *= (designSize / 100);
      areaHeight *= (designSize / 100);
      return { w: areaWidth, h: areaHeight };
    };

    const { w: areaWidth, h: areaHeight } = computeBox();

    shirtConfigs.forEach((shirt, index) => {
      if (skipPositions.includes(shirt.index)) return;

      const isSelected = index === selectedShirt;

      const designX = shirt.x + shirt.designOffset.x + globalXOffset;
      const designY = shirt.y + shirt.designOffset.y + globalYOffset;

      // --- Placement box ---
      // Use bright gold for selected (visible on dark & light), soft gold for others.
      // Draw a semi-transparent filled rect + a crisp stroke so it shows on any colour.
      const boxX = designX - areaWidth / 2;
      const boxY = designY;

      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.fillRect(boxX, boxY, areaWidth, areaHeight);
        ctx.strokeStyle = 'rgba(255, 200, 0, 1)';
        ctx.lineWidth = 20;
        ctx.setLineDash([60, 30]);
      } else {
        ctx.fillStyle = 'rgba(255, 80, 0, 0.15)';
        ctx.fillRect(boxX, boxY, areaWidth, areaHeight);
        ctx.strokeStyle = 'rgba(255, 80, 0, 0.9)';
        ctx.lineWidth = 12;
        ctx.setLineDash([40, 20]);
      }
      ctx.strokeRect(boxX, boxY, areaWidth, areaHeight);
      ctx.setLineDash([]); // reset

      // --- Crosshair at design anchor ---
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? 'rgba(255, 200, 0, 1)' : 'rgba(255, 80, 0, 0.8)';
      ctx.lineWidth = isSelected ? 14 : 8;
      ctx.moveTo(designX - 80, designY);
      ctx.lineTo(designX + 80, designY);
      ctx.moveTo(designX, designY - 80);
      ctx.lineTo(designX, designY + 80);
      ctx.stroke();

      // --- Label (with black shadow for legibility on any background) ---
      ctx.font = 'bold 72px Arial';
      const label = isSelected
        ? `▶ ${shirt.name}  [x:${shirt.designOffset.x + globalXOffset} y:${shirt.designOffset.y + globalYOffset}]`
        : shirt.name;

      ctx.shadowColor = 'rgba(0,0,0,1)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = isSelected ? 'rgba(255, 220, 0, 1)' : 'rgba(255, 255, 255, 1)';
      ctx.fillText(label, designX + 90, designY - 20);
      ctx.shadowBlur = 0;

      // --- Size info for selected shirt ---
      if (isSelected) {
        ctx.font = 'bold 56px Arial';
        ctx.fillStyle = 'rgba(255, 220, 0, 1)';
        ctx.shadowColor = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 12;
        ctx.fillText(`W:${Math.round(areaWidth)} H:${Math.round(areaHeight)}`, designX + 90, designY + 60);
        ctx.shadowBlur = 0;
      }
    });
  };

  // Toggle debug overlay
  const toggleDebugAreas = () => {
    setShowDebugAreas(prev => !prev);
  };

  // Toggle edit mode (simplified to just on/off for better parent component integration)
  // We're now being controlled by the parent, so this just serves as an API for the parent
  const toggleEditMode = () => {
    // This no longer updates internal state directly, parent will handle it
    // Parent component is listening via the callback reference
  };

  // Toggle sync all shirts
  const toggleSyncMode = () => {
    setSyncAll(prev => !prev);
  };

  // JPEG quality setting for download
  const [jpegQuality, setJpegQuality] = useState<number>(externalJpegQuality || 85); // Use external value if provided
  const [lastFileSize, setLastFileSize] = useState<number | null>(null); // To store actual file size

  // Update internal quality if external prop changes
  useEffect(() => {
    if (externalJpegQuality && externalJpegQuality !== jpegQuality) {
      setJpegQuality(externalJpegQuality);
    }
  }, [externalJpegQuality]);

  // Expose jpeg quality and file size to parent
  useEffect(() => {
    // Pass quality changes back to parent
    if (onJpegQualityChange && jpegQuality !== externalJpegQuality) {
      onJpegQualityChange(jpegQuality);
    }

    // Pass file size back to parent
    if (onGetLastFileSize && lastFileSize !== null) {
      onGetLastFileSize(lastFileSize);
    }

    // Calculate estimated file size when jpegQuality changes
    if (designImg && mockupImg) {
      calculateFileSize();
    }
  }, [jpegQuality, lastFileSize, designImg, mockupImg, onJpegQualityChange, onGetLastFileSize]);

  // Handle mockup download
  const handleDownload = () => {
    if (!canvasRef.current || !designImg || !mockupImg) {
      toast({
        title: "Error",
        description: "Please upload a design image before downloading",
        variant: "destructive",
      });
      return;
    }

    // Create a temporary canvas for the download (without debug markers)
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = canvasSize.width;
    downloadCanvas.height = canvasSize.height;
    const downloadCtx = downloadCanvas.getContext('2d');

    if (downloadCtx) {
      // Draw mockup
      downloadCtx.drawImage(mockupImg, 0, 0, canvasSize.width, canvasSize.height);

      // Draw designs without debug markers
      if (designImg) {
        // Get design's aspect ratio
        const aspectRatio = designImg.width / designImg.height;

        // Check if the design is an SVG by looking at its source
        const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                          designImage?.toLowerCase().startsWith('data:image/svg+xml');

        // SVG scaling factor - we'll make SVGs larger by default
        const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

        // Place design on each shirt position
        shirtConfigs.forEach((shirt) => {
          // Calculate design dimensions based on aspect ratio
          let areaWidth, areaHeight;

          if (aspectRatio > 2.0) {
            areaWidth = designWidthFactor;
            areaHeight = designHeightFactor / 2;
          } else if (aspectRatio > 1.3) {
            areaWidth = designWidthFactor;
            areaHeight = designHeightFactor;
          } else if (aspectRatio < 0.7) {
            areaWidth = designWidthFactor * 0.6;
            areaHeight = designHeightFactor * 1.5;
          } else {
            areaWidth = designWidthFactor * 0.8;
            areaHeight = designHeightFactor * 1.2;
          }

          // Apply SVG scaling factor if detected
          if (isSvgImage) {
            areaWidth = areaWidth * svgScaleFactor;
            areaHeight = areaHeight * svgScaleFactor;
          }

          // Apply user's size preference 
          areaWidth = areaWidth * (designSize / 100);
          areaHeight = areaHeight * (designSize / 100);

          // Calculate final design dimensions preserving aspect ratio
          let designWidth, designHeight;

          if (aspectRatio > areaWidth / areaHeight) {
            // Width-constrained
            designWidth = areaWidth;
            designHeight = designWidth / aspectRatio;
          } else {
            // Height-constrained
            designHeight = areaHeight;
            designWidth = designHeight * aspectRatio;
          }

          // Draw the design with offsets
          const designX = shirt.x + shirt.designOffset.x + globalXOffset;
          const designY = shirt.y + shirt.designOffset.y + globalYOffset;

          // Draw from top point instead of center for download too
          downloadCtx.drawImage(
            designImg,
            designX - (designWidth / 2),
            designY, // No longer subtracting half the height
            designWidth,
            designHeight
          );
        });
      }

      // Get canvas data URL as JPEG with quality setting
      const dataURL = downloadCanvas.toDataURL('image/jpeg', jpegQuality / 100);

      // Calculate file size
      const binaryString = atob(dataURL.split(',')[1]);
      const fileSizeBytes = binaryString.length;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      setLastFileSize(fileSizeMB);

      // Create download link
      const link = document.createElement('a');
link.download = `tshirt-mockup-${mockupId}.jpg`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Downloaded JPEG (${fileSizeMB.toFixed(2)}MB at ${jpegQuality}% quality)`,
      });

      onDownload();
    }
  };

  // Generate a sample file to get an exact size estimate without downloading
  const calculateFileSize = () => {
    if (!canvasRef.current || !designImg || !mockupImg) {
      return; // Can't calculate without images
    }

    // Create a temporary canvas for size calculation
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = canvasSize.width;
    downloadCanvas.height = canvasSize.height;
    const downloadCtx = downloadCanvas.getContext('2d');

    if (downloadCtx) {
      // Draw mockup
      downloadCtx.drawImage(mockupImg, 0, 0, canvasSize.width, canvasSize.height);

      // Draw designs without debug markers
      if (designImg) {
        // Get design's aspect ratio
        const aspectRatio = designImg.width / designImg.height;

        // Check if the design is an SVG by looking at its source
        const isSvgImage = designImage?.toLowerCase().includes('.svg') || 
                          designImage?.toLowerCase().startsWith('data:image/svg+xml');

        // SVG scaling factor - consistent with drawing function
        const svgScaleFactor = isSvgImage ? 1.5 : 1.0;

        // Just draw a single shirt to save processing time
        const shirt = shirtConfigs[0];

        // Use the same calculation logic as the draw function
        let areaWidth = designWidthFactor;
        let areaHeight = designHeightFactor;

        // Apply SVG scaling if detected
        if (isSvgImage) {
          areaWidth = areaWidth * svgScaleFactor;
          areaHeight = areaHeight * svgScaleFactor;
        }

        // Apply user's size preference 
        areaWidth = areaWidth * (designSize / 100);
        areaHeight = areaHeight * (designSize / 100);

        // Calculate final design dimensions preserving aspect ratio
        let designWidth, designHeight;

        if (aspectRatio > areaWidth / areaHeight) {
          designWidth = areaWidth;
          designHeight = designWidth / aspectRatio;
        } else {
          designHeight = areaHeight;
          designWidth = designHeight * aspectRatio;
        }

        // Draw the design with offsets
        const designX = shirt.x + shirt.designOffset.x + globalXOffset;
        const designY = shirt.y + shirt.designOffset.y + globalYOffset;

        downloadCtx.drawImage(
          designImg,
          designX - (designWidth / 2),
          designY,
          designWidth,
          designHeight
        );
      }

      // Generate the data URL at the current quality
      const dataURL = downloadCanvas.toDataURL('image/jpeg', jpegQuality / 100);

      // Calculate file size
      const binaryString = atob(dataURL.split(',')[1]);
      const fileSizeBytes = binaryString.length;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);

      // Update the last file size
      setLastFileSize(fileSizeMB);

      toast({
        description: `JPEG file size at ${jpegQuality}% quality: ${fileSizeMB.toFixed(2)}MB`,
      });
    }
  };

  // Generate position data for developer
  const generatePositionData = () => {
    const data = {
      designWidthFactor,
      designHeightFactor,
      globalYOffset,
      positions: shirtConfigs.map(s => ({
        name: s.name,
        x: s.x + s.designOffset.x + globalXOffset, 
        y: s.y + s.designOffset.y + globalYOffset
      }))
    };

    console.log('=== POSITION DATA FOR DEVELOPER ===');
    console.log(JSON.stringify(data, null, 2));

    toast({
      title: "Position Data Generated",
      description: "Check browser console for copy-paste data",
    });

    return data;
  };

  // Save placement settings to project
  const saveSettings = () => {
    if (!designImage) {
      toast({
        title: "Error",
        description: "Please upload a design image before saving settings",
        variant: "destructive",
      });
      return;
    }

    // Generate the position data
    const positionData = generatePositionData();

    // Create the settings object to save
    const settings: PlacementSettings = {
      designWidthFactor,
      designHeightFactor,
      globalYOffset,
      placementSettings: JSON.stringify(shirtConfigs)
    };

    // Call the parent's save function if provided
    if (onSaveSettings) {
      onSaveSettings(settings);

      toast({
        title: "Success",
        description: "Design placement settings saved successfully!",
        variant: "default",
      });
    }
  };

  // Handle zoom level changes
  const handleZoomIn = () => {
    setZoomLevel(Math.min(200, zoomLevel + 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(50, zoomLevel - 10));
  };

  // Update all callback refs to current function versions on every render.
  // This is safe for refs (no re-render triggered) and ensures the parent's
  // registered callbacks always call the latest version with the correct mockupId/state.
  autoPositionRef.current = autoPosition;
  toggleEditModeRef.current = toggleEditMode;
  toggleDebugAreasRef.current = toggleDebugAreas;
  handleZoomInRef.current = handleZoomIn;
  handleZoomOutRef.current = handleZoomOut;

  const currentMockupObj = getMockupById(mockupId);
  const mockupName = currentMockupObj
    ? `${currentMockupObj.shop} — ${currentMockupObj.name}`
    : `Page ${mockupId}`;

  return (
    <div className="h-full flex flex-col" id="canvas-container">
      {/* Hidden buttons triggered programmatically by parent */}
      <button id="download-btn" onClick={handleDownload} style={{ display: "none" }}>Download</button>
      <button id="auto-btn" onClick={autoPosition} style={{ display: "none" }}>Auto</button>

      {/* Main layout: canvas | settings panel */}
      <div className="flex-grow flex h-full overflow-hidden">

        {/* Canvas area */}
        <div className="relative flex-1 h-full">
          <div className="bg-gray-50 flex items-center justify-center h-full w-full">
            <div style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: "center",
              transition: "transform 0.2s ease",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <canvas
                ref={canvasRef}
                width={canvasSize.width}
                height={canvasSize.height}
                style={{
                  width: "auto",
                  height: "auto",
                  maxWidth: "100%",
                  maxHeight: "100vh",
                  objectFit: "contain",
                  display: "block",
                  cursor: editMode !== "none" ? "crosshair" : "default",
                }}
                onClick={handleCanvasClick}
              />
            </div>
          </div>
        </div>

        {/* Settings panel — shown when edit mode is on */}
        {editMode !== "none" && (
          <SettingsPanel
            mockupName={mockupName}
            presets={DESIGN_PRESETS}
            selectedPreset={selectedPreset}
            onApplyPreset={applyPreset}
            designWidthFactor={designWidthFactor}
            designHeightFactor={designHeightFactor}
            onWidthChange={(v) => { setDesignWidthFactor(v); setSelectedPreset(null); }}
            onHeightChange={(v) => { setDesignHeightFactor(v); setSelectedPreset(null); }}
            globalXOffset={globalXOffset}
            globalYOffset={globalYOffset}
            onGlobalXChange={setGlobalXOffset}
            onGlobalYChange={setGlobalYOffset}
            syncAll={syncAll}
            onToggleSync={toggleSyncMode}
            selectedShirt={selectedShirt}
            onSelectShirt={(idx) => { setSelectedShirt(idx); if (syncAll) setSyncAll(false); }}
            shirtConfigs={shirtConfigs}
            onShirtXChange={handleXOffsetChange}
            onShirtYChange={handleYOffsetChange}
            gridLayout={currentGridLayout}
            skipPositions={currentMockup?.skipPositions || []}
            customPresets={customPresets}
            onSaveCustomPreset={(p) => savePresetMutation.mutate(p)}
            onDeleteCustomPreset={(name) => deletePresetMutation.mutate(name)}
            onSave={() =>
              saveMutation.mutate({
                shirtConfigs,
                globalXOffset,
                globalYOffset,
                designWidthFactor,
                designHeightFactor,
                circleRadius,
              })
            }
            onReset={resetPositions}
            isSaving={saveMutation.isPending}
            onClose={() => setEditMode("none")}
          />
        )}
      </div>
    </div>
  );
}