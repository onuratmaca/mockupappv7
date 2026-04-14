// Import mockup images - apparellaUS (2x4 grid, 8 shirts)
import mockup1 from "@assets/1 copy.jpg";
import mockup2 from "@assets/2 copy.jpg";
import mockup3 from "@assets/3 copy.jpg";
import mockup4 from "@assets/4 copy.jpg";
import mockup5 from "@assets/5 copy.jpg";

// Import mockup images - Calvary (light: 2x4, dark: 2x5)
import mockup6 from "@assets/CalvaryApparelStudio_1776196814867.jpg";
import mockup7 from "@assets/CalvaryApparelStudio_(1)_1776196814866.jpg";
import mockup8 from "@assets/Untitled_design_(1)_1776196814867.jpg";
import mockup9 from "@assets/Untitled_design_(2)_1776196814867.jpg";

// Import mockup images - MKPrintsUSA (2x4 grid, 8 shirts)
import mockup10 from "@assets/Untitled_design_(1)_1776196734752.jpg";
import mockup11 from "@assets/Untitled_design_(2)_1776196734752.jpg";
import mockup12 from "@assets/Untitled_design_(3)_1776196734753.jpg";
import mockup13 from "@assets/Untitled_design_(4)_1776196734753.jpg";
import mockup14 from "@assets/Untitled_design_(5)_1776196734754.jpg";

// Shirt positions in the grid
export type ShirtPosition = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Grid layout types
export type GridLayout = "2x4" | "3x3" | "2x5";

