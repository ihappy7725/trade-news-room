/* 뉴스 속 무역 공부방 · 콘텐츠 데이터
   뉴스를 추가할 때는 NEWS 배열에 같은 형식으로 항목을 하나 더 넣으면 됩니다.
   sim 값은 js/sims.js에 있는 시뮬레이터 이름과 같아야 합니다. */

/* 사이트 이름과 챗봇 설정: 이름을 바꾸려면 여기만 고치면 돼요. */
window.SITE = {
  brand: "Docklab",              // 웹사이트 고유 이름 (영문)
  brandKo: "독랩",               // 웹사이트 고유 이름 (한글)
  title: "뉴스 속 무역 공부방",   // 화면 제목 (유지)
  botName: "콘테",               // 챗봇 이름
  appIcon: "images/app-icon-128.png", // 앱 아이콘 (상단 로고)
  botImage: "images/chatbot-face.png", // 챗봇 얼굴 (작은 동그라미 아바타)
  botFull: "images/chatbot.png"        // 챗봇 전신 캐릭터 (오른쪽 아래 버튼)
};

window.TOPICS = [
  { id: "all", label: "전체" },
  { id: "tariff", label: "관세" },
  { id: "control", label: "수출통제" },
  { id: "supply", label: "공급망" },
  { id: "logistics", label: "물류·해운" },
  { id: "energy", label: "에너지·원자재" },
  { id: "tech", label: "반도체·기술" },
  { id: "fx", label: "환율·금융" },
  { id: "agreement", label: "통상협정" },
  { id: "food", label: "농수산·식품" },
  { id: "export", label: "수출 동향" }
];

/* 무역 맵 장소 분류 */
window.MAP_CATS = [
  { id: "all", label: "전체" },
  { id: "logistics", label: "물류·운송" },
  { id: "production", label: "생산·원자재" },
  { id: "policy", label: "통관·정책" },
  { id: "finance", label: "금융·보험" },
  { id: "market", label: "거래·시장" }
];

