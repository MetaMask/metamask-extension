// This file simply registers babel and ts-node so that we may use the same
// ECMAScript features in E2E tests that we use elsewhere in our code. It also
// allows values to be read from TypeScript files.
require('@babel/register');
require('ts-node/register');
