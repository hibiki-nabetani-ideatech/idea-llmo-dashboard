/* IDEA LLMO dashboard — client-side rendering over const DATA
   Sections faithfully mirror: IDEATECH(①SS/①CV/④news), MACP(②matrix/②detail/③persona), WingArc(②-4 citation). */
(function(){
"use strict";
const M=DATA.meta, LLMS=M.llms, LL=M.llm_labels, COMP=M.competitors, COMPL=M.competitor_labels;
const $=id=>document.getElementById(id);
const esc=s=>(s==null?"":String(s)).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const MONO=d=>(d==null?"—":d);
const fmtMonth=ym=>{if(!ym)return"";const[y,m]=ym.split("-");return y.slice(2)+"/"+(+m);};

/* ---------- markdown-lite + brand highlight ---------- */
const SELF_RE=/(IDEA\s?LLMO|IDEATECH|アイデアテック|リサピー)/g;
const COMP_RE=[/ナイル株式会社|ナイル|SEO\s?HACKS/g,/株式会社Faber\s?Company|ミエルカ|Faber/g,/株式会社CINC|CINC/g,/株式会社イノーバ|イノーバ|innova/gi,/Queue株式会社|umoren|Queue/gi];
function mdLite(t){
  if(!t)return"";let h=esc(t);
  h=h.replace(/^######?\s?(.*)$/gm,"<h3>$1</h3>").replace(/^##\s?(.*)$/gm,"<h2>$1</h2>").replace(/^#\s?(.*)$/gm,"<h2>$1</h2>")
     .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/^\s*[-*]\s+(.*)$/gm,"<li>$1</li>");
  h=h.replace(/(<li>[\s\S]*?<\/li>)/g,m=>"<ul>"+m+"</ul>").replace(/<\/ul>\s*<ul>/g,"");
  h=h.replace(SELF_RE,'<mark class="hl-brand">$1</mark>');
  COMP_RE.forEach(re=>{h=h.replace(re,m=>'<mark class="hl-competitor">'+m+'</mark>');});
  h=h.replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>");
  return"<p>"+h+"</p>";
}
function citeList(links){
  if(!links||!links.length)return"";
  return `<div class="small" style="margin-top:8px;font-weight:600">引用元 (${links.length})</div><ul class="cite-list">`
    +links.slice(0,15).map(l=>`<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title||l.url)}</a></li>`).join("")+`</ul>`;
}
function hero(crumb,h2,lead){return `<div class="sec-hero"><div class="crumb">${crumb}</div><h2>${h2}</h2>${lead?`<p class="lead">${lead}</p>`:""}</div>`;}
function summary(html){return `<div class="tab-summary"><span class="ts-label">所見</span>${html}</div>`;}
function kpiBox(label,value,unit,delta,primary){return `<div class="kpi ${primary?'primary':''}"><div class="label">${label}</div><div class="value">${value}${unit?`<span class="unit">${unit}</span>`:""}</div>${delta?`<div class="delta">${delta}</div>`:""}</div>`;}
function matrixLegend(){return `<div class="matrix-legend"><span class="li"><span class="legend-mark r2">⚫︎</span>言及あり</span><span class="li"><span class="legend-mark r0">▲</span>言及なし</span><span class="li" style="margin-left:auto">※ 左 No・分類・プロンプトの3列は固定。横スクロールで全ブランド×全LLMを確認</span></div>`;}

/* ---------- prompt detail card (MACP style) ---------- */
function detailCard(prefix,r){
  const blocks=LLMS.map(l=>{
    const d=r.by_llm[l];
    if(!d||d.self==null) return `<details class="llm-d"><summary><span class="llm-tag off">${LL[l]}</span>データなし</summary><div class="detail-empty">このLLMの応答データがありません。</div></details>`;
    return `<details class="llm-d"><summary><span class="llm-tag ${l}">${LL[l]}</span>${d.self?'言及あり':'言及なし'} ・ 応答全文を見る</summary><div class="detail-body">${mdLite(d.response)}${citeList(d.links)}</div></details>`;
  }).join("");
  return `<div class="prompt-card" id="det-${prefix}-${r.no}"><div class="prompt-header"><div class="no-badge">${r.no}</div><div style="flex:1;min-width:0"><div class="prompt-text">${esc(r.prompt)}</div><div class="p-meta">${esc(r.category||"")}${r.volume?` ・ 検索Vol ${r.volume}`:""}</div></div></div>${blocks}</div>`;
}

/* ========== ①-1 セッション (IDEATECH型) ========== */
function renderSS(s){
  const ss=DATA.ss,mo=DATA.ss_meta.months,last=mo.length-1;
  const tot=ss.site_total,ai=ss.ai_total,org=ss.organic;
  const ratio=mo.map((_,i)=>tot[i]?+(ai[i]/tot[i]*100).toFixed(1):0);
  const src=(DATA.ss_meta.sources_latest||{})[mo[last]]||{};
  s.innerHTML=hero(`① 結果指標モニタリング｜シート：<b>${mo[0]}以降</b>｜<b>流入指標 (SS)</b>`,
    `直近月(${mo[last]})のサイト流入は <span class="answer">${tot[last]}件</span><span class="sub-h">— うちAI経由 ${ai[last]}件 / AI経由比率 ${ratio[last]}%</span>`,
    `「IDEATECH LLMO ダッシュボード」②流入指標(SS)と同型。IDEA LLMO関連ページ群のセッションを月次で計測し、AI経由(対話型AI参照)流入を可視化。`)
   +summary(`サービスは <b>2026/6/12にプレスリリース配信</b>。立ち上げ初期で5月 <span class="hl-num">${tot[2]}</span> 件（うちAI経由=ChatGPT <span class="hl-num">${ai[2]}</span>）。パブリシティ積み上げに伴うAI経由流入の増加を継続モニタリングする。`)
   +`<div class="kpis">${kpiBox("直近月セッション",tot[last],"件","",1)+kpiBox("AI経由セッション",ai[last],"件")+kpiBox("AI経由比率",ratio[last],"%")+kpiBox("オーガニック",org[last],"件")}</div>`
   +`<div class="card"><h3>サイト全体流入数の月次推移</h3><div class="h3-sub">IDEA LLMO関連ページ群（service / download / contact / thanks）</div>
       <div class="legend-row"><span><span class="legend-dot" style="background:#0017c1"></span>サイト全体</span><span><span class="legend-dot" style="background:#7986cb"></span>オーガニック</span><span><span class="legend-dot" style="background:#10a37f"></span>AI経由</span><span><span class="legend-dot" style="background:#b86a00"></span>AI経由比率(右軸)</span></div>
       <div class="chart-wrap"><canvas id="ssChart"></canvas></div></div>`
   +`<div class="card"><h3>AI経由流入数の月次推移</h3><div class="h3-sub">対話型AI（chatgpt.com 等）からの参照セッション</div><div class="chart-wrap sm"><canvas id="ssAiChart"></canvas></div></div>`
   +`<div class="card"><h3>SS サマリ系列</h3><div class="table-wrap"><table><thead><tr><th>区分</th>${mo.map(m=>`<th class="num">${m}</th>`).join("")}<th class="num">合計</th></tr></thead><tbody>
       ${[["サイト全体",tot],["オーガニック",org],["AI経由",ai],["参照(その他)",ss.referral_other],["ダイレクト",ss.direct]].map(([n,a])=>`<tr><td>${n}</td>${a.map(v=>`<td class="num">${v}</td>`).join("")}<td class="num">${a.reduce((x,y)=>x+y,0)}</td></tr>`).join("")}
     </tbody></table></div></div>`
   +`<div class="card"><h3>AI経由流入：参照元別（直近月）</h3><div class="table-wrap"><table><thead><tr><th>参照元</th><th class="num">セッション</th></tr></thead><tbody>${
       Object.entries(src).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join("")||'<tr><td colspan="2" class="small">データなし</td></tr>'
     }</tbody></table></div><div class="note">${esc(DATA.ss_meta.note)}</div></div>`;
  new Chart($("ssChart"),{data:{labels:mo.map(fmtMonth),datasets:[
    {type:"line",label:"サイト全体",data:tot,borderColor:"#0017c1",backgroundColor:"#0017c1",yAxisID:"y",tension:.25},
    {type:"line",label:"オーガニック",data:org,borderColor:"#7986cb",backgroundColor:"#7986cb",borderDash:[5,4],yAxisID:"y",tension:.25},
    {type:"line",label:"AI経由",data:ai,borderColor:"#10a37f",backgroundColor:"#10a37f",yAxisID:"y",tension:.25},
    {type:"line",label:"AI経由比率",data:ratio,borderColor:"#b86a00",backgroundColor:"#b86a00",borderDash:[2,3],yAxisID:"y1",tension:.25}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:"#ededed"}},y1:{position:"right",beginAtZero:true,grid:{display:false},ticks:{callback:v=>v+"%"}},x:{grid:{display:false}}}}});
  new Chart($("ssAiChart"),{type:"line",data:{labels:mo.map(fmtMonth),datasets:[{label:"AI経由",data:ai,borderColor:"#10a37f",backgroundColor:"rgba(16,163,127,.12)",fill:true,tension:.25}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:"#ededed"},ticks:{precision:0}},x:{grid:{display:false}}}}});
}

