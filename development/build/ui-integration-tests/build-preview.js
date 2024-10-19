const del = require('del');
const { copyGlob, getCopyTargets } = require('../static');
const { buildScssPipeline } = require('../styles');

const mainDest = 'test/integration/config/assets';

/**
 * Builds the styles for UI integration tests
 */
async function buildTestUIIntegrationStyles() {
  await buildScssPipeline('ui/css/index.scss', `${mainDest}`);
}

/**
 * Filters the copy targets to exclude unwanted files and directories
 *
 * @param {Array} allCopyTargets - The array of all copy targets to be filtered
 * @returns {Array} Filtered copy targets
 */
function trimdownCopyTargets(allCopyTargets) {
  return allCopyTargets.filter(({ src, dest }) => {
    return !(
      src.includes('ui/css/output') ||
      dest.includes('scripts/') ||
      dest.includes('snaps/') ||
      src.includes('./development')
    );
  });
}

/**
 * Copies static assets for UI integration tests
 */
async function copyTestUiIntegrationStaticAssets() {
  const [, allCopyTargets] = getCopyTargets();

  const uiIntegrationTestCopyTargets = trimdownCopyTargets(allCopyTargets);

  for (const target of uiIntegrationTestCopyTargets) {
    await copyGlob(target.src, `${target.src}`, `${mainDest}/${target.dest}`);
  }
}

/**
 * Runs the UI integration test build process
 */
async function run() {
  try {
    console.log('Build UI Integration Test: starting');
    await del([`./${mainDest}/*`]);
    await Promise.all([
      buildTestUIIntegrationStyles(),
      copyTestUiIntegrationStaticAssets(),
    ]);

    console.log('Build UI Integration Test: completed');
  } catch (error) {
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

module.exports = {
  buildTestUIIntegrationStyles,
  trimdownCopyTargets,
  copyTestUiIntegrationStaticAssets,
  run,
};
