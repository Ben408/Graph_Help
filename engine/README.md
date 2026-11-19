"""Knowledge engine (Ask + Friday Help ingest).

From concept-graph-demo (Python 3.11 venv):

    py -3.11 -m venv engine/.venv
    engine/.venv/Scripts/python.exe -m pip install -r engine/requirements.txt
    engine/.venv/Scripts/python.exe engine/scripts/bootstrap_from_vidgen.py
    pnpm engine

Then `pnpm dev` and open Ask / Re-ingest Help. Corpus files under engine/data/ are gitignored.

Then in the Next.js app use Ask and Re-ingest Help. Corpus files under engine/data/ are gitignored.

## Pilot bug reports → Jira

Smart Help **Report a bug** posts to `POST /api/pilot/bugs` (screenshot + description).
Every report is mirrored to `engine/data/runs/pilot_bugs.jsonl`. When Jira env is set,
the engine also creates a Bug in the pilot project and attaches the screenshot.

Create a dedicated Jira project for the pilot, then put these in `engine/.env`
(or the process environment) — never commit tokens:

    JIRA_BASE_URL=https://your-site.atlassian.net
    JIRA_EMAIL=service-account@example.com
    JIRA_API_TOKEN=...
    JIRA_PROJECT_KEY=SHP
    JIRA_ISSUE_TYPE=Bug

The API token needs **Create issues** and **Add attachments** on that project.
If Jira env is missing, the endpoint returns 503 after writing the JSONL mirror.
"""
