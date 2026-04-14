import { db } from "./db";
import { mockupLayouts, customPresets } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface CustomPreset {
  name: string;
  widthFactor: number;
  heightFactor: number;
  globalXOffset: number;
  globalYOffset: number;
}

export async function getPresets(): Promise<CustomPreset[]> {
  const rows = await db.select().from(customPresets);
  return rows.map(r => ({
    name: r.name,
    widthFactor: r.widthFactor,
    heightFactor: r.heightFactor,
    globalXOffset: r.globalXOffset,
    globalYOffset: r.globalYOffset,
  }));
}

export async function savePreset(preset: CustomPreset): Promise<void> {
  await db
    .insert(customPresets)
    .values({
      name: preset.name,
      widthFactor: preset.widthFactor,
      heightFactor: preset.heightFactor,
      globalXOffset: preset.globalXOffset,
      globalYOffset: preset.globalYOffset,
    })
    .onConflictDoUpdate({
      target: customPresets.name,
      set: {
        widthFactor: preset.widthFactor,
        heightFactor: preset.heightFactor,
        globalXOffset: preset.globalXOffset,
        globalYOffset: preset.globalYOffset,
      },
    });
}

export async function deletePreset(name: string): Promise<void> {
  await db.delete(customPresets).where(eq(customPresets.name, name));
}

export async function getLayout(mockupId: number): Promise<unknown | null> {
  const rows = await db.select().from(mockupLayouts).where(eq(mockupLayouts.mockupId, mockupId));
  return rows[0]?.config ?? null;
}

export async function setLayout(mockupId: number, layout: unknown): Promise<void> {
  await db
    .insert(mockupLayouts)
    .values({ mockupId, config: layout })
    .onConflictDoUpdate({
      target: mockupLayouts.mockupId,
      set: { config: layout },
    });
}

export async function deleteLayout(mockupId: number): Promise<void> {
  await db.delete(mockupLayouts).where(eq(mockupLayouts.mockupId, mockupId));
}
