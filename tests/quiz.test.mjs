import test from "node:test";
import assert from "node:assert/strict";
import { scoreQuiz, validateQuiz, PASS_PCT } from "../src/quiz.js";
import { COURSES } from "../src/data.js";
import { flatLessons } from "../src/progress.js";

const questions = [
  { q: "Q1", options: ["a", "b"], answerIndex: 0 },
  { q: "Q2", options: ["a", "b", "c"], answerIndex: 2 },
  { q: "Q3", options: ["a", "b"], answerIndex: 1 },
  { q: "Q4", options: ["a", "b"], answerIndex: 0 },
];

test("scoreQuiz scores and detects pass at 70%", () => {
  const all = scoreQuiz(questions, [0, 2, 1, 0]);
  assert.equal(all.score, 4);
  assert.equal(all.pct, 100);
  assert.equal(all.passed, true);

  const three = scoreQuiz(questions, [0, 2, 1, 1]);
  assert.equal(three.score, 3);
  assert.equal(three.pct, 75);
  assert.equal(three.passed, true);

  const two = scoreQuiz(questions, [0, 2, 0, 1]);
  assert.equal(two.pct, 50);
  assert.equal(two.passed, false);
});

test("scoreQuiz treats unanswered questions as wrong", () => {
  const r = scoreQuiz(questions, [0, 2]);
  assert.equal(r.score, 2);
  assert.equal(r.perQuestion[2].chosen, null);
  assert.equal(r.perQuestion[2].correct, false);
});

test("scoreQuiz handles empty quiz", () => {
  const r = scoreQuiz([], []);
  assert.deepEqual({ score: r.score, total: r.total, pct: r.pct }, { score: 0, total: 0, pct: 0 });
});

test("PASS_PCT is 70", () => {
  assert.equal(PASS_PCT, 70);
});

test("validateQuiz flags broken quizzes", () => {
  assert.ok(validateQuiz(null).length > 0);
  assert.ok(validateQuiz({ questions: [] }).length > 0);
  assert.ok(validateQuiz({ questions: [{ q: "x", options: ["a"], answerIndex: 0 }] }).length > 0);
  assert.ok(validateQuiz({ questions: [{ q: "x", options: ["a", "b"], answerIndex: 5 }] }).length > 0);
  assert.equal(validateQuiz({ questions: [{ q: "x", options: ["a", "b"], answerIndex: 1 }] }).length, 0);
});

test("real catalog: every quiz lesson is valid and winnable", () => {
  let quizCount = 0;
  for (const c of COURSES) {
    for (const { lesson } of flatLessons(c)) {
      if (lesson.type !== "quiz") continue;
      quizCount += 1;
      assert.deepEqual(validateQuiz(lesson.quiz), [], `${c.id}/${lesson.id} quiz valid`);
      const perfect = lesson.quiz.questions.map((q) => q.answerIndex);
      const r = scoreQuiz(lesson.quiz.questions, perfect);
      assert.equal(r.passed, true, `${lesson.id} perfect answers pass`);
    }
  }
  assert.ok(quizCount >= 5, "catalog should include at least 5 quiz lessons");
});
