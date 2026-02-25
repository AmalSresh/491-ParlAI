import { render, screen } from "@testing-library/react";
import Homepage from "../src/pages/Homepage";
test("renders Today's Games heading", () => {
  render(<Homepage />);
  expect(screen.getByText("Today's Games")).toBeInTheDocument();
});

test("renders Header and Footer", () => {
  render(<Homepage />);
  expect(screen.getByText("ParlAI Sports Betting App")).toBeInTheDocument();
  expect(
    screen.getByText("© 2026 ParlAI - AI-Powered Sports Predictions")
  ).toBeInTheDocument();
});

test("renders exactly 3 GameCards", () => {
  render(<Homepage />);
  const cards = screen.getAllByText(/win probability/i);
  expect(cards.length).toBe(3);
});