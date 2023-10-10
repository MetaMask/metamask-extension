module.exports = {
  displayName: {
    name: 'Fuzzing',
    color: 'red',
  },
  testMatch: ['<rootDir>/**/*.fuzz.test.js'],
  testRunner: '@jazzer.js/jest-runner',
  testTimeout: 3000,
};
