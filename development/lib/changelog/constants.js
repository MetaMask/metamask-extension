/**
 * Version string
 * @typedef {string} Version - A [SemVer]{@link https://semver.org/spec/v2.0.0.html}-
 *   compatible version string.
 */

/**
 * Change categories.
 *
 * Most of these categories are from [Keep a Changelog]{@link https://keepachangelog.com/en/1.0.0/}.
 * The "Uncategorized" category was added because we have many changes from
 * older releases that would be difficult to categorize.
 *
 * @typedef {Record<string, string>} ChangeCategories
 * @property {'Added'} Added - for new features.
 * @property {'Changed'} Changed - for changes in existing functionality.
 * @property {'Deprecated'} Deprecated - for soon-to-be removed features.
 * @property {'Fixed'} Fixed - for any bug fixes.
 * @property {'Removed'} Removed - for now removed features.
 * @property {'Security'} Security - in case of vulnerabilities.
 * @property {'Uncategorized'} Uncategorized - for any changes that have not
 *   yet been categorized.
 */

/**
 * @type {ChangeCategories}
 */
const changeCategories = {
  Added: 'Added',
  Changed: 'Changed',
  Deprecated: 'Deprecated',
  Fixed: 'Fixed',
  Removed: 'Removed',
  Security: 'Security',
  Uncategorized: 'Uncategorized',
};

/**
 * Change categories in the order in which they should be listed in the
 * changelog.
 *
 * @type {Array<keyof ChangeCategories>}
 */
const orderedChangeCategories = [
  'Uncategorized',
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
];

/**
 * The header for the section of the changelog listing unreleased changes.
 * @typedef {'Unreleased'} Unreleased
 */

/**
 * @type {Unreleased}
 */
const unreleased = 'Unreleased';

module.exports = {
  changeCategories,
  orderedChangeCategories,
  unreleased,
};
