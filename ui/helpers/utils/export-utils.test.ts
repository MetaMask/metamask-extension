import { exportAsFile, ExportableContentType } from './export-utils';

describe('exportAsFile', () => {
  let windowSpy;

  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  describe('when showSaveFilePicker is supported', () => {
    it('uses .json file extension when content type is JSON', async () => {
      const showSaveFilePicker = mockShowSaveFilePicker();
      const filename = 'test.json';
      const data = '{file: "content"}';
      windowSpy.mockImplementation(() => ({
        showSaveFilePicker,
        Blob: global.Blob,
      }));

      await exportAsFile(filename, data, ExportableContentType.JSON);

      expect(showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: filename,
        types: [
          {
            description: filename,
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
    });

    it('uses .txt file extension when content type is TXT', async () => {
      const showSaveFilePicker = mockShowSaveFilePicker();
      const filename = 'test.txt';
      const data = 'file content';

      windowSpy.mockImplementation(() => ({
        showSaveFilePicker,
        Blob: global.Blob,
      }));

      await exportAsFile(filename, data, ExportableContentType.TXT);

      expect(showSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: filename,
        types: [
          {
            description: filename,
            accept: { 'text/plain': ['.txt'] },
          },
        ],
      });
    });
  });
});

function mockShowSaveFilePicker() {
  return jest.fn().mockResolvedValueOnce({
    createWritable: jest
      .fn()
      .mockResolvedValueOnce({ write: jest.fn(), close: jest.fn() }),
  });
}
