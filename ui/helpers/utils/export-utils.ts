export const ExportableContentType = {
  JSON: 'application/json',
  TXT: 'text/plain',
} as const;

export type ExportableContentType =
  (typeof ExportableContentType)[keyof typeof ExportableContentType];

const ExtensionForContentType: Record<ExportableContentType, string> = {
  [ExportableContentType.JSON]: '.json',
  [ExportableContentType.TXT]: '.txt',
};

/**
 * A view of `window` that includes the File System Access API, which is not
 * part of the DOM lib bundled with our TypeScript config.
 */
type FilePickerWindow = Window & {
  showSaveFilePicker: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: unknown) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

/**
 * Export data as a file.
 *
 * @param filename - The name of the file to export.
 * @param data - The data to export.
 * @param contentType - The content type of the file to export.
 */
export async function exportAsFile(
  filename: string,
  data: string,
  contentType: ExportableContentType,
): Promise<void> {
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
 */
function supportsShowSaveFilePicker(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as FilePickerWindow).showSaveFilePicker !==
      'undefined' &&
    typeof window.Blob !== 'undefined'
  );
}

/**
 * Saves a file using the File System Access API.
 *
 * @param filename - The name of the file to export.
 * @param data - The data to export.
 * @param contentType - The content type of the file to export.
 */
async function saveFileUsingFilePicker(
  filename: string,
  data: string,
  contentType: ExportableContentType,
): Promise<void> {
  const blob = new window.Blob([data], { type: contentType });
  const fileExtension = ExtensionForContentType[contentType];

  const handle = await (
    window as unknown as FilePickerWindow
  ).showSaveFilePicker({
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
 * @param filename - The name of the file to export.
 * @param data - The data to export.
 * @param contentType - The content type of the file to export.
 */
function saveFileUsingDataUri(
  filename: string,
  data: string,
  contentType: ExportableContentType,
): void {
  const b64 = Buffer.from(data, 'utf8').toString('base64');
  const elem = document.createElement('a');
  elem.href = `data:${contentType};Base64,${b64}`;
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
}
