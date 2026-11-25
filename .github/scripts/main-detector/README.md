# Main performance detector

Posts to Slack when one commit on `main` changes startup performance. It is not
a merge gate and never blocks anything.

## What it does

When the `Main` workflow finishes for a push to `main`, `main-detector.yml`:

1. Finds the head commit's build and the nearest earlier first-parent commit
   with a build (the base), from the `builds-from-run` commit statuses.
2. Stops with "no change" if both builds are the same: equal `build-source-hash`
   statuses, the same donor run, or zips with the same file names, sizes, CRCs
   and manifest (ignoring `build_id`). Only the `plan` job runs, in seconds. One
   in ten identical pairs runs anyway as an A/A canary: base and head are the
   same build, so any ping is a false alarm.
3. Otherwise runs 5 jobs per browser. Each job runs the base and head build
   alternately in one session on one runner, so runner and browser differences
   cancel out.
4. Scores the shift of head over base, in ms, for `uiStartup` and `load` in
   Chrome and Firefox. If the first batch looks suspicious, a second
   independent batch confirms it.

## Reading a ping

A ping is only sent when the second batch confirms it: the pooled jobs, the
first batch alone and the second batch alone must each pass the same rule, in
the same direction. The message shows the pooled shift
with its 95% bounds, the per-job shifts, and a breakdown (`loadScripts`,
`setupStore`, `firstReactRender`, `longTaskTotalDuration`) to point at the phase.

| Shift, in ms | Chrome load | Chrome uiStartup | Firefox load | Firefox uiStartup |
| ------------ | ----------- | ---------------- | ------------ | ----------------- |
| Quiet ping   | 13.5 ms     | 16.1 ms          | 34.9 ms      | 41.5 ms           |
| Loud ping    | 45.1 ms     | 53.7 ms          | 87.2 ms      | 103.8 ms          |

A page load that got 40 ms slower in Chrome pings, quietly. The floors are
fixed numbers of ms: 1.5% (Chrome) and 2% (Firefox) of each series' base median
over the 100 A/A runs, where base and head are the same build (902, 1073, 1744
and 2075 ms), and loud is 5% of it. A job's shift is the head's mean minus the
base's mean, in ms, over that job's sessions; the batch's shift and its
one-sided 95% bound, also in ms, come from the mean and spread of its jobs'
shifts. They are compared with the floors as measured, so a shift of
54 ms reads as 54 ms on a slow runner and on a fast one. The percent shift is
printed beside it for reference and takes no part in the verdict.

The one-sided 95% bound applies to each test on its own. A commit has up to
eight first-stage tests (2 browsers, 2 metrics, 2 directions), so the second
batch is what keeps false pings rare, and the canary pings measure the rate.

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

- Slack: posted with the bot token (`chat.postMessage`, as in
  `slack-rc-notification.mts`). The workflows pass the repository secret
  `SLACK_BOT_TOKEN` as `SLACK_BOT_TOKEN` and the repository variable
  `SLACK_MAIN_DETECTOR_CHANNEL` (for example `#my-channel`) as `SLACK_CHANNEL`.
  The bot must be a member of the channel. Without a token, `slack-cli.mts`
  prints the message instead of posting it, except on `workflow_run` and
  `schedule` runs, where a missing token or channel fails the run.
- A dispatch without `head_sha` measures the tip of `main` and is titled
  `latest-main`; neither the heartbeat nor the re-run check counts it.
- Manual runs: `workflow_dispatch` with `head_sha`, `mode=aa` for a canary, and
  `post_slack` to post. `inject_head_ms` adds a busy-wait to the head build for
  a positive control.
- Failures: the run fails, and the heartbeat reports it, when a batch could not
  be measured, when a successful `Main` run left no build, or when the secret
  is missing on a `workflow_run` or `schedule` run. A `Main` re-run is ignored
  for a commit that an earlier `workflow_run` detector run already decided
  (artifact `detector-result` or `detector-skip`) or is still deciding; a run
  that could not measure leaves `detector-unmeasured` and does not count. `head_sha` must be
  a full 40-character SHA.
- Stop it: disable the workflow in the Actions tab. Nothing else depends on it.
- Local checks: `slack-cli.mts --result result.json` prints the message
  (a dry run); `resolve-cli.mts`, `compare-builds-cli.mts` and `score-cli.mts` are
  the same steps the workflow runs.

## Heartbeat

`main-detector-heartbeat.yml` runs daily at 14:17 UTC. It takes the Main runs
on `main` that finished in the 24 hours that end 3 hours before the scheduled
time (the 3 hours let the detector finish; the window is anchored to 14:17 UTC,
however late the run starts), drops cancelled ones, and checks that each commit
has a detector run. It posts to the same channel only when a commit has no
detector run or none of its runs succeeded (failed, cancelled, timed out);
A/A and injection dispatches do not count. A day with no Main runs (weekends,
holidays) says nothing. It fails on `schedule` when the secret is missing; a
manual dispatch without the secret prints the message instead. It cannot
notice its own death:
scheduled workflows are disabled after 60 days without repository activity, and
GitHub emails the last person to edit the schedule when one fails.

## Known limits

- It uses the harness on the default branch, not the head commit's harness.
- Firefox hides work in early scripts, so some Firefox changes are not visible.
- A `Main` run that failed before building leaves no build; the detector skips
  it without failing, and a later re-run of `Main` for that commit is measured.
  After a successful `Main` run, a missing build fails the run.
- A job's score is the ratio of the mean session times, so one slow session
  moves its job. The thresholds were calibrated with this statistic; changing
  it needs a new calibration.
