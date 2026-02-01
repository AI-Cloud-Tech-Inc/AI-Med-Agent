'use client';

import Navigation from '@/components/Navigation';

const stats = [
  { label: 'Total Decisions Made', value: 247, icon: '✅' },
  { label: 'Approval Rate', value: '98.2%', icon: '📊' },
  { label: 'Avg Response Time', value: '2.4m', icon: '⏱️' },
  { label: 'Last 24h Decisions', value: 32, icon: '📈' },
];

const events = [
  { timestamp: '2024-01-15 14:32', action: 'Approved decision', detail: 'dec-001' },
  { timestamp: '2024-01-15 14:15', action: 'New decision', detail: 'Create OU' },
  { timestamp: '2024-01-15 13:45', action: 'Rejected decision', detail: 'dec-002' },
  { timestamp: '2024-01-15 13:20', action: 'Approved decision', detail: 'dec-003' },
];

export default function AuditPage() {
  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8">Audit Trail</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="card">
              <p className="text-gray-400 text-sm">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Event Log */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4">Recent Events</h3>
          <div className="space-y-1">
            {events.map((event, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 px-3 rounded hover:bg-dark-tertiary group"
              >
                <div>
                  <p className="font-medium">{event.action}</p>
                  <p className="text-sm text-gray-500">{event.detail}</p>
                </div>
                <span className="text-xs text-gray-500">{event.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
