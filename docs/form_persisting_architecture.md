# Form Persisting Architecture

Since:
 - The popup is torn down completely on every click outside of it.
 - We have forms with multiple fields (like passwords & seed phrases) that might encourage a user to leave our panel to refer to a password manager.

 We cause user friction when we lose the contents of certain forms.

 This calls for an architecture of a form component that can completely persist its values to LocalStorage on every relevant change, and restore those values on reopening.

Whenever this class is loaded, it registers an `onChange` listener. On those events, it checks the target for a special ID attribute it listens for.

Let's say we call our class `PersistentForm`. So then we might check for a `persistent-form-id` on change.

The parent element will define a special attribute, let's say `persistent-form-parent-id`.

Here's some pseudo-code for it:
```
onChange(ev) =>
  persisted = localStorage[parentKey]
  persisted[childKey] = ev.value
  localStorage[parentKey] = persisted
```

On startup, we just do the inverse:

```
onStart() =>
  el = this.getEl()
  parentKey = el.attr('persistent-form-parent-id')
  children = el.children.where('[persistent-form-id]')
  children.each(loadValue)
```


