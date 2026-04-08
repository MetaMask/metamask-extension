# Internationalization Checklist

Follow this checklist when adding or updating translations in MetaMask Extension.

- **Add new locale files**: Create a copy of `en.json` under `locales/<lang>.json`.
- **Translate all keys**: Ensure every key is translated; leave the English text if no translation exists.
- **Preserve placeholders**: Keep placeholders like `{address}` intact in translated strings.
- **Avoid HTML in strings**: Use plain text; wrap formatting in JSX when displaying.
- **Run l10n scripts**: Execute `yarn i18n:validate` to detect missing or unused keys.
- **Test the UI**: Switch Chrome’s language or use the i18n debugging tool to verify layout and truncation.

Consistent translations improve user experience for non‑English speakers.
