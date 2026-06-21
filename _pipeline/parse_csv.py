# -*- coding: utf-8 -*-
"""Parse the Ahrefs Brand Radar CSV export (UTF-16 TSV) into
raw/idea_ahrefs_data.json + raw/idea_citations.json.

The export columns: Country, Keyword, Tags, Volume, Response, Model, Mentions,
Fanout Queries, Cited pages, Found but not cited, Updated.
`Mentions` is a newline list of the tracked brands mentioned in that response.
"""
import csv, io, os, json, collections, datetime, urllib.parse, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
CSV_PATH = os.environ.get("IDEA_CSV") or (sys.argv[1] if len(sys.argv) > 1 else None)

LLMS = ["chatgpt", "gemini", "copilot", "perplexity"]          # matrix columns (match references)
MODEL_KEY = {"ChatGPT": "chatgpt", "Gemini": "gemini", "Copilot": "copilot",
             "Perplexity": "perplexity", "Google AI Mode": "google_ai_mode",
             "Google AI Overviews": "google_ai_overviews"}
SELF_ENT = "株式会社IDEATECH"
COMP_ENT = {"ナイル": "ナイル株式会社", "Faber": "株式会社Faber Company", "CINC": "株式会社CINC",
            "イノーバ": "株式会社イノーバ", "Queue": "Queue株式会社"}
# The Mentions column only flags the exact tracked entity and undercounts. We
# therefore also scan the response text for these aliases (hybrid detection).
SELF_ALIAS = ["IDEA LLMO", "IDEALLMO", "IDEATECH", "アイデアテック", "リサピー"]
COMP_ALIAS = {"ナイル": ["ナイル株式会社", "SEO HACKS", "seohacks"],
              "Faber": ["株式会社Faber Company", "Faber Company", "ミエルカ", "mieru-ca", "mieru-ai"],
              "CINC": ["株式会社CINC", "CINC"],
              "イノーバ": ["株式会社イノーバ", "イノーバ", "innova"],
              "Queue": ["Queue株式会社", "umoren"]}

def _txt_has(text, needles):
    low = (text or "").lower()
    return any(n.lower() in low for n in needles)

def norm(s):
    import re
    return re.sub(r"\s+", "", (s or "")).replace("　", "")

def load_rows():
    data = open(CSV_PATH, "rb").read()
    for enc in ("utf-16", "utf-16-le", "utf-8-sig"):
        try:
            txt = data.decode(enc); break
        except Exception:
            continue
    return list(csv.DictReader(io.StringIO(txt), delimiter="\t"))