/* ========== ①-2 コンバージョン (IDEATECH型) ========== */
function renderCV(s){
  const cv=DATA.cv,mo=DATA.cv_meta.months,last=mo.length-1;
  const sh=cv.shiryo,to=cv.toiawase;
  const shA=mo.map(m=>sh.monthly[m]||0),toA=mo.map(m=>to.monthly[m]||0),tot=mo.map((_,i)=>shA[i]+toA[i]);
  s.innerHTML=hero(`① 結果指標モニタリング｜シート：<b>${mo[0]}以降</b>｜<b>コンバージョン (CV)</b>`,
    `累計CVは <span class="answer">${sh.total+to.total}件</span><span class="sub-h">— 資料DL ${sh.total} / お問い合わせ ${to.total}（データ元：HubSpot）</span>`,
    `「IDEATECH LLMO ダッシュボード」②流入指標(CV)と同型。HubSpotのフォーム送信（サービス資料｜IDEA LLMO・お問い合わせ｜IDEA LLMO）を月次計測。`)
   +summary(`PR配信後の6月に資料DL <span class="hl-num">${sh.monthly['2026-06']||0}</span> 件・初の「お問い合わせ」 <span class="hl-num">${to.monthly['2026-06']||0}</span> 件が発生。AI経由セッションからのCV転換を今後追跡する。`)
   +`<div class="kpis">${kpiBox("CV合計（累計）",sh.total+to.total,"件","",1)+kpiBox("資料DL（累計）",sh.total,"件")+kpiBox("お問い合わせ（累計）",to.total,"件")+kpiBox("直近月CV",tot[last],"件")}</div>`
   +`<div class="card"><h3>サイト全体CVの月次推移</h3><div class="h3-sub">データ元：HubSpot（フォーム送信数）</div>
       <div class="legend-row"><span><span class="legend-dot" style="background:#0017c1"></span>サービス資料</span><span><span class="legend-dot" style="background:#3949ab"></span>お問い合わせ</span></div>
       <div class="chart-wrap sm"><canvas id="cvChart"></canvas></div></div>`
   +`<div class="card"><h3>CV サマリ系列（フォーム別）</h3><div class="table-wrap"><table><thead><tr><th>フォーム</th>${mo.map(m=>`<th class="num">${m}</th>`).join("")}<th class="num">累計</th></tr></thead><tbody>
       <tr><td>サービス資料｜IDEA LLMO</td>${shA.map(v=>`<td class="num">${v}</td>`).join("")}<td class="num">${sh.total}</td></tr>
       <tr><td>お問い合わせ｜IDEA LLMO</td>${toA.map(v=>`<td class="num">${v}</td>`).join("")}<td class="num">${to.total}</td></tr>
       <tr><td><b>合計</b></td>${tot.map(v=>`<td class="num"><b>${v}</b></td>`).join("")}<td class="num"><b>${sh.total+to.total}</b></td></tr>
     </tbody></table></div><div class="note">${esc(DATA.cv_meta.note)}</div></div>`;
  new Chart($("cvChart"),{type:"bar",data:{labels:mo.map(fmtMonth),datasets:[
    {label:"資料",data:shA,backgroundColor:"#0017c1"},{label:"問い合わせ",data:toA,backgroundColor:"#3949ab"}
  ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,grid:{color:"#ededed"},ticks:{precision:0}}}}});
}

