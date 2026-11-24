import { NextResponse } from "next/server";
import {
  matchCopilotDemoResponse,
  type CopilotRawSource,
} from "@/packs/sage-intacct/copilot-demo-responses";

export const dynamic = "force-dynamic";

type CopilotAskRequest = {
  text?: string;
  module?: string;
  screen?: string;
  concept_ids?: string[];
  skill_path_id?: string;
  pack_id?: string;
  session_id?: string;
};

type RawCopilotResponse = {
  id?: string;
  reply?: string;
  sources?: Array<{
    id?: string;
    source_id?: string;
    title?: string;
    name?: string;
    url?: string;
    source_url?: string;
    href?: string;
    heading?: string;
    heading_path?: string;
    score?: number;
  }>;
  additionalQuestions?: string[];
  sessionId?: string;
};

function mapSources(raw: RawCopilotResponse["sources"] | CopilotRawSource[] | undefined) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s, idx) => {
      const url = ("url" in s && s.url) || ("source_url" in s && s.source_url) || ("href" in s && s.href) || "";
      const title = s.title || ("name" in s && s.name) || "Sage Intacct Help";
      const heading = ("heading_path" in s && s.heading_path) || ("heading" in s && s.heading) || "Sage Copilot Search Help";
      return {
        source_id: ("source_id" in s && s.source_id) || ("id" in s && s.id) || `copilot-src-${idx + 1}`,
        source_url: url,
        title,
        heading_path: heading,
        score: typeof s.score === "number" ? s.score : 0.85,
      };
    })
    .filter((s) => Boolean(s.source_url || s.title));
}

export async function POST(req: Request) {
  let body: CopilotAskRequest = {};
  try {
    body = (await req.json()) as CopilotAskRequest;
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const query = (body.text || "").trim();
  if (query.length < 3) {
    return NextResponse.json(
      { detail: "Question must be at least 3 characters." },
      { status: 400 }
    );
  }

  const seedConcepts = Array.isArray(body.concept_ids) ? body.concept_ids.filter(Boolean) : [];
  const seedSkillPaths = body.skill_path_id ? [body.skill_path_id] : [];

  const apiBase = (
    process.env.SAGE_COPILOT_API_BASE || "https://api.intacct.com/ia/api/beta"
  ).replace(/\/$/, "");
  const bearerToken = (process.env.SAGE_COPILOT_BEARER_TOKEN || "").trim();

  // Live path: calls Sage Intacct REST beta Search Help when server OAuth token is provisioned.
  if (bearerToken) {
    try {
      const qs = new URLSearchParams({ query });
      if (body.session_id) qs.set("sessionId", body.session_id);
      const upstream = await fetch(`${apiBase}/services/core/help/search?${qs.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!upstream.ok) {
        const errText = (await upstream.text()).slice(0, 300);
        return NextResponse.json(
          {
            ask_id: `copilot-err-${Date.now()}`,
            status: "failed",
            backend_source: "copilot-live",
            sources: [],
            error_code: `HTTP_${upstream.status}`,
            error_detail: `Sage Copilot API returned ${upstream.status}${errText ? `: ${errText}` : ""}`,
          },
          { status: 200 }
        );
      }

      const data = (await upstream.json()) as RawCopilotResponse;
      const mappedSources = mapSources(data.sources);
      return NextResponse.json({
        ask_id: data.id || `copilot-live-${Date.now()}`,
        status: "completed",
        backend_source: "copilot-live",
        answer: {
          summary: (data.reply || "").trim() || "Sage Copilot returned an empty reply.",
          steps: [],
          notes: [
            "Answered by Sage Copilot (/services/core/help/search). Concept Graph context, Related Concepts, and Skill Paths are supplied by Smart Help's Hybrid wrapper.",
          ],
          sources: mappedSources,
        },
        sources: mappedSources,
        followup_queries: Array.isArray(data.additionalQuestions)
          ? data.additionalQuestions.slice(0, 4)
          : [],
        touched_concept_ids: seedConcepts,
        skill_path_ids: seedSkillPaths,
      });
    } catch (error) {
      return NextResponse.json(
        {
          ask_id: `copilot-err-${Date.now()}`,
          status: "failed",
          backend_source: "copilot-live",
          sources: [],
          error_detail:
            error instanceof Error ? error.message : "Failed to reach Sage Copilot API",
        },
        { status: 200 }
      );
    }
  }

  // Demo Replay path: uses captured Sage Copilot responses until SAGE_COPILOT_BEARER_TOKEN is configured.
  const matched = matchCopilotDemoResponse(query);
  if (matched) {
    const mappedSources = mapSources(matched.sources);
    const mergedConcepts = [...new Set([...seedConcepts, ...(matched.conceptIds || [])])];
    const mergedPaths = [...new Set([...seedSkillPaths, ...(matched.skillPathIds || [])])];

    return NextResponse.json({
      ask_id: `${matched.id}-${Date.now()}`,
      status: "completed",
      backend_source: "copilot-demo-replay",
      answer: {
        summary: matched.reply,
        steps: [],
        notes: [
          "Demo Replay of Sage Copilot Search Help (/services/core/help/search). Set SAGE_COPILOT_BEARER_TOKEN on the server to switch to live Copilot calls without code changes.",
        ],
        sources: mappedSources,
      },
      sources: mappedSources,
      followup_queries: matched.additionalQuestions,
      touched_concept_ids: mergedConcepts,
      skill_path_ids: mergedPaths,
    });
  }

  return NextResponse.json({
    ask_id: `copilot-demo-miss-${Date.now()}`,
    status: "completed",
    backend_source: "copilot-demo-replay",
    answer: {
      summary:
        "No live SAGE_COPILOT_BEARER_TOKEN is configured yet, and this question is outside the captured Copilot Demo Replay set. Try one of the starter prompts below, add a captured Emerald Ridge response to packs/sage-intacct/copilot-demo-responses.ts, or switch the toggle back to Smart Help Ask.",
      steps: [],
      notes: [
        "Copilot Hybrid Demo Replay is active. Concept Graph context (Related Concepts & Skill Paths) remains active alongside Copilot.",
      ],
      sources: [],
    },
    sources: [],
    followup_queries: [
      "How do I create a vendor?",
      "Explain AP automation",
      "How do I detect duplicate bills?",
      "How do I reverse a journal entry?",
    ],
    touched_concept_ids: seedConcepts,
    skill_path_ids: seedSkillPaths,
  });
}