window.NEWS = [
  {
    id: "urea",
    topic: "supply",
    date: "2021-10",
    region: "한국 · 중국",
    title: "중국 수출 검사에 멈춘 요소수, 한국의 수입처는 바뀌었을까?",
    lead: "싸게 살 수 있는 한 나라에서 모두 사 오는 건 좋은 선택일까요?",
    summary: [
      "2021년 10월 중국이 요소 수출에 검사 절차를 도입하자, 한국에서는 경유차에 꼭 필요한 요소수가 품귀를 빚었어요.",
      "당시 언론은 산업용 요소 수입의 약 97%가 중국산이라고 보도했어요. 이후 한국은 수입처를 여러 나라로 나누는 다변화에 나섰어요.",
      "아래 그래프는 요소 전체(비료용 포함)의 실제 수입 통계예요. 보도된 97%와 숫자가 다른 이유는 통계 범위가 다르기 때문이에요."
    ],
    sources: [
      { label: "Korea JoongAng Daily (2021)", url: "https://www.koreajoongangdaily.com/bilingual-news/unreliable-crisis-management-kor/10839788" },
      { label: "관세청 수출입무역통계", url: "https://www.tradedata.go.kr/cts/index.do" }
    ],
    sim: "urea",
    quiz: [
      { q: "관세청 통계로 본 2021년 한국의 요소 전체 수입(중량 기준)에서 중국 비중은 얼마일까요?",
        options: ["약 97%", "약 75%", "약 43%", "약 15%"], answer: 1,
        why: "요소 전체 기준으로는 74.65%예요. 보도된 97%는 산업용 요소 기준이라, 어떤 범위의 통계인지에 따라 숫자가 달라져요." },
      { q: "A국 단가 100원, B국 단가 120원일 때 100단위를 절반씩 나눠 사면 총비용은?",
        options: ["10,000원", "11,000원", "12,000원", "22,000원"], answer: 1,
        why: "50 × 100원 + 50 × 120원 = 11,000원. 전량 A국보다 1,000원 비싸지만, A국이 멈춰도 50단위가 남아요." },
      { q: "수입액보다 수입량(중량) 기준으로 비중을 보는 게 더 나은 경우는?",
        options: ["가격이 크게 출렁인 해", "수입 국가가 하나뿐일 때", "환율이 고정돼 있을 때", "항상 수입액이 더 정확하다"], answer: 0,
        why: "2022년에는 요소 수입량이 전년과 비슷했는데 수입액은 크게 뛰었어요. 가격이 출렁이면 금액 비중이 실제 물량 구조를 왜곡해요." }
    ],
    terms: ["import-dependence", "diversification", "origin", "hs-code"]
  },
  {
    id: "graphite",
    topic: "control",
    date: "2023-10-20",
    region: "중국 → 한국",
    title: "중국, 배터리 소재 흑연 수출에 허가제 도입",
    lead: "한 나라가 공급을 줄이면 가격은 얼마나 오를까요?",
    summary: [
      "중국 상무부는 2023년 10월 20일, 고순도 인조흑연과 천연 인상흑연을 수출하려면 12월 1일부터 허가를 받아야 한다고 발표했어요.",
      "흑연은 전기차 배터리 음극재의 핵심 원료예요. 2023년 1~9월 한국 인조흑연 수입의 94.3%가 중국산이었어요.",
      "한국 정부는 모잠비크, 탄자니아 같은 대체 공급처를 찾고 국내 인조흑연 공장 가동을 앞당기겠다고 밝혔어요."
    ],
    sources: [
      { label: "Korea Herald via ANN (2023-10-24)", url: "https://asianews.network/chinas-export-curbs-on-graphite-may-raise-battery-prices-for-evs/" },
      { label: "Bloomberg via TechCentral (2023-10)", url: "https://techcentral.co.za/?p=233821" }
    ],
    sim: "shock",
    quiz: [
      { q: "중국 의존도가 94%인데 중국 공급이 50% 줄고 대체 공급처가 없다면, 전체 공급은 몇 % 줄까요?",
        options: ["94%", "50%", "47%", "6%"], answer: 2,
        why: "0.94 × 0.5 = 0.47. 의존도가 높을수록 한 나라의 감소가 전체 공급에 그대로 전해져요." },
      { q: "사람들이 가격이 올라도 사야만 하는 물건(탄력성이 낮은 물건)이라면, 같은 공급 감소에 가격은?",
        options: ["더 크게 오른다", "덜 오른다", "변하지 않는다", "오히려 내린다"], answer: 0,
        why: "꼭 필요한 원료는 비싸져도 구매를 줄이기 어려워서, 적은 공급을 두고 가격 경쟁이 심해져요." },
      { q: "이번 중국의 조치는 어떤 형태였을까요?",
        options: ["전면 수출 금지", "수출 허가제", "수입 관세 인상", "수입 할당제"], answer: 1,
        why: "수출을 막은 게 아니라 허가를 받도록 했어요. 허가를 내줄지, 얼마나 빨리 내줄지를 중국이 조절할 수 있게 된 거예요." }
    ],
    terms: ["export-control", "dual-use", "export-license", "elasticity"]
  },
  {
    id: "gallium",
    topic: "control",
    date: "2023-07-03",
    region: "중국 → 세계",
    title: "갈륨·게르마늄 수출 허가제, 시행 첫 달 수출 0",
    lead: "허가를 기다리는 동안 공장은 버틸 수 있을까요?",
    summary: [
      "중국은 2023년 7월 3일, 반도체 소재인 갈륨·게르마늄 관련 품목을 8월 1일부터 허가를 받아야 수출할 수 있다고 발표했어요.",
      "시행 첫 달인 8월, 중국의 갈륨·게르마늄 수출은 0을 기록했어요. 이후 독일, 일본, 한국 등은 두세 달 안에 허가를 받아 수입이 재개됐어요.",
      "중국은 2024년 12월 이 통제를 제도로 굳혔어요. 재고와 비축이 왜 중요한지 보여주는 사례예요."
    ],
    sources: [
      { label: "IEA 정책 데이터베이스", url: "https://www.iea.org/policies/17893-announcement-on-the-implementation-of-export-control-of-items-related-to-gallium-and-germanium" },
      { label: "WION (2023-09)", url: "https://www.wionews.com/world/china-exported-no-germanium-gallium-in-august-after-export-curbs-638455" },
      { label: "Sinolytics", url: "https://sinolytics.de/global-business-news/blog/geopolitics/china-gallium-export-controls-business-impact/" }
    ],
    sim: "stock",
    quiz: [
      { q: "재고가 30일치 있는데 수출 허가를 받기까지 75일이 걸린다면, 원료 없이 버텨야 하는 기간은?",
        options: ["0일", "30일", "45일", "105일"], answer: 2,
        why: "75일 − 30일 = 45일. 재고가 허가 대기 기간보다 짧으면 그 차이만큼 생산이 멈춰요." },
      { q: "2023년 8월, 중국의 갈륨·게르마늄 수출은 어땠을까요?",
        options: ["두 배로 늘었다", "변화 없었다", "0을 기록했다", "절반으로 줄었다"], answer: 2,
        why: "허가 절차가 막 시작돼 허가를 받은 기업이 없었기 때문에 수출이 0이었어요." },
      { q: "재고를 많이 쌓아 두는 것(비축)의 단점은?",
        options: ["보관 비용과 묶이는 돈이 늘어난다", "공급이 더 불안해진다", "가격이 반드시 오른다", "단점은 없다"], answer: 0,
        why: "비축은 보험과 같아요. 공급 중단에는 강해지지만, 창고비와 미리 사 둔 원료에 돈이 묶이는 비용이 생겨요." }
    ],
    terms: ["stockpile", "inventory", "lead-time", "critical-minerals"]
  },
  {
    id: "tariff",
    topic: "tariff",
    date: "2025-07-30",
    region: "한국 ↔ 미국",
    title: "한미 무역합의, 한국산 제품에 관세 15%",
    lead: "관세는 누가 내는 걸까요? 수출 기업일까요, 미국 소비자일까요?",
    summary: [
      "2025년 7월 30일, 미국은 한국산 수입품에 15% 관세를 매기는 무역합의를 발표했어요. 합의가 없었다면 8월 1일부터 25%가 예고돼 있었어요.",
      "한국은 미국에 3,500억 달러 투자와 1,000억 달러 규모의 에너지 구매를 약속했어요.",
      "2026년 7월 미국이 무역법 301조에 따른 새 관세를 발표했고, 한국 정부는 미국이 15% 상한을 지키겠다는 입장을 재확인했다고 밝혔어요. 관세 상황은 계속 바뀌니 최신 뉴스를 함께 확인하세요."
    ],
    sources: [
      { label: "Al Jazeera (2025-07-31)", url: "https://www.aljazeera.com/news/2025/7/31/trump-announces-trade-deal-with-south-korea-setting-tariff-at-15-percent" },
      { label: "주간경향 (2026-07-24)", url: "https://weekly.khan.co.kr/article/202607241057011" }
    ],
    sim: "tariff",
    quiz: [
      { q: "관세 전 가격 30,000달러인 자동차에 관세 15%를 매기고, 관세를 전부 미국 소비자가 부담한다면 소비자 가격은?",
        options: ["30,000달러", "31,500달러", "34,500달러", "45,000달러"], answer: 2,
        why: "30,000 × 1.15 = 34,500달러. 늘어난 4,500달러는 미국 정부의 관세 수입이 돼요." },
      { q: "관세로 걷은 돈은 누구에게 갈까요?",
        options: ["수출한 한국 기업", "한국 정부", "수입국(미국) 정부", "미국 자동차 회사"], answer: 2,
        why: "관세는 물건이 수입국 국경을 넘을 때 수입국 정부가 걷는 세금이에요." },
      { q: "한국 기업이 관세 일부를 가격 인하로 떠안으면 어떻게 될까요?",
        options: ["미국 소비자 가격이 더 오른다", "소비자 가격은 덜 오르지만 한국 기업이 받는 돈이 줄어든다", "관세율이 내려간다", "아무 변화가 없다"], answer: 1,
        why: "관세 부담이 누구에게 돌아가는지를 '관세 귀착'이라고 해요. 기업이 부담을 나누면 판매량은 지키지만 이윤이 줄어요." }
    ],
    terms: ["tariff", "incidence", "reciprocal-tariff", "trade-agreement"]
  },
  {
    id: "redsea",
    topic: "logistics",
    date: "2023-12",
    region: "홍해 · 수에즈 운하",
    title: "홍해 공격에 컨테이너선 희망봉 우회, 운임 두 배로",
    lead: "배가 열흘 더 돌아가면 무역에는 무슨 일이 생길까요?",
    summary: [
      "2023년 12월, 홍해에서 상선 공격이 이어지자 주요 컨테이너 선사들이 홍해와 수에즈 운하 운항을 멈췄어요.",
      "배들은 아프리카 남쪽 희망봉으로 돌아가야 했고, 항로에 따라 7~10일이 더 걸렸어요.",
      "드루리 지수 기준 상하이–로테르담 40피트 컨테이너 운임은 1,910달러에서 3,577달러로 약 115% 올랐어요."
    ],
    sources: [
      { label: "Crown World Mobility", url: "https://www.crownworldmobility.com/insights/red-sea-attacks-an-update/" }
    ],
    sim: "route",
    quiz: [
      { q: "희망봉으로 우회하면 항해 기간이 대략 얼마나 늘어났을까요?",
        options: ["1~2일", "7~10일", "한 달 이상", "변화 없음"], answer: 1,
        why: "출발 위치에 따라 7~10일이 더 걸렸어요. 일부 화물은 2~4주까지 지연됐어요." },
      { q: "FEU는 무엇을 뜻할까요?",
        options: ["20피트 컨테이너 1개", "40피트 컨테이너 1개", "화물 1톤", "배 한 척"], answer: 1,
        why: "FEU는 40피트 컨테이너 1개, TEU는 20피트 컨테이너 1개를 세는 단위예요." },
      { q: "상하이–로테르담 운임은 약 몇 % 올랐을까요?",
        options: ["약 15%", "약 50%", "약 115%", "약 300%"], answer: 2,
        why: "1,910달러 → 3,577달러로 약 115% 올랐어요. 운임이 오르면 수입품 가격에도 반영돼요." }
    ],
    terms: ["chokepoint", "rerouting", "freight-rate", "teu"]
  }
];

