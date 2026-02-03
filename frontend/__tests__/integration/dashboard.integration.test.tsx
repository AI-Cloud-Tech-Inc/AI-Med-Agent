import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import DashboardPage from '@/app/page';

// Mock API server
const server = setupServer(
  rest.get('/api/decisions', (req, res, ctx) => {
    return res(
      ctx.json({
        decisions: [
          { id: '1', title: 'Test Decision', status: 'pending' },
        ],
      })
    );
  }),
  rest.get('/api/metrics', (req, res, ctx) => {
    return res(
      ctx.json({
        totalAccounts: 42,
        pendingDecisions: 5,
        complianceScore: 95,
        costSavings: 12500,
      })
    );
  }),
  rest.post('/api/decisions/:id/approve', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard Page - Integration Tests', () => {
  describe('Data Fetching', () => {
    it('should fetch and display metrics on load', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('95')).toBeInTheDocument();
      });
    });

    it('should fetch and display decisions', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Decision')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get('/api/metrics', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/error loading metrics/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should approve decision and update UI', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Decision')).toBeInTheDocument();
      });

      const approveButton = screen.getByRole('button', { name: /approve/i });
      await userEvent.click(approveButton);

      await waitFor(() => {
        expect(screen.getByText(/decision approved/i)).toBeInTheDocument();
      });
    });

    it('should filter decisions by status', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Decision')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText(/filter by status/i);
      await userEvent.selectOptions(filterSelect, 'approved');

      await waitFor(() => {
        expect(screen.queryByText('Test Decision')).not.toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button clicked', async () => {
      const { rerender } = render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument();
      });

      server.use(
        rest.get('/api/metrics', (req, res, ctx) => {
          return res(ctx.json({ totalAccounts: 50 }));
        })
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll for updates automatically', async () => {
      jest.useFakeTimers();
      
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument();
      });

      server.use(
        rest.get('/api/metrics', (req, res, ctx) => {
          return res(ctx.json({ totalAccounts: 43 }));
        })
      );

      jest.advanceTimersByTime(30000); // 30 seconds

      await waitFor(() => {
        expect(screen.getByText('43')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Navigation', () => {
    it('should navigate to decisions page', async () => {
      render(<DashboardPage />);

      const decisionsLink = screen.getByRole('link', { name: /decisions/i });
      await userEvent.click(decisionsLink);

      expect(window.location.pathname).toBe('/decisions');
    });

    it('should navigate to organization page', async () => {
      render(<DashboardPage />);

      const orgLink = screen.getByRole('link', { name: /organization/i });
      await userEvent.click(orgLink);

      expect(window.location.pathname).toBe('/organization');
    });
  });

  describe('Responsive Behavior', () => {
    it('should show mobile menu on small screens', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<DashboardPage />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeVisible();
    });

    it('should hide sidebar on mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<DashboardPage />);

      const sidebar = screen.queryByRole('complementary');
      expect(sidebar).toHaveClass('hidden');
    });
  });
});
