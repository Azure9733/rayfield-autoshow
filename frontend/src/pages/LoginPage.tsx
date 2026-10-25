import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router';
import { ApiError } from '../api/client';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';

/** `/login`. Also shows a notice passed in router state (e.g. "session expired"). */
export function LoginPage() {
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login } = useAuth();

  // No client-side rules: like the backend, any wrong input just gets "Invalid email or password".
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');
    try {
      await login(email, password);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setFormError(error.message);
    }
  }

  return (
    <main className="flex-1 flex justify-center px-4 py-10 md:py-16">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="cyber-panel w-full max-w-md p-6 md:p-8 space-y-5 self-start"
      >
        <h1 className="glitch text-3xl uppercase" data-text="Log in">
          Log in
        </h1>
        {notice && (
          <p role="status" className="text-cp-cyan">
            {notice}
          </p>
        )}
        {formError && (
          <p role="alert" className="cyber-error">
            {formError}
          </p>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        <button type="submit" className="btn-cyber w-full" data-text="Log in">
          Log in
        </button>
        <p className="text-sm text-cp-muted">
          New here?{' '}
          <Link to="/register" className="text-cp-cyan underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
