/**
 * @enum { string }
 */
export const ExportableContentType = {
  JSON: 'application/json',
  TXT: 'text/plain',
};

/**
 * @enum { string }
 */
const ExtensionForContentType = {
  [ExportableContentType.JSON]: '.json',
  [ExportableContentType.TXT]: '.txt',
};

/**
 * Export data as a file.
 *
 * @param {string} filename - The name of the file to export.
 * @param {string} data - The data to export.
 * @param {ExportableContentType} contentType - The content type of the file to export.
 */
export async function exportAsFile(filename, data, contentType) {
  if (!ExtensionForContentType[contentType]) {
    throw new Error(`Unsupported file type: ${contentType}`);
  }

  if (supportsShowSaveFilePicker()) {
    // Preferred method for downloads
    await saveFileUsingFilePicker(filename, data, contentType);
  } else {
    saveFileUsingDataUri(filename, data, contentType);
  }
}
/**
 * Notes if the browser supports the File System Access API.
 *
 * @returns {boolean}
 */
function supportsShowSaveFilePicker() {
  return (
    typeof window !== 'undefined' &&
    typeof window.showSaveFilePicker !== 'undefined' &&
    typeof window.Blob !== 'undefined'
  );
}

/**
 * Saves a file using the File System Access API.
 *
 * @param {string} filename - The name of the file to export.
 * @param {string} data - The data to export.
 * @param {ExportableContentType} contentType - The content type of the file to export.
 * @returns {Promise<void>}
 */
async function saveFileUsingFilePicker(filename, data, contentType) {
  const blob = new window.Blob([data], { contentType });
  const fileExtension = ExtensionForContentType[contentType];

  const handle = await window.showSaveFilePicker({
    suggestedName: filename,
    types: [
      {
        description: filename,
        accept: {
          [contentType]: [fileExtension],
        },
      },
    ],
  });

  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/**
 * Saves a file using a data URI.
 * This is a fallback for browsers that do not support the File System Access API.
 * This method is less preferred because it requires the entire file to be encoded in a data URI.
 *
 * @param {string} filename - The name of the file to export.
 * @param {string} data - The data to export.
 * @param {ExportableContentType} contentType - The content type of the file to export.
 */
function saveFileUsingDataUri(filename, data, contentType) {
  const b64 = Buffer.from(data, 'utf8').toString('base64');
  const elem = document.createElement('a');
  elem.href = `data:${contentType};Base64,${b64}`;
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
}
