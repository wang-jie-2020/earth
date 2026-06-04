# 花园地球效果实现计划

目标：基于 `examples/index.html` 的 Three.js 官方地球示例，尽可能还原参考图中的“如果地球是一座花园”效果，包括全屏地球、亚洲视角、植被/花朵覆盖、植物信息卡片、底部筛选控制、短视频式叠层 UI 和沉浸式暗色背景。

## 1. 总体策略

当前项目只有：

- `examples/index.html`：Three.js WebGPU 地球官方示例本地副本。
- `frame_001.jpg`：目标参考画面。

建议先做一个单文件可运行视觉原型，再根据复杂度拆分工程结构。不要一开始追求真实植物模型和完整地理数据，优先还原画面观感、构图和交互闭环。

实施顺序：

1. 复用官方示例的地球、材质、光照、大气层和 OrbitControls。
2. 移除官方示例说明框和 Inspector，改成参考图风格 UI。
3. 固定初始相机到亚洲视角，调大地球占屏比例。
4. 在地球表面叠加花园层：树、花、雪山、荒漠、草地等实例化视觉元素。
5. 用 HTML/CSS 做顶部标题、左侧抖音标识、搜索名、底部字幕、筛选栏。
6. 给植物实例增加 raycast 命中，显示 tooltip。
7. 最后做视觉增强：星空、极光、发光边缘、植物 atlas、动画和移动端适配。

## 2. 目标画面拆解

参考图可以拆成这些层：

- 背景层：接近黑色的太空背景，少量星点。
- 地球基础层：深色海洋、陆地纹理、大气蓝紫边缘。
- 地表花园层：大量绿色树冠、粉紫红色花点、局部白色雪山、棕橙色干旱区域。
- 交互标记层：植物 hover/选中后出现黑色 tooltip 卡片。
- 叠层 UI：
  - 左上：抖音 logo、账号、水印和搜索行。
  - 顶中：标题“如果地球是一座花园”、统计信息。
  - 右上：小图标按钮。
  - 底中：字幕“都有什么样的花朵吗”。
  - 底部：地区筛选、大小 slider、海拔/气候选择、旋转/极光开关。

Three.js 只负责三维场景；所有文字、按钮、字幕和 tooltip 使用 DOM overlay 实现。

## 3. 推荐文件结构

第一阶段可以继续使用 `examples/index.html`，但为了后续维护，建议新增一个正式页面：

```text
earth/
  index.html
  src/
    app.js
    style.css
    geo.js
    garden-data.js
    garden-layer.js
    ui.js
  assets/
    textures/
    sprites/
  examples/
    index.html
  frame_001.jpg
```

如果希望最快看到效果，也可以先只改 `examples/index.html`。但目标效果包含较多 UI 和数据，拆成 `src/` 会更清晰。

## 4. 阶段一：搭建正式入口

目标：新建一个独立可打开的原型页面，保留官方示例作为参考，不直接污染 `examples/index.html`。

修改内容：

- 新增 `index.html`
  - 引入 importmap。
  - 加载 `src/style.css`。
  - 加载 `src/app.js`。
  - 放置 overlay DOM 容器。
- 新增 `src/app.js`
  - 从官方示例迁移 Three.js 初始化逻辑。
  - 初始化 scene、camera、renderer、controls、earth、atmosphere。
  - 启动 animation loop。
- 新增 `src/style.css`
  - 全屏 canvas。
  - 深色背景。
  - overlay 布局。

验收标准：

- 打开 `index.html` 能看到可旋转地球。
- 没有官方 Inspector 和说明框。
- 画面为全屏沉浸式。

## 5. 阶段二：还原相机、构图和基础视觉

目标：先让整体截图构图接近参考图。

具体调整：

- 相机：
  - FOV 控制在 `24-32`。
  - 初始位置面向亚洲，推荐从经纬度计算相机方向，而不是手调欧拉角。
  - 地球占屏高度约 `80%-90%`。
