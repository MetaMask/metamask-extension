import type { JSONSchema7 } from 'schema-utils/declarations/validate';
export const schema: JSONSchema7 = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ["outFilePath"],
  properties: {
    level: {
      description: "Compression level for compressible assets. 0 is no compression, 9 is maximum compression. 6 is default.",
      type: "number",
      default: 6,
      minimum: 0,
      maximum: 9
    },
    mtime: {
      description: "Modification time for all files in the zip, specified as a UNIX timestamp (milliseconds since 1 January 1970 UTC). This property sets a uniform modification time for the contents of the zip file. Note: Zip files use FAT file timestamps, which have a limited range. Therefore, datetimes before 1980-01-01 (timestamp value of 315532800000) are invalid in standard Zip files, and datetimes on or after 2100-01-01 (timestamp value of 4102444800000) are also invalid. Values must fall within this range.",
      type: "number",
      // Zip files use FAT file timestamps, which have a limited range.
      // Datetimes before 1980-01-01 are invalid in standard Zip files.
      minimum: Date.UTC(1980, 0, 1),
      // datetimes after 2099-12-31 are invalid in zip files
      exclusiveMaximum: Date.UTC(2100, 0, 1),
      default: Date.now(),
    },
    excludeExtensions: {
      description: "File extensions to exclude from zip.",
      type: "array",
      uniqueItems: true,
      items: {
        type: "string",
        pattern: "^\\.[a-zA-Z0-9]+$"
      },
      default: [],
    },
    outFilePath: {
      description: "File path for zip file relative to webpack output directory.",
      type: "string",
    },
  },
  additionalProperties: false,
};