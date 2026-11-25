# Mobile Cognitive Experiments

Language for running multi-trial cognitive experiments and studying participants' spoken responses.

## Language

### Experiments and Sessions

**Associations Experiment**:
The experiment in which the participant speaks the first association that comes to mind for each Stimulus.
_Avoid_: Word Reading

**Word Reading**:
The experiment in which the participant reads each Stimulus word aloud as its Answer.
_Avoid_: Word task

**Session**:
One participant's complete run of an experiment, containing an ordered sequence of Trials.
_Avoid_: Conversation

**Incomplete Session**:
A Session that ended before its final Trial because of an interruption or failure.
_Avoid_: Partial conversation

**Session Username**:
A name entered by the participant at the beginning of a Session, used only for that Session without creating an account or retaining it afterward.
_Avoid_: Participant Code, account

**Participant Code**:
A researcher-assigned identifier that associates a Session with a participant without directly identifying them.
_Avoid_: User ID, account

**Session Report**:
The summary presented at the end of a completed Session showing every Attempt, completed Response Durations, the completed-only Session mean, and signed differences from the mean.
_Avoid_: Leaderboard, score card

### Trials, Stimuli, and Attempts

**Trial**:
One selected Stimulus and its associated participant Response task within a Session, including a retry when needed.
_Avoid_: Word, round

**Stimulus**:
The written word and its paired spoken form presented to the participant in a Trial.
_Avoid_: Prompt, word

**Attempt**:
An initial or retry presentation of a Trial's Stimulus and the associated Response outcome. Both attempts remain distinct in the Session Report.
_Avoid_: Session, Trial

**Early Response**:
An Attempt in which the participant begins vocalizing before Stimulus playback has finished, invalidating that Attempt and queueing at most one retry for the Trial.
_Avoid_: False start

**Unanswered Attempt**:
An Attempt in which no vocalization begins before the unanswered deadline after Response Timing Start.
_Avoid_: Skipped Trial

**Incomplete Attempt**:
An Attempt in which vocalization begins after Response Timing Start but does not finish and complete Confirmation Silence before the Trial cutoff.
_Avoid_: Incomplete Session, Unanswered Attempt

### Responses and Timing

**Stimulus Onset**:
The earlier of the written word's visual presentation and its spoken form becoming audible in a Trial.
_Avoid_: Playback request time

**Response Timing Start**:
The moment the Stimulus is visible and its spoken playback has finished, whichever occurs later.
_Avoid_: Stimulus Onset

**Response**:
All participant vocal behavior associated with a Trial, including Hesitations and the intelligible Answer.
_Avoid_: Reaction

**First Vocalization**:
The participant's first audible vocal Response after a Stimulus begins, including a Hesitation rather than only the intelligible Answer.
_Avoid_: Answer Onset

**Thinking Time**:
The interval from Stimulus Onset to the participant's First Vocalization.
_Avoid_: Reaction time, response latency

**Hesitation**:
A vocalization such as “hmm” or “khm” that precedes or interrupts the intelligible Answer.
_Avoid_: Filler

**Answer**:
The intelligible portion of a Response that performs the task requested by the Trial.
_Avoid_: Correct response

**Answer Onset**:
The moment the intelligible Answer begins, after any preceding Hesitations.
_Avoid_: First Vocalization

**Confirmation Silence**:
The required continuous silence following the participant's last vocalization that confirms a Response has finished, excluded from Response Duration.
_Avoid_: Inter-trial pause, internal pause

**Response Duration**:
The interval from Response Timing Start to the end of the participant's last vocalization in a Trial, including initial waiting, speech, and internal pauses but excluding Confirmation Silence.
_Avoid_: Thinking Time, reaction time