- 控制器：
  - 开启 damping。
  - 限制缩放范围，避免用户缩太远或穿进地球。
  - 默认自动慢速旋转可通过底部开关控制。
- 光照：
  - 主光从右前方或上方打入。
  - 保留夜景/大气混合，但调暗海洋。
- 背景：
  - 添加 `Points` 星空，随机分布在大半径球壳。
  - 星点透明度低，避免抢主画面。

验收标准：

- 首屏直接看到亚洲和东南亚区域。
- 地球大、居中略偏上，底部能放控制条。
- 大气边缘有蓝紫色薄光。
- 背景不是纯黑空白，有轻微星点。

## 6. 阶段三：实现经纬度贴地工具

目标：后续所有植物、山、区域贴片都用统一地理坐标函数摆放。

新增 `src/geo.js`：

```js
export function latLonToVector3(lat, lon, radius = 1) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;

  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}
```

同时提供：

- `lookAtLatLon(camera, controls, lat, lon, distance)`：设置初始视角。
- `orientObjectOnSphere(object, position)`：让树、花、山垂直于球面。
- `randomPointAround(lat, lon, radiusDegrees)`：围绕中心点生成自然分布。

验收标准：

- 可以用 `lat/lon` 稳定地把点放到球面上。
- 亚洲、中国、东南亚等区域大致位置正确。
- 地表实例不会漂浮方向混乱。

## 7. 阶段四：建立花园数据层

目标：用数据驱动渲染，避免把植物写死在渲染逻辑里。

新增 `src/garden-data.js`：

```js
export const plantSpecies = [
  {
    id: "euphorbia-milii",
    name: "铁海棠",
    latin: "Euphorbia milii",
    region: "亚洲",
    climate: "热带",
    altitude: "~600m",
    description: "大戟科观赏花卉，喜多阳性环境并常年开花。",
    lat: 22.3,
    lon: 103.8,
    color: "#d84f7a",
    type: "flower"
  }
];
```

数据先覆盖视觉重点区域：

- 亚洲：中国、印度、东南亚、中亚、日本。
- 欧洲：地中海、西欧、北欧。
- 非洲：撒哈拉、东非、南非。
- 北美：落基山、加州、美国东部。
- 南美：亚马孙、安第斯。
- 澳洲：澳洲东岸、内陆荒漠。

第一版不需要真实百科级精确，重点是让地表有密集、有疏密、有色彩层次。

验收标准：

- 数据包含至少 `80-150` 个植物/植被实例种子点。
- 每条数据有 region、type、lat、lon、color。
- tooltip 能读取同一份数据。

## 8. 阶段五：实现地表花园层

目标：用低成本几何和 sprite 模拟参考图里的树冠、花丛和植被覆盖。

新增 `src/garden-layer.js`：

实现对象类型：

- `tree`：绿色球冠或多球簇，少量棕色树干。
- `flower`：小型 billboard sprite 或彩色小球簇。
- `shrub`：低矮绿色球簇。
- `mountain`：锥体/低多边形山脊，白色顶部。
- `dryland`：棕橙色贴地 patch。
- `grassland`：浅绿色贴地 patch。

技术选择：

- 远景大量元素用 `InstancedMesh`。
- 近景/选中元素可用单独 Mesh，方便 raycast。
- 花朵第一版用彩色小球或圆形 sprite，不急着生成真实花朵图片。
- 所有对象 radius 使用 `1.01-1.08`，避免和地球 z-fighting。

推荐密度：

- 亚洲视角首屏：最密。
- 海洋：只放少量岛屿附近花园元素。
- 沙漠：用棕色 patch 和少量灌木。
- 高山：在喜马拉雅、阿尔卑斯、安第斯、落基山放白色山脊。

验收标准：

- 从亚洲视角看，陆地明显被“花园化”。
- 有绿色主体，也有粉、紫、红、黄的花点。
- 喜马拉雅附近有白色山体层次。
- 性能稳定，桌面端保持流畅。

