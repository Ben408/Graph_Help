import { concepts } from "@/data/concepts";
import { ConceptPageContent } from "@/components/concept-page-content";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return concepts.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const concept = concepts.find((c) => c.id === id);
  if (!concept) return { title: "Not Found" };
  return {
    title: `${concept.title} - Knowledge Graph`,
    description: concept.summary,
  };
}

export default async function ConceptPage({ params }: Props) {
  const { id } = await params;
  const concept = concepts.find((c) => c.id === id);
  if (!concept) notFound();
  return <ConceptPageContent conceptId={id} />;
}
