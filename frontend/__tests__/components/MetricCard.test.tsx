import { render, screen } from '@testing-library/react';
import MetricCard from '@/components/MetricCard';

describe('MetricCard', () => {
  const mockProps = {
    title: 'Total Accounts',
    value: '42',
    change: '+12%',
    trend: 'up' as const,
  };

  it('renders metric card with correct data', () => {
    render(<MetricCard {...mockProps} />);
    
    expect(screen.getByText('Total Accounts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('shows up trend indicator', () => {
    render(<MetricCard {...mockProps} />);
    
    const trendIndicator = screen.getByTestId('trend-indicator');
    expect(trendIndicator).toHaveClass('trend-up');
  });

  it('shows down trend indicator', () => {
    render(<MetricCard {...mockProps} trend="down" />);
    
    const trendIndicator = screen.getByTestId('trend-indicator');
    expect(trendIndicator).toHaveClass('trend-down');
  });

  it('is accessible', () => {
    const { container } = render(<MetricCard {...mockProps} />);
    
    expect(container.querySelector('[role="article"]')).toBeInTheDocument();
  });
});
