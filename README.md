# 占いMODシステム — GitHub Pages公開手順

## ファイル構成
```
uranai-mod-site/
└── index.html   ← これ1ファイルだけでOK
```

---

## GitHub Pagesへのアップロード手順

### 1. GitHubアカウント作成
https://github.com にアクセスしてアカウントを作成（無料）

### 2. 新しいリポジトリを作成
- 右上「+」→「New repository」
- Repository name: `uranai-mod`（任意）
- **Private**（非公開）に設定 ← 重要！購入者限定なので
- 「Create repository」をクリック

### 3. index.htmlをアップロード
- 「uploading an existing file」をクリック
- index.htmlをドラッグ＆ドロップ
- 「Commit changes」をクリック

### 4. GitHub Pagesを有効化
- リポジトリの「Settings」タブ
- 左メニュー「Pages」
- Source: 「Deploy from a branch」
- Branch: 「main」→「/(root)」→「Save」

### 5. URLが発行される（数分後）
```
https://あなたのユーザー名.github.io/uranai-mod/
```
このURLをLINE Botに設定する

---

## LINE Botとの連携

LINE Botの `index.js` のキーワード処理に以下を追加：

```javascript
if (lower === "特典" || lower === "レビュー特典") {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "🎁 VIP特典をお届けします！\n\n✨ 占いMODシステム（購入者限定）\n→ https://あなたのユーザー名.github.io/uranai-mod/\n\n好きな占いベースにMODを重ねて、あなただけのオリジナル占いAIを作れます🔮\n\n※このURLは購入者限定です。第三者への共有はご遠慮ください。"
  });
}
```

---

## セキュリティについて

GitHubリポジトリをPrivateにしてもGitHub PagesのURLは公開されます。
完全な限定公開にしたい場合はパスワード機能の追加をおすすめします。
（追加実装が必要な場合はお声がけください）
