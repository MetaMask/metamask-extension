# MetaMask Translation Guide

The MetaMask browser extension supports new translations added in the form of new locales files added in `app/_locales`.

- [The MDN Guide to Internationalizing Extensions](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization)

## Adding a new Language

Each supported language is represented by a folder in `app/_locales` whose name is that language's subtag ([look up a language subtag using this tool](https://r12a.github.io/app-subtags/)).

Inside that folder there should be a `messages.json` file that follows the specified format. An easy way to start your translation is to first duplicate `app/_locales/en/messages.json` (the english translation), and then update the `message` key for each in-app message.

That's it! When MetaMask is loaded on a computer with that language set as the system language, they will see your translation instead of the default one.

## Testing

To verify that your translation works, you will need to [build a local copy](https://github.com/MetaMask/metamask-extension#building-locally) of MetaMask.

