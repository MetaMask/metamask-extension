
---
### MetaMask Browser help pages
* [CHANGELOG](https://github.com/restarian/metamask-extension/blob/develop/docs/CHANGELOG.md)
* [MISSION](https://github.com/restarian/metamask-extension/blob/develop/docs/MISSION.md)
* [QA Guide](https://github.com/restarian/metamask-extension/blob/develop/docs/QA_Guide.md)
* [README](https://github.com/restarian/metamask-extension/blob/develop/docs/README.md)
* [USER AGREEMENT](https://github.com/restarian/metamask-extension/blob/develop/docs/USER_AGREEMENT.md)
* [Add-to-chrome](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-chrome.md)
* [Add-to-firefox](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-firefox.md)
* **Adding-new-networks**
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
* [State dump](https://github.com/restarian/metamask-extension/blob/develop/docs/state_dump.md)
* [Synopsis](https://github.com/restarian/metamask-extension/blob/develop/docs/synopsis.md)
* [Translating-guide](https://github.com/restarian/metamask-extension/blob/develop/docs/translating-guide.md)
* [Trezor-emulator](https://github.com/restarian/metamask-extension/blob/develop/docs/trezor-emulator.md)
* Components
  * [Account-menu](https://github.com/restarian/metamask-extension/blob/develop/docs/components/account-menu.md)
## Adding Custom Networks

To add another network to our dropdown menu, make sure the following files are adjusted properly:

```
app/scripts/config.js
app/scripts/lib/buy-eth-url.js
ui/app/index.js
ui/app/components/buy-button-subview.js
ui/app/components/drop-menu-item.js
ui/app/components/network.js
ui/app/components/transaction-list-item.js
ui/app/config.js
ui/app/css/lib.css
ui/lib/account-link.js
ui/lib/explorer-link.js
```

You will need:
+ The network ID
+ An RPC Endpoint url
+ An explorer link
+ CSS for the display icon

