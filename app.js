(function () {
  "use strict";

  const STORAGE_KEY = "rm-mark-labeler-state-v1";
  const VISIBILITY_LABELS = {
    0: "不存在",
    1: "遮挡",
    2: "可见",
  };
  const LEGACY_DRAFT_ANCHOR_ORDER = ["top_left", "bottom_left", "bottom_right", "top_right"];

  const defaultTemplate = {
    name: "RM 2026 MARK Draft",
    units: "mm",
    anchorOrder: ["top_left", "top_right", "bottom_left", "bottom_right"],
    points: [
      { id: "top_left", label: "top_left", x: 0, y: 0, anchor: true },
      { id: "top_right", label: "top_right", x: 80, y: 0, anchor: true },
      { id: "bottom_left", label: "bottom_left", x: 0, y: 80, anchor: true },
      { id: "bottom_right", label: "bottom_right", x: 80, y: 80, anchor: true },

      { id: "tl_l_01", label: "tl_l_01", x: 8, y: 8 },
      { id: "tl_l_02", label: "tl_l_02", x: 30, y: 8 },
      { id: "tl_l_03", label: "tl_l_03", x: 30, y: 16 },
      { id: "tl_l_04", label: "tl_l_04", x: 16, y: 16 },
      { id: "tl_l_05", label: "tl_l_05", x: 16, y: 30 },
      { id: "tl_l_06", label: "tl_l_06", x: 8, y: 30 },

      { id: "tr_l_01", label: "tr_l_01", x: 72, y: 8 },
      { id: "tr_l_02", label: "tr_l_02", x: 50, y: 8 },
      { id: "tr_l_03", label: "tr_l_03", x: 50, y: 16 },
      { id: "tr_l_04", label: "tr_l_04", x: 64, y: 16 },
      { id: "tr_l_05", label: "tr_l_05", x: 64, y: 30 },
      { id: "tr_l_06", label: "tr_l_06", x: 72, y: 30 },

      { id: "br_l_01", label: "br_l_01", x: 72, y: 72 },
      { id: "br_l_02", label: "br_l_02", x: 50, y: 72 },
      { id: "br_l_03", label: "br_l_03", x: 50, y: 64 },
      { id: "br_l_04", label: "br_l_04", x: 64, y: 64 },
      { id: "br_l_05", label: "br_l_05", x: 64, y: 50 },
      { id: "br_l_06", label: "br_l_06", x: 72, y: 50 },

      { id: "bl_l_01", label: "bl_l_01", x: 8, y: 72 },
      { id: "bl_l_02", label: "bl_l_02", x: 30, y: 72 },
      { id: "bl_l_03", label: "bl_l_03", x: 30, y: 64 },
      { id: "bl_l_04", label: "bl_l_04", x: 16, y: 64 },
      { id: "bl_l_05", label: "bl_l_05", x: 16, y: 50 },
      { id: "bl_l_06", label: "bl_l_06", x: 8, y: 50 },
    ],
    edges: [
      ["top_left", "bottom_left"],
      ["bottom_left", "bottom_right"],
      ["bottom_right", "top_right"],
      ["top_right", "top_left"],

      ["tl_l_01", "tl_l_02"],
      ["tl_l_02", "tl_l_03"],
      ["tl_l_03", "tl_l_04"],
      ["tl_l_04", "tl_l_05"],
      ["tl_l_05", "tl_l_06"],
      ["tl_l_06", "tl_l_01"],

      ["tr_l_01", "tr_l_02"],
      ["tr_l_02", "tr_l_03"],
      ["tr_l_03", "tr_l_04"],
      ["tr_l_04", "tr_l_05"],
      ["tr_l_05", "tr_l_06"],
      ["tr_l_06", "tr_l_01"],

      ["br_l_01", "br_l_02"],
      ["br_l_02", "br_l_03"],
      ["br_l_03", "br_l_04"],
      ["br_l_04", "br_l_05"],
      ["br_l_05", "br_l_06"],
      ["br_l_06", "br_l_01"],

      ["bl_l_01", "bl_l_02"],
      ["bl_l_02", "bl_l_03"],
      ["bl_l_03", "bl_l_04"],
      ["bl_l_04", "bl_l_05"],
      ["bl_l_05", "bl_l_06"],
      ["bl_l_06", "bl_l_01"],
    ],
  };

  const state = {
    template: normalizeTemplate(defaultTemplate),
    images: [],
    currentImageIndex: -1,
    annotations: {},
    selectedPointId: null,
    showLabels: true,
    showEdges: true,
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
    if (event.target && ["TEXTAREA", "INPUT"].includes(event.target.tagName)) {
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
    const anchors = state.template.anchorOrder.map((id) => {
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

    if (anchors.some((item) => !item)) {
      return {
        homography: null,
        points: [],
      };
    }

    const homography = solveHomography(anchors);
    if (!homography) {
      return {
        homography: null,
        points: [],
      };
    }

    const points = state.template.points.map((point) => {
      const anchorPoint = annotation.anchors[point.id];
      const projected = point.anchor && anchorPoint
        ? { x: anchorPoint.x, y: anchorPoint.y }
        : applyHomography(homography, point.x, point.y);
      const visibility =
        annotation.visibility[point.id] !== undefined ? annotation.visibility[point.id] : 2;
      return {
        id: point.id,
        label: point.label || point.id,
        x: projected.x,
        y: projected.y,
        visibility,
        anchor: point.anchor,
      };
    });

    return { homography, points };
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
    downloadJson(`${safeFileStem(image.name)}.annotation.json`, payload);
  }

  async function exportAllAnnotations() {
    await Promise.all(state.images.map((image) => ensureImageLoaded(image)));
    const payload = state.images.map((image) => buildExportRecord(image));
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

    const anchors = state.template.anchorOrder.map((id) => {
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

    if (anchors.some((item) => !item)) {
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

    const homography = solveHomography(anchors);
    if (!homography) {
      return new Map();
    }

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
    };
  }

  function solveHomography(correspondences) {
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
  }

  function hydrateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        syncTemplateEditor();
        return;
      }
      const saved = JSON.parse(raw);
      if (saved.template) {
        state.template = normalizeTemplate(upgradeLegacyDraftTemplate(saved.template));
      }
      if (saved.annotations && typeof saved.annotations === "object") {
        state.annotations = saved.annotations;
      }
      state.showLabels = saved.showLabels !== undefined ? Boolean(saved.showLabels) : true;
      state.showEdges = saved.showEdges !== undefined ? Boolean(saved.showEdges) : true;
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
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
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

  function upgradeLegacyDraftTemplate(template) {
    if (!template || typeof template !== "object") {
      return template;
    }
    if (template.name !== defaultTemplate.name || !Array.isArray(template.anchorOrder)) {
      return template;
    }
    if (template.anchorOrder.join("|") !== LEGACY_DRAFT_ANCHOR_ORDER.join("|")) {
      return template;
    }
    return {
      ...template,
      anchorOrder: defaultTemplate.anchorOrder.slice(),
    };
  }
})();
