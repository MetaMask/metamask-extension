import fs from 'fs';
import { Mockttp } from 'mockttp';

export async function mockLookupSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/name-lookup-example-snap-3.1.1.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/name-lookup-example-snap/-/name-lookup-example-snap-3.1.1.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '7155',
          'Content-Type': 'application/octet-stream',
          Etag: '"61ad04c85067c395d930a0f3f75cb501"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockClientStatusSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/client-status-example-snap-1.0.3.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/client-status-example-snap/-/client-status-example-snap-1.0.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '11873',
          'Content-Type': 'application/octet-stream',
          Etag: '"84e43175ffad7735148282c566b2a933"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockSimpleKeyringSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/snap-simple-keyring-snap-1.1.6.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/snap-simple-keyring-snap/-/snap-simple-keyring-snap-1.1.6.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '746597',
          'Content-Type': 'application/octet-stream',
          Etag: '"5e3236532d71422b12b808da978c2fbf"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockManageStateSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/manage-state-example-snap-3.0.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/manage-state-example-snap/-/manage-state-example-snap-3.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '13369',
          'Content-Type': 'application/octet-stream',
          Etag: '"ebf53ab08e421cb48ca87a46a36453f4"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockWebpackPluginExampleOldSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/webpack-plugin-example-snap-2.0.0.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/webpack-plugin-example-snap/-/webpack-plugin-example-snap-2.0.0.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '113150',
          'Content-Type': 'application/octet-stream',
          Etag: '"71894043451bb1d7cc3b2a241bee0b1a"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}

export async function mockWebpackPluginExampleSnap(mockServer: Mockttp) {
  const SNAP_PATH =
    'test/e2e/mock-response-data/snaps/webpack-plugin-example-snap-2.1.3.txt';
  return await mockServer
    .forGet(
      'https://registry.npmjs.org/@metamask/webpack-plugin-example-snap/-/webpack-plugin-example-snap-2.1.3.tgz',
    )
    .thenCallback(() => {
      return {
        status: 200,
        rawBody: fs.readFileSync(SNAP_PATH),
        headers: {
          'Accept-Ranges': 'bytes',
          'Content-Length': '40753',
          'Content-Type': 'application/octet-stream',
          Etag: '"81ccca0d8e7c9ebd216820f080ff9dc4"',
          Vary: 'Accept-Encoding',
        },
      };
    });
}
