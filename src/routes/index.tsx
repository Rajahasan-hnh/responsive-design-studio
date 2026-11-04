import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Session-aware entry: signed-in users land on the dashboard via the
 * `_authenticated` gate; everyone else is sent to sign-in by that same gate.
 */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "PaisaFlow — Personal Finance Manager" },
      {
        name: "description",
        content:
          "PaisaFlow helps you track income, expenses, budgets, savings and reports in one elegant personal finance dashboard.",
      },
    ],
  }),
});
