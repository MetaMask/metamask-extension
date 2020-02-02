
---
### MetaMask Browser help pages
* [CHANGELOG](https://github.com/restarian/metamask-extension/blob/develop/docs/CHANGELOG.md)
* [MISSION](https://github.com/restarian/metamask-extension/blob/develop/docs/MISSION.md)
* [QA Guide](https://github.com/restarian/metamask-extension/blob/develop/docs/QA_Guide.md)
* [README](https://github.com/restarian/metamask-extension/blob/develop/docs/README.md)
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
* [State dump](https://github.com/restarian/metamask-extension/blob/develop/docs/state_dump.md)
* [Synopsis](https://github.com/restarian/metamask-extension/blob/develop/docs/synopsis.md)
* [Translating-guide](https://github.com/restarian/metamask-extension/blob/develop/docs/translating-guide.md)
* **Trezor-emulator**
* Components
  * [Account-menu](https://github.com/restarian/metamask-extension/blob/develop/docs/components/account-menu.md)
# Using the TREZOR simulator

You can install the TREZOR emulator and use it with Metamask. 
Here is how:

## 1 - Install the TREZOR Bridge

Download the corresponding bridge for your platform from [this url](https://wallet.trezor.io/data/bridge/latest/index.html)

## 2 - Download and build the simulator

Follow this instructions: https://github.com/trezor/trezor-core/blob/master/docs/build.md

## 3 - Restart the bridge with emulator support (Mac OSx instructions)

`
    # stop any existing instance of trezord
    killall trezord

    # start the bridge for the simulator
    /Applications/Utilities/TREZOR\ Bridge/trezord -e 21324 >> /dev/null 2>&1 &

    # launch the emulator
    ~/trezor-core/emu.sh
`