## 9. 阶段六：tooltip 和交互命中

目标：鼠标悬停或点击地表植物时显示参考图中的黑色信息卡。

实现方式：

- 用 `Raycaster` 检测可交互植物点。
- 命中后将三维位置投影到屏幕坐标。
- HTML tooltip 使用 `position: absolute` 跟随该屏幕坐标。
- 选中后高亮该植物，未命中时隐藏 tooltip。

tooltip 内容：

- 中文名。
- 拉丁名。
- 简短介绍。
- 海拔/气候/地区信息。

样式要点：

- 黑色半透明背景。
- 小圆角。
- 低对比细边框。
- 标题白色，拉丁名灰色斜体，描述浅灰。
- 左侧可放一个小色块或花朵图标。

验收标准：

- hover 植物显示卡片。
- 卡片不会超出视口。
- 旋转地球时，选中卡片位置正确更新。

## 10. 阶段七：还原短视频式 UI overlay

目标：让画面第一眼接近参考图，而不是普通 Three.js demo。

新增/完善 DOM：

```html
<main id="app">
  <div id="scene-root"></div>
  <section class="hud hud-left">...</section>
  <section class="hud hud-title">...</section>
  <button class="hud hud-corner">...</button>
  <div class="subtitle">都有什么样的花朵吗</div>
  <section class="control-bar">...</section>
  <div class="plant-tooltip" hidden></div>
</main>
```

UI 内容：

- 左上：
  - 抖音图形可先用文字/简化图标代替。
  - “抖音”
  - “抖音号: dylv2m4lavz1”
  - 搜索图标和“麻省理工Rui同学”
- 顶中：
  - “如果地球是一座花园”
  - “537 种植物 · 真实坐标 · 14425 可见”
- 中下字幕：
  - “都有什么样的花朵吗”
- 底部控制：
  - 地区 tab：全球、亚洲、欧洲、非洲、北美、南美、澳洲、类型、全部。
  - 大小 slider。
  - 海拔/气候 select。
  - 旋转 checkbox。
  - 极光 checkbox。

验收标准：

- UI 叠在 canvas 上方，不影响地球渲染。
- 视觉上贴近截图：深色半透明、细边框、小字号、中文优先。
- 移动端不溢出，不遮挡主要地球。

## 11. 阶段八：筛选和状态管理

目标：底部控制真实影响花园层，不只是静态 UI。

状态字段：

```js
const state = {
  region: "全球",
  climate: "全部",
  size: 1,
  autoRotate: true,
  aurora: true
};
```

功能：

- 地区切换：只显示目标 region，或降低其他区域透明度。
- 大小 slider：调整植物实例 scale。
- 气候筛选：过滤 plantSpecies。
- 旋转开关：控制地球和花园层是否自动旋转。
- 极光开关：显示/隐藏极光带。

验收标准：

- 每个控件有实际效果。
- 状态变化不重建整个场景，优先更新 visibility/scale/material opacity。
- 筛选后 tooltip 数据仍正确。

## 12. 阶段九：极光和高级氛围

目标：补足参考图上方和边缘的紫绿色梦幻光效。

实现选项：

- 简单版：
  - 用几个半透明 `TorusGeometry` 或 `TubeGeometry` 环绕高纬区域。
  - 材质使用 additive blending。
  - 颜色为绿、紫、蓝。
- 进阶版：
  - 用曲线生成带状 mesh。
  - shader 中加入时间扰动。

验收标准：

- 极光出现在高纬或地平线附近。
- 不遮挡主体地表。
- 开关可控制显示。

## 13. 阶段十：资产升级

目标：从“彩色几何点”升级到更像真实花园的植被表现。

可选资产：

- `assets/sprites/tree-canopy.png`
- `assets/sprites/flower-pink.png`
- `assets/sprites/flower-purple.png`
- `assets/sprites/flower-yellow.png`
- `assets/sprites/shrub.png`

