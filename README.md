# RM MARK 本地标注工具

一个纯前端、本地可用的 RoboMaster 工程兑矿 MARK 标注器。

## 现在支持的能力

- 载入本地图片文件夹，逐张浏览
- 固定使用内置的 2026 MARK 模板
- 手工按 `top_left -> top_right -> bottom_left -> bottom_right` 标注 MARK 发光灯条的 4 个蓝色角点
- 四角录入后点击“确认四角”，再自动生成模板中的其余点
- 基于单应矩阵，把模板中的其余二维物理点自动投影到图片上
- 为每个点维护 `x / y / visibility`
- 四角确认后，所有点都可以继续在图像里拖拽微调
- 可视化关键点、边线、点标签
- 手工调整任意点的可见度：`0 = 不存在`，`1 = 被遮挡`，`2 = 可见`
- 导出单张或全部图片的 JSON / TXT，其中 `TXT` 可直接给 YOLO Pose 训练
- 导入已有标注 JSON 继续修订

## 如何打开

优先推荐本地服务方式，不要依赖 IDE 的 Markdown 预览去点绝对路径链接。

方式 1：直接启动本地服务

```bash
cd /home/aliouswe/label-V2
./start-local.sh
```

启动后在浏览器里打开终端输出的地址，默认通常是：

```text
http://127.0.0.1:8765
```

如果 `8765` 已被占用，脚本会自动切换到下一个空闲端口，比如 `8766`。

方式 2：手动打开文件

直接在系统浏览器里打开 `./index.html` 也可以，但不建议在 IDE 内置预览里打开。

## 推荐流程

1. 打开工具，载入一个图片文件夹。
   载入入口在顶部一行工具栏。
2. 工具会固定使用当前内置模板，不需要再额外导入模板。
3. 按顺序点击 MARK 发光灯条的 4 个蓝色角点：`top_left -> top_right -> bottom_left -> bottom_right`。
4. 点击“确认四角”，生成所有自动点位后，可继续拖动任意点微调，并检查可见度。
   上一张 / 下一张按钮放在图片区上方，方便调点后直接切图。
5. 选择导出格式，再导出 `JSON` 或 `TXT`。
   导出入口也在顶部一行工具栏。

## 导出格式

```json
{
  "id": "dataset/img_0001.png",
  "imageName": "img_0001.png",
  "imageWidth": 1280,
  "imageHeight": 720,
  "template": "RM 2026 MARK Split Points",
  "complete": true,
  "points": [
    { "id": "top_left", "x": 421.231, "y": 152.004, "visibility": 2 }
  ]
}
```

批量导出时，最外层是一个数组。

`TXT` 导出时，当前图会导出为单个 `*.txt`，全部导出会打包成一个 `zip`，其中每个图片对应一个同名 `txt` 标签文件。内容采用 YOLO Pose 的纯数字格式：

```text
class cx cy w h x1 y1 v1 x2 y2 v2 ... x32 y32 v32
```

说明：

- `class` 固定为 `0`
- `cx cy w h` 是根据当前有效关键点自动计算出的归一化包围框
- 后面的关键点按模板顺序导出，坐标都已归一化到 `0 ~ 1`
- `visibility` 保持 `0 / 1 / 2`
- 当某个点 `visibility = 0` 时，会导出为 `0 0 0`

## 内置模板结构

模板是一个 JSON 文件，核心字段如下：

```json
{
  "name": "RM 2026 MARK Split Points",
  "units": "mm",
  "anchorOrder": ["top_left", "top_right", "bottom_left", "bottom_right"],
  "points": [
    { "id": "top_left", "x": -32, "y": 32, "anchor": true },
    { "id": "top_right", "x": 32, "y": 32, "anchor": true },
    { "id": "bottom_left", "x": -32, "y": -32, "anchor": true },
    { "id": "bottom_right", "x": 32, "y": -32, "anchor": true },
    { "id": "point_05", "x": -25.157, "y": 25.822 }
  ],
  "edges": [
    ["top_left", "point_01"],
    ["point_13", "point_14"]
  ]
}
```

字段约定：

- `points[].x / y` 是物理平面中的模板坐标，单位由 `units` 自己定义，常用 `mm`
- 内置模板默认使用“中心为原点”的物理坐标系：`top_left = (-32, 32)`、`top_right = (32, 32)`、`bottom_left = (-32, -32)`、`bottom_right = (32, -32)`
- `anchor: true` 的 4 个点是人工点击的基准点
- 内置 2026 模板里，这 4 个 anchor 对应的是 MARK 发光灯条的 4 个蓝色角点，不是 `80mm x 80mm` 外框角
- 其他点会通过四点求得的单应矩阵自动投影
- `edges` 只是显示连线，不影响导出

当前内置模板定义可参考 `./examples/mark-template-draft.json`。

## 说明

当前内置模板已经切到你给的 2026 MARK 分点版本：4 个手工 anchor 对应 MARK 发光灯条的 4 个蓝色角点，其余 `point_01 ~ point_28` 不再按独立散点保存，而是由共享的 `x / y` 线族交点生成，再通过单应矩阵投到图像里。这样在物理模板里本来平行、共线的灯条边会先被锁住，再做透视投影。这个流程和 OpenCV 的 `findHomography / perspectiveTransform` 是同一套射影几何建模思路，只是当前前端实现保留了本地纯静态可用的版本。后续如果你们队还要继续细调，只需要修改项目里的内置模板定义，不需要再改投影代码。
