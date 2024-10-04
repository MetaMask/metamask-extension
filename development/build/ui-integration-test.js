const del = require('del');
const { copyGlob, getCopyTargets } = require('./static');
const { buildScssPipeline } = require('./styles');

const mainDest = 'test/integration/config/assets';

async function buildTestUIIntegrationStyles() {
  await buildScssPipeline('ui/css/index.scss', `${mainDest}`);
}

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

async function copyTestUiIntegrationStaticAssets() {
  const [, allCopyTargets] = getCopyTargets();

  const uiIntegrationTestCopyTargets = trimdownCopyTargets(allCopyTargets);

  console.log(
    'Copying UI Integration test static assets...',
    uiIntegrationTestCopyTargets,
  );

  for (const target of uiIntegrationTestCopyTargets) {
    await copyGlob(target.src, `${target.src}`, `${mainDest}/${target.dest}`);
  }
}

async function run() {
  await del([`./${mainDest}/*`]);
  await Promise.all([
    buildTestUIIntegrationStyles(),
    copyTestUiIntegrationStaticAssets(),
  ]).catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  });
}

run();
