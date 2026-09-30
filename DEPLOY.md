# 公開手順

フロントエンドは GitHub Pages、ID・パスワード認証と解答保存は Cloudflare Workers + D1 を使用します。メールアドレスは収集しません。

## Cloudflare

Node.js 24 と Wrangler を使える環境で以下を実行します。

```sh
cd api
npx wrangler login
npx wrangler d1 create db-practice
```

作成された database_id を wrangler.toml に設定します。

```sh
npx wrangler d1 migrations apply db-practice --remote
npx wrangler deploy
```

ALLOWED_ORIGINS は `https://mochi2277.github.io` です。リポジトリ名のパスは含めません。
デプロイ後の HTTPS URL を dist/config.js の apiBase に設定します。これは公開URLであり、秘密鍵は含みません。
定期処理で期限切れセッションと試行回数カウンターを削除します。

## GitHub Pages

Mochi2277/DB の Settings → Pages → Build and deployment → Source を GitHub Actions に設定します。
main への更新でテスト、公式PDFのハッシュ確認・画像生成、dist の公開を実行します。
公開URLは https://mochi2277.github.io/DB/ です。
PDF・画像は容量削減のためGitに含めず、公式URLとハッシュから再構築します。

## 検証

```sh
node tests/grading.cjs
node tests/api.mjs
```

APIテストはメモリ内SQLiteを使い、登録、ログイン、ユーザー分離、保存復元、更新競合、入力検証、CORS、ハッシュ保存、ログアウト、セッション期限、削除処理、試行回数制限を確認します。Cloudflare実環境での動作確認は別途必要です。

## 保存と認証

- パスワードはランダムソルト付き scrypt (N=32768, r=8, p=3) のみ保存します。
- 8時間有効のセッションを使い、DBにはトークンのSHA-256だけを保存します。ブラウザーはセッションストレージに保存します。
- 解答はアカウントごとに保存し、更新番号で別画面からの上書きを防ぎます。
- ゲストの解答はメモリだけに保持します。ログアウト時は表示中の解答も消去します。
- メール認証・パスワード復旧はありません。ID・パスワードを控えて利用します。
- 採点は学習用のクライアント計算です。成績証明や不正防止には使えません。
- 公開後はCloudflareの使用量を確認してください。有料プランへの変更は自動で行いません。

APIトークン、パスワード、.dev.vars、.env はGitHubへ登録しないでください。

## 公開確認（2026-09-30）

- GitHub PagesとCloudflare APIを公開済み。API URL: https://db-practice-api.fullcounthappeace.workers.dev
- D1はdb-practice。初回スキーマは管理画面で適用済みです。初回migrationはIF NOT EXISTSを使い、後からWranglerの履歴に登録しても既存テーブルを壊しません。
- 毎時17分に期限切れセッション・試行回数カウンターを整理します。
- 実環境の登録、ログイン、保存、競合拒否、ログアウト、再ログイン・復元を確認しました。
- 公開画面で午後の空欄入力・照合結果・35点の自己採点が再読み込み後も戻ることを確認しました。
- テスト用ID qa_66ee2837d6 が1件あります。実利用者のIDではありません。
- フロントエンドはmainへの更新で自動公開されます。API更新は上記のWrangler手順で別途デプロイします。
