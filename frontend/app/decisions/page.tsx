'use client';

import Navigation from '@/components/Navigation';

export default function DecisionsPage() {
  const decisions = [
    {
      id: 'dec-001',
      title: 'Create Production OU',
      description: 'Create a new Organizational Unit for production workloads',
      type: 'OU_CREATE',
      status: 'pending',
      confidence: 0.98,
      timeline: 'Just now',
    },
    {
      id: 'dec-002',
      title: 'Attach Security Policy',
      description: 'Attach DenyUnauthorizedRegions SCP to production OU',
      type: 'POLICY_ATTACH',
      status: 'pending',
      confidence: 0.95,
      timeline: '5 mins ago',
    },
    {
      id: 'dec-003',
      title: 'Move Account',
      description: 'Move AWS-Prod-001 to Production OU',
      type: 'ACCOUNT_MOVE',
      status: 'approved',
      confidence: 0.92,
      timeline: '1 hour ago',
    },
  ];

  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Governance Decisions</h1>

        <div className="space-y-4">
          {decisions.map((decision) => (
            <div key={decision.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{decision.title}</h3>
                  <p className="text-gray-400 text-sm mb-3">
                    {decision.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Type: <span className="text-white">{decision.type}</span>
                    </span>
                    <span className="text-gray-500">
                      Confidence:{' '}
                      <span className="text-white">
                        {Math.round(decision.confidence * 100)}%
                      </span>
                    </span>
                    <span className="text-gray-500">{decision.timeline}</span>
                  </div>
                </div>
                <span
                  className={`badge-${decision.status === 'approved' ? 'success' : 'warning'} whitespace-nowrap ml-4`}
                >
                  {decision.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
