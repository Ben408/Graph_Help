import { GraphExplorer } from "@/components/graph-explorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore - Sage Intacct",
  description: "Progressive concept map of Sage Intacct domains and relationships.",
};

export default function GraphPage() {
  return <GraphExplorer />;
}