/* ========== ②-1 指名プロンプト言及状況 (WingArc型) ========== */
function renderBranded(s){
  const rows=DATA.branded;
  const rate=l=>{let h=0,t=0;rows.forEach(r=>{const d=r.by_llm[l];if(d.self==null)return;t++;if(d.self)h++;});return t?Math.round(h/t*100):0;};
  let body=rows.map((r,i)=>`<tr class="${i===0?'cat-block-start':''}"><td class="col-no">${r.no}</td><td class="col-cat">${esc(r.category)}</td>`
     +`<td class="col-prompt"><a class="prompt-link" data-jump="branded" data-no="${r.no}"><span class="p-text">${esc(r.prompt)}</span></a></td>`
     +LLMS.map((l,j)=>mark(r.by_llm[l].self,j===0)).join("")+`</tr>`).join("");
  let foot=`<tr><td class="col-no"></td><td class="col-cat"></td><td class="col-prompt">言及あり / ${rows.length}</td>`
     +LLMS.map((l,j)=>`<td class="cell-mark${j===0?' col-divider':''}">${rows.filter(r=>r.by_llm[l].self).length}</td>`).join("")+`</tr>`;
  s.innerHTML=hero(`② 推奨状況・サイテーション｜シート：<b>指名プロンプト</b>`,
    `指名プロンプトの言及状況<span class="sub-h">— 4LLM平均 言及率 ${Math.round(LLMS.reduce((a,l)=>a+rate(l),0)/LLMS.length)}%</span>`,
    `「WingArc LLMO ダッシュボード」③指名プロンプト言及状況と同型。自社名・サービス名を含む指名プロンプトでの各LLMの言及状況。`)
   +summary(`指名プロンプトでは各LLMとも概ね IDEA LLMO/IDEATECH を正しく認知（${LLMS.map(l=>LL[l]+' '+rate(l)+'%').join(' / ')}）。今後は料金・手法・リサピー連携などの説明が適切な文脈で語られているかをチューニングする。`)
   +`<div class="kpis">${LLMS.map((l,i)=>kpiBox(LL[l]+" 言及率",rate(l),"%","",i===0)).join("")}</div>`
   +`<div class="card"><h3>指名プロンプト言及状況 一覧</h3><div class="h3-sub">⚫︎=言及あり / ▲=言及なし</div>${matrixLegend()}
       <div class="matrix-wrap"><table><thead><tr><th class="col-no">No</th><th class="col-cat">分類</th><th class="col-prompt">プロンプト</th>${LLMS.map((l,i)=>`<th class="cell-mark${i===0?' col-divider':''}">${LL[l]}</th>`).join("")}</tr></thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div></div>`
   +`<div class="card"><h3>プロンプト言及状況 詳細（応答全文）</h3><div class="h3-sub">自社=黄 / 競合=紫 ハイライト</div>${rows.map(r=>detailCard("branded",r)).join("")}</div>`;
}
function mark(state,divider){const dc=divider?" col-divider":"";if(state===true)return`<td class="cell-mark r2${dc}">⚫︎</td>`;if(state===false)return`<td class="cell-mark r0${dc}">▲</td>`;return`<td class="cell-mark na${dc}">—</td>`;}

