# Main performance detector

Posts to Slack when one commit on `main` changes startup performance. It is not
a merge gate and never blocks anything.

## What it does

When the `Main` workflow finishes for a push to `main`, `main-detector.yml`:

1. Finds the head commit's build and the nearest earlier first-parent commit
   with a build (the base), from the `builds-from-run` commit statuses.
2. Stops with "no change" if both have the same `build-source-hash`. These runs
   take about 12 seconds and start no jobs. One in ten of them runs anyway as an
   A/A canary: base and head are the same build, so any ping is a false alarm.
3. Otherwise runs 5 jobs per browser. Each job runs the base and head build
   alternately in one session on one runner, so runner and browser differences
   cancel out.
4. Scores the log ratio of head to base for `uiStartup` and `load` in Chrome
   and Firefox. If the first batch looks suspicious, a second independent batch
   confirms it.

## Reading a ping

A ping is only sent when the second batch confirms it: the pooled jobs and the
second batch alone must each pass the same rule as the first batch. The message shows the pooled shift
with its 95% bounds, the per-job shifts, and a breakdown (`loadScripts`,
`setupStore`, `firstReactRender`, `longTaskTotalDuration`) to point at the phase.

|            | Chrome                     | Firefox             |
| ---------- | -------------------------- | ------------------- |
| Quiet ping | shift of 1.5% or more      | shift of 2% or more |
| Loud ping  | 5% or more (both browsers) |                     |

Faster is reported too. A large speed-up can mean the metric stopped timing
what it should, so check that first. A breakdown metric that moves by more than
100% is flagged, because the commit probably changed what it measures.

## Triage

1. Open the commit and PR in the message. If the range is more than one commit,
   the cause could be any of them.
2. Re-run for the same commit: Actions, `Main performance detector`, Run
   workflow, set `head_sha`. A real change repeats; most false alarms do not.
3. For a suspected harness or metric change (the breakdown moves by orders of
   magnitude, or one browser only), compare the artifacts `detector-b1-*` and
   `detector-b2-*`, which hold the raw per-session samples.
4. The A/A canary message ("a false alarm on the A/A canary") means the detector fired on
   identical builds. Note it, and do not investigate the commit.

## Operating it

- Secret: `SLACK_WEBHOOK_MAIN_DETECTOR` (an incoming webhook for the channel).
  Without it, `slack-cli.mts` prints the message instead of posting it.
- Manual runs: `workflow_dispatch` with `head_sha`, `mode=aa` for a canary, and
  `post_slack` to post. `inject_head_ms` adds a busy-wait to the head build for
  a positive control.
- Stop it: disable the workflow in the Actions tab. Nothing else depends on it.
- Local checks: `slack-cli.mts --result result.json` prints the message
  (a dry run); `resolve-cli.mts`, `compare-builds-cli.mts` and `score-cli.mts` are
  the same steps the workflow runs.

## Heartbeat

`main-detector-heartbeat.yml` runs daily at 14:17 UTC. It takes the Main runs
on `main` that finished between 27 and 3 hours ago (the 3 hours let the detector
finish), drops cancelled ones, and checks that each commit has a detector run.
It posts to the same channel only when a commit has no detector run or all its
runs failed. A day with no Main runs (weekends, holidays) says nothing. Without
the secret it prints the message instead. It cannot notice its own death:
scheduled workflows are disabled after 60 days without repository activity, and
GitHub emails the last person to edit the schedule when one fails.

## Known limits

- It uses the harness on the default branch, not the head commit's harness.
- Firefox hides work in early scripts, so some Firefox changes are not visible.
- Commits with no build anywhere in the lookback are skipped, and nothing is
  posted for them.
