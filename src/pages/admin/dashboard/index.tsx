import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminDashboardLayout from '../../../components/admin/dashboard/AdminDashboardLayout';
import { useAuth } from '../../../contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../../../types/supabase';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeUsers: 0,
    totalOrders: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.user_metadata?.role !== 'admin') {
        router.push('/user/dashboard');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user || user.user_metadata?.role !== 'admin') return;

      try {
        // Get total restaurants
        const { count: restaurantCount } = await supabase
          .from('restaurants')
          .select('*', { count: 'exact', head: true });

        // Get active users (users who have logged in within the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count: activeUsersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gt('last_sign_in', thirtyDaysAgo.toISOString());

        // Get total orders
        const { count: ordersCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalRestaurants: restaurantCount || 0,
          activeUsers: activeUsersCount || 0,
          totalOrders: ordersCount || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setDataLoading(false);
      }
    };

    fetchStats();
  }, [user, supabase]);

  if (loading || !user || user.user_metadata?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-red-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-red-900">Total Restaurants</h3>
            {dataLoading ? (
              <div className="animate-pulse h-9 bg-red-200 rounded w-16"></div>
            ) : (
              <p className="text-3xl font-bold text-red-600">{stats.totalRestaurants}</p>
            )}
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-purple-900">Active Users</h3>
            {dataLoading ? (
              <div className="animate-pulse h-9 bg-purple-200 rounded w-16"></div>
            ) : (
              <p className="text-3xl font-bold text-purple-600">{stats.activeUsers}</p>
            )}
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-green-900">Total Orders</h3>
            {dataLoading ? (
              <div className="animate-pulse h-9 bg-green-200 rounded w-16"></div>
            ) : (
              <p className="text-3xl font-bold text-green-600">{stats.totalOrders}</p>
            )}
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
