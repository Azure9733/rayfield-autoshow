import { useId, useState } from 'react';
import type { SearchFilters } from '../api/vehicles';
import { CATEGORIES } from '../constants/categories';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

interface Props {
  values: Required<SearchFilters>;
  onChange: (values: Required<SearchFilters>) => void;
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
  onClear,
  inStockOnly,
  onInStockOnlyChange,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
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
        <div className="min-w-48 flex-1">
          <TextField
            label="Make or model"
            type="search"
            placeholder="e.g. Land Cruiser"
            value={values.q}
            onChange={set('q')}
          />
        </div>
        <button
          type="button"
          className="btn-ghost h-11"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters
        </button>
        <button type="button" className="btn-ghost h-11" onClick={onClear}>
          Clear
        </button>
      </div>
      {filtersOpen && (
        <div id={filtersId} className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          />
          <TextField
            label="Max price"
            type="number"
            min="0"
            step="0.01"
            value={values.maxPrice}
            onChange={set('maxPrice')}
          />
          <label className="flex h-11 cursor-pointer items-center gap-3 text-sm uppercase tracking-[2px]">
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
