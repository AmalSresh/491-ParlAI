import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SoccerPage from '../src/pages/SoccerPage';

describe('SoccerPage Integration Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state initially', () => {
    global.fetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<SoccerPage />);

    expect(screen.getByText('Soccer Matches')).toBeInTheDocument();
    expect(screen.getByText('Loading live odds...')).toBeInTheDocument();
  });

  it('fetches games, parses complex odds, and renders SoccerCards', async () => {
    const mockBackendData = [
      {
        id: 1,
        apiId: 'event-123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        startTime: '2026-03-24T15:00:00Z',
        status: 'scheduled',
        markets: [
          {
            type: 'h2h',
            selections: [
              { label: 'Arsenal', odds: 150 },
              { label: 'Chelsea', odds: 200 },
              { label: 'Draw', odds: 220 },
            ],
          },
        ],
      },
    ];

    global.fetch.mockResolvedValueOnce({
      json: async () => mockBackendData,
    });

    render(<SoccerPage />);

    // Wait for the loading state to disappear
    await waitFor(() => {
      expect(
        screen.queryByText('Loading live odds...'),
      ).not.toBeInTheDocument();
    });

    const arsenalElements = screen.getAllByText('Arsenal');
    expect(arsenalElements.length).toBeGreaterThan(0);

    const chelseaElements = screen.getAllByText('Chelsea');
    expect(chelseaElements.length).toBeGreaterThan(0);

    // Check that the odds parsed correctly and made it into the UI
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('220')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();

    expect(global.fetch).toHaveBeenCalledWith('/api/getGames');
  });

  it('displays empty state when API returns no games', async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => [],
    });

    render(<SoccerPage />);

    await waitFor(() => {
      expect(screen.getByText('No games scheduled.')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<SoccerPage />);

    await waitFor(() => {
      expect(
        screen.queryByText('Loading live odds...'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('No games scheduled.')).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch games:',
      expect.any(Error),
    );
  });
});
