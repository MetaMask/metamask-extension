jest.mock('./icon-64.png', () => 'main-icon.png');
jest.mock('./beta/icon-64.png', () => 'beta-icon.png');
jest.mock('./flask/icon-64.png', () => 'flask-icon.png');

describe('branded icon', () => {
  const originalBuildType = process.env.METAMASK_BUILD_TYPE;

  afterEach(() => {
    if (originalBuildType === undefined) {
      delete process.env.METAMASK_BUILD_TYPE;
    } else {
      process.env.METAMASK_BUILD_TYPE = originalBuildType;
    }
    jest.resetModules();
  });

  for (const [buildType, expectedIcon] of [
    ['main', 'main-icon.png'],
    ['experimental', 'main-icon.png'],
    ['beta', 'beta-icon.png'],
    ['flask', 'flask-icon.png'],
  ]) {
    it(`selects the ${buildType} build icon`, async () => {
      process.env.METAMASK_BUILD_TYPE = buildType;

      const { default: icon } = await import('./icon-64');

      expect(icon).toBe(expectedIcon);
    });
  }
});