/* 한 · 영 · 중 용어 */
window.TERMS = {
  "import-dependence": { ko: "수입 의존도", en: "import dependence", zh: "进口依赖度", def: "어떤 물건의 전체 수입 중 특정 국가에서 들여오는 비율." },
  "diversification":   { ko: "공급처 다변화", en: "supplier diversification", zh: "供应来源多元化", def: "사 오는 나라를 여러 곳으로 나눠 한 곳이 막혀도 버틸 수 있게 하는 것." },
  "origin":            { ko: "원산지", en: "country of origin", zh: "原产地", def: "물건이 실제로 만들어진 나라. 무역 통계의 국가는 보통 원산지 기준이에요." },
  "hs-code":           { ko: "HS 코드", en: "HS code", zh: "HS编码", def: "세계 공통 품목 분류 번호. 앞 6자리는 국제 공통, 한국은 10자리(HSK)까지 나눠요." },
  "export-control":    { ko: "수출통제", en: "export controls", zh: "出口管制", def: "안보나 전략적 이유로 특정 물건의 수출을 제한하거나 허가를 받게 하는 제도." },
  "dual-use":          { ko: "이중용도 품목", en: "dual-use items", zh: "两用物项", def: "민간과 군사 양쪽에 쓰일 수 있는 물건. 수출통제의 주요 대상이에요." },
  "export-license":    { ko: "수출허가", en: "export license", zh: "出口许可证", def: "통제 품목을 수출하기 전에 정부에게 받아야 하는 허가." },
  "elasticity":        { ko: "가격탄력성", en: "price elasticity", zh: "价格弹性", def: "가격이 변할 때 수요나 공급이 얼마나 민감하게 반응하는지를 나타내는 정도." },
  "stockpile":         { ko: "비축", en: "stockpiling", zh: "储备", def: "공급 중단에 대비해 원료나 물자를 미리 쌓아 두는 것." },
  "inventory":         { ko: "재고", en: "inventory", zh: "库存", def: "기업이 가지고 있는 원료나 제품의 양. 며칠 버틸 수 있는지(재고일수)로 많이 표현해요." },
  "lead-time":         { ko: "리드타임", en: "lead time", zh: "交货周期", def: "주문하고 물건을 받기까지 걸리는 시간." },
  "critical-minerals": { ko: "핵심광물", en: "critical minerals", zh: "关键矿产", def: "산업과 안보에 꼭 필요하지만 공급이 일부 국가에 몰린 광물. 갈륨, 흑연, 희토류 등." },
  "tariff":            { ko: "관세", en: "tariff", zh: "关税", def: "물건이 국경을 넘어 들어올 때 수입국 정부가 매기는 세금." },
  "incidence":         { ko: "관세 귀착", en: "tariff incidence", zh: "关税归宿", def: "관세 부담이 실제로 소비자, 수입업자, 수출기업 중 누구에게 돌아가는지." },
  "reciprocal-tariff": { ko: "상호관세", en: "reciprocal tariff", zh: "对等关税", def: "상대국이 매기는 관세나 무역장벽에 맞춰 같은 수준으로 매기겠다는 관세." },
  "trade-agreement":   { ko: "무역협정", en: "trade agreement", zh: "贸易协定", def: "나라들이 관세와 무역 규칙을 약속하는 합의." },
  "chokepoint":        { ko: "초크포인트", en: "chokepoint", zh: "咽喉要道", def: "수에즈 운하처럼 많은 화물이 지나가는 좁은 길목. 막히면 세계 물류가 흔들려요." },
  "rerouting":         { ko: "우회 항로", en: "rerouting", zh: "绕行航线", def: "원래 길이 막혀 더 먼 길로 돌아가는 것." },
  "freight-rate":      { ko: "운임", en: "freight rate", zh: "运费", def: "화물을 운송하는 데 내는 값. 컨테이너 1개당 가격으로 많이 표시해요." },
  "teu":               { ko: "TEU · FEU", en: "twenty / forty-foot equivalent unit", zh: "标准箱", def: "컨테이너 단위. TEU는 20피트, FEU는 40피트 컨테이너 1개." },
  "bl":                { ko: "선하증권", en: "bill of lading (B/L)", zh: "提单", def: "선사가 화물을 받았다는 증서이자, 화물을 찾을 수 있는 권리증서." },
  "incoterms":         { ko: "인코텀즈", en: "Incoterms", zh: "国际贸易术语解释通则", def: "운송비와 위험을 매도인과 매수인 중 누가 언제까지 지는지 정한 국제 규칙." },
  "exchange-rate":     { ko: "환율", en: "exchange rate", zh: "汇率", def: "두 나라 돈의 교환 비율. 원화가 약해지면 해외에서 한국 제품 가격이 싸져요." },
  "bonded":            { ko: "보세구역", en: "bonded area", zh: "保税区", def: "관세를 내기 전 상태로 물건을 보관하거나 가공할 수 있는 구역." },
  "roro":              { ko: "자동차 운반선", en: "Ro-Ro / car carrier", zh: "滚装船", def: "자동차를 직접 몰아서 싣고 내리는 배. 자동차 수출에 쓰여요." },
  "intermodal":        { ko: "복합운송", en: "intermodal transport", zh: "多式联运", def: "배, 열차, 트럭처럼 여러 운송 수단을 이어서 화물을 옮기는 방식." },
  "lng":               { ko: "액화천연가스", en: "LNG", zh: "液化天然气", def: "천연가스를 영하 162도로 식혀 액체로 만든 것. 전용 선박으로 수입해요." },
  "cold-chain":        { ko: "콜드체인", en: "cold chain", zh: "冷链", def: "식품이나 의약품을 낮은 온도로 유지하며 생산부터 판매까지 옮기는 물류." },
  "lc":                { ko: "신용장", en: "letter of credit (L/C)", zh: "信用证", def: "수입자의 은행이 서류만 맞으면 대금을 지급하겠다고 약속하는 증서." },
  "cargo-insurance":   { ko: "적하보험", en: "marine cargo insurance", zh: "货物运输保险", def: "운송 중 화물이 입은 손해를 보상하는 보험." },
  "cross-border":      { ko: "전자상거래 수출", en: "cross-border e-commerce", zh: "跨境电商", def: "온라인으로 해외 소비자에게 직접 상품을 파는 무역." },
  "de-minimis":        { ko: "소액 면세", en: "de minimis", zh: "小额免税", def: "일정 금액 이하의 수입품에는 관세를 매기지 않는 제도." },
  "air-cargo":         { ko: "항공화물", en: "air cargo", zh: "航空货运", def: "가볍고 비싸거나 급한 물건을 비행기로 나르는 운송. 반도체가 대표적이에요." }
};

