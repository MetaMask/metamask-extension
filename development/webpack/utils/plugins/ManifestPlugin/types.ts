import type { Browser, Manifest } from '../../helpers';

export type BaseManifestPluginOptions<Zip extends boolean> = {
  /**
   * The browsers to build for.
   */
  browsers: readonly [Browser, ...Browser[]];

  /**
   * An array of strings specifying the paths of additional web-accessible resources.
   */
  web_accessible_resources?: readonly string[];

  /**
   * An integer specifying the version of the manifest file format your package requires
   */
  manifest_version: 2 | 3;

  /**
   * One to four dot-separated integers identifying the version of this extension. A couple of rules apply to the integers:
   *
   * * The integers must be between 0 and 65535, inclusive.
   * * Non-zero integers can't start with 0. For example, 032 is invalid because it begins with a zero.
   * * They must not be all zero. For example, 0 and 0.0.0.0 are invalid while 0.1.0.0 is valid.
   *
   * Here are some examples of valid versions:
   *
   * * "version": "1"
   * * "version": "1.0"
   * * "version": "2.10.2"
   * * "version": "3.1.2.4567"
   *
   * If the published extension has a newer version string than the installed extension, then the extension is automatically updated.
   *
   * The comparison starts with the leftmost integers. Then, if those integers are equal, the integers to the right are compared, and so on. For example, 1.2.0 is a newer version than 1.1.9.9999.
   *
   * A missing integer is equal to zero. For example, 1.1.9.9999 is newer than 1.1, and 1.1.9.9999 is older than 1.2.
   */
  version: string;

  /**
   * A Semantic Versioning-compliant version number for the extension. Not used in Firefox builds since Firefox doesn't currently support it.
   */
  versionName: string;

  /**
   * A plain text string (no HTML or other formatting; no more than 132 characters) that describes the extension.
   *
   * The description should be suitable for both the browser's Extensions page, e.g., chrome://extensions, and extension web stores. You can specify locale-specific strings for this field.
   */
  description: string | null;

  /**
   * Function to transform the manifest file.
   *
   * @param manifest
   * @param browser
   * @returns
   */
  transform?: (manifest: Manifest, browser: Browser) => Manifest;

  /**
   * Whether or not to zip the individual browser builds.
   */
  zip: Zip;
};

export type ZipOptions = {
  /**
   * Options for the zip.
   */
  zipOptions: {
    /**
     * Compression level for compressible assets. 0 is no compression, 9 is maximum compression. 6 is default.
     */
    level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
    /**
     * Modification time for all files in the zip, specified as a UNIX timestamp (milliseconds since 1 January 1970 UTC). This property sets a uniform modification time for the contents of the zip file. Note: Zip files use FAT file timestamps, which have a limited range. Therefore, datetimes before 1980-01-01 (timestamp value of 315532800000) are invalid in standard Zip files, and datetimes on or after 2100-01-01 (timestamp value of 4102444800000) are also invalid. Values must fall within this range.
     */
    mtime: number;
    /**
     * File extensions to exclude from zip; should include the `.`, e.g., [`.map`].
     */
    excludeExtensions: string[];

    /**
     * File path template for zip file relative to webpack output directory. You must include `[browser]` in the file path template, which will be replaced with the browser name. For example, `builds/[browser].zip`.
     */
    outFilePath: string;
  };
};

export type ManifestPluginOptions<Zip extends boolean> =
  BaseManifestPluginOptions<Zip> & (Zip extends true ? ZipOptions : object);
