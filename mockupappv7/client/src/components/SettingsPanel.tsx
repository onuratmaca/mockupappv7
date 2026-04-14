import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Save, RotateCcw, X, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

interface ShirtConfig {
  x: number;
  y: number;
  name: string;
  index: number;
  designOffset: { x: number; y: number };
}

interface DesignPreset {
  name: string;
  description: string;
  widthFactor: number;
  heightFactor: number;
  forRatio: string;
}

interface CustomPreset {
  name: string;
  widthFactor: number;
  heightFactor: number;
  globalXOffset: number;
  globalYOffset: number;
}

interface SettingsPanelProps {
  // Preset state
  presets: DesignPreset[];
  selectedPreset: number | null;
  onApplyPreset: (idx: number) => void;

  // Box size
  designWidthFactor: number;
  designHeightFactor: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;

  // Global position
  globalXOffset: number;
  globalYOffset: number;
  onGlobalXChange: (v: number) => void;
  onGlobalYChange: (v: number) => void;

  // Individual shirt
  syncAll: boolean;
  onToggleSync: () => void;
  selectedShirt: number;
  onSelectShirt: (index: number) => void;
  shirtConfigs: ShirtConfig[];
  onShirtXChange: (v: number) => void;
  onShirtYChange: (v: number) => void;
  gridLayout: "2x4" | "3x3";
  skipPositions: number[];

  // Custom presets
  customPresets: CustomPreset[];
  onSaveCustomPreset: (preset: CustomPreset) => void;
  onDeleteCustomPreset: (name: string) => void;

  // Actions
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  onClose: () => void;

  // Mockup name
  mockupName: string;
}

