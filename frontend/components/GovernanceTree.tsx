'use client';

interface GovernanceTreeProps {
  root: OrganizationNode;
}

interface OrganizationNode {
  id: string;
  name: string;
  type: 'ROOT' | 'OU' | 'ACCOUNT';
  accountCount?: number;
  policyCount?: number;
  children?: OrganizationNode[];
  expanded?: boolean;
}

export default function GovernanceTree({ root }: GovernanceTreeProps) {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(
    new Set([root.id])
  );

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: OrganizationNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const icons = {
      ROOT: '🏛️',
      OU: '📁',
      ACCOUNT: '💼',
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-center gap-2 py-2 px-3 rounded hover:bg-dark-tertiary cursor-pointer group"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className="w-4" />}

          <span className="text-lg">{icons[node.type]}</span>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{node.name}</p>
            <p className="text-xs text-gray-500">{node.id}</p>
          </div>

          {node.accountCount !== undefined && (
            <span className="text-xs bg-indigo-600 px-2 py-1 rounded-full whitespace-nowrap">
              {node.accountCount} accounts
            </span>
          )}

          {node.policyCount !== undefined && (
            <span className="text-xs bg-purple-600 px-2 py-1 rounded-full whitespace-nowrap">
              {node.policyCount} policies
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-primary ml-4">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4">Organization Tree</h3>
      <div className="space-y-1">{renderNode(root)}</div>
    </div>
  );
}

import React from 'react';
