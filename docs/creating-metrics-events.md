
---
### MetaMask Browser help pages
* [QA Guide](https://github.com/restarian/metamask-extension/blob/develop/docs/QA_Guide.md)
* [USER AGREEMENT](https://github.com/restarian/metamask-extension/blob/develop/docs/USER_AGREEMENT.md)
* [Add-to-chrome](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-chrome.md)
* [Add-to-firefox](https://github.com/restarian/metamask-extension/blob/develop/docs/add-to-firefox.md)
* [Adding-new-networks](https://github.com/restarian/metamask-extension/blob/develop/docs/adding-new-networks.md)
* [Bumping version](https://github.com/restarian/metamask-extension/blob/develop/docs/bumping_version.md)
* **Creating-metrics-events**
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
* Contributing
  * [MISSION](https://github.com/restarian/metamask-extension/blob/develop/docs/contributing/MISSION.md)
* Specification
  * [CHANGELOG](https://github.com/restarian/metamask-extension/blob/develop/docs/specification/CHANGELOG.md)
  * [Package information](https://github.com/restarian/metamask-extension/blob/develop/docs/specification/package_information.md)
## Creating Metrics Events

The `metricsEvent` method is made available to all components via context. This is done in `metamask-extension/ui/app/helpers/higher-order-components/metametrics/metametrics.provider.js`. As such, it can be called in all components by first adding it to the context proptypes:

```
static contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}
```

and then accessing it on `this.context`.

Below is an example of a metrics event call:

```
this.context.metricsEvent({
  eventOpts: {
    category: 'Navigation',
    action: 'Main Menu',
    name: 'Switched Account',
  },
})
```

### Base Schema

Every `metricsEvent` call is passed an object that must have an `eventOpts` property. This property is an object that itself must have three properties:
- category: categorizes events according to the schema we have set up in our matomo.org instance
- action: usually describes the page on which the event takes place, or sometimes a significant subsections of a page
- name: a very specific descriptor of the event

### Implicit properties

All metrics events send the following data when called:
- network
- environmentType
- activeCurrency
- accountType
- numberOfTokens
- numberOfAccounts

These are added to the metrics event via the metametrics provider.

### Custom Variables

Metrics events can include custom variables. These are included within the `customVariables` property that is a first-level property within first param passed to `metricsEvent`.

For example:
```
this.context.metricsEvent({
  eventOpts: {
    category: 'Settings',
    action: 'Custom RPC',
    name: 'Error',
  },
  customVariables: {
    networkId: newRpc,
    chainId,
  },
})
```

Custom variables can have custom property names and values can be strings or numbers.

**To include a custom variable, there are a set of necessary steps you must take.**

1. First you must declare a constant equal to the desired name of the custom variable property in `metamask-extension/ui/app/helpers/utils/metametrics.util.js` under `//Custom Variable Declarations`
1. Then you must add that name to the `customVariableNameIdMap` declaration
    1. The id must be between 1 and 5
    1. There can be no more than 5 custom variables assigned ids on a given url
