# 公開・更新手順

本番URLは https://db-enshushitsu.pages.dev/ です。Cloudflare PagesのDirect Uploadで配信しています。GitHubへのpushだけではCloudflare Pagesは更新されません。

## ローカル構築

Node.js 24、Python 3.12以降を使用します。

```sh
pip install pypdfium2 Pillow
python scripts/build_assets.py
python scripts/fetch_pdfjs.py
node tests/grading.cjs
node tests/api.mjs
node tests/archive.cjs
python scripts/build_pages.py
```

公式PDF136点は sources.json のURLから取得しSHA-256を検証します。PDF.js 6.3.289は公式npm配布物のSHA-512を検証します。2025年度の表示画像を生成し、過去年度はブラウザー内のPDF.jsで描画します。

## Cloudflare Pages

Workers & Pages → db-enshushitsu → Create deployment → Production で構築済み dist フォルダーをアップロードします。全ファイルのアップロード成功後に Deploy site を押します。大きなZIPではなくフォルダーを選びます。

本番設定:
- compatibility date: 2026-09-30
- compatibility flag: nodejs_compat
- D1 binding: DB → db-practice
- ALLOWED_ORIGINS: https://db-enshushitsu.pages.dev,https://mochi2277.github.io

_worker.js が /api/* を処理し、静的資料はPagesから配信されます。D1スキーマは api/migrations のSQLを順に適用します。0001と0002は既存環境に適用済みです。CREATE TABLE IF NOT EXISTSなので既存テーブルを壊しません。

2025年度は従来のprogress表を継続利用し、2009〜2024年度はprogress_archive表でユーザー・年度別に保存します。既存アカウントをそのまま利用できます。旧Workerの毎時17分の期限切れセッション整理は継続しています。

## GitHub Pages

GitHubのmain更新でテスト・資料再構築・GitHub Pages公開を行います。旧URLは https://mochi2277.github.io/DB/ です。フロントエンドは新しいPages APIへ接続します。Cloudflare Pages本番は上記の別途アップロードが必要です。

## 認証・採点

パスワードはランダムソルト付きscrypt（N=32768,r=8,p=3）で保存します。セッションは8時間、サーバーにはトークンのSHA-256だけを保存します。更新番号で別画面からの上書きを防ぎます。メール収集・パスワード復旧はありません。ゲストはメモリ内のみです。

採点は学習用です。午後は公式解答例との比較であり、意味的に等価なSQL・文章を完全判定するものではありません。図表等は自己照合します。

## 2026-09-30 検証

17年度、午前425問、午後1668項目（自動比較1208、自己照合460）、PDF136点のハッシュ確認済み。認証、ユーザー・年度分離、更新競合のローカルテストに合格しました。Pages実環境でも既存アカウントのログイン、2025年度保存データ保持、2024年度保存・再ログイン復元、2009年度分離、ログアウトを確認しました。

## 広告

所有者提供の楽天アフィリエイトURL3件をそのまま掲載しています。広告表示とプライバシーページを設置しています。所有者は新URLを楽天側のサイト情報へ登録してください。

APIトークン、パスワード、.env、.dev.vars はGitHubへ登録しないでください。
