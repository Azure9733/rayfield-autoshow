import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { validateRegister, type FieldErrors, type RegisterValues } from '../validation/auth';

/** `/register`: create an account. */
export function RegisterPage() {
  const [values, setValues] = useState<RegisterValues>({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<FieldErrors<RegisterValues>>({});
  const [formError, setFormError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const field = (name: keyof RegisterValues) => ({
    value: values[name],
    error: errors[name],
    onChange: (value: string) => setValues((v) => ({ ...v, [name]: value })),
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateRegister(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const { name, email, password } = values;
    setFormError('');
    try {
      await register({ name, email, password });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      setFormError(error.message);
      return;
    }
    navigate('/');
  }

  return (
    <main className="flex-1 flex justify-center px-4 py-10 md:py-16">
      {/* noValidate: our messages match the backend's, the browser's wouldn't */}
      <form
        noValidate
        onSubmit={handleSubmit}
        className="cyber-panel w-full max-w-md p-6 md:p-8 space-y-5 self-start"
      >
        <h1 className="glitch text-3xl uppercase" data-text="Register">
          Register
        </h1>
        {formError && (
          <p role="alert" className="cyber-error">
            {formError}
          </p>
        )}
        <TextField label="Name" autoComplete="name" {...field('name')} />
        <TextField label="Email" type="email" autoComplete="email" {...field('email')} />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          {...field('password')}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          {...field('confirm')}
        />
        <button type="submit" className="btn-cyber w-full" data-text="Register">
          Register
        </button>
        <p className="text-sm text-cp-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-cp-cyan underline underline-offset-4">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
