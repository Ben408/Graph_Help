import { SkillPathDetail } from "@/components/skill-path-detail";
import { getSkillPaths } from "@/lib/knowledge";

export function generateStaticParams() {
  return getSkillPaths().map((path) => ({ id: path.id }));
}

export default async function SkillPathPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SkillPathDetail pathId={id} />;
}
