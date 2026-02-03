'use client';

import Navigation from '@/components/Navigation';

export default function GovernancePage() {
  const orgs = [
    {
      id: 'ou-001',
      name: 'Production',
      accounts: 15,
      policies: 5,
      status: 'healthy',
    },
    {
      id: 'ou-002',
      name: 'Development',
      accounts: 12,
      policies: 3,
      status: 'healthy',
    },
    {
      id: 'ou-003',
      name: 'Workloads',
      accounts: 20,
      policies: 4,
      status: warning,
    },
  ];

  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Organization Units</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orgs.map((ou) => (
            <div key={ou.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{ou.name}</h3>
                <span
                  className={`badge-${ou.status === 'healthy' ? 'success' : 'warning'}`}
                >
                  {ou.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Accounts</span>
                  <span className="font-semibold">{ou.accounts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Policies</span>
                  <span className="font-semibold">{ou.policies}</span>
                </div>
              </div>

              <button className="btn-secondary w-full text-sm">
                View Details
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
