import { AdminPageContent } from "@/components/admin-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnostics",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPageContent />;
}
