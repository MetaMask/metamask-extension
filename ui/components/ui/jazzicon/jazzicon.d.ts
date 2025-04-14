declare module '@metamask/jazzicon' {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  function jazzicon(diameter: number, seed: number | number[]): SVGSVGElement;
  export default jazzicon;
}
