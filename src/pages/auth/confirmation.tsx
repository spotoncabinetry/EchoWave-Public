import AuthLayout from '../../components/auth/AuthLayout';
import Link from 'next/link';

export default function ConfirmationPage() {
  return (
    <AuthLayout title="Check your email">
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p className="text-center">
            We&apos;ve sent you an email with a confirmation link. Please check your email and click the link to verify your account.
          </p>
        </div>

        <div className="text-center text-gray-600">
          <p>After confirming your email, you can sign in to your account.</p>
        </div>

        <div className="text-center">
          <Link 
            href="/auth/login"
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
