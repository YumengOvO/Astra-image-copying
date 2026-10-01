(() => {
  "use strict";

  const WIDTH = 1448;
  const HEIGHT = 1086;
  const STAGES = [
    { title: "草稿 · 动态线", description: "几条轻线，定下头身走势与画面重心。", seconds: 9 },
    { title: "草稿 · 比例定位", description: "头、颈与肩逐渐连接，羽梦的姿态开始成形。", seconds: 13 },
    { title: "草稿 · 轮廓结构", description: "轮廓与体块铺开，为五官和衣装留出位置。", seconds: 17 },
    { title: "描线 · 五官", description: "脸型、口鼻与双眼依次落笔，神情渐渐清晰。", seconds: 65 },
    { title: "描线 · 头发与猫耳", description: "刘海与两侧发束展开，猫耳勾出轻巧的轮廓。", seconds: 120 },
    { title: "描线 · 衣服", description: "衣袖、领口与褶边接续成形，衣装添上层次。", seconds: 65 },
    { title: "描线 · 饰品", description: "星饰与衣褶落在线间，为肖像添上小小的细节。", seconds: 35 },
    { title: "擦除草稿 · 修线", description: "辅助线渐渐退去，留下清晰完整的轮廓。", seconds: 30 },
    { title: "上色 · 肤色", description: "肤色从脸颊铺向颈肩，画面有了第一抹温度。", seconds: 65 },
    { title: "上色 · 头发与兽耳", description: "浅粉色沿发束与兽耳铺开，柔和的色调逐渐连成一片。", seconds: 150 },
    { title: "上色 · 服装", description: "头饰、蝴蝶结与衣料依次着色，深浅之间衬出羽梦。", seconds: 85 },
    { title: "上色 · 眼睛", description: "色彩落入双眼，羽梦的目光渐渐明亮。", seconds: 35 },
    { title: "细化 · 阴影与高光", description: "阴影与高光逐处叠加，让面容、发丝与衣料更有层次。", seconds: 260 },
  ];
  const starts = [];
  let duration = 0;
  for (const stage of STAGES) {
    starts.push(duration);
    duration += stage.seconds;
  }
  const $ = (id) => document.getElementById(id);
  const canvas = $("drawing");
  const ctx = canvas.getContext("2d");
  const pen = $("penNib");
  const steps = $("steps");
  const rawStrokes = window.DRAWING_STROKES || [];
  const rawColourStrokes = window.PAINT_STROKES || [];
  const detailParts = window.PAINT_DETAIL_PARTS || [];
  const detailTimings = [];

  function surface() {
    const node = document.createElement("canvas");
    node.width = WIDTH;
    node.height = HEIGHT;
    return [node, node.getContext("2d")];
  }
  const [baseMask, baseMaskCtx] = surface();
  const [cleanMask, cleanMaskCtx] = surface();
  const [workingMask, workingMaskCtx] = surface();
  const [inkReveal, inkRevealCtx] = surface();
  const [guideSurface, guideCtx] = surface();
  const [workingColour, workingColourCtx] = surface();
  const [colourReveal, colourRevealCtx] = surface();
  const colourMasks = Array.from({ length: 5 }, () => surface());
  let paperImage = null;
  let colourMaskImages = null;

  function stroke(stage, object, points, width = 30, alpha = 1) {
    const lengths = [];
    let length = 0;
    for (let i = 2; i < points.length; i += 2) {
      const segment = Math.hypot(points[i] - points[i - 2], points[i + 1] - points[i - 1]);
      lengths.push(segment);
      length += segment;
    }
    return { stage, object, points, lengths, length, width, alpha, travelStart: 0, start: 0, end: 0, from: null };
  }

  const guides = [];
  const guide = (stage, points, width = 1.5, alpha = 0.7) =>
    guides.push(stroke(stage, 0, points.flat(), width, alpha));
  const curve = (stage, a, b, c, d, width = 1.5, alpha = 0.7) => {
    const points = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      const u = 1 - t;
      points.push([
        Math.round(u ** 3 * a[0] + 3 * u ** 2 * t * b[0] + 3 * u * t ** 2 * c[0] + t ** 3 * d[0]),
        Math.round(u ** 3 * a[1] + 3 * u ** 2 * t * b[1] + 3 * u * t ** 2 * c[1] + t ** 3 * d[1]),
      ]);
    }
    guide(stage, points, width, alpha);
  };
  const ellipse = (stage, cx, cy, rx, ry, width = 1.5, alpha = 0.7) => {
    const points = [];
    for (let i = 0; i <= 48; i++) {
      const angle = i * Math.PI / 24;
      points.push([Math.round(cx + Math.cos(angle) * rx), Math.round(cy + Math.sin(angle) * ry)]);
    }
    guide(stage, points, width, alpha);
  };

  // One connected gesture at a time, then simple anatomy, then planar volumes.
  curve(0, [742, 44], [796, 265], [697, 685], [765, 1080], 2.1, 0.72);
  curve(0, [478, 489], [646, 453], [843, 482], [1016, 502], 1.5, 0.58);
  curve(0, [456, 857], [624, 825], [872, 804], [1075, 847], 2, 0.64);
  curve(0, [533, 210], [447, 468], [366, 688], [244, 938], 1.2, 0.4);
  curve(0, [913, 163], [1032, 390], [1086, 635], [1190, 921], 1.2, 0.4);

  ellipse(1, 752, 405, 270, 324, 1.6, 0.7);
  guide(1, [[753, 94], [755, 735]], 1.25, 0.53);
  guide(1, [[506, 510], [1001, 510]], 1.15, 0.48);
  guide(1, [[669, 700], [640, 832], [579, 1014]], 1.7, 0.67);
  guide(1, [[842, 702], [894, 830], [946, 1050]], 1.7, 0.67);
  guide(1, [[640, 836], [474, 856], [382, 1006]], 1.55, 0.6);
  guide(1, [[894, 830], [1049, 842], [1134, 1011]], 1.55, 0.6);

  guide(2, [[580, 150], [891, 127], [987, 482], [925, 624]], 1.7, 0.57);
  guide(2, [[580, 150], [497, 477], [570, 642]], 1.7, 0.57);
  guide(2, [[501, 484], [756, 534], [988, 486]], 1.35, 0.55);
  guide(2, [[568, 608], [752, 754], [929, 609]], 1.8, 0.68);
  guide(2, [[627, 438], [627, 603]], 1.1, 0.47);
  guide(2, [[863, 438], [863, 603]], 1.1, 0.47);
  guide(2, [[644, 692], [602, 855], [694, 930]], 1.4, 0.52);
  guide(2, [[858, 692], [916, 846], [824, 935]], 1.4, 0.52);
  guide(2, [[455, 855], [626, 795], [904, 795], [1080, 850]], 1.7, 0.6);
  guide(2, [[455, 855], [521, 1050], [742, 1080]], 1.25, 0.48);
  guide(2, [[1080, 850], [1016, 1060], [742, 1080]], 1.25, 0.48);
  ellipse(2, 624, 516, 118, 83, 1.1, 0.38);
  ellipse(2, 878, 516, 118, 83, 1.1, 0.38);

  // Draw actual thin strokes; small finishing marks are saved for cleanup.
  const allInk = rawStrokes.map(([stage, object, points, width = 1.65]) => stroke(stage, object, points, width));
  const inkStrokes = allInk.filter(item => item.length >= 12);
  const cleanStrokes = allInk.filter(item => item.length < 12)
    .map(item => stroke(7, item.object, item.points, 1.25));
  cleanStrokes.push(...allInk.filter(item => item.length >= 12 && item.length < 80 && [3,6].includes(item.stage))
    .slice(0,24).map(item => stroke(7, item.object, item.points, item.width * 1.22)));
  const erasers = guides.map((item) => stroke(7, 0, item.points, 10));
  const colourStrokes = rawColourStrokes.map(([stage, object, points, width, colour]) =>
    Object.assign(stroke(stage, object, points, width), { colour }));
  const ERASE_SECONDS = 12;
  const coloursByStage = Array.from({length: 13}, (_, i) => colourStrokes.filter(s => s.stage === i));

  function lastPoint(item) {
    const p = item.points;
    return [p[p.length - 2], p[p.length - 1]];
  }

  function schedule(list, stage, offset = 0, span = STAGES[stage].seconds, previous = null) {
    if (!list.length) return previous;
    const moves = [];
    let from = previous;
    for (const item of list) {
      const to = [item.points[0], item.points[1]];
      const distance = from ? Math.hypot(to[0] - from[0], to[1] - from[1]) : 0;
      moves.push(from ? Math.min(0.32, 0.045 + distance / 1200) : 0);
      from = lastPoint(item);
    }
    const travelTotal = moves.reduce((sum, value) => sum + value, 0);
    const travelScale = travelTotal ? Math.min(1, (span * 0.42) / travelTotal) : 1;
    const weight = item => Math.max(30, Math.min(260, item.length));
    const drawTotal = list.reduce((sum, item) => sum + weight(item), 0);
    const drawSpan = span - travelTotal * travelScale;
    let position = starts[stage] + offset;
    from = previous;
    list.forEach((item, index) => {
      item.from = from;
      item.travelStart = position;
      item.start = position + moves[index] * travelScale;
      item.end = item.start + (weight(item) / drawTotal) * drawSpan;
      position = item.end;
      from = lastPoint(item);
    });
    list[list.length - 1].end = starts[stage] + offset + span;
    return from;
  }

  let previous = null;
  for (let stage = 0; stage <= 2; stage++) {
    previous = schedule(guides.filter((item) => item.stage === stage), stage, 0, STAGES[stage].seconds, previous);
  }
  for (let stage = 3; stage <= 6; stage++) {
    previous = schedule(inkStrokes.filter((item) => item.stage === stage), stage, 0, STAGES[stage].seconds, previous);
  }
  previous = schedule(erasers, 7, 0, ERASE_SECONDS, previous);
  previous = schedule(cleanStrokes, 7, ERASE_SECONDS, STAGES[7].seconds - ERASE_SECONDS, previous);
  for (let stage = 8; stage < STAGES.length; stage++) {
    if (stage === 12 && detailParts.length) {
      let offset = 0;
      for (const [object, part] of detailParts.entries()) {
        const list = coloursByStage[12].filter(item => item.object === object);
        detailTimings.push({ name: part.name, start: starts[12] + offset, end: starts[12] + offset + part.seconds });
        previous = schedule(list, 12, offset, part.seconds, previous);
        offset += part.seconds;
      }
      continue;
    }
    previous = schedule(colourStrokes.filter((item) => item.stage === stage), stage, 0, STAGES[stage].seconds, previous);
  }

  const timeline = [...guides, ...inkStrokes, ...erasers, ...cleanStrokes, ...colourStrokes].sort((a,b) => a.travelStart - b.travelStart);

  // Frame a whole run of strokes on the same object, avoiding a zoom per mark.
  let focusRun = null;
  for (const item of timeline) {
    const key = `${item.stage}:${item.object}`;
    if (!focusRun || focusRun.key !== key) {
      focusRun = { key, left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
    }
    for (let i = 0; i < item.points.length; i += 2) {
      focusRun.left = Math.min(focusRun.left, item.points[i] - item.width / 2);
      focusRun.right = Math.max(focusRun.right, item.points[i] + item.width / 2);
      focusRun.top = Math.min(focusRun.top, item.points[i + 1] - item.width / 2);
      focusRun.bottom = Math.max(focusRun.bottom, item.points[i + 1] + item.width / 2);
    }
    item.focus = focusRun;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let viewMode = "follow";
  let camera = { x: WIDTH / 2, y: HEIGHT / 2, zoom: 1 };
  let cameraTarget = { ...camera };
  let cameraRequest = 0;
  let cameraTime = 0;
  let currentNib = null;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function boundedView(x, y, zoom) {
    zoom = clamp(zoom, 1, 4);
    const halfW = WIDTH / zoom / 2, halfH = HEIGHT / zoom / 2;
    return { x: clamp(x, halfW, WIDTH - halfW), y: clamp(y, halfH, HEIGHT - halfH), zoom };
  }

  function applyCamera() {
    const left = camera.x - WIDTH / camera.zoom / 2;
    const top = camera.y - HEIGHT / camera.zoom / 2;
    canvas.style.transform = `translate(${-left / WIDTH * camera.zoom * 100}%, ${-top / HEIGHT * camera.zoom * 100}%) scale(${camera.zoom})`;
    if (currentNib) {
      pen.style.left = `${(currentNib.point[0] - left) / WIDTH * camera.zoom * 100}%`;
      pen.style.top = `${(currentNib.point[1] - top) / HEIGHT * camera.zoom * 100}%`;
    }
    $("zoomLabel").textContent = `${camera.zoom.toFixed(1)}×`;
    $("zoomOut").disabled = cameraTarget.zoom <= 1;
    $("zoomIn").disabled = cameraTarget.zoom >= 4;
  }

  function animateCamera(now) {
    cameraRequest = 0;
    const amount = 1 - Math.exp(-Math.min(64, now - cameraTime) / 145);
    cameraTime = now;
    for (const key of ["x", "y", "zoom"]) camera[key] += (cameraTarget[key] - camera[key]) * amount;
    const settled = Math.abs(camera.x - cameraTarget.x) < .1 && Math.abs(camera.y - cameraTarget.y) < .1 && Math.abs(camera.zoom - cameraTarget.zoom) < .001;
    if (settled) camera = { ...cameraTarget };
    applyCamera();
    if (!settled) cameraRequest = requestAnimationFrame(animateCamera);
  }

  function moveCamera(view, immediate = false) {
    cameraTarget = view;
    if (immediate || reducedMotion.matches) {
      cancelAnimationFrame(cameraRequest);
      cameraRequest = 0;
      camera = { ...view };
      applyCamera();
    } else if (!cameraRequest) {
      cameraTime = performance.now();
      cameraRequest = requestAnimationFrame(animateCamera);
    }
  }

  function followDrawing(immediate = false) {
    if (viewMode !== "follow") { applyCamera(); return; }
    const item = actionAt(timeline, elapsed);
    if (!item || item.stage < 3 || (item.stage === 7 && elapsed < starts[7] + ERASE_SECONDS) || elapsed >= duration) {
      moveCamera(boundedView(WIDTH / 2, HEIGHT / 2, 1), immediate);
      return;
    }
    const box = item.focus;
    const zoom = clamp(Math.min(WIDTH / (box.right - box.left + 180), HEIGHT / (box.bottom - box.top + 140)), 1, 3.5);
    let x = (box.left + box.right) / 2, y = (box.top + box.bottom) / 2;
    // Include the moving nib while travelling into a new part.
    if (currentNib) {
      x = clamp(x, currentNib.point[0] - WIDTH / zoom * .36, currentNib.point[0] + WIDTH / zoom * .36);
      y = clamp(y, currentNib.point[1] - HEIGHT / zoom * .36, currentNib.point[1] + HEIGHT / zoom * .36);
    }
    moveCamera(boundedView(x, y, zoom), immediate);
  }

  $("viewMode").addEventListener("change", event => {
    viewMode = event.target.value;
    if (viewMode === "full") moveCamera(boundedView(WIDTH / 2, HEIGHT / 2, 1));
    else if (viewMode === "follow") followDrawing();
  });
  $("resetView").addEventListener("click", () => {
    viewMode = "full";
    $("viewMode").value = viewMode;
    moveCamera(boundedView(WIDTH / 2, HEIGHT / 2, 1));
  });
  for (const [id, factor] of [["zoomIn", 1.25], ["zoomOut", .8]]) {
    $(id).addEventListener("click", () => {
      viewMode = "manual";
      $("viewMode").value = viewMode;
      const point = currentNib?.point || [cameraTarget.x, cameraTarget.y];
      moveCamera(boundedView(point[0], point[1], cameraTarget.zoom * factor));
    });
  }

  STAGES.forEach((stage, index) => {
    if ([0,3,8].includes(index)) {
      const heading = document.createElement("div");
      heading.className = "phase-heading";
      heading.textContent = ({0:"01 / 起稿",3:"02 / 描线",8:"03 / 上色"})[index];
      steps.appendChild(heading);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "step";
    button.title = stage.description;
    button.innerHTML = `<span class="step-no">${String(index + 1).padStart(2, "0")}</span><span class="step-name">${stage.title}</span><span class="step-time">${stage.seconds}s</span>`;
    button.addEventListener("click", () => { seek(starts[index]); play(); });
    steps.appendChild(button);
  });
  const stepButtons = [...steps.querySelectorAll("button")];

  let elapsed = 0;
  let speed = Number($("speed").value);
  let playing = false;
  let ready = false;
  let activeStage = -1;
  let completedStages = -1;
  let lastFrame = null;
  let frameRequest = 0;
  let resumeAfterScrub = false;
  let inkCompleted = 0;
  let cleanCompleted = 0;
  const colourCompleted = [0, 0, 0, 0, 0];

  function configure(context, item, colour = "white", alpha = 1) {
    context.strokeStyle = colour;
    context.fillStyle = colour;
    context.lineWidth = item.width;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.globalAlpha = alpha;
  }

  function trace(context, item, fraction) {
    const p = item.points;
    if (fraction <= 0) return [p[0], p[1]];
    if (!item.length) {
      context.beginPath();
      context.arc(p[0], p[1], item.width / 2, 0, Math.PI * 2);
      context.fill();
      return [p[0], p[1]];
    }
    let remaining = item.length * Math.min(1, fraction);
    let x = p[0];
    let y = p[1];
    context.beginPath();
    context.moveTo(x, y);
    for (let i = 0; i < item.lengths.length; i++) {
      const nextX = p[i * 2 + 2];
      const nextY = p[i * 2 + 3];
      const segment = item.lengths[i];
      if (remaining >= segment) {
        context.lineTo(nextX, nextY);
        x = nextX;
        y = nextY;
        remaining -= segment;
      } else {
        const part = segment ? remaining / segment : 0;
        x += (nextX - x) * part;
        y += (nextY - y) * part;
        context.lineTo(x, y);
        break;
      }
    }
    context.stroke();
    return [x, y];
  }

  function actionAt(list, time) {
    return list.find((item) => time >= item.travelStart && time < item.end) || null;
  }

  function penPoint(item, time, context = null) {
    if (!item) return null;
    if (time < item.start) {
      const to = [item.points[0], item.points[1]];
      if (!item.from) return { point: to, lifted: true };
      const linear = (time - item.travelStart) / (item.start - item.travelStart);
      const fraction = linear * linear * (3 - 2 * linear);
      return {
        point: [
          item.from[0] + (to[0] - item.from[0]) * fraction,
          item.from[1] + (to[1] - item.from[1]) * fraction,
        ],
        lifted: true,
      };
    }
    const fraction = (time - item.start) / (item.end - item.start);
    const point = context ? trace(context, item, fraction) : pointAlong(item, fraction);
    return { point, lifted: false };
  }

  function pointAlong(item, fraction) {
    if (!item.length) return [item.points[0], item.points[1]];
    let remaining = item.length * fraction;
    const p = item.points;
    for (let i = 0; i < item.lengths.length; i++) {
      const segment = item.lengths[i];
      if (remaining <= segment) {
        const part = segment ? remaining / segment : 0;
        return [
          p[i * 2] + (p[i * 2 + 2] - p[i * 2]) * part,
          p[i * 2 + 1] + (p[i * 2 + 3] - p[i * 2 + 1]) * part,
        ];
      }
      remaining -= segment;
    }
    return lastPoint(item);
  }

  function paintGuides() {
    if (elapsed >= starts[7] + ERASE_SECONDS) return null;
    guideCtx.clearRect(0, 0, WIDTH, HEIGHT);
    for (const item of guides) {
      if (elapsed < item.start) break;
      configure(guideCtx, item, "#9b829d", item.alpha * 0.68);
      trace(guideCtx, item, elapsed >= item.end ? 1 : (elapsed - item.start) / (item.end - item.start));
    }
    guideCtx.globalAlpha = 1;
    let nib = elapsed < starts[3] ? penPoint(actionAt(guides, elapsed), elapsed) : null;
    if (elapsed >= starts[7]) {
      guideCtx.globalCompositeOperation = "destination-out";
      for (const item of erasers) {
        if (elapsed < item.start) break;
        configure(guideCtx, item);
        trace(guideCtx, item, elapsed >= item.end ? 1 : (elapsed - item.start) / (item.end - item.start));
      }
      guideCtx.globalCompositeOperation = "source-over";
      guideCtx.globalAlpha = 1;
      nib = penPoint(actionAt(erasers, elapsed), elapsed);
    }
    ctx.drawImage(guideSurface, 0, 0);
    return nib;
  }

  function advanceMask(context, list, count, target) {
    if (target < count) {
      context.clearRect(0, 0, WIDTH, HEIGHT);
      count = 0;
    }
    while (count < target) {
      const item = list[count++];
      configure(context, item, item.colour || "white");
      trace(context, item, 1);
    }
    context.globalAlpha = 1;
    return count;
  }

  function paintInk() {
    if (elapsed < starts[3]) return null;

    let target = 0;
    while (target < inkStrokes.length && inkStrokes[target].end <= elapsed) target++;
    inkCompleted = advanceMask(baseMaskCtx, inkStrokes, inkCompleted, target);
    let cleanTarget = 0;
    while (cleanTarget < cleanStrokes.length && cleanStrokes[cleanTarget].end <= elapsed) cleanTarget++;
    cleanCompleted = advanceMask(cleanMaskCtx, cleanStrokes, cleanCompleted, cleanTarget);

    workingMaskCtx.clearRect(0, 0, WIDTH, HEIGHT);
    workingMaskCtx.drawImage(baseMask, 0, 0);
    workingMaskCtx.drawImage(cleanMask, 0, 0);
    let nib = null;
    const active = elapsed < starts[7] ? actionAt(inkStrokes, elapsed) : actionAt(cleanStrokes, elapsed);
    if (active) {
      configure(workingMaskCtx, active);
      nib = penPoint(active, elapsed, elapsed >= active.start ? workingMaskCtx : null);
    }
    workingMaskCtx.globalAlpha = 1;
    inkRevealCtx.clearRect(0, 0, WIDTH, HEIGHT);
    inkRevealCtx.drawImage(workingMask, 0, 0);
    inkRevealCtx.globalCompositeOperation = "source-in";
    inkRevealCtx.fillStyle = "#70556e";
    inkRevealCtx.fillRect(0, 0, WIDTH, HEIGHT);
    inkRevealCtx.globalCompositeOperation = "source-over";
    if (elapsed < starts[8]) ctx.drawImage(inkReveal, 0, 0);
    return nib;
  }

  function paintColour() {
    if (elapsed < starts[8]) return null;
    ctx.drawImage(inkReveal, 0, 0);
    let nib = null;
    for (let layer = 0; layer < colourMasks.length; layer++) {
      const stage = layer + 8;
      if (elapsed < starts[stage]) break;
      const list = coloursByStage[stage];
      const [maskCanvas, maskCtx] = colourMasks[layer];
      let target = 0;
      while (target < list.length && list[target].end <= elapsed) target++;
      colourCompleted[layer] = advanceMask(maskCtx, list, colourCompleted[layer], target);
      workingColourCtx.clearRect(0, 0, WIDTH, HEIGHT);
      workingColourCtx.drawImage(maskCanvas, 0, 0);
      const active = actionAt(list, elapsed);
      if (active) {
        configure(workingColourCtx, active, active.colour);
        nib = penPoint(active, elapsed, elapsed >= active.start ? workingColourCtx : null);
      }
      workingColourCtx.globalAlpha = 1;
      workingColourCtx.globalCompositeOperation = "destination-in";
      workingColourCtx.drawImage(colourMaskImages[layer], 0, 0);
      workingColourCtx.globalCompositeOperation = "source-over";
      colourRevealCtx.clearRect(0, 0, WIDTH, HEIGHT);
      // These pixels are actual opaque paint deposited by the strokes above.
      // The silhouette only keeps the brush inside the painted object.
      colourRevealCtx.drawImage(workingColour, 0, 0);
      colourRevealCtx.globalCompositeOperation = "source-over";
      ctx.drawImage(colourReveal, 0, 0);
    }
    return nib;
  }

  function stageAt(time) {
    for (let i = STAGES.length - 1; i >= 0; i--) if (time >= starts[i]) return i;
    return 0;
  }

  function syncStage(index) {
    const completeCount = elapsed >= duration ? STAGES.length : index;
    if (index === activeStage && completeCount === completedStages) return;
    activeStage = index;
    completedStages = completeCount;
    $("stageNumber").textContent = String(index + 1).padStart(2, "0");
    $("stageTitle").textContent = STAGES[index].title;
    $("stageDescription").textContent = STAGES[index].description;
    stepButtons.forEach((button, step) => {
      button.classList.toggle("active", step === index);
      button.classList.toggle("complete", step < completeCount);
      if (step === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }

  function formatTime(time) {
    const seconds = Math.floor(time);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function draw(immediateCamera = false) {
    if (!ready) return;
    syncStage(stageAt(elapsed));
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(paperImage, 0, 0);
    const guideNib = paintGuides();
    const inkNib = paintInk();
    const colourNib = paintColour();
    const nib = colourNib || inkNib || guideNib;
    currentNib = nib;
    if (nib && elapsed < duration) {
      pen.classList.toggle("lifted", nib.lifted);
      pen.classList.add("visible");
    } else pen.classList.remove("visible");
    applyCamera();
    followDrawing(immediateCamera);
    const index = stageAt(elapsed);
    if (index === 12) {
      const part = detailTimings.find(part => elapsed >= part.start && elapsed < part.end);
      $("stageDescription").textContent = part
        ? `细化 · ${part.name}：阴影与高光逐笔落下，细节渐渐清晰。`
        : STAGES[12].description;
    }
    const done = timeline.findIndex(item => item.end > elapsed);
    $("strokeLabel").textContent = `${done < 0 ? timeline.length : done} / ${timeline.length} 笔`;
    $("toolLabel").textContent = index < 3 ? "铅笔 · 起稿" : index < 7 ? "细笔 · 描线" : index === 7 ? (elapsed < starts[7]+ERASE_SECONDS ? "橡皮 · 清理" : "细笔 · 修线") : index === 12 ? "硬边细笔 · 叠色" : "硬边画笔 · 铺色";
    pen.style.backgroundColor = index >= 8 && nib && !nib.lifted ? (actionAt(colourStrokes, elapsed)?.colour || "") : "";
    pen.classList.toggle("brush", index >= 8);
    pen.classList.toggle("eraser", index === 7 && elapsed < starts[7]+ERASE_SECONDS);
    const phase = index < 3 ? "草稿" : index < 8 ? "描线" : "上色";
    $("phaseLabel").textContent = elapsed >= duration ? "绘制完成" : phase;
    $("progress").setAttribute("aria-valuetext", `${STAGES[index].title}，${formatTime(elapsed)}`);
    $("progress").value = String(Math.round((elapsed / duration) * 1000));
    $("progress").style.setProperty("--progress", `${(elapsed / duration) * 100}%`);
    $("timeLabel").textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`;
  }

  function seek(time) {
    elapsed = Math.min(duration, Math.max(0, time));
    lastFrame = null;
    draw(true);
  }

  function syncPlayButton() {
    $("playLabel").textContent = playing ? "暂停" : "播放";
    $("play").setAttribute("aria-label", playing ? "暂停动画" : "播放动画");
    $("playIcon").innerHTML = playing
      ? '<path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />'
      : '<path d="m7 4 12 8-12 8V4Z" fill="currentColor" />';
  }

  function tick(timestamp) {
    frameRequest = 0;
    if (!playing) return;
    if (lastFrame !== null) elapsed = Math.min(duration, elapsed + ((timestamp - lastFrame) / 1000) * speed);
    lastFrame = timestamp;
    if (elapsed >= duration) {
      elapsed = duration;
      playing = false;
      syncPlayButton();
    }
    draw();
    if (playing) frameRequest = requestAnimationFrame(tick);
  }

  function play() {
    if (!ready) return;
    if (elapsed >= duration) seek(0);
    if (playing) return;
    playing = true;
    lastFrame = null;
    syncPlayButton();
    frameRequest = requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    if (frameRequest) cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    lastFrame = null;
    syncPlayButton();
    draw();
  }

  $("play").addEventListener("click", () => (playing ? pause() : play()));
  $("nextStroke").addEventListener("click", () => {
    pause();
    const next = timeline.find(item => item.end > elapsed + 0.00001);
    if (next) seek(next.end);
  });
  $("showFinal").addEventListener("click", () => {
    pause();
    moveCamera(boundedView(WIDTH / 2, HEIGHT / 2, 1), true);
    seek(duration);
  });
  document.addEventListener("visibilitychange", () => { lastFrame = null; });
  $("restart").addEventListener("click", () => { seek(0); play(); });
  $("speed").addEventListener("change", (event) => {
    speed = Number(event.target.value);
    $("paperSpeed").textContent = `${speed.toFixed(1)}×`;
  });
  $("progress").addEventListener("pointerdown", () => {
    resumeAfterScrub = playing;
    if (playing) pause();
  });
  $("progress").addEventListener("input", (event) => seek((Number(event.target.value) / 1000) * duration));
  $("progress").addEventListener("change", () => { if (resumeAfterScrub) play(); resumeAfterScrub = false; });
  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (["INPUT", "SELECT", "BUTTON", "A"].includes(tag)) return;
    if (event.code === "Space") {
      event.preventDefault();
      playing ? pause() : play();
    } else if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
      event.preventDefault();
      seek(elapsed + (event.code === "ArrowRight" ? 5 : -5));
    }
  });

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(path));
      image.src = path;
    });
  }

  const imagePaths = [
    "猫耳少女画纸.png",
    "color-mask-skin.png", "color-mask-hair.png", "color-mask-clothes.png",
    "color-mask-eyes.png", "猫耳少女上色-收尾.png",
  ];
  Promise.all(imagePaths.map(loadImage)).then(([paper, ...masks]) => {
    if (!inkStrokes.length || !colourStrokes.length) {
      $("loading").textContent = "笔画数据未加载，请确认脚本文件与网页在同一目录。";
      return;
    }
    paperImage = paper;
    colourMaskImages = masks;
    ready = true;
    // Read-only timing information for pixel-level regression checks.
    window.DRAWING_TIMELINE = { duration, starts: [...starts], detailParts: detailTimings, counts: STAGES.map((_, i) => timeline.filter(s => s.stage === i).length), strokes: timeline.map(s => ({start:s.start,end:s.end,stage:s.stage,object:s.object,width:s.width,length:s.length})) };
    syncPlayButton();
    $("loading").classList.add("hidden");
    draw();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) play();
  }).catch(() => { $("loading").textContent = "绘画素材加载失败，请确认图片与网页在同一目录。"; });
})();

