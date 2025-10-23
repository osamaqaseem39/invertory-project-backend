import React, { useState } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, disabled }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="flex items-center gap-3">
        {/* Color preview button */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          disabled={disabled}
          className="relative w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm 
                     hover:border-blue-500 transition-all disabled:opacity-50 
                     disabled:cursor-not-allowed overflow-hidden"
          style={{ backgroundColor: value }}
        >
          {/* Checkered background for transparency */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
          />
        </button>

        {/* Hex input */}
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="#3B82F6"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:bg-gray-100 disabled:cursor-not-allowed
                       font-mono text-sm uppercase"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>

        {/* Native color picker */}
        <input
          type="color"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-300
                     hover:border-blue-500 transition-all disabled:opacity-50
                     disabled:cursor-not-allowed"
        />
      </div>

      {/* Color preview with shades */}
      <div className="flex gap-1 h-8">
        {[...Array(7)].map((_, i) => {
          const factor = (i - 3) * 0.15; // -0.45 to +0.45
          const shade = adjustColor(value, factor);
          return (
            <div
              key={i}
              className="flex-1 rounded border border-gray-200"
              style={{ backgroundColor: shade }}
              title={shade}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * Adjust color brightness
 */
function adjustColor(hex: string, factor: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust
  const adjust = (val: number) => {
    const adjusted = Math.round(val + (255 - val) * factor);
    return Math.max(0, Math.min(255, adjusted));
  };
  
  const newR = adjust(r);
  const newG = adjust(g);
  const newB = adjust(b);
  
  // Convert back to hex
  const toHex = (val: number) => val.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

export default ColorPicker;





