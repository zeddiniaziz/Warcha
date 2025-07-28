import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

// Define the prop types for reusability
export interface ModernSelectProps {
  options: string[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  multiple?: boolean;
}

const ModernSelect: React.FC<ModernSelectProps> = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Sélectionnez une option",
  searchPlaceholder = "Rechercher...",
  icon,
  label,
  required = false,
  error,
  disabled = false,
  className = "",
  compact = false,
  multiple = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For multi-select
  const selectedValues: string[] = multiple
    ? Array.isArray(value)
      ? value
      : []
    : [typeof value === "string" ? value : ""];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    if (multiple) {
      let newValues = [...selectedValues];
      if (newValues.includes(selectedValue)) {
        newValues = newValues.filter((v) => v !== selectedValue);
      } else {
        newValues.push(selectedValue);
      }
      if (onChange) onChange(newValues);
    } else {
      if (onChange) onChange(selectedValue);
      setIsOpen(false);
    }
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`space-y-2 ${compact ? "space-y-0" : ""} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {icon && <span className="mr-2">{icon}</span>}
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors ${
            error
              ? "border-red-300 bg-red-50 focus:ring-red-500"
              : value
              ? "border-gray-300 bg-white hover:border-gray-400"
              : "border-gray-300 bg-white hover:border-gray-400"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="flex items-center justify-between">
            <span
              className={
                selectedValues.length && selectedValues[0]
                  ? "text-gray-900"
                  : "text-gray-500"
              }
            >
              {multiple
                ? selectedValues.length === 0 ||
                  (selectedValues.length === 1 && !selectedValues[0])
                  ? placeholder
                  : selectedValues.length <= 2
                  ? selectedValues.join(", ")
                  : `${selectedValues.length} sélectionnés`
                : value || placeholder}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Search input */}
            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div className="max-h-60 overflow-y-auto py-2">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  Aucun résultat trouvé
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150 hover:bg-blue-50 flex items-center justify-between ${
                      (
                        multiple
                          ? selectedValues.includes(option)
                          : value === option
                      )
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="flex items-center">
                      {multiple && (
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(option)}
                          readOnly
                          className="mr-2 accent-blue-600"
                        />
                      )}
                      {option}
                    </span>
                    {(multiple
                      ? selectedValues.includes(option)
                      : value === option) && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default ModernSelect;
