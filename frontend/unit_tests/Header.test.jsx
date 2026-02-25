import { render, screen } from "@testing-library/react";
import Header from "../src/components/Header";

test("renders header title", () => {
  render(<Header />);
  expect(screen.getByText("ParlAI Sports Betting App")).toBeInTheDocument();
});

test("renders all navigation links", () => {
  render(<Header />);
  const links = ["Home", "Games", "Players", "My Bets", "Login"];
  links.forEach(link => {
    expect(screen.getByText(link)).toBeInTheDocument();
  });
});
