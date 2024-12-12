# Sentry Monitoring and Triage Process

## Context
- **When**: During release rollouts and daily maintenance
- **Who**: Platform team and designated triagers
- **Why**: Early detection of user-impacting issues to maintain release quality

## Todo
- [ ] Document example stack traces and common patterns
- [ ] Process Improvements: Notifying teams using github issues, tags, and Slack
- [ ] Create templates for Slack communications?

## Overview
**Triage** in the context of a release means determining:
1. Is this a new issue? (or version introduced)
2. The team responsible
3. Severity

> **💡 Tip**: Attend Sentry triaging meetings with experienced triagers like Dan Miller and Mark Stacey to learn the process.

## Daily Workflow

### 1. Issue Discovery
- Set up these saved views (replace version number with current release):
  - [New Issues – ALL](https://metamask.sentry.io/issues/?environment=production&project=273505&query=is%3Aunresolved%20issue.priority%3A%5Bhigh%2C%20medium%5D%20firstRelease%3A12.9.0&referrer=issue-list&sort=date&statsPeriod=7d&viewId=72967)
  - [New Issues – UNREVIEWED](https://metamask.sentry.io/issues/?environment=production&project=273505&query=is%3Aunresolved%20issue.priority%3A%5Bhigh%2C%20medium%5D%20firstRelease%3A12.9.0%20is%3Afor_review&referrer=issue-list&sort=freq&statsPeriod=7d&viewId=72967)
- Check 2x/day during rollout (1% will catch most issues)
- **Prioritize**:
  1. High frequency issues
  2. Issues affecting core functionality
  3. Issues marked High priority

### 2. Issue Assessment

#### A. Determine if New Issue
1. **Check Issue Timeline**:
   - When did issue first appear?
   - Use "Similar Issues" tab for duplicate candidates
   - Search for events with same/similar error message

2. **Evaluate Duplicates**:
   - Compare stack traces to confirm similar failure reasons
   - Key indicators in stack trace:
     - Error type and message
     - Function call sequence
     - Line numbers in our codebase
   - If duplicate: merge issues – or at least make a note in Activity + mark issue reviewed

#### B. For New Issues
1. **Investigate Root Cause**:
   - Analyze stack trace:
     - Start from the top - most recent call
     - Look for MetaMask-specific code paths
     - Note any external dependencies involved
   - Review breadcrumb trail for user actions
   - Examine relevant codebase sections

2. **Severity Assessment**:
   - Use [Severity framework](https://www.notion.so/metamask-consensys/MetaMask-Triaging-Framework-53bf8b5377fc4ceaad34177fc6e8740e?pvs=4#58bb29a7e5d54f91ac0fd979cf9b0bb1):
     - **sev0**: rollback release required (e.g., loss of funds, security)
     - **sev1**: release blocker (e.g., core function broken)
     - **sev2**: possible release blocker (significant UX impact)
     - **sev3**: not a release blocker (minor/cosmetic)
   - Release-blocking criteria:
     - Impacts core wallet functionality
     - Affects large user base
     - No viable workaround
     - Fund loss potential

> **⚠️ Note**: If stuck or unsure at any point, escalate to platform team channel

### 3. Team Engagement & Tracking
The goal here is to **track the issue** and **get the relevant team to assess user impact**:

1. Create GitHub issue for tracking
2. Add tags to route to team:
   - `team-XXX` - routes to responsible team
   - `type-bug` - flags as bug
   - `regression-prod-12.X.X` - version introduced
   - `needs-triage` - signals team needs to assess
3. Post to Slack:
   ```
   New Sentry issue in 12.9.0 needs triage:
   - Issue: [link]
   - Impact: [if known]
   - Suspected cause: [if known]
   ```
4. "Mark Reviewed" in Sentry:
   - Moves from NEW → ONGOING
   - Removes from unreviewed queue

### 4. Follow-up
- Monitor team response (chase after 1 business day)
- Update GitHub issue with findings
- For release blockers:
  - Ensure fix is prioritized
  - Track progress in release channel
  - Update release manager
