import { useEffect, useId, useRef, useState } from 'react';
import type { SearchFilters } from '../api/vehicles';
import { CATEGORIES } from '../constants/categories';
import { prefersReducedMotion } from '../lib/motion';
import type { FieldErrors } from '../validation/types';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

// Matches the .filters-panel.is-closing animation in index.css.
const CLOSE_MS = 160;

interface Props {
  values: Required<SearchFilters>;
  onChange: (values: Required<SearchFilters>) => void;
  /** Messages for invalid filters, shown under their fields. */
  errors: FieldErrors<SearchFilters>;
  onClear: () => void;
  /** Client-side filter (the API has none): applies as soon as it's toggled. */
  inStockOnly: boolean;
  onInStockOnlyChange: (checked: boolean) => void;
}

/**
 * Search bar plus a Filters button that reveals the other filters. Controlled by the page,
 * which applies changes live and also needs to clear them (e.g. from the no-results message).
 */
export function SearchPanel({
  values,
  onChange,
  errors,
  onClear,
  inStockOnly,
  onInStockOnlyChange,
}: Props) {
  // Start open when a hidden filter is already active (e.g. restored from the URL).
  const [filtersOpen, setFiltersOpen] = useState(() =>
    Boolean(values.category || values.minPrice || values.maxPrice || inStockOnly),
  );
  // While the close wipe plays the panel stays mounted, but inert and aria-hidden, so it's
  // already out of the accessibility tree.
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const filtersId = useId();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  function finishClose() {
    clearTimeout(closeTimer.current);
    setClosing(false);
  }

  function toggleFilters() {
    if (!filtersOpen) {
      finishClose();
      setFiltersOpen(true);
      return;
    }
    setFiltersOpen(false);
    if (prefersReducedMotion()) return;
    setClosing(true);
    // animationend alone isn't enough (a background tab, CSS that didn't load), so a timer
    // removes the panel regardless.
    closeTimer.current = window.setTimeout(finishClose, CLOSE_MS + 40);
  }
  const set = (name: keyof SearchFilters) => (value: string) =>
    onChange({ ...values, [name]: value });

  return (
    <form
      role="search"
      aria-label="Search vehicles"
      // Results update as you type; Enter has nothing extra to submit.
      onSubmit={(e) => e.preventDefault()}
      className="cyber-panel space-y-4 p-4 md:p-5"
    >
      <div className="flex flex-wrap items-end gap-3">
        {/* Full row on phones so Filters and Clear share the next one; inline from sm. */}
        <div className="w-full sm:w-auto sm:flex-1">
          {/* No visible label: the placeholder says it, aria-label names it for screen readers */}
          <input
            type="search"
            aria-label="Search"
            placeholder="Search"
            className="cyber-input"
            value={values.q}
            onChange={(e) => set('q')(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-ghost h-11"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          onClick={toggleFilters}
        >
          Filters
        </button>
        <button type="button" className="btn-ghost h-11" onClick={onClear}>
          Clear
        </button>
      </div>
      {/* items-start: a field's error message mustn't push it out of line with the others */}
      {(filtersOpen || closing) && (
        <div
          id={filtersId}
          className={`filters-panel ${closing ? 'is-closing' : 'is-opening'} grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4`}
          aria-hidden={closing || undefined}
          inert={closing}
          onAnimationEnd={closing ? finishClose : undefined}
        >
          <SelectField
            label="Category"
            options={CATEGORIES}
            emptyLabel="All"
            value={values.category}
            onChange={set('category')}
          />
          <TextField
            label="Min price"
            type="number"
            min="0"
            step="0.01"
            value={values.minPrice}
            onChange={set('minPrice')}
            error={errors.minPrice}
          />
          <TextField
            label="Max price"
            type="number"
            min="0"
            step="0.01"
            value={values.maxPrice}
            onChange={set('maxPrice')}
            error={errors.maxPrice}
          />
          {/* sm:mt-[22px] lines the checkbox up with the inputs below their labels */}
          <label className="flex h-11 cursor-pointer items-center gap-3 text-sm uppercase tracking-[2px] sm:mt-[22px]">
            <input
              type="checkbox"
              className="size-4 accent-cp-yellow"
              checked={inStockOnly}
              onChange={(e) => onInStockOnlyChange(e.target.checked)}
            />
            In stock only
          </label>
        </div>
      )}
    </form>
  );
}
