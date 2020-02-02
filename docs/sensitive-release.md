
---
### MetaMask Browser help pages
* [QA Guide](https://github.com/restarian/metamask-extension/blob/develop/docs/QA_Guide.md)
* [USER AGREEMENT](https://github.com/restarian/metamask-extension/blob/develop/docs/USER_AGREEMENT.md)
* [Add-to-chrome](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-chrome.md)
* [Add-to-firefox](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-firefox.md)
* [Adding-new-networks](https://github.com/restarian/metamask-extension/blob/develop/docs/adding-new-networks.md)
* [Bumping version](https://github.com/restarian/metamask-extension/blob/develop/docs/bumping_version.md)
* [Creating-metrics-events](https://github.com/restarian/metamask-extension/blob/develop/docs/creating-metrics-events.md)
* [Design-system](https://github.com/restarian/metamask-extension/blob/develop/docs/design-system.md)
* [Developing-on-deps](https://github.com/restarian/metamask-extension/blob/develop/docs/developing-on-deps.md)
* [Limited site access](https://github.com/restarian/metamask-extension/blob/develop/docs/limited_site_access.md)
* [Multi vault planning](https://github.com/restarian/metamask-extension/blob/develop/docs/multi_vault_planning.md)
* [Porting to new environment](https://github.com/restarian/metamask-extension/blob/develop/docs/porting_to_new_environment.md)
* [Publishing](https://github.com/restarian/metamask-extension/blob/develop/docs/publishing.md)
* [Secret-preferences](https://github.com/restarian/metamask-extension/blob/develop/docs/secret-preferences.md)
* [Send-screen-QA-checklist](https://github.com/restarian/metamask-extension/blob/develop/docs/send-screen-QA-checklist.md)
* **Sensitive-release**
* [State dump](https://github.com/restarian/metamask-extension/blob/develop/docs/state_dump.md)
* [Synopsis](https://github.com/restarian/metamask-extension/blob/develop/docs/synopsis.md)
* [Translating-guide](https://github.com/restarian/metamask-extension/blob/develop/docs/translating-guide.md)
* [Trezor-emulator](https://github.com/restarian/metamask-extension/blob/develop/docs/trezor-emulator.md)
* Components
  * [Account-menu](https://github.com/restarian/metamask-extension/blob/develop/docs/components/account-menu.md)
* Contributing
  * [MISSION](https://github.com/restarian/metamask-extension/blob/develop/docs/contributing/MISSION.md)
* Specification
  * [CHANGELOG](https://github.com/restarian/metamask-extension/blob/develop/docs/specification/CHANGELOG.md)
  * [Package information](https://github.com/restarian/metamask-extension/blob/develop/docs/specification/package_information.md)
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

Follow the steps in [the publishing guide](./publishing.md) with a different context:

Instead of creating a version branch off of the main branch, create a version branch off of the latest release. It is customary that this release increments the patch version number.

### Roll the normal release out

Ensure the rollback release has been built, and downloaded locally, fully ready to deploy with immediacy.

For a sensitive release, initially roll out to only 1% of Chrome users (since Chrome allows incremental rollout).

Monitor Sentry for any recognizable error logs.

Gradually increase the rollout percentage.

### In case of Emergency

If a problem is detected, publish the roll-back release to 100% of users, identify the issue, fix it, and repeat this process with a new release.

## Summary

This protocol is a worst-case scenario, just a way to be incredibly careful about our most sensitive possible changes.

