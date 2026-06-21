# -*- coding: utf-8 -*-
"""Assemble the unified data_v3.json for the IDEA LLMO dashboard.
Inputs (produced by the fetch_* steps): idea_ahrefs_data.json, idea_citations.json,
idea_ga_cv.json, idea_ainews.json. Override paths via env if needed."""
import json, datetime, os

_HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.environ.get("IDEA_SRC", os.path.join(_HERE, "raw"))
A = json.load(open(f'{SRC}/idea_ahrefs_data.json'))
CIT = json.load(open(f'{SRC}/idea_citations.json'))
GACV = json.load(open(f'{SRC}/idea_ga_cv.json'))
NEWS = json.load(open(f'{SRC}/idea_ainews.json'))

LLMS = ["chatgpt", "gemini", "copilot", "perplexity"]
LLM_LABELS = {"chatgpt": "ChatGPT", "gemini": "Gemini", "copilot": "Copilot", "perplexity": "Perplexity"}
COMP_KEYS = ["ナイル", "Faber", "CINC", "イノーバ", "Queue"]
COMP_LABELS = {"ナイル": "ナイル(SEO HACKS)", "Faber": "Faber(ミエルカ)", "CINC": "CINC",
               "イノーバ": "イノーバ", "Queue": "Queue(umoren)"}

def pack_row(r):
    out = {"no": r["no"], "category": r.get("category") or r.get("axis"),
           "prompt": r["prompt"], "volume": r.get("volume") or 0, "by_llm": {}}
    for llm in LLMS:
        d = r["by_llm"].get(llm, {})
        out["by_llm"][llm] = {"self": d.get("self"), "competitors": d.get("competitors", {}),
                              "links": d.get("links") or [], "response": d.get("response") or ""}
    return out

branded = [pack_row(r) for r in A["branded"]]
nonbranded = [pack_row(r) for r in A["nonbranded"]]
personas_data = {pk: {"title": A["personas"][pk]["title"], "rows": [pack_row(r) for r in A["personas"][pk]["rows"]]}
                 for pk in ["A", "B", "C"]}

def count_self(rows, llm="chatgpt"):
    tot = sum(1 for r in rows if r["by_llm"][llm]["self"] is not None)
    hit = sum(1 for r in rows if r["by_llm"][llm]["self"])
    return hit, tot
b_hit, b_tot = count_self(branded)
nb_hit, nb_tot = count_self(nonbranded)

compfreq = A["company_frequency"]

strengths = {
  "positioning": "戦略PR（Public Relations）で、AIに推薦される企業をつくる。対話型生成AIが推薦する企業には、第三者からの信頼の証拠がある。15年の戦略PR実績と調査企画力で、AIが参照する「第三者情報（サイテーション）」を設計し、推薦を獲得し続ける仕組みをつくるBtoB特化型LLMO戦略支援。",
  "kpis": [
    {"label": "BtoBマーケ支援実績", "value": "800社+"},
    {"label": "調査企画・実施数（リサピー®）", "value": "2,500件+"},
    {"label": "Yahoo!ニュース掲載実績", "value": "300件+"},
    {"label": "自社実証でのAI推薦獲得", "value": "約3ヶ月"}
  ],
  "competences": [
    {"no": "01", "title": "調査企画力", "desc": "2,500件超の調査設計実績。メディアが「記事にせざるを得ない」切り口を企画し、第三者が引用したくなる一次情報を自社で生み出せる。"},
    {"no": "02", "title": "パブリシティ獲得の企画力", "desc": "Yahoo!ニュース300件以上、NHK・日経新聞等のパブリシティを獲得。リレーションではなく「企画の質」で第三者メディア掲載を勝ち取ってきた実績。"},
    {"no": "03", "title": "第三者視点のコンテンツ設計力", "desc": "自社目線を徹底排除し、メディアや読者が「引用したくなる」文脈を設計。AIが参照する情報源としての構造化まで一貫対応。"}
  ],
  "advantages": [
    {"t": "① 調査PR起点のサイテーション設計", "d": "AI引用の約89%は第三者情報。リサピー®の一次調査を起点に、PRTIMES・業界紙・全国紙への掲載で“AIが参照する第三者からの信頼の証拠”を計画的に積み上げる。SEO会社の被リンク営業とは構造が異なる。"},
    {"t": "② 業界文脈の設計（ルールメイク）", "d": "「どの基準で選ぶべきか」という評価軸そのものを調査データで先に定義し発信。自社に有利な選定基準を業界文脈としてAIに学習させ、後発が打ち消しづらい構造的優位を築く。"},
    {"t": "③ リサピー®との連携（一次データ生成力）", "d": "調査企画・調査票設計・集計・リリース原稿・グラフ制作まで内製で一気通貫。ファクトベースの一次情報を継続的に発信し、AIの引用元になり続ける。"},
    {"t": "④ 戦略〜実行〜計測の一気通貫体制", "d": "PR戦略設計／プロンプト設計／コンテンツ制作／PR配信／月次モニタリング（プロセス・成果・CVの3層）まで分断せず提供。委託経験者の不満上位「制作と発信の連携不足（50.2%）」を解消する。"},
    {"t": "⑤ BtoB商習慣・業界理解", "d": "800社超のBtoB支援で培った専門用語・購買プロセスへの理解。toC実績中心の支援会社では対応しきれない複雑な意思決定に合わせた設計が可能。"},
    {"t": "⑥ 自社実証（ドッグフーディング）", "d": "「調査PRとは」のAI回答を自社のPR戦略で書き換え、2025年12月時点ゼロのAI推薦を約3ヶ月で全主要AI媒体（AI Overview・Gemini・ChatGPT）の推薦獲得まで到達させた再現性のある実証。"}
  ],
  "vs_table": {
    "head": ["領域", "SEO会社", "PR会社（IDEATECH）"],
    "rows": [["自社サイトの最適化", "◎", "○"], ["被リンク営業", "◎", "○"], ["アルゴリズム解析", "◎", "△"],
             ["第三者メディアでの言及獲得", "✕", "◎"], ["第三者視点のコンテンツ設計", "✕", "◎"],
             ["調査データを用いた権威性構築", "✕", "◎"], ["業界紙・専門紙への露出", "✕", "◎"]]
  },
  "evidence": [
    {"v": "約89%", "d": "ChatGPT/Geminiが引用するリンクのうち第三者情報の割合（Muck Rack調査）"},
    {"v": "0.664", "d": "AI回答でのブランド露出と最も相関が強い要因＝第三者サイテーション。被リンク(0.218)の約3倍（Ahrefs 75,000ブランド分析）"},
    {"v": "88%", "d": "Google AI Modeが引用したリンクのうち、同一KWの検索トップ10圏外だった割合（Moz 約40,000クエリ分析）"},
    {"v": "94%", "d": "購買プロセスで生成AIを利用するBtoBバイヤーの割合・2025年（Forrester）"}
  ],
  "diff_summary": "本レポートのモニタリング（ChatGPT・非指名77プロンプト）では、自社（IDEATECH/IDEA LLMO）の言及率は20.8%。ツール型GEOのQueue(umoren) 32.5%、CINC 18.2%、Faber(ミエルカ) 13.0%が先行する。調査PR×サイテーション設計という独自の強みはAI上でまだ十分に認知されておらず（＝ルールメイク余地が大きい）、選定基準そのものを発信していく余地が大きい。"
}

