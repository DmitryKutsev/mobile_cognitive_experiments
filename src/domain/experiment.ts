export type Word = { id: string; text: string; language: string };
export type Experiment = { id: string; title: string; instruction: string; words: Word[]; trialCount: number };
export const protocol = { silenceMs: 2000, unansweredMs: 15000, cutoffMs: 30000 };

export function validateWords(input: unknown, count: number): Word[] {
  if (!Array.isArray(input) || !Number.isInteger(count) || count < 1) throw new Error('Invalid dictionary or Trial count.');
  const ids = new Set<string>();
  const texts = new Set<string>();
  const words: Word[] = [];
  for (const entry of input) {
    if (!entry || typeof entry !== 'object') throw new Error('Each word must be an object.');
    const { id, text, language } = entry;
    if (typeof id !== 'string' || !id.trim() || typeof text !== 'string' || !text.trim() || language !== 'en') throw new Error('Each word needs an ID, English text, and language "en".');
    const normalized = text.trim().normalize('NFKC').toLowerCase();
    if (ids.has(id.trim()) || texts.has(normalized)) throw new Error('Duplicate word ID or text.');
    ids.add(id.trim()); texts.add(normalized);
    words.push({ id: id.trim(), text: text.trim(), language });
  }
  if (words.length < count) throw new Error(`The dictionary needs at least ${count} usable words.`);
  return words;
}

export function selectWords(words: Word[], count: number, random = Math.random): Word[] {
  const selected = validateWords(words, count);
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]];
  }
  return selected.slice(0, count);
}

export type Outcome = 'completed' | 'early' | 'unanswered' | 'incomplete';
export type TrialEvent = { type: 'visible' | 'playback-end' | 'speech-start' | 'speech-end' | 'resolved'; at: number };
export type Attempt = {
  word: Word; number: 1 | 2; visibleAt: number; playbackEndAt?: number;
  speechStarted: boolean; speaking: boolean; lastSpeechEnd?: number;
  outcome?: Outcome; resolvedAt?: number; durationMs?: number; elapsedMs?: number; events: TrialEvent[];
};
export type Signal = { type: 'tick' | 'playback-end' | 'speech-start' | 'speech-end'; at: number };
export function newAttempt(word: Word, number: 1 | 2, at: number): Attempt {
  return { word, number, visibleAt: at, speechStarted: false, speaking: false, events: [{ type: 'visible', at }] };
}
export const timingStart = (a: Attempt) => a.playbackEndAt === undefined ? undefined : Math.max(a.visibleAt, a.playbackEndAt);
function finish(a: Attempt, outcome: Outcome, at: number): Attempt {
  const start = timingStart(a);
  return { ...a, outcome, resolvedAt: at, elapsedMs: at - (start ?? a.visibleAt),
    durationMs: outcome === 'completed' && start !== undefined && a.lastSpeechEnd !== undefined ? a.lastSpeechEnd - start : undefined,
    events: [...a.events, { type: 'resolved', at }] };
}
export function stepAttempt(a: Attempt, signal: Signal): Attempt {
  if (a.outcome) return a;
  const start = timingStart(a);
  if (start !== undefined) {
    const confirmation = !a.speaking && a.lastSpeechEnd !== undefined ? a.lastSpeechEnd + protocol.silenceMs : undefined;
    // Resolve by event time, even if a UI timer delivers the tick late.
    if (confirmation !== undefined && confirmation < start + protocol.cutoffMs && signal.at >= confirmation) return finish(a, 'completed', confirmation);
    if (!a.speechStarted && signal.at >= start + protocol.unansweredMs) return finish(a, 'unanswered', start + protocol.unansweredMs);
    if (signal.at >= start + protocol.cutoffMs) return finish(a, 'incomplete', start + protocol.cutoffMs);
  }
  if (signal.type === 'tick') return a;
  if (signal.type === 'playback-end') {
    if (a.playbackEndAt !== undefined) return a;
    return { ...a, playbackEndAt: signal.at, events: [...a.events, { type: signal.type, at: signal.at }] };
  }
  if (signal.type === 'speech-start') {
    if (start === undefined) return finish({ ...a, events: [...a.events, { type: signal.type, at: signal.at }] }, 'early', signal.at);
    return { ...a, speechStarted: true, speaking: true, lastSpeechEnd: undefined, events: [...a.events, { type: signal.type, at: signal.at }] };
  }
  if (!a.speaking) return a;
  return { ...a, speaking: false, lastSpeechEnd: signal.at, events: [...a.events, { type: signal.type, at: signal.at }] };
}

export type Session = { username: string; experimentId: string; pauseSeconds: number; queue: { word: Word; number: 1 | 2 }[]; attempts: Attempt[] };
export function createSession(experiment: Experiment, username: string, pauseSeconds: number): Session {
  const name = username.trim();
  if (!name || Array.from(name).length > 40) throw new Error('Enter a username of 1–40 characters.');
  if (!Number.isInteger(pauseSeconds) || pauseSeconds < 1 || pauseSeconds > 10) throw new Error('Pause must be 1–10 seconds.');
  return { username: name, experimentId: experiment.id, pauseSeconds,
    queue: selectWords(experiment.words, experiment.trialCount).map(word => ({ word, number: 1 })), attempts: [] };
}
export function recordAttempt(session: Session, attempt: Attempt): Session {
  if (!attempt.outcome) throw new Error('Cannot record an unfinished attempt.');
  const queue = session.queue.slice(1);
  if (attempt.outcome === 'early' && attempt.number === 1) queue.push({ word: attempt.word, number: 2 });
  return { ...session, queue, attempts: [...session.attempts, attempt] };
}
export function report(attempts: Attempt[]) {
  const completed = attempts.filter(a => a.outcome === 'completed' && a.durationMs !== undefined);
  const meanMs = completed.length ? completed.reduce((sum, a) => sum + a.durationMs!, 0) / completed.length : undefined;
  return { meanMs, rows: attempts.map(a => ({ ...a, differenceMs: a.durationMs !== undefined && meanMs !== undefined ? a.durationMs - meanMs : undefined })) };
}
