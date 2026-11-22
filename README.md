# Mobile Cognitive Experiments

A mobile app for running cognitive experiments independently on iOS and Android. The first planned experiment is the **Associations Experiment**, with an English interface and English stimuli initially.

The repository contains a runnable simulation scaffold using TypeScript + React Native with Expo development builds. Issue [#1](https://github.com/DmitryKutsev/mobile_cognitive_experiments/issues/1) covers documentation and a runnable scaffold with clearly labeled simulated audio features. Real measurements require the later audio implementation and physical-device verification.

## Associations Experiment

The participant sees and hears a word, then says the first association that comes to mind. Each word and its spoken response form a **Trial**; a sequence of Trials forms a **Session**. This is intended for unsupervised self-use.

### How a Session works

1. Choose **Associations Experiment** from the experiment chooser.
2. Enter a **Session Username** and read the instructions. Trim surrounding spaces and require 1–40 characters, allowing any language. Explain that this name is temporary and is not saved; it does not create an account.
3. Begin the Session. Select 12 distinct words randomly from a repository configuration file. The dictionary and Trial count are configured in the repository. The JSON dictionary contains stable word IDs, English text, and a language code; reject duplicate IDs, duplicate words, and fewer than 12 usable entries before a Session starts.
4. For each Trial, display the word as plain text, without an illustration, and play its spoken form. Start measuring only once the word is visible and playback has finished.
5. The participant speaks their association. The measured interval includes the initial wait, the spoken response, hesitations, and pauses within the response.
6. In the planned real-audio implementation, speech detection waits through two seconds of continuous silence to confirm that the response has ended. Shorter pauses remain within the response; speech after confirmation is outside that Trial. The measurement ends at the last speech sound, excluding this confirmation silence.
7. If the participant begins responding during stimulus playback, queue that word for a retry at the end. Allow one retry per word; if the retry also starts during playback, mark the word invalid.
8. After each attempt ends, wait four seconds before automatically presenting the next word. The pause is configurable in app settings from 1–10 whole seconds, defaults to four, and is frozen for the duration of a Session. Keep the setting only in memory and reset it to four when the app restarts.
9. Advance through the configured Trials and show every word in the Session report, including unanswered, incomplete, and invalid outcomes. Show completed Response Durations, the Session mean, and numerical differences from the mean without comparison labels. Calculate the mean from completed responses only; unanswered, incomplete, and invalid attempts remain visible but do not contribute to it. Show both attempts for a retried word as separate rows; the early invalid attempt does not contribute to the mean.

The initial scaffold simulates audio behavior, shows a visible **Simulation mode** banner, and provides controls for completed, early, unanswered, and incomplete responses. The planned real-audio implementation uses one continuous recording for the Session, with stimulus and response events on a shared timeline; speech detection and transcription details still need to be settled.

### Response Duration formula

All timestamps below use the same timeline:

- `tVisible`: the word becomes visible.
- `tPlaybackEnd`: spoken stimulus playback finishes.
- `t0 = max(tVisible, tPlaybackEnd)`: both presentation conditions have been met.
- `tLastSpeechEnd`: the participant's final speech segment ends.
- `tConfirmedEnd`: the final silence has lasted long enough to confirm completion.
- `trailingSilenceDuration = tConfirmedEnd - tLastSpeechEnd`.

```text
responseDuration = tLastSpeechEnd - t0
                 = tConfirmedEnd - t0 - trailingSilenceDuration
```

For example, if the word is visible at 0.0 seconds, playback finishes at 0.8 seconds, the last speech ends at 3.4 seconds, and completion is confirmed at 5.4 seconds:

```text
t0 = max(0.0, 0.8) = 0.8 seconds
trailingSilenceDuration = 5.4 - 3.4 = 2.0 seconds
responseDuration = 3.4 - 0.8 = 2.6 seconds
```

The agreed confirmation window is two seconds; detection timestamps in practice depend on the audio implementation. Response Duration includes speech itself; it is distinct from **Thinking Time**, which the glossary defines as stimulus onset to first vocalization. Trials without a valid response end appear explicitly in the report as unanswered or incomplete. Show their elapsed time separately from Response Duration and exclude them from the mean.

### Data lifetime and follow-up work

For the initial version, the Session Username and results exist only in memory for the current run. They are not saved or retained afterward. Future recording and transcription must respect this boundary unless a later design explicitly changes it.

- [ ] [Implement real audio, speech detection, transcription, and device verification (#2)](https://github.com/DmitryKutsev/mobile_cognitive_experiments/issues/2).
- [ ] [Design users and saved results (#3)](https://github.com/DmitryKutsev/mobile_cognitive_experiments/issues/3).

### Timeouts and report calculations

All Trial deadlines are measured from `t0`. If no speech begins within 15 seconds, mark the attempt **unanswered** and show its status and elapsed time in the report. If a response begins, it must finish and complete the two-second confirmation silence before the hard 30-second cutoff. At exactly 30 seconds, an attempt that has not completed confirmation is **incomplete**, even if its last speech ended earlier. For example, speech ending at 29 seconds would require confirmation until 31 seconds, so that attempt is incomplete at 30 seconds.

For the set `C` of completed attempts:

```text
sessionMean = sum(responseDuration for each attempt in C) / count(C)
```

Only completed attempts contribute to the mean. Every attempt still appears in the report, including separate rows for the initial attempt and retry. Show elapsed time and outcome for unanswered, incomplete, and invalid attempts rather than presenting them as completed Response Durations. For each completed attempt, show `differenceFromMean = responseDuration - sessionMean`, without above/below or fast/slow labels. An exactly equal duration has a difference of zero. If there are no completed attempts, show **No completed responses**, all attempt rows, and dashes for the mean and differences.

### Interruptions

If the participant cancels, the app goes into the background, or a call interrupts the Session, end the Session and discard its in-memory data after an explanatory message. Do not resume the interrupted Session.

### Deferred work

The scaffold protocol and stack are agreed. Real-audio architecture, processing location, permissions, noise handling, transcription alignment, and temporary recording deletion are deferred to issue #2. It also includes comparing on-device, streaming, hybrid, and post-Session transcription for English, Russian, and Dutch. User accounts and saved results are deferred to issue #3.

Canonical terminology lives in [GLOSSARY.md](GLOSSARY.md).

## Setup and run

For the quickest local start, use the browser simulation. You need Node.js 22.23.5 (or a compatible supported LTS version), npm, and GNU Make. On Ubuntu/Debian, install Make with `sudo apt install make` if it is missing.

1. Open a terminal and enter the repository:

   ```bash
   cd /home/dima/dima/repos/mobile_cognitive_experiments
   ```

2. Install dependencies once, and again when the lockfile changes:

   ```bash
   make install
   ```

3. Run the checks:

   ```bash
   make test
   ```

4. Start the local development server:

   ```bash
   make run_dev
   ```

   `make run` does the same thing. Keep this terminal open while using the app. Expo opens a browser preview; if it does not open automatically, visit [http://localhost:8081](http://localhost:8081). The first load may take a little while as the app bundles.

5. Choose **Associations Experiment**, enter a temporary username, and begin the simulated Session. Use the on-screen speech controls; no microphone or audio setup is needed.

6. Edit the app files to see development updates. Press **Ctrl+C** in the terminal to stop the server.

If port 8081 is already in use, stop the other server or choose another port:

```bash
make run_dev PORT=8082
```

Then open [http://localhost:8082](http://localhost:8082). Both `make run` and `make run_dev` bind to this computer only. They run the browser simulation; native mobile builds use the commands below.

The Make targets wrap the existing npm commands: `make install` runs `npm ci`, `make test` runs `npm run check` (type checks and protocol tests), and `make run` / `make run_dev` run the Expo web development server. Use `make help` to list them.

For native development builds, install Android Studio with its Android SDK and an emulator or connected Android device. Local iOS builds require macOS with Xcode and its command-line tools, plus CocoaPods. Then run the appropriate command:

```bash
npm run android
npm run ios
# Select a connected physical device instead:
npm run android -- --device
npm run ios -- --device
```

These commands generate ignored native projects and build/install the development app. After installing a development build, start its development server with:

```bash
npm start
```

Expo Go is not the compatibility target. Native setup details: [Expo development builds](https://docs.expo.dev/develop/development-builds/create-a-build/) and [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment).

## Verification

```bash
make test                     # TypeScript and deterministic protocol tests
npx expo install --check       # Expo dependency compatibility
npm run export                # Bundle iOS, Android, and web to ignored dist/
git diff --check
```

Type checking, six protocol tests, dependency compatibility, and all three platform bundle exports passed in this environment. A browser smoke check covered username validation, speech completion, unanswered attempts, configurable pause, cancellation, and a full 12-word report. Native binaries and physical-device execution have not been verified here; Android SDK tools and Xcode were not available on PATH. Export success verifies bundling, not device behavior.

`npm audit` currently reports three moderate findings in the Expo → fingerprint → minimatch dependency chain. Its suggested automatic fix downgrades Expo across SDK versions; no forced downgrade was applied. Revisit this with compatible upstream dependency updates.

To try the simulation, begin a Session, wait for simulated playback to finish, then press **Simulate speech starting** and **Simulate speech ending**. Wait two seconds or advance simulated time to confirm completion. Leave speech active and advance to the cutoff to try an incomplete attempt; use the unanswered deadline control without starting speech to try an unanswered attempt. Press **Simulate early speech** during playback to queue one retry. Finish or cancel to discard Session data.


## Scaffold architecture

Use TypeScript + React Native with Expo development builds, allowing native audio integration later. See [the stack decision](docs/adr/0001-expo-development-builds.md). The scaffold targets iOS and Android with an English interface. Recording, playback, speech detection, and transcription are explicitly simulated; its values are not real measurements.

Keep shared Session progression separate from experiment definitions, with explicit boundaries for recording, stimulus playback, speech detection, transcription, timing, and reporting. Start with one Associations Experiment entry in the chooser. Real-audio decisions belong to issue #2; user accounts and persistent results belong to issue #3. Do not add persistence or real microphone capture to the simulation scaffold.

### Files and in-memory data

- `App.tsx`: chooser, settings, instructions/username, running Session, and report screens; background/cancel cleanup.
- `config/associations.json`: sample English dictionary and Trial count, validated before starting.
- `src/experiments.ts`: experiment definitions; add future tasks here rather than copy Session progression.
- `src/domain/experiment.ts`: configuration validation, random selection, Session queue, attempt events/deadlines, and report calculations. Times are milliseconds on a Session-relative monotonic timeline.
- `src/services/simulation.ts`: labeled recording, playback, speech detection, and transcription boundaries with TODO #2. No audio files, permissions, external services, or saved results are used.

A Session holds its temporary username, experiment ID, frozen pause setting, pending word/attempt queue, and completed attempt records. An Attempt holds its word, first/retry number, presentation/playback/speech timestamps, event list, outcome, elapsed time, and completed Response Duration when available. A report derives the completed-only mean and per-attempt differences without dropping other outcomes. Future continuous recording metadata and aligned transcript segments are owned by issue #2; there is no real Recording or Transcript artifact in this scaffold.

## Matt Pocock skills

All 39 skills from [`mattpocock/skills`](https://github.com/mattpocock/skills) are installed project-locally for OpenCode in `.agents/skills/`; `skills-lock.json` records their source revisions.

```bash
# Restore skills after a fresh clone
npx skills@latest experimental_install --agent opencode

# Verify the project installation
npx skills@latest list --agent opencode

# Update installed skills
npx skills@latest update --project --yes

# Refresh the full collection, including newly added skills
npx skills@latest add mattpocock/skills --agent opencode --skill '*' --yes
```

Engineering-skill configuration lives in `docs/agents/`; edit those files directly as conventions evolve. Re-run `/setup-matt-pocock-skills` only to switch issue trackers or restart the setup.
