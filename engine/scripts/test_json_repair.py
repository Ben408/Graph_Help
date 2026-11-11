from src.llm.client import parse_llm_json

bad = (
    '{"summary": "Close the books for the period you select", '
    '"steps": [{"instruction": "Open Close books", "detail": "Go to GL", '
    '"source_ids": ["a"]}, {"instruction": "Pick period", '
    '"detail": "Use the To the end of pe'
)
parsed = parse_llm_json(bad)
assert "summary" in parsed
print("ok", parsed["summary"][:40])
