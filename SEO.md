# SEOと検索登録

正規サイト: https://db-enshushitsu.pages.dev/

`node scripts/build_seo.cjs` で検証済みの `data.js` / `archive-data.js` から年度別17ページ、年度一覧、使い方、sitemap.xml、robots.txt、404.htmlを生成します。広告はindex.htmlの広告セクションを共用します。広告を変更したら再生成してください。

`node tests/seo.cjs` は21ページの正規URL・タイトル・説明の重複、内部リンク、構造化データ、各年度25問の表、広告属性、フォント、問題番号の直接リンクを確認します。GitHub Actionsでも生成と検証を行います。

Cloudflare Pagesでは `.html` が拡張子なしへリダイレクトされるためcanonicalとサイトマップは拡張子なしです。リンクはGitHub Pagesでも使えるよう `.html` を使用しています。404.htmlを削除すると存在しないURLがトップページを返す可能性があります。回答履歴はnoindex、APIはrobots.txtで巡回対象外です。

Search ConsoleはURLプレフィックス `https://db-enshushitsu.pages.dev/` を使用します。index.htmlのgoogle-site-verificationタグは所有権確認を維持するため削除しないでください。サイトマップは `https://db-enshushitsu.pages.dev/sitemap.xml`。公開後、Search Consoleのページ登録状況・検索パフォーマンスで経過を確認します。サイトマップ送信は検索掲載や順位を保証するものではありません。

Rakutenの紹介者ID・商品リンク・sponsored属性を保持しています。広告の成果は楽天アフィリエイト側で確認します。購入を行う成果確認テストやアクセスの水増しは実施していません。価格は表示の日付時点の情報です。

BIZ UDPGothicのWOFF2は同梱TTFをFontTools/Brotliで変換したものです。通常・太字合わせて9,310,284バイトから4,442,164バイトへ約52%削減。OFLライセンスを同梱しています。

Cloudflareは直接アップロード方式です。GitHubへの更新だけではCloudflareへ反映されません。既存D1の設定を維持してdistフォルダーをProductionへアップロードします。
