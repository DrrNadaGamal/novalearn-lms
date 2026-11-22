import test from "node:test";
import assert from "node:assert/strict";
import {
  countLessons, courseDurationMin, findLesson, flatLessons,
  courseProgress, moduleProgress, overallStats, weeklyActivity,
} from "../src/progress.js";
import { COURSES } from "../src/data.js";

const sample = {
  id: "sample",
  modules: [
    { id: "m1", title: "M1", lessons: [
      { id: "l1", title: "A", type: "video", durationMin: 10 },
      { id: "l2", title: "B", type: "article", durationMin: 20 },
    ]},
    { id: "m2", title: "M2", lessons: [
      { id: "l3", title: "C", type: "quiz", durationMin: 30 },
    ]},
  ],
};

test("countLessons and courseDurationMin aggregate modules", () => {
  assert.equal(countLessons(sample), 3);
  assert.equal(courseDurationMin(sample), 60);
});

test("findLesson locates lesson and module", () => {
  const hit = findLesson(sample, "l2");
  assert.equal(hit.lesson.title, "B");
  assert.equal(hit.module.id, "m1");
  assert.equal(findLesson(sample, "nope"), null);
});

test("flatLessons preserves order", () => {
  assert.deepEqual(flatLessons(sample).map((f) => f.lesson.id), ["l1", "l2", "l3"]);
});

test("courseProgress counts only real lessons", () => {
  const rec = { completedLessons: ["l1", "l3", "ghost"] };
  const p = courseProgress(sample, rec);
  assert.equal(p.done, 2);
  assert.equal(p.total, 3);
  assert.equal(p.pct, 67);
  assert.equal(p.complete, false);
  assert.equal(courseProgress(sample, { completedLessons: ["l1", "l2", "l3"] }).complete, true);
  assert.deepEqual(courseProgress(sample, null), { done: 0, total: 3, pct: 0, complete: false });
});

test("moduleProgress scopes to one module", () => {
  const rec = { completedLessons: ["l1", "l3"] };
  assert.deepEqual(moduleProgress(sample.modules[0], rec), { done: 1, total: 2, pct: 50 });
  assert.deepEqual(moduleProgress(sample.modules[1], rec), { done: 1, total: 1, pct: 100 });
});

test("overallStats aggregates enrollments", () => {
  const enrolled = {
    sample: { completedLessons: ["l1", "l2", "l3"] },
    other: { completedLessons: ["l1"] },
  };
  const courses = [sample, { ...sample, id: "other" }, { ...sample, id: "not-enrolled" }];
  const stats = overallStats(courses, enrolled);
  assert.equal(stats.enrolledCount, 2);
  assert.equal(stats.completedCount, 1);
  assert.equal(stats.lessonsDone, 4);
  assert.equal(stats.avgPct, 67); // (100 + 33) / 2
  assert.equal(stats.certificates, 1);
});

test("weeklyActivity buckets minutes by weekday within 7 days", () => {
  const now = new Date("2026-11-22T12:00:00Z"); // Sunday
  const enrolled = {
    sample: {
      completedLessons: ["l1", "l2", "l3"],
      completedAt: {
        l1: "2026-11-22T09:00:00Z", // Sunday -> index 6, +10
        l2: "2026-11-20T09:00:00Z", // Friday -> index 4, +20
        l3: "2026-11-10T09:00:00Z", // older than 7 days -> ignored
      },
    },
  };
  const week = weeklyActivity([sample], enrolled, now);
  assert.equal(week.length, 7);
  assert.equal(week[6], 10);
  assert.equal(week[4], 20);
  assert.equal(week.reduce((a, b) => a + b, 0), 30);
});

test("real catalog: every course has consistent structure", () => {
  for (const c of COURSES) {
    assert.ok(c.id && c.title && c.category && c.level, `course ${c.id} missing fields`);
    assert.ok(c.modules.length >= 2, `${c.id} should have at least 2 modules`);
    assert.ok(countLessons(c) >= 5, `${c.id} should have at least 5 lessons`);
    assert.ok(courseDurationMin(c) > 0, `${c.id} duration`);
    assert.ok(c.description.length > 40, `${c.id} description`);
    assert.ok(c.outcomes.length >= 3, `${c.id} outcomes`);
    const ids = flatLessons(c).map((f) => f.lesson.id);
    assert.equal(new Set(ids).size, ids.length, `${c.id} lesson ids unique`);
    for (const { lesson } of flatLessons(c)) {
      assert.ok(["video", "article", "quiz"].includes(lesson.type), `${lesson.id} type`);
      assert.ok(Number.isFinite(lesson.durationMin) && lesson.durationMin > 0, `${lesson.id} duration`);
    }
  }
});
