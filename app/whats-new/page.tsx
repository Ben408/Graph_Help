import type { Metadata } from "next";
import { WhatsNewContent } from "@/components/whats-new-content";

export const metadata: Metadata = {
  title: "What's New - 2026 R3 | Sage Intacct Knowledge Graph",
  description:
    "Explore the latest features and enhancements in Sage Intacct 2026 Release 3, including Smart Excel reporting, AP Automation anomaly detection, and more.",
};

export default function WhatsNewPage() {
  return <WhatsNewContent />;
}