/* ========== ②-2 非指名プロンプト 一覧 (MACP型 grouped matrix) ========== */
function renderNbMatrix(s){
  const rows=DATA.nonbranded;
  const brands=[{k:"self",label:"IDEA LLMO",grp:"idea"}].concat(COMP.map(c=>({k:c,label:COMPL[c],grp:"comp"})));
  const brate=b=>{let h=0,t=0;rows.forEach(r=>{LLMS.forEach(l=>{const d=r.by_llm[l];if(d.self==null)return;t++;const v=b.k==="self"?d.self:d.competitors[b.k];if(v)h++;});});return t?Math.round(h/t*100):0;};
  let head1=`<tr class="h-group"><th class="col-no" rowspan="2">No</th><th class="col-cat" rowspan="2">分類</th><th class="col-prompt" rowspan="2">プロンプト</th>`
    +brands.map(b=>`<th colspan="${LLMS.length}" class="${b.grp==='idea'?'idea-grp':'comp-grp'} col-divider">${esc(b.label)}</th>`).join("")+`</tr>`;
  let head2=`<tr>`+brands.map(b=>LLMS.map((l,i)=>`<th class="cell-mark${i===0?' col-divider':''}">${LL[l]}</th>`).join("")).join("")+`</tr>`;
  let cats=[],body="";
  rows.forEach(r=>{const isNew=cats.indexOf(r.category)<0;if(isNew)cats.push(r.category);
    body+=`<tr class="${isNew?'cat-block-start':''}"><td class="col-no">${r.no}</td><td class="col-cat">${esc(r.category)}</td>`
      +`<td class="col-prompt"><a class="prompt-link" data-jump="nbdetail" data-no="${r.no}"><span class="p-text">${esc(r.prompt)}</span></a></td>`;
    brands.forEach(b=>{LLMS.forEach((l,i)=>{const d=r.by_llm[l];let st=d.self==null?null:(b.k==="self"?d.self:d.competitors[b.k]);body+=mark(st,i===0);});});
    body+=`</tr>`;});
  let foot=`<tr><td class="col-no"></td><td class="col-cat"></td><td class="col-prompt">言及あり / ${rows.length}</td>`
    +brands.map(b=>LLMS.map((l,i)=>{const n=rows.filter(r=>{const d=r.by_llm[l];return d.self!=null&&(b.k==="self"?d.self:d.competitors[b.k]);}).length;return`<td class="cell-mark${i===0?' col-divider':''}">${n}</td>`;}).join("")).join("")+`</tr>`;
  s.innerHTML=hero(`② 推奨状況・サイテーション｜シート：<b>非指名プロンプト</b>`,
    `非指名 ${rows.length}プロンプトの推奨状況<span class="sub-h">— IDEA LLMO 言及率 ${brate(brands[0])}%（4LLM平均）</span>`,
    `「M&Aキャピタルパートナーズ LLMO」推奨状況 一覧と同型。自社名を含まない非指名（カテゴリ）プロンプトで、自社・競合の推奨状況を一覧化。プロンプトをクリックすると詳細へジャンプ。`)
   +summary(`非指名でのIDEA LLMO言及率は <span class="hl-num">${brate(brands[0])}%</span>。競合は ${brands.slice(1).map(b=>`${b.label} ${brate(b)}%`).join(' / ')}。ツール型GEOが先行しており、調査PR起点の選定基準をルールメイクしていく余地が大きい。`)
   +`<div class="kpis">${brands.map((b,i)=>kpiBox(b.label+" 言及率",brate(b),"%","",i===0)).join("")}</div>`
   +`<div class="card"><h3>推奨状況 一覧（非指名 ${rows.length}プロンプト × ${brands.length}ブランド × ${LLMS.length}LLM）</h3><div class="h3-sub">⚫︎=言及あり / ▲=言及なし。プロンプトをクリックで「②-3 詳細」へ</div>${matrixLegend()}
       <div class="matrix-wrap"><table><thead>${head1}${head2}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div></div>`;
}

