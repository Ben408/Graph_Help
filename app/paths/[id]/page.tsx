import { SkillPathDetail } from "@/components/skill-path-detail";
import {
  allSkillPathStaticParams,
  findSkillPathAcrossPacks,
} from "@/lib/knowledge";
import { notFound } from "next/navigation";

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

export function generateStaticParams() {
  return allSkillPathStaticParams();
}

export default async function SkillPathPage({ params, searchParams }: Props) {
  const { id } = await params;
  const preferred = packFromSearch(await searchParams);
  const hit = findSkillPathAcrossPacks(id, preferred);
  if (!hit) notFound();
  return <SkillPathDetail pathId={id} packId={hit.pack.id} />;
}
