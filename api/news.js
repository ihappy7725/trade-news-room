// 실시간 무역 뉴스 함수 (Vercel Function, 주소: /api/news)
// - API 키는 코드에 넣지 않고 Vercel 환경 변수 NEWS_API_KEY에서 읽어요.
// - 브라우저는 이 함수(/api/news)만 부르고, 키는 절대 화면으로 나가지 않아요.
// - 뉴스 제공: NewsData.io (무료 플랜: 하루 200크레딧, 요청당 기사 10개, 약 12시간 지연)
// - 영어 2번 + 한국어 1번 불러와서 합쳐요.

// 3번 호출 × 30분 캐시 = 하루 최대 약 144크레딧 (무료 200크레딧 안쪽). 검색어는 100자 이내.
const QUERIES = [
  { lang: "en", q: 'tariff OR "export controls" OR "supply chain" OR shipping' },
  { lang: "en", q: '"trade deal" OR LNG OR semiconductor OR "exchange rate" OR exports' },
  { lang: "ko", q: "관세 OR 수출통제 OR 공급망 OR 해운 OR 수출 OR 환율 OR 반도체" }
];
const CDN_SECONDS = 1800; // 30분 동안 같은 결과를 재사용해 크레딧을 아껴요

export default {
  async fetch() {
    return handle();
  }
};

async function handle() {
  const key = process.env.NEWS_API_KEY;
  if (!key) return json({ ok: false, reason: "no_key" }, 60);

  const settled = await Promise.allSettled(QUERIES.map(({ lang, q }) => fetchLang(key, lang, q)));
  const articles = [];
  const errors = [];
  const seen = new Set();
  settled.forEach((r) => {
    if (r.status === "fulfilled") {
      r.value.forEach((a) => {
        const k = (a.url || a.title || "").toLowerCase();
        if (!a.title || !a.url || seen.has(k)) return;
        seen.add(k); articles.push(a);
      });
    } else errors.push(scrub(String(r.reason && r.reason.message || r.reason), key));
  });

  if (!articles.length) return json({ ok: false, reason: "upstream", message: errors.join(" / ").slice(0, 240) }, 120);
  articles.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return json({ ok: true, provider: "NewsData.io", fetchedAt: new Date().toISOString(), partial: errors.length > 0, articles }, CDN_SECONDS);
}

async function fetchLang(key, lang, q) {
  const url = new URL("https://newsdata.io/api/1/latest");
  url.searchParams.set("apikey", key);
  url.searchParams.set("q", q);
  url.searchParams.set("language", lang);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.status !== "success") {
    const msg = (data.results && data.results.message) || data.message || "HTTP " + res.status;
    throw new Error(lang + ": " + msg);
  }
  return (data.results || []).map((a) => ({
    title: clean(a.title, 200),
    url: a.link,
    source: clean(a.source_name || a.source_id || "", 60),
    date: toIso(a.pubDate),
    description: clean(a.description, 280),
    image: typeof a.image_url === "string" && a.image_url.startsWith("https://") ? a.image_url : "",
    lang
  }));
}

function clean(s, max) { return String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, max); }
function toIso(d) { if (!d) return ""; const t = new Date(String(d).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(d) ? "" : "Z")); return isNaN(t) ? "" : t.toISOString(); }
function scrub(s, key) { return key ? s.split(key).join("***") : s; }
function json(body, cdnSeconds) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Vercel CDN이 결과를 저장해 두고 재사용해요. 브라우저에는 s-maxage가 빠진 채로 전달돼요.
      "cache-control": `public, s-maxage=${cdnSeconds}, stale-while-revalidate=600`
    }
  });
}
