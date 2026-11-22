import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSession, Experiment, newAttempt, recordAttempt, report, selectWords, stepAttempt, validateWords } from './experiment';
const words = Array.from({ length: 16 }, (_, i) => ({ id: String(i), text: `word${i}`, language: 'en' }));
const experiment: Experiment = { id: 'test', title: 'Test', instruction: '', words, trialCount: 12 };
const ready = () => stepAttempt(newAttempt(words[0], 1, 0), { type: 'playback-end', at: 1000 });

test('duration includes waiting, speech and internal pauses, excluding final silence', () => {
  let a = ready();
  a = stepAttempt(a, { type: 'speech-start', at: 2000 });
  a = stepAttempt(a, { type: 'speech-end', at: 3000 });
  a = stepAttempt(a, { type: 'speech-start', at: 4000 });
  a = stepAttempt(a, { type: 'speech-end', at: 5000 });
  a = stepAttempt(a, { type: 'tick', at: 7000 });
  assert.equal(a.outcome, 'completed'); assert.equal(a.durationMs, 4000); assert.equal(a.elapsedMs, 6000);
});
test('silence reaching cutoff is incomplete; confirmed before cutoff survives late timer delivery', () => {
  let a = stepAttempt(ready(), { type: 'speech-start', at: 2000 });
  a = stepAttempt(a, { type: 'speech-end', at: 30000 });
  assert.equal(stepAttempt(a, { type: 'tick', at: 31000 }).outcome, 'incomplete');
  let b = stepAttempt(ready(), { type: 'speech-start', at: 2000 });
  b = stepAttempt(b, { type: 'speech-end', at: 28000 });
  assert.equal(stepAttempt(b, { type: 'tick', at: 35000 }).outcome, 'completed');
  let c = stepAttempt(ready(), { type: 'speech-start', at: 2000 });
  c = stepAttempt(c, { type: 'speech-end', at: 29000 });
  assert.equal(stepAttempt(c, { type: 'tick', at: 31000 }).outcome, 'incomplete');
});
test('no speech times out after 15 seconds and remains in report without duration', () => {
  const a = stepAttempt(ready(), { type: 'tick', at: 16000 });
  assert.equal(a.outcome, 'unanswered'); assert.equal(a.elapsedMs, 15000);
  assert.equal(report([a]).rows.length, 1); assert.equal(report([a]).meanMs, undefined);
});
test('one early-response retry is appended and a second early response ends that word', () => {
  let s = createSession(experiment, '  Alice  ', 4);
  assert.equal(s.username, 'Alice');
  const first = stepAttempt(newAttempt(s.queue[0].word, 1, 0), { type: 'speech-start', at: 500 });
  s = recordAttempt(s, first);
  assert.equal(s.queue.length, 12); assert.equal(s.queue.at(-1)?.number, 2);
  const retry = stepAttempt(newAttempt(first.word, 2, 1000), { type: 'speech-start', at: 1200 });
  s = { ...s, queue: [{ word: first.word, number: 2 }] };
  s = recordAttempt(s, retry);
  assert.equal(s.queue.length, 0); assert.equal(s.attempts.length, 2);
});
test('reports retain all attempts and calculate signed differences only for completed ones', () => {
  const completed = (end: number) => {
    let a = stepAttempt(ready(), { type: 'speech-start', at: 2000 });
    a = stepAttempt(a, { type: 'speech-end', at: end });
    return stepAttempt(a, { type: 'tick', at: end + 2000 });
  };
  const r = report([completed(3000), completed(5000), stepAttempt(ready(), { type: 'tick', at: 16000 })]);
  assert.equal(r.meanMs, 3000); assert.deepEqual(r.rows.map(a => a.differenceMs), [-1000, 1000, undefined]);
});
test('configuration validation rejects duplicates, short dictionaries and invalid settings', () => {
  assert.equal(new Set(selectWords(words, 12).map(w => w.id)).size, 12);
  assert.throws(() => validateWords([...words, { ...words[0], id: 'other', text: ' WORD0 ' }], 12));
  assert.throws(() => validateWords(words.slice(0, 11), 12));
  assert.throws(() => createSession(experiment, '  ', 4));
  assert.throws(() => createSession(experiment, 'Alice', 11));
});
