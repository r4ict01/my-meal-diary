# My Meal Diary

毎日の食事を簡単に記録できる小さな日記アプリです。

食事の種類、料理名、満足度、メモを保存して、過去の食事の傾向を見やすく管理できます。データはブラウザの localStorage に保存されるので、ページを閉じても同じブラウザで履歴を確認できます。

## 機能

- 日付ごとに食事を記録
- 朝食 / 昼食 / 夕食 / 間食を選択
- 食事名とメモを保存
- 満足度を5段階で選択
- 食事履歴の一覧表示
- 食事の編集と削除
- 食事名やメモで検索
- 満足度フィルター
- 最近7件の満足度の変化を波形で表示

## 使い方

`index.html` をブラウザで開くだけで利用できます。ビルドやサーバー起動は不要です。

```text
my-meal-diary/
├── index.html
├── styles.css
├── app.js
├── README.md
├── LICENSE
└── image.png
```

## 保存データ

保存キーは `my-meal-diary.entries.v1` です。

```json
[
  {
    "id": "example-id",
    "date": "2026-04-29",
    "mealType": "dinner",
    "mealName": "カレーライス",
    "mood": "happy",
    "note": "おいしかった。ご飯が進む。",
    "createdAt": "2026-04-29T10:00:00.000Z",
    "updatedAt": "2026-04-29T10:00:00.000Z"
  }
]
```

## ライセンス

MIT License
