"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  required?: boolean;
}

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  error,
  helperText,
  placeholder = "Select options...",
  required,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemoveOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-purple-200">
          {label}
          {required && <span className="text-pink-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full min-h-[42px] px-4 py-2 rounded-lg bg-purple-950/50 border ${
            error ? "border-pink-500/60" : "border-purple-500/30"
          } text-purple-100 cursor-pointer focus:outline-none focus:ring-2 ${
            error ? "focus:ring-pink-500/40" : "focus:ring-purple-500/40"
          } focus:border-transparent transition-all`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex flex-wrap gap-2">
              {selectedOptions.length === 0 ? (
                <span className="text-purple-400/50">{placeholder}</span>
              ) : (
                selectedOptions.map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: option.color ? `${option.color}40` : "#7c3aed40",
                      color: option.color || "#7c3aed",
                    }}
                  >
                    {option.label}
                    <button
                      onClick={(e) => handleRemoveOption(option.value, e)}
                      className="hover:bg-black/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-purple-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 rounded-lg bg-purple-900/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-purple-300/60">No options available</div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => handleToggleOption(option.value)}
                    className={`px-4 py-2 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-purple-500/30 text-purple-100"
                        : "text-purple-200 hover:bg-purple-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color || "#7c3aed" }}
                      />
                      <span>{option.label}</span>
                      {isSelected && (
                        <span className="ml-auto text-purple-400 text-sm">✓</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-pink-400">{error}</p>}
      {helperText && !error && <p className="text-sm text-purple-300/60">{helperText}</p>}
    </div>
  );
}
