# Secret Preferences

Sometimes we want to test a feature in the wild that may not be ready for public consumption.

One example is our "sync with mobile" feature, which didn't make sense to roll out before the mobile version was live.

To enable features like this, first open the background console, and then you can use the global method `global.setPreference(key, value)`.

For example, if the feature flag was a boolean was called `useNativeCurrencyAsPrimaryCurrency`, you might type `setPreference('useNativeCurrencyAsPrimaryCurrency', true)`.

