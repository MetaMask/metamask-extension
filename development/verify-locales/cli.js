/**
 * Parse command line arguments
 * @returns {Object} Parsed CLI options
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    fix: false,
    quiet: false,
    locale: null,
    only: [],
    skip: [],
  };

  for (const arg of args) {
    if (arg === '--fix') {
      options.fix = true;
    } else if (arg === '--quiet') {
      options.quiet = true;
    } else if (arg.startsWith('--only=')) {
      options.only = arg.substring(7).split(',').filter(Boolean);
    } else if (arg.startsWith('--skip=')) {
      options.skip = arg.substring(7).split(',').filter(Boolean);
    } else if (!arg.startsWith('--')) {
      options.locale = arg;
    }
  }

  return options;
}

module.exports = {
  parseArgs,
};
