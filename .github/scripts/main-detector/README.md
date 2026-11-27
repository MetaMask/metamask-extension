# Main performance detector

Posts to Slack when one commit on `main` changes startup performance or slows
a critical user flow. It is not a merge gate and never blocks anything.

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
5. Beside the startup jobs, on the same base and head builds, runs the critical
   user flows with a series admitted under ADR 0072 (`CUF_FLOW_FILES` in
   `cufs.mts`) in Chrome, 2 jobs per flow of 10 iterations, base and head
   alternating per iteration. It pairs consecutive iterations and scores each
   admitted series with the paired decision rule: slower when the one-sided 95%
   lower bound of the Hodges-Lehmann shift of the head-minus-base differences
   exceeds the series' `δ_block` (`admitted-series.ts`). The rule works in
   milliseconds, so a series whose base is 0 ms (a long-task total) scores.

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

A page load that got 40 ms slower in Chrome pings, quietly. Each job measures
the shift in ms, as the head's mean less the base's, and the batch pools those
shifts. The floors are in ms, not percent, because noise has a part that does
not scale with the series: 1.5% of a 30 ms step is below timer jitter.

The floors come from the 100 A/A runs of 2026-11-20, where base and head are
the same build. The standard deviation of one batch's mean shift was 4.8 ms
(Chrome load), 5.2 ms (Chrome uiStartup), 15.6 ms (Firefox load) and 22.6 ms
(Firefox uiStartup), so a quiet floor is 2.8, 3.1, 2.2 and 1.8 of them. A loud
ping is 5% of those series' base medians (902, 1073, 1744 and 2075 ms). The
bound and the second batch are what keep false pings rare: none of the 100 A/A
runs pinged. A new series gets its own floor from its own A/A runs, at about 2
to 3 of those standard deviations and above timer resolution; a metric with no
floor in `DEFAULT_CONFIG.floors`, such as the breakdown, never pings.

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
- Failures: the run fails, and the heartbeat reports it, when a batch or a
  critical user flow series could not be measured, when a successful `Main` run left no build, or when the secret
  is missing on a `workflow_run` or `schedule` run. A `Main` re-run is ignored
  for a commit that an earlier `workflow_run` detector run already decided
  (artifact `detector-result` or `detector-skip`) or is still deciding; a run
  that could not measure leaves `detector-unmeasured` and does not count. `head_sha` must be
  a full 40-character SHA.
- Stop it: disable the workflow in the Actions tab. Nothing else depends on it.
- Local checks: `slack-cli.mts --result result.json` prints the message
  (a dry run); `resolve-cli.mts`, `compare-builds-cli.mts` and `score-cli.mts` are
  the same steps the workflow runs.

## Scheduled runs

Three scheduled runs slow Chrome's CPU (`BENCHMARK_CPU_THROTTLE_RATE`, 2 times
by default) so work of 25 to 50 ms, which is no long task on a CI runner, shows
in `longTaskTotalDuration` and `tbt`. Each measures Chrome only, with the
commit checks' paired jobs, 5 jobs of 20 sessions or iterations (the commit
checks use 10), a confirmation batch when the first looks suspicious, the same
scoring and the same Slack channel. Each ping names its run in its label, and
the run is titled `latest-main (throttled)`, `(drift)` or `(calibration)`, which
the heartbeat does not count. A throttled run's shifts are the throttled ms
against the same floors, so a shift of half a floor on a normal CPU can reach it;
no throttled A/A run has set those floors, and `mode=throttled-aa` produces one.

| Run               | When                             | Compares                                                                                                  | Measures                                                                             | Slack label                            |
| ----------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------- |
| Daily             | 07:00 UTC                        | the newest `main` commit with a build against the commit the last successful scheduled daily run measured | `startupStandardHome` and the critical user flows                                    | `throttled, <base>..<head>`            |
| Daily, power user | with the daily run, on its range | the same                                                                                                  | `startupPowerUserHome` with 10 sessions per job, floors of its own from six A/A runs | `throttled power-user, <base>..<head>` |
| Drift             | Mondays 08:00 UTC                | the newest `main` commit against `drift-reference.json`                                                   | the daily run's series                                                               | `drift, <reference>..<head>`           |
| Calibration       | Mondays 09:00 UTC                | the past week's A/A canary results                                                                        | nothing                                                                              | `calibration, <from>..<to>`            |

The daily run records the commit it measured as the name of the artifact
`throttled-measured-<sha>`, once every pass of it succeeded, and the next run
reads the name through the API. The first run, a run after the record expired
(30 days) and a run whose previous commit is out of reach use the nearest
earlier build. A run that fails records nothing, so the next range is longer.
A run with no newer commit with a build does nothing, and one whose build is
identical to its base's records its head and measures nothing.

The drift reference is a commit on `main` with a build. Update it by hand in its
own commit when the drift it caught has been dealt with or accepted. The drift
run never falls back to another base.

The calibration reads the `detector-result` of the past week's commit checks and
keeps the canaries, the runs of an identical build against itself that the
detector makes for 1 in 10 commits. It pings when more canaries pinged than a
rule that fires on 1 run in 20 would give (exact binomial tail below 0.05, 20
being the level of the rules' one-sided 95% bounds and an assumption of this
check, not a measured rate), or when the standard error of a batch's shift in ms
is above a startup floor, or a critical user flow series' shift in ms on an A/A
is above its `δ_block`. It judges the unthrottled floors only, since canaries
are unthrottled.

`workflow_dispatch` runs them on demand: `mode=throttled`, `throttled-aa`
(the head against itself), `drift` and `calibration`, with `cpu_throttle_rate`,
`iterations` (a multiple of 10), `head_sha`, `base_sha` and `post_slack`.

The daily run also runs the Chrome presets of `run-benchmarks.yml` that these
jobs do not score on the head build, report-only: the `throttled-cpu2x-benchmark-*`
artifacts, kept for 30 days for admission under ADR 0072.

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
- The critical user flows' `δ_block` values were calibrated on differences of
  run means, two per paired job; here each difference is one pair of
  iterations. The rule bounds the false positive rate (FPR) at 5% for any
  number of pairs, but recall at this shape has not been measured.
