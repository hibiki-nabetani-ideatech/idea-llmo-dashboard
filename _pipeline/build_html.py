# -*- coding: utf-8 -*-
"""Build index.html for the IDEA LLMO dashboard from data_v3.json.
All rendering is client-side JS over an embedded `const DATA`. Mirrors the
WingArc / IDEATECH / MACP dashboard template lineage."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = json.load(open(os.path.join(HERE, "data_v3.json")))
OUT = os.environ.get("IDEA_HTML", os.path.join(os.path.dirname(HERE), "index.html"))

CSS = r"""
:root{
  --bg:#f5f6f8;--panel:#ffffff;--ink:#212121;--ink2:#595959;--ink3:#8a8d93;
  --line:#d9d9d9;--line-soft:#ededed;--grid:#ededed;--cell-bg:#fafafa;
  --blue:#0017c1;--blue-soft:#e8eaf6;--blue-mid:#7986cb;
  --up:#0a8054;--down:#c0392b;--warn:#b86a00;
  --cat-1:#0017c1;--cat-2:#3949ab;--cat-3:#7986cb;--cat-4:#a3b1d4;
  --chatgpt:#10a37f;--gemini:#4285f4;--copilot:#0078d4;--perplex:#20c997;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font-family:-apple-system,"Hiragino Kaku Gothic ProN","Yu Gothic UI",Meiryo,sans-serif;
  font-size:13.5px;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:var(--blue)}
.app{display:flex;min-height:100vh}
.sidebar{width:248px;flex-shrink:0;background:#fff;border-right:1px solid var(--line);
  position:sticky;top:0;height:100vh;overflow-y:auto}
.brand{padding:18px 18px 14px;border-bottom:1px solid var(--line-soft)}
.b-title{font-size:15px;font-weight:800;letter-spacing:-.01em;color:var(--blue)}
.b-sub{font-size:10.5px;color:var(--ink3);letter-spacing:.04em}
.nav-group{padding:12px 12px 8px;border-bottom:1px solid var(--line-soft)}
.nav-group:last-child{border-bottom:0}
.nav-group-title{font-size:10.5px;color:var(--ink3);letter-spacing:.06em;padding:0 10px 6px;font-weight:700}
.nav-btn{display:flex;align-items:center;gap:8px;width:100%;text-align:left;padding:8px 12px;margin:1px 0;
  border:0;background:transparent;color:var(--ink);font:inherit;border-radius:4px;cursor:pointer;font-size:12.5px}