/* ========== ②-3 非指名プロンプト 詳細 (MACP型) ========== */
function renderNbDetail(s){
  const rows=DATA.nonbranded,cats=[...new Set(rows.map(r=>r.category))];
  const blocks=cats.map((cat,i)=>{const rs=rows.filter(r=>r.category===cat);
    return `<div class="subcat-block b${(i%3)+1}"><div class="subcat-head"><span class="b-num">${i+1}</span><h4>${esc(cat)}</h4><span class="b-count">${rs.length} プロンプト</span></div>${rs.map(r=>detailCard("nbdetail",r)).join("")}</div>`;}).join("");
  s.innerHTML=hero(`② 推奨状況・サイテーション｜シート：<b>非指名プロンプト 詳細</b>`,
    `非指名プロンプトの<span class="answer">応答全文</span><span class="sub-h">— 分類別 / 4LLM</span>`,
    `「M&Aキャピタルパートナーズ LLMO」②-2 推奨状況詳細と同型。各プロンプトに対する4LLMの応答全文。自社=黄・競合=紫でハイライト。`)
   +`<div class="overview-box"><h3>応答全文の見方</h3><div class="overall-summary-text">分類ごとに、各プロンプトに対する <b>ChatGPT / Gemini / Copilot / Perplexity</b> の応答全文を確認できます。応答テキスト内の <mark class="hl-brand">自社名</mark>・<mark class="hl-competitor">競合名</mark> はハイライト表示。引用元リンクも各応答内に表示しています。</div></div>`
   +`<div class="toolbar"><input class="search" id="nbSearch" placeholder="プロンプト／分類で検索"><span class="small" id="nbCount"></span></div>`+blocks;
  const inp=$("nbSearch");inp.addEventListener("input",()=>{const q=inp.value.trim();s.querySelectorAll(".prompt-card").forEach(c=>{c.style.display=(!q||c.textContent.includes(q))?"":"none";});});
}

/* ========== ②-4 サイテーション (WingArc型) ========== */
function renderCitation(s){
  const c=DATA.citations,pages=c.pages||[],sm=c.summary||{};
  const drClass=dr=>dr==null?"":(dr>=90?"dr-top":dr>=70?"dr-high":dr>=50?"dr-mid":dr>0?"dr-low":"dr-zero");
  const rowClass=dr=>dr==null?"":(dr>=90?"dr-row-top":dr>=70?"dr-row-high":"");
  let page=0,per=100,filt="all",q="";
  s.innerHTML=hero(`② 推奨状況・サイテーション｜シート：<b>IDEA LLMO サイテーション</b>`,
    `総被引用 <span class="answer">${sm.total_citations||0}回</span><span class="sub-h">— 引用元 ${sm.total_pages}ページ / ${sm.total_domains}ドメイン・高DR(70+) ${sm.high_dr}・自社 ${sm.self_pages}</span>`,
    `「WingArc LLMO ダッシュボード」MotionBoard サイテーションと同型。LLMOモニタリングのAI応答が参照した引用元ページをDR付きで一覧化。`)
   +summary(`AI応答の引用元は ${sm.total_domains} ドメイン・${sm.total_pages} ページ。高DR(70+)が <span class="hl-num">${sm.high_dr}</span> ページを占め、prtimes.jp・note.com 等の高権威メディアが中心。自社(ideatech.jp)関連の被引用は <span class="hl-num">${sm.self_pages}</span> ページで、PRTIMES等でのサイテーション拡大が被引用機会の増加に直結する。`)
   +`<div class="kpis">${kpiBox("総被引用回数",sm.total_citations||0,"回","",1)+kpiBox("引用元ページ",sm.total_pages,"件")+kpiBox("高DR(70+)",sm.high_dr,"件")+kpiBox("自社関連の被引用",sm.self_pages,"ページ")}</div>`
   +`<div class="card"><h3>引用元ページ一覧</h3><div class="h3-sub">AI応答が参照したページ（被引用回数順）。DRはAhrefs Domain Rating（上位ドメインのみ取得）</div>
      <div class="toolbar"><div class="dr-tabs" id="drTabs"><button class="active" data-f="all">すべて</button><button data-f="high">高DR(70+)</button><button data-f="with">DRあり</button><button data-f="self">自社関連</button></div>
        <input class="search" id="citSearch" placeholder="ドメイン／URLで検索"><span class="small" id="citCount"></span></div>
      <div class="table-wrap"><table><thead><tr><th class="num">#</th><th>引用元ドメイン</th><th>URL</th><th class="num">被引用</th><th class="num">DR</th></tr></thead><tbody id="citBody"></tbody></table></div>
      <div class="pager" id="citPager"></div><div class="note">${esc(c.note||"")}<br>※ ページのタイトル・公開日はBrandRadar引用元データに含まれないため非表示。DRはAhrefsの無料Domain Ratingで上位ドメインを取得。</div></div>`;
  function filtered(){
    return pages.filter(p=>{
      if(filt==="high"&&!((p.dr||0)>=70))return false;
      if(filt==="with"&&p.dr==null)return false;
      if(filt==="self"&&!((p.domain||"").includes("ideatech")))return false;
      if(q&&!((p.domain||"")+" "+(p.url||"")).toLowerCase().includes(q.toLowerCase()))return false;
      return true;});
  }
  function draw(){
    const list=filtered(),pages_n=Math.max(1,Math.ceil(list.length/per));
    if(page>=pages_n)page=0;
    const slice=list.slice(page*per,page*per+per);
    $("citBody").innerHTML=slice.map((p,i)=>`<tr class="${rowClass(p.dr)}"><td class="num">${page*per+i+1}</td><td>${esc(p.domain||"")}</td><td><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc((p.url||"").replace(/^https?:\/\//,"").slice(0,70))}</a></td><td class="num">${p.count}</td><td class="num"><span class="dr-pill ${drClass(p.dr)}">${p.dr==null?"—":p.dr}</span></td></tr>`).join("");
    $("citCount").textContent=list.length+" 件";
    $("citPager").innerHTML=`<button ${page<=0?"disabled":""} id="prevP">‹ 前</button><span>${page+1} / ${pages_n}</span><button ${page>=pages_n-1?"disabled":""} id="nextP">次 ›</button>`;
    $("prevP").onclick=()=>{if(page>0){page--;draw();}};$("nextP").onclick=()=>{if(page<pages_n-1){page++;draw();}};
  }
  s.querySelectorAll("#drTabs button").forEach(b=>b.addEventListener("click",()=>{s.querySelectorAll("#drTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");filt=b.dataset.f;page=0;draw();}));
  $("citSearch").addEventListener("input",e=>{q=e.target.value;page=0;draw();});
  draw();
}

