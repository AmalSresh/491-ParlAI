import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../src/components/Sidebar";
import Footer from "../src/components/Footer";

test("renders sidebar title", () => {
  render(<MemoryRouter><Sidebar /></MemoryRouter>);
  expect(screen.getByText("Leagues")).toBeInTheDocument();
});

test("renders footer text", () => {
  render(<Footer />);
  expect(
    screen.getByText("© 2026 ParlAI - AI-Powered Sports Predictions")
  ).toBeInTheDocument();
});