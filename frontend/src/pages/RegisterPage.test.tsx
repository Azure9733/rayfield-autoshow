import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { loadSession } from '../api/session';
import { renderApp } from '../test/renderApp';
import { server } from '../test/server';

const valid = {
  name: 'Vik',
  email: 'vik@example.com',
  password: 'correct-horse',
  confirm: 'correct-horse',
};

async function fillAndSubmit(user: UserEvent, values: Partial<typeof valid> = {}) {
  const v = { ...valid, ...values };
  // user.type can't type an empty string, so only fill non-empty values.
  if (v.name) await user.type(screen.getByLabelText('Name'), v.name);
  if (v.email) await user.type(screen.getByLabelText('Email'), v.email);
  if (v.password) await user.type(screen.getByLabelText('Password'), v.password);
  if (v.confirm) await user.type(screen.getByLabelText('Confirm password'), v.confirm);
  await user.click(screen.getByRole('button', { name: 'Register' }));
}

describe('register page', () => {
  it.each([
    ['an empty name', 'Name', { name: '' }, 'Name must be 1–60 characters'],
    ['a blank name', 'Name', { name: '   ' }, 'Name must be 1–60 characters'],
    ['a 61-character name', 'Name', { name: 'x'.repeat(61) }, 'Name must be 1–60 characters'],
    ['an invalid email', 'Email', { email: 'not-an-email' }, 'Enter a valid email address'],
    [
      'a 5-character password',
      'Password',
      { password: 'short', confirm: 'short' },
      'Password must be at least 8 characters',
    ],
    // bcrypt's limit is 72 bytes; 'é' is 2 bytes in UTF-8, so 37 of them are 74 bytes.
    [
      'a 74-byte password',
      'Password',
      { password: 'é'.repeat(37), confirm: 'é'.repeat(37) },
      'Password is too long (max 72 characters)',
    ],
  ])('shows a validation message for %s', async (_case, field, values, message) => {
    const { user } = renderApp('/register');

    await fillAndSubmit(user, values);

    expect(await screen.findByLabelText(field)).toHaveAccessibleDescription(message);
  });

  it('shows an error and sends nothing when the passwords do not match', async () => {
    let sent = false;
    server.use(
      http.post('/api/auth/register', () => {
        sent = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const { user } = renderApp('/register');

    await fillAndSubmit(user, { confirm: 'correct-horsE' });

    expect(await screen.findByLabelText('Confirm password')).toHaveAccessibleDescription(
      "Passwords don't match",
    );
    expect(sent).toBe(false);
  });

  it('logs in automatically after a successful register and lands on /', async () => {
    const account = { id: 'u1', name: 'Vik', email: 'vik@example.com', role: 'user' };
    const requests: Record<string, unknown> = {};
    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        requests.register = await request.json();
        return HttpResponse.json(account, { status: 201 });
      }),
      http.post('/api/auth/login', async ({ request }) => {
        requests.login = await request.json();
        return HttpResponse.json({ token: 'new.jwt.token', user: account });
      }),
    );
    const { user } = renderApp('/register');

    await fillAndSubmit(user);

    expect(await screen.findByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
    expect(requests).toEqual({
      register: { name: 'Vik', email: 'vik@example.com', password: 'correct-horse' },
      login: { email: 'vik@example.com', password: 'correct-horse' },
    });
    expect(loadSession()).toEqual({ token: 'new.jwt.token', user: account });
  });
});