/* ========== ③-0 強みの言語化 ========== */
function renderStrengths(s){
  const st=DATA.strengths;
  s.innerHTML=hero(`③ IDEAルールメイク｜<b>強みの言語化</b>`,`IDEA LLMOの強みと<span class="answer">競合優位性</span>`,
    `サービスサイト・プレスリリースをもとに、IDEA LLMOのLLMOサービスとしての強み・競合優位性を構造化。`)
   +`<div class="pos-box">${esc(st.positioning)}</div>`
   +`<div class="kpis">${st.kpis.map((k,i)=>kpiBox(k.label,k.value,"","",i===0)).join("")}</div>`
   +`<div class="card"><h3>3つのコア・コンピタンス</h3><div class="comp-grid">${st.competences.map(c=>`<div class="comp-card"><div class="cc-no">COMPETENCE ${c.no}</div><h4>${esc(c.title)}</h4><p>${esc(c.desc)}</p></div>`).join("")}</div></div>`
   +`<div class="card"><h3>競合優位性（6つの差別化要因）</h3><div class="adv-grid">${st.advantages.map(a=>`<div class="adv-card"><div class="t">${esc(a.t)}</div><div class="d">${esc(a.d)}</div></div>`).join("")}</div></div>`
   +`<div class="card"><h3>SEO会社 vs PR会社（IDEATECH）</h3><div class="table-wrap"><table><thead><tr>${st.vs_table.head.map((h,i)=>`<th class="${i?'num':''}">${esc(h)}</th>`).join("")}</tr></thead><tbody>${st.vs_table.rows.map(r=>`<tr><td>${esc(r[0])}</td><td class="num">${esc(r[1])}</td><td class="num">${esc(r[2])}</td></tr>`).join("")}</tbody></table></div></div>`
   +`<div class="card"><h3>市場のファクト（なぜ今LLMO×PRか）</h3><div class="ev-grid">${st.evidence.map(e=>`<div class="ev-card"><div class="v">${esc(e.v)}</div><div class="d">${esc(e.d)}</div></div>`).join("")}</div></div>`
   +summary(esc(st.diff_summary));
}

/* ========== ③ ペルソナ (MACP型) ========== */
function renderPersona(s,pk){
  const p=DATA.personas[pk],m=p.meta,cr=p.criteria,q=p.quadrant,num={A:"③-1",B:"③-2",C:"③-3"}[pk];
  const axes=["失敗軸","選定軸","おすすめ軸"];
  const detailBlocks=axes.map((ax,i)=>{const rs=p.rows.filter(r=>r.axis===ax);if(!rs.length)return"";
    return `<div class="subcat-block b${i+1}"><div class="subcat-head"><span class="b-num">${ax}</span><h4>${ax==='失敗軸'?'失敗パターン':ax==='選定軸'?'選定基準':'おすすめ'}</h4><span class="b-count">${rs.length} プロンプト</span></div>${rs.map(r=>detailCard("p"+pk,r)).join("")}</div>`;}).join("");
  const comps=p.companies.length?`<div class="small" style="margin:0 0 10px"><b>このペルソナでよく言及された企業（4LLM）:</b> ${p.companies.slice(0,8).map(c=>esc(c.name)+`(${c.count})`).join(" / ")}</div>`:"";
  const critCard=(cls,head,meta,items)=>`<div class="ai-crit-card ${cls}"><div class="crit-head">${head}</div><div class="crit-meta">${meta}</div><ul>${items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>`;
  const quad=(cls,title,hint,items)=>`<div class="quad ${cls}"><h4>${title}</h4><p class="qhint">${hint}</p><ul>${items.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></div>`;
  s.innerHTML=hero(`③ IDEAルールメイク｜<b>ペルソナ${pk}</b>｜${num}`,`${esc(m.short)}`,`${esc(p.title)}`)
   +`<div class="persona-image-box"><div class="pi-content"><div class="pi-icon">${pk==='A'?'🧑‍💼':pk==='B'?'👩‍💼':'🧑‍💻'}</div><div style="flex:1"><div class="tags" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${m.tags.map(t=>`<span style="background:var(--blue-soft);color:var(--blue);font-size:10.5px;padding:2px 8px;border-radius:3px">${esc(t)}</span>`).join("")}</div><div class="pdesc small" style="font-size:12.5px;line-height:1.8;color:var(--ink2)">${esc(m.desc)}</div></div></div></div>`
   +`<div class="card"><h3>LLMの推薦基準と推薦企業</h3><div class="h3-sub">このペルソナのプロンプト群（失敗軸／選定軸／おすすめ軸）に対する4LLMの応答全文</div>${comps}</div>`
   +detailBlocks
   +`<div class="card"><h3>AI認知サマリ — 推薦基準</h3><div class="h3-sub">各LLMが推薦時に重視する基準を、業界共通／IDEAの強み／IDEAの空白で整理</div>
      <div class="ai-criteria-grid">${critCard("both","業界共通の選定基準","AIが繰り返し挙げる軸",cr.common)+critCard("idea","IDEA LLMOが強い基準","発信を強化すべき",cr.idea)+critCard("gap","IDEAの空白（競合が押さえる）","追従・差別化が必要",cr.gap)}</div></div>`
   +`<div class="card"><h3>AI認知マッピング — 4象限</h3><div class="h3-sub">縦軸：IDEA LLMOの強み（上=強）／横軸：AI認知の強弱（左=弱・右=強）。<b>左上＝AI認知が弱くIDEAが強い「ルールメイク本命」領域</b></div>
      <div class="ai-mapping">${quad("q-tl rule-make","AI認知 弱 × IDEA 強","発信・コンテンツ化でAIに取り込ませ、自社主導でルールメイクできる本命領域",q.tl)+quad("q-tr","AI認知 強 × IDEA 強","既に定着しつつある強み。維持・反復露出で強化",q.tr)+quad("q-bl","AI認知 弱 × IDEA 弱","優先度低。競合も弱いが投資リターンも小さい",q.bl)+quad("q-br","AI認知 強 × IDEA 弱","競合が認知を獲得済み。追従・差別化が必要",q.br)}</div></div>`;
}