获取方式：

- 自绘简化 PNG。
- 使用 AI 生成透明背景 sprite atlas。
- 使用 CSS/canvas 运行时生成小图标纹理。

建议第一版用 canvas 程序生成 sprite，避免引入外部素材授权问题。

验收标准：

- 近看时不只是硬球，而有树冠/花团质感。
- 远看仍然清晰，不糊成噪点。

## 14. 阶段十一：性能优化

目标：保证元素数量较多时仍然可交互。

优化项：

- 大量重复对象使用 `InstancedMesh`。
- 降低非首屏地区密度。
- 按 region 分组，筛选时批量显隐。
- raycast 只检测少量可交互代表点，不检测所有装饰实例。
- 限制 pixelRatio，例如 `Math.min(window.devicePixelRatio, 2)`。
- 移动端降低星点、花朵和树冠数量。

验收标准：

- 桌面浏览器流畅交互。
- 移动端能打开且 UI 不错乱。
- 没有明显内存持续增长。

## 15. 阶段十二：验收对照

画面对照：

- 地球占比接近参考图。
- 亚洲为默认可见区域。
- 陆地有密集植被和多色花朵。
- 有喜马拉雅雪山视觉焦点。
- 有黑色植物 tooltip。
- 有左上抖音样式文字和搜索行。
- 有顶部标题和统计。
- 有底部字幕。
- 有底部筛选控制条。
- 有星空、大气、极光氛围。

交互对照：

- 鼠标可拖动旋转地球。
- 自动旋转可开关。
- hover/click 植物可显示信息。
- 地区筛选可用。
- slider 能改变植物大小。
- 极光可开关。

## 16. 建议里程碑

### M1：可运行地球原型

预计改动：

- `index.html`
- `src/app.js`
- `src/style.css`

交付效果：

- 干净全屏地球。
- 亚洲初始视角。
- 星空和大气。

### M2：花园层原型

预计改动：

- `src/geo.js`
- `src/garden-data.js`
- `src/garden-layer.js`
- `src/app.js`

交付效果：

- 地球表面出现大量树、花、山、草地。
- 视觉上开始接近参考图。

### M3：UI 和 tooltip

预计改动：

- `src/ui.js`
- `src/style.css`
- `src/app.js`

交付效果：

- 完整短视频式 overlay。
- hover/click 卡片。
- 底部控制条可用。

### M4：质感增强和性能优化

预计改动：

- `src/garden-layer.js`
- `src/app.js`
- `src/style.css`
- 可选 `assets/sprites/*`

交付效果：

- 极光、sprite atlas、动画细节、移动端优化。

## 17. 关键技术风险

- WebGPU 兼容性：官方示例使用 `three.webgpu.js`，部分浏览器可能不可用。必要时需要准备 WebGL renderer 版本。
- 远程纹理依赖：官方示例从 `threejs.org` 加载地球贴图，离线时不可用。正式版本应下载到 `assets/textures/`。
- 地表密度和性能：真实还原需要很多实例，必须控制 raycast 数量和实例批次。
- 视觉真实性：没有 sprite/贴图时，几何小球只能做到“像花园”，不能完全像真实花朵。应在 M4 引入更好的 sprite。
- 经纬度和贴图方向：Three.js 球体 UV 与经纬度方向可能有偏移，需要用少量已知地点校准。

## 18. 推荐立即执行的下一步

建议从 M1 开始，先创建正式入口：

1. 新增 `index.html`。
2. 新增 `src/app.js`，迁移并简化官方 Three.js 地球代码。
3. 新增 `src/style.css`，做全屏布局和基础 overlay。
4. 调整相机到亚洲视角。
5. 加星空。

完成 M1 后，再进入 M2 做花园层。这样每一步都能在浏览器里直接看到视觉结果，避免在数据和资产上提前投入过多。
