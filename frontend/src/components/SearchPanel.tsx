import { useState, type FormEvent } from 'react';
import type { SearchFilters } from '../api/vehicles';
import { CATEGORIES } from '../constants/categories';
import { TextField } from './TextField';

const EMPTY: Required<SearchFilters> = {
  make: '',
  model: '',
  category: '',
  minPrice: '',
  maxPrice: '',
};

interface Props {
  onSearch: (filters: SearchFilters) => void;
  /** Client-side filter (the API has none): applies as soon as it's toggled. */
  inStockOnly: boolean;
  onInStockOnlyChange: (checked: boolean) => void;
}

/** Search filters (UI_PLAN.md §3). Calls onSearch with the form values on submit. */
export function SearchPanel({ onSearch, inStockOnly, onInStockOnlyChange }: Props) {
  const [values, setValues] = useState(EMPTY);

  const field = (name: keyof SearchFilters) => ({
    value: values[name],
    onChange: (value: string) => setValues((v) => ({ ...v, [name]: value })),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSearch(values);
  }

  return (
    <form
      role="search"
      aria-label="Search vehicles"
      onSubmit={handleSubmit}
      className="cyber-panel space-y-4 self-start p-5"
    >
      <h2 className="text-xl font-bold uppercase tracking-[3px]">Search</h2>
      <TextField label="Make" {...field('make')} />
      <TextField label="Model" {...field('model')} />
      <div>
        <label className="cyber-label" htmlFor="search-category">
          Category
        </label>
        <select
          id="search-category"
          className="cyber-input"
          value={values.category}
          onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
        >
          <option value="">All</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Min price" type="number" min="0" step="0.01" {...field('minPrice')} />
        <TextField label="Max price" type="number" min="0" step="0.01" {...field('maxPrice')} />
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
      <button type="submit" className="btn-cyber w-full" data-text="Search">
        Search
      </button>
    </form>
  );
}
