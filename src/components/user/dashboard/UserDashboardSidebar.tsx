import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { useState } from 'react';

const menuItems = [
  {
    name: 'Profile',
    href: '/user/dashboard/profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    name: 'Overview',
    href: '/user/dashboard',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: 'Menu Management',
    href: '/user/dashboard/menu',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: 'Orders',
    href: '/user/dashboard/orders',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    name: 'Settings',
    href: '/user/dashboard/settings',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function UserDashboardSidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const restaurantName = user?.user_metadata?.restaurantName;

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="md:hidden fixed bottom-4 right-4 p-2 rounded-full bg-blue-600 text-white shadow-lg z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Sidebar for both mobile and desktop */}
      <div className={`${
        isMobileMenuOpen ? 'fixed inset-0 z-40 md:hidden' : 'hidden md:flex md:flex-shrink-0'
      }`}>
        {/* Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className={`${
          isMobileMenuOpen
            ? 'fixed inset-y-0 left-0 flex flex-col w-64 bg-white'
            : 'flex flex-col w-64'
        }`}>
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
            {/* Restaurant Profile Section */}
            {restaurantName && (
              <div className="px-4 pb-4 border-b">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white">
                      {restaurantName.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{restaurantName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1 mt-4">
              {menuItems.map((item) => {
                const isActive = router.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div
                      className={`mr-3 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    >
                      {item.icon}
                    </div>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
