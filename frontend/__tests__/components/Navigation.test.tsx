import { render, screen } from '@testing-library/react';
import { Navigation } from '@/components/Navigation';

describe('Navigation', () => {
  it('renders navigation links', () => {
    render(<Navigation />);
    
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/decisions/i)).toBeInTheDocument();
    expect(screen.getByText(/organization/i)).toBeInTheDocument();
  });

  it('shows hamburger menu on mobile', () => {
    // Mock mobile viewport
    global.innerWidth = 375;
    global.innerHeight = 667;
    
    render(<Navigation />);
    
    const menuButton = screen.getByRole('button', { name: /menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('highlights active link', () => {
    render(<Navigation />);
    
    const dashboardLink = screen.getByText(/dashboard/i);
    expect(dashboardLink).toHaveClass('active');
  });
});
