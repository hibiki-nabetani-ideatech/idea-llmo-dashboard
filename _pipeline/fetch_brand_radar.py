# -*- coding: utf-8 -*-
"""Fetch Ahrefs Brand Radar AI responses for the IDEA LLMO report and build
raw/idea_ahrefs_data.json (the input consumed by assemble_data.py).

Usage:
    AHREFS_API_TOKEN=xxxx python3 fetch_brand_radar.py

Notes:
- report_id is the 【モニタリング】IDEA LLMO BrandRadar report.
- Only ChatGPT is available on the current subscription; the other LLMs return
  "Missing addon" and are left as null. Once the add-on is active, set
  LLMS to include them and they will populate automatically.
- Prompt -> group mapping comes from raw/idea_prompt_map.json (from the setup xlsx).
"""
import json, os, re, urllib.request, urllib.parse, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
TOKEN = os.environ.get("AHREFS_API_TOKEN", "")
REPORT_ID = os.environ.get("IDEA_REPORT_ID", "019ec10f-ff47-7a07-8fa8-4fd75bb7dd5f")
LLMS = ["chatgpt", "gemini", "copilot", "perplexity"]
API = "https://api.ahrefs.com/v3/brand-radar/ai-responses"

SELF = ["IDEA LLMO", "IDEALLMO", "IDEATECH", "アイデアテック", "リサピー", "ideatech.jp"]
COMP = {
  "ナイル":  ["ナイル", "SEO HACKS", "seohacks", "seohacks.net"],
  "Faber":  ["Faber Company", "ミエルカ", "mieru-ca", "mieru-ai"],
  "CINC":   ["CINC", "cinc-j"],
  "イノーバ": ["イノーバ", "innova", "innova-jp"],
  "Queue":  ["Queue株式会社", "umoren", "umoren.ai"],
}

def has(text, needles):
    t = (text or "").lower()
    return any(n.lower() in t for n in needles)

def fetch(data_source):
    params = {"report_id": REPORT_ID, "data_source": data_source, "country": "jp",
              "select": "question,response,links,volume", "limit": 1000, "output": "json"}
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())

def norm(s):
    return re.sub(r"\s+", "", (s or "")).replace("　", "")

def main():
    pm = json.load(open(os.path.join(RAW, "idea_prompt_map.json")))
    branded_p = {norm(p["prompt"]): p for p in pm["branded"]}
    nonbr_p = {norm(p["prompt"]): p for p in pm["nonbranded"]}
    persona_p = {}
    for pk in ["A", "B", "C"]:
        for i, p in enumerate(pm["personas"][pk], 1):
            persona_p[norm(p["prompt"])] = (pk, i, p)

    raw_by_llm = {}
    for llm in LLMS:
        try:
            raw_by_llm[llm] = fetch(llm).get("ai_responses", [])
        except Exception as e:
            print(f"[{llm}] not available: {e}")
            raw_by_llm[llm] = None

    def blank_llm():
        return {"self": None, "competitors": {k: None for k in COMP}, "links": [], "response": None}

    def row_for(prompt):
        return {"by_llm": {llm: blank_llm() for llm in LLMS}}

    def fill(row, llm, item):
        resp = item.get("response") or ""
        row["by_llm"][llm] = {
            "self": has(resp, SELF),
            "competitors": {k: has(resp, v) for k, v in COMP.items()},
            "links": item.get("links") or [],
            "response": resp,
        }

    branded = {k: {"no": v["no"], "category": v["category"], "prompt": v["prompt"], "volume": 0, **row_for(v["prompt"])} for k, v in branded_p.items()}
    nonbr = {k: {"no": v["no"], "category": v["category"], "prompt": v["prompt"], "volume": 0, **row_for(v["prompt"])} for k, v in nonbr_p.items()}
    personas = {pk: {"title": pm["persona_titles"][pk], "rows": {}} for pk in ["A", "B", "C"]}
    for k, (pk, i, p) in persona_p.items():
        personas[pk]["rows"][k] = {"no": i, "axis": p["axis"], "prompt": p["prompt"], "volume": 0, **row_for(p["prompt"])}

    survey = None
    for llm, items in raw_by_llm.items():
        if not items:
            continue
        for it in items:
            survey = it.get("last_updated") or survey
            key = norm(it.get("question"))
            it["volume"] = it.get("volume") or 0
            for bucket in (branded, nonbr):
                if key in bucket:
                    bucket[key]["volume"] = it["volume"]; fill(bucket[key], llm, it)
            if key in persona_p:
                pk, i, _ = persona_p[key]; personas[pk]["rows"][key]["volume"] = it["volume"]; fill(personas[pk]["rows"][key], llm, it)

    def rate(rows, key=None):
        tot = sum(1 for r in rows if r["by_llm"]["chatgpt"]["self"] is not None)
        if not tot:
            return None
        hit = sum(1 for r in rows if (r["by_llm"]["chatgpt"]["self"] if key is None else r["by_llm"]["chatgpt"]["competitors"].get(key)))
        return round(hit / tot * 100, 1)

    allrows = list(branded.values()) + list(nonbr.values()) + [r for pk in personas for r in personas[pk]["rows"].values()]
    # company frequency tally (self + competitors; extend with regexes as needed)
    def tally(rows):
        c = {}
        for r in rows:
            resp = r["by_llm"]["chatgpt"]["response"] or ""
            for label, needles in [("株式会社IDEATECH (IDEA LLMO)", SELF)] + [(COMP_LABEL[k], v) for k, v in COMP.items()]:
                if has(resp, needles):
                    c[label] = c.get(label, 0) + 1
        return dict(sorted(c.items(), key=lambda x: -x[1]))
    COMP_LABEL = {"ナイル": "ナイル (SEO HACKS)", "Faber": "Faber Company (ミエルカ)", "CINC": "CINC", "イノーバ": "イノーバ (innova)", "Queue": "Queue (umoren)"}

    out = {
        "llms": LLMS,
        "available_llms": [l for l in LLMS if raw_by_llm.get(l)],
        "survey_date": survey or datetime.datetime.utcnow().isoformat() + "Z",
        "branded": sorted(branded.values(), key=lambda r: r["no"]),
        "nonbranded": sorted(nonbr.values(), key=lambda r: r["no"]),
        "personas": {pk: {"title": personas[pk]["title"], "rows": sorted(personas[pk]["rows"].values(), key=lambda r: r["no"])} for pk in ["A", "B", "C"]},
        "self_mention_rate_by_llm": {"chatgpt": rate(allrows), "gemini": None, "copilot": None, "perplexity": None},
        "competitor_mention_rate_by_llm": {k: {"chatgpt": rate(allrows, k), "gemini": None, "copilot": None, "perplexity": None} for k in COMP},
        "company_frequency": {"overall": tally(allrows),
                              "by_persona": {pk: tally(list(personas[pk]["rows"].values())) for pk in ["A", "B", "C"]}},
    }
    os.makedirs(RAW, exist_ok=True)
    json.dump(out, open(os.path.join(RAW, "idea_ahrefs_data.json"), "w"), ensure_ascii=False)
    print("wrote raw/idea_ahrefs_data.json | available LLMs:", out["available_llms"], "| self rate:", out["self_mention_rate_by_llm"]["chatgpt"])

if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("Set AHREFS_API_TOKEN")
    main()
