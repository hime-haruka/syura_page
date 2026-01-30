(function () {
  const CSV_BASE =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7bBd8d_YfahCugR2TL-zaYDB7r3-aMXRBifboBW7bLlcJv-ffmtl1TkjmUXa0zowJyEKe8BkFc9ux/pub?output=csv";

  const SHEET_NAME = "notice";
  const TARGET_ID = "noticeSteps";

  const GROUP_ORDER = ["기본", "수정", "진행", "결제"];

  function toBool(v) {
    return String(v).trim().toLowerCase() === "true";
  }

  function stripScripts(html) {
    return String(html).replace(
      /<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi,
      ""
    );
  }

  function withBreaks(html) {
    return stripScripts(html).replace(/\r\n|\r|\n/g, "<br>");
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"' && inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && (ch === "," || ch === "\n" || ch === "\r")) {
        row.push(cur);
        cur = "";

        if (ch === "\r" && next === "\n") i++;
        if (ch === "\n" || ch === "\r") {
          if (row.some((c) => String(c).trim() !== "")) rows.push(row);
          row = [];
        }
        continue;
      }

      cur += ch;
    }

    row.push(cur);
    if (row.some((c) => String(c).trim() !== "")) rows.push(row);
    return rows;
  }

  function rowsToObjects(rows) {
    const header = rows[0].map((h) => String(h).trim());
    const body = rows.slice(1);

    return body.map((r) => {
      const obj = {};
      header.forEach((h, idx) => (obj[h] = r[idx] ?? ""));
      return obj;
    });
  }

  function groupItems(items) {
    const map = new Map();
    for (const it of items) {
      const g = String(it.group || "").trim() || "기타";
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(it);
    }
    return map;
  }

  function sortGroupKeys(keys) {
    const known = [];
    const unknown = [];
    for (const k of keys) {
      if (GROUP_ORDER.includes(k)) known.push(k);
      else unknown.push(k);
    }
    known.sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
    unknown.sort((a, b) => a.localeCompare(b, "ko"));
    return [...known, ...unknown];
  }

  function renderGroupedNotice(items) {
    const root = document.getElementById(TARGET_ID);
    if (!root) return;

    if (!items.length) {
      root.innerHTML = `<div class="notice__error">표시할 안내사항이 없습니다.</div>`;
      return;
    }

    const grouped = groupItems(items);
    const keys = sortGroupKeys([...grouped.keys()]);

    root.innerHTML = keys
      .map((groupName) => {
        const list = grouped
          .get(groupName)
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        const rowsHTML = list
          .map((it) => {
            const desc = String(it.desc ?? "").trim();
            return `
              <li class="noticeItem">
                <div class="noticeItem__dot" aria-hidden="true"></div>
                <div class="noticeItem__body">${withBreaks(desc)}</div>
              </li>
            `.trim();
          })
          .join("");

        return `
          <section class="noticeGroup">
            <header class="noticeGroup__head">
              <h4 class="noticeGroup__title">${groupName}</h4>
            </header>
            <ul class="noticeList">
              ${rowsHTML}
            </ul>
          </section>
        `.trim();
      })
      .join("");
  }

  async function loadNotices() {
    const root = document.getElementById(TARGET_ID);
    if (!root) return;

    const url =
      CSV_BASE + `&sheet=${encodeURIComponent(SHEET_NAME)}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("CSV fetch failed: " + res.status);

      const csvText = await res.text();
      const rows = parseCSV(csvText);
      if (!rows || rows.length < 2) throw new Error("CSV empty");

      const objs = rowsToObjects(rows);

      const visible = objs
        .filter((o) => !toBool(o.hidden))
        .map((o) => ({
          group: o.group,
          desc: o.desc,
          order: Number(String(o.order).trim()) || 0,
        }))
        .sort((a, b) => a.order - b.order);

      renderGroupedNotice(visible);
    } catch (err) {
      console.warn("[notice] load failed:", err);
      root.innerHTML =
        `<div class="notice__error">안내사항을 불러오지 못했습니다. (시트 공개/탭/헤더 확인)</div>`;
    }
  }

  document.addEventListener("DOMContentLoaded", loadNotices);
})();

/* =========================
   Packages
========================= */
(function () {
  const CSV_BASE =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7bBd8d_YfahCugR2TL-zaYDB7r3-aMXRBifboBW7bLlcJv-ffmtl1TkjmUXa0zowJyEKe8BkFc9ux/pub?gid=164493219&single=true&output=csv";

  const SHEET_NAME = "package";
  const TARGET_ID = "packages";

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"' && inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes && (ch === "," || ch === "\n" || ch === "\r")) {
        row.push(cur);
        cur = "";

        if (ch === "\r" && next === "\n") i++;
        if (ch === "\n" || ch === "\r") {
          if (row.some((c) => String(c).trim() !== "")) rows.push(row);
          row = [];
        }
        continue;
      }
      cur += ch;
    }

    row.push(cur);
    if (row.some((c) => String(c).trim() !== "")) rows.push(row);
    return rows;
  }

  function rowsToObjects(rows) {
    const header = rows[0].map((h) => String(h).trim());
    const body = rows.slice(1);

    return body.map((r) => {
      const obj = {};
      header.forEach((h, i) => (obj[h] = r[i] ?? ""));
      return obj;
    });
  }

  function renderValue(v) {
    const val = (v ?? "").toString().trim();
    if (!val) return `<span class="pkg-no">—</span>`;
    if (val === "O") return `<span class="pkg-ok">✓</span>`;
    if (val === "✕") return `<span class="pkg-no">—</span>`;
    return `<span class="pkg-text">${val}</span>`;
  }

  function renderTable(items) {
    const root = document.getElementById(TARGET_ID);
    if (!root) return;

    if (!items.length) {
      root.innerHTML = `<div class="notice__error">패키지 정보를 불러올 수 없습니다.</div>`;
      return;
    }

    function normalizeRow(o) {
      const pick = (keys) => {
        for (const k of keys) {
          const v = o[k];
          if (v !== undefined && v !== null) return v;
        }
        return "";
      };

      return {
        key: pick(["key", "Key", "KEY", "\ufeffkey"]),
        label: pick(["label", "Label", "LABEL", "\ufefflabel", "항목", "구분"]),
        desc: pick(["desc", "Desc", "DESC", "\ufeffdesc", "설명"]),
        basic: pick(["basic", "Basic", "BASIC", "\ufeffbasic", "베이직"]),
        standard: pick(["standard", "Standard", "STANDARD", "\ufeffstandard", "스탠다드"]),
        premium: pick(["premium", "Premium", "PREMIUM", "\ufeffpremium", "프리미엄"]),
        custom: pick(["custom", "Custom", "CUSTOM", "\ufeffcustom", "맞춤", "맞춤제작"]),
      };
    }

    const rowsHTML = items
      .map(normalizeRow)
      .filter((it) => String(it.label).trim())
      .map(
        (it) => `
          <tr>
            <th class="pkg-label">
              <div class="pkg-label__title">${it.label}</div>
              ${it.desc ? `<div class="pkg-label__desc">${it.desc}</div>` : ``}
            </th>
            <td>${renderValue(it.basic)}</td>
            <td>${renderValue(it.standard)}</td>
            <td>${renderValue(it.premium)}</td>
            <td>${renderValue(it.custom)}</td>
          </tr>
        `
      )
      .join("");

    root.innerHTML = `
      <div class="sec__head">
        <p class="sec__eyebrow">패키지 비교</p>
        <h2 class="sec__title">포트폴리오 제작 패키지</h2>
        <p class="sec__desc">필요한 구성에 맞춰 패키지를 선택하세요.</p>
      </div>

      <div class="card">
        <div class="pkg-wrap">
          <table class="pkg-table">
            <thead>
              <tr>
                <th></th>
                <th>베이직</th>
                <th class="is-recommend">
                <span class="pkg-head">스탠다드</span>
                </th>
                <th>프리미엄</th>
                <th>커스텀</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }


  async function loadPackages() {
    const root = document.getElementById(TARGET_ID);
    if (!root) return;

    const url = CSV_BASE + `&sheet=${encodeURIComponent(SHEET_NAME)}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("CSV fetch failed: " + res.status);

      const csvText = await res.text();

      // 1) 먼저 파싱부터
      const rows = parseCSV(csvText);
      const objs = rowsToObjects(rows);

      // 2) 그 다음에 로그
      console.log("[package url]", url);
      console.log("[package csv head]", csvText.slice(0, 120));
      console.log("[package rows count]", rows.length);
      console.log("[package keys]", Object.keys(objs[0] || {}));
      console.log("[package sample row]", objs[0]);

      renderTable(objs);
    } catch (err) {
      console.warn("[package] load failed:", err);
      root.innerHTML =
        `<div class="notice__error">패키지 정보를 불러오지 못했습니다. (시트 공개/탭/헤더 확인)</div>`;
    }
  }


  document.addEventListener("DOMContentLoaded", loadPackages);
})();
