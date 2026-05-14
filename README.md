# RM MARK 本地标注工具

一个纯前端、本地可用的 RoboMaster 工程兑矿 MARK 标注器。

## 现在支持的能力

- 载入本地图片文件夹，逐张浏览
- 手工按 `top_left -> top_right -> bottom_left -> bottom_right` 标注发光图案的四个外角
- 四角录入后点击“确认四角”，再自动生成模板中的其余点
- 基于单应矩阵，把模板中的其余二维物理点自动投影到图片上
- 为每个点维护 `x / y / visibility`
- 可视化关键点、边线、点标签
- 手工调整任意点的可见度：`0 = 不存在`，`1 = 被遮挡`，`2 = 可见`
- 导出单张或全部图片的 JSON
- 导出单张或全部图片的 JSON / TXT
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
2. 在左侧保持默认模板，或者导入你们队本赛季的模板 JSON。
3. 按顺序点击发光图案的四个外角：`top_left -> top_right -> bottom_left -> bottom_right`。
4. 点击“确认四角”，生成所有自动点位后，检查并修正可见度。
5. 选择导出格式，再导出 `JSON` 或 `TXT`。

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

`TXT` 导出时，每行对应一张图，格式如下：

```text
image_id top_left(x,y,visibility) top_right(x,y,visibility) bottom_left(x,y,visibility) bottom_right(x,y,visibility) point_01(x,y,visibility) ... point_28(x,y,visibility)
```

其中第一列 `image_id` 作为占位保留，方便后续接 YOLO 训练流程。

## 模板格式

模板是一个 JSON 文件，核心字段如下：

```json
{
  "name": "RM 2026 MARK Split Points",
  "units": "mm",
  "anchorOrder": ["top_left", "top_right", "bottom_left", "bottom_right"],
  "points": [
    { "id": "top_left", "x": 8, "y": 8, "anchor": true },
    { "id": "top_right", "x": 72, "y": 8, "anchor": true },
    { "id": "bottom_left", "x": 8, "y": 72, "anchor": true },
    { "id": "bottom_right", "x": 72, "y": 72, "anchor": true },
    { "id": "point_05", "x": 15.5, "y": 14.85 }
  ],
  "edges": [
    ["point_05", "point_06"],
    ["point_05", "point_15"]
  ]
}
```

字段约定：

- `points[].x / y` 是物理平面中的模板坐标，单位由 `units` 自己定义，常用 `mm`
- `anchor: true` 的 4 个点是人工点击的基准点
- 内置 2026 模板里，这 4 个 anchor 对应的是发光图案的四个外角，不是整块 `80 x 80` 外轮廓的绝对角
- 其他点会通过四点求得的单应矩阵自动投影
- `edges` 只是显示连线，不影响导出

内置示例模板文件在 `./examples/mark-template-draft.json`。

## 说明

当前内置模板已经切到你给的 2026 MARK 分点版本：4 个手工 anchor 对应发光外角，其余 `point_01 ~ point_28` 是根据你提供的分点图和正视图坐标整理出来的自动投影点。后续如果你们队还要继续细调，只需要修改模板 JSON，不需要再改投影代码。
