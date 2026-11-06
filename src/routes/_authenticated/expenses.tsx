import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/transactions/ledger-page";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — PaisaFlow" },
      { name: "description", content: "Track every expense in your PaisaFlow ledger with filters and insights." },
      { property: "og:title", content: "Expenses — PaisaFlow" },
      { property: "og:description", content: "Track every expense in your PaisaFlow ledger with filters and insights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LedgerPage type="expense" />,
});
