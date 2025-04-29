# 人生 Git 系統

這是一個使用 Git 指令來操控人生的文字遊戲。每個選擇都會影響你的人生走向，創造不同的分支和結局。

## 遊戲特色

- 使用 Git 指令來操控人生選擇
- AI 生成的故事回應
- 成就系統
- 分支管理
- 時光回溯功能

## 如何開始

1. 安裝依賴：
```bash
npm install
```

2. 啟動遊戲：
```bash
npm run dev
```

## 基本指令

### 初始化
```bash
git init
```
開始你的人生旅程。

### 查看狀態
```bash
git status
```
查看當前的人生狀態，包括所在分支和最新選擇。

### 做出選擇
```bash
git commit -m "選擇描述"
```
記錄你的人生選擇。例如：
```bash
git commit -m "決定學習程式設計"
git commit -m "選擇出國留學"
git commit -m "開始健身計畫"
```

### 創建新分支
```bash
git branch 分支名稱
```
創建新的人生分支。例如：
```bash
git branch 創業之路
git branch 學術研究
git branch 藝術人生
```

### 切換分支
```bash
git checkout 分支名稱
```
切換到不同的人生分支。例如：
```bash
git checkout 創業之路
```

### 合併分支
```bash
git merge 分支名稱
```
合併不同的人生選擇。例如：
```bash
git merge 學術研究
```

### 重新設定基底
```bash
git rebase
```
重新設定人生基底，改變人生軌跡。

### 回到過去
```bash
git reset --hard HEAD~1
```
回到上一個選擇。

### 查看歷史
```bash
git log
```
查看你的人生歷程。

### 推送變更
```bash
git push
```
將人生變更推送到遠端。

## 成就系統

遊戲中有多個成就等待解鎖：
- 🎯 第一次選擇：完成第一次人生選擇
- 🌳 分支大師：創建 3 個不同的分支
- ⏳ 時空旅人：使用 reset 回到過去
- 🏃 倖存者：在危險的分支中存活下來
- 🌍 探索者：探索所有可能的分支

## 示範玩法

1. 開始新的人生：
```bash
git init
git commit -m "大學畢業"
```

2. 創建不同的人生分支：
```bash
git branch 科技公司
git branch 創業
git branch 研究所
```

3. 嘗試科技公司路線：
```bash
git checkout 科技公司
git commit -m "加入科技公司實習"
git commit -m "晉升為正式工程師"
```

4. 想嘗試創業：
```bash
git checkout 創業
git commit -m "創立自己的公司"
git commit -m "獲得第一輪投資"
```

5. 回到過去重新選擇：
```bash
git reset --hard HEAD~1
```

## 注意事項

- 每個選擇都會影響後續的故事發展
- 可以隨時切換分支嘗試不同的人生
- 使用 reset 可以回到過去的選擇
- 故事由 AI 生成，每次可能略有不同

## 技術棧

- React
- TypeScript
- OpenAI API
- Tailwind CSS
- Framer Motion

## 授權

MIT License
