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

`--ref` overrides branch-run selection. The package version is read from that requested
commit, rather than the checkout running the downloader. `--browser` defaults to `all`;
outputs are `<destination>/chrome` and/or `<destination>/firefox`. Downloads are staged and
checked before replacing a browser directory. HTTP failures and wrong manifest versions
leave its previous build intact.

Authentication uses `--github-token`/`GITHUB_TOKEN`, then `GH_TOKEN`, then `gh auth token`.
Prefer the environment or CLI login over token arguments. Polling defaults to twenty minutes
at twenty-second intervals (`--wait-seconds`, `--poll-seconds`). Use zero wait to fail
immediately. The same deadline covers artifact availability and CloudFront publication.
This budget limits polling; it does not cancel in-flight requests or ZIP extraction.
Metadata contains requested/donor commits, run ID/URL, reuse status, version and download URLs.

The shared resolver at `.github/scripts/shared/resolve-build-run.mts` handles canonical
selection and waiting for both this command and `update-e2e-fixtures.yml`. The fixture
workflow uses `gh run download` for its full `dist/` + `builds/` artifact; this command keeps
its CloudFront browser-ZIP transport. A missing pointer or expired artifact requires a new
compatible Main build; neither caller guesses a different commit or scrapes PR comments.
