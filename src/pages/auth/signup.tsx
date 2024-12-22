import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../../components/auth/AuthLayout';
import SignupForm from '../../components/auth/SignupForm';
import { useAuth } from '../../contexts/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // If user exists but no profile setup, redirect to setup
      if (!user.user_metadata?.hasRestaurantProfile) {
        router.push('/auth/setup-profile');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout title="Create your account">
      <SignupForm />
    </AuthLayout>
  );
}
