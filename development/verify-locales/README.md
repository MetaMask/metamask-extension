# Locale Verification Script

This directory contains the refactored locale verification system for MetaMask.

## Structure

```
verify-locales/
├── index.js                      # Main orchestrator/entry point
├── cli.js                        # CLI argument parsing
├── validators/
│   ├── sentence-case.js          # Sentence case validation
│   ├── en-gb-sync.js             # en_GB comparison with en
│   ├── unused-messages.js        # Unused message detection
│   ├── missing-descriptions.js   # Description validation
│   ├── extra-items.js            # Extra items in non-English locales
│   └── template-usage.js         # Template usage checking
├── utils/
│   ├── exceptions.js             # Exception regex builder
│   └── case-conversion.js        # Sentence case conversion
└── README.md
```

## Usage

Run the script from the project root:

```bash
# Verify all locales
yarn verify-locales

# Verify specific locale
yarn verify-locales en
yarn verify-locales fr

# Auto-fix issues
yarn verify-locales --fix

# Quiet mode (less verbose)
yarn verify-locales --quiet

# Run specific validators only
yarn verify-locales --only=sentence-case,en-gb-sync

# Skip specific validators
yarn verify-locales --skip=template-usage
```

## Available Validators

### English Locale Validators

- **`sentence-case`**: Checks that messages follow sentence case rules (not Title Case)
- **`unused-messages`**: Finds message keys that aren't used in the codebase
- **`template-usage`**: Detects forbidden use of template strings in `t()` function

### Non-English Locale Validators

- **`extra-items`**: Finds items in locale that don't exist in English
- **`missing-descriptions`**: Checks that all descriptions from English are present

### Special Validators

- **`en-gb-sync`**: Ensures `en_GB` locale is identical to `en` (compliance requirement)

## Adding a New Validator

1. Create a new file in `validators/` directory:

```javascript
// validators/my-validator.js
const log = require('loglevel');

async function validate(locale, options = {}) {
  const violations = [];

  // Your validation logic here

  return {
    passed: violations.length === 0,
    violations,
    count: violations.length,
  };
}

async function fix(locale, options = {}) {
  // Optional: Auto-fix logic
  const newLocale = { ...locale };

  // Apply fixes...

  return newLocale;
}

function report(results, options = {}) {
  // Optional: Custom reporting
  if (results.violations.length) {
    log.info(`Found ${results.count} issues`);
  }
}

module.exports = {
  name: 'my-validator',
  validate,
  fix, // Optional
  report, // Optional
  englishOnly: false, // Set to true if only for English
  nonEnglishOnly: false, // Set to true if only for non-English
};
```

2. Import and register in `index.js`:

```javascript
const myValidator = require('./validators/my-validator');

// Add to appropriate validator array
const validators = [
  unusedMessagesValidator,
  templateUsageValidator,
  sentenceCaseValidator,
  myValidator, // Add here
];
```

3. Update the documentation in the main wrapper file and this README.

## Validator Interface

Each validator exports an object with:

- **`name`** (required): String identifier for the validator
- **`validate(locale, options)`** (required): Async function that returns validation results
  - `locale`: The locale object being validated
  - `options`: CLI options plus additional context (e.g., `code`, `englishLocale`)
  - Returns: `{ passed: boolean, ...(any other data) }`
- **`fix(locale, options)`** (optional): Async function to auto-fix violations
  - Returns: Fixed locale object
- **`report(results, options)`** (optional): Custom reporting function
- **`englishOnly`** (optional): Boolean, if true only runs on English locale
- **`nonEnglishOnly`** (optional): Boolean, if true skips English locale
- **`runsOnce`** (optional): Boolean, for special validators that run independently

## Benefits of This Architecture

✅ **Modular**: Each validator is self-contained and independently testable
✅ **Extensible**: Easy to add or remove validators
✅ **Configurable**: Can run subsets of validators using `--only` or `--skip`
✅ **Maintainable**: Clear separation of concerns
✅ **Reusable**: Validators can be used in other scripts or CI/CD pipelines

## Backward Compatibility

The original `development/verify-locale-strings.js` file is now a thin wrapper that delegates to this refactored implementation, ensuring all existing workflows continue to work.
