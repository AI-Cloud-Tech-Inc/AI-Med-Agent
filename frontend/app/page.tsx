'use client';

import Navigation from '@/components/Navigation';
import MetricCard from '@/components/MetricCard';
import DecisionTable from '@/components/DecisionTable';
import GovernanceTree from '@/components/GovernanceTree';

const mockMetrics = [
  { title: 'Active Accounts', value: 47, change: '+3', trend: 'up' as const, icon: '💼' },
  { title: 'OUs Managed', value: 12, change: '+1', trend: 'up' as const, icon: '📁' },
  { title: 'Policies Active', value: 28, change: 'No change', trend: 'neutral' as const, icon: '📋' },
  { title: 'Agent Accuracy', value: '99.2%', change: '+0.5%', trend: 'up' as const, icon: '🎯' },
];

const mockDecisions = [
  {
    id: 'dec-001',
    title: 'Create Production OU under Workloads',
    type: 'OU_CREATE' as const,
    status: 'pending' as const,
    timestamp: '2024-01-15 10:30 AM',
    confidence: 0.98,
    requiredApprovals: 2,
    receivedApprovals: 1,
  },
  {
    id: 'dec-002',
    title: 'Attach DenyUnauthorizedRegions SCP',
    type: 'POLICY_ATTACH' as const,
    status: 'pending' as const,
    timestamp: '2024-01-15 09:15 AM',
    confidence: 0.95,
    requiredApprovals: 1,
    receivedApprovals: 0,
  },
  {
    id: 'dec-003',
    title: 'Move AWS-Prod-001 to Production OU',
    type: 'ACCOUNT_MOVE' as const,
    status: 'approved' as const,
    timestamp: '2024-01-14 03:20 PM',
    confidence: 0.92,
    requiredApprovals: 1,
    receivedApprovals: 1,
  },
];

const mockOrgTree = {
  id: 'r-abc123',
  name: 'AI-Healthcare Root',
  type: 'ROOT' as const,
  accountCount: 47,
  policyCount: 8,
  children: [
    {
      id: 'ou-001',
      name: 'Production',
      type: 'OU' as const,
      accountCount: 15,
      policyCount: 5,
      children: [
        {
          id: 'acc-001',
          name: 'AWS-Prod-001',
          type: 'ACCOUNT' as const,
          accountCount: 0,
          policyCount: 2,
        },
        {
          id: 'acc-002',
          name: 'AWS-Prod-002',
          type: 'ACCOUNT' as const,
          accountCount: 0,
          policyCount: 2,
        },
      ],
    },
    {
      id: 'ou-002',
      name: 'Development',
      type: 'OU' as const,
      accountCount: 12,
      policyCount: 3,
      children: [
        {
          id: 'acc-003',
          name: 'AWS-Dev-001',
          type: 'ACCOUNT' as const,
          accountCount: 0,
          policyCount: 1,
        },
      ],
    },
    {
      id: 'ou-003',
      name: 'Workloads',
      type: 'OU' as const,
      accountCount: 20,
      policyCount: 4,
    },
  ],
};

export default function Dashboard() {
  return (
    <div>
      <Navigation />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Governance Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Monitor and approve autonomous governance decisions
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          {mockMetrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Left: Governance Tree */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <GovernanceTree root={mockOrgTree} />
          </div>

          {/* Right: Decisions and Status */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-4 sm:space-y-8">
            <DecisionTable decisions={mockDecisions} />

            {/* System Status */}
            <div className="card">
              <h3 className="text-lg sm:text-xl font-bold mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Agent Status</span>
                  <span className="badge-success">Active</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Last Sync</span>
                  <span className="text-xs sm:text-sm">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Decision Queue</span>
                  <span className="badge-info">2 pending</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">API Health</span>
                  <span className="badge-success">Healthy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
