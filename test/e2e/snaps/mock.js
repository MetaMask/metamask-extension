const tar = require('tar-stream');
const path = require('path');
const { promises: fs } = require('fs')
const globby = require('globby');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');
const concat = require('concat-stream')

const mockedSnaps = ['@metamask/bip32-example-snap']

export async function mockNPM(mockServer) {
  return await Promise.all(mockedSnaps.map(async (snapName) => {
    const snapPath = path.resolve(require.resolve(snapName), '../..')

    const packageJson = JSON.parse(await fs.readFile(path.resolve(snapPath, 'package.json'), 'utf-8'));
    const version = packageJson.version;

    const pack = tar.pack()

    const paths = await globby(packageJson.files.map(filePath => path.resolve(snapPath, filePath)));

    await Promise.all(paths.map(async filePath => {
      const fileContent = await fs.readFile(filePath);
      const relativePath = filePath.slice(snapPath.length + 1);
      pack.entry({ name: relativePath }, fileContent);
    }))

    pack.finalize();

    const buffer = await new Promise((resolve, reject) => {
      const concatStream = concat({ encoding: 'uint8array' }, (buffer) => {
        resolve(buffer);
      })
      pipeline(pack, createGzip(), concatStream, (error) => { reject(error) })
    })

    const tarballUrl = `https://registry.npmjs.org/${snapName}/-/${snapName.split("/")[1]}-${version}.tgz`;
    return Promise.all([
      mockServer
        .forGet(`https://registry.npmjs.org/${snapName}`)
        .thenJson(200, {
          versions: {
            [version]: {
              dist: {
                tarball: tarballUrl,
              },
            },
          },
        }),
      mockServer
        .forGet(tarballUrl)
        .thenReply(200, buffer, { 'content-length': buffer.byteLength })]);
  }));
}