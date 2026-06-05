# Light/Dark 主题切换设计（最小可用）

- 日期：2026-06-05
- 项目：`earth`
- 目标：实现最小可用主题切换（右上角按钮 + CSS 主题 + three.js 场景背景联动）

## 1. 已确认决策

1. 刷新后不保留主题（不使用 `localStorage`）。
2. 切换入口放在右上角悬浮按钮。
3. 不加键盘快捷键（仅按钮）。
4. 采用「CSS 变量 + JS 切换类名 + 场景背景同步」方案。

## 2. 目标与非目标

### 2.1 目标

- 提供可见、可点击的主题切换按钮。
- 默认暗色主题。
- 切换到亮色时，页面 UI 与 3D 场景背景同步变亮。
- 不新增依赖。
- 构建可通过（`npm run build`）。

### 2.2 非目标（本次不做）

- 主题持久化（如 `localStorage`）。
- 跟随系统主题（`prefers-color-scheme`）。
- 快捷键切换。
- 复杂主题系统（多主题、主题配置文件、动画过渡）。

## 3. 设计概览

采用单一主题状态（`dark | light`）驱动两个层面：

1. **DOM/UI 主题**：通过给 `body` 添加/移除 `theme-light` 类，触发 CSS 变量覆盖。
2. **3D 场景背景主题**：通过 `app.setBackgroundColor(hex)` 同步 `scene.background`。

该方案保持现有结构：

- `src/main.js` 负责应用状态、UI 控件与事件绑定。
- `src/earth/createScene.js` 负责 three.js 场景与可控 API 暴露。
- `src/styles/base.css` 负责视觉变量与按钮样式。

## 4. 组件与文件改动

### 4.1 `src/earth/createScene.js`

新增场景背景设置函数并暴露：

- 新增 `setBackgroundColor(hex)`：内部执行 `scene.background.set(hex)`。
- 在 `return` 对象中增加 `setBackgroundColor`，供上层 app 调用。

**目的**：避免上层直接访问 `scene` 内部细节，维持封装边界。

### 4.2 `src/main.js`

在应用层增加主题控制逻辑：

- 定义主题常量：
  - `THEME_DARK = "dark"`
  - `THEME_LIGHT = "light"`
  - 对应背景色常量（暗色/亮色 hex）
- 在 `createEarthApp` 内新增 `setBackgroundColor(hex)`，转调 `world.setBackgroundColor(hex)`。
- `app` 返回对象暴露 `setBackgroundColor`。
- 文档初始化段（`if (typeof document !== "undefined") { ... }`）中新增：
  - `theme` 运行时状态（默认 dark）
  - 创建右上角按钮
  - `applyTheme(theme)`：
    - 切换 `body.theme-light`
    - 调用 `app.setBackgroundColor(...)`
    - 更新按钮文案
  - 按钮 click -> 切换主题并调用 `applyTheme`
  - 首次调用 `applyTheme(THEME_DARK)` 统一初始化路径

### 4.3 `src/styles/base.css`

改为变量驱动颜色：

- 在 `:root` 定义暗色变量：
  - `--page-bg`, `--text-color`, `--info-bg`, `--info-border`, `--link-color`
- `body.theme-light` 覆盖为亮色变量。
- 现有样式改用变量（`body`, `#info`, `a` 等）。
- 新增主题按钮样式：
  - 固定在右上角
  - 圆角、半透明、可 hover
  - 适当 `z-index`，不挡主要交互

## 5. 数据流与状态

### 5.1 初始状态

- `theme = dark`
- 不添加 `theme-light` 类
- 场景背景设置为暗色

### 5.2 交互流程（点击按钮）

1. 计算 `nextTheme`（dark ↔ light）
2. 更新内存状态 `theme = nextTheme`
3. `applyTheme(theme)` 执行：
   - DOM 类名同步
   - 场景背景同步
   - 按钮文案同步

### 5.3 刷新行为

- 无持久化，刷新后回到默认暗色。

## 6. 错误处理与鲁棒性

- 按钮创建失败时不影响地球渲染主流程（按钮为增强项）。
- `setBackgroundColor` 仅使用内部定义常量色值调用，避免非法参数来源。
- 不引入额外异步逻辑，避免时序复杂度。

## 7. 测试与验收

### 7.1 手动验收

1. 页面右上角出现主题按钮。
2. 首次进入为暗色。
3. 点击按钮后：
   - 页面背景、文字、`#info`、链接配色切换为亮色主题。
   - 场景背景同步变亮。
4. 再次点击恢复暗色。
5. 刷新页面恢复暗色。

### 7.2 工程验收

- `npm run build` 成功。
- 不新增依赖。

## 8. 影响范围

- `src/main.js`
- `src/earth/createScene.js`
- `src/styles/base.css`

不涉及纹理、材质节点、动画循环、测试基线逻辑。
