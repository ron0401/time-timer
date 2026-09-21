# もぐもぐタイマー 🍎

1分に1つ、りんごをぱくっ。かわいいあおむしと、いっしょに過ごすタイマーです。

**アプリ: https://ron0401.github.io/time-timer/**

## つかいかた

1. 1〜60分で時間を設定します。5・10・15・25分のボタンも使えます。
2. 「はじめる」でスタート。1分かけて、あおむしがりんごを1つ食べます。
3. 「ひとやすみ」で一時停止、「つづける」で再開できます。
4. 全部食べたら終了。お知らせの音は右上のボタンで切り替えられます。

iPhone・パソコンに対応。タブが裏に回っている間も経過時間を反映します。ただし、ブラウザや端末のスリープ中は終了音が遅れる場合があります。ページを再読み込みするとタイマーはリセットされます。

## 開発

Node.js 24以上を使用します。

```sh
npm ci
npm run dev
```

ローカル: http://127.0.0.1:5173/time-timer/

```sh
npm test         # 時間計算のテスト
npm run build   # 型チェックと本番ビルド
npm run test:e2e # Chromeを使った操作・表示テスト
```

TypeScript + Viteで実装。あおむし・りんごのイラストはSVGです。フォントはGoogle FontsのKiwi MaruとNunitoを使用し、取得できない環境ではシステムフォントで表示します。

## 公開

`main`へのプッシュでGitHub Actionsがテスト・ビルドし、GitHub Pagesへ自動公開します。

- ワークフロー: `.github/workflows/deploy.yml`
- GitHub Pagesのソース: GitHub Actions
- 公開パス: `/time-timer/`（`vite.config.ts`）
