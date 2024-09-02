// currently only used in webpack build.

import 'ses';
// lockdown() is called in lockdown-run.js

console.trace('lockdown-install.js should no longer be used under webpack');
export {};
