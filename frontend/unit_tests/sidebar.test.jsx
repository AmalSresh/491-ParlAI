import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Sidebar from "../src/components/Sidebar";

test("renders sidebar title", () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
  expect(screen.getByText("Leagues")).toBeInTheDocument();
  expect(await screen.findByText('Leagues')).toBeInTheDocument();
});

test("renders all league items", () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>
  );
  const leagues = ["NBA", "NFL", "MLB", "NHL", "MLS", "Tennis", "UFC"];
  leagues.forEach((league) => {
    expect(screen.getAllByText(new RegExp(league, "i"))[0]).toBeInTheDocument();
  });
});

  const leagues = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'UFC'];

  for (const league of leagues) {
    expect(
      await screen.findByText(new RegExp(league, 'i')),
    ).toBeInTheDocument();
  }
});