def persona_companies(pk, topn=10):
    items = sorted(compfreq["by_persona"][pk].items(), key=lambda x: -x[1])
    return [{"name": n, "count": c} for n, c in items[:topn]]

persona_meta = {
 "A": {"short": "BtoB SaaS マーケ責任者 / LLMO支援会社探し",
       "tags": ["#42歳・男性", "#BtoB SaaS", "#マーケ責任者", "#SEO上位だがAI非引用", "#LLMO初心者"],
       "desc": "主要KWでSEOは上位を取れているのに、ChatGPTやGeminiで「おすすめのツールは？」と聞いても自社が出てこない。競合ばかり挙がるのを見て焦っている。AIに引用・推薦される状態を作りたいが、LLMO対策をどこに・何を基準に頼めばいいか分からない。"},
 "B": {"short": "BtoB メーカー マーケ担当 / サイテーション支援探し",
       "tags": ["#49歳・女性", "#BtoBメーカー", "#広報・マーケ兼任", "#権威性・信頼構築重視", "#調査PR未経験"],
       "desc": "技術力には自信があるが、業界内の認知や「信頼の証拠」が不足し、AIに候補として挙がらない。一次調査やデータで第三者メディアに取り上げられ、AIに「信頼できる候補」として推薦される状態を作りたい。"},
 "C": {"short": "BtoB コンサル マーケ担当 / 外注で失敗経験者",
       "tags": ["#38歳・男性", "#BtoBコンサル", "#LLMO委託経験あり", "#ファクト不足を実感", "#乗り換え検討"],
       "desc": "以前LLMO対策を外注したが、サイトの体裁を整えるだけでAI引用の成果につながらなかった。「ファクト情報が足りない」「BtoB商習慣を理解していない」と痛感。調査設計からPR配信、モニタリングまで一気通貫で任せられる会社に乗り換えたい。"}
}
persona_criteria = {
 "A": {"common": ["導入実績・成功事例の豊富さ", "支援領域の広さ（SEO/コンテンツ/PR）", "BtoB・SaaS領域の理解"],
       "idea": ["第三者メディア掲載による権威性", "調査データを用いた選定基準づくり（ルールメイク）", "戦略〜実行〜計測の一気通貫"],
       "gap": ["ツール提供・ダッシュボードの分かりやすさ（競合が先行）", "低価格・スモールスタート訴求", "テクニカルSEO/被リンクの実行量"]},
 "B": {"common": ["第三者メディアでの言及（サイテーション）獲得力", "一次調査・データの活用", "業界・製造業への理解"],
       "idea": ["リサピー®による一次調査企画〜PR配信の内製", "PRTIMES・業界紙への掲載実績", "ファクトベースの権威性構築"],
       "gap": ["製造業特化の事例の見せ方", "サイテーション計測ツールの提供", "費用感の明示"]},
 "C": {"common": ["調査設計力×PR視点の両立", "一気通貫（調査→制作→PR→モニタリング）", "BtoB商習慣の理解"],
       "idea": ["“調査会社/PR会社の分断”を解消する一貫体制", "モニタリング（プロセス・成果・CVの3層）", "自社実証による再現性"],
       "gap": ["乗り換え時の移行支援の言語化", "成果保証・KPI設計の見せ方", "価格・契約の柔軟性訴求"]}
}
persona_quadrant = {
 "A": {"tl": ["調査PR×サイテーション設計の独自性", "「選定基準」を調査で定義するルールメイク", "リサピー®連携の一次データ生成力", "自社実証（3ヶ月でAI推薦獲得）"],
       "tr": ["BtoB戦略PRの実績（部分的に想起）", "第三者メディア掲載という考え方"],
       "bl": ["汎用テクニカルSEOの細目", "被リンク本数の最適化"],
       "br": ["ツール型GEO（Queue/umoren・CINC等が想起獲得済み）", "SEO起点の分析・レポート", "低価格・スピード訴求"]},
 "B": {"tl": ["一次調査による権威性構築（製造業向け）", "業界紙・専門紙への露出設計", "ファクト起点のサイテーション獲得"],
       "tr": ["第三者メディア掲載＝信頼の証拠という文脈"],
       "bl": ["自社サイトの構造最適化のみ"],
       "br": ["サイテーション計測ツール（ミエルカGEO等が想起）", "SEO/コンテンツ量産型支援"]},
 "C": {"tl": ["調査設計力×PR視点の一貫体制", "プロセス・成果・CVの3層モニタリング", "乗り換え後の“ファクト不足”解消"],
       "tr": ["一気通貫支援というキーワード（部分想起）"],
       "bl": ["体裁を整えるだけのサイト改善"],
       "br": ["分業型のSEO/PR外注（競合・代理店が想起）", "ツール導入型の支援"]}
}
personas_out = {}
for pk in ["A", "B", "C"]:
    personas_out[pk] = {"title": A["personas"][pk]["title"], "meta": persona_meta[pk],
                        "companies": persona_companies(pk), "criteria": persona_criteria[pk],
                        "quadrant": persona_quadrant[pk], "rows": personas_data[pk]["rows"]}

