/* IDEA LLMO dashboard — client-side rendering over const DATA */
(function(){
"use strict";
const M = DATA.meta, AVAIL = M.available_llms || ["chatgpt"];
const LLMS = M.llms, LL = M.llm_labels;
const COMP = M.competitors, COMPL = M.competitor_labels;
const MONO = d => (d==null? "—" : d);
const esc = s => (s==null?"":String(s)).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $ = id => document.getElementById(id);
function fmtMonth(ym){ if(!ym) return ""; const[y,m]=ym.split("-"); return y.slice(2)+"/"+(+m); }

/* ---- markdown-lite for LLM responses, with brand highlighting ---- */
const SELF_RE = /(IDEA\s?LLMO|IDEATECH|アイデアテック|リサピー)/g;
const COMP_NAMES = [/ナイル|SEO\s?HACKS/g,/ミエルカ|Faber\s?Company/g,/CINC/g,/イノーバ|innova/gi,/umoren|Queue株式会社/gi];
function mdLite(t){
  if(!t) return "";
  let h = esc(t);
  h = h.replace(/^######?\s?(.*)$/gm,"<h3>$1</h3>")
       .replace(/^##\s?(.*)$/gm,"<h2>$1</h2>")
       .replace(/^#\s?(.*)$/gm,"<h2>$1</h2>")
       .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
       .replace(/^\s*[-*]\s+(.*)$/gm,"<li>$1</li>");
  h = h.replace(/(<li>[\s\S]*?<\/li>)/g, m=>"<ul>"+m+"</ul>").replace(/<\/ul>\s*<ul>/g,"");
  h = h.replace(SELF_RE,'<mark class="hl-brand">$1</mark>');
  COMP_NAMES.forEach(re=>{ h = h.replace(re, m=>'<mark class="hl-competitor">'+m+'</mark>'); });
  h = h.replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>");
  return "<p>"+h+"</p>";
}
function citeList(links){
  if(!links||!links.length) return "";
  const items = links.slice(0,12).map(l=>`<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title||l.url)}</a></li>`).join("");
  return `<div class="small" style="margin-top:8px;font-weight:600">引用元 (${links.length})</div><ul class="cite-list">${items}</ul>`;
}

/* ---- hero / summary helpers ---- */
function hero(crumb, h2, lead){ return `<div class="sec-hero"><div class="crumb">${crumb}</div><h2>${h2}</h2>${lead?`<p class="lead">${lead}</p>`:""}</div>`; }
function summary(html){ return `<div class="tab-summary"><span class="ts-label">所見</span>${html}</div>`; }
function addonBanner(){
  return `<div class="banner">⚠ 現在のAhrefsサブスクリプションでは <b>ChatGPT</b> のみBrandRadarデータを取得できます。Gemini / Copilot / Perplexity はアドオン未契約のため「—」表示です（アドオン契約後に自動で埋まります）。</div>`;
}
function kpiBox(label,value,unit,delta,primary){
  return `<div class="kpi ${primary?'primary':''}"><div class="label">${label}</div><div class="value">${value}${unit?`<span class="unit">${unit}</span>`:""}</div>${delta?`<div class="delta">${delta}</div>`:""}</div>`;
}

/* ===================== ① SS ===================== */
function renderSS(s){
  const ss=DATA.ss, mo=DATA.ss_meta.months;
  const tot=ss.site_total, ai=ss.ai_total, org=ss.organic;
  const last=tot.length-1;
  const aiRatio = tot[last]? (ai[last]/tot[last]*100).toFixed(1):"0.0";
  s.innerHTML = hero(
    `① 結果指標モニタリング｜<b>セッション (SS)</b>｜GA4`,
    `直近月 (${mo[last]}) のサイト流入は <span class="answer">${tot[last]}件</span><span class="sub-h">うちAI経由 ${ai[last]}件 / AI経由比率 ${aiRatio}%</span>`,
    `IDEA LLMO関連ページ群のセッション数推移。AI経由は chatgpt.com 等の対話型AI参照流入を指す。`)
    + summary(`サービスは <b>2026年6月12日にプレスリリース</b>を配信したばかりで、流入は立ち上げ初期段階。5月に <span class="hl-num">19</span> セッション（うちAI経由=ChatGPT <span class="hl-num">2</span>）、6月は集計途中。今後パブリシティ積み上げに伴うAI経由流入の増加をモニタリングする。`)
    + `<div class="kpis">${kpiBox("直近月セッション",tot[last],"件","",1)+kpiBox("AI経由セッション",ai[last],"件")+kpiBox("AI経由比率",aiRatio,"%")+kpiBox("オーガニック",org[last],"件")}</div>`
    + `<div class="card"><h3>サイト流入の月次推移</h3><div class="h3-sub">IDEA LLMO関連ページ群（service / download / contact / thanks）</div>
        <div class="legend-row"><span><span class="legend-dot" style="background:var(--blue)"></span>サイト全体</span><span><span class="legend-dot" style="background:var(--chatgpt)"></span>AI経由(ChatGPT)</span><span><span class="legend-dot" style="background:var(--cat-3)"></span>オーガニック</span></div>
        <div class="chart-wrap"><canvas id="ssChart"></canvas></div></div>`
    + `<div class="card"><h3>月次内訳</h3><div class="table-wrap"><table><thead><tr><th>月</th><th class="num">サイト全体</th><th class="num">AI経由</th><th class="num">オーガニック</th><th class="num">参照(その他)</th><th class="num">ダイレクト</th></tr></thead><tbody>${
        mo.map((m,i)=>`<tr><td>${m}</td><td class="num">${tot[i]}</td><td class="num">${ai[i]}</td><td class="num">${org[i]}</td><td class="num">${ss.referral_other[i]}</td><td class="num">${ss.direct[i]}</td></tr>`).join("")
      }</tbody></table></div><div class="note">${esc(DATA.ss_meta.note)}</div></div>`;
  const ctx=$("ssChart");
  new Chart(ctx,{type:"line",data:{labels:mo.map(fmtMonth),datasets:[
    {label:"サイト全体",data:tot,borderColor:"#0017c1",backgroundColor:"#0017c1",tension:.25},
    {label:"AI経由",data:ai,borderColor:"#10a37f",backgroundColor:"#10a37f",tension:.25},
    {label:"オーガニック",data:org,borderColor:"#7986cb",backgroundColor:"#7986cb",borderDash:[5,4],tension:.25}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:"#ededed"}},x:{grid:{display:false}}}}});
}

/* ===================== ① CV ===================== */
function renderCV(s){
  const cv=DATA.cv, mo=DATA.cv_meta.months;
  const sh=cv.shiryo, to=cv.toiawase;
  const shA=mo.map(m=>sh.monthly[m]||0), toA=mo.map(m=>to.monthly[m]||0);
  const last=mo.length-1;
  s.innerHTML = hero(
    `① 結果指標モニタリング｜<b>コンバージョン (CV)</b>｜HubSpot`,
    `累計CVは <span class="answer">${sh.total+to.total}件</span><span class="sub-h">資料DL ${sh.total} / お問い合わせ ${to.total}</span>`,
    `HubSpotのフォーム送信（「サービス資料｜IDEA LLMO」「お問い合わせ｜IDEA LLMO」）に紐づくコンバージョン数。`)
    + summary(`PR配信後の6月に資料DLが <span class="hl-num">${sh.monthly['2026-06']||0}</span> 件、初の「お問い合わせ」 <span class="hl-num">${to.monthly['2026-06']||0}</span> 件が発生。AI経由セッションからのCV転換を今後追跡する。`)
    + `<div class="kpis">${kpiBox("資料DL（累計）",sh.total,"件","",1)+kpiBox("お問い合わせ（累計）",to.total,"件")+kpiBox("直近月CV",(shA[last]+toA[last]),"件")}</div>`
    + `<div class="card"><h3>CVの月次推移</h3><div class="h3-sub">フォーム別送信数</div>
        <div class="legend-row"><span><span class="legend-dot" style="background:var(--blue)"></span>サービス資料</span><span><span class="legend-dot" style="background:var(--cat-2)"></span>お問い合わせ</span></div>
        <div class="chart-wrap sm"><canvas id="cvChart"></canvas></div></div>`
    + `<div class="card"><h3>フォーム別 月次内訳</h3><div class="table-wrap"><table><thead><tr><th>フォーム</th>${mo.map(m=>`<th class="num">${m}</th>`).join("")}<th class="num">累計</th></tr></thead><tbody>
        <tr><td>サービス資料｜IDEA LLMO</td>${shA.map(v=>`<td class="num">${v}</td>`).join("")}<td class="num">${sh.total}</td></tr>
        <tr><td>お問い合わせ｜IDEA LLMO</td>${toA.map(v=>`<td class="num">${v}</td>`).join("")}<td class="num">${to.total}</td></tr>
      </tbody></table></div><div class="note">${esc(DATA.cv_meta.note)}</div></div>`;
  new Chart($("cvChart"),{type:"bar",data:{labels:mo.map(fmtMonth),datasets:[
    {label:"資料",data:shA,backgroundColor:"#0017c1"},{label:"問い合わせ",data:toA,backgroundColor:"#3949ab"}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:"#ededed"},ticks:{precision:0}},x:{grid:{display:false}}}}});
}

/* ===================== matrix builders ===================== */
function markCell(state){
  if(state===true) return `<td class="cell-mark r2">⚫︎</td>`;
  if(state===false) return `<td class="cell-mark r0">▲</td>`;
  return `<td class="cell-mark na">—</td>`;
}
/* ② -1 branded: prompts × 4 LLM (self mention) */
function renderBranded(s){
  const rows=DATA.branded, sm=DATA.branded_summary;
  const rate=(sm.hit/sm.tot*100).toFixed(0);
  let body="";
  rows.forEach((r,i)=>{
    body+=`<tr class="${i===0?'cat-block-start':''}"><td class="col-no">${r.no}</td><td class="col-cat">${esc(r.category)}</td>`
      +`<td class="col-prompt"><a class="prompt-link" href="#det-b-${r.no}"><span class="p-text">${esc(r.prompt)}</span></a></td>`
      + LLMS.map(l=>markCell(r.by_llm[l].self)).join("") + `</tr>`;
  });
  const detail = rows.map(r=>detailCard("b",r)).join("");
  s.innerHTML = hero(`② 推奨状況・サイテーション｜<b>指名プロンプト言及状況</b>｜BrandRadar`,
      `指名プロンプト ${rows.length}件中 <span class="answer">${sm.hit}件</span> でIDEA LLMOが言及<span class="sub-h">ChatGPT言及率 ${rate}%</span>`,
      `自社名・サービス名を含む「指名」プロンプトに対し、各LLMがIDEA LLMO/IDEATECHを言及・推薦しているかを確認。`)
    + summary(`指名プロンプトではChatGPTの言及率 <span class="hl-num">${rate}%</span>。サービス名を直接指定した場合は概ね正しく認知・説明されている。今後は説明の正確性（料金・手法・連携）が適切な文脈で語られているかをチューニングする。`)
    + addonBanner()
    + `<div class="kpis">${kpiBox("ChatGPT言及率",rate,"%","",1)+kpiBox("言及あり",sm.hit,"/ "+sm.tot)+kpiBox("対象プロンプト",rows.length,"件")}</div>`
    + `<div class="card"><h3>指名プロンプト言及状況 一覧</h3><div class="h3-sub">⚫︎=言及あり / ▲=言及なし / —=データ取得対象外</div>`
    + matrixLegend()
    + `<div class="matrix-wrap"><table><thead><tr><th class="col-no">No</th><th class="col-cat">分類</th><th class="col-prompt">プロンプト</th>${LLMS.map((l,i)=>`<th class="cell-mark ${i===0?'col-divider':''}">${LL[l]}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div></div>`
    + `<div class="card"><h3>応答全文 (ChatGPT)</h3><div class="h3-sub">プロンプトごとの応答とサイテーション</div>${detail}</div>`;
  wireMatrixLinks(s);
}
function matrixLegend(){
  return `<div class="matrix-legend"><span class="li"><span class="legend-mark r2">⚫︎</span>言及あり</span><span class="li"><span class="legend-mark r0">▲</span>言及なし</span><span class="li"><span class="legend-mark na">—</span>データ取得対象外（アドオン未契約）</span></div>`;
}
function detailCard(prefix,r){
  const cg=r.by_llm.chatgpt;
  let llmBlocks = LLMS.map(l=>{
    const d=r.by_llm[l];
    if(d.self==null) return `<details class="llm-d"><summary><span class="llm-tag off">${LL[l]}</span>データ取得対象外（アドオン未契約）</summary><div class="detail-empty">このLLMはBrandRadarアドオン未契約のためデータがありません。</div></details>`;
    return `<details class="llm-d"><summary><span class="llm-tag ${l}">${LL[l]}</span>${d.self?'言及あり':'言及なし'} ・ 応答全文を見る</summary><div class="detail-body">${mdLite(d.response)}${citeList(d.links)}</div></details>`;
  }).join("");
  return `<div class="prompt-card" id="det-${prefix}-${r.no}"><div class="prompt-header"><div class="no-badge">${r.no}</div><div style="flex:1;min-width:0"><div class="prompt-text">${esc(r.prompt)}</div><div class="p-meta">${esc(r.category)}${r.volume?` ・ 検索Vol ${r.volume}`:""}</div></div></div>${llmBlocks}</div>`;
}
function wireMatrixLinks(s){
  s.querySelectorAll("a.prompt-link").forEach(a=>a.addEventListener("click",e=>{
    e.preventDefault(); const t=s.querySelector(a.getAttribute("href").replace("#","#")) || document.getElementById(a.getAttribute("href").slice(1));
    if(t){ const d=t.querySelector("details"); if(d) d.setAttribute("open",""); t.scrollIntoView({behavior:"smooth",block:"center"}); t.style.boxShadow="0 0 0 3px var(--blue-soft)"; setTimeout(()=>t.style.boxShadow="",1600);} }));
}

/* ② -2 nonbranded matrix: prompts × brand(self+5) × LLM */
function renderNbMatrix(s){
  const rows=DATA.nonbranded;
  const brands=[{k:"self",label:"IDEA LLMO",grp:"idea"}].concat(COMP.map(c=>({k:c,label:COMPL[c],grp:"comp"})));
  // mention rate per brand (chatgpt)
  function brandRate(b){ let hit=0,tot=0; rows.forEach(r=>{const d=r.by_llm.chatgpt; if(d.self==null)return; tot++; const v=b.k==="self"?d.self:d.competitors[b.k]; if(v)hit++;}); return tot?(hit/tot*100).toFixed(0):"0"; }
  let head1=`<tr class="h-group"><th class="col-no" rowspan="2">No</th><th class="col-cat" rowspan="2">分類</th><th class="col-prompt" rowspan="2">プロンプト</th>`
    + brands.map((b,i)=>`<th colspan="${LLMS.length}" class="${b.grp==='idea'?'idea-grp':'comp-grp'} col-divider">${esc(b.label)}</th>`).join("") + `</tr>`;
  let head2=`<tr>`+brands.map(b=>LLMS.map((l,i)=>`<th class="cell-mark ${i===0?'col-divider':''}">${LL[l]}</th>`).join("")).join("")+`</tr>`;
  let cats=[],body="";
  rows.forEach(r=>{
    const isNew=cats.indexOf(r.category)<0; if(isNew)cats.push(r.category);
    body+=`<tr class="${isNew?'cat-block-start':''}"><td class="col-no">${r.no}</td><td class="col-cat">${esc(r.category)}</td>`
      +`<td class="col-prompt"><a class="prompt-link" href="#det-n-${r.no}"><span class="p-text">${esc(r.prompt)}</span></a></td>`;
    brands.forEach(b=>{ LLMS.forEach((l,i)=>{ const d=r.by_llm[l]; let st = d.self==null?null:(b.k==="self"?d.self:d.competitors[b.k]); body+= markCellD(st,i===0); }); });
    body+=`</tr>`;
  });
  s.innerHTML = hero(`② 推奨状況・サイテーション｜<b>非指名プロンプト 一覧</b>｜BrandRadar`,
      `非指名 ${rows.length}プロンプトでの推奨状況。IDEA LLMO言及率 <span class="answer">${brandRate(brands[0])}%</span><span class="sub-h">ChatGPT・カテゴリ非指名検索</span>`,
      `「LLMO支援会社のおすすめは？」等、自社名を含まない非指名プロンプトに対し、自社・競合がどれだけ推奨・言及されているかの一覧。`)
    + summary(`非指名（カテゴリ検索）でのChatGPT言及率は IDEA LLMO <span class="hl-num">${brandRate(brands[0])}%</span>。競合は ${brands.slice(1).map(b=>`${b.label} ${brandRate(b)}%`).join(' / ')}。ツール型GEO企業が先行しており、調査PR起点の文脈をルールメイクしていく余地が大きい。`)
    + addonBanner()
    + `<div class="kpis">${brands.map((b,i)=>kpiBox(b.label+" 言及率",brandRate(b),"%","",i===0)).join("")}</div>`
    + `<div class="card"><h3>推奨状況 一覧（非指名 ${rows.length}プロンプト）</h3><div class="h3-sub">⚫︎=言及あり / ▲=言及なし / —=データ取得対象外。左3列は固定、横スクロールで全ブランド×全LLMを確認</div>`
    + matrixLegend()
    + `<div class="matrix-wrap"><table><thead>${head1}${head2}</thead><tbody>${body}</tbody></table></div></div>`;
  wireMatrixLinks(s);
}
function markCellD(state,divider){
  const dc = divider?" col-divider":"";
  if(state===true) return `<td class="cell-mark r2${dc}">⚫︎</td>`;
  if(state===false) return `<td class="cell-mark r0${dc}">▲</td>`;
  return `<td class="cell-mark na${dc}">—</td>`;
}
/* ② -3 nonbranded detail */
function renderNbDetail(s){
  const rows=DATA.nonbranded;
  const cats=[...new Set(rows.map(r=>r.category))];
  let blocks=cats.map(cat=>{
    const rs=rows.filter(r=>r.category===cat);
    return `<div class="card"><h3>${esc(cat)}</h3><div class="h3-sub">${rs.length}プロンプト</div>${rs.map(r=>detailCard("n",r)).join("")}</div>`;
  }).join("");
  s.innerHTML = hero(`② 推奨状況・サイテーション｜<b>非指名プロンプト 詳細</b>｜BrandRadar`,
      `非指名プロンプトの<span class="answer">応答全文</span><span class="sub-h">ChatGPT・分類別</span>`,
      `各非指名プロンプトに対するLLM応答の全文。自社=黄ハイライト、競合=紫ハイライトで言及箇所を表示。`)
    + `<div class="toolbar"><input class="search" id="nbSearch" placeholder="プロンプト／分類で検索"><span class="small" id="nbCount"></span></div>`
    + addonBanner() + blocks;
  const inp=$("nbSearch");
  inp.addEventListener("input",()=>{ const q=inp.value.trim(); s.querySelectorAll(".prompt-card").forEach(c=>{ c.style.display = (!q || c.textContent.includes(q))?"":"none"; }); });
}

/* ② -4 citations */
function renderCitation(s){
  const c=DATA.citations, pages=c.pages||[], domains=c.domains||[];
  const ideatech = pages.filter(p=>(p.domain||"").includes("ideatech")||((p.url||"").includes("ideatech")));
  s.innerHTML = hero(`② 推奨状況・サイテーション｜<b>IDEA LLMO サイテーション</b>｜BrandRadar 引用元`,
      `モニタリング応答の引用元は <span class="answer">${pages.length}ページ</span><span class="sub-h">${domains.length}ドメイン</span>`,
      `LLMOモニタリングのAI応答が参照した引用元ページ・ドメイン。IDEATECHドメインの被参照状況を含む。`)
    + summary(`AI応答の引用元として ${domains.length} ドメイン・${pages.length} ページを観測。自社(ideatech.jp)関連の被引用は <span class="hl-num">${ideatech.length}</span> ページ。PRTIMES・業界メディアでのサイテーションを増やすことで被引用機会の拡大を狙う。`)
    + addonBanner()
    + `<div class="kpis">${kpiBox("引用元ページ数",pages.length,"件","",1)+kpiBox("引用元ドメイン数",domains.length,"件")+kpiBox("自社関連の被引用",ideatech.length,"ページ")}</div>`
    + `<div class="card"><h3>引用元ドメイン</h3><div class="h3-sub">AI応答が参照したドメイン（出現回数順）</div><div class="table-wrap"><table><thead><tr><th class="num">#</th><th>ドメイン</th><th class="num">出現</th><th class="num">DR</th></tr></thead><tbody>${
        domains.slice(0,40).map((d,i)=>`<tr><td class="num">${i+1}</td><td>${esc(d.domain||d.url||"")}</td><td class="num">${MONO(d.count)}</td><td class="num">${MONO(d.dr)}</td></tr>`).join("")
      }</tbody></table></div></div>`
    + `<div class="card"><h3>引用元ページ</h3><div class="h3-sub">AI応答が参照したページ</div><div class="table-wrap"><table><thead><tr><th class="num">#</th><th>タイトル / URL</th><th class="num">出現</th><th class="num">DR</th></tr></thead><tbody>${
        pages.slice(0,80).map((p,i)=>`<tr><td class="num">${i+1}</td><td><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title||p.url)}</a><div class="small">${esc(p.domain||"")}</div></td><td class="num">${MONO(p.count)}</td><td class="num">${MONO(p.dr)}</td></tr>`).join("")
      }</tbody></table></div><div class="note">${esc(c.note||"")}<br>※ Ahrefsコンテンツエクスプローラーのドメインレーティング(DR)は本エンドポイントでは取得できないため空欄。アドオン契約後にDR列を付与可能。</div></div>`;
}

/* ③ -0 strengths */
function renderStrengths(s){
  const st=DATA.strengths;
  s.innerHTML = hero(`③ IDEAルールメイク｜<b>強みの言語化</b>`,
      `IDEA LLMOの強みと<span class="answer">競合優位性</span>`,
      `サービスサイト・プレスリリースをもとに、IDEA LLMOのLLMOサービスとしての強み・競合優位性を構造化。`)
    + `<div class="pos-box">${esc(st.positioning)}</div>`
    + `<div class="kpis">${st.kpis.map((k,i)=>kpiBox(k.label,k.value,"","",i===0)).join("")}</div>`
    + `<div class="card"><h3>3つのコア・コンピタンス</h3><div class="comp-grid">${st.competences.map(c=>`<div class="comp-card"><div class="cc-no">COMPETENCE ${c.no}</div><h4>${esc(c.title)}</h4><p>${esc(c.desc)}</p></div>`).join("")}</div></div>`
    + `<div class="card"><h3>競合優位性（6つの差別化要因）</h3><div class="adv-grid">${st.advantages.map(a=>`<div class="adv-card"><div class="t">${esc(a.t)}</div><div class="d">${esc(a.d)}</div></div>`).join("")}</div></div>`
    + `<div class="card"><h3>SEO会社 vs PR会社（IDEATECH）</h3><div class="table-wrap"><table><thead><tr>${st.vs_table.head.map((h,i)=>`<th class="${i?'num':''}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${
        st.vs_table.rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="num">${esc(r[1])}</td><td class="num">${esc(r[2])}</td></tr>`).join("")
      }</tbody></table></div></div>`
    + `<div class="card"><h3>市場のファクト（なぜ今LLMO×PRか）</h3><div class="ev-grid">${st.evidence.map(e=>`<div class="ev-card"><div class="v">${esc(e.v)}</div><div class="d">${esc(e.d)}</div></div>`).join("")}</div></div>`
    + summary(esc(st.diff_summary));
}

/* ③ persona */
function renderPersona(s,pk){
  const p=DATA.personas[pk], m=p.meta, cr=p.criteria, q=p.quadrant;
  const maxc=Math.max(1,...p.companies.map(c=>c.count));
  const compRows=p.companies.map((c,i)=>{
    const self=/IDEATECH|IDEA LLMO/.test(c.name);
    return `<tr class="${self?'is-self':''}"><td class="rk">${i+1}</td><td>${esc(c.name)}${self?'<span class="self-badge">自社</span>':""}</td><td class="num"><span class="bar"><i style="width:${(c.count/maxc*100).toFixed(0)}%"></i></span>${c.count}</td></tr>`;
  }).join("");
  const critCard=(cls,head,items)=>`<div class="ai-crit-card ${cls}"><div class="crit-head">${head}</div><ul>${items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>`;
  const quad=(cls,title,hint,items)=>`<div class="quad ${cls}"><h4>${title}</h4><p class="qhint">${hint}</p><ul>${items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>`;
  const num = {A:"③-1",B:"③-2",C:"③-3"}[pk];
  s.innerHTML = hero(`③ IDEAルールメイク｜<b>ペルソナ${pk}</b>｜${num}`,
      `${esc(m.short)}`,
      `${esc(p.title)}`)
    + `<div class="persona-box"><div class="tags">${m.tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div><div class="pdesc">${esc(m.desc)}</div></div>`
    + `<div class="card"><h3>LLMの推薦基準と推薦企業</h3><div class="h3-sub">このペルソナのプロンプト群（失敗軸・選定軸・おすすめ軸）でChatGPTが推薦・言及した企業の頻度</div>
        <div class="table-wrap"><table class="rank-table"><thead><tr><th class="rk">#</th><th>企業 / サービス</th><th class="num">言及回数</th></tr></thead><tbody>${compRows}</tbody></table></div></div>`
    + `<div class="card"><h3>AI認知サマリ — 推薦基準</h3><div class="h3-sub">ChatGPTが推薦時に重視する基準を、業界共通／IDEAの強み／IDEAの空白で整理</div>
        <div class="ai-criteria-grid">${critCard("both","業界共通の選定基準",cr.common)+critCard("idea","IDEA LLMOが強い基準",cr.idea)+critCard("gap","IDEAの空白（競合が押さえる）",cr.gap)}</div></div>`
    + `<div class="card"><h3>AI認知マッピング — 4象限</h3><div class="h3-sub">縦軸：IDEA LLMOの強み（上=強）／横軸：AI認知の強弱（左=弱・右=強）。<b>左上＝AI認知が弱くIDEAが強い「ルールメイク本命」領域</b></div>
        <div class="ai-mapping">${
          quad("q-tl rule-make","AI認知 弱 × IDEA 強","発信・コンテンツ化でAIに取り込ませ、自社主導でルールメイクできる本命領域",q.tl)
        + quad("q-tr","AI認知 強 × IDEA 強","既にAIに定着しつつある強み。維持・反復露出で強化",q.tr)
        + quad("q-bl","AI認知 弱 × IDEA 弱","優先度低。競合も弱いが投資リターンも小さい",q.bl)
        + quad("q-br","AI認知 強 × IDEA 弱","競合が認知を獲得済み。追従・差別化が必要",q.br)
        }</div></div>`;
}

/* ④ -1 news */
function renderNews(s){
  const t=DATA.ai_topics||{}, entries=(t.entries||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const ais=[...new Set(entries.map(e=>e.ai).filter(Boolean))];
  s.innerHTML = hero(`④ IDEAナレッジ｜<b>主要AIニュース</b>｜自動収集`,
      `主要AIプロダクトの<span class="answer">週次アップデート</span>`,
      `OpenAI / Anthropic / Google / Microsoft / Perplexity / 国内AI 等の直近アップデートを自動収集。`)
    + `<div class="toolbar"><div class="chip-group" id="aiFilter"><span class="chip active" data-ai="">すべて</span>${ais.map(a=>`<span class="chip" data-ai="${esc(a)}">${esc(a)}</span>`).join("")}</div><input class="search" id="newsSearch" placeholder="キーワード検索"><span class="small" id="newsCount"></span></div>`
    + `<div class="topics-list" id="topicsList"></div>`;
  function draw(){
    const q=$("newsSearch").value.trim(); const af=s.querySelector("#aiFilter .chip.active").dataset.ai;
    const list=entries.filter(e=>(!af||e.ai===af)&&(!q||(JSON.stringify(e).includes(q))));
    $("topicsList").innerHTML=list.map(e=>`<div class="topic-card"><div class="tc-head"><span class="tc-date">${esc(e.date||"")}</span>${e.ai?`<span class="tc-ai">${esc(e.ai)}</span>`:""}<span class="tc-tags">${(e.topic_tags||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</span></div><h4>${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title||"")}</a>`:esc(e.title||"")}</h4><p>${esc(e.summary||"")}</p>${e.reactions&&e.reactions.summary?`<p class="small">💬 ${esc(e.reactions.summary)}</p>`:""}</div>`).join("");
    $("newsCount").textContent=list.length+" 件";
  }
  s.querySelectorAll("#aiFilter .chip").forEach(c=>c.addEventListener("click",()=>{s.querySelectorAll("#aiFilter .chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");draw();}));
  $("newsSearch").addEventListener("input",draw); draw();
}

/* ④ -2 campaigns template (blank) */
function renderCampaigns(s){
  s.innerHTML = hero(`④ IDEAナレッジ｜<b>実施施策 / 施策結果</b>`,
      `実施施策の<span class="answer">記録テンプレート</span>`,
      `実施したPR・調査施策と、その結果（言及率・サイテーション・流入・CVへの影響）を記録する型。`)
    + `<div class="banner">この型は施策実施後に記入します（現在はブランク）。1施策＝1行で追加してください。</div>`
    + `<div class="card"><h3>施策一覧</h3><div class="table-wrap"><table class="tmpl-table"><thead><tr><th>実施月</th><th>施策名 / 種別</th><th>狙い・対象プロンプト</th><th>アウトプット（リリース等）</th><th>結果（言及率・SS・CV変化）</th><th>所感・次アクション</th></tr></thead><tbody>
        <tr class="tmpl-row"><td>例) 2026-07</td><td>調査リリース配信</td><td>「LLMO 選び方」非指名枠</td><td>PRTIMES / 業界紙</td><td>言及率 +x pt / AI流入 +x</td><td>—</td></tr>
        <tr class="tmpl-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
        <tr class="tmpl-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
      </tbody></table></div><div class="note">WingArc ダッシュボードの「実態調査」施策枠と同型。施策→結果→学びをここに蓄積します。</div></div>`;
}
/* ④ -3 consulting knowledge template (blank) */
function renderConsulting(s){
  s.innerHTML = hero(`④ IDEAナレッジ｜<b>IDEAコンサルティング</b>`,
      `定例ナレッジの<span class="answer">集約テンプレート</span>`,
      `月次定例で得られた示唆・意思決定・ネクストアクションを集約する型。`)
    + `<div class="banner">この型は定例実施後に記入します（現在はブランク）。</div>`
    + `<div class="card"><h3>定例ナレッジ集約</h3><div class="table-wrap"><table class="tmpl-table"><thead><tr><th>定例日</th><th>テーマ</th><th>気づき・示唆</th><th>意思決定</th><th>ネクストアクション</th><th>担当 / 期限</th></tr></thead><tbody>
        <tr class="tmpl-row"><td>例) 2026-07-xx</td><td>非指名枠の攻め方</td><td>ツール型が先行、PR起点の文脈が空白</td><td>選定基準リリースを起案</td><td>調査企画ドラフト</td><td>—</td></tr>
        <tr class="tmpl-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
        <tr class="tmpl-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>
      </tbody></table></div><div class="note">WingArc ダッシュボードの「定例ナレッジ集約」と同型。</div></div>`;
}

/* ★ blanks */
function blankState(s,title,desc){
  s.innerHTML = hero(`★ サマリ｜<b>${title}</b>`,`<span class="answer">${title}</span>`,desc)
    + `<div class="blank-state"><div class="bs-icon">📝</div><h3>現在ブランクです</h3><div>${desc}<br>月次更新時にこのセクションへ記入します。</div></div>`;
}

const RENDER = {
  diff:s=>blankState(s,"n月実績差分","前月（前回計測）との差分サマリ（言及率の増減・新規サイテーション・流入/CVの変化）。"),
  insights:s=>blankState(s,"n月実績所感","当月の所感・ハイライト・次月への打ち手。"),
  ss:renderSS, cv:renderCV, branded:renderBranded, nbmatrix:renderNbMatrix,
  nbdetail:renderNbDetail, citation:renderCitation, strengths:renderStrengths,
  pA:s=>renderPersona(s,"A"), pB:s=>renderPersona(s,"B"), pC:s=>renderPersona(s,"C"),
  news:renderNews, campaigns:renderCampaigns, consulting:renderConsulting
};

/* ---- boot ---- */
const drawn={};
function show(id){
  document.querySelectorAll(".section").forEach(x=>x.classList.toggle("active",x.id===id));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.section===id));
  const key=id.replace("sec-","");
  if(!drawn[key] && RENDER[key]){ try{RENDER[key](document.getElementById(id));}catch(e){document.getElementById(id).innerHTML='<div class="banner">描画エラー: '+esc(e.message)+'</div>';console.error(e);} drawn[key]=1; }
  window.scrollTo(0,0); try{history.replaceState(null,"","#"+id);}catch(e){location.hash=id;}
  $("sidebar").classList.remove("open");
}
$("asOf").textContent = "データ基準: "+DATA.meta.as_of+"（BrandRadar "+DATA.meta.survey_date+"）";
$("hdrNote").textContent = "自動更新: 週次 / "+DATA.meta.generated_at.slice(0,10);
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>show(b.dataset.section)));
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
const initHash=location.hash.slice(1);
show(document.getElementById(initHash)?initHash:"sec-diff");
})();