/** A tiny visual representation of the aspect ratio of a preset box */
function PresetAspectBox({ w, h, active }: { w: number; h: number; active: boolean }) {
  const maxSide = 32;
  const ratio = w / h;
  let bw: number, bh: number;
  if (ratio >= 1) {
    bw = maxSide;
    bh = Math.round(maxSide / ratio);
  } else {
    bh = maxSide;
    bw = Math.round(maxSide * ratio);
  }
  return (
    <div
      className="flex items-center justify-center"
      style={{ width: maxSide, height: maxSide }}
    >
      <div
        className="border-2 rounded-sm"
        style={{
          width: bw,
          height: bh,
          borderColor: active ? "hsl(var(--primary))" : "#d1d5db",
          background: active ? "hsl(var(--primary) / 0.1)" : "transparent",
        }}
      />
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  bigStep,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  bigStep: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-1">
          <button
            className="w-5 h-5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs leading-none flex items-center justify-center"
            onClick={() => onChange(Math.max(min, value - bigStep))}
          >
            −
          </button>
          <span className="text-xs font-mono w-10 text-center tabular-nums">{value}</span>
          <button
            className="w-5 h-5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs leading-none flex items-center justify-center"
            onClick={() => onChange(Math.min(max, value + bigStep))}
          >
            +
          </button>
        </div>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

/** Visual grid picker — same layout as the mockup grid */
function ShirtGridPicker({
  gridLayout,
  shirtConfigs,
  skipPositions,
  selectedShirt,
  syncAll,
  onSelectShirt,
}: {
  gridLayout: "2x4" | "3x3";
  shirtConfigs: ShirtConfig[];
  skipPositions: number[];
  selectedShirt: number;
  syncAll: boolean;
  onSelectShirt: (index: number) => void;
}) {
  const cols = gridLayout === "3x3" ? 3 : gridLayout === "2x5" ? 5 : 4;
  const rows = gridLayout === "3x3" ? 3 : 2;
  const total = cols * rows;

  return (
    <div
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {Array.from({ length: total }).map((_, idx) => {
        const isSkip = skipPositions.includes(idx);
        const isSelected = !syncAll && selectedShirt === idx;
        const shirt = shirtConfigs[idx];
        const label = shirt?.name ?? `${idx + 1}`;
        const short = label.length > 8 ? label.slice(0, 7) + "…" : label;

        return (
          <button
            key={idx}
            disabled={isSkip}
            onClick={() => !isSkip && onSelectShirt(idx)}
            title={isSkip ? "Skipped (logo placeholder)" : label}
            className={[
              "rounded text-[9px] font-semibold leading-tight px-0.5 py-1 border transition-colors",
              "flex flex-col items-center justify-center gap-0.5 min-h-[32px]",
              isSkip
                ? "border-dashed border-gray-200 text-gray-300 cursor-not-allowed"
                : isSelected
                ? "border-orange-400 bg-orange-100 text-orange-700 ring-1 ring-orange-400"
                : syncAll
                ? "border-blue-200 bg-blue-50 text-blue-600"
                : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 cursor-pointer",
            ].join(" ")}
          >
            <span className="text-[8px] opacity-50">{idx + 1}</span>
            <span>{isSkip ? "—" : short}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsPanel({
  presets,
  selectedPreset,
  onApplyPreset,
  designWidthFactor,
  designHeightFactor,
  onWidthChange,
  onHeightChange,
  globalXOffset,
  globalYOffset,
  onGlobalXChange,
  onGlobalYChange,
  syncAll,
  onToggleSync,
  selectedShirt,
  onSelectShirt,
  shirtConfigs,
  onShirtXChange,
  onShirtYChange,
  gridLayout,
  skipPositions,
  customPresets,
  onSaveCustomPreset,
  onDeleteCustomPreset,
  onSave,
  onReset,
  isSaving,
  onClose,
  mockupName,
}: SettingsPanelProps) {
  const [positionOpen, setPositionOpen] = useState(true);
  const [shirtOpen, setShirtOpen] = useState(true);
  const [customName, setCustomName] = useState("");
  const shirt = shirtConfigs[selectedShirt];

  const handleSaveCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    onSaveCustomPreset({
      name: trimmed,
      widthFactor: designWidthFactor,
      heightFactor: designHeightFactor,
      globalXOffset,
      globalYOffset,
    });
    setCustomName("");
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 shadow-lg overflow-y-auto" style={{ width: 272 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
        <div>
          <p className="text-xs font-semibold text-gray-800">Layout Settings</p>
          <p className="text-[10px] text-gray-500">{mockupName}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">

        {/* ── Design Size Presets ── */}
        <section>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Design Size Presets
          </p>

          {/* Built-in presets */}
          <div className="grid grid-cols-3 gap-1 mb-2">
            {presets.map((p, idx) => {
              const active = selectedPreset === idx;
              return (
                <button
                  key={idx}
                  onClick={() => onApplyPreset(idx)}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-md border transition-colors text-center ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  title={`${p.description}\nW:${p.widthFactor} H:${p.heightFactor}`}
                >
                  <PresetAspectBox w={p.widthFactor} h={p.heightFactor} active={active} />
                  <span className={`text-[9px] leading-tight font-medium ${active ? "text-primary" : "text-gray-500"}`}>
                    {p.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom presets */}
          {customPresets.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-gray-400 mb-1">Custom presets</p>
              <div className="flex flex-wrap gap-1">
                {customPresets.map((cp) => (
                  <div
                    key={cp.name}
                    className="flex items-center gap-0.5 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5"
                  >
                    <button
                      className="text-[10px] text-blue-700 font-medium hover:text-blue-900"
                      title={`W:${cp.widthFactor} H:${cp.heightFactor}  X:${cp.globalXOffset} Y:${cp.globalYOffset}`}
                      onClick={() => {
                        onWidthChange(cp.widthFactor);
                        onHeightChange(cp.heightFactor);
                        onGlobalXChange(cp.globalXOffset ?? 0);
                        onGlobalYChange(cp.globalYOffset ?? -200);
                      }}
                    >
                      {cp.name}
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-500 ml-0.5"
                      onClick={() => onDeleteCustomPreset(cp.name)}
                      title="Delete preset"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <SliderRow
              label={`Design Width (W): ${designWidthFactor}`}
              value={designWidthFactor}
              min={100} max={1200} step={10} bigStep={50}
              onChange={onWidthChange}
            />
            <SliderRow
              label={`Design Height (H): ${designHeightFactor}`}
              value={designHeightFactor}
              min={100} max={1000} step={10} bigStep={50}
              onChange={onHeightChange}
            />
          </div>

          {/* Save as custom preset */}
          <div className="mt-2 flex gap-1">
            <input
              type="text"
              placeholder="Save current size & position as…"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveCustom()}
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSaveCustom}
              disabled={!customName.trim()}
              className="flex items-center gap-0.5 px-2 py-1 rounded border border-gray-200 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40"
              title="Save current W/H as a custom preset"
            >
              <Plus className="h-3 w-3" />
              Save
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 italic">
            Box = design placement area. Circle = landing point indicator.
          </p>
        </section>

        {/* ── Global Position ── */}
        <section>
          <button
            className="flex items-center gap-1 w-full text-left mb-2"
            onClick={() => setPositionOpen(o => !o)}
          >
            {positionOpen ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Global Position
            </p>
          </button>
          {positionOpen && (
            <div className="space-y-3">
              <SliderRow
                label={`Shift All Left/Right (X): ${globalXOffset}`}
                value={globalXOffset}
                min={-800} max={800} step={2} bigStep={10}
                onChange={onGlobalXChange}
              />
              <SliderRow
                label={`Shift All Up/Down (Y): ${globalYOffset}`}
                value={globalYOffset}
                min={-800} max={400} step={2} bigStep={10}
                onChange={onGlobalYChange}
              />
            </div>
          )}
        </section>

        {/* ── Individual Shirt ── */}
        <section>
          <button
            className="flex items-center gap-1 w-full text-left mb-2"
            onClick={() => setShirtOpen(o => !o)}
          >
            {shirtOpen ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Individual Shirt
            </p>
          </button>
          {shirtOpen && (
            <div className="space-y-2">
              {/* Mode toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Editing mode</span>
                <Button
                  size="sm"
                  variant={syncAll ? "outline" : "default"}
                  className="h-6 text-xs px-2"
                  onClick={onToggleSync}
                >
                  {syncAll ? "All shirts" : "Individual"}
                </Button>
              </div>

              {/* Grid picker — always visible */}
              <ShirtGridPicker
                gridLayout={gridLayout}
                shirtConfigs={shirtConfigs}
                skipPositions={skipPositions}
                selectedShirt={selectedShirt}
                syncAll={syncAll}
                onSelectShirt={(idx) => {
                  if (syncAll) onToggleSync();
                  onSelectShirt(idx);
                }}
              />

              {/* Fine-tune sliders when a single shirt is selected */}
              {!syncAll && shirt && (
                <div className="space-y-3 pt-1">
                  <p className="text-[10px] text-orange-600 font-semibold">
                    ▶ Adjusting: {shirt.name}
                  </p>
                  <SliderRow
                    label={`Fine X offset (dX): ${shirt.designOffset.x}`}
                    value={shirt.designOffset.x}
                    min={-400} max={400} step={1} bigStep={5}
                    onChange={onShirtXChange}
                  />
                  <SliderRow
                    label={`Fine Y offset (dY): ${shirt.designOffset.y}`}
                    value={shirt.designOffset.y}
                    min={-400} max={400} step={1} bigStep={5}
                    onChange={onShirtYChange}
                  />
                </div>
              )}

              {syncAll && (
                <p className="text-[10px] text-gray-400 italic">
                  Tap a shirt above to switch to Individual mode and fine-tune it.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Footer — Save / Reset */}
      <div className="shrink-0 px-3 py-2 border-t border-gray-200 bg-gray-50 space-y-2">
        <Button
          className="w-full h-8 text-sm"
          disabled={isSaving}
          onClick={onSave}
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {isSaving ? "Saving…" : "Save layout for this page"}
        </Button>
        <Button
          variant="outline"
          className="w-full h-7 text-xs text-gray-500"
          onClick={onReset}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
