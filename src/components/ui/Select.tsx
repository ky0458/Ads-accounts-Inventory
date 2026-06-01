import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AnimatePresence, motion } from 'motion/react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  menuPosition?: 'top' | 'bottom';
}

export function Select({ options, value, onChange, className, placeholder, menuPosition = 'bottom' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", isOpen ? "z-[60]" : "", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between text-left bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-3 h-10 text-xs text-zinc-600 dark:text-zinc-300 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all hover:bg-white dark:hover:bg-zinc-900 group font-medium",
          isOpen && "ring-1 ring-blue-600 border-blue-600 bg-white dark:bg-zinc-900"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-zinc-500 dark:text-zinc-400")}>
          {selectedOption ? selectedOption.label : placeholder || "Select..."}
        </span>
        <ChevronDown 
          className={cn(
            "w-4 h-4 ml-2 shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 group-hover:text-zinc-600 dark:text-zinc-300", 
            isOpen && "rotate-180 text-blue-500"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: menuPosition === 'top' ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: menuPosition === 'top' ? 8 : -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute left-0 w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden py-1 z-50 min-w-max",
              menuPosition === 'top' ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top"
            )}
          >
            <div className="max-h-60 overflow-y-auto px-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-2 text-xs transition-all rounded-md flex items-center justify-between font-medium group",
                    value === option.value 
                      ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10" 
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {value === option.value && (
                    <Check className="w-3.5 h-3.5 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