/* 무역 맵의 장소들 (x, y는 지도 위 위치 %) */
window.SPOTS = [
  /* 물류·운송 */
  { id: "ship", cat: "logistics", live: "logistics", label: "컨테이너선", x: 79, y: 67, title: "부두를 떠나는 컨테이너선",
    text: "세계 무역 물량의 대부분은 바다로 움직여요. 컨테이너 덕분에 배, 기차, 트럭 사이를 그대로 옮겨 실을 수 있어요.",
    terms: ["teu", "freight-rate"], news: "redsea" },
  { id: "crane", cat: "logistics", live: "logistics", label: "항만 크레인", x: 59, y: 50, title: "컨테이너를 싣는 항만",
    text: "항만은 수출입 화물이 모이는 관문이에요. 항만이 막히거나 배가 늦으면 공장의 원료도 늦어져요.",
    terms: ["lead-time", "bonded"], news: "redsea" },
  { id: "roro", cat: "logistics", live: "tariff", label: "자동차 운반선", x: 70, y: 62, title: "자동차를 싣는 운반선",
    text: "자동차는 컨테이너가 아니라 차를 직접 몰아 싣는 자동차 운반선(RoRo선)으로 수출해요. 한국 자동차 수출은 미국 관세 소식에 크게 흔들려요.",
    terms: ["roro", "tariff"], news: "tariff" },
  { id: "train", cat: "logistics", live: "logistics", label: "화물열차", x: 22, y: 40, title: "항구로 가는 화물열차",
    text: "광산과 공장의 화물은 열차로 항구까지 옮겨요. 배·열차·트럭을 이어 쓰는 것을 복합운송이라고 해요.",
    terms: ["intermodal", "teu"], news: null },
  { id: "warehouse", cat: "logistics", live: "supply", label: "창고", x: 17, y: 69, title: "원료를 쌓아 두는 창고",
    text: "재고는 공급 중단에 대비한 보험이에요. 다만 많이 쌓을수록 보관비와 묶이는 돈이 늘어나요.",
    terms: ["stockpile", "inventory"], news: "gallium" },
  { id: "lighthouse", cat: "logistics", live: "logistics", label: "등대 · 항로", x: 92, y: 45, title: "배가 지나는 바닷길",
    text: "수에즈 운하나 말라카 해협 같은 좁은 길목이 막히면, 배는 먼 길로 돌아가야 해요.",
    terms: ["chokepoint", "rerouting"], news: "redsea" },
  { id: "plane", cat: "logistics", live: "tech", label: "화물기", x: 75, y: 10, title: "하늘길로 가는 항공화물",
    text: "반도체처럼 가볍고 비싸거나 급한 물건은 비행기로 보내요. 빠르지만 운임이 훨씬 비싸요.",
    terms: ["air-cargo"], news: null },
  /* 생산·원자재 */
  { id: "factory", cat: "production", live: "supply", label: "배터리 공장", x: 10, y: 23, title: "원료가 필요한 배터리 소재 공장",
    text: "배터리 공장은 흑연 같은 원료가 꼭 필요해요. 원료가 한 나라에 몰려 있으면 수출통제 한 번에 공장이 흔들려요.",
    terms: ["critical-minerals", "export-control"], news: "graphite" },
  { id: "fab", cat: "production", live: "tech", label: "반도체 공장", x: 50, y: 30, title: "반도체를 만드는 공장",
    text: "반도체는 한국 수출 1위 품목이에요. 갈륨 같은 소재는 수입하고, 완성된 칩은 전 세계로 수출해요. 기술 수출통제의 중심에 있어요.",
    terms: ["dual-use", "export-control"], news: "gallium" },
  { id: "mine", cat: "production", live: "energy", label: "핵심광물 광산", x: 8, y: 15, title: "산에서 캐는 핵심광물",
    text: "흑연, 갈륨, 희토류 같은 핵심광물은 몇몇 나라에 몰려 있어요. 그래서 광물을 가진 나라가 수출을 조이면 세계 공장이 함께 흔들려요.",
    terms: ["critical-minerals", "stockpile"], news: "gallium" },
  { id: "farm", cat: "production", live: "food", label: "농장", x: 12, y: 46, title: "비료가 필요한 농장",
    text: "요소는 요소수뿐 아니라 비료의 핵심 원료예요. 비료 가격이 오르면 농산물 가격과 식량 수출입에도 영향을 줘요.",
    terms: ["import-dependence", "hs-code"], news: "urea" },
  { id: "lng", cat: "production", live: "energy", label: "LNG 터미널", x: 8, y: 74, title: "가스를 받는 LNG 터미널",
    text: "한국은 에너지 대부분을 수입해요. 액화천연가스(LNG)는 전용 선박으로 들여와 둥근 탱크에 저장해요. 한미 무역합의에도 에너지 구매 약속이 들어 있어요.",
    terms: ["lng", "trade-agreement"], news: "tariff" },
  { id: "fish", cat: "production", live: "food", label: "수산물 시장", x: 44, y: 80, title: "바다에서 온 수산물 시장",
    text: "수산물은 신선함이 생명이라 냉장 상태를 유지하며 옮기는 콜드체인이 중요해요. 원산지 표시도 꼼꼼히 확인해요.",
    terms: ["cold-chain", "origin"], news: null },
  /* 통관·정책 */
  { id: "customs", cat: "policy", live: "tariff", label: "세관", x: 53, y: 29, title: "물건을 검사하는 세관",
    text: "세관은 물건이 무엇인지, 어디서 왔는지 확인하고 관세를 걷어요. 무역 통계도 세관 신고에서 만들어져요.",
    terms: ["tariff", "hs-code"], news: "tariff" },
  { id: "ministry", cat: "policy", live: "agreement", label: "통상 정부청사", x: 30, y: 26, title: "무역협정을 맺는 정부청사",
    text: "정부는 다른 나라와 관세와 무역 규칙을 협상하고 협정을 맺어요. 수출통제나 공급망 대책도 여기서 만들어져요.",
    terms: ["trade-agreement", "reciprocal-tariff"], news: "tariff" },
  /* 금융·보험 */
  { id: "bank", cat: "finance", live: "fx", label: "은행 · 환전", x: 43, y: 16, title: "대금을 주고받는 은행",
    text: "수출 대금은 주로 달러로 받아요. 환율이 바뀌면 같은 물건도 해외에서 받는 가격과 기업이 손에 쥐는 원화가 달라져요. 신용장으로 대금을 보장하기도 해요.",
    terms: ["exchange-rate", "lc"], news: null },
  { id: "insurance", cat: "finance", live: "logistics", label: "적하보험", x: 36, y: 20, title: "화물을 지키는 보험사",
    text: "배가 폭풍이나 사고를 만나면 화물이 손상될 수 있어요. 적하보험은 운송 중 화물의 손해를 보상해요. 홍해 같은 위험 해역을 지나면 보험료가 올라요.",
    terms: ["cargo-insurance", "incoterms"], news: "redsea" },
  /* 거래·시장 */
  { id: "office", cat: "market", live: "export", label: "무역사무소", x: 29, y: 30, title: "서류를 쓰는 무역사무원",
    text: "물건 하나를 수출하려면 인보이스, 포장명세서, 선하증권, 원산지증명서가 필요해요. 서류의 품목 코드가 통계와 관세의 기준이 돼요.",
    terms: ["bl", "hs-code", "origin"], news: "urea" },
  { id: "deal", cat: "market", live: "export", label: "바이어 · 셀러", x: 38, y: 63, title: "가격을 협상하는 바이어와 셀러",
    text: "운송비와 위험을 누가 질지(인코텀즈), 관세가 붙으면 가격을 얼마나 낮출지까지 협상해요.",
    terms: ["incoterms", "incidence"], news: "tariff" },
  { id: "expo", cat: "market", live: "export", label: "무역박람회", x: 24, y: 58, title: "해외 바이어를 만나는 무역박람회",
    text: "박람회는 새 수출 시장을 찾는 자리예요. 기업은 샘플을 보여 주고 상담을 거쳐 계약까지 이어 가요.",
    terms: ["incoterms", "lc"], news: null },
  { id: "ecommerce", cat: "market", live: "export", label: "전자상거래 센터", x: 60, y: 36, title: "해외 직구·역직구 물류센터",
    text: "온라인으로 해외 소비자에게 직접 파는 전자상거래 수출이 늘고 있어요. 작은 상자 수천 개를 빠르게 분류해 항공·해상으로 보내요.",
    terms: ["cross-border", "de-minimis"], news: null }
];

/* 요소 수입 실제 통계 (관세청 수출입무역통계, HS 310210, 수입량 kg, 원산지 기준, 수리일 기준 연간, 조회일 2026-10-08) */
window.UREA_DATA = {
  years: [2021, 2022, 2023, 2024, 2025],
  series: [
    { name: "중국",   values: [654777694, 378274648, 419989035, 112438242, 265228529] },
    { name: "카타르", values: [51886733, 209627951, 114365915, 114849574, 75700033] },
    { name: "베트남", values: [60125050, 59934691, 51199513, 199160033, 116363865] },
    { name: "기타",   values: [110359720, 230736950, 137625049, 311155687, 196441900] }
  ],
  caption: "출처: 관세청 수출입무역통계 · HS 310210 요소(비료용 포함) · 수입량(kg) 기준 · 원산지 기준 · 2021–2025 연간 · 조회일 2026-10-08"
};
