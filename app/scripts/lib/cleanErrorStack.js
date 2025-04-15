/**
 * Returns error without stack trace for better UI display
 *
 * @param {Error} err - error
 * @returns {Error} Error with clean stack trace.
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
// eslint-disable-next-line id-denylist
export default function cleanErrorStack(err) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  let { name } = err;
  name = name === undefined ? 'Error' : String(name);

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  let msg = err.message;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  msg = msg === undefined ? '' : String(msg);

  if (name === '') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
    // eslint-disable-next-line id-denylist
    err.stack = err.message;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
    // eslint-disable-next-line id-denylist
  } else if (msg === '') {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
    // eslint-disable-next-line id-denylist
    err.stack = err.name;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
    // eslint-disable-next-line id-denylist
  } else if (!err.stack) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
    // eslint-disable-next-line id-denylist
    err.stack = `${err.name}: ${err.message}`;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line id-denylist
  return err;
}