/* ========== ④-1 主要AIニュース (IDEATECH型) ========== */
function renderNews(s){
  const t=DATA.ai_topics||{},entries=(t.entries||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const ais=[...new Set(entries.map(e=>e.ai).filter(Boolean))];
  const years=[...new Set(entries.map(e=>(e.date||"").slice(0,4)).filter(Boolean))].sort().reverse();
  const tags=[...new Set(entries.flatMap(e=>e.topic_tags||[]))].slice(0,14);
  s.innerHTML=hero(`④ IDEAナレッジ｜<b>主要AIニュース</b>｜自動収集`,`主要AIプロダクトの<span class="answer">週次アップデート</span>`,
    `「IDEATECH LLMO ダッシュボード」主要AIプロダクトの週次アップデートと同内容。OpenAI / Anthropic / Google / Microsoft / Perplexity / 国内AI 等の直近アップデートを自動収集し、世間の反応を要約。`)
   +`<div class="toolbar"><div class="chip-group" id="fYear"><span class="chip active" data-v="">全期間</span>${years.map(y=>`<span class="chip" data-v="${y}">${y}</span>`).join("")}</div></div>`
   +`<div class="toolbar"><div class="chip-group" id="fAi"><span class="chip active" data-v="">全AI</span>${ais.map(a=>`<span class="chip" data-v="${esc(a)}">${esc(a)}</span>`).join("")}</div></div>`
   +`<div class="toolbar"><div class="chip-group" id="fTag"><span class="chip active" data-v="">全タグ</span>${tags.map(x=>`<span class="chip" data-v="${esc(x)}">${esc(x)}</span>`).join("")}</div><input class="search" id="nSearch" placeholder="キーワード検索"><span class="small" id="nCount"></span></div>`
   +`<div class="topics-list" id="tList"></div>`;
  const gv=id=>s.querySelector("#"+id+" .chip.active").dataset.v;
  function draw(){
    const y=gv("fYear"),a=gv("fAi"),tg=gv("fTag"),q=$("nSearch").value.trim();
    const list=entries.filter(e=>(!y||(e.date||"").startsWith(y))&&(!a||e.ai===a)&&(!tg||(e.topic_tags||[]).includes(tg))&&(!q||JSON.stringify(e).includes(q)));
    $("tList").innerHTML=list.map(e=>`<div class="topic-card"><div class="tc-head"><span class="tc-date">${esc(e.date||"")}</span>${e.ai?`<span class="tc-ai">${esc(e.ai)}</span>`:""}<span class="tc-tags">${(e.topic_tags||[]).map(x=>`<span>${esc(x)}</span>`).join("")}</span></div><h4>${e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title||"")}</a>`:esc(e.title||"")}</h4><p>${esc(e.summary||"")}</p>${e.reactions&&e.reactions.summary?`<p class="small">💬 ${esc(e.reactions.summary)}${(e.reactions.sources||[]).map(x=>` <a href="${esc(x.url)}" target="_blank" rel="noopener">[${esc(x.label||'source')}]</a>`).join("")}</p>`:""}</div>`).join("");
    $("nCount").textContent=list.length+" 件";
  }
  ["fYear","fAi","fTag"].forEach(g=>s.querySelectorAll("#"+g+" .chip").forEach(c=>c.addEventListener("click",()=>{s.querySelectorAll("#"+g+" .chip").forEach(x=>x.classList.remove("active"));c.classList.add("active");draw();})));
  $("nSearch").addEventListener("input",draw);draw();
}

/* ========== ④-2 / ④-3 templates, ★ blanks ========== */
function renderCampaigns(s){
  s.innerHTML=hero(`④ IDEAナレッジ｜<b>実施施策 / 施策結果</b>`,`実施施策の<span class="answer">記録テンプレート</span>`,`実施したPR・調査施策と結果（言及率・サイテーション・流入・CV）を記録する型。WingArc「AI時代のBI選定基準に関する実態調査」施策枠と同型。`)
   +`<div class="banner">施策実施後に記入します（現在ブランク）。1施策＝1行で追加してください。</div>`
   +`<div class="card"><h3>施策一覧</h3><div class="table-wrap"><table class="tmpl-table"><thead><tr><th>実施月</th><th>施策名/種別</th><th>狙い・対象プロンプト</th><th>アウトプット</th><th>結果（言及率・SS・CV変化）</th><th>所感・次アクション</th></tr></thead><tbody><tr class="tmpl-row"><td>例) 2026-07</td><td>調査リリース配信</td><td>「LLMO 選び方」非指名枠</td><td>PRTIMES/業界紙</td><td>言及率 +x pt</td><td>—</td></tr><tr class="tmpl-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr><tr class="tmpl-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></div></div>`;
}
function renderConsulting(s){
  s.innerHTML=hero(`④ IDEAナレッジ｜<b>IDEAコンサルティング</b>`,`定例ナレッジの<span class="answer">集約テンプレート</span>`,`月次定例で得た示唆・意思決定・ネクストアクションを集約する型。WingArc「定例ナレッジ集約」と同型。`)
   +`<div class="banner">定例実施後に記入します（現在ブランク）。</div>`
   +`<div class="card"><h3>定例ナレッジ集約</h3><div class="table-wrap"><table class="tmpl-table"><thead><tr><th>定例日</th><th>テーマ</th><th>気づき・示唆</th><th>意思決定</th><th>ネクストアクション</th><th>担当/期限</th></tr></thead><tbody><tr class="tmpl-row"><td>例) 2026-07-xx</td><td>非指名枠の攻め方</td><td>ツール型が先行、PR起点が空白</td><td>選定基準リリースを起案</td><td>調査企画ドラフト</td><td>—</td></tr><tr class="tmpl-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody></table></div></div>`;
}
function blankState(s,title,desc){s.innerHTML=hero(`★ サマリ｜<b>${title}</b>`,`<span class="answer">${title}</span>`,desc)+`<div class="blank-state"><div class="bs-icon">📝</div><h3>現在ブランクです</h3><div>${desc}<br>月次更新時にこのセクションへ記入します。</div></div>`;}

