import { useState } from "react";
import { getShops, getMockupsByShop } from "@/lib/mockup-data";
import { ChevronDown, ChevronRight } from "lucide-react";

interface MockupSelectorProps {
  selectedMockupId: number;
  onMockupSelect: (mockupId: number) => void;
}

export default function MockupSelector({ 
  selectedMockupId,
  onMockupSelect
}: MockupSelectorProps) {
  const shops = getShops();

  // Determine which shop the currently selected mockup belongs to
  const getShopForMockup = (id: number) => {
    for (const shop of shops) {
      if (getMockupsByShop(shop).some(m => m.id === id)) return shop;
    }
    return shops[0];
  };

  // Start with only the active shop expanded
  const activeShop = getShopForMockup(selectedMockupId);
  const [expandedShops, setExpandedShops] = useState<Set<string>>(new Set([activeShop]));

  const toggleShop = (shop: string) => {
    setExpandedShops(prev => {
      const next = new Set(prev);
      if (next.has(shop)) {
        next.delete(shop);
      } else {
        next.add(shop);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-0.5 w-full px-1">
      {shops.map((shop) => {
        const mockups = getMockupsByShop(shop);
        const isExpanded = expandedShops.has(shop);
        const hasSelected = mockups.some(m => m.id === selectedMockupId);

        return (
          <div key={shop} className="flex flex-col">
            {/* Shop header / toggle */}
            <button
              type="button"
              onClick={() => toggleShop(shop)}
              className={`flex items-center justify-between w-full px-1 py-1 rounded text-left transition-colors ${
                hasSelected
                  ? "text-blue-600 font-bold"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-[11px] leading-tight truncate font-semibold">{shop}</span>
              {isExpanded
                ? <ChevronDown className="h-3 w-3 flex-shrink-0" />
                : <ChevronRight className="h-3 w-3 flex-shrink-0" />
              }
            </button>

            {/* Mockup thumbnails */}
            {isExpanded && (
              <div className="flex flex-col gap-1.5 pb-2">
                {mockups.map((mockup) => (
                  <button
                    key={mockup.id}
                    type="button"
                    onClick={() => onMockupSelect(mockup.id)}
                    className={`w-full rounded-md border transition-all overflow-hidden flex flex-col ${
                      selectedMockupId === mockup.id
                        ? "border-blue-500 ring-2 ring-blue-300"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <img
                      src={mockup.src}
                      alt={mockup.name}
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <span className={`text-[9px] font-medium text-center px-0.5 py-0.5 leading-tight truncate ${
                      selectedMockupId === mockup.id ? "bg-blue-50 text-blue-700" : "bg-white text-gray-500"
                    }`}>
                      {mockup.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
