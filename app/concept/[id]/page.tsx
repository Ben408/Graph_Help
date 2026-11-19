import { ConceptPageContent } from "@/components/concept-page-content";
import {
  allConceptStaticParams,
  findConceptAcrossPacks,
} from "@/lib/knowledge";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pack?: string | string[] }>;
}

function packFromSearch(
  searchParams: { pack?: string | string[] }
): string | null {
  const raw = searchParams.pack;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw ?? null;
}

export async function generateStaticParams() {
  return allConceptStaticParams();
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { id } = await params;
  const preferred = packFromSearch(await searchParams);
  const hit = findConceptAcrossPacks(id, preferred);
  if (!hit) return { title: "Not Found" };
  return {
    title: `${hit.concept.title} - Knowledge Graph`,
    description: hit.concept.summary,
  };
}

export default async function ConceptPage({ params, searchParams }: Props) {
  const { id } = await params;
  const preferred = packFromSearch(await searchParams);
  const hit = findConceptAcrossPacks(id, preferred);
  if (!hit) notFound();
  return <ConceptPageContent conceptId={id} packId={hit.pack.id} />;
}
