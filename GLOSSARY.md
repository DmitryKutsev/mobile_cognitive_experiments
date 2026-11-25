# Mobile Cognitive Experiments

Language for running multi-trial cognitive experiments and studying participants' spoken responses.

## Language

### Experiments and Sessions

**Associations Experiment**:
The experiment in which the participant speaks the first association that comes to mind for each Stimulus.
_Avoid_: Word task

**Session**:
One participant's complete run of an experiment, containing an ordered sequence of Trials.
_Avoid_: Conversation

**Incomplete Session**:
A Session that ended before its final Trial because of an interruption or failure.
_Avoid_: Partial conversation

**Session Username**:
A name entered by the participant at the beginning of a Session, used only for that Session without creating an account or retaining it afterward.
_Avoid_: User ID, account

**Session Report**:
The in-memory summary of a completed Session's Attempts and Response Duration statistics.
_Avoid_: Leaderboard, score card

### Trials, Stimuli, and Attempts

**Word**:
A configured dictionary entry with a stable identifier, written text, and language code selected for a Session.
_Avoid_: Prompt, Trial

**Stimulus**:
A Word presented to the participant in a Trial as both written text and spoken audio playback.
_Avoid_: Prompt, round

**Trial**:
One selected Word presented as a Stimulus and its associated participant Response task within a Session, including a retry when needed.
_Avoid_: Round

**Attempt**:
An initial or retry presentation of a Trial's Stimulus and the associated Response outcome.
_Avoid_: Session, Trial

**Early Attempt**:
An Attempt invalidated because the participant began vocalizing before Stimulus playback finished.
_Avoid_: False start

**Unanswered Attempt**:
An Attempt in which no vocalization begins before the unanswered deadline after Response Timing Start.
_Avoid_: Skipped Trial

**Incomplete Attempt**:
An Attempt in which vocalization begins after Response Timing Start but does not finish and complete Confirmation Silence before the Trial cutoff.
_Avoid_: Incomplete Session, Unanswered Attempt

### Responses and Timing

**Response**:
The participant's vocal behavior during an Attempt, including initial waiting, spoken association, hesitations, and internal pauses.
_Avoid_: Reaction

**Response Timing Start**:
The moment the Stimulus is visible and its spoken playback has finished, whichever occurs later.
_Avoid_: Stimulus onset, playback request time

**Confirmation Silence**:
The continuous silence following the participant's last vocalization that confirms a Response has ended.
_Avoid_: Inter-trial pause, internal pause

**Response Duration**:
The interval from Response Timing Start to the end of the participant's last vocalization in a completed Attempt, excluding Confirmation Silence.
_Avoid_: Thinking Time, reaction time

**Thinking Time**:
The interval from stimulus onset to the participant's first vocalization, distinct from Response Duration which includes the vocalization itself.
_Avoid_: Response Duration, reaction time