.nav-btn:hover{background:var(--cell-bg)}
.nav-btn.active{background:var(--blue);color:#fff;font-weight:600}
.nav-btn .nav-num{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:18px;
  padding:0 5px;border-radius:9px;background:var(--blue-soft);color:var(--blue);font-size:10px;font-weight:700;flex-shrink:0}
.nav-btn.active .nav-num{background:rgba(255,255,255,.25);color:#fff}
.nav-btn-diff .nav-num{background:#fff4e0;color:#b86a00}
main{flex:1;min-width:0}
.page-header{background:#fff;border-bottom:1px solid var(--line);padding:20px 32px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.page-header h1{margin:0;font-size:19px;font-weight:800}
.as-of{font-size:11.5px;background:var(--blue-soft);color:var(--blue);padding:4px 10px;border-radius:12px;font-weight:600}
.hdr-note{font-size:11px;color:var(--ink3);margin-left:auto}
.section{display:none;padding:24px 32px 70px;max-width:1320px}
.section.active{display:block}
.sec-hero{background:#fff;border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:4px;padding:18px 22px;margin-bottom:18px}
.sec-hero .crumb{font-size:11px;color:var(--ink2);letter-spacing:.04em;margin-bottom:4px}
.sec-hero .crumb b{color:var(--ink)}
.sec-hero h2{margin:0 0 6px;font-size:20px;font-weight:800;line-height:1.45}
.sec-hero h2 .answer{color:var(--blue)}
.sec-hero h2 .sub-h{font-size:13px;color:var(--ink2);font-weight:600;margin-left:6px}
.sec-hero .lead{font-size:12.5px;color:var(--ink2);margin:8px 0 0;border-left:3px solid var(--blue-soft);padding:2px 0 2px 10px}
.tab-summary{background:#fff;border:1px solid var(--line);border-left:4px solid var(--cat-3);border-radius:4px;padding:14px 18px;margin-bottom:16px;font-size:12.5px;line-height:1.9}
.tab-summary .ts-label{display:inline-block;background:var(--cat-3);color:#fff;font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:3px;margin-right:8px}
.tab-summary b{color:var(--ink)} .tab-summary .hl-num{color:var(--blue);font-weight:700}
.banner{background:#fff8ef;border:1px solid #f0d9b8;border-left:4px solid var(--warn);border-radius:4px;
  padding:10px 16px;margin-bottom:16px;font-size:12px;color:#7a4d00}
.card{background:#fff;border:1px solid var(--line);border-radius:4px;padding:18px 20px;margin-bottom:14px}
.card h3{font-size:14px;margin:0 0 4px;font-weight:700;display:inline-block;padding-bottom:6px;border-bottom:2px solid var(--blue)}
.card .h3-sub{font-size:11.5px;color:var(--ink2);margin:2px 0 12px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}
.kpi{background:var(--cell-bg);border:1px solid var(--line);border-radius:4px;padding:13px 15px}
.kpi.primary{background:#fff;border-left:3px solid var(--blue)}
.kpi .label{font-size:11px;color:var(--ink2)}
.kpi .value{font-size:23px;font-weight:800;margin-top:3px;letter-spacing:-.02em}
.kpi .value .unit{font-size:12px;color:var(--ink2);font-weight:500;margin-left:2px}
.kpi .delta{font-size:11px;color:var(--ink3);margin-top:2px}
.delta-up{color:var(--up)} .delta-down{color:var(--down)}
.chart-wrap{position:relative;height:300px;margin-top:8px}
.chart-wrap.sm{height:220px}
.legend-row{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--ink2);margin:6px 0 2px}
.legend-dot{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:middle}
table{border-collapse:collapse;font-size:12px;width:100%}
th,td{padding:6px 9px;border-bottom:1px solid var(--line-soft);text-align:left}
th{background:var(--cell-bg);color:var(--ink2);font-weight:600;font-size:11px}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.table-wrap{border:1px solid var(--line);border-radius:4px;overflow:auto}
.note{font-size:11px;color:var(--ink3);margin-top:8px;line-height:1.6}
.toolbar{display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap}
.search{border:1px solid var(--line);border-radius:4px;padding:6px 10px;font:inherit;font-size:12px;min-width:240px}
.small{font-size:11.5px;color:var(--ink2)}
.chip-group{display:flex;gap:6px;flex-wrap:wrap}
.chip{border:1px solid var(--line);background:#fff;border-radius:13px;padding:3px 11px;font-size:11px;cursor:pointer;color:var(--ink2)}
.chip.active{background:var(--blue);color:#fff;border-color:var(--blue)}
/* matrix */
.matrix-legend{display:flex;gap:14px;font-size:11px;color:var(--ink2);margin:0 0 10px;flex-wrap:wrap}
.matrix-legend .li{display:inline-flex;align-items:center;gap:5px}
.legend-mark{display:inline-block;width:18px;text-align:center;font-weight:700}
.legend-mark.r2{color:var(--up)} .legend-mark.r0{color:var(--ink3)} .legend-mark.na{color:#c9ccd3}
.matrix-wrap{border:1px solid var(--line);border-radius:4px;overflow:auto}
.matrix-wrap table{border-collapse:separate;border-spacing:0;font-size:11.5px;min-width:1100px}
.matrix-wrap th,.matrix-wrap td{padding:6px 8px;border-bottom:1px solid var(--line-soft);background:#fff;white-space:nowrap}
.matrix-wrap thead th{position:sticky;top:0;background:var(--cell-bg);z-index:3;font-size:10.5px;color:var(--ink2);font-weight:600}
.matrix-wrap thead tr.h-group th{background:#eef0f6;color:var(--ink);font-weight:700;font-size:11px;text-align:center}
.matrix-wrap thead tr.h-group th.idea-grp{background:var(--blue-soft);color:var(--blue)}
.matrix-wrap thead tr.h-group th.comp-grp{background:#fdebec;color:#b3261e}
.matrix-wrap th.col-no,td.col-no{position:sticky;left:0;z-index:2;background:#fff;text-align:right;width:36px;min-width:36px;max-width:36px}
.matrix-wrap th.col-cat,td.col-cat{position:sticky;left:36px;z-index:2;background:#fff;font-size:10.5px;color:var(--ink2);width:120px;min-width:120px;max-width:120px;white-space:normal}
.matrix-wrap th.col-prompt,td.col-prompt{position:sticky;left:156px;z-index:2;background:#fff;font-size:12px;border-right:2px solid var(--line);width:300px;min-width:300px;max-width:300px;white-space:normal}
.matrix-wrap thead th.col-no,.matrix-wrap thead th.col-cat,.matrix-wrap thead th.col-prompt{z-index:5;background:var(--cell-bg)}
.matrix-wrap tbody td.col-no,.matrix-wrap tbody td.col-cat,.matrix-wrap tbody td.col-prompt{z-index:2}
.matrix-wrap td.col-prompt .p-text{display:-webkit-box;line-height:1.45;max-height:3em;overflow:hidden;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.matrix-wrap td.col-prompt:hover .p-text{max-height:none;-webkit-line-clamp:unset}
.matrix-wrap tbody td{height:50px;vertical-align:middle}
.matrix-wrap tbody tr.cat-block-start td{border-top:2px solid #b9c0d4}
.matrix-wrap a.prompt-link{color:inherit;text-decoration:none;display:block}
.matrix-wrap a.prompt-link::after{content:' \25B6';font-size:9px;color:var(--blue);opacity:.55;margin-left:4px}
.matrix-wrap td.cell-mark{text-align:center;font-size:14px;font-weight:700;width:58px;min-width:58px}
.matrix-wrap td.cell-mark.r2{color:var(--up);background:#f3faf6}
.matrix-wrap td.cell-mark.r0{color:var(--ink3);background:#fff}
.matrix-wrap td.cell-mark.na{color:#c9ccd3;background:#fbfbfc}
.matrix-wrap td.col-divider,th.col-divider{border-left:2px solid var(--line)}
.matrix-wrap tfoot td{position:sticky;bottom:0;background:var(--cell-bg);font-weight:700;border-top:2px solid var(--line);z-index:2}
/* prompt detail */
.prompt-card{padding:14px 4px;border-bottom:1px solid var(--line-soft)}
.prompt-card .prompt-header{display:flex;align-items:flex-start;gap:12px;padding:0 0 10px;border-bottom:1px solid var(--line-soft);margin-bottom:10px}
.prompt-card .no-badge{display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:4px;background:var(--blue);color:#fff;font-weight:700;font-size:12px;flex-shrink:0}
.prompt-card .prompt-text{font-weight:600;font-size:13px;line-height:1.5}
.prompt-card .p-meta{font-size:10.5px;color:var(--ink3);margin-top:2px}
details.llm-d{margin:4px 0}
details.llm-d summary{cursor:pointer;font-size:12px;padding:6px 8px;background:var(--cell-bg);border:1px solid var(--line-soft);border-radius:4px;list-style:none}
details.llm-d summary::-webkit-details-marker{display:none}
.llm-tag{display:inline-block;padding:2px 8px;border-radius:3px;font-size:10.5px;font-weight:700;color:#fff;margin-right:6px}
.llm-tag.chatgpt{background:var(--chatgpt)} .llm-tag.gemini{background:var(--gemini)}
.llm-tag.copilot{background:var(--copilot)} .llm-tag.perplexity{background:var(--perplex)}
.llm-tag.off{background:#c9ccd3}
.detail-body{padding:14px 16px;font-size:12.5px;max-height:560px;overflow:auto;line-height:1.85;background:#fff;border:1px solid var(--line-soft);border-top:0}
.detail-body h2{font-size:14px;color:var(--blue);border-bottom:1px solid var(--line-soft);padding-bottom:4px}
.detail-body h3{font-size:13px;border-left:3px solid var(--blue);padding-left:8px}
.detail-body a{color:var(--blue);border-bottom:1px dotted var(--blue-mid)}
.detail-body mark.hl-brand{background:#fff59d;color:#5d4e00;padding:1px 4px;border-radius:3px;font-weight:700}
.detail-body mark.hl-competitor{background:#e1bee7;color:#4a148c;padding:1px 4px;border-radius:3px;font-weight:600}
.detail-empty{padding:12px 16px;font-size:12px;color:var(--ink3);background:#fafafa;border:1px dashed var(--line);border-radius:4px}
.cite-list{margin:8px 0 0;padding-left:18px;font-size:11.5px}
/* strengths */
.pos-box{background:linear-gradient(135deg,#0017c1,#3949ab);color:#fff;border-radius:6px;padding:22px 24px;margin-bottom:16px;font-size:14px;line-height:1.85;font-weight:500}
.comp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:14px}
.comp-card{background:#fff;border:1px solid var(--line);border-top:3px solid var(--blue);border-radius:4px;padding:16px}
.comp-card .cc-no{font-size:11px;color:var(--blue);font-weight:700;letter-spacing:.08em}
.comp-card h4{margin:6px 0 6px;font-size:15px}
.comp-card p{margin:0;font-size:12px;color:var(--ink2);line-height:1.7}
.adv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:820px){.adv-grid{grid-template-columns:1fr}}
.adv-card{background:var(--cell-bg);border:1px solid var(--line-soft);border-left:4px solid var(--blue);border-radius:4px;padding:14px 16px}
.adv-card .t{font-weight:700;font-size:13px;margin-bottom:4px}
.adv-card .d{font-size:12px;color:var(--ink2);line-height:1.75}
.ev-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
.ev-card{background:#fff;border:1px solid var(--line);border-radius:4px;padding:14px;text-align:center}
.ev-card .v{font-size:26px;font-weight:800;color:var(--blue)}
.ev-card .d{font-size:11px;color:var(--ink2);margin-top:4px;line-height:1.6}
/* persona */
.persona-box{background:#fff;border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:4px;padding:16px 20px;margin-bottom:16px}
.persona-box .tags{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}
.persona-box .tags span{background:var(--blue-soft);color:var(--blue);font-size:10.5px;padding:2px 8px;border-radius:3px}
.persona-box .pdesc{font-size:12.5px;color:var(--ink2);line-height:1.8}
.ai-criteria-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:6px 0 18px}
@media(max-width:820px){.ai-criteria-grid{grid-template-columns:1fr}}
.ai-crit-card{background:#fff;border:1px solid var(--line);border-radius:4px;padding:14px 16px}
.ai-crit-card .crit-head{font-size:12px;font-weight:700;color:#fff;padding:4px 10px;border-radius:3px;display:inline-block;margin-bottom:10px}
.ai-crit-card.both .crit-head{background:#2e7d32}
.ai-crit-card.idea .crit-head{background:var(--blue)}
.ai-crit-card.gap .crit-head{background:#c0392b}
.ai-crit-card ul{list-style:none;padding:0;margin:0}
.ai-crit-card li{font-size:12px;padding:8px 10px;background:var(--cell-bg);border-radius:4px;margin-bottom:6px;line-height:1.5}
.ai-mapping{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
@media(max-width:820px){.ai-mapping{grid-template-columns:1fr}}
.quad{border:1px solid var(--line);border-radius:6px;padding:16px 18px;background:#fff;min-height:170px}
.quad h4{margin:0 0 6px;font-size:13px;font-weight:700}
.quad .qhint{font-size:11px;color:var(--ink2);margin-bottom:10px;padding-bottom:8px;border-bottom:1px dashed var(--line-soft)}
.quad ul{margin:0;padding-left:18px;font-size:12px;line-height:1.7}
.q-tl.rule-make{background:linear-gradient(135deg,#fef3c7,#fef9e7);box-shadow:0 4px 12px rgba(245,158,11,.18);border-left:6px solid #f59e0b;position:relative}
.q-tl.rule-make::before{content:'\2605 \30EB\30FC\30EB\30E1\30A4\30AF\672C\547D';position:absolute;top:-10px;right:14px;background:#f59e0b;color:#fff;padding:3px 12px;border-radius:14px;font-size:10.5px;font-weight:700}
.rank-table td.rk{font-weight:700;color:var(--blue);width:30px}
.rank-table tr.is-self td{background:#fff7e6}
.rank-table .self-badge{background:var(--blue);color:#fff;font-size:9.5px;padding:1px 6px;border-radius:8px;margin-left:6px}
.bar{height:8px;background:var(--blue-soft);border-radius:4px;overflow:hidden;display:inline-block;width:90px;vertical-align:middle;margin-right:6px}
.bar>i{display:block;height:100%;background:var(--blue)}
/* news */
.topics-list{display:flex;flex-direction:column;gap:10px}
.topic-card{border:1px solid var(--line);border-radius:4px;padding:12px 14px;background:#fff}
.topic-card .tc-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:4px}
.topic-card .tc-date{font-size:10.5px;color:var(--ink3)}
.topic-card .tc-ai{font-size:10.5px;font-weight:700;color:#fff;background:var(--cat-2);padding:1px 8px;border-radius:3px}
.topic-card .tc-tags span{font-size:10px;color:var(--blue);background:var(--blue-soft);padding:1px 7px;border-radius:3px;margin-right:4px}
.topic-card h4{margin:4px 0;font-size:13px}
.topic-card p{margin:4px 0;font-size:12px;color:var(--ink2);line-height:1.7}
.blank-state{background:#fff;border:1px dashed var(--line);border-radius:6px;padding:40px;text-align:center;color:var(--ink3)}
.blank-state .bs-icon{font-size:30px;opacity:.5}
.blank-state h3{border:0;color:var(--ink2);font-size:15px;margin:8px 0 4px;display:block}
.tmpl-table th{background:var(--blue-soft);color:var(--blue)}
.tmpl-row td{color:var(--ink3);font-style:italic}
/* overview box (MACP) */
.overview-box{background:#fff;border:1px solid var(--line);border-radius:4px;padding:16px 20px;margin-bottom:16px}
.overview-box h3{margin:0 0 10px;font-size:15px;font-weight:700;display:inline-block;padding-bottom:6px;border-bottom:2px solid var(--blue)}
.overall-summary-text{font-size:13px;line-height:2;background:var(--cell-bg);border:1px solid var(--line-soft);border-left:4px solid var(--blue);border-radius:4px;padding:14px 18px}
/* subcat blocks (MACP detail / persona) */
.subcat-block{background:#fff;border:1px solid var(--line);border-left:5px solid var(--blue);border-radius:4px;padding:16px 20px;margin-bottom:20px}
.subcat-block.b1{border-left-color:#1565c0}.subcat-block.b2{border-left-color:#7b1fa2}.subcat-block.b3{border-left-color:#c0392b}
.subcat-head{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px dashed var(--line)}
.subcat-head .b-num{display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:28px;padding:0 10px;border-radius:6px;background:var(--blue-soft);color:var(--blue);font-weight:700;font-size:12.5px}
.subcat-block.b1 .b-num{background:#e3f2fd;color:#1565c0}.subcat-block.b2 .b-num{background:#f3e5f5;color:#7b1fa2}.subcat-block.b3 .b-num{background:#fbe9e7;color:#c0392b}
.subcat-head h4{margin:0;font-size:15px;font-weight:700}
.subcat-head .b-count{margin-left:auto;font-size:11px;color:var(--ink2);background:var(--cell-bg);padding:3px 10px;border-radius:10px;border:1px solid var(--line)}
.prompt-card.flash{box-shadow:0 0 0 3px var(--blue-soft)}
/* DR pills / tabs / pager (WingArc citation) */
.dr-pill{display:inline-block;min-width:30px;text-align:center;padding:1px 7px;border-radius:10px;font-size:11px;font-weight:700;background:#eceff3;color:var(--ink2)}
.dr-pill.dr-top{background:#ffe082;color:#7a5c00}.dr-pill.dr-high{background:#bbdefb;color:#0d47a1}
.dr-pill.dr-mid{background:#e3f2fd;color:#1565c0}.dr-pill.dr-low{background:#eceff3;color:#555}.dr-pill.dr-zero{background:#fff;color:#bbb;border:1px solid var(--line-soft)}
tr.dr-row-top td{background:#fffdf3}tr.dr-row-high td{background:#f5faff}
.dr-tabs,.src-tabs{display:inline-flex;gap:4px;background:var(--cell-bg);border:1px solid var(--line);border-radius:6px;padding:3px}
.dr-tabs button,.src-tabs button{border:0;background:transparent;font:inherit;font-size:11.5px;padding:5px 12px;border-radius:4px;cursor:pointer;color:var(--ink2)}
.dr-tabs button.active,.src-tabs button.active{background:var(--blue);color:#fff;font-weight:600}
.src-tabs button .cnt{opacity:.7;margin-left:4px;font-size:10px}
.pager{display:flex;gap:6px;align-items:center;justify-content:center;margin-top:12px;font-size:12px}
.pager button{border:1px solid var(--line);background:#fff;border-radius:4px;padding:4px 10px;cursor:pointer;font:inherit}
.pager button:disabled{opacity:.4;cursor:default}
/* persona image box (MACP) */
.persona-image-box{background:#fff;border:1px solid var(--line);border-left:4px solid var(--blue);border-radius:4px;padding:16px 20px;margin-bottom:16px}
.persona-image-box .pi-content{display:flex;gap:18px;align-items:flex-start}
.persona-image-box .pi-icon{flex-shrink:0;width:84px;height:84px;border-radius:50%;background:var(--blue-soft);display:flex;align-items:center;justify-content:center;font-size:34px}
.crit-meta{font-size:10.5px;color:var(--ink2);font-style:italic;margin-bottom:8px}
.ai-crit-card li .ci-name{font-weight:600;display:block;margin-bottom:3px}
.ai-crit-card li .ci-companies{font-size:11px;color:var(--ink2)}
.menu-toggle{display:none}
@media(max-width:880px){
  .sidebar{position:fixed;z-index:50;transform:translateX(-100%);transition:.2s}
  .sidebar.open{transform:none}
  .menu-toggle{display:inline-flex;border:1px solid var(--line);background:#fff;border-radius:4px;padding:6px 10px;cursor:pointer}
  .section{padding:18px 16px 60px}
}
"""

NAV = [
  ("★ サマリ", [("diff", "★", "n月実績差分", "nav-btn-diff"), ("insights", "★", "n月実績所感", "nav-btn-diff")]),
  ("① 結果指標モニタリング", [("ss", "①-1", "セッション (SS)", ""), ("cv", "①-2", "コンバージョン (CV)", "")]),
  ("② 推奨状況・サイテーション", [("branded", "②-1", "指名プロンプト言及状況", ""),
      ("nbmatrix", "②-2", "非指名プロンプト一覧", ""), ("nbdetail", "②-3", "非指名プロンプト詳細", ""),
      ("citation", "②-4", "IDEA LLMO サイテーション", "")]),
  ("③ IDEAルールメイク", [("strengths", "③-0", "強みの言語化", ""),
      ("pA", "③-1", "ペルソナA", ""), ("pB", "③-2", "ペルソナB", ""), ("pC", "③-3", "ペルソナC", "")]),
  ("④ IDEAナレッジ", [("news", "④-1", "主要AIニュース", ""),
      ("campaigns", "④-2", "実施施策 / 施策結果", ""), ("consulting", "④-3", "IDEAコンサルティング", "")]),
]

def build_nav():
    out = ['<div class="brand"><div class="b-title">IDEA LLMO</div><div class="b-sub">Monthly Monitor Dashboard</div></div>']
    for title, items in NAV:
        out.append('<div class="nav-group"><div class="nav-group-title">%s</div>' % title)
        for sid, num, label, extra in items:
            out.append('<button class="nav-btn %s" data-section="sec-%s"><span class="nav-num">%s</span>%s</button>'
                       % (extra, sid, num, label))
        out.append('</div>')
    return "\n".join(out)

def build_sections():
    ids = [it[0] for _, items in NAV for it in items]
    return "\n".join('<section id="sec-%s" class="section"></section>' % s for s in ids)

JS = open(os.path.join(HERE, "render.js"), encoding="utf-8").read()

html = """<!doctype html><html lang="ja"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>IDEA LLMO ダッシュボード</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<style>%s</style></head>
<body>
<div class="app">
<aside class="sidebar" id="sidebar">%s</aside>
<main>
<div class="page-header">
  <button class="menu-toggle" id="menuToggle">☰</button>
  <h1>IDEA LLMO ダッシュボード</h1>
  <span class="as-of" id="asOf"></span>
  <span class="hdr-note" id="hdrNote"></span>
</div>
%s
</main></div>
<script>const DATA = __DATA__;</script>
<script>%s</script>
</body></html>""" % (CSS, build_nav(), build_sections(), JS)

html = html.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
open(OUT, "w", encoding="utf-8").write(html)
print("index.html:", round(os.path.getsize(OUT)/1024, 1), "KB ->", OUT)
