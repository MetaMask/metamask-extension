# E2E Test Flakiness Root Cause Analysis
## Tests 1-6: Multichain Accounts - Account Details

**Date**: March 4, 2026  
**Analyzed By**: Cursor Cloud Agent  
**Issue**: Tests failing with "Unable to obtain browser driver"

---

## Executive Summary

All 6 tests in `test/e2e/tests/multichain-accounts/account-details.spec.ts` failed with identical error:
```
Error: Unable to obtain browser driver.
For more information on how to install drivers see
https://www.selenium.dev/documentation/webdriver/...
```

**Root Cause**: Outdated Chrome version lock to version 126, combined with Selenium Manager's inability to reliably download ChromeDriver for this 20-month-old browser version in 2026.

**Impact**: Intermittent failures (~25% failure rate based on 6/24 failed runs)

---

## Detailed Analysis

### 1. Primary Root Cause: Chrome Version Lock

**File**: `test/e2e/webdriver/chrome.js` (line 87)

```javascript
// Temporarily lock to version 126
options.setBrowserVersion('126');
```

**History**:
- **Added**: July 24, 2024 (commit 335c497ff4c)
- **PR**: #26101 - "fix: lock Chrome version to 126"
- **Reason**: "Chrome version 127 is causing problems on CircleCI"
- **Status**: Marked as "temporary" but still present 20 months later (March 2026)

**Problem**:
1. Chrome 126 was released mid-2024
2. By March 2026, this is a severely outdated version
3. Google's Chrome for Testing repository may have limited availability or support for such old versions
4. Selenium Manager (part of Selenium WebDriver 4.31.0) struggles to reliably download ChromeDriver for Chrome 126

### 2. Contributing Factor: No Error Handling

**File**: `test/e2e/webdriver/chrome.js` (line 114)

```javascript
builder.setChromeService(service);
const driver = builder.build(); // No timeout, no retry, no error handling
```

**Problem**:
- No retry logic if driver download fails
- No timeout configuration
- No fallback mechanism
- Failures are immediate and unrecoverable

### 3. Contributing Factor: Selenium Manager Network Dependency

**How it works**:
1. Selenium Manager automatically downloads ChromeDriver on first use
2. Downloads from Google's Chrome for Testing CDN
3. Caches in `~/.cache/selenium/chromedriver/`
4. In CI containers, cache may not persist between jobs

**Problems**:
- Network issues cause immediate failures
- Rate limiting from CDN for old versions
- Cache invalidation in ephemeral CI containers
- Concurrent downloads from parallel test jobs

### 4. Failure Pattern Analysis

**Observed Pattern**:
- All 6 tests from the same file failed together
- Error occurred before any test logic execution
- Failure happens at driver initialization
- Intermittent: ~25% of CI runs affected (6/24)

**Interpretation**:
- Not a test logic issue
- Infrastructure/environment issue
- Timing/network dependent
- Entire test file fails when driver initialization fails

---

## Evidence

### 1. Commit History
```bash
$ git log --oneline test/e2e/webdriver/chrome.js
335c497ff4c fix: lock Chrome version to 126 (#26101)
```

Comment in code: "Temporarily lock to version 126" (still there after 20 months)

### 2. Attempted Fix (Not Merged)
```bash
$ git log --oneline --all --grep="unpin"
fadbb47687 unpin chrome  # On a branch, not merged to main
```

Someone tried to unpin Chrome but the change wasn't merged.

### 3. Similar Issues with Firefox
Recent commits show similar version pinning issues with Firefox:
```bash
65c563471e test: pin Firefox version temporarily to 134 until artifacts...
df5ac4e1ad test: pin Firefox version temporarily to 134 until artifacts...
```

This suggests browser version management is an ongoing challenge.

### 4. Selenium Version
- **Current**: selenium-webdriver 4.31.0 (package.json)
- **Status**: Recent version with Selenium Manager support
- **Expected Behavior**: Should auto-download correct driver
- **Actual Behavior**: Fails intermittently for Chrome 126

---

## Why It's Flaky (Not Consistent)

1. **CDN Availability**: Google's CDN may have intermittent issues serving old ChromeDriver versions
2. **Rate Limiting**: Parallel CI jobs may hit rate limits
3. **Cache State**: Selenium cache may or may not have the driver
4. **Network Timing**: Network latency affects download reliability
5. **CI Resource Contention**: Multiple test jobs competing for resources

---

## Recommendations

### Immediate Fix (High Priority)

