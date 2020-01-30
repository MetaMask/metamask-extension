# Form Persisting Architecture

Since:
 - The popup is torn down completely on every click outside of it.
 - We have forms with multiple fields (like passwords & seed phrases) that might encourage a user to leave our panel to refer to a password manager.

 We cause user friction when we lose the contents of certain forms.

 This calls for an architecture of a form component that can completely persist its values to LocalStorage on every relevant change, and restore those values on reopening.

 To achieve this, we have defined a class, a subclass of `React.Component`, called `PersistentForm`, and it's stored at `ui/lib/persistent-form.js`.

To use this class, simply take your form component (the component that renders `input`, `select`, or `textarea` elements), and make it subclass from `PersistentForm` instead of `React.Component`.

You can see an example of this in use in `ui/app/first-time/restore-vault.js`.

Additionally, any field whose value should be persisted, should have a `persistentFormId` attribute, which needs to be assigned under a `dataset` key on the main `attributes` hash.  For example:

```javascript
  return h('textarea.twelve-word-phrase.letter-spacey', {
    dataset: {
      persistentFormId: 'wallet-seed',
    },
  })
```

That's it! This field should be persisted to `localStorage` on each `keyUp`, those values should be restored on view load, and the cached values should be cleared when navigating deliberately away from the form.

