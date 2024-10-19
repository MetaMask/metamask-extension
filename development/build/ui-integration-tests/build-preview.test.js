const del = require('del');
const { buildScssPipeline } = require('../styles');
const { copyGlob } = require('../static');
const uiIntegrationTest = require('./build-preview');

const mockTargets = [
  { src: 'ui/css/output/file.css', dest: 'css/' },
  { src: 'images/logo.png', dest: 'images/' },
  { src: 'js/main.js', dest: 'scripts/' },
  { src: 'snaps/snap1.js', dest: 'snaps/' },
  { src: './development/file.js', dest: 'dev/' },
];

// Mock the dependencies
jest.mock('../styles', () => ({
  buildScssPipeline: jest.fn(),
}));

jest.mock('../static', () => ({
  copyGlob: jest.fn(),
  getCopyTargets: jest.fn(() => [null, mockTargets]),
}));

jest.mock('del', () => jest.fn());

describe('UI Integration Test Build', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildTestUIIntegrationStyles', () => {
    it('should call buildScssPipeline with correct arguments', async () => {
      await uiIntegrationTest.buildTestUIIntegrationStyles();
      expect(buildScssPipeline).toHaveBeenCalledWith(
        'ui/css/index.scss',
        'test/integration/config/assets',
      );
    });
  });

  describe('trimdownCopyTargets', () => {
    it('should filter out unwanted copy targets', () => {
      const result = uiIntegrationTest.trimdownCopyTargets(mockTargets);
      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({
        src: 'images/logo.png',
        dest: 'images/',
      });
    });
  });

  describe('copyTestUiIntegrationStaticAssets', () => {
    it('should copy filtered assets', async () => {
      await uiIntegrationTest.copyTestUiIntegrationStaticAssets();

      expect(copyGlob).toHaveBeenCalledWith(
        'images/logo.png',
        'images/logo.png',
        'test/integration/config/assets/images/',
      );
    });
  });

  describe('run', () => {
    it('should clean the destination directory and run build tasks', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await uiIntegrationTest.run();

      expect(del).toHaveBeenCalledWith(['./test/integration/config/assets/*']);
      expect(buildScssPipeline).toHaveBeenCalled();
      expect(copyGlob).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      const expectedCalls = [
        'Build UI Integration Test: starting',
        'Build UI Integration Test: completed',
      ];
      expectedCalls.forEach((call) => {
        expect(consoleSpy).toHaveBeenCalledWith(call);
      });
    });

    it('should handle errors and set process.exitCode', async () => {
      const error = new Error('Test error');
      buildScssPipeline.mockRejectedValue(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await uiIntegrationTest.run();

      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack || error);
      expect(process.exitCode).toBe(1);
    });
  });
});
