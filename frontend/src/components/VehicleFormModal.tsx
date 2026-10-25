import { useId, useState, type FormEvent } from 'react';
import { ApiError } from '../api/client';
import type { VehicleInput } from '../api/vehicles';
import { CATEGORIES } from '../constants/categories';
import type { FieldErrors } from '../validation/types';
import { toVehicleInput, validateVehicle, type VehicleFormValues } from '../validation/vehicle';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

const EMPTY: VehicleFormValues = {
  make: '',
  model: '',
  year: '',
  category: '',
  price: '',
  imageUrl: '',
  quantity: '0',
};

interface Props {
  title: string;
  /** Quantity is only asked for when adding (initial stock); edits leave stock alone. */
  withQuantity: boolean;
  /** Sends the vehicle; a rejected ApiError is shown in the form. */
  onSave: (input: VehicleInput) => Promise<void>;
  onClose: () => void;
}

/** Add / edit vehicle form in a modal panel (UI_PLAN.md §6); full-screen on mobile. */
export function VehicleFormModal({ title, withQuantity, onSave, onClose }: Props) {
  const titleId = useId();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<VehicleFormValues>>({});
  const [formError, setFormError] = useState('');

  const field = (name: keyof VehicleFormValues) => ({
    value: values[name],
    error: errors[name],
    onChange: (value: string) => setValues((v) => ({ ...v, [name]: value })),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateVehicle(values, { withQuantity });
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length > 0) return;

    try {
      await onSave(toVehicleInput(values, { withQuantity }));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      // details[].field uses the API's names, which match the form's keys.
      if (e.details.length > 0) {
        setErrors(Object.fromEntries(e.details.map((d) => [d.field, d.message])));
      } else {
        setFormError(e.message);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="cyber-panel h-full w-full overflow-y-auto p-6 sm:h-auto sm:max-h-[90vh] sm:max-w-lg md:p-8"
      >
        {/* noValidate: our messages match the backend's, the browser's wouldn't */}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <h2 id={titleId} className="text-2xl font-bold uppercase tracking-[3px]">
            {title}
          </h2>
          {formError && (
            <p role="alert" className="cyber-error">
              {formError}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Make" {...field('make')} />
            <TextField label="Model" {...field('model')} />
            <TextField label="Year" type="number" inputMode="numeric" {...field('year')} />
            <SelectField
              label="Category"
              options={CATEGORIES}
              emptyLabel="Choose…"
              {...field('category')}
            />
            <TextField label="Price" type="number" step="0.01" min="0" {...field('price')} />
            {withQuantity && (
              <TextField label="Quantity" type="number" min="0" {...field('quantity')} />
            )}
          </div>
          <TextField label="Image URL" type="url" placeholder="https://" {...field('imageUrl')} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-cyber" data-text="Save">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
