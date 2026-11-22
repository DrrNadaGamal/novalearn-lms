import test from "node:test";
import assert from "node:assert/strict";
import { formatMinutes, clamp, round1, slugify, matchesQuery, uniqueBy } from "../src/utils.js";

test("formatMinutes formats hours and minutes", () => {
  assert.equal(formatMinutes(0), "0m");
  assert.equal(formatMinutes(45), "45m");
  assert.equal(formatMinutes(60), "1h");
  assert.equal(formatMinutes(95), "1h 35m");
  assert.equal(formatMinutes(-5), "0m");
  assert.equal(formatMinutes(NaN), "0m");
});

test("clamp bounds values", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-1, 0, 10), 0);
  assert.equal(clamp(11, 0, 10), 10);
});

test("round1 rounds to one decimal", () => {
  assert.equal(round1(4.26), 4.3);
  assert.equal(round1(4.24), 4.2);
});

test("slugify produces url-safe slugs", () => {
  assert.equal(slugify("Full-Stack Web Development!"), "full-stack-web-development");
  assert.equal(slugify("  SQL & Analytics "), "sql-analytics");
});

test("matchesQuery matches across fields and arrays, empty query passes", () => {
  const course = { title: "React in Practice", tags: ["react", "hooks"], level: "Intermediate" };
  assert.equal(matchesQuery(course, ["title", "tags"], "react"), true);
  assert.equal(matchesQuery(course, ["title", "tags"], "HOOKS"), true);
  assert.equal(matchesQuery(course, ["title", "tags"], "python"), false);
  assert.equal(matchesQuery(course, ["title"], ""), true);
  assert.equal(matchesQuery(course, ["missing"], "x"), false);
});

test("uniqueBy removes duplicate keys, keeps first", () => {
  const list = [{ id: 1, v: "a" }, { id: 2, v: "b" }, { id: 1, v: "c" }];
  assert.deepEqual(uniqueBy(list, "id").map((x) => x.v), ["a", "b"]);
});
