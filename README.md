# Tetris on Even - EVEN 眼镜俄罗斯方块

专为 EVEN G2 智能眼镜、EVEN 戒指和手机设计的经典俄罗斯方块游戏。

**当前版本：v1.1.0** | **新增：手机操控界面支持**

## 功能特点

- 🎮 **经典体验**：复古掌机风格方块渲染（外框+内方块设计）
- 💍 **戒指操控**：通过 EVEN 戒指的滑动和点击控制游戏
- 📊 **NEXT 预览**：左侧实时显示下一个方块
- 🏆 **历史最高分**：自动保存最佳成绩到本地
- ⚡ **动态加速**：每获得 100 分速度提升一档（100% → 1500%）
- 🎨 **经典计分**：1行10分，2行30分，3行50分，4行80分

## 安装

```bash
cd tetris-on-even
npm install
```

## 运行

### 开发模式
```bash
npm run dev
```

### 在模拟器中预览
```bash
npx evenhub-simulator http://localhost:5173
```

### 打包部署
```bash
npm run build
npx evenhub qr --url http://<your-ip>:5173
```

## 操作说明（EVEN 戒指）

| 动作 | 功能 |
|------|------|
| 戒指上滑 | 方块左移 |
| 戒指下滑 | 方块右移 |
| 戒指单击 | 旋转方块 |
| 戒指双击 | 暂停/继续（游戏中）或重新开始（游戏结束） |

## 游戏界面布局

```
┌──────────┬───────────────┬──────────┐
│  NEXT   │   游戏主区域   │  操作提示  │
│  预览   │   (带边框)     │  Speed:XXX% │
│          │               │  ^ Slide:  │
│  SCORE  │   方块下落区域  │  v Slide:  │
│  (分数)  │               │  Click:    │
│          │               │  D-Click:  │
│  BEST   │               │           │
│  (最高分)│               │           │
└──────────┴───────────────┴──────────┘
```

## 技术栈

- **框架**：Vite + TypeScript
- **SDK**：@evenrealities/even_hub_sdk
- **显示**：576×288 像素，4-bit 灰度（16色绿色）
- **渲染**：Canvas API + Base64 PNG 图像传输

## 项目结构

```
tetris-on-even/
├── src/
│   └── main.ts          # 游戏主逻辑
├── app.json            # EVEN Hub 应用配置
├── package.json
├── .gitignore
└── README.md
```

## 许可

MIT License

---

## GitHub 上传指南

### 方法1：通过 GitHub 网页创建仓库（推荐）

1. **登录 GitHub**：https://github.com

2. **创建新仓库**：
   - 点击右上角 "+" → "New repository"
   - 仓库名：`tetris-on-even`
   - 描述：`EVEN G2 Tetris on Even - Classic Tetris game for smart glasses`
   - 选择 **Public** 或 **Private**
   - **不要**勾选 "Initialize with README"（我们已经有了）
   - 点击 "Create repository"

3. **推送代码**（复制 GitHub 给你的命令）：
```bash
cd tetris-on-even
git branch -M main
git remote add origin https://github.com/你的用户名/tetris-on-even.git
git push -u origin main
```

### 方法2：使用 GitHub CLI（如果已安装）

```bash
# 安装 gh CLI（如果没有）
# winget install GitHub.cli

# 登录
gh auth login

# 创建仓库并推送
cd tetris-on-even
git branch -M main
gh repo create tetris-on-even --public --source=. --push
```

---

由 opencode 开发 | 专为 EVEN G2 智能眼镜设计
