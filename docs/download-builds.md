# Download prebuilt Extension builds

Use the existing command from a checkout with dependencies installed:

```bash
yarn download-builds --branch release/13.53.0 --build-type main
```

Branch-only calls select the latest run of `--workflow-id` (default `main.yml`) on that
branch, then follow its commit's `builds-from-run` status to CI's canonical donor build.
They no longer silently fall back to an older fully successful workflow run. A pending
build is waited for; failed builds produce an error even if an older build is available.
Existing owner, repository, build-type and CloudFront options remain supported.

For reproducible Chrome release validation, pin the checked-out source commit and export
provenance:

```bash
yarn download-builds --branch release/13.53.0 --ref "<full-source-sha>" \
  --build-type main --browser chrome --destination dist \
  --metadata /absolute/existing-parent/build.json --wait-seconds 1200
```

`--ref` overrides branch-run selection. The package version is read from the canonical
run's build commit, rather than the requested commit or the checkout running the downloader.
For PR builds, this is the historical merge SHA recorded for the same-repository
`run-build.yml` in the run's `referenced_workflows` metadata. The build workflow uses the
default checkout, so its workflow SHA also identifies the tree it builds. The current PR
merge ref is never used: it can change after a run. If the workflow metadata is missing,
push, scheduled, and merge-group runs use their head SHA; PR runs report an error.
`--browser` defaults to `all`;
outputs are `<destination>/chrome` and/or `<destination>/firefox`. Downloads are staged and
checked before replacing a browser directory. HTTP failures and wrong manifest versions
leave its previous build intact.

Authentication uses `--github-token`/`GITHUB_TOKEN`, then `GH_TOKEN`, then `gh auth token`.
Prefer the environment or CLI login over token arguments. Polling defaults to twenty minutes
at twenty-second intervals (`--wait-seconds`, `--poll-seconds`). Use zero wait to fail
immediately. The same deadline covers artifact availability and CloudFront publication.
This budget limits polling; it does not cancel in-flight requests or ZIP extraction.
Metadata contains `requestedCommit`, `runHeadCommit` (the canonical run's head),
`buildCommit` (the tree built, which can be a PR merge commit), run ID/URL, reuse status,
version and download URLs. Reuse compares the requested commit with the run head,
not the merge SHA, so a fresh PR merge build is not marked as reused.

The shared resolver at `.github/scripts/shared/resolve-build-run.mts` handles canonical
selection and waiting for both this command and `update-e2e-fixtures.yml`. The fixture
workflow uses `gh run download` for its full `dist/` + `builds/` artifact; this command keeps
its CloudFront browser-ZIP transport. A missing pointer or expired artifact requires a new
compatible Main build; neither caller guesses a different commit or scrapes PR comments.
