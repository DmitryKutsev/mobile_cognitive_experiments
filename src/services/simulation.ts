// TODO #2: replace these boundaries with a single capture timeline and device-verified audio.
// This adapter never requests microphone access, writes audio, or contacts a service.
export interface RecordingPort { start(): void; stop(): void; discard(): void }
export interface PlaybackPort { durationMs: number; label: string }
export interface SpeechDetectionPort { label: string }
export interface TranscriptionPort { text: string; status: 'simulated' }
export const simulatedAudio: {
  recording: RecordingPort; playback: PlaybackPort;
  speechDetection: SpeechDetectionPort; transcription: TranscriptionPort;
} = {
  recording: { start() {}, stop() {}, discard() {} },
  playback: { durationMs: 1500, label: 'Simulated playback — no sound is played' },
  speechDetection: { label: 'Simulated speech detection — use the controls below' },
  transcription: { text: 'No transcript: audio is simulated.', status: 'simulated' },
};
