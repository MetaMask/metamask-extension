/**
 * The distribution this build is intended for.
 *
 * This should be kept in-sync with the `BuildType` map in `shared/constants/app.js`.
 */
const BuildType = {
  beta: 'beta',
  desktop: 'desktop',
  flask: 'flask',
  main: 'main',
  mmi: 'mmi',
};

const BuildTypeInheritance = {
  [BuildType.desktop]: [BuildType.flask],
};

module.exports = { BuildType, BuildTypeInheritance };
