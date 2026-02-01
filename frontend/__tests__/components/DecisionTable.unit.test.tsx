import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DecisionTable } from '@/components/DecisionTable';

describe('DecisionTable - Unit Tests', () => {
  const mockDecisions = [
    {
      id: '1',
      title: 'Create New Account',
      description: 'Create production account for new service',
      status: 'pending',
      priority: 'high',
      createdAt: '2026-01-30T10:00:00Z',
      estimatedImpact: 'medium',
    },
    {
      id: '2',
      title: 'Apply Security Policy',
      description: 'Apply MFA requirement policy',
      status: 'approved',
      priority: 'critical',
      createdAt: '2026-01-30T09:00:00Z',
      estimatedImpact: 'high',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table with decisions', () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      expect(screen.getByText('Create New Account')).toBeInTheDocument();
      expect(screen.getByText('Apply Security Policy')).toBeInTheDocument();
    });

    it('should display all table columns', () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('should render empty state when no decisions', () => {
      render(<DecisionTable decisions={[]} />);
      
      expect(screen.getByText(/no decisions found/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should filter by status', async () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      const statusFilter = screen.getByLabelText(/filter by status/i);
      await userEvent.selectOptions(statusFilter, 'pending');
      
      expect(screen.getByText('Create New Account')).toBeInTheDocument();
      expect(screen.queryByText('Apply Security Policy')).not.toBeInTheDocument();
    });

    it('should filter by priority', async () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      const priorityFilter = screen.getByLabelText(/filter by priority/i);
      await userEvent.selectOptions(priorityFilter, 'critical');
      
      expect(screen.queryByText('Create New Account')).not.toBeInTheDocument();
      expect(screen.getByText('Apply Security Policy')).toBeInTheDocument();
    });

    it('should search by title', async () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      const searchInput = screen.getByPlaceholderText(/search decisions/i);
      await userEvent.type(searchInput, 'Security');
      
      await waitFor(() => {
        expect(screen.getByText('Apply Security Policy')).toBeInTheDocument();
        expect(screen.queryByText('Create New Account')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by title ascending', async () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      const titleHeader = screen.getByText('Title');
      await userEvent.click(titleHeader);
      
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Apply Security Policy');
      expect(rows[2]).toHaveTextContent('Create New Account');
    });

    it('should sort by date descending', async () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      const dateHeader = screen.getByText('Created');
      await userEvent.click(dateHeader);
      
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('Create New Account');
      expect(rows[2]).toHaveTextContent('Apply Security Policy');
    });
  });

  describe('Row Actions', () => {
    it('should call onApprove when approve button clicked', async () => {
      const onApprove = jest.fn();
      render(<DecisionTable decisions={mockDecisions} onApprove={onApprove} />);
      
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      await userEvent.click(approveButtons[0]);
      
      expect(onApprove).toHaveBeenCalledWith('1');
    });

    it('should call onReject when reject button clicked', async () => {
      const onReject = jest.fn();
      render(<DecisionTable decisions={mockDecisions} onReject={onReject} />);
      
      const rejectButtons = screen.getAllByRole('button', { name: /reject/i });
      await userEvent.click(rejectButtons[0]);
      
      expect(onReject).toHaveBeenCalledWith('1');
    });

    it('should open details modal when row clicked', async () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      const firstRow = screen.getByText('Create New Account');
      await userEvent.click(firstRow);
      
      await waitFor(() => {
        expect(screen.getByText(/decision details/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      expect(screen.getByRole('table')).toHaveAttribute('aria-label', 'Decisions table');
    });

    it('should support keyboard navigation', async () => {
      render(<DecisionTable decisions={mockDecisions} />);
      
      const firstRow = screen.getAllByRole('row')[1];
      firstRow.focus();
      
      fireEvent.keyDown(firstRow, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText(/decision details/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading skeleton', () => {
      render(<DecisionTable decisions={mockDecisions} loading={true} />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should disable actions while loading', () => {
      render(<DecisionTable decisions={mockDecisions} loading={true} />);
      
      const approveButtons = screen.getAllByRole('button', { name: /approve/i });
      expect(approveButtons[0]).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      const error = 'Failed to load decisions';
      render(<DecisionTable decisions={[]} error={error} />);
      
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      const onRetry = jest.fn();
      render(<DecisionTable decisions={[]} error="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    const manyDecisions = Array.from({ length: 50 }, (_, i) => ({
      id: String(i),
      title: `Decision ${i}`,
      status: 'pending',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    }));

    it('should paginate results', () => {
      render(<DecisionTable decisions={manyDecisions} pageSize={10} />);
      
      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(11); // 10 data rows + 1 header
    });

    it('should navigate to next page', async () => {
      render(<DecisionTable decisions={manyDecisions} pageSize={10} />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);
      
      expect(screen.getByText('Decision 10')).toBeInTheDocument();
    });
  });
});
