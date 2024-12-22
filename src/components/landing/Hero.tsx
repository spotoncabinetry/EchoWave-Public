import Link from 'next/link';

export default function Hero() {
  return (
    <div className="text-center">
      <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
        AI-Powered Restaurant Management
      </h2>
      <p className="mt-4 text-xl text-gray-600">
        Automate customer interactions, manage orders, and grow your business with intelligent SMS marketing.
      </p>
      <div className="mt-8">
        <Link href="/auth/signup" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
          Get Started
        </Link>
      </div>
    </div>
  );
}
