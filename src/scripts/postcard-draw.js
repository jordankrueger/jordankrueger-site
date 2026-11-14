// Postcard drawing code, ported as-is from Jordan's reference (2026-11-14). Fonts: Caveat (self-hosted) + Bricolage Grotesque.
// Literal colors here are the card's own palette (it is an image, not page UI).
  var W = 1200, H = 800;
  var C = {
    ink: "#1d2a44", paper: "#fffef8", rose: "#e2618a", sun: "#f5c044", leaf: "#2f8f5b"
  };
  var LIMITS = { name: 40, from: 32, where: 140, tuesday: 140, built: 140 };

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function grad(c, x, y, h, a, b) {
    var g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, a); g.addColorStop(1, b); return g;
  }
  function circle(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
  function hill(c, x, y, w, h, base, amp, freq, phase, fill) {
    c.beginPath(); c.moveTo(x, y + h);
    for (var i = 0; i <= 40; i++) {
      var px = x + w * i / 40;
      var py = base + Math.sin(i / 40 * Math.PI * freq + phase) * amp;
      c.lineTo(px, py);
    }
    c.lineTo(x + w, y + h); c.closePath(); c.fillStyle = fill; c.fill();
  }
  function cloud(c, x, y, s) {
    c.fillStyle = "rgba(255,255,255,.92)";
    c.beginPath();
    c.ellipse(x, y, 34 * s, 16 * s, 0, 0, Math.PI * 2);
    c.ellipse(x + 26 * s, y - 10 * s, 24 * s, 18 * s, 0, 0, Math.PI * 2);
    c.ellipse(x - 22 * s, y - 6 * s, 20 * s, 14 * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  function tree(c, x, y, s, leaf) {
    c.fillStyle = "#7a5534"; c.fillRect(x - 4 * s, y - 26 * s, 8 * s, 26 * s);
    circle(c, x, y - 40 * s, 24 * s, leaf || "#3f9e62");
    circle(c, x - 12 * s, y - 32 * s, 15 * s, leaf || "#3f9e62");
    circle(c, x + 13 * s, y - 33 * s, 16 * s, leaf || "#3f9e62");
    circle(c, x - 6 * s, y - 48 * s, 10 * s, "rgba(255,255,255,.18)");
  }
  function house(c, x, y, w, h, wall, roof, panels) {
    c.fillStyle = wall; c.fillRect(x, y - h, w, h);
    c.beginPath(); c.moveTo(x - 6, y - h); c.lineTo(x + w / 2, y - h - w * 0.45); c.lineTo(x + w + 6, y - h); c.closePath();
    c.fillStyle = roof; c.fill();
    if (panels) {
      c.save(); c.fillStyle = "#2c5fa8";
      c.beginPath();
      c.moveTo(x + w * 0.56, y - h - w * 0.36); c.lineTo(x + w * 0.86, y - h - w * 0.1);
      c.lineTo(x + w * 0.7, y - h - w * 0.02); c.lineTo(x + w * 0.42, y - h - w * 0.28);
      c.closePath(); c.fill(); c.restore();
    }
    c.fillStyle = "#fff6c9"; c.fillRect(x + w * 0.18, y - h * 0.7, w * 0.22, h * 0.24);
    c.fillStyle = "#6b4a33"; c.fillRect(x + w * 0.58, y - h * 0.5, w * 0.22, h * 0.5);
  }
  function turbine(c, x, y, h, angle) {
    c.strokeStyle = "#fbfbf7"; c.lineWidth = Math.max(2, h * 0.04); c.lineCap = "round";
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
    c.lineWidth = Math.max(1.5, h * 0.035);
    for (var i = 0; i < 3; i++) {
      var a = angle + i * Math.PI * 2 / 3;
      c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + Math.cos(a) * h * 0.55, y - h + Math.sin(a) * h * 0.55); c.stroke();
    }
    circle(c, x, y - h, h * 0.05, "#e9e9e2");
  }
  function sceneGarden(c, x, y, w, h) {
    var r = rng(7);
    c.fillStyle = grad(c, x, y, h * 0.6, "#86cdf0", "#e6f6fb"); c.fillRect(x, y, w, h);
    var sg = c.createRadialGradient(x + w * 0.74, y + h * 0.17, 4, x + w * 0.74, y + h * 0.17, w * 0.22);
    sg.addColorStop(0, "rgba(255,226,120,.9)"); sg.addColorStop(1, "rgba(255,226,120,0)");
    c.fillStyle = sg; c.fillRect(x, y, w, h * 0.5);
    circle(c, x + w * 0.74, y + h * 0.17, w * 0.085, C.sun);
    cloud(c, x + w * 0.25, y + h * 0.12, w / 500);
    cloud(c, x + w * 0.55, y + h * 0.27, w / 800);
    hill(c, x, y, w, h, y + h * 0.48, h * 0.03, 2.2, 0.5, "#a7d9ae");
    var base = y + h * 0.6;
    var cols = ["#ffd7a8", "#f7b6c8", "#c9e4ff", "#fff1b8", "#d7c4f5"];
    var hw = w / 5.2;
    for (var i = 0; i < 5; i++) {
      if (i === 2) continue;
      house(c, x + w * 0.02 + i * hw * 1.02, base, hw * 0.82, h * (0.07 + r() * 0.04), cols[i], "#b5574e", i % 2 === 0);
    }
    c.fillStyle = "#7cc38a"; c.fillRect(x, base, w, h - (base - y));
    var vx = x + w * 0.5, top = base + 2;
    c.beginPath();
    c.moveTo(vx - w * 0.08, top); c.lineTo(vx + w * 0.08, top);
    c.lineTo(x + w * 0.98, y + h); c.lineTo(x + w * 0.02, y + h); c.closePath();
    c.fillStyle = "#a9764d"; c.fill();
    var flowers = [C.rose, C.sun, "#ffffff", "#f08a4b", "#c58bf2"];
    for (var row = 0; row < 14; row++) {
      var t = Math.pow((row + 1) / 14, 1.6);
      var yy = top + (y + h - top) * t;
      var half = w * 0.08 + (w * 0.48 - w * 0.08) * t;
      var n = 5 + Math.floor(t * 9);
      c.fillStyle = "#4e9a5c";
      c.fillRect(vx - half, yy - 2 * t - 1, half * 2, 3 * t + 1);
      for (var k = 0; k < n; k++) {
        var fx = vx - half + (half * 2) * (k + 0.5) / n;
        circle(c, fx, yy - 4 * t, 2 + 6 * t, flowers[(k + row) % flowers.length]);
      }
    }
    tree(c, x + w * 0.1, base + h * 0.12, w / 420);
    tree(c, x + w * 0.9, base + h * 0.16, w / 380, "#348f57");
    tree(c, x + w * 0.5, base + 1, w / 1500, "#4aa46b");
  }
  function sceneRiver(c, x, y, w, h) {
    var r = rng(11);
    c.fillStyle = grad(c, x, y, h * 0.55, "#ffd4a3", "#c3e7f6"); c.fillRect(x, y, w, h);
    circle(c, x + w * 0.3, y + h * 0.3, w * 0.09, "#ffcf5c");
    cloud(c, x + w * 0.72, y + h * 0.14, w / 600);
    hill(c, x, y, w, h, y + h * 0.42, h * 0.04, 1.6, 1.2, "#9bcf9f");
    for (var i = 0; i < 4; i++) {
      var tx = x + w * (0.52 + i * 0.12);
      turbine(c, tx, y + h * (0.42 - 0.02 * Math.sin(i * 1.6 + 1.2)), h * (0.12 - i * 0.012), 0.4 + i * 0.7);
    }
    hill(c, x, y, w, h, y + h * 0.52, h * 0.03, 2.4, 0.2, "#6fbd7c");
    c.fillStyle = "#5fb06f"; c.fillRect(x, y + h * 0.55, w, h * 0.45);
    c.beginPath();
    c.moveTo(x + w * 0.46, y + h * 0.52);
    c.bezierCurveTo(x + w * 0.62, y + h * 0.62, x + w * 0.2, y + h * 0.72, x + w * 0.3, y + h);
    c.lineTo(x + w * 0.85, y + h);
    c.bezierCurveTo(x + w * 0.62, y + h * 0.74, x + w * 0.78, y + h * 0.6, x + w * 0.52, y + h * 0.52);
    c.closePath();
    c.fillStyle = grad(c, x, y + h * 0.52, h * 0.48, "#8fd3f2", "#3f9fd3"); c.fill();
    c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = Math.max(1.5, w / 260); c.lineCap = "round";
    for (var s = 0; s < 9; s++) {
      var sy = y + h * (0.6 + s * 0.045);
      var sx = x + w * (0.42 + 0.12 * Math.sin(s * 1.3)) + (s > 5 ? w * 0.06 : 0);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + w * (0.03 + s * 0.006), sy); c.stroke();
    }
    c.strokeStyle = "#8a5a3b"; c.lineWidth = Math.max(3, w / 90);
    c.beginPath(); c.arc(x + w * 0.5, y + h * 0.82, w * 0.26, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    c.lineWidth = Math.max(1.5, w / 260);
    for (var b = 0; b < 7; b++) {
      var a = Math.PI * (1.2 + b * 0.1);
      var px = x + w * 0.5 + Math.cos(a) * w * 0.26, py = y + h * 0.82 + Math.sin(a) * w * 0.26;
      c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - h * 0.03); c.stroke();
    }
    tree(c, x + w * 0.12, y + h * 0.7, w / 400);
    tree(c, x + w * 0.88, y + h * 0.66, w / 430, "#2f8a52");
    tree(c, x + w * 0.2, y + h * 0.95, w / 300, "#348f57");
    c.strokeStyle = C.ink; c.lineWidth = Math.max(1.2, w / 400);
    for (var q = 0; q < 3; q++) {
      var bx = x + w * (0.12 + q * 0.08), by = y + h * (0.16 + r() * 0.06), bs = w * 0.018;
      c.beginPath(); c.moveTo(bx - bs, by); c.quadraticCurveTo(bx - bs / 2, by - bs * 0.7, bx, by);
      c.quadraticCurveTo(bx + bs / 2, by - bs * 0.7, bx + bs, by); c.stroke();
    }
  }

  function sceneNight(c, x, y, w, h) {
    var r = rng(23);
    c.fillStyle = grad(c, x, y, h, "#141c44", "#3d4f8f"); c.fillRect(x, y, w, h);
    for (var i = 0; i < 70; i++) {
      var sx = x + r() * w, sy = y + r() * h * 0.6;
      circle(c, sx, sy, (r() * 1.4 + 0.4) * (w / 500), "rgba(255,255,240," + (0.5 + r() * 0.5) + ")");
    }
    circle(c, x + w * 0.76, y + h * 0.14, w * 0.07, "#fff3c4");
    circle(c, x + w * 0.79, y + h * 0.125, w * 0.06, "#1a2350");
    var base = y + h * 0.86;
    var bx = x - w * 0.02;
    while (bx < x + w) {
      var bw = w * (0.12 + r() * 0.1);
      var bh = h * (0.22 + r() * 0.34);
      c.fillStyle = r() > 0.5 ? "#26346a" : "#2d3d78";
      c.fillRect(bx, base - bh, bw - w * 0.012, bh);
      c.fillStyle = "#3f9e62"; rr(c, bx, base - bh - h * 0.012, bw - w * 0.012, h * 0.018, 3); c.fill();
      circle(c, bx + bw * 0.3, base - bh - h * 0.018, w * 0.014, "#4fb373");
      circle(c, bx + bw * 0.62, base - bh - h * 0.02, w * 0.018, "#3f9e62");
      var cols = Math.max(2, Math.floor(bw / (w * 0.035)));
      var rows = Math.floor(bh / (h * 0.045));
      for (var cc = 0; cc < cols; cc++) {
        for (var rr2 = 0; rr2 < rows; rr2++) {
          if (r() < 0.55) {
            c.fillStyle = r() < 0.8 ? "#ffe08a" : "#ffb8cf";
            c.fillRect(bx + (cc + 0.3) * (bw - w * 0.012) / cols, base - bh + h * 0.03 + rr2 * h * 0.045, w * 0.014, h * 0.018);
          }
        }
      }
      bx += bw;
    }
    c.fillStyle = "#1b2a3f"; c.fillRect(x, base, w, h - (base - y));
    for (var k = 0; k < 4; k++) {
      var lx = x + w * (0.12 + k * 0.25);
      var glow = c.createRadialGradient(lx, base - h * 0.05, 1, lx, base - h * 0.05, w * 0.07);
      glow.addColorStop(0, "rgba(255,224,138,.8)"); glow.addColorStop(1, "rgba(255,224,138,0)");
      c.fillStyle = glow; c.fillRect(lx - w * 0.08, base - h * 0.13, w * 0.16, h * 0.16);
      c.fillStyle = "#c9c9c9"; c.fillRect(lx - 1.5, base - h * 0.05, 3, h * 0.05);
      circle(c, lx, base - h * 0.05, w * 0.008, "#fff1b0");
      tree(c, lx + w * 0.11, base + h * 0.005, w / 900, "#2f7f4f");
    }
  }

  var SCENES = { garden: sceneGarden, river: sceneRiver, night: sceneNight };

  // Illustrated pictures (self-hosted, so the canvas stays exportable). The procedural
  // scenes above draw until an image has loaded; loadImages(onLoad) triggers the redraw.
  var IMAGES = {};
  function loadImages(onLoad) {
    Object.keys(SCENES).forEach(function (k) {
      if (IMAGES[k]) return;
      var img = new Image();
      img.decoding = "async";
      img.onload = function () { if (onLoad) onLoad(k); };
      img.src = "/images/postcards/" + k + ".webp";
      IMAGES[k] = img;
    });
  }
  // Cover-fit: scale to fill w x h, crop the overflow evenly from both sides.
  function paintScene(c, scene, x, y, w, h) {
    var key = SCENES[scene] ? scene : "garden";
    var img = IMAGES[key];
    if (!(img && img.complete && img.naturalWidth)) { SCENES[key](c, x, y, w, h); return false; }
    var s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    var cw = w / s, ch = h / s;
    c.drawImage(img, (img.naturalWidth - cw) / 2, (img.naturalHeight - ch) / 2, cw, ch, x, y, w, h);
    return true;
  }

  function wrapLines(c, text, maxW) {
    var words = String(text).replace(/\s+/g, " ").trim().split(" ");
    var lines = [], line = "";
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + " " + words[i] : words[i];
      if (c.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function clean(s, n) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n); }

  function drawCard(c, d) {
    c.save();
    c.clearRect(0, 0, W, H);
    c.fillStyle = C.paper; c.fillRect(0, 0, W, H);
    c.strokeStyle = "#e7e2d3"; c.lineWidth = 2; c.strokeRect(1, 1, W - 2, H - 2);
    var px = 36, py = 36, pw = 500, ph = 728;
    c.save(); rr(c, px, py, pw, ph, 18); c.clip();
    if (paintScene(c, d.scene, px, py, pw, ph)) {
      // Soft dark band behind the banner so it reads on busy, bright pictures.
      var band = c.createLinearGradient(0, py + ph - 200, 0, py + ph);
      band.addColorStop(0, "rgba(20,26,44,0)");
      band.addColorStop(1, "rgba(20,26,44,.55)");
      c.fillStyle = band; c.fillRect(px, py + ph - 200, pw, 200);
    }
    c.restore();
    c.save();
    c.translate(px + pw / 2, py + ph - 70); c.rotate(-0.06);
    var bsz = 66;
    c.font = "700 " + bsz + "px Caveat, 'Comic Sans MS', cursive";
    while (bsz > 30 && c.measureText("Greetings from 2076!").width > pw - 50) { bsz -= 2; c.font = "700 " + bsz + "px Caveat, 'Comic Sans MS', cursive"; }
    c.textAlign = "center"; c.textBaseline = "middle";
    c.lineJoin = "round"; c.lineWidth = 10; c.strokeStyle = C.ink; c.strokeText("Greetings from 2076!", 0, 0);
    c.fillStyle = "#fff"; c.fillText("Greetings from 2076!", 0, 0);
    c.restore();
    c.strokeStyle = "#ddd6c4"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(580, 70); c.lineTo(580, 730); c.stroke();
    var sx = 1010, sy = 46, sw = 144, sh = 172;
    c.save();
    c.shadowColor = "rgba(29,42,68,.18)"; c.shadowBlur = 8; c.shadowOffsetY = 3;
    c.fillStyle = "#fff"; c.fillRect(sx, sy, sw, sh);
    c.restore();
    for (var i = 0; i <= 12; i++) { circle(c, sx + i * sw / 12, sy, 4.5, C.paper); circle(c, sx + i * sw / 12, sy + sh, 4.5, C.paper); }
    for (var j = 0; j <= 14; j++) { circle(c, sx, sy + j * sh / 14, 4.5, C.paper); circle(c, sx + sw, sy + j * sh / 14, 4.5, C.paper); }
    c.save(); c.beginPath(); c.rect(sx + 12, sy + 12, sw - 24, sh - 52); c.clip();
    paintScene(c, d.scene, sx + 12, sy + 12, sw - 24, sh - 52);
    c.restore();
    c.fillStyle = C.ink; c.font = "700 30px Caveat, cursive"; c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.fillText("2076", sx + sw / 2, sy + sh - 14);
    var mx = 990, my = 150;
    c.save();
    c.globalAlpha = 0.72;
    c.strokeStyle = C.rose; c.fillStyle = C.rose; c.lineWidth = 3;
    c.beginPath(); c.arc(mx, my, 60, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(mx, my, 50, 0, Math.PI * 2); c.stroke();
    c.textAlign = "center"; c.textBaseline = "middle";
    var town = clean(d.from, 32).toUpperCase() || "THE FUTURE";
    town = town.slice(0, 16);
    var tsz = 14;
    c.font = "800 " + tsz + "px 'Bricolage Grotesque', sans-serif";
    while (tsz > 7 && c.measureText(town).width > 70) { tsz -= 1; c.font = "800 " + tsz + "px 'Bricolage Grotesque', sans-serif"; }
    c.fillText(town, mx, my - 22);
    c.font = "800 26px 'Bricolage Grotesque', sans-serif"; c.fillText("2076", mx, my + 2);
    c.font = "800 12px 'Bricolage Grotesque', sans-serif"; c.fillText("A TUESDAY", mx, my + 26);
    c.lineWidth = 3;
    for (var wv = 0; wv < 4; wv++) {
      c.beginPath();
      for (var t = 0; t <= 30; t++) {
        var wx = mx + 68 + t * 4.4, wy = my - 30 + wv * 20 + Math.sin(t / 3) * 5;
        if (t === 0) c.moveTo(wx, wy); else c.lineTo(wx, wy);
      }
      c.stroke();
    }
    c.restore();
    var mxL = 616, mTop = 250, mW = 540, mBottom = 612;
    var name = clean(d.name, 40);
    var paras = [];
    paras.push({ t: "Hello from " + (clean(d.from, 32) || "the future") + "!", bold: true });
    ["where", "tuesday", "built"].forEach(function (k) { var v = clean(d[k], 140); if (v) paras.push({ t: v }); });
    paras.push({ t: "Love from the future," + (name ? " " + name : ""), sign: true });
    var size = 40, lines, lh;
    for (; size >= 22; size -= 1) {
      lh = size * 1.08;
      lines = [];
      for (var p = 0; p < paras.length; p++) {
        c.font = (paras[p].bold ? "700 " : "500 ") + size + "px Caveat, 'Comic Sans MS', cursive";
        var ls = wrapLines(c, paras[p].t, mW);
        for (var q = 0; q < ls.length; q++) lines.push({ t: ls[q], bold: paras[p].bold, sign: paras[p].sign, gap: q === 0 && p > 0 });
      }
      var total = 0;
      for (var m = 0; m < lines.length; m++) total += lh + (lines[m].gap ? size * 0.25 : 0);
      if (mTop + total <= mBottom) break;
    }
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    var yy = mTop;
    c.strokeStyle = "rgba(47,143,91,.16)"; c.lineWidth = 1.5;
    for (var n = 0; n < lines.length; n++) {
      yy += lh + (lines[n].gap ? size * 0.25 : 0);
      c.beginPath(); c.moveTo(mxL, yy + 6); c.lineTo(mxL + mW, yy + 6); c.stroke();
      c.font = (lines[n].bold ? "700 " : "500 ") + size + "px Caveat, 'Comic Sans MS', cursive";
      c.fillStyle = lines[n].sign ? C.leaf : C.ink;
      c.fillText(lines[n].t, mxL, yy);
    }
    c.font = "500 34px Caveat, cursive"; c.fillStyle = C.ink;
    c.fillText("To: everyone back in 2026", 820, 668);
    c.fillText("Planet Earth (doing better)", 820, 722);
    c.strokeStyle = "#cfc7b3"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(814, 678); c.lineTo(1160, 678); c.moveTo(814, 732); c.lineTo(1160, 732); c.stroke();
    c.restore();
  }

export { W, H, LIMITS, clean, drawCard, loadImages };