const RENDER={
  diff:s=>blankState(s,"n月実績差分","前月（前回計測）との差分サマリ：言及率の増減・新規サイテーション・流入/CVの変化。"),
  insights:s=>blankState(s,"n月実績所感","当月の所感・ハイライト・次月の打ち手。"),
  ss:renderSS,cv:renderCV,branded:renderBranded,nbmatrix:renderNbMatrix,nbdetail:renderNbDetail,
  citation:renderCitation,strengths:renderStrengths,pA:s=>renderPersona(s,"A"),pB:s=>renderPersona(s,"B"),pC:s=>renderPersona(s,"C"),
  news:renderNews,campaigns:renderCampaigns,consulting:renderConsulting
};

/* ---------- boot + cross-section prompt jump ---------- */
const drawn={};
function ensure(key){const sec=document.getElementById("sec-"+key);if(!drawn[key]&&RENDER[key]){try{RENDER[key](sec);}catch(e){sec.innerHTML='<div class="banner">描画エラー: '+esc(e.message)+'</div>';console.error(e);}drawn[key]=1;}return sec;}
function show(id){document.querySelectorAll(".section").forEach(x=>x.classList.toggle("active",x.id===id));
  document.querySelectorAll(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.section===id));
  ensure(id.replace("sec-",""));window.scrollTo(0,0);try{history.replaceState(null,"","#"+id);}catch(e){}$("sidebar").classList.remove("open");}
function jump(target,no){const key=target;show("sec-"+key);const card=document.getElementById("det-"+key+"-"+no);if(card){card.querySelectorAll("details").forEach(d=>d.setAttribute("open",""));if(card.scrollIntoView)card.scrollIntoView({behavior:"smooth",block:"center"});card.classList.add("flash");setTimeout(()=>card.classList.remove("flash"),1600);}}
document.addEventListener("click",e=>{const a=e.target.closest("a.prompt-link");if(a){e.preventDefault();jump(a.dataset.jump,a.dataset.no);}});
$("asOf").textContent="データ基準: "+M.as_of+"（BrandRadar "+M.survey_date+"）";
$("hdrNote").textContent="自動更新: 週次 / build "+M.generated_at.slice(0,10);
document.querySelectorAll(".nav-btn").forEach(b=>b.addEventListener("click",()=>show(b.dataset.section)));
$("menuToggle").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
const ih=location.hash.slice(1);show(document.getElementById(ih)?ih:"sec-diff");
})();
