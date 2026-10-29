import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { validateSvg } from './validate-svg.mts';

describe('validateSvg', () => {
  it('throws when an SVG embeds binary image data', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'optimize-media-'));
    const filePath = join(directory, 'embedded-png.svg');
    await writeFile(
      filePath,
      '<svg><image href="data:image/png;base64,iVBORw0KGgo=" /></svg>',
    );

    await expect(validateSvg(filePath)).rejects.toThrow(
      'embeds binary image/png data in an SVG',
    );
  });

  it('allows an SVG that contains only vector markup', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'optimize-media-'));
    const filePath = join(directory, 'vector.svg');
    await writeFile(filePath, '<svg><path d="M0 0" /></svg>');

    await expect(validateSvg(filePath)).resolves.toBeUndefined();
  });
});
