import { createFileRoute } from "@tanstack/react-router";
import { LedgerPage } from "@/components/transactions/ledger-page";

export const Route = createFileRoute("/_authenticated/income")({
  head: () => ({
    meta: [
      { title: "Income — PaisaFlow" },
      { name: "description", content: "Track every source of income in your PaisaFlow ledger." },
      { property: "og:title", content: "Income — PaisaFlow" },
      { property: "og:description", content: "Track every source of income in your PaisaFlow ledger." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <LedgerPage type="income" />,
});
