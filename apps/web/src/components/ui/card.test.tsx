import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card Components", () => {
  it("renders Card with children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("renders CardHeader with title and description", () => {
    render(
      <CardHeader>
        <CardTitle>Test Title</CardTitle>
        <CardDescription>Test Description</CardDescription>
      </CardHeader>
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("renders CardContent", () => {
    render(<CardContent>Content text</CardContent>);
    expect(screen.getByText("Content text")).toBeInTheDocument();
  });

  it("renders CardFooter", () => {
    render(<CardFooter>Footer text</CardFooter>);
    expect(screen.getByText("Footer text")).toBeInTheDocument();
  });

  it("renders complete Card structure", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>With all parts</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer content</CardFooter>
      </Card>
    );

    expect(screen.getByText("Complete Card")).toBeInTheDocument();
    expect(screen.getByText("With all parts")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });
});
