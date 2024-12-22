export default function FeatureCards() {
  const features = [
    {
      title: 'Virtual Receptionist',
      description: '24/7 AI-powered customer service handling calls and inquiries.',
    },
    {
      title: 'Order Management',
      description: 'Streamline your order processing and delivery operations.',
    },
    {
      title: 'SMS Marketing',
      description: 'Engage customers with targeted SMS campaigns and promotions.',
    },
  ];

  return (
    <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <div key={feature.title} className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
          <p className="mt-2 text-gray-600">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
