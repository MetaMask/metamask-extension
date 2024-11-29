# MetaMask Translation Guide

The MetaMask browser extension supports new translations added in the form of new locales files added in `app/_locales`.

- [The MDN Guide to Internationalizing Extensions](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Internationalization)

## Adding a new Language

- Each supported language is represented by a folder in `app/_locales` whose name is that language's subtag (example: `app/_locales/es/`). (look up a language subtag using the [r12a "Find" tool](https://r12a.github.io/app-subtags/) or this [wikipedia list](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)).
- Inside that folder there should be a `messages.json`.
- An easy way to start your translation is to first **make a copy** of `app/_locales/en/messages.json` (the English translation), and then **translate the `message` key** for each in-app message.
- **The `description` key** is just to add context for what the translation is about, it **does not need to be translated**.
- Add the language to the [locales index](https://github.com/MetaMask/metamask-extension/blob/s/app/_locales/index.json) `app/_locales/index.json`


That's it! When MetaMask is loaded on a computer with that language set as the system language, they will see your translation instead of the default one.

## Testing

To automatically see if you are missing any phrases to translate, we have a script you can run (if you know how to use the command line). The script is:

```
node development/verify-locale-strings.js $YOUR_LOCALE
```

Where `$YOUR_LOCALE` is your locale string (example: `es`), i.e. the name of your language folder.

To verify that your translation works in the app, you will need to [build a local copy](https://github.com/MetaMask/metamask-extension#building-locally) of MetaMask. You will need to change your browser language, your operating system language, and restart your browser (sorry it's so much work!).
