import { render, screen } from "@testing-library/react";
import Homepage from "../src/pages/Homepage";


test("full homepage renders with header, sidebar, games, and footer", () => {
  render(<Homepage />);

  
  expect(screen.getByText("ParlAI Sports Betting App")).toBeInTheDocument();


  
  expect(screen.getByText("Today's Games")).toBeInTheDocument();

  
  expect(screen.getAllByText(/win probability/i).length).toBe(3);

  
  expect(
    screen.getByText("© 2026 ParlAI - AI-Powered Sports Predictions")
  ).toBeInTheDocument();
});