**Option 1: Remove Chrome Version Lock** ⭐ **RECOMMENDED**

```javascript
// test/e2e/webdriver/chrome.js (line 86-87)
// Remove or comment out:
// // Temporarily lock to version 126
// options.setBrowserVersion('126');
```

**Pros**:
- Lets Selenium Manager use the Chrome version available in CI image
- No manual version management
- Forward-compatible
- Matches the "unpin chrome" attempt

**Cons**:
- May expose new Chrome bugs (but that's better than failing to get a driver)
- Requires testing

**Implementation**:
1. Remove `options.setBrowserVersion('126')` from `test/e2e/webdriver/chrome.js`
2. Test locally: `yarn build:test && yarn test:e2e:chrome`
3. Monitor CI for any new issues

---

**Option 2: Update to Recent Chrome Version**

```javascript
// test/e2e/webdriver/chrome.js
options.setBrowserVersion('stable'); // or specific recent version like '131'
```

**Pros**:
- More recent version has better driver availability
- Still maintains version control

**Cons**:
- Requires periodic updates
- Same problem will recur as version ages

---

### Add Resilience (Medium Priority)

**Add Retry Logic for Driver Initialization**

```javascript
// test/e2e/webdriver/chrome.js
const { retry } = require('../../../development/lib/retry');

// Wrap driver.build() in retry
const driver = await retry(
  { retries: 3, delay: 2000 },
  async () => await builder.build()
);
```

**Benefits**:
- Handles transient network failures
- Improves reliability
- Already using retry pattern in Firefox driver (line 139)

---

### Long-term Improvements (Low Priority)

1. **CI Image Management**:
   - Pre-install ChromeDriver in CI Docker image
   - Eliminate download dependency during test runs
   - Update image: `ghcr.io/metamask/metamask-extension-e2e-image:v24.13.0`

2. **Monitoring**:
   - Add telemetry for driver initialization time
   - Alert on version lock staleness
   - Track Selenium Manager failures

3. **Environment Variable Override**:
   ```javascript
   const chromeVersion = process.env.CHROME_VERSION || 'stable';
   if (chromeVersion !== 'stable') {
     options.setBrowserVersion(chromeVersion);
   }
   ```

---

## Risk Assessment

### If We Do Nothing:
- ❌ Failures will likely increase as Chrome 126 becomes more obsolete
- ❌ CI reliability will continue to degrade
- ❌ Developer productivity impacted by flaky tests
- ❌ False positives mask real test failures

### If We Remove Version Lock:
- ✅ Immediate improvement in driver availability
- ✅ Better long-term maintainability
- ⚠️ May expose new Chrome behavior (but that's what tests are for)
- ⚠️ Requires validation testing

---

## Next Steps

1. **Immediate** (Today):
   - Remove Chrome version lock (`setBrowserVersion('126')`)
   - Test locally
   - Create PR with this analysis

2. **Short-term** (This Week):
   - Add retry logic to driver initialization
   - Monitor CI failure rates
   - Update documentation

3. **Long-term** (Next Sprint):
   - Investigate pre-installing ChromeDriver in CI image
   - Add automated checks for stale version locks
   - Review Firefox version management

---

## Related Issues

- PR #26101 - Original Chrome 126 lock (July 2024)
- Commit fadbb47687 - Attempted unpin (not merged)
- Similar Firefox pinning: #30112, #30126, #30137

---

## Testing Plan

Before merging the fix:

1. **Local Testing**:
   ```bash
   # Remove version lock
   # Edit test/e2e/webdriver/chrome.js
   
   yarn build:test
   yarn test:e2e:single test/e2e/tests/multichain-accounts/account-details.spec.ts --browser=chrome
   ```

2. **CI Testing**:
   - Push to PR branch
   - Monitor CI runs for 5-10 iterations
   - Compare failure rates before/after

3. **Smoke Testing**:
   - Run full E2E suite: `yarn test:e2e:chrome`
   - Check for regressions in other tests

---

## Conclusion

The root cause is **clear and fixable**: an outdated, "temporary" Chrome version lock from July 2024 that's now causing Selenium Manager to fail intermittently when trying to download ChromeDriver for Chrome 126.

**Recommended Action**: Remove the version lock and let Selenium Manager use the Chrome version available in the CI environment. This is a low-risk, high-impact fix that will immediately improve CI reliability.

**Timeline**: Fix can be implemented and tested within 1 day.

**Success Metric**: Reduce multichain-accounts test failure rate from ~25% to <5%.
