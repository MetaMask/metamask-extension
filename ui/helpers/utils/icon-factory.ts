import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';

interface TokenMetadata {
  iconUrl?: string;
}

class IconFactory {
  jazzicon: (diameter: number, seed: number) => SVGSVGElement;
  cache: { [key: string]: SVGSVGElement };

  constructor(jazzicon: (diameter: number, seed: number) => SVGSVGElement) {
    this.jazzicon = jazzicon;
    this.cache = {};
  }

  iconForAddress(address: string, diameter: number, tokenMetadata: TokenMetadata): HTMLElement | SVGSVGElement {
    if (iconExistsFor(address, tokenMetadata)) {
      return imageElFor(tokenMetadata);
    }

    return this.generateIdenticonSvg(address, diameter);
  }

  // returns svg dom element
  generateIdenticonSvg(address: string, diameter: number): SVGSVGElement {
    const cacheId = `${address}:${diameter}`;
    // check cache, lazily generate and populate cache
    const identicon: SVGSVGElement =
      this.cache[cacheId] || (this.cache[cacheId] = this.generateNewIdenticon(address, diameter));
    // create a clean copy so you can modify it
    const cleanCopy: SVGSVGElement = identicon.cloneNode(true) as SVGSVGElement;
    return cleanCopy;
  }

  // creates a new identicon
  generateNewIdenticon(address: string, diameter: number): SVGSVGElement {
    const numericRepresentation = jsNumberForAddress(address);
    const identicon = this.jazzicon(diameter, numericRepresentation);
    return identicon;
  }
}

let iconFactory: IconFactory | undefined;

export default function iconFactoryGenerator(jazzicon: (diameter: number, seed: number) => SVGSVGElement): IconFactory {
  if (!iconFactory) {
    iconFactory = new IconFactory(jazzicon);
  }
  return iconFactory;
}

function iconExistsFor(address: string, tokenMetadata: TokenMetadata): boolean {
  return (
    isValidHexAddress(address, { allowNonPrefixed: false }) &&
    tokenMetadata &&
    !!tokenMetadata.iconUrl
  );
}

function imageElFor(tokenMetadata: TokenMetadata = {}): HTMLImageElement {
  const img = document.createElement('img');
  img.src = tokenMetadata.iconUrl ?? '';
  img.style.width = '100%';
  return img;
}

function jsNumberForAddress(address: string): number {
  const addr = address.slice(2, 10);
  const seed = parseInt(addr, 16);
  return seed;
}