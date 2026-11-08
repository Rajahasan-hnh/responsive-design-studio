import { describe, expect, it } from "vitest";
import { filterTransactions, parseQuery } from "@/lib/search";

const now = new Date(2026, 10, 8); // Sun 8 Nov 2026

describe("parseQuery", () => {
  it("food expenses this month", () => {
    const p = parseQuery("Food expenses this month", now);
    expect(p).toMatchObject({ type: "expense", from: "2026-11-01", to: "2026-11-30", terms: ["food"] });
  });
  it("last week is previous Monday–Sunday", () => {
    const p = parseQuery("travel expenses last week", now);
    expect(p.from).toBe("2026-10-26");
    expect(p.to).toBe("2026-11-01");
  });
  it("purchases above 5000", () => {
    expect(parseQuery("purchases above Rs 5,000", now).minAmount).toBe(5000);
  });
});

describe("filterTransactions", () => {
  const cats = [
    { id: "c1", name: "Salary", kind: "income" as const, color: "#000" },
    { id: "c2", name: "Transport", kind: "expense" as const, color: "#000" },
  ];
  const txs = [
    { id: "1", type: "income" as const, amount: 90000, category_id: "c1", occurred_on: "2026-11-01", note: null },
    { id: "2", type: "expense" as const, amount: 800, category_id: "c2", occurred_on: "2026-10-28", note: null },
  ];
  it("salary transactions", () => {
    expect(filterTransactions(txs, cats, parseQuery("salary transactions", now)).map((t) => t.id)).toEqual(["1"]);
  });
  it("travel matches Transport", () => {
    expect(filterTransactions(txs, cats, parseQuery("travel last week", now)).map((t) => t.id)).toEqual(["2"]);
  });
});
