
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
* [Sensitive-release](https://github.com/restarian/metamask-extension/blob/develop/docs/sensitive-release.md)
* **State dump**
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
# How to take a State Dump

Sometimes a UI bug is hard to reproduce, but we'd like to rapidly develop against the application state that caused the bug.

In this case, a MetaMask developer will sometimes ask a user with a bug to perform a "state dump", so we can use some internal tools to reproduce and fix the bug.

To take a state dump, follow these steps:

1. Get the MetaMask popup to the point where it shows the bug (the developer will probably specify exactly where).
2. Right click on the extension popup UI, and in the menu, click "Inspect". This will open the developer tools.
3. In case it isn't already selected, click the "Console" tab in the new Developer Tools window.
4. In the console, type this command exactly: `logState()`. This should print a bunch of JSON text into your console.
5. Copy that printed JSON text
6. *Optional*: Anonymize that text if you'd like (you may change all instances of an account address to another valid account address, for example) We may automate the anonymization in the future.
7. Send that JSON text to the developer, ideally pasting it in the issue regarding the bug.