// Define the mockup images with their grid layout and shop grouping
// skipPositions: positions to skip (e.g., for logo placement)
export const MOCKUP_IMAGES = [
  // apparellaUS
  { id: 1, name: "Page 1", shop: "apparellaUS", src: mockup1, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 2, name: "Page 2", shop: "apparellaUS", src: mockup2, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 3, name: "Page 3", shop: "apparellaUS", src: mockup3, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 4, name: "Page 4", shop: "apparellaUS", src: mockup4, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 5, name: "Page 5", shop: "apparellaUS", src: mockup5, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },

  // Calvary — light pages (4×2 = 8 shirts), dark pages (5×2 = 10 shirts)
  { id: 6, name: "Light 1", shop: "Calvary", src: mockup6, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 7, name: "Light 2", shop: "Calvary", src: mockup7, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 8, name: "Dark 1",  shop: "Calvary", src: mockup8, gridLayout: "2x5" as GridLayout, shirtCount: 10, skipPositions: [] as number[] },
  { id: 9, name: "Dark 2",  shop: "Calvary", src: mockup9, gridLayout: "2x5" as GridLayout, shirtCount: 10, skipPositions: [] as number[] },

  // MKPrintsUSA
  { id: 10, name: "Page 1", shop: "MKPrintsUSA", src: mockup10, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 11, name: "Page 2", shop: "MKPrintsUSA", src: mockup11, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 12, name: "Page 3", shop: "MKPrintsUSA", src: mockup12, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 13, name: "Page 4", shop: "MKPrintsUSA", src: mockup13, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
  { id: 14, name: "Page 5", shop: "MKPrintsUSA", src: mockup14, gridLayout: "2x4" as GridLayout, shirtCount: 8, skipPositions: [] as number[] },
];

export interface Mockup {
  id: number;
  name: string;
  shop: string;
  src: string;
  gridLayout: GridLayout;
  shirtCount: number;
  skipPositions: number[];
}

export interface ShirtGridPosition {
  x: number; // Percentage x position in the grid (0-1)
  y: number; // Percentage y position in the grid (0-1)
  width: number; // Width percentage of a single shirt (0-1)
  height: number; // Height percentage of a single shirt (0-1)
}

// Definition of where each shirt is positioned in the mockup grid
// These values are based on analysis of 4000x3000 px mockups with 8 shirts (4 columns x 2 rows)
// Grid reference: 0-based from left to right, top to bottom
//
// | 0 | 1 | 2 | 3 |  <- Top row (positions 0-3)
// | 4 | 5 | 6 | 7 |  <- Bottom row (positions 4-7)
export const SHIRT_GRID_POSITIONS_2x4: ShirtGridPosition[] = [
  { x: 0.125, y: 0.25, width: 0.22, height: 0.44 },
  { x: 0.375, y: 0.25, width: 0.22, height: 0.44 },
  { x: 0.625, y: 0.25, width: 0.22, height: 0.44 },
  { x: 0.875, y: 0.25, width: 0.22, height: 0.44 },
  { x: 0.125, y: 0.75, width: 0.22, height: 0.44 },
  { x: 0.375, y: 0.75, width: 0.22, height: 0.44 },
  { x: 0.625, y: 0.75, width: 0.22, height: 0.44 },
  { x: 0.875, y: 0.75, width: 0.22, height: 0.44 },
];

// Definition of where each shirt is positioned in the 3x3 mockup grid
//
// | 0 | 1 | 2 |  <- Top row
// | 3 | 4 | 5 |  <- Middle row
// | 6 | 7 | 8 |  <- Bottom row
export const SHIRT_GRID_POSITIONS_3x3: ShirtGridPosition[] = [
  { x: 0.167, y: 0.167, width: 0.28, height: 0.30 },
  { x: 0.500, y: 0.167, width: 0.28, height: 0.30 },
  { x: 0.833, y: 0.167, width: 0.28, height: 0.30 },
  { x: 0.167, y: 0.500, width: 0.28, height: 0.30 },
  { x: 0.500, y: 0.500, width: 0.28, height: 0.30 },
  { x: 0.833, y: 0.500, width: 0.28, height: 0.30 },
  { x: 0.167, y: 0.833, width: 0.28, height: 0.30 },
  { x: 0.500, y: 0.833, width: 0.28, height: 0.30 },
  { x: 0.833, y: 0.833, width: 0.28, height: 0.30 },
];

// Definition of where each shirt is positioned in the 2x5 mockup grid (5 cols × 2 rows = 10 shirts)
//
// | 0 | 1 | 2 | 3 | 4 |  <- Top row
// | 5 | 6 | 7 | 8 | 9 |  <- Bottom row
export const SHIRT_GRID_POSITIONS_2x5: ShirtGridPosition[] = [
  { x: 0.10, y: 0.25, width: 0.17, height: 0.44 },
  { x: 0.30, y: 0.25, width: 0.17, height: 0.44 },
  { x: 0.50, y: 0.25, width: 0.17, height: 0.44 },
  { x: 0.70, y: 0.25, width: 0.17, height: 0.44 },
  { x: 0.90, y: 0.25, width: 0.17, height: 0.44 },
  { x: 0.10, y: 0.75, width: 0.17, height: 0.44 },
  { x: 0.30, y: 0.75, width: 0.17, height: 0.44 },
  { x: 0.50, y: 0.75, width: 0.17, height: 0.44 },
  { x: 0.70, y: 0.75, width: 0.17, height: 0.44 },
  { x: 0.90, y: 0.75, width: 0.17, height: 0.44 },
];

// Keep for backward compatibility
export const SHIRT_GRID_POSITIONS = SHIRT_GRID_POSITIONS_2x4;

// Get all unique shop names in order
export function getShops(): string[] {
  const seen = new Set<string>();
  const shops: string[] = [];
  for (const m of MOCKUP_IMAGES) {
    if (!seen.has(m.shop)) {
      seen.add(m.shop);
      shops.push(m.shop);
    }
  }
  return shops;
}

// Get mockups belonging to a specific shop
export function getMockupsByShop(shop: string) {
  return MOCKUP_IMAGES.filter(m => m.shop === shop);
}

export function getMockupById(id: number): Mockup | undefined {
  return MOCKUP_IMAGES.find(mockup => mockup.id === id);
}

export function getShirtGridPosition(position: ShirtPosition, gridLayout: GridLayout = "2x4"): ShirtGridPosition {
  if (gridLayout === "3x3") return SHIRT_GRID_POSITIONS_3x3[position] || SHIRT_GRID_POSITIONS_3x3[0];
  if (gridLayout === "2x5") return SHIRT_GRID_POSITIONS_2x5[position] || SHIRT_GRID_POSITIONS_2x5[0];
  return SHIRT_GRID_POSITIONS_2x4[position] || SHIRT_GRID_POSITIONS_2x4[0];
}

export function getShirtGridPositions(gridLayout: GridLayout): ShirtGridPosition[] {
  if (gridLayout === "3x3") return SHIRT_GRID_POSITIONS_3x3;
  if (gridLayout === "2x5") return SHIRT_GRID_POSITIONS_2x5;
  return SHIRT_GRID_POSITIONS_2x4;
}
