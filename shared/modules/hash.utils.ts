/* eslint-disable no-undef */
export async function sha256(str: string): Promise<string> {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
  // eslint-disable-next-line no-restricted-globals, id-denylist
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str),
  );

  return (
    Array.prototype.map
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31887
      // eslint-disable-next-line id-length
      .call(new Uint8Array(buf), (x: number) => `00${x.toString(16)}`.slice(-2))
      .join('')
  );
}
