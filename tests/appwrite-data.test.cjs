const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadReader(fetch) {
  const source = fs.readFileSync(path.join(__dirname, "../lib/appwriteData.ts"), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, fetch, URLSearchParams });
  return exports.fetchDailySetsFromAppwrite;
}

function row(id, date, rank, published = true) {
  return {
    $id: id, run_date: date, timestamp: "2026-11-07T00:00:00Z", rank,
    news_title: id, news_summary: "", visual_description: "description",
    image_url: null, mood_tag: "unknown", is_quiet_day: false,
    is_collected: false, published
  };
}

test("reads every page, filters unpublished rows and groups by date and rank", async () => {
  const rows = Array.from({ length: 100 }, (_, i) => row(`old-${i}`, `2026-05-${String(i % 28 + 1).padStart(2, "0")}`, 1));
  rows.push(row("new-2", "2026-11-07", 2), row("new-1", "2026-11-07", 1), row("draft", "2026-12-01", 1, false));
  const offsets = [];
  const read = loadReader(async (url) => {
    const queries = new URL(url).searchParams.getAll("queries[]").map(JSON.parse);
    const offset = queries.find((query) => query.method === "offset").values[0];
    offsets.push(offset);
    return { ok: true, json: async () => ({ rows: rows.slice(offset, offset + 100), total: rows.length }) };
  });
  const result = await read();
  assert.deepEqual(offsets, [0, 100]);
  assert.equal(result[0].runDate, "2026-11-07");
  assert.equal(result[0].memories[0].id, "new-1");
  assert.equal(result[0].memories[1].id, "new-2");
  assert.equal(result[0].memories[0].imageUrl, "/mock/afterglow-01.svg");
  assert.equal(result[0].memories[0].moodTag, "uncertain");
  assert.ok(!result.some((day) => day.runDate === "2026-12-01"));
});

test("returns an empty set when there are no rows", async () => {
  const read = loadReader(async () => ({ ok: true, json: async () => ({ rows: [], total: 0 }) }));
  assert.equal((await read()).length, 0);
});

test("reports network and API failures instead of showing mock data", async () => {
  assert.equal(await loadReader(async () => ({ ok: false }))(), null);
  assert.equal(await loadReader(async () => { throw new Error("offline"); })(), null);
});
