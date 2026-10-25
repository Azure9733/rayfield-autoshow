import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { AuthForm } from '../components/AuthForm';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';

/** `/login`. Also shows a notice passed in router state (e.g. "session expired"). */
export function LoginPage() {
  const notice = (useLocation().state as { notice?: string } | null)?.notice;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // No client-side rules: like the backend, any wrong input just gets "Invalid email or password".
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');
    try {
      await login(email, password);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setFormError(error.message);
      return;
    }
    navigate('/');
  }

  return (
    <AuthForm
      title="Log in"
      onSubmit={handleSubmit}
      error={formError}
      notice={notice}
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="text-cp-cyan underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
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
    </AuthForm>
  );
}
