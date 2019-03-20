# Sensitive Release Protocol

In the case that a new change is so dramatic that it is hard to anticipate all of the potential side-effects, here is a protocol for rolling out these sensitive changes in a way that:

- Minimizes adverse impact on end users.
- Maximizes our responsiveness to these changes.

## Protocol Steps

1. Prepare a normal release.
2. Prepare a rollback release.
3. Roll the normal release out.
4. In case of emergency, roll back.

### Normal Release

Simply follow the steps in [the publishing guide](./publishing.md).

### Prepare Rollback Release

1. Be on the new risky version branch.
2. Run `npm run rollback $ROLLBACK_TARGET_VERSION`.

The rollback version will now be a branch and tag on the origin.

### Roll the normal release out

Ensure the rollback release has been built, and downloaded locally, fully ready to deploy with immediacy.

For a sensitive release, initially roll out to only 1% of Chrome users (since Chrome allows incremental rollout).

Monitor Sentry for any recognizable error logs.

Gradually increase the rollout percentage.

### In case of Emergency

If a problem is detected, publish the roll-back release to 100% of users, identify the issue, fix it, and repeat this process with a new release.

## Summary

This protocol is a worst-case scenario, just a way to be incredibly careful about our most sensitive possible changes.