DATA = {
  "meta": {"title": "IDEA LLMO ダッシュボード", "subtitle": "Monthly Monitor Dashboard",
    "service_url": "https://ideatech.jp/service/idea-llmo/", "as_of": GACV["months"][-1],
    "generated_at": datetime.datetime.utcnow().isoformat() + "Z", "survey_date": A["survey_date"][:10],
    "report_id": "019ec10f-ff47-7a07-8fa8-4fd75bb7dd5f", "llms": LLMS, "llm_labels": LLM_LABELS,
    "available_llms": A.get("available_llms", ["chatgpt"]), "competitors": COMP_KEYS, "competitor_labels": COMP_LABELS},
  "diff": None, "insights": None,
  "ss": GACV["ss"], "ss_meta": {"months": GACV["months"], "note": GACV["ga_note"], "sources_latest": GACV["ss_sources_latest"]},
  "cv": GACV["cv"], "cv_meta": {"months": GACV["months"], "note": GACV["cv_note"]},
  "branded": branded, "branded_summary": {"hit": b_hit, "tot": b_tot},
  "nonbranded": nonbranded, "nonbranded_summary": {"hit": nb_hit, "tot": nb_tot},
  "self_rate": A["self_mention_rate_by_llm"], "comp_rate": A["competitor_mention_rate_by_llm"],
  "citations": {"pages": CIT.get("pages", []), "domains": CIT.get("domains", []), "note": CIT.get("_note", "")},
  "company_frequency": compfreq, "strengths": strengths, "personas": personas_out,
  "ai_topics": NEWS["ai_topics"], "ai_tools": NEWS["ai_tools"],
  "knowledge": {"campaigns": [], "consulting": []}
}
out = os.environ.get("IDEA_OUT", os.path.join(_HERE, "data_v3.json"))
json.dump(DATA, open(out, 'w'), ensure_ascii=False)
print("data_v3.json:", round(os.path.getsize(out)/1024, 1), "KB ->", out)
print("branded", len(branded), "self", b_hit, "/", b_tot, "| nonbranded", len(nonbranded), "self", nb_hit, "/", nb_tot)
print("citations pages", len(DATA["citations"]["pages"]), "domains", len(DATA["citations"]["domains"]))
print("ai_topics", len(DATA["ai_topics"].get("entries", [])))
for pk in ["A","B","C"]: print("persona", pk, "companies", len(personas_out[pk]["companies"]), "rows", len(personas_out[pk]["rows"]))
