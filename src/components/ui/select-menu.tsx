import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import Theme from '@/assets/Theme/Theme';

export type SelectMenuOption = {
    value: string;
    label: string;
};

type SelectMenuProps = {
    /** Applied to the trigger so an external <label htmlFor> can point at it. */
    id?: string;
    value: string;
    options: SelectMenuOption[];
    onChange: (value: string) => void;
    /** Accessible name for the trigger. */
    label?: string;
    /** Small heading rendered inside the menu panel. */
    menuHeading?: string;
    /**
     * `pill` matches the compact filter bar, `field` matches full-size form
     * inputs (same height, radius and font as the contact form fields).
     */
    variant?: 'pill' | 'field';
    className?: string;
};

/**
 * Theme-styled listbox that replaces the native <select>, whose popup can't be
 * styled. Supports click, keyboard (arrows / Home / End / Enter / Esc) and
 * closes on outside click.
 */
const SelectMenu = ({
    id,
    value,
    options,
    onChange,
    label = 'Select',
    menuHeading,
    variant = 'pill',
    className = '',
}: SelectMenuProps) => {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const selected = options.find((option) => option.value === value) ?? options[0];

    /** Roving focus: the highlighted option always owns focus while open. */
    useEffect(() => {
        if (!open) return;
        itemRefs.current[activeIndex]?.focus();
    }, [open, activeIndex]);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent | TouchEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
        };
    }, [open]);

    function openMenu() {
        const index = options.findIndex((option) => option.value === value);
        setActiveIndex(index < 0 ? 0 : index);
        setOpen(true);
    }

    function closeMenu() {
        setOpen(false);
        triggerRef.current?.focus();
    }

    function choose(next: string) {
        onChange(next);
        closeMenu();
    }

    function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openMenu();
        }
    }

    function handleListKeyDown(event: React.KeyboardEvent<HTMLUListElement>) {
        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                closeMenu();
                break;
            case 'ArrowDown':
                event.preventDefault();
                setActiveIndex((index) => (index + 1) % options.length);
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex((index) => (index - 1 + options.length) % options.length);
                break;
            case 'Home':
                event.preventDefault();
                setActiveIndex(0);
                break;
            case 'End':
                event.preventDefault();
                setActiveIndex(options.length - 1);
                break;
            case 'Tab':
                setOpen(false);
                break;
            default:
                break;
        }
    }

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                ref={triggerRef}
                id={id}
                type="button"
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => (open ? setOpen(false) : openMenu())}
                onKeyDown={handleTriggerKeyDown}
                className={
                    variant === 'field'
                        ? 'flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3.5 text-sm font-medium transition-all duration-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20'
                        : 'flex w-full items-center justify-between gap-2 rounded-full border py-2 pl-3.5 pr-3 text-[11px] font-medium transition-all duration-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:text-xs'
                }
                style={{
                    borderColor: open ? Theme.colors.borderStrong : Theme.colors.border,
                    backgroundColor: Theme.colors.surface,
                    color: Theme.colors.text,
                }}
            >
                <span className="truncate">{selected?.label}</span>
                <ChevronDown
                    size={14}
                    className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    style={{ color: Theme.colors.textMuted }}
                />
            </button>

            {/* Mounted only while open so a closed menu can never trap clicks. */}
            {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className={`absolute top-full z-40 mt-2 origin-top overflow-hidden rounded-2xl border p-1.5 ${
                            variant === 'field' ? 'inset-x-0' : 'w-56 sm:left-auto sm:right-0'
                        }`}
                        style={{
                            backgroundColor: Theme.colors.surface,
                            borderColor: Theme.colors.border,
                            boxShadow: Theme.Shadow.lg,
                        }}
                    >
                        {menuHeading && (
                            <p
                                className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: Theme.colors.textMuted }}
                            >
                                {menuHeading}
                            </p>
                        )}

                        <ul
                            role="listbox"
                            aria-label={label}
                            onKeyDown={handleListKeyDown}
                            className="max-h-64 overflow-y-auto"
                        >
                            {options.map((option, index) => {
                                const isSelected = option.value === value;
                                return (
                                    <li key={option.value} role="none">
                                        <button
                                            ref={(node) => {
                                                itemRefs.current[index] = node;
                                            }}
                                            type="button"
                                            role="option"
                                            aria-selected={isSelected}
                                            tabIndex={open ? 0 : -1}
                                            onClick={() => choose(option.value)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:text-sm"
                                            style={{
                                                backgroundColor: isSelected
                                                    ? Theme.colors.surfaceAlt
                                                    : 'transparent',
                                                color: isSelected ? Theme.colors.accentDark : Theme.colors.text,
                                            }}
                                        >
                                            <span className="truncate">{option.label}</span>
                                            {isSelected && (
                                                <Check
                                                    size={14}
                                                    strokeWidth={3}
                                                    className="shrink-0"
                                                    style={{ color: Theme.colors.accentDark }}
                                                />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
            )}
        </div>
    );
};

export default SelectMenu;
