# IDEA LLMO ダッシュボード

[IDEA LLMO](https://ideatech.jp/service/idea-llmo/)（BtoB特化型LLMO戦略支援）のLLMOモニタリング・ダッシュボード。GitHub Pages 公開用の静的サイトです。

- 公開URL（例）: `https://hibiki-nabetani-ideatech.github.io/idea-llmo-dashboard/`
- 公開範囲: URLを知っている人のみ（`<meta robots="noindex">` + `robots.txt` で検索エンジン除外）
- 参考: `wingarc-llmo-dashboard` / `ideatech-llmo-dashboard` / `macp-llmo-dashboard` の良いとこ取りで構成

## 画面構成

| 区分 | タブ | 内容 | データ元 |
|---|---|---|---|
| ★ サマリ | n月実績差分 / n月実績所感 | 月次更新時に記入（現在ブランク） | 手動 |
| ① 結果指標 | ①-1 セッション(SS) | IDEA LLMO関連ページのセッション月次推移・AI経由 | GA4 |
| | ①-2 コンバージョン(CV) | 「サービス資料」「お問い合わせ」フォーム送信数 | HubSpot |
| ② 推奨状況 | ②-1 指名プロンプト言及状況 | 指名10プロンプト×LLMの言及マトリクス＋応答全文 | Ahrefs BrandRadar |
| | ②-2 非指名プロンプト一覧 | 非指名40プロンプト×自社/競合×LLMの推奨状況マトリクス | Ahrefs BrandRadar |
| | ②-3 非指名プロンプト詳細 | 上記の応答全文（自社=黄/競合=紫ハイライト） | Ahrefs BrandRadar |
| | ②-4 サイテーション | AI応答の引用元ページ/ドメイン | Ahrefs BrandRadar |
| ③ ルールメイク | ③-0 強みの言語化 | 競合優位性の構造化（サービスサイト・PR由来） | 手動 |
| | ③-1〜3 ペルソナA/B/C | LLMの推薦基準と推薦企業 / AI認知マッピング(4象限) | Ahrefs BrandRadar |
| ④ ナレッジ | ④-1 主要AIニュース | 主要AIプロダクトの週次アップデート（自動収集） | 収集 |
| | ④-2 実施施策/施策結果 | 施策記録テンプレート（現在ブランク） | 手動 |
| | ④-3 IDEAコンサルティング | 定例ナレッジ集約テンプレート（現在ブランク） | 手動 |

## ファイル構成

```
index.html              # ダッシュボード本体（自動生成。const DATA を埋め込んだ自己完結HTML）
robots.txt              # 検索エンジン除外
_pipeline/
  data_v3.json          # ダッシュボードに埋め込むデータ（assemble_data.py が生成）
  assemble_data.py      # raw/*.json を統合して data_v3.json を生成
  build_html.py         # data_v3.json + render.js → index.html を生成
  render.js             # クライアント側レンダリング（全セクション描画）
  fetch_brand_radar.py  # Ahrefs BrandRadar API から AI応答を取得（raw/idea_ahrefs_data.json）
  raw/                  # 取得済みの一次データ（再生成のための入力）
    idea_ahrefs_data.json   # BrandRadar（指名/非指名/ペルソナ別の言及・応答・引用元）
    idea_citations.json     # 引用元ページ/ドメイン
    idea_ga_cv.json         # GA4セッション + HubSpot CV
    idea_ainews.json        # ④-1 主要AIニュースのフィード
    idea_prompt_map.json    # プロンプト→カテゴリ/ペルソナ対応表（セットアップExcel由来）
```

## 再生成

```bash
cd _pipeline
python3 assemble_data.py        # raw/ → data_v3.json
python3 build_html.py           # data_v3.json + render.js → ../index.html
```

## 週次更新フロー

1. `fetch_brand_radar.py` で Ahrefs BrandRadar（report_id=`019ec10f-...`）の最新AI応答を取得 → `raw/idea_ahrefs_data.json`
2. GA4 / HubSpot の最新値を `raw/idea_ga_cv.json` に反映（GAセッション・フォーム送信数）
3. `assemble_data.py` → `build_html.py` を実行して `index.html` を再生成し commit / push
4. `.github/workflows/weekly.yml` で毎週自動実行（Secrets に各種トークンを設定）

## データに関する注記

- **LLMはChatGPTのみ取得中**: 現在のAhrefsサブスクリプションでは BrandRadar の ChatGPT のみ取得可能。Gemini / Copilot / Perplexity はアドオン契約後に自動で列が埋まります（UI上は「—」表示）。
- **DR**: 引用元のドメインレーティング(DR)は当該エンドポイントで取得できないため空欄。コンテンツエクスプローラー連携で付与可能。
- **セッション**: `/service/idea-llmo/` 直URLのGAセッションは現状ほぼ0のため、IDEA LLMO関連ページ群で集計。
- データ基準日・調査日はダッシュボード上部に表示。
