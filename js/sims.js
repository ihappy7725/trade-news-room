/* 뉴스별 '만져보기' 시뮬레이터.
   각 함수는 학습실의 빈 영역(el)을 받아 그 안에 조작 UI와 그래프를 그립니다. */
(function () {
  var NS = "http://www.w3.org/2000/svg";

  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function s(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function n(x, d) { return Number(x).toLocaleString("ko-KR", { maximumFractionDigits: d || 0 }); }
  function usd(x) { return "$" + Math.round(x).toLocaleString("en-US"); }
  function pct(x, d) { return (x * 100).toFixed(d == null ? 1 : d) + "%"; }

  function panel(title, flag, real) {
    var p = h("div", { class: "panel" });
    p.appendChild(h("div", { class: "panel-head" }, [h("h4", { text: title }), h("span", { class: "flag " + (real ? "real" : "assume"), text: flag })]));
    return p;
  }
  function out(label, id) { return h("div", { class: "out" }, [h("span", { class: "k", text: label }), h("span", { class: "v", id: id })]); }

  var uid = 0;
  function slider(o) {
    var id = "sl" + (++uid);
    var outEl = h("output", { for: id });
    var inp = h("input", { type: "range", id: id, min: o.min, max: o.max, step: o.step || 1, value: o.value });
    var box = h("div", { class: "ctrl" }, [h("label", { for: id }, [document.createTextNode(o.label), outEl]), inp]);
    if (o.hint) box.appendChild(h("p", { class: "hint", text: o.hint }));
    function show() { outEl.textContent = o.fmt ? o.fmt(+inp.value) : inp.value; }
    inp.addEventListener("input", function () { show(); o.onchange(); });
    show();
    return { el: box, get: function () { return +inp.value; }, set: function (v) { inp.value = v; show(); } };
  }
  function tipOn(viz) { var t = viz.querySelector(".tip"); if (!t) { t = h("div", { class: "tip" }); t.hidden = true; viz.appendChild(t); } return t; }

  var SIMS = {};

  /* ---------- 1. 요소: 실제 통계 + 공급처 나누기 계산기 ---------- */
  SIMS.urea = function (el) {
    var D = window.UREA_DATA, COLORS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];
    var p1 = panel("한국은 요소를 어디서 사 왔을까? (2021–2025)", "실제 통계", true);
    var seg = h("div", { class: "seg", role: "group", "aria-label": "그래프 보기" });
    var b1 = h("button", { type: "button", class: "on", text: "중국 비중 추이" });
    var b2 = h("button", { type: "button", text: "나라별 구성" });
    seg.appendChild(b1); seg.appendChild(b2);
    var legend = h("div", { class: "legend" });
    var viz = h("div", { class: "viz" });
    p1.appendChild(seg); p1.appendChild(legend); p1.appendChild(viz);
    p1.appendChild(h("p", { class: "caption", text: D.caption }));
    p1.appendChild(h("p", { class: "read", text: "2021년 74.65% → 2024년 15.24% → 2025년 40.57%. 중국 비중이 크게 줄었다가 다시 올랐어요. 왜 그랬는지는 이 그래프만으로는 알 수 없어요. 가격, 중국의 수출 정책, 다른 나라 공급 상황을 더 봐야 해요." }));
    el.appendChild(p1);

    var totals = D.years.map(function (_, i) { return D.series.reduce(function (a, s_) { return a + s_.values[i]; }, 0); });
    var mode = "line";
    function drawLegend() {
      legend.textContent = "";
      var list = mode === "line" ? [D.series[0]] : D.series;
      list.forEach(function (s_, i) { legend.appendChild(h("span", {}, [h("i", { style: "background:" + COLORS[i] }), document.createTextNode(s_.name + (mode === "line" ? " 비중 (중량 기준)" : ""))])); });
    }
    function draw() {
      viz.textContent = ""; drawLegend();
      var W = Math.max(300, viz.clientWidth || 640), H = 240, m = { l: 44, r: 20, t: 18, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var svg = s("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "img", "aria-label": mode === "line" ? "중국 비중 추이" : "나라별 구성" });
      var y = function (v) { return m.t + ih * (1 - v); };
      [0, .25, .5, .75, 1].forEach(function (g) {
        svg.appendChild(s("line", { x1: m.l, x2: W - m.r, y1: y(g), y2: y(g), stroke: "#E4ECDF" }));
        var t = s("text", { x: m.l - 8, y: y(g) + 4, "text-anchor": "end" }); t.textContent = g * 100 + "%"; svg.appendChild(t);
      });
      var slot = iw / D.years.length;
      var cx = function (i) { return m.l + slot * i + slot / 2; };
      D.years.forEach(function (yr, i) { var t = s("text", { x: cx(i), y: H - 8, "text-anchor": "middle" }); t.textContent = yr; svg.appendChild(t); });
      viz.appendChild(svg);
      var tip = tipOn(viz);
      function showTip(x, yy, text) { var r = svg.getBoundingClientRect(); tip.hidden = false; tip.textContent = text; tip.style.left = (x * r.width / W) + "px"; tip.style.top = (yy * r.height / H) + "px"; }
      if (mode === "line") {
        var pts = D.years.map(function (yr, i) { var v = D.series[0].values[i] / totals[i]; return { x: cx(i), y: y(v), v: v, yr: yr }; });
        svg.appendChild(s("path", { d: pts.map(function (p, i) { return (i ? "L" : "M") + p.x + " " + p.y; }).join(" ") + " L" + pts[pts.length - 1].x + " " + y(0) + " L" + pts[0].x + " " + y(0) + " Z", fill: "rgba(42,120,214,.10)" }));
        svg.appendChild(s("path", { d: pts.map(function (p, i) { return (i ? "L" : "M") + p.x + " " + p.y; }).join(" "), fill: "none", stroke: COLORS[0], "stroke-width": 2.5, "stroke-linejoin": "round" }));
        pts.forEach(function (p) {
          svg.appendChild(s("circle", { cx: p.x, cy: p.y, r: 5, fill: COLORS[0], stroke: "#fff", "stroke-width": 2 }));
          var lb = s("text", { x: p.x, y: p.y - 12, "text-anchor": "middle", style: "fill:#2B2F2A;font-weight:700" }); lb.textContent = pct(p.v); svg.appendChild(lb);
          var hit = s("rect", { x: p.x - slot / 2, y: m.t, width: slot, height: ih, fill: "transparent" });
          hit.addEventListener("pointerenter", function () { showTip(p.x, p.y, p.yr + "년 중국 " + pct(p.v, 2) + " · " + n(D.series[0].values[D.years.indexOf(p.yr)] / 1e6, 1) + "천 톤"); });
          hit.addEventListener("pointerleave", function () { tip.hidden = true; });
          svg.appendChild(hit);
        });
      } else {
        var bw = Math.min(64, slot * .6);
        D.years.forEach(function (yr, i) {
          var acc = 0, segs = D.series.map(function (s_, k) { return { k: k, v: s_.values[i] / totals[i], name: s_.name }; });
          segs.forEach(function (sg, j) {
            var y0 = y(acc), y1 = y(acc + sg.v); acc += sg.v;
            var last = j === segs.length - 1;
            var r = s("rect", { x: cx(i) - bw / 2, y: y1 + (last ? 0 : 2), width: bw, height: Math.max(0, y0 - y1 - (last ? 0 : 2)), fill: COLORS[sg.k], rx: last ? 4 : 0 });
            r.addEventListener("pointerenter", function () { showTip(cx(i), y1, yr + "년 " + sg.name + " " + pct(sg.v)); });
            r.addEventListener("pointerleave", function () { tip.hidden = true; });
            svg.appendChild(r);
          });
        });
      }
    }
    b1.onclick = function () { mode = "line"; b1.className = "on"; b2.className = ""; draw(); };
    b2.onclick = function () { mode = "bar"; b2.className = "on"; b1.className = ""; draw(); };
    requestAnimationFrame(draw);
    if (window.ResizeObserver) new ResizeObserver(function () { draw(); }).observe(viz);

    /* calculator */
    var p2 = panel("싼 A국에서 다 살까, B국과 나눠 살까?", "학습용 가정", false);
    var grid = h("div", { class: "sim-grid" }), ctrls = h("div", { class: "ctrls" }), right = h("div", { class: "ctrls" });
    var pa = slider({ label: "A국 단가", min: 60, max: 150, value: 100, fmt: function (v) { return v + "원"; }, onchange: calc });
    var pb = slider({ label: "B국 단가", min: 60, max: 200, value: 120, fmt: function (v) { return v + "원"; }, onchange: calc });
    var sh = slider({ label: "A국에서 사는 비중 (총 100단위)", min: 0, max: 100, step: 5, value: 100, fmt: function (v) { return v + "%"; }, onchange: calc });
    var split = h("div", { class: "split", "aria-hidden": "true" }, [h("div", { style: "background:var(--s1)" }), h("div", { style: "background:var(--s2)" })]);
    [pa, pb, sh].forEach(function (x) { ctrls.appendChild(x.el); }); ctrls.appendChild(split);
    var outs = h("div", { class: "outs" }, [out("총비용", "uTotal"), out("전량 A국 대비", "uExtra"), out("A국이 멈추면 남는 물량", "uLeft"), out("A국 의존도", "uDep")]);
    var read = h("p", { class: "read" });
    right.appendChild(outs); right.appendChild(read);
    grid.appendChild(ctrls); grid.appendChild(right); p2.appendChild(grid);
    p2.appendChild(h("p", { class: "assume-note", text: "가정: 두 나라 제품 품질이 같고 가격은 고정, 운임과 관세는 제외. 공급 중단 가능성을 예측하는 계산이 아니라, 비용과 남는 물량의 관계를 보는 연습이에요." }));
    el.appendChild(p2);
    function calc() {
      var a = sh.get(), b = 100 - a, total = a * pa.get() + b * pb.get(), extra = total - 100 * pa.get();
      p2.querySelector("#uTotal").textContent = n(total) + "원";
      p2.querySelector("#uExtra").textContent = (extra >= 0 ? "+" : "−") + n(Math.abs(extra)) + "원";
      p2.querySelector("#uLeft").textContent = b + "단위";
      p2.querySelector("#uDep").textContent = a + "%";
      split.children[0].style.flexBasis = a + "%"; split.children[0].textContent = a >= 14 ? "A " + a : "";
      split.children[1].style.flexBasis = b + "%"; split.children[1].textContent = b >= 14 ? "B " + b : "";
      split.children[0].hidden = a === 0; split.children[1].hidden = b === 0;
      read.textContent = b === 0 ? "가장 싸지만, A국 공급이 멈추면 남는 물량이 0이에요." :
        a === 0 ? "A국 사정과는 무관해졌지만, 이번엔 B국 한 곳에 모두 의존해요." :
        n(Math.abs(extra)) + "원을 " + (extra >= 0 ? "더 내고" : "아끼면서") + " A국이 멈춰도 " + b + "단위를 지킬 수 있어요. 이 추가 비용은 일종의 보험료예요.";
    }
    calc();
  };

  /* ---------- 2. 흑연: 공급 충격 → 가격 ---------- */
  SIMS.shock = function (el) {
    var p = panel("중국이 공급을 줄이면 한국의 흑연 가격은?", "학습용 가정", false);
    var grid = h("div", { class: "sim-grid" }), c = h("div", { class: "ctrls" }), r = h("div", { class: "ctrls" });
    var dep = slider({ label: "한국의 중국 의존도", min: 0, max: 100, value: 94, fmt: function (v) { return v + "%"; }, hint: "뉴스 기준: 2023년 1~9월 인조흑연 94.3%", onchange: calc });
    var cut = slider({ label: "중국 공급 감소율", min: 0, max: 100, step: 5, value: 50, fmt: function (v) { return v + "%"; }, onchange: calc });
    var rep = slider({ label: "줄어든 양 중 대체 공급처로 메운 비율", min: 0, max: 100, step: 5, value: 0, fmt: function (v) { return v + "%"; }, onchange: calc });
    var el_ = slider({ label: "수요의 가격탄력성", min: 2, max: 15, value: 5, fmt: function (v) { return (v / 10).toFixed(1) + (v <= 4 ? " (꼭 필요한 원료)" : v >= 10 ? " (대체하기 쉬움)" : ""); }, hint: "낮을수록 비싸져도 사야 하는 물건이에요.", onchange: calc });
    [dep, cut, rep, el_].forEach(function (x) { c.appendChild(x.el); });
    var bars = h("div", { class: "hbar" });
    var outs = h("div", { class: "outs" }, [out("전체 공급 감소", "gDrop"), out("예상 가격 상승", "gPrice")]);
    var read = h("p", { class: "read" });
    r.appendChild(bars); r.appendChild(outs); r.appendChild(read);
    grid.appendChild(c); grid.appendChild(r); p.appendChild(grid);
    p.appendChild(h("p", { class: "assume-note", text: "단순 모델: 전체 공급 감소율 = 의존도 × 중국 감소율 × (1 − 대체 비율), 가격 상승률 ≈ 공급 감소율 ÷ 탄력성. 실제 가격은 재고, 계약, 투기 등에 따라 달라져요." }));
    el.appendChild(p);
    function row(label, v, color, txt) {
      return h("div", { class: "row" }, [h("span", { text: label }), h("div", { class: "track" }, [h("div", { class: "fill", style: "width:" + Math.min(100, v * 100) + "%;background:" + color })]), h("span", { class: "num", text: txt })]);
    }
    function calc() {
      var d = dep.get() / 100, k = cut.get() / 100, rp = rep.get() / 100, e = el_.get() / 10;
      var drop = d * k * (1 - rp), price = drop / e;
      bars.textContent = "";
      bars.appendChild(row("중국산", d * (1 - k), "var(--s2)", pct(d * (1 - k), 0)));
      bars.appendChild(row("대체 공급", d * k * rp, "var(--s3)", pct(d * k * rp, 0)));
      bars.appendChild(row("다른 나라", 1 - d, "var(--s1)", pct(1 - d, 0)));
      bars.appendChild(row("남은 공급 합계", 1 - drop, "var(--green)", pct(1 - drop, 0)));
      p.querySelector("#gDrop").textContent = pct(drop, 0);
      var gp = p.querySelector("#gPrice"); gp.textContent = price > 3 ? "300% 이상" : "+" + pct(price, 0);
      gp.parentNode.className = "out" + (price > .5 ? " warn" : "");
      read.textContent = drop === 0 ? "공급이 그대로라 가격 압력이 없어요." :
        "의존도가 " + pct(d, 0) + "라서 중국 감소분이 거의 그대로 전체 공급 감소로 이어져요. " + (rp > 0 ? "대체 공급처가 " + pct(rp, 0) + "를 메워 충격이 줄었어요. " : "대체 공급처 비율을 올려 보세요. ") + (e < .5 ? "꼭 필요한 원료라 가격이 크게 뛰어요." : "");
    }
    calc();
  };

  /* ---------- 3. 갈륨: 재고 vs 허가 대기 ---------- */
  SIMS.stock = function (el) {
    var p = panel("허가를 기다리는 동안 공장은 버틸 수 있을까?", "학습용 가정", false);
    var grid = h("div", { class: "sim-grid" }), c = h("div", { class: "ctrls" }), r = h("div", { class: "ctrls" });
    var inv = slider({ label: "보유 재고 (며칠치)", min: 0, max: 120, step: 5, value: 30, fmt: function (v) { return v + "일"; }, onchange: calc });
    var wait = slider({ label: "수출 허가가 나오기까지", min: 0, max: 120, step: 5, value: 75, fmt: function (v) { return v + "일"; }, hint: "뉴스 기준: 한국 등은 2~3개월 안에 수입 재개", onchange: calc });
    var cost = slider({ label: "재고 하루치를 쌓아 두는 비용", min: 1, max: 10, value: 3, fmt: function (v) { return v + "백만 원"; }, onchange: calc });
    [inv, wait, cost].forEach(function (x) { c.appendChild(x.el); });
    var viz = h("div", { class: "viz" });
    var outs = h("div", { class: "outs" }, [out("원료 없이 버틸 기간", "sGap"), out("재고 유지 비용", "sCost")]);
    var read = h("p", { class: "read" });
    r.appendChild(viz); r.appendChild(outs); r.appendChild(read);
    grid.appendChild(c); grid.appendChild(r); p.appendChild(grid);
    p.appendChild(h("p", { class: "assume-note", text: "가정: 허가 전에는 새 원료가 들어오지 않고, 공장은 매일 같은 양을 써요. 비용 숫자는 개념을 보기 위한 예시예요." }));
    el.appendChild(p);
    function calc() {
      var a = inv.get(), w = wait.get(), gap = Math.max(0, w - a), C = a * cost.get();
      var W = 320, H = 92, max = Math.max(a, w, 30), x = function (d) { return 10 + (W - 20) * d / max; };
      viz.textContent = "";
      var svg = s("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "재고와 허가 대기 기간 비교" });
      svg.appendChild(s("rect", { x: 10, y: 22, width: W - 20, height: 22, rx: 6, fill: "#EEF7E8" }));
      if (a > 0) svg.appendChild(s("rect", { x: 10, y: 22, width: x(Math.min(a, max)) - 10, height: 22, rx: 6, fill: "var(--s3)" }));
      if (gap > 0) svg.appendChild(s("rect", { x: x(a), y: 22, width: x(w) - x(a), height: 22, fill: "#D9534A", opacity: .85 }));
      svg.appendChild(s("line", { x1: x(w), x2: x(w), y1: 12, y2: 56, stroke: "#2B2F2A", "stroke-width": 2, "stroke-dasharray": "4 3" }));
      var t1 = s("text", { x: x(w), y: 9, "text-anchor": w > max * .8 ? "end" : "middle", style: "fill:#2B2F2A;font-weight:700" }); t1.textContent = "허가 도착 " + w + "일"; svg.appendChild(t1);
      var t2 = s("text", { x: 10, y: 66 }); t2.textContent = "■ 재고로 버티는 기간"; t2.setAttribute("style", "fill:var(--s3);font-weight:700"); svg.appendChild(t2);
      var t3 = s("text", { x: 10, y: 84 }); t3.textContent = "■ 원료가 없는 기간"; t3.setAttribute("style", "fill:#D9534A;font-weight:700"); svg.appendChild(t3);
      viz.appendChild(svg);
      var g = p.querySelector("#sGap"); g.textContent = gap + "일"; g.parentNode.className = "out" + (gap > 0 ? " warn" : "");
      p.querySelector("#sCost").textContent = n(C) + "백만 원";
      read.textContent = gap > 0 ? "재고가 " + a + "일치라 허가를 기다리는 " + w + "일 중 " + gap + "일은 원료가 없어요. 재고를 늘리면 버틸 수 있지만, 그만큼 비용이 커져요." :
        "재고가 허가 대기 기간보다 길어서 생산을 이어갈 수 있어요. 대신 재고 유지에 " + n(C) + "백만 원이 들어요. 비축은 공급 중단에 대비한 보험이에요.";
    }
    calc();
  };

  /* ---------- 4. 관세: 누가 부담할까 ---------- */
  SIMS.tariff = function (el) {
    var p = panel("관세 15%, 누가 얼마를 낼까?", "학습용 가정", false);
    var grid = h("div", { class: "sim-grid" }), c = h("div", { class: "ctrls" }), r = h("div", { class: "ctrls" });
    var price = slider({ label: "관세 전 자동차 가격", min: 10000, max: 60000, step: 1000, value: 30000, fmt: usd, onchange: calc });
    var rate = slider({ label: "관세율", min: 0, max: 30, value: 15, fmt: function (v) { return v + "%"; }, onchange: function () { mark(); calc(); } });
    var pre = h("div", { class: "presets", role: "group", "aria-label": "관세율 빠른 선택" });
    [[0, "관세 없음"], [15, "합의 15%"], [25, "예고됐던 25%"]].forEach(function (pp) {
      var b = h("button", { type: "button", text: pp[1] }); b.dataset.v = pp[0];
      b.onclick = function () { rate.set(pp[0]); mark(); calc(); }; pre.appendChild(b);
    });
    var share = slider({ label: "관세 중 미국 소비자가 부담하는 비율", min: 0, max: 100, step: 5, value: 100, fmt: function (v) { return v + "%"; }, hint: "나머지는 한국 기업이 가격을 낮춰 떠안아요.", onchange: calc });
    c.appendChild(price.el); c.appendChild(rate.el); c.appendChild(pre); c.appendChild(share.el);
    var bars = h("div", { class: "hbar" });
    var outs = h("div", { class: "outs" }, [out("미국 소비자 가격", "tCons"), out("한국 기업이 받는 돈", "tExp"), out("미국 정부 관세 수입", "tGov"), out("기업 손실", "tLoss")]);
    var read = h("p", { class: "read" });
    r.appendChild(outs); r.appendChild(bars); r.appendChild(read);
    grid.appendChild(c); grid.appendChild(r); p.appendChild(grid);
    p.appendChild(h("p", { class: "assume-note", text: "단순 모델: 관세액 = 관세 전 가격 × 관세율. 그중 일부는 소비자 가격 인상으로, 나머지는 수출 기업의 가격 인하로 나뉜다고 가정해요. 판매량 변화는 넣지 않았어요." }));
    el.appendChild(p);
    function mark() { Array.prototype.forEach.call(pre.children, function (b) { b.className = +b.dataset.v === rate.get() ? "on" : ""; }); }
    function calc() {
      var P = price.get(), t = rate.get() / 100, sh_ = share.get() / 100, T = P * t;
      var cons = P + sh_ * T, exp = P - (1 - sh_) * T;
      p.querySelector("#tCons").textContent = usd(cons);
      p.querySelector("#tExp").textContent = usd(exp);
      p.querySelector("#tGov").textContent = usd(T);
      var l = p.querySelector("#tLoss"); l.textContent = (1 - sh_) * T > 0 ? "−" + usd((1 - sh_) * T) : "$0"; l.parentNode.className = "out" + ((1 - sh_) * T > 0 ? " warn" : "");
      bars.textContent = "";
      var max = P * 1.3;
      [["소비자 가격", cons, "var(--s1)"], ["기업 수취액", exp, "var(--s3)"], ["관세 수입", T, "var(--s2)"]].forEach(function (b) {
        bars.appendChild(h("div", { class: "row" }, [h("span", { text: b[0] }), h("div", { class: "track" }, [h("div", { class: "fill", style: "width:" + (b[1] / max * 100) + "%;background:" + b[2] })]), h("span", { class: "num", text: usd(b[1]) })]));
      });
      read.textContent = t === 0 ? "관세가 없으면 소비자 가격과 기업이 받는 돈이 같아요." :
        "차 한 대에 관세 " + usd(T) + "가 붙어요. " + (sh_ === 1 ? "전부 미국 소비자가 부담하면 가격이 " + usd(T) + " 올라 판매가 줄 수 있어요." :
        sh_ === 0 ? "한국 기업이 전부 떠안으면 소비자 가격은 그대로지만 기업이 받는 돈이 " + usd(T) + " 줄어요." :
        "소비자가 " + usd(sh_ * T) + ", 한국 기업이 " + usd((1 - sh_) * T) + "를 나눠 부담해요. 이것을 관세 귀착이라고 해요.");
    }
    mark(); calc();
  };

  /* ---------- 5. 홍해: 항로 선택 ---------- */
  SIMS.route = function (el) {
    var p = panel("수에즈로 갈까, 희망봉으로 돌아갈까?", "실제 운임 + 학습용 가정", false);
    var grid = h("div", { class: "sim-grid" }), c = h("div", { class: "ctrls" }), r = h("div", { class: "ctrls" });
    var seg = h("div", { class: "seg", role: "group", "aria-label": "항로 선택" });
    var bS = h("button", { type: "button", class: "on", text: "수에즈 운하" }), bC = h("button", { type: "button", text: "희망봉 우회" });
    seg.appendChild(bS); seg.appendChild(bC);
    var route = "suez";
    var base = slider({ label: "수에즈 경유 항해 일수", min: 20, max: 40, value: 30, fmt: function (v) { return v + "일"; }, hint: "예시 값이에요.", onchange: calc });
    var extra = slider({ label: "우회로 늘어나는 일수", min: 5, max: 20, value: 10, fmt: function (v) { return v + "일"; }, hint: "뉴스 기준: 7~10일", onchange: calc });
    var val = slider({ label: "컨테이너 1개에 실린 화물 가치", min: 20000, max: 500000, step: 10000, value: 100000, fmt: usd, onchange: calc });
    var ir = slider({ label: "화물에 묶인 돈의 연 이자율", min: 2, max: 15, value: 8, fmt: function (v) { return v + "%"; }, onchange: calc });
    c.appendChild(seg); [base, extra, val, ir].forEach(function (x) { c.appendChild(x.el); });
    var viz = h("div", { class: "viz" });
    var outs = h("div", { class: "outs" }, [out("항해 일수", "rDays"), out("40피트 운임", "rRate"), out("늘어난 이자 비용", "rInt"), out("컨테이너당 추가 비용", "rTot")]);
    var read = h("p", { class: "read" });
    r.appendChild(viz); r.appendChild(outs); r.appendChild(read);
    grid.appendChild(c); grid.appendChild(r); p.appendChild(grid);
    p.appendChild(h("p", { class: "assume-note", text: "운임은 기사에 실린 드루리 지수 상하이–로테르담 값(1,910달러 → 3,577달러)이에요. 항해 일수, 화물 가치, 이자율은 예시 값이에요. 이자 비용 = 화물 가치 × 연 이자율 × 늘어난 일수 ÷ 365." }));
    el.appendChild(p);
    bS.onclick = function () { route = "suez"; bS.className = "on"; bC.className = ""; calc(); };
    bC.onclick = function () { route = "cape"; bC.className = "on"; bS.className = ""; calc(); };
    function drawMap() {
      viz.textContent = "";
      var svg = s("svg", { viewBox: "0 0 320 190", role: "img", "aria-label": "아시아에서 유럽으로 가는 두 항로" });
      svg.appendChild(s("rect", { x: 0, y: 0, width: 320, height: 190, rx: 14, fill: "#DDF3F7" }));
      svg.appendChild(s("path", { d: "M18 18 Q60 8 104 22 L110 58 Q96 66 84 60 Q60 70 40 60 Q22 48 18 18Z", fill: "#B4DE92", stroke: "#5E9A49", "stroke-width": 1.5 }));
      svg.appendChild(s("path", { d: "M96 64 Q126 60 136 78 Q140 110 122 140 Q112 170 98 172 Q86 150 82 118 Q70 92 96 64Z", fill: "#B4DE92", stroke: "#5E9A49", "stroke-width": 1.5 }));
      svg.appendChild(s("path", { d: "M150 20 Q240 6 304 30 L306 92 Q262 92 238 76 Q200 84 176 66 Q150 56 150 20Z", fill: "#B4DE92", stroke: "#5E9A49", "stroke-width": 1.5 }));
      [["유럽", 40, 30], ["아프리카", 108, 112], ["아시아", 240, 48]].forEach(function (t) { var tt = s("text", { x: t[1], y: t[2], "text-anchor": "middle", style: "fill:#2C6C28;font-weight:700" }); tt.textContent = t[0]; svg.appendChild(tt); });
      var suez = s("path", { d: "M276 96 Q220 108 168 96 Q140 84 124 72 Q100 56 80 46", fill: "none", stroke: route === "suez" ? "#2a78d6" : "#A9B6BF", "stroke-width": route === "suez" ? 4 : 2, "stroke-dasharray": route === "suez" ? "0" : "5 5", "stroke-linecap": "round" });
      var cape = s("path", { d: "M276 96 Q230 130 170 150 Q128 186 98 180 Q58 168 60 120 Q62 76 80 46", fill: "none", stroke: route === "cape" ? "#eb6834" : "#A9B6BF", "stroke-width": route === "cape" ? 4 : 2, "stroke-dasharray": route === "cape" ? "0" : "5 5", "stroke-linecap": "round" });
      svg.appendChild(suez); svg.appendChild(cape);
      svg.appendChild(s("circle", { cx: 124, cy: 72, r: 5, fill: "#F6C343", stroke: "#2B2F2A", "stroke-width": 1.5 }));
      var sl = s("text", { x: 138, y: 62, style: "fill:#2B2F2A;font-weight:700;font-size:11px" }); sl.textContent = "수에즈 · 홍해"; svg.appendChild(sl);
      var cl = s("text", { x: 104, y: 186, "text-anchor": "middle", style: "fill:#2B2F2A;font-size:11px" }); cl.textContent = "희망봉"; svg.appendChild(cl);
      [["상하이", 276, 96, 282, 114], ["로테르담", 80, 46, 64, 58]].forEach(function (t) { svg.appendChild(s("circle", { cx: t[1], cy: t[2], r: 3.5, fill: "#2B2F2A" })); var tt = s("text", { x: t[3], y: t[4], "text-anchor": "middle", style: "fill:#2B2F2A;font-size:11px" }); tt.textContent = t[0]; svg.appendChild(tt); });
      viz.appendChild(svg);
    }
    function calc() {
      var cape = route === "cape", days = base.get() + (cape ? extra.get() : 0), rate = cape ? 3577 : 1910;
      var intr = cape ? val.get() * ir.get() / 100 * extra.get() / 365 : 0, tot = cape ? (3577 - 1910) + intr : 0;
      p.querySelector("#rDays").textContent = days + "일";
      p.querySelector("#rRate").textContent = usd(rate);
      p.querySelector("#rInt").textContent = cape ? "+" + usd(intr) : "$0";
      var t = p.querySelector("#rTot"); t.textContent = cape ? "+" + usd(tot) : "$0"; t.parentNode.className = "out" + (cape ? " warn" : "");
      drawMap();
      read.textContent = cape ? "돌아가는 " + extra.get() + "일 동안 운임이 " + usd(1667) + " 오르고, 화물에 묶인 돈의 이자 " + usd(intr) + "가 더 들어요. 이 비용은 결국 수입품 가격과 공장의 원료 도착 시간에 영향을 줘요." :
        "수에즈 운하로 가면 가장 짧지만, 홍해가 위험해지면 배가 이 길을 쓸 수 없어요. 희망봉 우회를 눌러 비교해 보세요.";
    }
    calc();
  };

  window.SIMS = SIMS;
})();
