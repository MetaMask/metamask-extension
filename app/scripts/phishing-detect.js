import querystring from 'querystring';
import PortStream from 'extension-port-stream';
import extension from 'extensionizer';
import createRandomId from '../../shared/modules/random-id';
import { setupMultiplex } from './lib/stream-utils';
import { getEnvironmentType } from './lib/util';
import ExtensionPlatform from './platforms/extension';

document.addEventListener('DOMContentLoaded', start);

function start() {
  const hash = window.location.hash.substring(1);
  const suspect = querystring.parse(hash);

  document.getElementById('csdbLink').href = `https://cryptoscamdb.org/search`;

  global.platform = new ExtensionPlatform();

  const extensionPort = extension.runtime.connect({
    name: getEnvironmentType(),
  });
  const connectionStream = new PortStream(extensionPort);
  const mx = setupMultiplex(connectionStream);
  const backgroundConnection = mx.createStream('controller');
  const continueLink = document.getElementById('unsafe-continue');
  continueLink.addEventListener('click', () => {
    backgroundConnection.write({
      jsonrpc: '2.0',
      method: 'safelistPhishingDomain',
      params: [suspect.hostname],
      id: createRandomId(),
    });
    window.location.href = suspect.href;
  });
}
