import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/app/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SUPERIOR BATH FITTINGS — Production Tracker" },
      { name: "description", content: "Track customer orders and aggregate production totals for brass bath-fittings." },
    ],
  }),
  component: App,
});
