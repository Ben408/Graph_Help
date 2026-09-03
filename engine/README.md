"""Knowledge engine (Ask + Friday Help ingest).

From concept-graph-demo (Python 3.11 venv):

    py -3.11 -m venv engine/.venv
    engine/.venv/Scripts/python.exe -m pip install -r engine/requirements.txt
    engine/.venv/Scripts/python.exe engine/scripts/bootstrap_from_vidgen.py
    pnpm engine

Then `pnpm dev` and open Ask / Re-ingest Help. Corpus files under engine/data/ are gitignored.

Then in the Next.js app use Ask and Re-ingest Help. Corpus files under engine/data/ are gitignored.
"""
