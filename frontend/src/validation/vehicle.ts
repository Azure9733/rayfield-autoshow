// Client-side copies of the backend's vehicle rules and messages (backend/src/modules/vehicles/
// vehicles.schemas.ts); the backend still validates everything.
import type { Vehicle, VehicleInput } from '../api/vehicles';
import { CATEGORIES } from '../constants/categories';
import type { FieldErrors } from './types';

/** The vehicle form's raw input values (strings, as typed). */
export interface VehicleFormValues {
  make: string;
  model: string;
  year: string;
  category: string;
  price: string;
  imageUrl: string;
  quantity: string;
}

const priceMessage = 'Price must be between $0.01 and $100,000,000, with up to 2 decimals';

/** True when `n` has at most 2 decimals, allowing for float noise (19.99 * 100 isn't whole). */
function hasCents(n: number) {
  return Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
}

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Returns a message per invalid field; an empty object means the form can be sent.
 * `withQuantity` is false for edits, where stock only changes via purchase / restock.
 */
export function validateVehicle(
  values: VehicleFormValues,
  { withQuantity }: { withQuantity: boolean },
): FieldErrors<VehicleFormValues> {
  const errors: FieldErrors<VehicleFormValues> = {};
  for (const [field, label] of [
    ['make', 'Make'],
    ['model', 'Model'],
  ] as const) {
    const length = values[field].trim().length;
    if (length < 1 || length > 50) errors[field] = `${label} must be 1–50 characters`;
  }

  // Computed per call, like the backend, so the limit rolls over on 1 January.
  const lastYear = new Date().getFullYear() + 1;
  const year = Number(values.year);
  if (values.year.trim() === '' || !Number.isInteger(year) || year < 1900 || year > lastYear) {
    errors.year = `Year must be a whole number from 1900 to ${lastYear}`;
  }

  if (!(CATEGORIES as readonly string[]).includes(values.category)) {
    errors.category = `Category must be one of: ${CATEGORIES.join(', ')}`;
  }

  const price = Number(values.price);
  if (values.price.trim() === '' || !(price > 0) || price > 100_000_000 || !hasCents(price)) {
    errors.price = priceMessage;
  }

  if (values.imageUrl.trim() !== '' && !isHttpsUrl(values.imageUrl.trim())) {
    errors.imageUrl = 'Image URL must be a valid https:// address';
  }

  const quantity = Number(values.quantity);
  if (
    withQuantity &&
    (values.quantity.trim() === '' ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      quantity > 10_000)
  ) {
    errors.quantity = 'Quantity must be a whole number from 0 to 10,000';
  }
  return errors;
}

/** Converts valid form values to the API body; a blank image URL is left out. */
export function toVehicleInput(
  values: VehicleFormValues,
  { withQuantity }: { withQuantity: boolean },
): VehicleInput {
  const imageUrl = values.imageUrl.trim();
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    year: Number(values.year),
    category: values.category,
    price: Number(values.price),
    ...(imageUrl && { imageUrl }),
    ...(withQuantity && { quantity: Number(values.quantity) }),
  };
}

/** Form values for editing an existing vehicle (quantity isn't edited, so it's left blank). */
export function toFormValues(vehicle: Vehicle): VehicleFormValues {
  return {
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    category: vehicle.category,
    price: String(vehicle.price),
    imageUrl: vehicle.imageUrl ?? '',
    quantity: '',
  };
}
