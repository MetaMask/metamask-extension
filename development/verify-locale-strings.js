#!/usr/bin/env node
// //////////////////////////////////////////////////////////////////////////////
//
// Locale verification script
//
// usage:
//
//     node development/verify-locale-strings.js [<locale>] [--fix] [--quiet]
//
// This script will validate that locales have no unused messages. It will check
// the English locale against string literals found under `ui/`, and it will check
// other locales by comparing them to the English locale. It will also validate
// that non-English locales have all descriptions present in the English locale.
//
// A report will be printed to the console detailing any unused messages.
//
// The '--fix' argument will automatically update locales to remove unused
// messages and fix violations.
//
// The '--quiet' argument reduces the verbosity of the output, printing
// just a single summary of results for each locale verified
//
// The '--only=validator1,validator2' argument runs only specific validators
//
// The '--skip=validator1,validator2' argument skips specific validators
//
// Available validators:
// - sentence-case: Check sentence case compliance
// - en-gb-sync: Verify en_GB matches en
// - unused-messages: Find unused message keys
// - template-usage: Check for forbidden template string usage
// - missing-descriptions: Check for missing descriptions
// - extra-items: Check for extra items in non-English locales
//
// //////////////////////////////////////////////////////////////////////////////

// Backward compatibility wrapper - delegates to refactored implementation
require('./verify-locales/index.js');
