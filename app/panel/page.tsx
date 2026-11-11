import type { Metadata } from "next";
import { PanelShell } from "@/components/panel-shell";

export const metadata: Metadata = {
  title: "Smart Help Panel",
  robots: { index: false, follow: false },
};

export default function PanelPage() {
  return <PanelShell />;
}
