# Tetris on Even - 发布清单

## �?已准备文�?
### 1. 应用�?- �?`tetris-on-even-v1.1.0.ehpk` (34KB) - 已打�?- �?`app.json` - 配置正确（名称：tetris-on-even，版本：1.0.0�?
### 2. 应用商店材料
- �?`DESCRIPTION.md` - 应用描述（短描述 + 完整描述�?- �?`PRIVACY.md` - 隐私政策（不收集数据�?- �?`TERMS.md` - 服务条款（MIT License�?
### 3. 图像资源
- ⚠️ `generate-cover.html` - 封面图生成工具（需手动生成�?- ⚠️ 截图 - 需运行模拟器获�?
## 📸�?生成封面�?
1. **打开** `generate-cover.html` 在浏览器�?2. **点击** 画布保存 `cover.png`�?12x512�?3. **检�?* 图片为黑底绿字，包含"TETRIS on Even"和方块图�?
## 📸�?获取截图

1. **启动开发服务器**�?   ```bash
   cd tetris-on-even
   npm run dev
   ```

2. **打开模拟�?*（新终端）：
   ```bash
   npx evenhub-simulator http://localhost:5173
   ```

3. **截图**（模拟器界面）：
   - 游戏进行中的界面
   - 游戏结束界面
   - 至少2-3张不同状�?
4. **保存截图**�?`screenshot1.png`, `screenshot2.png` �?
## 🚀 上传�?Even Hub

### 步骤1：访问开发者平�?https://hub.evenrealities.com/developer

### 步骤2：登�?使用之前CLI登录的同一账号

### 步骤3：创建应�?- 点击 "+" �?"Upload App"
- 填写�?  - **Name**: Tetris on Even
  - **Package ID**: com.example.tetrisoneven
  - **Version**: 1.0.0
  - **Edition**: 202601

### 步骤4：上传文�?- **应用�?*: `tetris-on-even-v1.1.0.ehpk`
- **Cover Image**: `cover.png` (512x512)
- **Screenshots**: 2-3张截�?- **Description**: 复制 `DESCRIPTION.md` 内容
- **Privacy Policy**: 复制 `PRIVACY.md` 内容
- **Terms**: 复制 `TERMS.md` 内容

### 步骤5：权限确�?- �?无需特殊权限（空数组�?
### 步骤6：提交审�?- 检查所有信息无�?- 点击 "Submit for Review"

## 📋 检查清�?
- [ ] `tetris-on-even-v1.1.0.ehpk` 已生�?- [ ] `cover.png` 已生成（512x512�?- [ ] 截图已获取（2-3张）
- [ ] `DESCRIPTION.md` 内容已复制到上传表单
- [ ] `PRIVACY.md` 内容已复�?- [ ] `TERMS.md` 内容已复�?- [ ] 权限设置确认（无�?- [ ] 应用信息填写完整

## 🎉 完成�?
应用将通过 Even Hub 审核，然后上架到应用商店�?
---

**当前状�?*：✅ 代码已打包，📝 文档已准备，**需生成封面图和截图**�?
