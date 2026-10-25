import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError } from '../api/client';
import { AuthForm } from '../components/AuthForm';
import { TextField } from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { validateRegister, type RegisterValues } from '../validation/auth';
import type { FieldErrors } from '../validation/types';

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
    <AuthForm
      title="Register"
      onSubmit={handleSubmit}
      error={formError}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-cp-cyan underline underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
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
    </AuthForm>
  );
}
