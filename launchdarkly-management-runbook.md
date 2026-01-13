# LaunchDarkly Feature Flag Management Runbook

## Overview

This runbook outlines best practices for managing LaunchDarkly (LD) feature flags across different release stages (DEV, EXP, RC, PROD) to ensure proper traceability, easier rollbacks, and clear promotion paths.

## Problem Statement

### Current Issues

- **No traceability**: LaunchDarkly only tracks default variation changes, making it difficult to understand flag history
- **Hard rollbacks**: Without proper versioning, rolling back to previous flag states is challenging
- **Unclear promotion path**: It's difficult to determine which variation should be promoted at each stage of the release cycle

### Context

- Release pipeline exists but team has no direct access
- Need a systematic approach to manage flags across environments

## Solution: Multi-Environment Flag Management

### Flag Structure

Maintain separate flag variations for each environment:

- **DEV**: Development environment flags
- **EXP**: Experimental/main branch flags
- **RC**: Release Candidate flags
- **PROD**: Production flags

## Procedures

### DEV Environment

**When to create/update:**

- Create a new flag variation when feature development starts
- Update as needed during active development

**Best practices:**

- Use descriptive flag names that indicate the feature being developed
- Document the feature in the flag description
- Keep DEV flags isolated from other environments

---

### EXP (Experimental) Environment

**When to update:**

1. **When feature is merged to main:**
   - Copy the specific flags from DEV
   - Add feature name to the flag description
   - Update EXP variation with merged feature flags

2. **When RC (1) is cut:**
   - Update the description with the next RC version (e.g., "RC 2") to indicate that future updates will go into version 2
   - Remove features that were included in RC 1 from the description
   - This keeps EXP clean and ready for the next release cycle

**Best practices:**

- EXP should always reflect the current state of the main branch
- Use descriptions to track which features are included
- Update descriptions when RCs are cut to maintain clarity

---

### RC (Release Candidate) Environment

**When to create/update:**

- **When RC is cut:** Copy EXP to a new variation
- Label this variation with the RC version number (e.g., "RC 1.0.0")
- Include new features in the description (can copy from EXP)
- **Critical:** This variation should NOT be changed until the previous release has been validated

**Best practices:**

- Create a new RC variation for each RC release
- Use clear version labeling (e.g., "RC 1.0.0", "RC 1.1.0")
- Document all features included in the RC in the description
- Freeze RC variations once created - only modify if critical fixes are needed

---

### PROD (Production) Environment

**When to update:**

- **After store submission and during partial rollout:** Change default variation to RC flags
- This results in 1 new variation per production release
- Used in production and should only be modified if production needs to be fixed

**Handling new production variations:**

- **Important:** Creating a new PROD variation will modify previous clients' LD flags
- **Solution:** If a feature is only partially done, add a `minimumVersion` constraint so older versions are not affected
- This ensures backward compatibility and prevents unintended flag changes for older app versions

**Cleanup:**

- Delete old variations when they are no longer used in production
- This keeps the flag list manageable and reduces confusion

---

## Workflow Summary

```
Feature Development
    ↓
DEV: Create/update flags during development
    ↓
Feature Merged to Main
    ↓
EXP: Copy flags from DEV, add to description
    ↓
RC Cut
    ↓
RC: Copy EXP to new variation, label with version
    ↓
Store Submission & Partial Rollout
    ↓
PROD: Change default variation to RC flags
    ↓
Old Variations: Delete when no longer in use
```

## Best Practices for Better History

### Flag Descriptions

- Always include feature names in descriptions
- Document which release version includes the feature
- Update descriptions when promoting between environments
- Remove completed features from descriptions when they move to the next stage

### Version Labeling

- Use consistent version numbering (e.g., "RC 1.0.0", "PROD 1.0.0")
- Include version numbers in variation names or descriptions
- Make it clear which environment each variation represents

### Minimum Version Constraints

- Use `minimumVersion` for features that are only partially implemented
- This prevents older app versions from receiving incompatible flag states
- Document minimum version requirements in flag descriptions

### Documentation

- Keep flag descriptions up-to-date with current state
- Document promotion decisions and rationale
- Note any special considerations (e.g., partial rollouts, backward compatibility)

## Benefits

- **Manageable number of flags**: Clear structure prevents flag proliferation
- **Better traceability**: Each environment has its own variation with documented history
- **Easier rollbacks**: Previous variations are preserved and can be referenced
- **Clear promotion path**: Obvious progression from DEV → EXP → RC → PROD
- **Version control**: RC and PROD variations are labeled and frozen, making it clear what's in each release

## Troubleshooting

### Issue: Need to rollback production flags

**Solution:**

- Reference the previous PROD variation
- Change default variation back to the previous PROD variation
- Document the rollback reason in the flag description

### Issue: Feature needs to be added to an already-cut RC

**Solution:**

- Evaluate if it's critical enough to modify the RC variation
- If yes, update the RC variation and document the change
- If no, wait for the next RC cycle

### Issue: Older app versions receiving incompatible flags

**Solution:**

- Add `minimumVersion` constraint to the flag
- This ensures only compatible app versions receive the flag state

### Issue: Too many flag variations

**Solution:**

- Regularly audit and delete old variations that are no longer in use
- Keep only active variations (current DEV, EXP, RC, PROD)
- Archive or delete variations from completed releases

## Related Documentation

- LaunchDarkly Documentation: [Link to LD docs if available]
- Release Pipeline: [Link to release process docs if available]
- Feature Flag Guidelines: [Link to additional flag guidelines if available]

## Review and Updates

This runbook should be reviewed and updated:

- When the release process changes
- When new environments are added
- When issues are discovered with the current process
- Quarterly to ensure it remains current

---

**Last Updated:** [Date]
**Maintained by:** [Team/Individual]

dev -> exp
exp -> rc
rc -> prod

beta-dev -> beta
