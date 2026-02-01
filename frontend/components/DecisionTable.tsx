'use client';

import React from 'react';

interface Decision {
  id: string;
  title: string;
  type: 'OU_CREATE' | 'POLICY_ATTACH' | 'ACCOUNT_MOVE' | 'SCP_UPDATE';
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  timestamp: string;
  confidence: number;
  requiredApprovals: number;
  receivedApprovals: number;
}

interface DecisionTableProps {
  decisions: Decision[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusColors = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  executed: 'badge-info',
};

const typeIcons = {
  OU_CREATE: '📁',
  POLICY_ATTACH: '📎',
  ACCOUNT_MOVE: '➡️',
  SCP_UPDATE: '🔐',
};

export default function DecisionTable({
  decisions,
  onApprove,
  onReject,
}: DecisionTableProps) {
  return (
    <div className="card overflow-hidden">
      <h3 className="text-lg sm:text-xl font-bold mb-4">Pending Decisions</h3>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full text-xs sm:text-sm">
          <thead className="border-b border-primary">
            <tr>
              <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-300">
                Decision
              </th>
              <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-300 hidden sm:table-cell">
                Type
              </th>
              <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-300">
                Status
              </th>
              <th className="text-center py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-300 hidden md:table-cell">
                Confidence
              </th>
              <th className="text-right py-2 sm:py-3 px-2 sm:px-4 font-semibold text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((decision) => (
              <tr
                key={decision.id}
                className="border-b border-primary hover:bg-dark-tertiary"
              >
                <td className="py-3 px-2 sm:px-4">
                  <div>
                    <p className="font-medium text-xs sm:text-sm">{decision.title}</p>
                    <p className="text-gray-500 text-xs mt-1">{decision.id}</p>
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                  <span className="mr-1 text-sm">{typeIcons[decision.type]}</span>
                  <span className="text-xs">
                    {decision.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-3 px-2 sm:px-4">
                  <span className={statusColors[decision.status]}>
                    {decision.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-2 sm:px-4 text-center hidden md:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-12 bg-dark-tertiary rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                        style={{ width: `${decision.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs">
                      {Math.round(decision.confidence * 100)}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 sm:px-4 text-right">
                  {decision.status === 'pending' && onApprove && onReject && (
                    <div className="flex gap-1 sm:gap-2 justify-end flex-wrap">
                      <button
                        onClick={() => onApprove(decision.id)}
                        className="btn-primary text-xs py-1 px-2"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => onReject(decision.id)}
                        className="btn-ghost text-xs text-red-400 py-1 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
