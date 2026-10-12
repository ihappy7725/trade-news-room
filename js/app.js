/* 뉴스 속 무역 공부방 · 화면 동작 */
(function () {
  var KEY = "trade-news-room-v1";
  var NEWS = window.NEWS, TERMS = window.TERMS, SPOTS = window.SPOTS, TOPICS = window.TOPICS;
  var S = { quiz: {}, notes: {}, done: {}, saved: [], savedAt: "" };
  var canStore = true;

  function $(id) { return document.getElementById(id); }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "class") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function byId(id) { for (var i = 0; i < NEWS.length; i++) if (NEWS[i].id === id) return NEWS[i]; return null; }
  function topicLabel(t) { for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i].id === t) return TOPICS[i].label; return t; }
  function fmtDate(d) { var p = d.split("-"); return p.length === 3 ? p[0] + "." + p[1] + "." + p[2] : p[0] + "." + p[1]; }

  /* ---------- storage ---------- */
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); S.quiz = o.quiz || {}; S.notes = o.notes || {}; S.done = o.done || {}; S.saved = o.saved || []; S.savedAt = o.savedAt || ""; } }
    catch (e) { canStore = false; }
  }
  var tSave = null;
  function save() {
    clearTimeout(tSave);
    tSave = setTimeout(function () {
      S.savedAt = new Date().toISOString();
      try { localStorage.setItem(KEY, JSON.stringify(S)); canStore = true; } catch (e) { canStore = false; }
      renderStatus(); renderCards(); renderRecord(); renderLive();
    }, 400);
  }
  function renderStatus() {
    var d = S.savedAt ? new Date(S.savedAt) : null;
    $("saveStatus").textContent = !canStore ? "이 브라우저에서는 자동 저장이 안 돼요. 백업 저장을 써 주세요." :
      d ? "자동 저장됨 · " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") : "";
  }
  function quizScore(id) {
    var n = byId(id), a = S.quiz[id] || [], right = 0, tried = 0;
    n.quiz.forEach(function (q, i) { if (a[i] != null) { tried++; if (a[i] === q.answer) right++; } });
    return { right: right, tried: tried, total: n.quiz.length };
  }
  function hasNote(id) { var x = S.notes[id]; return !!(x && ((x.learn || "").trim() || (x.en || "").trim())); }

  /* ---------- icons ---------- */
  var ICONS = {
    supply: '<svg viewBox="0 0 64 64" class="ico" aria-hidden="true"><rect x="8" y="30" width="22" height="22" rx="3" fill="#F2B134" stroke="#3A3A33" stroke-width="2"/><rect x="32" y="30" width="22" height="22" rx="3" fill="#7CC36B" stroke="#3A3A33" stroke-width="2"/><rect x="20" y="8" width="22" height="22" rx="3" fill="#3F86C8" stroke="#3A3A33" stroke-width="2"/><path d="M19 41h0M43 41h0M31 19h0" stroke="#3A3A33" stroke-width="4" stroke-linecap="round"/></svg>',
    control: '<svg viewBox="0 0 64 64" class="ico" aria-hidden="true"><rect x="12" y="28" width="40" height="28" rx="6" fill="#F08A3C" stroke="#3A3A33" stroke-width="2"/><path d="M20 28v-8a12 12 0 0 1 24 0v8" fill="none" stroke="#3A3A33" stroke-width="4"/><circle cx="32" cy="40" r="4" fill="#3A3A33"/><path d="M32 43v6" stroke="#3A3A33" stroke-width="3" stroke-linecap="round"/></svg>',
    tariff: '<svg viewBox="0 0 64 64" class="ico" aria-hidden="true"><path d="M14 6h36v52l-6-4-6 4-6-4-6 4-6-4-6 4z" fill="#FFFFFF" stroke="#3A3A33" stroke-width="2" stroke-linejoin="round"/><circle cx="25" cy="22" r="4" fill="none" stroke="#3F86C8" stroke-width="3"/><circle cx="39" cy="38" r="4" fill="none" stroke="#3F86C8" stroke-width="3"/><path d="M40 20 24 40" stroke="#3F86C8" stroke-width="3" stroke-linecap="round"/></svg>',
    logistics: '<svg viewBox="0 0 64 64" class="ico" aria-hidden="true"><rect x="16" y="20" width="12" height="10" fill="#E2574C" stroke="#3A3A33" stroke-width="1.6"/><rect x="28" y="20" width="12" height="10" fill="#F2B134" stroke="#3A3A33" stroke-width="1.6"/><rect x="40" y="14" width="8" height="16" fill="#FFFFFF" stroke="#3A3A33" stroke-width="1.6"/><path d="M6 30h52l-6 14H12z" fill="#2F5D8A" stroke="#3A3A33" stroke-width="2" stroke-linejoin="round"/><path d="M6 52q6-4 12 0t12 0 12 0 12 0" fill="none" stroke="#3F86C8" stroke-width="3" stroke-linecap="round"/></svg>'
  };

  /* ---------- news list ---------- */
  var topic = "all", query = "";
  function matches(n) {
    if (topic !== "all" && n.topic !== topic) return false;
    if (!query) return true;
    var hay = [n.title, n.lead, n.region, topicLabel(n.topic)].concat(n.summary).concat(n.terms.map(function (t) { var x = TERMS[t]; return x ? x.ko + " " + x.en + " " + x.zh : ""; })).join(" ").toLowerCase();
    return hay.indexOf(query.toLowerCase()) > -1;
  }
  function renderChips() {
    var box = $("topicChips"); box.textContent = "";
    TOPICS.filter(function (t) { return t.id === "all" || NEWS.some(function (n) { return n.topic === t.id; }); }).forEach(function (t) {
      var b = h("button", { class: "chip", role: "tab", type: "button", "aria-selected": String(t.id === topic), text: t.label });
      b.onclick = function () { click(); topic = t.id; renderChips(); renderCards(); };
      box.appendChild(b);
    });
  }
  function renderCards() {
    var box = $("newsCards"); box.textContent = "";
    var list = NEWS.filter(matches);
    var note = $("searchNote");
    if (query) {
      note.hidden = false; note.textContent = "‘" + query + "’ 검색 결과 " + list.length + "건 ";
      var clr = h("button", { type: "button", text: "검색 지우기" }); clr.onclick = function () { setQuery(""); }; note.appendChild(clr);
    } else note.hidden = true;
    if (!list.length) { box.appendChild(h("p", { class: "empty", text: "조건에 맞는 뉴스가 없어요. 다른 주제를 고르거나 검색어를 지워 보세요." })); return; }
    list.forEach(function (n) {
      var sc = quizScore(n.id);
      var card = h("button", { class: "card t-" + n.topic, type: "button", "aria-label": n.title + " 학습하기" });
      var top = h("div", { class: "card-top" }, [h("span", { class: "tag", text: topicLabel(n.topic) })]);
      top.insertAdjacentHTML("beforeend", ICONS[n.topic] || "");
      var prog = h("div", { class: "prog" }, [
        h("span", { class: "pchip" + (sc.tried === sc.total ? " ok" : ""), text: "퀴즈 " + sc.right + "/" + sc.total }),
        h("span", { class: "pchip" + (hasNote(n.id) ? " ok" : ""), text: hasNote(n.id) ? "기록 완료" : "기록 전" }),
        S.done[n.id] ? h("span", { class: "pchip ok", text: "학습 완료" }) : null
      ]);
      card.appendChild(top);
      card.appendChild(h("div", { class: "card-body" }, [
        h("span", { class: "card-meta", text: fmtDate(n.date) + " · " + n.region }),
        h("h3", { text: n.title }),
        h("p", { class: "lead", text: n.lead }),
        h("div", { class: "card-foot" }, [prog, h("span", { class: "go-link", text: "학습하기 →" })])
      ]));
      card.onclick = function () { openRoom(n.id); };
      box.appendChild(card);
    });
    if (topic === "all" && !query) {
      box.appendChild(h("div", { class: "card soon" }, [h("div", { class: "card-body" }, [
        h("span", { class: "card-meta", text: "다음 학습실 준비 중" }),
        h("h3", { text: "환율: 원화가 약해지면 수출에는 유리할까?" }),
        h("p", { class: "lead", text: "무역 맵의 은행에서 미리 개념을 살펴볼 수 있어요." })
      ])]));
    }
  }
  function setQuery(q) {
    query = q.trim(); $("q").value = query; $("glQ").value = query;
    topic = "all"; renderChips(); renderCards(); renderGlossary();
  }
  $("searchForm").addEventListener("submit", function (e) {
    e.preventDefault(); setQuery($("q").value);
    document.getElementById("news").scrollIntoView({ behavior: "smooth" });
  });

  /* ---------- map ---------- */
  var current = null, mapCat = "all";
  var MAP_CATS = window.MAP_CATS || [{ id: "all", label: "전체" }];
  function catLabel(c) { for (var i = 0; i < MAP_CATS.length; i++) if (MAP_CATS[i].id === c) return MAP_CATS[i].label; return ""; }
  function spotById(id) { for (var i = 0; i < SPOTS.length; i++) if (SPOTS[i].id === id) return SPOTS[i]; return null; }
  function renderPins() {
    var pins = $("pins");
    SPOTS.forEach(function (sp) {
      var b = h("button", { class: "pin", type: "button", style: "left:" + sp.x + "%;top:" + sp.y + "%", "data-spot": sp.id, "data-cat": sp.cat, text: sp.label });
      b.onclick = function () { click(); selectSpot(sp.id, true); };
      b.onmouseenter = function () { hot(sp.id, true); }; b.onmouseleave = function () { hot(sp.id, false); };
      b.onfocus = function () { hot(sp.id, true); }; b.onblur = function () { hot(sp.id, false); };
      pins.appendChild(b);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".spot-g"), function (g) {
      g.addEventListener("click", function () { selectSpot(g.getAttribute("data-spot"), true); });
    });
    renderMapCats();
  }
  function renderMapCats() {
    var box = $("mapCats");
    if (box) {
      box.textContent = "";
      MAP_CATS.forEach(function (c) {
        var n = c.id === "all" ? SPOTS.length : SPOTS.filter(function (s_) { return s_.cat === c.id; }).length;
        var b = h("button", { type: "button", class: "mcat" + (c.id === mapCat ? " on" : ""), "aria-pressed": String(c.id === mapCat) }, [c.label, h("span", { class: "n", text: String(n) })]);
        b.onclick = function () { click(); mapCat = c.id; renderMapCats(); };
        box.appendChild(b);
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll(".pin"), function (p) { p.classList.toggle("off", mapCat !== "all" && p.getAttribute("data-cat") !== mapCat); });
    if (window.TradeMap3D && window.TradeMap3D.filter) window.TradeMap3D.filter(mapCat);
    var chips = $("mapChips"); chips.textContent = "";
    SPOTS.filter(function (s_) { return mapCat === "all" || s_.cat === mapCat; }).forEach(function (sp) {
      var c = h("button", { type: "button", "data-spot": sp.id, class: sp.id === current ? "on" : "", text: sp.label });
      c.onclick = function () { click(); selectSpot(sp.id, true); };
      chips.appendChild(c);
    });
  }
  function hot(id, on) { var g = $("g-" + id); if (g) g.classList.toggle("hot", on || id === current); if (window.TradeMap3D) window.TradeMap3D.highlight(id, on); }
  window.addEventListener("trademap:select", function (e) { click(); selectSpot(e.detail, true); });
  window.addEventListener("trademap:ready", function () { if (window.TradeMap3D) { if (current) window.TradeMap3D.select(current); if (window.TradeMap3D.filter) window.TradeMap3D.filter(mapCat); } });
  function click() { if (window.Sound) window.Sound.click(); }
  function goLive(t) {
    liveTopic = t || "all"; renderLiveTools(); renderLive();
    document.getElementById("live").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function selectSpot(id, scroll) {
    var sp = spotById(id); if (!sp) return;
    current = id;
    if (window.TradeMap3D) window.TradeMap3D.select(id);
    Array.prototype.forEach.call(document.querySelectorAll("[data-spot]"), function (b) { if (b.classList && b.tagName === "BUTTON") b.classList.toggle("on", b.getAttribute("data-spot") === id); });
    Array.prototype.forEach.call(document.querySelectorAll(".spot-g"), function (g) { g.classList.toggle("hot", g.getAttribute("data-spot") === id); });
    var box = $("mapInfo"); box.textContent = "";
    var tchips = h("div", { class: "tchips" });
    sp.terms.forEach(function (t) {
      var x = TERMS[t]; if (!x) return;
      var b = h("button", { class: "tchip", type: "button", text: x.ko + " · " + x.en }); b.onclick = function () { setQuery(x.ko); document.getElementById("glossary").scrollIntoView({ behavior: "smooth" }); };
      tchips.appendChild(b);
    });
    var main = h("div", { class: "info-main" }, [
      h("span", { class: "eyebrow-s", text: "무역 맵 · " + catLabel(sp.cat) + " · " + sp.label }),
      h("h3", { text: sp.title }),
      h("p", { text: sp.text }),
      tchips
    ]);
    var side = h("div", { class: "info-side" });
    if (sp.news) {
      var nn = byId(sp.news);
      var room = h("div", { class: "info-room" }, [h("span", { class: "k", text: "관련 학습실" }), h("b", { text: nn.title })]);
      var go = h("button", { class: "btn primary", type: "button", text: "학습실 열기 →" });
      go.onclick = function () { openRoom(nn.id); };
      room.appendChild(go); side.appendChild(room);
    }
    // 관련 실시간 뉴스
    var rel = h("div", { class: "info-news" }, [h("span", { class: "k", text: "관련 실시간 뉴스 · " + topicLabel(sp.live) })]);
    var list = (LIVE.state === "ok" ? LIVE.articles : []).filter(function (a) { return a.topic === sp.live; }).slice(0, 3);
    if (list.length) {
      var ul = h("ul");
      list.forEach(function (a) { ul.appendChild(h("li", {}, [h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer", text: a.title }), h("small", { text: (a.source || "") + (a.date ? " · " + ago(a.date) : "") })])); });
      rel.appendChild(ul);
    } else {
      rel.appendChild(h("p", { class: "fine", text: LIVE.state === "ok" ? "지금은 이 분류의 실시간 뉴스가 없어요." : LIVE.state === "loading" ? "실시간 뉴스를 불러오는 중이에요." : "배포한 사이트에서 실시간 뉴스가 여기에 보여요." }));
    }
    var more = h("button", { class: "btn small", type: "button", text: topicLabel(sp.live) + " 뉴스 모두 보기 →" });
    more.onclick = function () { goLive(sp.live); };
    rel.appendChild(more); side.appendChild(rel);
    box.appendChild(h("div", { class: "info-card" }, [main, side]));
    if (scroll) {
      box.scrollIntoView({ behavior: "smooth", block: "start" });
      box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
    }
  }

  /* ---------- learning room ---------- */
  var openId = null, lastFocus = null;
  function openRoom(id) {
    var n = byId(id); if (!n) return;
    openId = id; lastFocus = document.activeElement;
    $("roomMeta").textContent = "";
    $("roomMeta").appendChild(h("span", { class: "tag", text: topicLabel(n.topic) }));
    $("roomMeta").appendChild(h("span", { text: fmtDate(n.date) + " · " + n.region }));
    $("roomTitle").textContent = n.title;
    $("roomLead").textContent = n.lead;
    var sum = $("roomSummary"); sum.textContent = ""; n.summary.forEach(function (p) { sum.appendChild(h("p", { text: p })); });
    var src = $("roomSources"); src.textContent = "출처: ";
    n.sources.forEach(function (s_) { src.appendChild(h("a", { href: s_.url, target: "_blank", rel: "noopener", text: s_.label })); });
    var sim = $("roomSim"); sim.textContent = "";
    if (window.SIMS[n.sim]) window.SIMS[n.sim](sim);
    renderQuiz(n);
    var tg = $("roomTerms"); tg.textContent = "";
    n.terms.forEach(function (t) { tg.appendChild(termCard(t)); });
    var note = S.notes[id] || {};
    $("noteLearn").value = note.learn || ""; $("noteEn").value = note.en || "";
    renderDone();
    var idx = NEWS.indexOf(n);
    $("prevNews").disabled = idx === 0; $("nextNews").disabled = idx === NEWS.length - 1;
    $("room").hidden = false; document.body.style.overflow = "hidden";
    $("room").scrollTop = 0;
    document.querySelector(".room-panel").focus();
    try { history.replaceState(null, "", "#learn-" + id); } catch (e) {}
  }
  function closeRoom() {
    $("room").hidden = true; document.body.style.overflow = ""; openId = null;
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  Array.prototype.forEach.call(document.querySelectorAll("[data-close]"), function (b) { b.addEventListener("click", closeRoom); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && openId) closeRoom(); });
  $("prevNews").onclick = function () { var i = NEWS.indexOf(byId(openId)); if (i > 0) openRoom(NEWS[i - 1].id); };
  $("nextNews").onclick = function () { var i = NEWS.indexOf(byId(openId)); if (i < NEWS.length - 1) openRoom(NEWS[i + 1].id); };
  Array.prototype.forEach.call(document.querySelectorAll(".room-steps a"), function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); var t = document.querySelector(a.getAttribute("href")); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); });
  });

  function renderQuiz(n) {
    var box = $("roomQuiz"); box.textContent = "";
    var wrap = h("div", { class: "quiz" });
    var scoreEl = h("p", { class: "score" });
    function updScore() { var sc = quizScore(n.id); scoreEl.textContent = sc.tried ? "맞힌 문제 " + sc.right + " / " + sc.total : "보기를 눌러 답을 골라 보세요."; }
    n.quiz.forEach(function (q, qi) {
      var card = h("div", { class: "q" }, [h("p", { class: "qt", text: (qi + 1) + ". " + q.q })]);
      var opts = h("div", { class: "opts" }), why = h("p", { class: "why" }); why.hidden = true;
      q.options.forEach(function (o, oi) {
        var b = h("button", { class: "opt", type: "button", text: o });
        b.onclick = function () {
          S.quiz[n.id] = S.quiz[n.id] || []; S.quiz[n.id][qi] = oi; save(); paint(); updScore();
        };
        opts.appendChild(b);
      });
      function paint() {
        var a = (S.quiz[n.id] || [])[qi];
        Array.prototype.forEach.call(opts.children, function (b, oi) {
          b.className = "opt" + (a == null ? "" : oi === q.answer ? " right" : oi === a ? " wrong" : "");
          b.setAttribute("aria-pressed", String(a === oi));
        });
        if (a == null) { why.hidden = true; return; }
        why.hidden = false; why.className = "why" + (a === q.answer ? "" : " no"); why.textContent = "";
        why.appendChild(h("b", { text: a === q.answer ? "정답이에요. " : "아쉬워요. 정답은 ‘" + q.options[q.answer] + "’. " }));
        why.appendChild(document.createTextNode(q.why));
      }
      card.appendChild(opts); card.appendChild(why); wrap.appendChild(card); paint();
    });
    var reset = h("button", { class: "btn small", type: "button", text: "퀴즈 다시 풀기" });
    reset.onclick = function () { delete S.quiz[n.id]; save(); renderQuiz(n); };
    box.appendChild(wrap);
    box.appendChild(h("div", { class: "room-foot" }, [scoreEl, reset]));
    updScore();
  }
  function termCard(id) {
    var x = TERMS[id]; if (!x) return null;
    return h("div", { class: "term" }, [h("span", { class: "ko", text: x.ko }), h("div", { class: "lang" }, [h("span", { text: x.en }), h("span", { text: x.zh, lang: "zh" })]), h("p", { class: "def", text: x.def })]);
  }
  function noteInput() {
    if (!openId) return;
    S.notes[openId] = { learn: $("noteLearn").value, en: $("noteEn").value, at: new Date().toISOString() };
    $("noteStatus").textContent = "저장 중…"; save();
    clearTimeout(noteInput.t); noteInput.t = setTimeout(function () { $("noteStatus").textContent = canStore ? "저장됨" : "자동 저장이 안 돼요"; }, 600);
  }
  $("noteLearn").addEventListener("input", noteInput); $("noteEn").addEventListener("input", noteInput);
  function renderDone() { var d = !!S.done[openId]; $("doneBtn").textContent = d ? "학습 완료 ✓ (다시 누르면 취소)" : "학습 완료 표시"; $("doneBtn").className = "btn" + (d ? "" : " primary"); $("noteStatus").textContent = ""; }
  $("doneBtn").onclick = function () { if (!openId) return; if (S.done[openId]) delete S.done[openId]; else S.done[openId] = true; save(); renderDone(); };

  /* ---------- record ---------- */
  function renderRecord() {
    var done = NEWS.filter(function (n) { return S.done[n.id]; }).length;
    var right = 0, total = 0; NEWS.forEach(function (n) { var sc = quizScore(n.id); right += sc.right; total += sc.total; });
    var notes = NEWS.filter(function (n) { return hasNote(n.id); });
    var st = $("stats"); st.textContent = "";
    [["학습 완료한 뉴스", done, NEWS.length], ["맞힌 퀴즈", right, total], ["남긴 배운 점", notes.length, NEWS.length]].forEach(function (x) {
      var m = h("div", { class: "meter" }, [h("i", { style: "width:" + (x[2] ? x[1] / x[2] * 100 : 0) + "%" })]);
      st.appendChild(h("div", { class: "stat" }, [h("span", { class: "k", text: x[0] }), h("span", { class: "v", text: x[1] + " / " + x[2] }), m]));
    });
    renderSaved();
    var nl = $("notesList"); nl.textContent = "";
    if (!notes.length) { nl.appendChild(h("p", { class: "empty", text: "아직 기록한 배운 점이 없어요. 뉴스 하나를 골라 학습실 맨 아래에 한두 줄 남겨 보세요." })); return; }
    notes.forEach(function (n) {
      var x = S.notes[n.id];
      var card = h("div", { class: "note" }, [h("b", { text: n.title }), x.learn ? h("p", { text: x.learn }) : null, x.en ? h("p", { class: "en", text: x.en }) : null]);
      var open = h("button", { class: "btn small", type: "button", text: "학습실 다시 열기" }); open.onclick = function () { openRoom(n.id); };
      card.appendChild(h("div", {}, [open])); nl.appendChild(card);
    });
  }

  /* ---------- glossary ---------- */
  function renderGlossary() {
    var q = ($("glQ").value || "").trim().toLowerCase(), box = $("glList"); box.textContent = "";
    var keys = Object.keys(TERMS).filter(function (k) { var x = TERMS[k]; return !q || (x.ko + " " + x.en + " " + x.zh + " " + x.def).toLowerCase().indexOf(q) > -1; });
    keys.sort(function (a, b) { return TERMS[a].ko.localeCompare(TERMS[b].ko, "ko"); });
    var LIMIT = 9, showAll = glAll || !!q;
    keys.forEach(function (k, i) { var c = termCard(k); if (!showAll && i >= LIMIT) c.hidden = true; box.appendChild(c); });
    $("glCount").textContent = keys.length + "개 용어";
    if (!keys.length) box.appendChild(h("p", { class: "empty", text: "찾는 용어가 없어요. 다른 말로 검색해 보세요." }));
    var more = $("glMore");
    if (more) { more.hidden = !!q || keys.length <= LIMIT; more.textContent = glAll ? "접기" : "용어 " + keys.length + "개 모두 보기"; }
  }
  var glAll = false;
  if ($("glMore")) $("glMore").addEventListener("click", function () { glAll = !glAll; renderGlossary(); });
  $("glQ").addEventListener("input", renderGlossary);

  /* ---------- export / import ---------- */
  function mdExport() {
    var L = ["# 뉴스 속 무역 공부방 · 내 학습 기록", "", "내보낸 날짜: " + new Date().toISOString().slice(0, 10), ""];
    NEWS.forEach(function (n) {
      var sc = quizScore(n.id), x = S.notes[n.id] || {};
      L.push("## " + n.title, "- 날짜: " + n.date + " · " + n.region, "- 퀴즈: " + sc.right + "/" + sc.total + (S.done[n.id] ? " · 학습 완료" : ""));
      L.push("- 핵심 용어: " + n.terms.map(function (t) { var y = TERMS[t]; return y ? y.ko + " (" + y.en + " / " + y.zh + ")" : t; }).join(", "));
      L.push("", "배운 점: " + (x.learn || "(아직 없음)"));
      if (x.en) L.push("English: " + x.en);
      L.push("");
    });
    if (S.saved.length) {
      L.push("## 담아 둔 실시간 뉴스");
      S.saved.forEach(function (a) { L.push("- [" + a.title + "](" + a.url + ") · " + (a.source || "") + " · " + (a.date || "").slice(0, 10) + (a.note ? "\n  - 메모: " + a.note : "")); });
    }
    return L.join("\n");
  }
  function offer(name, text) {
    try {
      var url = URL.createObjectURL(new Blob([text], { type: (/\.json$/.test(name) ? "application/json" : "text/markdown") + ";charset=utf-8" }));
      var a = h("a", { href: url, download: name }); a.hidden = true; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      $("saveStatus").textContent = "내려받았어요 · " + name;
    } catch (e) { $("fallback").hidden = false; $("fallbackText").textContent = text; }
  }
  var day = function () { return new Date().toISOString().slice(0, 10); };
  $("expMd").onclick = function () { offer("trade-news-notes-" + day() + ".md", mdExport()); };
  $("expJson").onclick = function () { offer("trade-news-backup-" + day() + ".json", JSON.stringify(S, null, 2)); };
  $("fbClose").onclick = function () { $("fallback").hidden = true; };
  $("fbCopy").onclick = function () {
    var pre = $("fallbackText"), b = $("fbCopy");
    function sel() { var r = document.createRange(); r.selectNodeContents(pre); var s_ = getSelection(); s_.removeAllRanges(); s_.addRange(r); b.textContent = "선택됨 · Ctrl+C"; }
    try { navigator.clipboard.writeText(pre.textContent).then(function () { b.textContent = "복사됨"; }, sel); } catch (e) { sel(); }
  };
  $("impJson").addEventListener("change", function () {
    var f = $("impJson").files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try { var o = JSON.parse(rd.result); if (!o || typeof o !== "object" || !("quiz" in o || "notes" in o)) throw 0; S.quiz = o.quiz || {}; S.notes = o.notes || {}; S.done = o.done || {}; S.saved = o.saved || []; save(); $("saveStatus").textContent = "백업을 불러왔어요"; }
      catch (e) { $("saveStatus").textContent = "공부방 백업 파일이 아니에요. ‘백업 저장’으로 만든 .json 파일을 골라 주세요."; }
      $("impJson").value = "";
    };
    rd.readAsText(f);
  });


  /* ---------- live news ---------- */
  var LIVE = { state: "loading", articles: [], fetchedAt: "", partial: false, message: "" };
  var liveTopic = "all", liveLang = "all";
  var RULES = [
    { id: "tariff", re: /tariff|duties|\bduty\b|reciprocal|section 301|관세/i },
    { id: "control", re: /export control|export ban|export curb|licen[cs]e|sanction|entity list|수출통제|수출 통제|제재|수출 금지|수출허가/i },
    { id: "tech", re: /semiconductor|\bchips?\b|chipmaker|\bAI\b|gallium|germanium|반도체|칩|인공지능/i },
    { id: "energy", re: /\bLNG\b|\boil\b|crude|natural gas|\bgas\b|energy|rare earth|critical mineral|lithium|graphite|nickel|copper|석유|원유|가스|에너지|희토류|핵심광물|리튬|흑연/i },
    { id: "logistics", re: /shipping|freight|\bport\b|ports\b|container|red sea|suez|panama canal|vessel|logistics|해운|운임|항만|물류|컨테이너|선박/i },
    { id: "agreement", re: /trade deal|trade agreement|free trade|\bFTA\b|\bWTO\b|negotiat|trade talks|통상|협정|협상|무역합의/i },
    { id: "fx", re: /exchange rate|currency|\bwon\b|\byuan\b|\bdollar\b|interest rate|central bank|환율|원화|달러|위안|금리/i },
    { id: "food", re: /\bfood\b|grain|wheat|\brice\b|soybean|fertili[sz]er|seafood|fisher|agricultur|농산물|식량|곡물|쌀|비료|수산물|식품/i },
    { id: "supply", re: /supply chain|shortage|battery|reshoring|de-?risking|stockpil|공급망|배터리|요소|품귀|재고/i },
    { id: "export", re: /export|import|trade surplus|trade deficit|shipments|수출|수입|무역수지/i }
  ];
  var ROOM_FOR = { tariff: "tariff", control: "graphite", logistics: "redsea", supply: "urea", tech: "gallium", energy: "graphite", agreement: "tariff", food: "urea", export: "tariff" };
  function tagOf(a) { var t = (a.title || "") + " " + (a.description || ""); for (var i = 0; i < RULES.length; i++) if (RULES[i].re.test(t)) return RULES[i].id; return "none"; }
  function isSaved(url) { return S.saved.some(function (x) { return x.url === url; }); }
  function toggleSave(a) {
    if (isSaved(a.url)) S.saved = S.saved.filter(function (x) { return x.url !== a.url; });
    else S.saved.unshift({ title: a.title, url: a.url, source: a.source, date: a.date, topic: a.topic, note: "" });
    if (S.saved.length > 100) S.saved.length = 100;
    save(); renderLive();
  }
  function ago(iso) {
    if (!iso) return "";
    var m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 60) return Math.max(1, m) + "분 전"; if (m < 1440) return Math.round(m / 60) + "시간 전"; return Math.round(m / 1440) + "일 전";
  }
  function renderLiveTools() {
    var box = $("liveTopics"); box.textContent = "";
    TOPICS.forEach(function (t) {
      var b = h("button", { class: "chip", role: "tab", type: "button", "aria-selected": String(t.id === liveTopic), text: t.label });
      b.onclick = function () { click(); liveTopic = t.id; renderLiveTools(); renderLive(); };
      box.appendChild(b);
    });
    Array.prototype.forEach.call($("liveLang").children, function (b) {
      b.className = b.getAttribute("data-lang") === liveLang ? "on" : "";
      b.onclick = function () { click(); liveLang = b.getAttribute("data-lang"); renderLiveTools(); renderLive(); };
    });
  }
  function liveMsg(title, text) { return h("div", { class: "live-msg" }, [h("b", { text: title }), h("span", { text: text })]); }
  function renderLive() {
    var box = $("liveList"), meta = $("liveMeta"); box.textContent = ""; meta.textContent = "";
    if (LIVE.state === "loading") { for (var i = 0; i < 4; i++) box.appendChild(h("div", { class: "skel" })); return; }
    if (LIVE.state === "local") { box.appendChild(liveMsg("이 화면에서는 실시간 뉴스를 불러올 수 없어요.", "배포한 사이트(Vercel)에서 열면 보여요. 아래 학습실은 지금도 쓸 수 있어요.")); return; }
    if (LIVE.state === "no_key") { box.appendChild(liveMsg("뉴스 API 키가 아직 설정되지 않았어요.", "Vercel 프로젝트의 Environment Variables에 NEWS_API_KEY를 추가하고 다시 배포하세요.")); return; }
    if (LIVE.state === "error") { box.appendChild(liveMsg("지금은 실시간 뉴스를 불러오지 못했어요.", "잠시 후 새로고침해 보세요. 하루 사용량을 넘었을 수도 있어요." + (LIVE.message ? " (" + LIVE.message + ")" : ""))); return; }
    var list = LIVE.articles.filter(function (a) { return (liveTopic === "all" || a.topic === liveTopic) && (liveLang === "all" || a.lang === liveLang); });
    if (!list.length) box.appendChild(liveMsg("조건에 맞는 뉴스가 없어요.", "다른 주제나 언어를 골라 보세요."));
    list.forEach(function (a) {
      var tl = a.topic === "none" ? "기타" : topicLabel(a.topic);
      var card = h("article", { class: "live" }, [
        h("div", { class: "live-meta" }, [h("span", { class: "ttag " + a.topic, text: tl }), h("span", { class: "lang-b", text: a.lang === "ko" ? "KO" : "EN" }), h("span", { text: (a.source || "") + (a.date ? " · " + ago(a.date) : "") })]),
        h("h3", {}, [h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer", text: a.title })]),
        a.description ? h("p", { class: "desc", text: a.description }) : null
      ]);
      var foot = h("div", { class: "live-foot" });
      var room = ROOM_FOR[a.topic];
      if (room) { var b = h("button", { class: "btn small primary", type: "button", text: tl + " 개념 연습하기 →" }); b.onclick = function () { openRoom(room); }; foot.appendChild(b); }
      var sv = h("button", { class: "btn small" + (isSaved(a.url) ? " saved-on" : ""), type: "button", "aria-pressed": String(isSaved(a.url)), text: isSaved(a.url) ? "담음 ✓" : "내 기록에 담기" });
      sv.onclick = function () { toggleSave(a); };
      foot.appendChild(sv);
      card.appendChild(foot); box.appendChild(card);
    });
    var d = LIVE.fetchedAt ? new Date(LIVE.fetchedAt) : null;
    meta.textContent = "뉴스 제공: NewsData.io" + (d ? " · " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " 업데이트" : "") + " · 무료 플랜은 기사가 약 12시간 늦게 들어와요." + (LIVE.partial ? " 일부 언어의 뉴스를 불러오지 못했어요." : "");
  }
  function liveDone() { renderLive(); if (current) selectSpot(current, false); }
  function loadLive() {
    if (location.protocol === "file:") { LIVE.state = "local"; liveDone(); return; }
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
    fetch("/api/news", ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      var ct = r.headers.get("content-type") || "";
      if (ct.indexOf("json") < 0) { LIVE.state = "local"; return null; }
      return r.json();
    }).then(function (d) {
      clearTimeout(timer);
      if (!d) { liveDone(); return; }
      if (!d.ok) { LIVE.state = d.reason === "no_key" ? "no_key" : "error"; LIVE.message = d.message || ""; liveDone(); return; }
      LIVE.state = "ok"; LIVE.fetchedAt = d.fetchedAt; LIVE.partial = !!d.partial;
      LIVE.articles = (d.articles || []).map(function (a) { a.topic = tagOf(a); return a; });
      liveDone();
    }).catch(function (e) { clearTimeout(timer); LIVE.state = String(e).indexOf("404") > -1 ? "local" : "error"; liveDone(); });
  }

  function renderSaved() {
    var box = $("savedList"); box.textContent = "";
    if (!S.saved.length) { box.appendChild(h("p", { class: "empty", text: "실시간 뉴스에서 ‘내 기록에 담기’를 누르면 여기에 모여요." })); return; }
    S.saved.forEach(function (a, i) {
      var note = h("input", { type: "text", value: a.note || "", placeholder: "이 뉴스에서 눈에 띈 점 한 줄", "aria-label": "메모" });
      note.addEventListener("input", function () { a.note = note.value; clearTimeout(note.t); note.t = setTimeout(function () { S.savedAt = new Date().toISOString(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} renderStatus(); }, 500); });
      var rm = h("button", { class: "btn small", type: "button", text: "빼기" }); rm.onclick = function () { S.saved.splice(i, 1); save(); renderSaved(); };
      box.appendChild(h("div", { class: "saved-item" }, [
        h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer", text: a.title }),
        h("span", { class: "fine", text: [a.source, (a.date || "").slice(0, 10), a.topic && a.topic !== "none" ? topicLabel(a.topic) : ""].filter(Boolean).join(" · ") }),
        h("div", { class: "row" }, [note, rm])
      ]));
    });
  }

  window.TradeApp = { selectSpot: selectSpot, openRoom: openRoom, setQuery: setQuery, current: function () { return current; }, progress: function () { return S; }, quizScore: quizScore };

  /* ---------- start ---------- */
  load();
  renderChips(); renderCards(); renderPins(); selectSpot("ship", false); renderRecord(); renderGlossary(); renderStatus();
  renderLiveTools(); renderLive(); loadLive();
  var m = /^#learn-([a-z]+)$/.exec(location.hash); if (m && byId(m[1])) openRoom(m[1]);
})();
