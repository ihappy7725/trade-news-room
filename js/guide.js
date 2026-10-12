/* 사이트 이름 적용 + 안내 챗봇
   챗봇은 AI가 아니라 이 사이트의 용어 사전, 학습실, 무역 맵 내용 안에서 답을 찾아 주는 안내 도우미예요.
   이름과 이미지는 js/data.js의 window.SITE에서 바꿔요. */
(function () {
  var SITE = window.SITE || {}, NEWS = window.NEWS || [], TERMS = window.TERMS || {}, SPOTS = window.SPOTS || [];
  var BOT = SITE.botName || "콘테";

  /* ---------- 사이트 이름 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-site]"), function (el) { var v = SITE[el.getAttribute("data-site")]; if (v) el.textContent = v; });
  if (SITE.brand) document.title = SITE.brand + " · " + (SITE.title || "뉴스 속 무역 공부방");

  /* ---------- 챗봇 ---------- */
  var AVATAR_SVG = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="16" width="48" height="38" rx="9" fill="#F08A3C" stroke="#3A3A33" stroke-width="2.5"/><path d="M16 22v26M24 22v26M40 22v26M48 22v26" stroke="#D0702A" stroke-width="2.5"/><rect x="18" y="26" width="28" height="16" rx="8" fill="#FFF7EC"/><circle cx="26" cy="33" r="2.6" fill="#3A3A33"/><circle cx="38" cy="33" r="2.6" fill="#3A3A33"/><path d="M28 38q4 3 8 0" fill="none" stroke="#3A3A33" stroke-width="2" stroke-linecap="round"/><rect x="22" y="9" width="20" height="8" rx="3" fill="#3F9338" stroke="#3A3A33" stroke-width="2"/><circle cx="20" cy="38" r="2.4" fill="#FFB4A0" opacity=".8"/><circle cx="44" cy="38" r="2.4" fill="#FFB4A0" opacity=".8"/></svg>';
  function avatar(cls) {
    var w = document.createElement("span"); w.className = "g-ava " + (cls || "");
    w.innerHTML = AVATAR_SVG;
    if (SITE.botImage) { var im = new Image(); im.alt = ""; im.onload = function () { w.innerHTML = ""; w.appendChild(im); }; im.src = SITE.botImage; }
    return w;
  }
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === "text") e.textContent = attrs[k]; else if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function click() { if (window.Sound) window.Sound.click(); }

  var fab = h("button", { class: "g-fab", type: "button", "aria-expanded": "false", "aria-controls": "guidePanel", "aria-label": BOT + "에게 묻기" });
  var fabImg = h("img", { class: "g-fab-img", src: SITE.botFull || SITE.botImage || "", alt: "", width: "84", height: "84" });
  fabImg.onerror = function () { fabImg.replaceWith(avatar("big")); };
  fab.appendChild(fabImg); fab.appendChild(h("span", { class: "g-fab-txt", text: BOT + "에게 묻기" }));
  var panel = h("section", { class: "g-panel", id: "guidePanel", role: "dialog", "aria-label": BOT + " 챗봇" }); panel.hidden = true;
  var headImg = h("img", { class: "g-head-img", src: SITE.botFull || SITE.botImage || "", alt: "", width: "64", height: "64" });
  headImg.onerror = function () { headImg.replaceWith(avatar()); };
  var head = h("header", { class: "g-head" }, [headImg, h("div", {}, [h("b", { text: BOT }), h("small", { text: "사이트 안 내용으로 답하는 무역 안내 친구" })])]);
  var close = h("button", { class: "g-x", type: "button", "aria-label": "챗봇 닫기", text: "✕" }); head.appendChild(close);
  var log = h("div", { class: "g-log", "aria-live": "polite" });
  var quick = h("div", { class: "g-quick" });
  var form = h("form", { class: "g-form" });
  var input = h("input", { type: "text", placeholder: "예: 관세가 뭐야? / 어떤 뉴스부터 볼까?", "aria-label": BOT + "에게 질문", autocomplete: "off" });
  form.appendChild(input); form.appendChild(h("button", { type: "submit", class: "g-send", text: "보내기" }));
  panel.appendChild(head); panel.appendChild(log); panel.appendChild(quick); panel.appendChild(form);
  document.body.appendChild(panel); document.body.appendChild(fab);

  function open() { panel.hidden = false; fab.setAttribute("aria-expanded", "true"); fab.classList.add("open"); if (!log.children.length) hello(); setTimeout(function () { input.focus(); }, 50); }
  function shut() { panel.hidden = true; fab.setAttribute("aria-expanded", "false"); fab.classList.remove("open"); fab.focus(); }
  fab.onclick = function () { click(); panel.hidden ? open() : shut(); };
  close.onclick = shut;
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) shut(); });

  function say(who, parts) {
    var row = h("div", { class: "g-msg " + who });
    if (who === "bot") row.appendChild(avatar("sm"));
    var bubble = h("div", { class: "g-bub" });
    (Array.isArray(parts) ? parts : [parts]).forEach(function (p) { if (!p) return; bubble.appendChild(typeof p === "string" ? h("p", { text: p }) : p); });
    row.appendChild(bubble); log.appendChild(row); log.scrollTop = log.scrollHeight;
  }
  function act(label, fn) { var b = h("button", { class: "g-act", type: "button", text: label }); b.onclick = function () { click(); fn(); }; return b; }
  function acts(list) { var d = h("div", { class: "g-acts" }); list.forEach(function (x) { if (x) d.appendChild(x); }); return d; }
  function openNews(id) { return act("학습실 열기 →", function () { shut(); window.TradeApp && window.TradeApp.openRoom(id); }); }
  function setQuick(list) {
    quick.textContent = "";
    list.forEach(function (q) { var b = h("button", { type: "button", class: "g-chip", text: q }); b.onclick = function () { click(); ask(q); }; quick.appendChild(b); });
  }
  function hello() {
    say("bot", ["안녕하세요, 저는 " + BOT + "예요. 항구에서 일하는 무역 안내 로봇이에요.", "용어 뜻, 어떤 뉴스부터 볼지, 퀴즈 한 문제 같은 걸 물어보세요. 이 사이트에 있는 내용 안에서 찾아 드려요."]);
    setQuick(["어떤 뉴스부터 볼까?", "관세가 뭐야?", "퀴즈 하나 내줘", "내 진도 알려줘"]);
  }

  /* ---------- 답 찾기 ---------- */
  function norm(s) { return String(s || "").toLowerCase().replace(/[?!.,~·]/g, " ").replace(/\s+/g, " ").trim(); }
  function findTerm(q) {
    var best = null, bestLen = 0;
    Object.keys(TERMS).forEach(function (k) {
      var t = TERMS[k];
      [t.ko, t.en, t.zh].concat(t.ko.split(/[·\s]+/)).forEach(function (w) {
        w = norm(w); if (w.length < 2) return;
        if (q.indexOf(w) > -1 && w.length > bestLen) { best = k; bestLen = w.length; }
      });
    });
    return best;
  }
  var NEWS_KEYS = { urea: ["요소", "요소수", "urea"], graphite: ["흑연", "graphite", "배터리"], gallium: ["갈륨", "게르마늄", "gallium", "germanium"], tariff: ["한미", "15%", "자동차 관세", "트럼프"], redsea: ["홍해", "수에즈", "희망봉", "red sea", "suez"] };
  function findNews(q) { for (var id in NEWS_KEYS) if (NEWS_KEYS[id].some(function (w) { return q.indexOf(w) > -1; })) return id; return null; }
  function findSpot(q) {
    for (var i = 0; i < SPOTS.length; i++) {
      var s = SPOTS[i], words = norm(s.label + " " + s.title).split(" ").filter(function (w) { return w.length >= 2 && ["하는", "있는", "쓰는", "떠나는", "가는", "지나는"].indexOf(w) < 0; });
      if (words.some(function (w) { return q.indexOf(w) > -1; })) return s;
    }
    return null;
  }
  function newsById(id) { for (var i = 0; i < NEWS.length; i++) if (NEWS[i].id === id) return NEWS[i]; return null; }
  function termNews(k) { for (var i = 0; i < NEWS.length; i++) if (NEWS[i].terms.indexOf(k) > -1) return NEWS[i]; return null; }

  function ask(text) {
    var raw = String(text || "").trim(); if (!raw) return;
    say("me", raw); input.value = "";
    var q = norm(raw);
    setTimeout(function () { answer(q, raw); }, 260);
  }
  function answer(q, raw) {
    var S = window.TradeApp ? window.TradeApp.progress() : { done: {}, quiz: {}, notes: {} };

    if (/^(안녕|하이|hi|hello|반가)/.test(q)) { say("bot", "반가워요! 궁금한 무역 용어나 뉴스를 편하게 물어보세요."); return; }

    if (/추천|뭐부터|무엇부터|어떤 뉴스|어디서부터|시작/.test(q)) {
      var next = NEWS.filter(function (n) { return !S.done[n.id]; })[0];
      if (!next) { say("bot", ["학습실 5개를 모두 끝냈어요. 대단해요!", "이제 실시간 뉴스에서 마음에 드는 기사를 골라 ‘내 기록에 담기’로 정리해 보세요."], null); return; }
      say("bot", ["‘" + next.title + "’부터 시작해 보세요.", next.lead, acts([openNews(next.id)])]);
      setQuick(["퀴즈 하나 내줘", "내 진도 알려줘", "실시간 뉴스 보여줘"]); return;
    }
    if (/진도|기록|몇 개|얼마나|점수/.test(q)) {
      var done = NEWS.filter(function (n) { return S.done[n.id]; }).length, right = 0, total = 0;
      NEWS.forEach(function (n) { var sc = window.TradeApp.quizScore(n.id); right += sc.right; total += sc.total; });
      say("bot", ["학습 완료 " + done + " / " + NEWS.length + ", 맞힌 퀴즈 " + right + " / " + total + "예요.", acts([act("학습 기록 보기 →", function () { shut(); document.getElementById("record").scrollIntoView({ behavior: "smooth" }); })])]);
      return;
    }
    if (/퀴즈|문제|테스트/.test(q)) { quiz(S); return; }
    if (/실시간|오늘 뉴스|최신|새 뉴스/.test(q)) {
      say("bot", ["세계에서 들어온 무역 뉴스는 ‘실시간 무역 뉴스’에 모여 있어요. 뉴스마다 관련 개념 학습실로 가는 버튼이 있어요.", acts([act("실시간 뉴스로 이동 →", function () { shut(); document.getElementById("live").scrollIntoView({ behavior: "smooth" }); })])]);
      return;
    }
    if (/뭐 할 수|할 수 있|도움|사용법|어떻게 써/.test(q)) {
      say("bot", ["저는 이런 걸 도와요.", "• 무역 용어 뜻 (한·영·중)\n• 어떤 뉴스부터 볼지 추천\n• 학습실 퀴즈 한 문제\n• 내 진도 확인\n• 무역 맵 장소 설명", "AI가 아니라 이 사이트 안의 내용에서 찾아 답해요."]);
      return;
    }

    var nid = findNews(q), tk = findTerm(q), sp = findSpot(q);
    if (tk && !(nid && q.indexOf(TERMS[tk].ko) < 0)) {
      var t = TERMS[tk], rel = termNews(tk);
      say("bot", [t.ko + " · " + t.en + " · " + t.zh, t.def, acts([rel ? openNews(rel.id) : null, act("용어 사전에서 보기", function () { shut(); window.TradeApp && window.TradeApp.setQuery(t.ko); document.getElementById("glossary").scrollIntoView({ behavior: "smooth" }); })]), rel ? h("p", { class: "g-small", text: "관련 학습실: " + rel.title }) : null]);
      return;
    }
    if (nid) {
      var n = newsById(nid);
      say("bot", [n.title, n.summary[0], acts([openNews(n.id)])]);
      return;
    }
    if (sp) {
      say("bot", [sp.title, sp.text, acts([act("무역 맵에서 보기", function () { shut(); window.TradeApp && window.TradeApp.selectSpot(sp.id, false); document.getElementById("map").scrollIntoView({ behavior: "smooth" }); }), sp.news ? openNews(sp.news) : null])]);
      return;
    }
    say("bot", ["음, ‘" + raw + "’에 대한 내용은 아직 이 사이트에 없어요.", "용어 사전과 뉴스에서 같은 말로 찾아볼까요?", acts([act("사이트에서 검색하기", function () { shut(); window.TradeApp && window.TradeApp.setQuery(raw); document.getElementById("news").scrollIntoView({ behavior: "smooth" }); })])]);
    setQuick(["어떤 뉴스부터 볼까?", "FEU가 뭐야?", "수출통제가 뭐야?"]);
  }

  function quiz(S) {
    var pool = [];
    NEWS.forEach(function (n) { n.quiz.forEach(function (qq, i) { var a = (S.quiz[n.id] || [])[i]; if (a !== qq.answer) pool.push({ n: n, q: qq }); }); });
    if (!pool.length) NEWS.forEach(function (n) { n.quiz.forEach(function (qq) { pool.push({ n: n, q: qq }); }); });
    var pick = pool[Math.floor(Math.random() * pool.length)], qq = pick.q;
    var opts = h("div", { class: "g-opts" });
    qq.options.forEach(function (o, i) {
      var b = h("button", { type: "button", class: "g-opt", text: o });
      b.onclick = function () {
        click();
        Array.prototype.forEach.call(opts.children, function (x, j) { x.disabled = true; if (j === qq.answer) x.classList.add("right"); else if (j === i) x.classList.add("wrong"); });
        say("bot", [(i === qq.answer ? "정답이에요! " : "아쉬워요. 정답은 ‘" + qq.options[qq.answer] + "’예요. ") + qq.why, acts([openNews(pick.n.id), act("한 문제 더", function () { quiz(window.TradeApp.progress()); })])]);
      };
      opts.appendChild(b);
    });
    say("bot", ["‘" + pick.n.title + "’ 학습실에서 한 문제!", qq.q, opts]);
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });
})();
