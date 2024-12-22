import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  useEffect(() => {
    // Check for message in URL query params
    const urlMessage = router.query.message as string;
    if (urlMessage) {
      setMessage(urlMessage);
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account before signing in. Check your spam folder if you don\'t see the confirmation email.');
        } else {
          setError(signInError.message);
        }
      }
      // Successful login will be handled by AuthContext's redirect
    } catch (err) {
      setError('Error signing in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className="p-4 rounded-md bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-700">{message}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
          {error.includes('Email not confirmed') && (
            <p className="mt-2 text-sm text-red-600">
              Check your email (including spam folder) for the confirmation link.
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className="text-center">
        <span className="text-gray-600">Don't have an account? </span>
        <Link
          href="/auth/signup"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Sign up
        </Link>
      </div>
    </form>
  );
}
