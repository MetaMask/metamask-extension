import { ExtendedJSONSchema } from 'json-schema-to-ts';
import { Browsers } from '../../helpers';
import { getZipMtimeSchema } from './zip-mtime';

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: [
    'browsers',
    'description',
    'manifest_version',
    'version',
    'zip',
    'buildType',
  ],
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
    manifest_version: {
      description:
        'An integer specifying the version of the manifest file format your package requires.',
      type: 'number',
      enum: [2, 3],
    },
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
        mtime: getZipMtimeSchema(),
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
    buildType: {
      description: 'The build type to create.',
      type: 'string',
    },
    setBuildId: {
      description:
        'Whether to set a build ID in the emitted manifest. The build ID is a hash of the build contents that can be used to identify the build and detect when it has changed.',
      type: 'boolean',
    },
    stats: {
      description: 'Optional bundle-size reporting configuration.',
      anyOf: [
        {
          type: 'object',
          required: ['outFile', 'classifyEntrypoint'],
          properties: {
            outFile: {
              description:
                'Output file path template for the emitted bundle-size summary relative to webpack output. Must include `[browser]` and end with `.json`, for example `bundle-size/[browser].json`.',
              type: 'string',
              pattern: '^.*\\[browser\\].*\\.json$',
            },
            debug: {
              description:
                'Whether to emit a sibling debug artifact with the classified entrypoint graph.',
              type: 'boolean',
            },
            classifyEntrypoint: {
              description:
                'Classifies a webpack entrypoint by runtime surface for bundle-size reporting.',
              instanceof: 'Function',
              tsType:
                "((name: string) => 'background' | 'ui' | 'other' | 'contentScripts' | null)",
            },
          },
          additionalProperties: false,
        },
        {
          const: false,
        },
      ],
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
