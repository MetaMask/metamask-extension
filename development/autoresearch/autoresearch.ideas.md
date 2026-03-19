# Autoresearch Ideas Backlog — E2E Setup Time

This file is maintained by the autoresearch agent. Track ideas to try and what has been tried.

## Untried Ideas

### Firefox

- [ ] Pre-build XPI and cache in `os.tmpdir()` — invalidate when `dist/firefox` files change (mtime or manifest hash)
- [ ] Use `zip -1` (fastest compression) instead of default for XPI
- [ ] Lazy-load Firefox profile preferences
- [ ] Reduce Firefox startup flags (disable features not needed for E2E)

### Chrome

- [ ] Compute extension ID from manifest `key` when present — skip `chrome://extensions` scrape
- [ ] Use `--load-extension` with pre-computed ID to avoid lookup
- [ ] Reduce Chrome launch args (disable GPU, etc. — may already be done for CI)

### Shared (helpers, driver, index)

- [ ] Parallelize driver build and fixture server startup
- [ ] Reduce `waitForControllers` polling interval or timeout
- [ ] Lazy-initialize driver until first navigation
- [ ] Cache driver across tests in same process (if applicable)

## Tried — Successful

_None yet. Baseline will be established on first run._

## Tried — Failed / No Improvement

_None yet._

## Tried — Crashed / Invalid

_None yet._
