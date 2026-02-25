import { render, screen } from "@testing-library/react";
import Sidebar from "../src/components/Sidebar";

test("renders sidebar title", () => {
  render(<Sidebar />);
  expect(screen.getByText("Leagues")).toBeInTheDocument();
});

test("renders all league items", () => {
  render(<Sidebar />);
  const leagues = ["NBA", "NFL", "MLB", "NHL", "MLS", "Tennis", "UFC"];
  leagues.forEach(league => {
    expect(screen.getByText(new RegExp(league, "i"))).toBeInTheDocument();
  });
});