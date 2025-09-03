import { ExtendedJSONSchema } from 'json-schema-to-ts';
import { Browsers } from '../../helpers';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['browsers', 'description', 'manifest_version', 'version', 'zip'],
  properties: {
    browsers: {
      description: 'The browsers to build for.',
      type: 'array',
      items: {
        type: 'string',
        enum: Browsers as Writeable<typeof Browsers>,
      },
      minItems: 1,
      maxItems: Browsers.length,
      uniqueItems: true,
    },
    version: {
      description:
        'One to four dot-separated integers identifying the version of this extension.',
      type: 'string',
    },
    versionName: {
      description:
        'A Semantic Versioning-compliant version number for the extension.',
      type: 'string',
    },
    description: {
      description: 'A plain text string that describes the extension.',
      type: ['string', 'null'],
      maxLength: 132,
    },
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    manifest_version: {
      description:
        'An integer specifying the version of the manifest file format your package requires.',
      type: 'number',
      enum: [2, 3],
    },
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    web_accessible_resources: {
      description:
        'An array of strings specifying the paths of additional web-accessible resources.',
      type: 'array',
      items: {
        type: 'string',
      },
    },
    transform: {
      description: 'Function to transform the manifest file.',
      instanceof: 'Function',
      tsType: '((manifest: Manifest, browser: Browser) => Manifest)',
    },
    zip: {
      description: 'Whether or not to zip the individual browser builds.',
      type: 'boolean',
    },
    zipOptions: {
      required: ['outFilePath'],
      properties: {
        level: {
          description:
            'Compression level for compressible assets. 0 is no compression, 9 is maximum compression. 6 is default.',
          type: 'number',
          default: 6,
          minimum: 0,
          maximum: 9,
        },
        mtime: {
          description:
            'Modification time for all files in the zip, specified as a UNIX timestamp (milliseconds since 1 January 1970 UTC). This property sets a uniform modification time for the contents of the zip file. Note: Zip files use FAT file timestamps, which have a limited range. Therefore, datetimes before 1980-01-01 (timestamp value of 315532800000) are invalid in standard Zip files, and datetimes on or after 2100-01-01 (timestamp value of 4102444800000) are also invalid. Values must fall within this range.',
          type: 'number',
          // Zip files use FAT file timestamps, which have a limited range.
          // Datetimes before 1980-01-01 are invalid in standard Zip files.
          minimum: Date.UTC(1980, 0, 1),
          // datetimes after 2099-12-31 are invalid in zip files
          exclusiveMaximum: Date.UTC(2100, 0, 1),
          get default() {
            return Date.now();
          },
        },
        excludeExtensions: {
          description: 'File extensions to exclude from zip.',
          type: 'array',
          uniqueItems: true,
          items: {
            type: 'string',
            pattern: '^\\.[a-zA-Z0-9]+$',
          },
          default: [],
        },
        outFilePath: {
          description:
            'File path template for zip file relative to webpack output directory. You must include `[browser]` in the file path template, which will be replaced with the browser name. For example, `builds/[browser].zip`.',
          type: 'string',
          pattern: '.*\\[browser\\].*',
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
  if: {
    properties: {
      zip: {
        const: true,
      },
    },
  },
  then: {
    required: ['zipOptions'],
  },
} satisfies ExtendedJSONSchema<Record<'instanceof' | 'tsType', string>>;
