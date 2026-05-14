(function () {
  "use strict";

  const STORAGE_KEY = "rm-mark-labeler-state-v1";
  const EXPORT_FORMATS = {
    JSON: "json",
    TXT: "txt",
  };
  const VISIBILITY_LABELS = {
    0: "不存在",
    1: "遮挡",
    2: "可见",
  };
  const LEGACY_DRAFT_ANCHOR_ORDER = ["top_left", "bottom_left", "bottom_right", "top_right"];
  const LEGACY_DRAFT_POINT_IDS = new Set([
    "tl_l_01",
    "tl_l_02",
    "tl_l_03",
    "tl_l_04",
    "tl_l_05",
    "tl_l_06",
    "tr_l_01",
    "tr_l_02",
    "tr_l_03",
    "tr_l_04",
    "tr_l_05",
    "tr_l_06",
    "br_l_01",
    "br_l_02",
    "br_l_03",
    "br_l_04",
    "br_l_05",
    "br_l_06",
    "bl_l_01",
    "bl_l_02",
    "bl_l_03",
    "bl_l_04",
    "bl_l_05",
    "bl_l_06",
  ]);
  const LEGACY_SPLIT_POINT_EDGE_COUNT = 25;
  const LEGACY_BORDER_SPACE_FINGERPRINT = {
    top_left: { x: 8, y: 8 },
    top_right: { x: 72, y: 8 },
    bottom_left: { x: 8, y: 72 },
    bottom_right: { x: 72, y: 72 },
    point_01: { x: 32.38, y: 8.41 },
    point_10: { x: 65.69, y: 14.11 },
    point_17: { x: 65.65, y: 31.74 },
    point_28: { x: 47.73, y: 72.05 },
  };
  const INTEGER_DIMENSION_FINGERPRINT = {
    top_left: { x: 8, y: 8 },
    top_right: { x: 72, y: 8 },
    bottom_left: { x: 8, y: 72 },
    bottom_right: { x: 72, y: 72 },
    point_01: { x: 30, y: 8 },
    point_10: { x: 64, y: 16 },
    point_17: { x: 50, y: 38 },
    point_28: { x: 50, y: 72 },
  };
  const BORDER_FRAME_CENTERED_FINGERPRINT = {
    top_left: { x: -40, y: 40 },
    top_right: { x: 40, y: 40 },
    bottom_left: { x: -40, y: -40 },
    bottom_right: { x: 40, y: -40 },
    point_01: { x: -7.62, y: 31.59 },
  };
  const VISIBLE_CORNER_APPROX_CENTERED_FINGERPRINT = {
    top_left: { x: -32, y: 32 },
    top_right: { x: 32, y: 32 },
    bottom_left: { x: -32, y: -32 },
    bottom_right: { x: 32, y: -32 },
    point_01: { x: -7.62, y: 31.59 },
    point_13: { x: 25.89, y: 14.19 },
    point_28: { x: 7.73, y: -32.05 },
  };
  const TIGHTENED_VISIBLE_CORNER_CENTERED_FINGERPRINT = {
    top_left: { x: -30, y: 30 },
    top_right: { x: 30, y: 30 },
    bottom_left: { x: -30, y: -30 },
    bottom_right: { x: 30, y: -30 },
    point_01: { x: -8, y: 30 },
    point_13: { x: 24, y: 14 },
    point_28: { x: 8, y: -30 },
  };
  const BUILTIN_TEMPLATE_MODEL_VERSION = "rm2026-visible-corner-centered-v3";
  const PREVIOUS_BUILTIN_TEMPLATE_MODEL_VERSION = "rm2026-centered-80mm-v1";
  const VISIBLE_CORNER_ANCHOR_MODEL = {
    top_left: { x: 8, y: 8 },
    top_right: { x: 72, y: 8 },
    bottom_left: { x: 8, y: 72 },
    bottom_right: { x: 72, y: 72 },
  };
  const BORDER_FRAME_ANCHOR_MODEL = {
    top_left: { x: 0, y: 0 },
    top_right: { x: 80, y: 0 },
    bottom_left: { x: 0, y: 80 },
    bottom_right: { x: 80, y: 80 },
  };

  const defaultTemplate = buildCenteredPhysicalTemplate();

  function buildCenteredPhysicalTemplate() {
    const lines = {
      xOuterLeft: 8,
      xInnerLeft: 14.8425,
      xCenterLeft: 31.9425,
      xCenterRight: 48.0375,
      xSquareRightLeft: 54.615,
      xTopRightLeft: 61.26,
      xRightInner: 65.7317,
      xOuterRight: 72,
      yTop: 8,
      yRow14: 14.1783,
      yRow18: 18.485,
      yRow26: 25.605,
      yRow32: 31.96,
      yRow48: 48.2275,
      yRow66: 65.6475,
      yBottom: 72,
    };

    const borderSpacePoints = [
      // The 4 manual anchors remain the visible blue light-strip corners.
      { id: "top_left", label: "top_left", x: lines.xOuterLeft, y: lines.yTop, anchor: true },
      { id: "top_right", label: "top_right", x: lines.xOuterRight, y: lines.yTop, anchor: true },
      { id: "bottom_left", label: "bottom_left", x: lines.xOuterLeft, y: lines.yBottom, anchor: true },
      { id: "bottom_right", label: "bottom_right", x: lines.xOuterRight, y: lines.yBottom, anchor: true },

      // The remaining points are rebuilt from shared x/y line families so that
      // physically parallel strip edges stay collinear in the model plane.
      { id: "point_01", label: "point_01", x: lines.xCenterLeft, y: lines.yTop },
      { id: "point_02", label: "point_02", x: lines.xCenterRight, y: lines.yTop },
      { id: "point_03", label: "point_03", x: lines.xSquareRightLeft, y: lines.yTop },
      { id: "point_04", label: "point_04", x: lines.xTopRightLeft, y: lines.yTop },
      { id: "point_05", label: "point_05", x: lines.xInnerLeft, y: lines.yRow14 },
      { id: "point_06", label: "point_06", x: lines.xCenterLeft, y: lines.yRow14 },
      { id: "point_07", label: "point_07", x: lines.xCenterRight, y: lines.yRow14 },
      { id: "point_08", label: "point_08", x: lines.xSquareRightLeft, y: lines.yRow14 },
      { id: "point_09", label: "point_09", x: lines.xTopRightLeft, y: lines.yRow14 },
      { id: "point_10", label: "point_10", x: lines.xRightInner, y: lines.yRow14 },
      { id: "point_11", label: "point_11", x: lines.xRightInner, y: lines.yRow18 },
      { id: "point_12", label: "point_12", x: lines.xOuterRight, y: lines.yRow18 },
      { id: "point_13", label: "point_13", x: lines.xRightInner, y: lines.yRow26 },
      { id: "point_14", label: "point_14", x: lines.xOuterRight, y: lines.yRow26 },
      { id: "point_15", label: "point_15", x: lines.xOuterLeft, y: lines.yRow32 },
      { id: "point_16", label: "point_16", x: lines.xInnerLeft, y: lines.yRow32 },
      { id: "point_17", label: "point_17", x: lines.xRightInner, y: lines.yRow32 },
      { id: "point_18", label: "point_18", x: lines.xOuterRight, y: lines.yRow32 },
      { id: "point_19", label: "point_19", x: lines.xOuterLeft, y: lines.yRow48 },
      { id: "point_20", label: "point_20", x: lines.xInnerLeft, y: lines.yRow48 },
      { id: "point_21", label: "point_21", x: lines.xRightInner, y: lines.yRow48 },
      { id: "point_22", label: "point_22", x: lines.xOuterRight, y: lines.yRow48 },
      { id: "point_23", label: "point_23", x: lines.xInnerLeft, y: lines.yRow66 },
      { id: "point_24", label: "point_24", x: lines.xCenterLeft, y: lines.yRow66 },
      { id: "point_25", label: "point_25", x: lines.xCenterRight, y: lines.yRow66 },
      { id: "point_26", label: "point_26", x: lines.xRightInner, y: lines.yRow66 },
      { id: "point_27", label: "point_27", x: lines.xCenterLeft, y: lines.yBottom },
      { id: "point_28", label: "point_28", x: lines.xCenterRight, y: lines.yBottom },
    ].map(toCenteredPhysicalPoint);

    return {
      name: "RM 2026 MARK Split Points",
      units: "mm",
      anchorOrder: ["top_left", "top_right", "bottom_left", "bottom_right"],
      points: borderSpacePoints,
      edges: [
      ["top_left", "point_01"],
      ["point_01", "point_06"],
      ["point_06", "point_05"],
      ["point_05", "point_16"],
      ["point_16", "point_15"],
      ["point_15", "top_left"],

      ["point_02", "point_03"],
      ["point_03", "point_08"],
      ["point_08", "point_07"],
      ["point_07", "point_02"],

      ["point_04", "top_right"],
      ["top_right", "point_12"],
      ["point_12", "point_11"],
      ["point_11", "point_10"],
      ["point_10", "point_09"],
      ["point_09", "point_04"],

      ["point_13", "point_14"],
      ["point_14", "point_18"],
      ["point_18", "point_17"],
      ["point_17", "point_13"],

      ["point_19", "point_20"],
      ["point_20", "point_23"],
      ["point_23", "point_24"],
      ["point_24", "point_27"],
      ["point_27", "bottom_left"],
      ["bottom_left", "point_19"],

      ["point_25", "point_26"],
      ["point_26", "point_21"],
      ["point_21", "point_22"],
      ["point_22", "bottom_right"],
      ["bottom_right", "point_28"],
      ["point_28", "point_25"],
      ],
    };
  }

  function toCenteredPhysicalPoint(point) {
    return {
      ...point,
      x: roundNumber(point.x - 40, 3),
      y: roundNumber(40 - point.y, 3),
    };
  }

  const state = {
    template: normalizeTemplate(defaultTemplate),
    images: [],
    currentImageIndex: -1,
    annotations: {},
    selectedPointId: null,
    showLabels: true,
    showEdges: true,
    exportFormat: EXPORT_FORMATS.JSON,
    view: {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      fittedImageId: null,
      userAdjusted: false,
    },
    drag: {
      mode: null,
      pointId: null,
      startMouseX: 0,
      startMouseY: 0,
      startOffsetX: 0,
      startOffsetY: 0,
    },
  };

  let persistTimer = null;

  const els = {
    imageFolderInput: document.getElementById("imageFolderInput"),
    prevImageButton: document.getElementById("prevImageButton"),
    nextImageButton: document.getElementById("nextImageButton"),
    datasetSummary: document.getElementById("datasetSummary"),
    templateInput: document.getElementById("templateInput"),
    templateSummary: document.getElementById("templateSummary"),
    restoreTemplateButton: document.getElementById("restoreTemplateButton"),
    toggleTemplateEditorButton: document.getElementById("toggleTemplateEditorButton"),
    templateEditorWrap: document.getElementById("templateEditorWrap"),
    templateEditor: document.getElementById("templateEditor"),
    applyTemplateButton: document.getElementById("applyTemplateButton"),
    anchorProgress: document.getElementById("anchorProgress"),
    confirmAnchorsButton: document.getElementById("confirmAnchorsButton"),
    resetCurrentButton: document.getElementById("resetCurrentButton"),
    fitViewButton: document.getElementById("fitViewButton"),
    showLabelsCheckbox: document.getElementById("showLabelsCheckbox"),
    showEdgesCheckbox: document.getElementById("showEdgesCheckbox"),
    selectedPointCard: document.getElementById("selectedPointCard"),
    visibility0Button: document.getElementById("visibility0Button"),
    visibility1Button: document.getElementById("visibility1Button"),
    visibility2Button: document.getElementById("visibility2Button"),
    pointList: document.getElementById("pointList"),
    exportFormatSelect: document.getElementById("exportFormatSelect"),
    exportCurrentButton: document.getElementById("exportCurrentButton"),
    exportAllButton: document.getElementById("exportAllButton"),
    annotationInput: document.getElementById("annotationInput"),
    imageTitle: document.getElementById("imageTitle"),
    imageMeta: document.getElementById("imageMeta"),
    canvasWrap: document.getElementById("canvasWrap"),
    canvas: document.getElementById("stageCanvas"),
    emptyState: document.getElementById("emptyState"),
  };

  const ctx = els.canvas.getContext("2d");

  bootstrap();

  function bootstrap() {
    hydrateFromStorage();
    bindEvents();
    syncTemplateEditor();
    render();
  }

  function bindEvents() {
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeydown);

    els.imageFolderInput.addEventListener("change", handleImageFolderInput);
    els.prevImageButton.addEventListener("click", () => stepImage(-1));
    els.nextImageButton.addEventListener("click", () => stepImage(1));

    els.templateInput.addEventListener("change", handleTemplateInput);
    els.restoreTemplateButton.addEventListener("click", restoreDefaultTemplate);
    els.toggleTemplateEditorButton.addEventListener("click", toggleTemplateEditor);
    els.applyTemplateButton.addEventListener("click", applyTemplateFromEditor);

    els.confirmAnchorsButton.addEventListener("click", toggleAnchorConfirmation);
    els.resetCurrentButton.addEventListener("click", resetCurrentAnnotation);
    els.fitViewButton.addEventListener("click", fitCurrentImage);
    els.showLabelsCheckbox.addEventListener("change", () => {
      state.showLabels = els.showLabelsCheckbox.checked;
      persistStateSoon();
      render();
    });
    els.showEdgesCheckbox.addEventListener("change", () => {
      state.showEdges = els.showEdgesCheckbox.checked;
      persistStateSoon();
      render();
    });
    els.exportFormatSelect.addEventListener("change", () => {
      const format = els.exportFormatSelect.value;
      state.exportFormat =
        format === EXPORT_FORMATS.TXT ? EXPORT_FORMATS.TXT : EXPORT_FORMATS.JSON;
      persistStateSoon();
    });

    els.visibility0Button.addEventListener("click", () => setSelectedPointVisibility(0));
    els.visibility1Button.addEventListener("click", () => setSelectedPointVisibility(1));
    els.visibility2Button.addEventListener("click", () => setSelectedPointVisibility(2));

    els.exportCurrentButton.addEventListener("click", exportCurrentAnnotation);
    els.exportAllButton.addEventListener("click", exportAllAnnotations);
    els.annotationInput.addEventListener("change", handleAnnotationImport);

    els.canvas.addEventListener("mousedown", handleCanvasMouseDown);
    els.canvas.addEventListener("mousemove", handleCanvasMouseMove);
    els.canvas.addEventListener("mouseup", handleCanvasMouseUp);
    els.canvas.addEventListener("mouseleave", handleCanvasMouseUp);
    els.canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
    els.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function handleResize() {
    if (currentImage()) {
      if (!state.view.userAdjusted) {
        state.view.fittedImageId = null;
      }
      render();
      return;
    }
    resizeCanvas();
    render();
  }

  function handleKeydown(event) {
    if (event.target && ["TEXTAREA", "INPUT", "SELECT"].includes(event.target.tagName)) {
      return;
    }

    if (event.key === "a" || event.key === "A") {
      stepImage(-1);
      event.preventDefault();
      return;
    }

    if (event.key === "d" || event.key === "D") {
      stepImage(1);
      event.preventDefault();
      return;
    }

    if (event.key === "0" || event.key === "1" || event.key === "2") {
      setSelectedPointVisibility(Number(event.key));
      event.preventDefault();
      return;
    }

    if (event.key === "v" || event.key === "V") {
      cycleSelectedPointVisibility();
      event.preventDefault();
      return;
    }

    if (event.key === "Enter") {
      toggleAnchorConfirmation();
      event.preventDefault();
    }
  }

  function handleImageFolderInput(event) {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) {
      return;
    }

    for (const existing of state.images) {
      URL.revokeObjectURL(existing.url);
    }

    state.images = files
      .sort((a, b) => {
        const aName = a.webkitRelativePath || a.name;
        const bName = b.webkitRelativePath || b.name;
        return aName.localeCompare(bName, "zh-Hans-CN");
      })
      .map((file) => {
        const id = file.webkitRelativePath || file.name;
        return {
          id,
          name: file.name,
          path: file.webkitRelativePath || file.name,
          file,
          url: URL.createObjectURL(file),
          element: null,
          naturalWidth: 0,
          naturalHeight: 0,
        };
      });

    state.currentImageIndex = 0;
    state.selectedPointId = null;
    resetViewForImage();
    persistStateSoon();

    render();
  }

  function handleTemplateInput(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        state.template = normalizeTemplate(upgradeLegacyDraftTemplate(parsed));
        state.selectedPointId = null;
        syncTemplateEditor();
        persistStateSoon();
        render();
      } catch (error) {
        alert("模板 JSON 解析失败：" + error.message);
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  function restoreDefaultTemplate() {
    state.template = normalizeTemplate(defaultTemplate);
    state.selectedPointId = null;
    syncTemplateEditor();
    persistStateSoon();
    render();
  }

  function toggleTemplateEditor() {
    els.templateEditorWrap.classList.toggle("hidden");
  }

  function applyTemplateFromEditor() {
    try {
      const parsed = JSON.parse(els.templateEditor.value);
      state.template = normalizeTemplate(upgradeLegacyDraftTemplate(parsed));
      state.selectedPointId = null;
      persistStateSoon();
      render();
    } catch (error) {
      alert("模板 JSON 解析失败：" + error.message);
    }
  }

  function handleAnnotationImport(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        mergeImportedAnnotations(parsed);
        persistStateSoon();
        render();
      } catch (error) {
        alert("标注 JSON 解析失败：" + error.message);
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  function handleCanvasWheel(event) {
    const image = currentImage();
    if (!image) {
      return;
    }
    event.preventDefault();
    const { x, y } = getCanvasPointer(event);
    const zoomFactor = event.deltaY < 0 ? 1.08 : 0.92;
    const oldScale = state.view.scale;
    const newScale = clamp(oldScale * zoomFactor, 0.1, 20);
    const imagePoint = screenToImage(x, y);
    state.view.scale = newScale;
    state.view.offsetX = x - imagePoint.x * newScale;
    state.view.offsetY = y - imagePoint.y * newScale;
    state.view.userAdjusted = true;
    render();
  }

  function handleCanvasMouseDown(event) {
    const image = currentImage();
    if (!image) {
      return;
    }

    const pointer = getCanvasPointer(event);

    if (event.button === 2) {
      state.drag.mode = "pan";
      state.drag.startMouseX = pointer.x;
      state.drag.startMouseY = pointer.y;
      state.drag.startOffsetX = state.view.offsetX;
      state.drag.startOffsetY = state.view.offsetY;
      return;
    }

    if (event.button !== 0) {
      return;
    }

    const hit = hitTestPoint(pointer.x, pointer.y);
    if (hit) {
      state.selectedPointId = hit.id;
      if (hit.isAnchor) {
        state.drag.mode = "anchor";
        state.drag.pointId = hit.id;
      } else {
        state.drag.mode = null;
        state.drag.pointId = null;
      }
      render();
      return;
    }

    const imagePoint = screenToImage(pointer.x, pointer.y);
    if (!pointInImageBounds(imagePoint, image)) {
      return;
    }

    const missingAnchorId = nextMissingAnchorId();
    if (missingAnchorId) {
      setAnchorPoint(missingAnchorId, imagePoint.x, imagePoint.y, 2);
      state.selectedPointId = missingAnchorId;
      persistStateSoon();
      render();
      return;
    }

    state.selectedPointId = null;
    render();
  }

  function handleCanvasMouseMove(event) {
    const image = currentImage();
    if (!image) {
      return;
    }

    if (state.drag.mode === "pan") {
      const pointer = getCanvasPointer(event);
      state.view.offsetX = state.drag.startOffsetX + (pointer.x - state.drag.startMouseX);
      state.view.offsetY = state.drag.startOffsetY + (pointer.y - state.drag.startMouseY);
      state.view.userAdjusted = true;
      render();
      return;
    }

    if (state.drag.mode === "anchor" && state.drag.pointId) {
      const pointer = getCanvasPointer(event);
      const imagePoint = screenToImage(pointer.x, pointer.y);
      setAnchorPoint(
        state.drag.pointId,
        clamp(imagePoint.x, 0, image.naturalWidth),
        clamp(imagePoint.y, 0, image.naturalHeight),
        getAnnotation().visibility[state.drag.pointId] ?? 2
      );
      persistStateSoon();
      render();
    }
  }

  function handleCanvasMouseUp() {
    state.drag.mode = null;
    state.drag.pointId = null;
  }

  function stepImage(direction) {
    if (!state.images.length) {
      return;
    }
    const nextIndex = clamp(state.currentImageIndex + direction, 0, state.images.length - 1);
    if (nextIndex === state.currentImageIndex) {
      return;
    }
    state.currentImageIndex = nextIndex;
    state.selectedPointId = null;
    resetViewForImage();
    render();
  }

  function resetCurrentAnnotation() {
    const image = currentImage();
    if (!image) {
      return;
    }
    delete state.annotations[image.id];
    state.selectedPointId = null;
    persistStateSoon();
    render();
  }

  function fitCurrentImage() {
    const image = currentImage();
    if (!image || !image.naturalWidth || !image.naturalHeight) {
      return;
    }

    applyFitView(image);
    state.view.userAdjusted = false;
    render();
  }

  function applyFitView(image) {
    resizeCanvas();
    const wrapWidth = els.canvas.clientWidth;
    const wrapHeight = els.canvas.clientHeight;
    const scale = Math.min(wrapWidth / image.naturalWidth, wrapHeight / image.naturalHeight) * 0.96;
    state.view.scale = Math.max(scale, 0.05);
    state.view.offsetX = (wrapWidth - image.naturalWidth * state.view.scale) / 2;
    state.view.offsetY = (wrapHeight - image.naturalHeight * state.view.scale) / 2;
    state.view.fittedImageId = image.id;
  }

  function resetViewForImage() {
    state.view.scale = 1;
    state.view.offsetX = 0;
    state.view.offsetY = 0;
    state.view.fittedImageId = null;
    state.view.userAdjusted = false;
  }

  function setAnchorPoint(anchorId, x, y, visibility) {
    const annotation = getAnnotation();
    annotation.anchors[anchorId] = { x, y };
    annotation.visibility[anchorId] = visibility;
  }

  function nextMissingAnchorId() {
    const annotation = getAnnotation();
    return state.template.anchorOrder.find((id) => !annotation.anchors[id]) || null;
  }

  function getAnnotation() {
    const image = currentImage();
    if (!image) {
      return createEmptyAnnotation();
    }
    if (!state.annotations[image.id]) {
      state.annotations[image.id] = createEmptyAnnotation();
    }
    return state.annotations[image.id];
  }

  function createEmptyAnnotation() {
    return {
      anchors: {},
      visibility: {},
      confirmed: false,
    };
  }

  function hasAllAnchors(annotation = getAnnotation()) {
    return state.template.anchorOrder.every((id) => annotation.anchors[id]);
  }

  function isAnnotationConfirmed(annotation = getAnnotation()) {
    return hasAllAnchors(annotation) && Boolean(annotation.confirmed);
  }

  function toggleAnchorConfirmation() {
    const image = currentImage();
    if (!image) {
      return;
    }
    const annotation = getAnnotation();
    if (!hasAllAnchors(annotation)) {
      return;
    }
    annotation.confirmed = !annotation.confirmed;
    if (!annotation.confirmed && state.selectedPointId && !state.template.anchorSet.has(state.selectedPointId)) {
      state.selectedPointId = null;
    }
    persistStateSoon();
    render();
  }

  function currentImage() {
    return state.images[state.currentImageIndex] || null;
  }

  function ensureImageLoaded(image) {
    if (!image) {
      return Promise.resolve(null);
    }
    if (image.element && image.naturalWidth && image.naturalHeight) {
      return Promise.resolve(image);
    }

    return new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => {
        image.element = element;
        image.naturalWidth = element.naturalWidth;
        image.naturalHeight = element.naturalHeight;
        resolve(image);
      };
      element.onerror = reject;
      element.src = image.url;
    });
  }

  function projectCurrentPoints() {
    const annotation = getAnnotation();
    const projection = buildProjectedPointMapForAnnotation(annotation, currentImage());
    if (!projection.homography) {
      return {
        homography: null,
        points: [],
      };
    }

    const points = state.template.points.map((point) => {
      const projected = projection.pointMap.get(point.id);
      const visibility =
        annotation.visibility[point.id] !== undefined ? annotation.visibility[point.id] : 2;
      return {
        id: point.id,
        label: point.label || point.id,
        x: projected ? projected.x : NaN,
        y: projected ? projected.y : NaN,
        visibility,
        anchor: point.anchor,
      };
    });

    return { homography: projection.homography, points };
  }

  function getAnchorDisplayPoints(annotation = getAnnotation()) {
    return state.template.anchorOrder
      .filter((id) => annotation.anchors[id])
      .map((id) => ({
        id,
        label: state.template.pointMap[id].label || id,
        x: annotation.anchors[id].x,
        y: annotation.anchors[id].y,
        visibility: annotation.visibility[id] !== undefined ? annotation.visibility[id] : 2,
        anchor: true,
      }));
  }

  function getRenderablePoints() {
    const annotation = getAnnotation();
    if (!isAnnotationConfirmed(annotation)) {
      return getAnchorDisplayPoints(annotation);
    }
    return projectCurrentPoints().points;
  }

  function render() {
    resizeCanvas();

    const image = currentImage();
    els.emptyState.classList.toggle("hidden", Boolean(image));
    updateSidebarStatus();

    ctx.clearRect(0, 0, els.canvas.clientWidth, els.canvas.clientHeight);

    if (!image) {
      renderPointList([]);
      renderSelectedPoint(null);
      return;
    }

    ensureImageLoaded(image)
      .then(() => {
        if (image !== currentImage()) {
          return;
        }
        if (state.view.fittedImageId !== image.id) {
          applyFitView(image);
        }
        drawStage(image);
        const points = getRenderablePoints();
        renderPointList(points);
        renderSelectedPoint(points.find((point) => point.id === state.selectedPointId) || null);
      })
      .catch(() => {
        renderPointList([]);
        renderSelectedPoint(null);
      });
  }

  function drawStage(image) {
    ctx.clearRect(0, 0, els.canvas.clientWidth, els.canvas.clientHeight);
    ctx.save();
    ctx.translate(state.view.offsetX, state.view.offsetY);
    ctx.scale(state.view.scale, state.view.scale);
    ctx.drawImage(image.element, 0, 0, image.naturalWidth, image.naturalHeight);

    const annotation = getAnnotation();
    const points = getRenderablePoints();
    const pointMap = new Map(points.map((point) => [point.id, point]));

    if (state.showEdges && isAnnotationConfirmed(annotation)) {
      ctx.lineWidth = 2 / state.view.scale;
      ctx.strokeStyle = "rgba(23, 113, 99, 0.88)";
      for (const [fromId, toId] of state.template.edges) {
        const from = pointMap.get(fromId);
        const to = pointMap.get(toId);
        if (!from || !to) {
          continue;
        }
        if (from.visibility === 0 || to.visibility === 0) {
          continue;
        }
        ctx.beginPath();
        if (from.visibility === 1 || to.visibility === 1) {
          ctx.setLineDash([6 / state.view.scale, 6 / state.view.scale]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    for (const point of points) {
      drawPoint(point);
    }

    ctx.restore();
  }

  function drawPoint(point) {
    const color = point.visibility === 2 ? "#0087d7" : point.visibility === 1 ? "#ca6f32" : "#7f7f7f";
    const radius = point.anchor ? 6 : 5;

    ctx.beginPath();
    ctx.fillStyle = point.visibility === 0 ? "rgba(127, 127, 127, 0.18)" : color;
    ctx.strokeStyle = point.id === state.selectedPointId ? "#b54032" : "#ffffff";
    ctx.lineWidth = point.id === state.selectedPointId ? 3 / state.view.scale : 2 / state.view.scale;
    ctx.arc(point.x, point.y, radius / state.view.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (!state.showLabels) {
      return;
    }

    ctx.font = `${12 / state.view.scale}px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
    ctx.lineWidth = 4 / state.view.scale;
    const label = point.label || point.id;
    ctx.strokeText(label, point.x + 8 / state.view.scale, point.y - 8 / state.view.scale);
    ctx.fillText(label, point.x + 8 / state.view.scale, point.y - 8 / state.view.scale);
  }

  function renderPointList(points) {
    const fragment = document.createDocumentFragment();
    if (!points.length) {
      const empty = document.createElement("div");
      empty.className = "status-block";
      empty.textContent = "先按顺序点四个角点，确认后这里会出现全部关键点。";
      els.pointList.replaceChildren(empty);
      return;
    }

    for (const point of points) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "point-item" + (point.id === state.selectedPointId ? " selected" : "");
      item.addEventListener("click", () => {
        state.selectedPointId = point.id;
        render();
      });

      const info = document.createElement("div");
      const name = document.createElement("div");
      name.className = "point-item-name";
      name.textContent = point.label || point.id;
      const meta = document.createElement("div");
      meta.className = "point-item-meta";
      meta.textContent = `x=${formatNumber(point.x)} y=${formatNumber(point.y)} ${point.anchor ? "手工角点" : "自动投影"}`;
      info.append(name, meta);

      const tag = document.createElement("div");
      tag.className = `vis-tag vis-${point.visibility}`;
      tag.textContent = VISIBILITY_LABELS[point.visibility];

      item.append(info, tag);
      fragment.appendChild(item);
    }

    els.pointList.replaceChildren(fragment);
  }

  function renderSelectedPoint(point) {
    if (!point) {
      els.selectedPointCard.className = "selected-point empty";
      els.selectedPointCard.textContent = "还没有选中点。";
      return;
    }

    els.selectedPointCard.className = "selected-point";
    els.selectedPointCard.innerHTML =
      `<strong>${escapeHtml(point.label || point.id)}</strong><br>` +
      `id: ${escapeHtml(point.id)}<br>` +
      `x: ${formatNumber(point.x)}<br>` +
      `y: ${formatNumber(point.y)}<br>` +
      `visibility: ${point.visibility} / ${VISIBILITY_LABELS[point.visibility]}<br>` +
      `${point.anchor ? "类型: 手工角点" : "类型: 自动投影点"}`;
  }

  function updateSidebarStatus() {
    const image = currentImage();
    const total = state.images.length;
    const completed = state.images.reduce((count, current) => {
      const annotation = state.annotations[current.id];
      if (!annotation) {
        return count;
      }
      return count + (isAnnotationConfirmed(annotation) ? 1 : 0);
    }, 0);

    els.datasetSummary.textContent = total
      ? `已载入 ${total} 张图片，已完成四角标注 ${completed} 张。`
      : "还没有载入图片。";

    els.templateSummary.textContent =
      `${state.template.name} | 单位: ${state.template.units || "mm"} | ` +
      `${state.template.points.length} 个点，${state.template.edges.length} 条连线。`;

    const annotation = getAnnotation();
    const anchorStates = state.template.anchorOrder.map((id, index) => {
      const done = Boolean(annotation.anchors[id]);
      return `${index + 1}. ${id}${done ? " 已完成" : " 待点选"}`;
    });
    const statusSuffix = isAnnotationConfirmed(annotation)
      ? " | 已确认四角，自动点已显示"
      : hasAllAnchors(annotation)
        ? " | 四角已录入，点击“确认四角”生成其余点"
        : "";
    els.anchorProgress.textContent = anchorStates.join(" | ") + statusSuffix;
    els.confirmAnchorsButton.disabled = !hasAllAnchors(annotation);
    els.confirmAnchorsButton.textContent = isAnnotationConfirmed(annotation) ? "重新编辑四角" : "确认四角";

    if (!image) {
      els.imageTitle.textContent = "未载入图片";
      els.imageMeta.textContent = "";
      els.confirmAnchorsButton.disabled = true;
      els.confirmAnchorsButton.textContent = "确认四角";
      return;
    }

    els.imageTitle.textContent = image.path;
    els.imageMeta.textContent =
      `第 ${state.currentImageIndex + 1} / ${total} 张` +
      (image.naturalWidth && image.naturalHeight
        ? ` | ${image.naturalWidth} x ${image.naturalHeight}`
        : "");
  }

  function setSelectedPointVisibility(value) {
    if (![0, 1, 2].includes(value)) {
      return;
    }
    const image = currentImage();
    if (!image || !state.selectedPointId) {
      return;
    }
    if (!getRenderablePoints().some((point) => point.id === state.selectedPointId)) {
      return;
    }
    const annotation = getAnnotation();
    annotation.visibility[state.selectedPointId] = value;
    persistStateSoon();
    render();
  }

  function cycleSelectedPointVisibility() {
    const point = getRenderablePoints().find((item) => item.id === state.selectedPointId);
    if (!point) {
      return;
    }
    setSelectedPointVisibility((point.visibility + 1) % 3);
  }

  async function exportCurrentAnnotation() {
    const image = currentImage();
    if (!image) {
      return;
    }
    await ensureImageLoaded(image);
    const payload = buildExportRecord(image);
    if (state.exportFormat === EXPORT_FORMATS.TXT) {
      downloadText(`${safeFileStem(image.name)}.annotation.txt`, buildTxtExportContent([payload]));
      return;
    }
    downloadJson(`${safeFileStem(image.name)}.annotation.json`, payload);
  }

  async function exportAllAnnotations() {
    await Promise.all(state.images.map((image) => ensureImageLoaded(image)));
    const payload = state.images.map((image) => buildExportRecord(image));
    if (state.exportFormat === EXPORT_FORMATS.TXT) {
      downloadText("rm-mark-annotations.txt", buildTxtExportContent(payload));
      return;
    }
    downloadJson("rm-mark-annotations.json", payload);
  }

  function buildExportRecord(image) {
    const annotation = state.annotations[image.id] || createEmptyAnnotation();
    const projected = buildProjectedPointsForImage(image.id);
    return {
      id: image.id,
      imageName: image.name,
      imageWidth: image.naturalWidth || null,
      imageHeight: image.naturalHeight || null,
      template: state.template.name,
      templateModel:
        state.template.name === defaultTemplate.name ? BUILTIN_TEMPLATE_MODEL_VERSION : undefined,
      complete: isAnnotationConfirmed(annotation),
      points: state.template.points.map((point) => {
        const projectedPoint = projected.get(point.id);
        return {
          id: point.id,
          x: projectedPoint ? roundNumber(projectedPoint.x, 3) : null,
          y: projectedPoint ? roundNumber(projectedPoint.y, 3) : null,
          visibility: annotation.visibility[point.id] !== undefined ? annotation.visibility[point.id] : 2,
        };
      }),
    };
  }

  function buildTxtExportContent(records) {
    return records.map((record) => buildTxtExportLine(record)).join("\n") + "\n";
  }

  function buildTxtExportLine(record) {
    const pointTokens = record.points.map((point) => {
      const x = formatTxtNumber(point.x);
      const y = formatTxtNumber(point.y);
      const visibility = typeof point.visibility === "number" ? point.visibility : 2;
      return `${point.id}(${x},${y},${visibility})`;
    });
    return [record.id, ...pointTokens].join(" ");
  }

  function formatTxtNumber(value) {
    if (!Number.isFinite(value)) {
      return "null";
    }
    return String(roundNumber(value, 3));
  }

  function buildProjectedPointsForImage(imageId) {
    const annotation = state.annotations[imageId];
    if (!annotation) {
      return new Map();
    }

    if (!isAnnotationConfirmed(annotation)) {
      const partial = new Map();
      for (const point of state.template.points) {
        if (annotation.anchors[point.id]) {
          partial.set(point.id, {
            x: annotation.anchors[point.id].x,
            y: annotation.anchors[point.id].y,
          });
        }
      }
      return partial;
    }

    const image = state.images.find((item) => item.id === imageId) || null;
    return buildProjectedPointMapForAnnotation(annotation, image).pointMap;
  }

  function mergeImportedAnnotations(payload) {
    const records = Array.isArray(payload) ? payload : [payload];
    for (const record of records) {
      if (!record || !record.id || !Array.isArray(record.points)) {
        continue;
      }
      const merged = {
        anchors: {},
        visibility: {},
        confirmed: Boolean(record.complete || record.confirmed),
      };
      for (const point of record.points) {
        if (!point || typeof point.id !== "string") {
          continue;
        }
        if (typeof point.visibility === "number") {
          merged.visibility[point.id] = clamp(Math.round(point.visibility), 0, 2);
        }
        if (
          state.template.anchorSet.has(point.id) &&
          typeof point.x === "number" &&
          typeof point.y === "number"
        ) {
          merged.anchors[point.id] = { x: point.x, y: point.y };
        }
      }
      if (shouldMigrateLegacyAnnotationRecord(record)) {
        merged.anchors = migrateBorderFrameAnchorsToVisibleCorners(merged.anchors);
      }
      state.annotations[record.id] = merged;
    }
  }

  function normalizeTemplate(template) {
    if (!template || typeof template !== "object") {
      throw new Error("模板必须是对象。");
    }
    if (!Array.isArray(template.points) || !template.points.length) {
      throw new Error("模板 points 不能为空。");
    }
    const points = template.points.map((point) => {
      if (!point || typeof point.id !== "string") {
        throw new Error("每个点都需要字符串 id。");
      }
      if (typeof point.x !== "number" || typeof point.y !== "number") {
        throw new Error(`点 ${point.id} 的 x / y 必须是数字。`);
      }
      return {
        id: point.id,
        label: point.label || point.id,
        x: point.x,
        y: point.y,
        anchor: Boolean(point.anchor),
      };
    });

    const pointMap = Object.create(null);
    for (const point of points) {
      if (pointMap[point.id]) {
        throw new Error(`点 id 重复：${point.id}`);
      }
      pointMap[point.id] = point;
    }

    const inferredAnchorOrder = points.filter((point) => point.anchor).map((point) => point.id);
    const anchorOrder = Array.isArray(template.anchorOrder) && template.anchorOrder.length
      ? template.anchorOrder.slice()
      : inferredAnchorOrder;

    if (anchorOrder.length !== 4) {
      throw new Error("模板必须有 4 个 anchorOrder 点。");
    }
    for (const anchorId of anchorOrder) {
      if (!pointMap[anchorId]) {
        throw new Error(`anchorOrder 中的点不存在：${anchorId}`);
      }
      pointMap[anchorId].anchor = true;
    }

    const edges = Array.isArray(template.edges)
      ? template.edges.map((edge) => {
          if (!Array.isArray(edge) || edge.length !== 2) {
            throw new Error("每条 edge 必须是长度为 2 的数组。");
          }
          if (!pointMap[edge[0]] || !pointMap[edge[1]]) {
            throw new Error(`edge 引用了不存在的点：${edge.join(" -> ")}`);
          }
          return [edge[0], edge[1]];
        })
      : [];

    return {
      name: template.name || "Unnamed template",
      units: template.units || "mm",
      anchorOrder,
      anchorSet: new Set(anchorOrder),
      points,
      pointMap,
      edges,
      ...buildTemplateLineFamilies(points, edges, pointMap, anchorOrder),
    };
  }

  function buildTemplateLineFamilies(points, edges, pointMap, anchorOrder) {
    const anchorSet = new Set(anchorOrder);
    const familyMap = new Map();
    const pointFamilyMap = Object.create(null);
    const tolerance = 1e-6;

    const getFamilyKey = (axis, value) => `${axis}:${roundNumber(value, 4).toFixed(4)}`;
    const ensureFamily = (axis, value) => {
      const key = getFamilyKey(axis, value);
      if (!familyMap.has(key)) {
        familyMap.set(key, {
          key,
          axis,
          modelValue: roundNumber(value, 4),
          pointIds: [],
          segments: [],
          anchorIds: [],
          locked: false,
        });
      }
      return familyMap.get(key);
    };

    for (const point of points) {
      pointFamilyMap[point.id] = Object.create(null);
      for (const axis of ["x", "y"]) {
        const family = ensureFamily(axis, point[axis]);
        family.pointIds.push(point.id);
        pointFamilyMap[point.id][axis] = family.key;
        if (anchorSet.has(point.id)) {
          family.anchorIds.push(point.id);
        }
      }
    }

    for (const [fromId, toId] of edges) {
      const from = pointMap[fromId];
      const to = pointMap[toId];
      if (!from || !to) {
        continue;
      }
      if (Math.abs(from.x - to.x) < tolerance) {
        ensureFamily("x", (from.x + to.x) / 2).segments.push([fromId, toId]);
      }
      if (Math.abs(from.y - to.y) < tolerance) {
        ensureFamily("y", (from.y + to.y) / 2).segments.push([fromId, toId]);
      }
    }

    const lineFamilies = Array.from(familyMap.values()).map((family) => ({
      ...family,
      anchorIds: Array.from(new Set(family.anchorIds)),
      locked: Array.from(new Set(family.anchorIds)).length >= 2,
    }));

    return {
      lineFamilies,
      pointFamilyMap,
    };
  }

  function buildProjectedPointMapForAnnotation(annotation, image) {
    const anchors = buildAnchorCorrespondences(annotation);
    if (anchors.some((item) => !item)) {
      return {
        homography: null,
        pointMap: buildPartialAnchorPointMap(annotation),
      };
    }

    const homography = solveHomography(anchors);
    if (!homography) {
      return {
        homography: null,
        pointMap: new Map(),
      };
    }

    const initialPointMap = buildInitialProjectedPointMap(annotation, homography);
    return {
      homography,
      pointMap: refineProjectedPointMapWithImage(initialPointMap, image),
    };
  }

  function buildAnchorCorrespondences(annotation) {
    return state.template.anchorOrder.map((id) => {
      const templatePoint = state.template.pointMap[id];
      const imagePoint = annotation.anchors[id];
      if (!templatePoint || !imagePoint) {
        return null;
      }
      return {
        modelX: templatePoint.x,
        modelY: templatePoint.y,
        imageX: imagePoint.x,
        imageY: imagePoint.y,
      };
    });
  }

  function buildPartialAnchorPointMap(annotation) {
    const partial = new Map();
    for (const point of state.template.points) {
      if (annotation.anchors[point.id]) {
        partial.set(point.id, {
          x: annotation.anchors[point.id].x,
          y: annotation.anchors[point.id].y,
        });
      }
    }
    return partial;
  }

  function buildInitialProjectedPointMap(annotation, homography) {
    const result = new Map();
    for (const point of state.template.points) {
      if (point.anchor && annotation.anchors[point.id]) {
        result.set(point.id, {
          x: annotation.anchors[point.id].x,
          y: annotation.anchors[point.id].y,
        });
        continue;
      }
      result.set(point.id, applyHomography(homography, point.x, point.y));
    }
    return result;
  }

  function refineProjectedPointMapWithImage(initialPointMap, image) {
    if (!image || !image.element || !image.naturalWidth || !image.naturalHeight) {
      return initialPointMap;
    }
    if (!Array.isArray(state.template.lineFamilies) || !state.template.lineFamilies.length) {
      return initialPointMap;
    }

    const analysis = getImageSignalAnalysis(image);
    if (!analysis) {
      return initialPointMap;
    }

    const familyLines = buildRefinedLineFamilies(initialPointMap, analysis);
    if (!familyLines.size) {
      return initialPointMap;
    }

    const refinedPointMap = new Map(initialPointMap);
    for (const point of state.template.points) {
      if (point.anchor) {
        continue;
      }
      const pointFamilies = state.template.pointFamilyMap[point.id];
      if (!pointFamilies) {
        continue;
      }
      const xLine = familyLines.get(pointFamilies.x);
      const yLine = familyLines.get(pointFamilies.y);
      if (!xLine || !yLine) {
        continue;
      }
      const intersection = intersectLines(xLine, yLine);
      if (!intersection || !Number.isFinite(intersection.x) || !Number.isFinite(intersection.y)) {
        continue;
      }
      refinedPointMap.set(point.id, intersection);
    }
    return refinedPointMap;
  }

  function buildRefinedLineFamilies(initialPointMap, analysis) {
    const shiftLimits = buildFamilyShiftLimits(initialPointMap);
    const familyLines = new Map();
    for (const family of state.template.lineFamilies) {
      const initialLine = buildInitialFamilyLine(family, initialPointMap);
      if (!initialLine) {
        continue;
      }
      if (family.locked || !family.segments.length) {
        familyLines.set(family.key, initialLine);
        continue;
      }
      const shift = estimateFamilyBoundaryShift(
        family,
        initialLine,
        initialPointMap,
        analysis,
        shiftLimits.get(family.key)
      );
      familyLines.set(family.key, shift === null ? initialLine : shiftLine(initialLine, shift));
    }
    return familyLines;
  }

  function buildFamilyShiftLimits(initialPointMap) {
    const groupedFamilies = {
      x: [],
      y: [],
    };
    for (const family of state.template.lineFamilies) {
      groupedFamilies[family.axis].push(family);
    }
    groupedFamilies.x.sort((left, right) => left.modelValue - right.modelValue);
    groupedFamilies.y.sort((left, right) => left.modelValue - right.modelValue);

    const limits = new Map();
    for (const axis of ["x", "y"]) {
      const axisFamilies = groupedFamilies[axis];
      for (let index = 0; index < axisFamilies.length; index += 1) {
        const family = axisFamilies[index];
        const adjacentGaps = [];
        if (index > 0) {
          const gapToPrev = estimateAdjacentFamilyGap(
            family,
            axisFamilies[index - 1],
            initialPointMap
          );
          if (Number.isFinite(gapToPrev)) {
            adjacentGaps.push(gapToPrev);
          }
        }
        if (index + 1 < axisFamilies.length) {
          const gapToNext = estimateAdjacentFamilyGap(
            family,
            axisFamilies[index + 1],
            initialPointMap
          );
          if (Number.isFinite(gapToNext)) {
            adjacentGaps.push(gapToNext);
          }
        }

        if (!adjacentGaps.length) {
          limits.set(family.key, 4);
          continue;
        }

        const minGap = Math.min(...adjacentGaps);
        limits.set(family.key, clamp(minGap * 0.3, 1.5, 6));
      }
    }
    return limits;
  }

  function estimateAdjacentFamilyGap(family, adjacentFamily, initialPointMap) {
    const familyCrossings = buildFamilyCrossingMap(family, initialPointMap);
    const adjacentCrossings = buildFamilyCrossingMap(adjacentFamily, initialPointMap);
    const distances = [];

    for (const [crossKey, point] of familyCrossings.entries()) {
      const adjacentPoint = adjacentCrossings.get(crossKey);
      if (!adjacentPoint) {
        continue;
      }
      distances.push(Math.hypot(adjacentPoint.x - point.x, adjacentPoint.y - point.y));
    }

    if (!distances.length) {
      return null;
    }

    distances.sort((left, right) => left - right);
    return distances[Math.floor(distances.length / 2)];
  }

  function buildFamilyCrossingMap(family, initialPointMap) {
    const crossings = new Map();
    for (const pointId of family.pointIds) {
      const projected = initialPointMap.get(pointId);
      if (!projected) {
        continue;
      }
      const pointFamilies = state.template.pointFamilyMap[pointId];
      if (!pointFamilies) {
        continue;
      }
      const crossKey = family.axis === "x" ? pointFamilies.y : pointFamilies.x;
      if (!crossKey) {
        continue;
      }
      crossings.set(crossKey, projected);
    }
    return crossings;
  }

  function buildInitialFamilyLine(family, initialPointMap) {
    const anchorPoints = family.anchorIds
      .map((id) => initialPointMap.get(id))
      .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
    if (anchorPoints.length >= 2) {
      const anchorLine = buildLineFromPoints(anchorPoints);
      if (anchorLine) {
        return anchorLine;
      }
    }

    const projectedPoints = family.pointIds
      .map((id) => initialPointMap.get(id))
      .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y));
    if (projectedPoints.length >= 2) {
      return buildLineFromPoints(projectedPoints);
    }

    if (family.segments.length) {
      const [fromId, toId] = family.segments[0];
      const from = initialPointMap.get(fromId);
      const to = initialPointMap.get(toId);
      if (from && to) {
        return buildLineFromPoints([from, to]);
      }
    }

    return null;
  }

  function estimateFamilyBoundaryShift(family, line, initialPointMap, analysis, shiftLimit) {
    const offsets = [];
    const normal = { x: -line.dir.y, y: line.dir.x };
    const searchRadius = clamp(shiftLimit ?? 4, 1.5, 10);

    for (const [fromId, toId] of family.segments) {
      const from = initialPointMap.get(fromId);
      const to = initialPointMap.get(toId);
      if (!from || !to) {
        continue;
      }
      const segmentLength = Math.hypot(to.x - from.x, to.y - from.y);
      const sampleCount = Math.max(3, Math.ceil(segmentLength / 12));
      for (let index = 0; index < sampleCount; index += 1) {
        const ratio = (index + 1) / (sampleCount + 1);
        const sample = {
          x: from.x + (to.x - from.x) * ratio,
          y: from.y + (to.y - from.y) * ratio,
        };
        const best = findBestBoundaryOffset(sample, normal, analysis, searchRadius);
        if (best) {
          offsets.push(best);
        }
      }
    }

    if (offsets.length < 2) {
      return null;
    }

    const sortedOffsets = offsets
      .map((item) => item.offset)
      .sort((left, right) => left - right);
    return sortedOffsets[Math.floor(sortedOffsets.length / 2)];
  }

  function findBestBoundaryOffset(basePoint, normal, analysis, searchRadius) {
    const gradientSpan = 1.5;
    const step = 0.5;
    let bestOffset = null;
    let bestScore = -Infinity;

    for (let offset = -searchRadius; offset <= searchRadius; offset += step) {
      const prev = sampleSignal(
        analysis,
        basePoint.x + normal.x * (offset - gradientSpan),
        basePoint.y + normal.y * (offset - gradientSpan)
      );
      const next = sampleSignal(
        analysis,
        basePoint.x + normal.x * (offset + gradientSpan),
        basePoint.y + normal.y * (offset + gradientSpan)
      );
      if (prev === null || next === null) {
        continue;
      }
      const gradient = Math.abs(next - prev);
      const score = gradient - Math.abs(offset) * 2;
      if (score > bestScore) {
        bestScore = score;
        bestOffset = offset;
      }
    }

    if (bestOffset === null || bestScore < 18) {
      return null;
    }

    return {
      offset: bestOffset,
      score: bestScore,
    };
  }

  function getImageSignalAnalysis(image) {
    if (!image || !image.element || !image.naturalWidth || !image.naturalHeight) {
      return null;
    }
    if (image.signalAnalysis) {
      return image.signalAnalysis;
    }

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return null;
    }
    context.drawImage(image.element, 0, 0, image.naturalWidth, image.naturalHeight);
    const imageData = context.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
    const signal = new Float32Array(image.naturalWidth * image.naturalHeight);
    for (let index = 0; index < signal.length; index += 1) {
      const offset = index * 4;
      const r = imageData.data[offset];
      const g = imageData.data[offset + 1];
      const b = imageData.data[offset + 2];
      signal[index] = g + b - r * 0.6;
    }

    image.signalAnalysis = {
      width: image.naturalWidth,
      height: image.naturalHeight,
      signal,
    };
    return image.signalAnalysis;
  }

  function sampleSignal(analysis, x, y) {
    if (
      !analysis ||
      x < 1 ||
      y < 1 ||
      x > analysis.width - 2 ||
      y > analysis.height - 2
    ) {
      return null;
    }

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    const tx = x - x0;
    const ty = y - y0;

    const s00 = analysis.signal[y0 * analysis.width + x0];
    const s10 = analysis.signal[y0 * analysis.width + x1];
    const s01 = analysis.signal[y1 * analysis.width + x0];
    const s11 = analysis.signal[y1 * analysis.width + x1];

    const top = s00 * (1 - tx) + s10 * tx;
    const bottom = s01 * (1 - tx) + s11 * tx;
    return top * (1 - ty) + bottom * ty;
  }

  function buildLineFromPoints(points) {
    if (!Array.isArray(points) || points.length < 2) {
      return null;
    }

    let centerX = 0;
    let centerY = 0;
    for (const point of points) {
      centerX += point.x;
      centerY += point.y;
    }
    centerX /= points.length;
    centerY /= points.length;

    let covXX = 0;
    let covXY = 0;
    let covYY = 0;
    for (const point of points) {
      const dx = point.x - centerX;
      const dy = point.y - centerY;
      covXX += dx * dx;
      covXY += dx * dy;
      covYY += dy * dy;
    }

    const angle = 0.5 * Math.atan2(2 * covXY, covXX - covYY);
    const dir = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    const magnitude = Math.hypot(dir.x, dir.y);
    if (magnitude < 1e-9) {
      return null;
    }

    return {
      point: {
        x: centerX,
        y: centerY,
      },
      dir: {
        x: dir.x / magnitude,
        y: dir.y / magnitude,
      },
    };
  }

  function shiftLine(line, offset) {
    return {
      point: {
        x: line.point.x - line.dir.y * offset,
        y: line.point.y + line.dir.x * offset,
      },
      dir: { ...line.dir },
    };
  }

  function intersectLines(lineA, lineB) {
    const cross = lineA.dir.x * lineB.dir.y - lineA.dir.y * lineB.dir.x;
    if (Math.abs(cross) < 1e-9) {
      return null;
    }

    const dx = lineB.point.x - lineA.point.x;
    const dy = lineB.point.y - lineA.point.y;
    const t = (dx * lineB.dir.y - dy * lineB.dir.x) / cross;
    return {
      x: lineA.point.x + lineA.dir.x * t,
      y: lineA.point.y + lineA.dir.y * t,
    };
  }

  function solveHomography(correspondences) {
    // Equivalent to the DLT-style homography solve behind OpenCV's
    // findHomography/getPerspectiveTransform for the 4-point planar case.
    const matrix = [];
    const values = [];

    for (const item of correspondences) {
      const x = item.modelX;
      const y = item.modelY;
      const u = item.imageX;
      const v = item.imageY;

      matrix.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
      values.push(u);
      matrix.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
      values.push(v);
    }

    const solution = solveLinearSystem(matrix, values);
    if (!solution) {
      return null;
    }

    return [
      [solution[0], solution[1], solution[2]],
      [solution[3], solution[4], solution[5]],
      [solution[6], solution[7], 1],
    ];
  }

  function solveLinearSystem(matrix, values) {
    const size = values.length;
    const augmented = matrix.map((row, index) => row.concat(values[index]));

    for (let pivot = 0; pivot < size; pivot += 1) {
      let maxRow = pivot;
      let maxValue = Math.abs(augmented[pivot][pivot]);
      for (let row = pivot + 1; row < size; row += 1) {
        const candidate = Math.abs(augmented[row][pivot]);
        if (candidate > maxValue) {
          maxValue = candidate;
          maxRow = row;
        }
      }

      if (maxValue < 1e-9) {
        return null;
      }

      if (maxRow !== pivot) {
        const tmp = augmented[pivot];
        augmented[pivot] = augmented[maxRow];
        augmented[maxRow] = tmp;
      }

      const pivotValue = augmented[pivot][pivot];
      for (let column = pivot; column <= size; column += 1) {
        augmented[pivot][column] /= pivotValue;
      }

      for (let row = 0; row < size; row += 1) {
        if (row === pivot) {
          continue;
        }
        const factor = augmented[row][pivot];
        for (let column = pivot; column <= size; column += 1) {
          augmented[row][column] -= factor * augmented[pivot][column];
        }
      }
    }

    return augmented.map((row) => row[size]);
  }

  function applyHomography(homography, x, y) {
    const denominator = homography[2][0] * x + homography[2][1] * y + homography[2][2];
    if (Math.abs(denominator) < 1e-9) {
      return { x: NaN, y: NaN };
    }
    return {
      x: (homography[0][0] * x + homography[0][1] * y + homography[0][2]) / denominator,
      y: (homography[1][0] * x + homography[1][1] * y + homography[1][2]) / denominator,
    };
  }

  function hitTestPoint(screenX, screenY) {
    const projected = getRenderablePoints();
    const tolerance = 12;
    let closest = null;
    for (const point of projected) {
      const canvasPoint = imageToScreen(point.x, point.y);
      const dx = canvasPoint.x - screenX;
      const dy = canvasPoint.y - screenY;
      const distance = Math.hypot(dx, dy);
      if (distance > tolerance) {
        continue;
      }
      if (!closest || distance < closest.distance) {
        closest = {
          id: point.id,
          isAnchor: point.anchor,
          distance,
        };
      }
    }
    return closest;
  }

  function resizeCanvas() {
    const rect = els.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (els.canvas.width !== width * dpr || els.canvas.height !== height * dpr) {
      els.canvas.width = width * dpr;
      els.canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function imageToScreen(imageX, imageY) {
    return {
      x: imageX * state.view.scale + state.view.offsetX,
      y: imageY * state.view.scale + state.view.offsetY,
    };
  }

  function screenToImage(screenX, screenY) {
    return {
      x: (screenX - state.view.offsetX) / state.view.scale,
      y: (screenY - state.view.offsetY) / state.view.scale,
    };
  }

  function getCanvasPointer(event) {
    const rect = els.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function pointInImageBounds(point, image) {
    return point.x >= 0 && point.y >= 0 && point.x <= image.naturalWidth && point.y <= image.naturalHeight;
  }

  function syncTemplateEditor() {
    els.templateEditor.value = JSON.stringify(
      {
        name: state.template.name,
        units: state.template.units,
        anchorOrder: state.template.anchorOrder,
        points: state.template.points,
        edges: state.template.edges,
      },
      null,
      2
    );
    els.showLabelsCheckbox.checked = state.showLabels;
    els.showEdgesCheckbox.checked = state.showEdges;
    els.exportFormatSelect.value = state.exportFormat;
  }

  function hydrateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        syncTemplateEditor();
        return;
      }
      const saved = JSON.parse(raw);
      const shouldMigrateSavedAnchors = templateRequiresLegacyAnchorMigration(saved.template);
      if (saved.template) {
        state.template = normalizeTemplate(upgradeLegacyDraftTemplate(saved.template));
      }
      if (saved.annotations && typeof saved.annotations === "object") {
        state.annotations = shouldMigrateSavedAnchors
          ? migrateAnnotationMap(saved.annotations)
          : saved.annotations;
      }
      state.showLabels = saved.showLabels !== undefined ? Boolean(saved.showLabels) : true;
      state.showEdges = saved.showEdges !== undefined ? Boolean(saved.showEdges) : true;
      state.exportFormat =
        saved.exportFormat === EXPORT_FORMATS.TXT ? EXPORT_FORMATS.TXT : EXPORT_FORMATS.JSON;
    } catch (error) {
      console.warn("Failed to hydrate state", error);
    }
    syncTemplateEditor();
  }

  function persistStateSoon() {
    clearTimeout(persistTimer);
    persistTimer = window.setTimeout(persistState, 80);
  }

  function persistState() {
    const payload = {
      template: {
        name: state.template.name,
        units: state.template.units,
        anchorOrder: state.template.anchorOrder,
        points: state.template.points,
        edges: state.template.edges,
      },
      annotations: state.annotations,
      showLabels: state.showLabels,
      showEdges: state.showEdges,
      exportFormat: state.exportFormat,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(filename, blob);
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    downloadBlob(filename, blob);
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }
    return roundNumber(value, 2).toFixed(2);
  }

  function roundNumber(value, digits) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function safeFileStem(filename) {
    return filename.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "_");
  }

  function shouldMigrateLegacyAnnotationRecord(record) {
    if (!record || typeof record !== "object") {
      return false;
    }
    return record.templateModel === PREVIOUS_BUILTIN_TEMPLATE_MODEL_VERSION;
  }

  function migrateAnnotationMap(annotations) {
    const migrated = {};
    for (const [imageId, annotation] of Object.entries(annotations || {})) {
      migrated[imageId] = {
        ...annotation,
        anchors: migrateBorderFrameAnchorsToVisibleCorners(annotation && annotation.anchors),
      };
    }
    return migrated;
  }

  function migrateBorderFrameAnchorsToVisibleCorners(anchors) {
    if (!anchors || typeof anchors !== "object") {
      return anchors || {};
    }
    const anchorIds = ["top_left", "top_right", "bottom_left", "bottom_right"];
    if (!anchorIds.every((id) => anchors[id] && Number.isFinite(anchors[id].x) && Number.isFinite(anchors[id].y))) {
      return anchors;
    }

    const correspondences = anchorIds.map((id) => ({
      modelX: BORDER_FRAME_ANCHOR_MODEL[id].x,
      modelY: BORDER_FRAME_ANCHOR_MODEL[id].y,
      imageX: anchors[id].x,
      imageY: anchors[id].y,
    }));
    const homography = solveHomography(correspondences);
    if (!homography) {
      return anchors;
    }

    const migrated = { ...anchors };
    for (const id of anchorIds) {
      const projected = applyHomography(
        homography,
        VISIBLE_CORNER_ANCHOR_MODEL[id].x,
        VISIBLE_CORNER_ANCHOR_MODEL[id].y
      );
      if (Number.isFinite(projected.x) && Number.isFinite(projected.y)) {
        migrated[id] = {
          x: roundNumber(projected.x, 3),
          y: roundNumber(projected.y, 3),
        };
      }
    }
    return migrated;
  }

  function templateRequiresLegacyAnchorMigration(template) {
    if (!template || typeof template !== "object") {
      return false;
    }

    const points = Array.isArray(template.points) ? template.points : [];
    const pointMap = Object.create(null);
    for (const point of points) {
      if (point && typeof point.id === "string") {
        pointMap[point.id] = point;
      }
    }
    return Object.entries(BORDER_FRAME_CENTERED_FINGERPRINT).every(([id, expected]) => {
      const point = pointMap[id];
      return (
        point &&
        Math.abs(point.x - expected.x) < 1e-6 &&
        Math.abs(point.y - expected.y) < 1e-6
      );
    });
  }

  function upgradeLegacyDraftTemplate(template) {
    if (!template || typeof template !== "object") {
      return template;
    }
    const points = Array.isArray(template.points) ? template.points : [];
    const pointIds = points
      .map((point) => (point && typeof point.id === "string" ? point.id : null))
      .filter(Boolean);

    const hasLegacyDraftPoints = pointIds.some((id) => LEGACY_DRAFT_POINT_IDS.has(id));
    if (hasLegacyDraftPoints) {
      return defaultTemplate;
    }

    if (
      Array.isArray(template.anchorOrder) &&
      template.anchorOrder.join("|") === LEGACY_DRAFT_ANCHOR_ORDER.join("|")
    ) {
      return {
        ...template,
        anchorOrder: defaultTemplate.anchorOrder.slice(),
      };
    }

    const isBuiltInSplitPointTemplate = template.name === defaultTemplate.name;
    const hasSamePointSetAsBuiltIn =
      pointIds.length === defaultTemplate.points.length &&
      pointIds.every((id) => defaultTemplate.points.some((point) => point.id === id));
    const hasLegacySplitPointEdges =
      Array.isArray(template.edges) && template.edges.length === LEGACY_SPLIT_POINT_EDGE_COUNT;
    const builtInPointMap = Object.create(null);
    for (const point of points) {
      builtInPointMap[point.id] = point;
    }
    const matchesFingerprint = (fingerprint) =>
      Object.entries(fingerprint).every(([id, expected]) => {
        const point = builtInPointMap[id];
        return (
          point &&
          Math.abs(point.x - expected.x) < 1e-6 &&
          Math.abs(point.y - expected.y) < 1e-6
        );
      });
    const hasLegacyBorderSpaceCoordinates = matchesFingerprint(LEGACY_BORDER_SPACE_FINGERPRINT);
    const hasIntegerDimensionCoordinates = matchesFingerprint(INTEGER_DIMENSION_FINGERPRINT);
    const hasBorderFrameCenteredCoordinates = matchesFingerprint(BORDER_FRAME_CENTERED_FINGERPRINT);
    const hasVisibleCornerApproxCenteredCoordinates = matchesFingerprint(
      VISIBLE_CORNER_APPROX_CENTERED_FINGERPRINT
    );
    const hasTightenedVisibleCornerCenteredCoordinates = matchesFingerprint(
      TIGHTENED_VISIBLE_CORNER_CENTERED_FINGERPRINT
    );

    if (
      isBuiltInSplitPointTemplate &&
      hasSamePointSetAsBuiltIn &&
      (
        hasLegacySplitPointEdges ||
        hasLegacyBorderSpaceCoordinates ||
        hasIntegerDimensionCoordinates ||
        hasBorderFrameCenteredCoordinates ||
        hasVisibleCornerApproxCenteredCoordinates ||
        hasTightenedVisibleCornerCenteredCoordinates
      )
    ) {
      return {
        ...template,
        anchorOrder: defaultTemplate.anchorOrder.slice(),
        points: defaultTemplate.points.map((point) => ({ ...point })),
        edges: defaultTemplate.edges.map((edge) => edge.slice()),
      };
    }

    return template;
  }
})();
