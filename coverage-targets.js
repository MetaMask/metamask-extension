// Codecov uses a yaml file for its configuration and it targets line coverage.
// To keep our policy in place we have thile file separate from our
// codecov.yml file that specifies coverage targets for each project in the
// codecov.yml file. These targets are read by the test/merge-coverage.js
// script, and the paths from the codecov.yml file are used to figure out which
// subset of files to check against these targets.
module.exports = {
  global: {
    lines: 71.12,
    branches: 58.94,
    statements: 70.58,
    functions: 63.84,
  },
  transforms: {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100,
  },
};
