import { useEffect, useState } from 'react';
import UserDashboardLayout from '../../../../components/user/dashboard/UserDashboardLayout';
import { useAuth } from '../../../../contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  items: OrderItem[];
  created_at: string;
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
  name: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            id,
            menu_item_id,
            quantity,
            price,
            name
          )
        `)
        .eq('profile_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {orders.map((order) => (
              <li key={order.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Customer Details</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.customer_name} • {order.phone_number}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Order Items</h4>
                  <ul className="mt-2 divide-y divide-gray-200">
                    {order.items.map((item) => (
                      <li key={item.id} className="py-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-900">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-sm text-gray-500">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex justify-between font-medium">
                    <span>Total</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'confirmed')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Confirm Order
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {order.status === 'confirmed' && (
                  <div className="mt-4">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Mark as Completed
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </UserDashboardLayout>
  );
}
