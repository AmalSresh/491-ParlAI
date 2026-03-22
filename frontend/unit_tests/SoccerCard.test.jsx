import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SoccerCard from '../src/components/SoccerCard';

const mockGame = {
  status: 'live',
  startTime: '2026-03-20T18:00:00Z',
  homeTeam: 'Arsenal',
  awayTeam: 'Chelsea',
  homeScore: 2,
  awayScore: 1,
  homeLogo: '',
  awayLogo: '',
  mainOdds: '-150 / +220 / +300',
  totalLine: '2.5',
  overOdds: '-110',
  underOdds: '-110',
};

describe('SoccerCard Component', () => {
  // 🔹 Helper to reduce repetition
  const renderComponent = (game = mockGame) => {
    return render(<SoccerCard game={game} />);
  };

  test('renders teams and scores correctly', () => {
    renderComponent();

    // Use accessible roles instead of ambiguous text
    expect(
      screen.getByRole('heading', { name: /arsenal/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: /chelsea/i }),
    ).toBeInTheDocument();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('renders moneyline odds correctly', () => {
    renderComponent();

    expect(screen.getByText('-150')).toBeInTheDocument();
    expect(screen.getByText('+220')).toBeInTheDocument();
    expect(screen.getByText('+300')).toBeInTheDocument();
  });

  test('displays LIVE indicator when game is in progress', () => {
    renderComponent();

    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  test('displays FINAL status when game is completed', () => {
    renderComponent({ ...mockGame, status: 'finished' });

    expect(screen.getByText(/final/i)).toBeInTheDocument();
  });

  test('toggles expanded section on user interaction', async () => {
    renderComponent();

    const toggleText = screen.getByText(/click for more bets/i);

    // Expand
    fireEvent.click(toggleText);

    expect(
      await screen.findByText(/additional betting markets/i),
    ).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText(/click to hide extra bets/i));

    await waitFor(() => {
      expect(
        screen.queryByText(/additional betting markets/i),
      ).not.toBeInTheDocument();
    });
  });

  test('renders total goals and additional odds when expanded', async () => {
    renderComponent();

    fireEvent.click(screen.getByText(/click for more bets/i));

    expect(await screen.findByText(/total goals/i)).toBeInTheDocument();

    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('Over')).toBeInTheDocument();
    expect(screen.getByText('Under')).toBeInTheDocument();

    // Multiple -110 values (Over & Under)
    const odds = screen.getAllByText('-110');
    expect(odds.length).toBeGreaterThanOrEqual(2);
  });
});
