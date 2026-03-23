import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../src/components/Sidebar';

test('renders sidebar title', async () => {
  render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>,
  );
  expect(await screen.findByText('Leagues')).toBeInTheDocument();
});

test('renders all league items', async () => {
  render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>,
  );

  const leagues = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'UFC'];

  for (const league of leagues) {
    expect(
      await screen.findByText(new RegExp(league, 'i')),
    ).toBeInTheDocument();
  }
});