def main():
    rows = load_rows()
    pm = json.load(open(os.path.join(RAW, "idea_prompt_map.json")))
    branded_p = {norm(p["prompt"]): p for p in pm["branded"]}
    nonbr_p = {norm(p["prompt"]): p for p in pm["nonbranded"]}
    persona_p = {}
    for pk in ["A", "B", "C"]:
        for i, p in enumerate(pm["personas"][pk], 1):
            persona_p[norm(p["prompt"])] = (pk, i, p)

    # group rows by keyword
    byk = collections.defaultdict(dict)   # keyword -> {model_key: row}
    survey = None
    cite_counter = collections.Counter()
    cite_first = {}
    for r in rows:
        mk = MODEL_KEY.get(r["Model"])
        if not mk:
            continue
        byk[r["Keyword"]][mk] = r
        survey = max(survey or "", r.get("Updated") or "")
        for u in (r["Cited pages"] or "").split("\n"):
            u = u.strip()
            if u:
                cite_counter[u] += 1
                cite_first.setdefault(u, r.get("Updated"))

    def mentions_set(row):
        return set(m.strip() for m in (row.get("Mentions") or "").split("\n") if m.strip())

    def by_llm_for(keyword):
        out = {}
        kr = byk.get(keyword, {})
        for llm in LLMS:
            row = kr.get(llm)
            if not row:
                out[llm] = {"self": None, "competitors": {k: None for k in COMP_ENT}, "links": [], "response": None}
                continue
            ms = mentions_set(row)
            resp = row.get("Response") or ""
            links = [{"url": u.strip(), "title": ""} for u in (row.get("Cited pages") or "").split("\n") if u.strip()]
            out[llm] = {"self": (SELF_ENT in ms) or _txt_has(resp, SELF_ALIAS),
                        "competitors": {k: ((COMP_ENT[k] in ms) or _txt_has(resp, COMP_ALIAS[k])) for k in COMP_ENT},
                        "links": links, "response": resp}
        return out

    def volume_for(keyword):
        for row in byk.get(keyword, {}).values():
            try:
                return int(row.get("Volume") or 0)
            except Exception:
                return 0
        return 0

    # match keywords to groups
    branded, nonbr = {}, {}
    personas = {pk: {"title": pm["persona_titles"][pk], "rows": {}} for pk in ["A", "B", "C"]}
    unmatched = []
    for kw in byk:
        nk = norm(kw)
        bl = by_llm_for(kw); vol = volume_for(kw)
        if nk in branded_p:
            p = branded_p[nk]; branded[nk] = {"no": p["no"], "category": p["category"], "prompt": p["prompt"], "volume": vol, "by_llm": bl}
        if nk in nonbr_p:
            p = nonbr_p[nk]; nonbr[nk] = {"no": p["no"], "category": p["category"], "prompt": p["prompt"], "volume": vol, "by_llm": bl}
        if nk in persona_p:
            pk, i, p = persona_p[nk]; personas[pk]["rows"][nk] = {"no": i, "axis": p["axis"], "prompt": p["prompt"], "volume": vol, "by_llm": bl}
        if nk not in branded_p and nk not in nonbr_p and nk not in persona_p:
            unmatched.append(kw)

    allrows = list(branded.values()) + list(nonbr.values()) + [r for pk in personas for r in personas[pk]["rows"].values()]

    def rate(rows, llm, key=None):
        tot = sum(1 for r in rows if r["by_llm"][llm]["self"] is not None)
        if not tot:
            return None
        hit = sum(1 for r in rows if (r["by_llm"][llm]["self"] if key is None else r["by_llm"][llm]["competitors"].get(key)))
        return round(hit / tot * 100, 1)

    def tally(rows):
        c = collections.Counter()
        for r in rows:
            seen = set()
            for llm in LLMS:
                d = r["by_llm"][llm]
                if d["self"] is None:
                    continue
                if d["self"]:
                    seen.add("株式会社IDEATECH (IDEA LLMO)")
                for k, v in d["competitors"].items():
                    if v:
                        seen.add({"ナイル": "ナイル (SEO HACKS)", "Faber": "Faber Company (ミエルカ)", "CINC": "CINC",
                                  "イノーバ": "イノーバ (innova)", "Queue": "Queue (umoren)"}[k])
            for s in seen:
                c[s] += 1
        return dict(c.most_common())

    out = {
        "llms": LLMS,
        "available_llms": LLMS,   # all four present in this export
        "all_models": list(MODEL_KEY.values()),
        "survey_date": survey or datetime.datetime.utcnow().isoformat() + "Z",
        "branded": sorted(branded.values(), key=lambda r: r["no"]),
        "nonbranded": sorted(nonbr.values(), key=lambda r: r["no"]),
        "personas": {pk: {"title": personas[pk]["title"], "rows": sorted(personas[pk]["rows"].values(), key=lambda r: r["no"])} for pk in ["A", "B", "C"]},
        "self_mention_rate_by_llm": {llm: rate(allrows, llm) for llm in LLMS},
        "competitor_mention_rate_by_llm": {k: {llm: rate(allrows, llm, k) for llm in LLMS} for k in COMP_ENT},
        "company_frequency": {"overall": tally(allrows),
                              "by_persona": {pk: tally(list(personas[pk]["rows"].values())) for pk in ["A", "B", "C"]}},
    }
    json.dump(out, open(os.path.join(RAW, "idea_ahrefs_data.json"), "w"), ensure_ascii=False)

    # citations: aggregate cited pages -> domain + count
    pages = []
    for u, c in cite_counter.most_common():
        try:
            dom = urllib.parse.urlparse(u).netloc
        except Exception:
            dom = ""
        pages.append({"url": u, "domain": dom, "count": c, "dr": None, "date": cite_first.get(u), "title": ""})
    domc = collections.Counter()
    for p in pages:
        domc[p["domain"]] += p["count"]
    domains = [{"domain": d, "count": c, "dr": None} for d, c in domc.most_common()]
    json.dump({"pages": pages, "domains": domains,
               "_note": "AI応答が参照した引用元（Ahrefs BrandRadar Cited pages 集計）。被引用回数=4LLM応答での出現回数。"},
              open(os.path.join(RAW, "idea_citations.json"), "w"), ensure_ascii=False)

    print("rows:", len(rows), "keywords:", len(byk))
    print("branded:", len(branded), "nonbranded:", len(nonbr),
          "personas:", {pk: len(personas[pk]["rows"]) for pk in personas})
    print("self rate by llm:", out["self_mention_rate_by_llm"])
    print("cited pages:", len(pages), "domains:", len(domains))
    if unmatched:
        print("UNMATCHED keywords (", len(unmatched), "):")
        for u in unmatched: print("   ", u)

if __name__ == "__main__":
    if not CSV_PATH:
        raise SystemExit("usage: parse_csv.py <export.csv>  (or IDEA_CSV=...)")
    main()
