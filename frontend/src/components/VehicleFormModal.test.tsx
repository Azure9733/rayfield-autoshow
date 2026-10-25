import { screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { loginAs, serveVehicles, inStock } from '../test/fixtures';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

const validForm = {
  Make: 'Toyota',
  Model: 'Supra',
  Year: '2024',
  Category: 'COUPE',
  Price: '55000',
  'Image URL': '',
  Quantity: '4',
};
type FormValues = typeof validForm;

async function openAddForm(user: UserEvent) {
  await screen.findByRole('article', { name: 'Toyota Land Cruiser' });
  await user.click(screen.getByRole('button', { name: 'Add vehicle' }));
  return screen.getByRole('dialog', { name: 'Add vehicle' });
}

/** Replaces each given field's value; Category is a select. */
async function fill(user: UserEvent, dialog: HTMLElement, values: Partial<FormValues>) {
  for (const [label, value] of Object.entries(values)) {
    const field = within(dialog).getByLabelText(label);
    if (label === 'Category') {
      await user.selectOptions(field, value);
    } else {
      await user.clear(field);
      if (value) await user.type(field, value);
    }
  }
}

const nextYear = new Date().getFullYear() + 1;

describe('vehicle form', () => {
  beforeEach(() => {
    loginAs('admin');
    serveVehicles(inStock);
  });

  it.each([
    ['an empty make', { Make: '' }, 'Make', 'Make must be 1–50 characters'],
    ['a 51-character model', { Model: 'x'.repeat(51) }, 'Model', 'Model must be 1–50 characters'],
    [
      'a year after next year',
      { Year: String(nextYear + 1) },
      'Year',
      `Year must be a whole number from 1900 to ${nextYear}`,
    ],
    [
      'a fractional year',
      { Year: '2024.5' },
      'Year',
      `Year must be a whole number from 1900 to ${nextYear}`,
    ],
    [
      'no category',
      { Category: '' },
      'Category',
      'Category must be one of: SEDAN, SUV, HATCHBACK, COUPE, CONVERTIBLE, TRUCK, VAN',
    ],
    [
      'a zero price',
      { Price: '0' },
      'Price',
      'Price must be between $0.01 and $100,000,000, with up to 2 decimals',
    ],
    [
      'a price with 3 decimals',
      { Price: '19.999' },
      'Price',
      'Price must be between $0.01 and $100,000,000, with up to 2 decimals',
    ],
    [
      'a quantity over 10,000',
      { Quantity: '10001' },
      'Quantity',
      'Quantity must be a whole number from 0 to 10,000',
    ],
    [
      'an http image URL',
      { 'Image URL': 'http://example.com/car.jpg' },
      'Image URL',
      'Image URL must be a valid https:// address',
    ],
  ])('shows a validation message for %s', async (_case, values, field, message) => {
    const { user } = renderApp('/');
    const dialog = await openAddForm(user);

    await fill(user, dialog, { ...validForm, ...values });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(within(dialog).getByLabelText(field)).toHaveAccessibleDescription(message);
  });

  it('shows server validation errors under the matching field', async () => {
    server.use(
      http.post('/api/vehicles', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [{ field: 'imageUrl', message: 'Image URL host is not allowed' }],
            },
          },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderApp('/');
    const dialog = await openAddForm(user);

    await fill(user, dialog, { ...validForm, 'Image URL': 'https://cdn.example.com/supra.jpg' });
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(within(dialog).getByLabelText('Image URL')).toHaveAccessibleDescription(
        'Image URL host is not allowed',
      ),
    );
  });
});
