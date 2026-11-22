import React, { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Attempt, createSession, Experiment, newAttempt, recordAttempt, report, Session, Signal, stepAttempt, timingStart } from './src/domain/experiment';
import { experiments } from './src/experiments';
import { simulatedAudio } from './src/services/simulation';

type Screen = 'home' | 'setup' | 'run' | 'report';
const seconds = (ms: number | undefined) => ms === undefined ? '—' : `${(ms / 1000).toFixed(2)} s`;
function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, (pressed || disabled) && { opacity: 0.5 }]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [experiment, setExperiment] = useState<Experiment>();
  const [username, setUsername] = useState('');
  const [pauseSeconds, setPauseSeconds] = useState(4);
  const [session, setSession] = useState<Session>();
  const [attempt, setAttempt] = useState<Attempt>();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [clock, setClock] = useState(0);
  const [nextAt, setNextAt] = useState<number>();
  const origin = useRef(0);
  const offset = useRef(0);
  const active = useRef(false);
  const now = () => performance.now() - origin.current + offset.current;
  const discard = (message: string) => {
    active.current = false;
    simulatedAudio.recording.discard();
    setSession(undefined); setAttempt(undefined); setUsername(''); setNextAt(undefined);
    setNotice(message); setError(''); setScreen('home');
  };
  const discardRef = useRef(discard); discardRef.current = discard;
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active' && active.current) discardRef.current('Session interrupted. Your username and Session data were discarded.');
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!active.current) return false;
      discardRef.current('Session cancelled. Your username and Session data were discarded.'); return true;
    });
    return () => { listener.remove(); back.remove(); };
  }, []);
  useEffect(() => {
    if (screen !== 'run') return;
    const timer = setInterval(() => setClock(now()), 50);
    return () => clearInterval(timer);
  }, [screen]);
  useEffect(() => {
    if (screen !== 'run' || !session || !attempt) return;
    if (attempt.outcome) {
      if (nextAt !== undefined && clock >= nextAt) {
        const updated = recordAttempt(session, attempt);
        setSession(updated); setNextAt(undefined);
        if (!updated.queue.length) {
          simulatedAudio.recording.stop();
          setScreen('report'); setAttempt(undefined);
        } else {
          const next = updated.queue[0];
          setAttempt(newAttempt(next.word, next.number, now()));
        }
      }
      return;
    }
    let updated = attempt;
    const playbackEnd = attempt.visibleAt + simulatedAudio.playback.durationMs;
    if (attempt.playbackEndAt === undefined && clock >= playbackEnd) updated = stepAttempt(updated, { type: 'playback-end', at: playbackEnd });
    updated = stepAttempt(updated, { type: 'tick', at: clock });
    if (updated !== attempt) {
      setAttempt(updated);
      if (updated.outcome) setNextAt(clock + session.pauseSeconds * 1000);
    }
  }, [clock, screen, session, attempt, nextAt]);

  const choose = () => {
    try { setExperiment(experiments()[0]); setError(''); setNotice(''); setScreen('setup'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Invalid experiment configuration.'); }
  };
  const start = () => {
    if (!experiment) return;
    try {
      const run = createSession(experiment, username, pauseSeconds);
      origin.current = performance.now(); offset.current = 0; active.current = true;
      setSession(run); setUsername(''); setAttempt(newAttempt(run.queue[0].word, 1, 0));
      setClock(0); setNextAt(undefined); setError(''); simulatedAudio.recording.start(); setScreen('run');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to begin Session.'); }
  };
  const send = (type: Signal['type']) => {
    if (!attempt || !session || attempt.outcome) return;
    const at = now();
    // Flush scheduled playback before processing a button press, even between timer ticks.
    const playbackEnd = attempt.visibleAt + simulatedAudio.playback.durationMs;
    let current = attempt;
    if (current.playbackEndAt === undefined && at >= playbackEnd) current = stepAttempt(current, { type: 'playback-end', at: playbackEnd });
    const updated = stepAttempt(current, { type, at });
    setAttempt(updated); setClock(at);
    if (updated.outcome) setNextAt(at + session.pauseSeconds * 1000);
  };
  const fastForward = (ms: number) => { offset.current += ms; setClock(now()); };
  const summary = session && screen === 'report' ? report(session.attempts) : undefined;
  return <SafeAreaProvider><SafeAreaView style={styles.safe}><StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>COGNITIVE EXPERIMENTS</Text>
      <View style={styles.banner}><Text style={styles.bannerTitle}>Simulation mode</Text><Text style={styles.body}>No audio is played or recorded. All results are simulated.</Text></View>
      {!!notice && <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {screen === 'home' && <>
        <Text accessibilityRole="header" style={styles.title}>Make room for a thought.</Text>
        <Text style={styles.body}>Explore a word association Session. Your username and results stay in memory only.</Text>
        <View style={styles.card}><Text style={styles.subtitle}>01 · Word associations</Text><Text style={styles.body}>12 words. One spontaneous association for each.</Text><Button title="Associations Experiment" onPress={choose} /></View>
        <Text style={styles.subtitle}>Settings</Text><Text style={styles.body}>Pause between attempts: {pauseSeconds} seconds</Text>
        <View style={styles.row}><Button title="− 1 second" secondary disabled={pauseSeconds <= 1} onPress={() => setPauseSeconds(p => p - 1)} /><Button title="+ 1 second" secondary disabled={pauseSeconds >= 10} onPress={() => setPauseSeconds(p => p + 1)} /></View>
        <Text style={styles.small}>1–10 seconds. Fixed during a Session; resets to four when the app restarts.</Text>
      </>}
      {screen === 'setup' && experiment && <>
        <Text accessibilityRole="header" style={styles.title}>{experiment.title}</Text>
        <Text style={styles.body}>{experiment.instruction}</Text>
        <View style={styles.card}><Text style={styles.subtitle}>How it works</Text>
          <Text style={styles.body}>Wait until spoken playback finishes before responding. Two seconds of silence completes your response. No speech within 15 seconds is unanswered; the whole response and confirmation must finish before 30 seconds.</Text>
          <Text style={styles.body}>Early responses get one retry at the end. There are {experiment.trialCount} distinct words, with a {pauseSeconds}-second pause between attempts.</Text>
          <Text style={styles.body}>In this scaffold, use buttons to simulate speech. You do not need to speak or grant microphone permission. Start/stop speech to explore internal pauses, or advance simulated time to try timeouts.</Text>
        </View>
        <Text nativeID="username-label" style={styles.subtitle}>Session Username</Text>
        <TextInput accessibilityLabel="Session Username" style={styles.input} value={username} onChangeText={setUsername} placeholder="Enter a temporary name" autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.small}>Required, 1–40 characters after trimming spaces. Not saved. Cancelling or leaving the app discards the Session.</Text>
        <Button title="Begin simulated Session" onPress={start} />
        <Button title="Back" secondary onPress={() => { setUsername(''); setError(''); setScreen('home'); }} />
      </>}
      {screen === 'run' && session && attempt && <>
        <Text style={styles.small}>{session.username} · Attempt {session.attempts.length + 1} · {session.queue.length} remaining{attempt.number === 2 ? ' · Retry' : ''}</Text>
        <Text accessibilityRole="header" style={styles.word}>{attempt.word.text}</Text>
        {!attempt.outcome && <>
          <Text style={styles.subtitle}>{attempt.playbackEndAt === undefined ? 'Simulated playback…' : attempt.speaking ? 'Simulated speech active' : attempt.lastSpeechEnd !== undefined ? 'Confirming silence…' : 'Your response'}</Text>
          <Text style={styles.body}>{simulatedAudio.playback.label}</Text>
          <Text style={styles.body}>{timingStart(attempt) === undefined ? 'Timing starts after playback.' : `Elapsed: ${seconds(Math.max(0, clock - timingStart(attempt)!))}`}</Text>
          <Text style={styles.small}>{simulatedAudio.speechDetection.label}</Text>
          <Button title={attempt.playbackEndAt === undefined ? 'Simulate early speech' : attempt.speaking ? 'Simulate speech ending' : 'Simulate speech starting'} onPress={() => send(attempt.speaking ? 'speech-end' : 'speech-start')} />
          <Button title="Advance simulated time by 2 seconds" secondary onPress={() => fastForward(2000)} />
          <Button title={attempt.speechStarted ? 'Advance to 30-second cutoff' : 'Advance to unanswered deadline'} secondary disabled={attempt.playbackEndAt === undefined} onPress={() => fastForward(Math.max(0, timingStart(attempt)! + (attempt.speechStarted ? 30000 : 15000) - now()))} />
        </>}
        {attempt.outcome && <View style={styles.card}><Text accessibilityLiveRegion="polite" style={styles.subtitle}>{attempt.outcome === 'early' ? attempt.number === 1 ? 'Early response · retry queued' : 'Invalid · early response on retry' : attempt.outcome}</Text>
          <Text style={styles.body}>{attempt.outcome === 'completed' ? `Response Duration: ${seconds(attempt.durationMs)}` : `Elapsed: ${seconds(attempt.elapsedMs)}`}</Text>
          <Text style={styles.body}>Next in {Math.max(0, Math.ceil(((nextAt ?? clock) - clock) / 1000))} seconds</Text></View>}
        <Button title="Cancel and discard Session" secondary onPress={() => discard('Session cancelled. Your username and Session data were discarded.')} />
      </>}
      {screen === 'report' && session && summary && <>
        <Text accessibilityRole="header" style={styles.title}>Session report</Text><Text style={styles.body}>{session.username} · Simulated results</Text>
        <View style={styles.card}><Text style={styles.subtitle}>{summary.meanMs === undefined ? 'No completed responses' : 'Mean Response Duration'}</Text><Text style={styles.metric}>{seconds(summary.meanMs)}</Text><Text style={styles.small}>Completed responses only. Differences are duration minus mean.</Text></View>
        {summary.rows.map((a, i) => <View style={styles.reportRow} key={`${a.word.id}-${a.number}`}>
          <Text style={styles.subtitle}>{i + 1}. {a.word.text}{a.number === 2 ? ' · Retry' : ''}</Text>
          <Text style={styles.body}>{a.outcome === 'early' ? a.number === 1 ? 'Invalid: early response; retried at end' : 'Invalid: early response on retry' : a.outcome}</Text>
          <Text style={styles.body}>Response Duration: {seconds(a.durationMs)}</Text>
          <Text style={styles.body}>Difference from mean: {a.differenceMs === undefined ? '—' : `${a.differenceMs > 0 ? '+' : ''}${seconds(a.differenceMs)}`}</Text>
          {a.outcome !== 'completed' && <Text style={styles.small}>Elapsed: {seconds(a.elapsedMs)} · excluded from mean</Text>}
        </View>)}
        <Text style={styles.small}>{simulatedAudio.transcription.text}</Text>
        <Button title="Finish and discard results" onPress={() => discard('Session finished. Your username and results were discarded.')} />
      </>}
      <Text style={styles.footer}>For exploring the app flow. Simulated times are not cognitive measurements.</Text>
    </ScrollView>
  </SafeAreaView></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f5ef' }, container: { padding: 24, paddingBottom: 48, gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#46564a', fontSize: 12, fontWeight: '700', letterSpacing: 2 }, banner: { backgroundColor: '#fff0cc', padding: 16, borderRadius: 12, gap: 6 }, bannerTitle: { fontWeight: '700', color: '#684800', fontSize: 16 },
  title: { fontSize: 34, lineHeight: 42, color: '#193e35', fontWeight: '700' }, subtitle: { fontSize: 18, fontWeight: '600', color: '#193e35' }, body: { fontSize: 16, lineHeight: 25, color: '#34483f' }, small: { fontSize: 14, lineHeight: 21, color: '#52645b' },
  card: { padding: 22, backgroundColor: '#fff', borderRadius: 18, gap: 14 }, button: { backgroundColor: '#245d4d', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, minHeight: 50, justifyContent: 'center' }, buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' }, secondary: { backgroundColor: '#e4ebe2' }, secondaryText: { color: '#193e35' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#7a8e82', borderRadius: 12, padding: 16, fontSize: 18, color: '#193e35', minHeight: 54 }, word: { fontSize: 52, fontWeight: '600', color: '#193e35', textAlign: 'center', paddingVertical: 36 }, metric: { fontSize: 38, fontWeight: '600', color: '#193e35' }, reportRow: { paddingVertical: 18, gap: 6, borderBottomWidth: 1, borderColor: '#d6dfd5' }, error: { color: '#9d2525', fontSize: 16 }, notice: { color: '#245d4d', fontSize: 16 }, footer: { fontSize: 12, lineHeight: 19, color: '#52645b', marginTop: 16 },
});
