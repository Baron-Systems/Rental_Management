'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface InlineFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'search';
  options?: { label: string; value: string }[];
  searchOptions?: { label: string; value: string; meta?: string }[];
  error?: string;
  readOnly?: boolean;
  preview?: boolean;
  width?: string;
  className?: string;
  inputClassName?: string;
  dir?: 'rtl' | 'ltr';
}

export function InlineField({
  value,
  onChange,
  placeholder = '...',
  type = 'text',
  options,
  searchOptions,
  error,
  readOnly,
  preview,
  width,
  className,
  inputClassName,
  dir = 'rtl',
}: InlineFieldProps) {
  const [focused, setFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (preview) {
    const previewValue = type === 'select' && options
      ? options.find((o) => o.value === value)?.label || value
      : value;
    return (
      <span className={cn("inline px-1 font-semibold text-slate-900", className)}>
        {previewValue || <span className="text-slate-400 italic">{placeholder}</span>}
      </span>
    );
  }

  const displayValue = value || '';

  // Common button/input styles for edit mode
  const editableBaseClass = cn(
    "rounded-md px-2 py-0.5 text-sm transition-all",
    "border border-dashed border-slate-300 bg-slate-50/80 hover:bg-blue-50/60 hover:border-blue-400",
    error ? "border-red-400 bg-red-50/50" : "",
    readOnly ? "cursor-default opacity-70" : "cursor-text"
  );
  const buttonClass = cn(editableBaseClass, "inline-flex items-center gap-1");
  const inputClass = cn(editableBaseClass, "inline-block focus:border-blue-500 focus:bg-blue-50/50 focus:shadow-sm focus:shadow-blue-100 focus:outline-none");

  if (type === 'select' && options) {
    const selectedLabel = options.find((o) => o.value === value)?.label || value || placeholder;
    return (
      <span ref={dropdownRef} className={cn("relative inline-block", className)} style={{ minWidth: width || '120px' }}>
        <button
          type="button"
          onClick={() => !readOnly && setShowDropdown(!showDropdown)}
          className={cn(buttonClass, inputClassName)}
          dir={dir}
        >
          <span className={cn(!value && "text-slate-400 italic")}>{selectedLabel}</span>
          {!readOnly && <ChevronDown className="h-3 w-3 text-slate-400" />}
        </button>
        {showDropdown && !readOnly && (
          <div className="absolute z-50 mt-1 max-h-48 min-w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setShowDropdown(false); }}
                className={cn(
                  "block w-full px-3 py-2 text-right text-sm hover:bg-slate-50",
                  value === opt.value && "bg-blue-50 text-blue-700 font-medium"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        {error && (
          <span className="absolute -bottom-4 right-0 flex items-center gap-1 text-[10px] text-red-500 whitespace-nowrap">
            <AlertCircle className="h-3 w-3" /> {error}
          </span>
        )}
      </span>
    );
  }

  if (type === 'search' && searchOptions) {
    const filtered = searchQuery
      ? searchOptions.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase()) || (o.meta && o.meta.toLowerCase().includes(searchQuery.toLowerCase())))
      : searchOptions;
    const selectedLabel = searchOptions.find((o) => o.value === value)?.label || value || placeholder;

    return (
      <span ref={dropdownRef} className={cn("relative inline-block", className)} style={{ minWidth: width || '160px' }}>
        <button
          type="button"
          onClick={() => !readOnly && setShowDropdown(!showDropdown)}
          className={cn(buttonClass, inputClassName)}
          dir={dir}
        >
          <span className={cn(!value && "text-slate-400 italic")}>{selectedLabel}</span>
          {!readOnly && <ChevronDown className="h-3 w-3 text-slate-400" />}
        </button>
        {showDropdown && !readOnly && (
          <div className="absolute z-50 mt-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث..."
              className="w-full border-b border-slate-100 px-3 py-2 text-sm outline-none"
              dir={dir}
            />
            <div className="max-h-48 overflow-auto">
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setShowDropdown(false); setSearchQuery(''); }}
                  className={cn(
                    "block w-full px-3 py-2 text-right text-sm hover:bg-slate-50",
                    value === opt.value && "bg-blue-50 text-blue-700 font-medium"
                  )}
                >
                  <div>{opt.label}</div>
                  {opt.meta && <div className="text-xs text-slate-400">{opt.meta}</div>}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-slate-400">لا توجد نتائج</div>
              )}
            </div>
          </div>
        )}
        {error && (
          <span className="absolute -bottom-4 right-0 flex items-center gap-1 text-[10px] text-red-500 whitespace-nowrap">
            <AlertCircle className="h-3 w-3" /> {error}
          </span>
        )}
      </span>
    );
  }

  const isNumber = type === 'number';
  const inputType = type === 'date' ? 'date' : 'text';

  return (
    <span className={cn("relative inline-block", className)} style={{ minWidth: width || '80px' }}>
      <input
        ref={inputRef}
        type={inputType}
        inputMode={isNumber ? 'decimal' : undefined}
        value={displayValue}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={cn(
          inputClass,
          "h-7",
          inputClassName
        )}
        style={{ width: width || 'auto', minWidth: width || '80px' }}
        dir={dir}
      />
      {error && (
        <span className="absolute -bottom-4 right-0 flex items-center gap-1 text-[10px] text-red-500 whitespace-nowrap">
          <AlertCircle className="h-3 w-3" /> {error}
        </span>
      )}
    </span>
  );
}
