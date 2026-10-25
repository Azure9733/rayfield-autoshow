import type { FormEvent } from 'react';
import type { SearchFilters } from '../api/vehicles';
import { CATEGORIES } from '../constants/categories';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

interface Props {
  values: Required<SearchFilters>;
  onChange: (values: Required<SearchFilters>) => void;
  onSearch: () => void;
  onClear: () => void;
  /** Client-side filter (the API has none): applies as soon as it's toggled. */
  inStockOnly: boolean;
  onInStockOnlyChange: (checked: boolean) => void;
}

/**
 * Search filters (UI_PLAN.md §3). Controlled by the page, which also needs to clear them
 * (e.g. from the no-results message).
 */
export function SearchPanel({
  values,
  onChange,
  onSearch,
  onClear,
  inStockOnly,
  onInStockOnlyChange,
}: Props) {
  const set = (name: keyof SearchFilters) => (value: string) =>
    onChange({ ...values, [name]: value });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch();
  }

  return (
    <form
      role="search"
      aria-label="Search vehicles"
      onSubmit={handleSubmit}
      className="cyber-panel space-y-4 self-start p-5"
    >
      <h2 className="text-xl font-bold uppercase tracking-[3px]">Search</h2>
      <TextField label="Make" value={values.make} onChange={set('make')} />
      <TextField label="Model" value={values.model} onChange={set('model')} />
      <SelectField
        label="Category"
        options={CATEGORIES}
        emptyLabel="All"
        value={values.category}
        onChange={set('category')}
      />
      <div className="grid grid-cols-2 gap-3">
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
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm uppercase tracking-[2px]">
        <input
          type="checkbox"
          className="size-4 accent-cp-yellow"
          checked={inStockOnly}
          onChange={(e) => onInStockOnlyChange(e.target.checked)}
        />
        In stock only
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-cyber flex-1" data-text="Search">
          Search
        </button>
        <button type="button" className="btn-ghost" onClick={onClear}>
          Clear
        </button>
      </div>
    </form>
  );
}
