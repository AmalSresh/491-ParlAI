/* global global */
import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import SoccerPage from '../src/pages/SoccerPage';

// 1. Mock the child component so we only test SoccerPage's logic
vi.mock('../src/components/SoccerCard', () => ({
  default: ({ game }) => (
    <div data-testid="mock-soccer-card">
      {game.homeTeam} vs {game.awayTeam} - {game.mainOdds}
    </div>
  ),
}));

// Mock data that mimics your backend structure
const mockBackendData = [
  {
    id: '1',
    homeTeam: 'Arsenal',
    awayTeam: 'Chelsea',
    scores: { home: 2, away: 1 },
    markets: [
      {
        type: 'h2h',
        selections: [
          { label: 'Arsenal', odds: '-150' },
          { label: 'Chelsea', odds: '+300' },
          { label: 'Draw', odds: '+220' },
        ],
      },
      {
        type: 'totals',
        selections: [
          { label: 'Over', lineValue: '2.5', odds: '-110' },
          { label: 'Under', lineValue: '2.5', odds: '-110' },
        ],
      },
    ],
  },
];

describe('SoccerPage Component', () => {
  // 1. Removed useFakeTimers from beforeEach so it doesn't break the other tests
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(window, 'setInterval');
    vi.spyOn(window, 'clearInterval');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers(); // Keep this to ensure timers reset safely after the final test
  });

  test('renders loading state initially', () => {
    global.fetch.mockImplementation(() => new Promise(() => {}));
    render(<SoccerPage />);
    expect(screen.getByText('Loading live odds...')).toBeInTheDocument();
  });

  test('renders empty state when no games are returned', async () => {
    global.fetch.mockResolvedValue({
      json: async () => [],
    });
    render(<SoccerPage />);
    expect(await screen.findByText('No games scheduled.')).toBeInTheDocument();
  });

  test('fetches and parses game data correctly', async () => {
    global.fetch.mockResolvedValue({
      json: async () => mockBackendData,
    });
    render(<SoccerPage />);

    const parsedCardText = await screen.findByText(
      'Arsenal vs Chelsea - -150 / +220 / +300',
    );
    expect(parsedCardText).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/getGames');
  });

  test('sets up and cleans up the polling interval', async () => {
    vi.useFakeTimers();

    // 👇 Spy AFTER fake timers are enabled
    const setIntervalSpy = vi.spyOn(window, 'setInterval');
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    global.fetch.mockResolvedValue({
      json: async () => [],
    });

    const { unmount } = render(<SoccerPage />);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 300000);

    // Trigger interval
    await act(async () => {
      vi.advanceTimersByTime(300000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
