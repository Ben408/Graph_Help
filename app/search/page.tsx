import { SearchPageContent } from "@/components/search-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find - Sage Intacct",
  description: "Search answers, tasks, concepts, Skill Paths, Help, and recent changes.",
};

export default function SearchPage() {
  return <SearchPageContent />;
}
