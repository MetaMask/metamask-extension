import type Jazzicon from '@metamask/jazzicon';
import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';

/**
 * Defines the metadata for a token including optional icon URL.
 */
type TokenMetadata = {
  iconUrl: string;
};

type GenerateSeedFunction = (address: string) => number | number[];

/**
 * A factory for generating icons for cryptocurrency addresses using Jazzicon or predefined token metadata.
 */
export class IconFactory {
  /**
   * Function to generate a Jazzicon SVG element.
   */
  jazzicon: typeof Jazzicon;

  /**
   * Function to generate seed before passing to jazzicon implementation.
   */
  generateSeed: GenerateSeedFunction;

  /**
   * Cache for storing generated SVG elements to avoid re-rendering.
   */
  cache: { [key: string]: SVGSVGElement };

  /**
   * Constructs an IconFactory instance with a given Jazzicon function.
   *
   * @param jazzicon - A function that returns a Jazzicon SVG given a diameter and seed.
   * @param generateSeed - An optional function that generates a seed based on an address.
   */
  constructor(
    jazzicon: typeof Jazzicon,
    generateSeed: GenerateSeedFunction = jsNumberForAddress,
  ) {
    this.jazzicon = jazzicon;
    this.generateSeed = generateSeed;
    this.cache = {};
  }

  /**
   * Generates an icon for a given address. Returns a predefined image or generates a new Jazzicon.
   *
   * @param address - The cryptocurrency address to generate the icon for.
   * @param diameter - The diameter of the icon to be generated.
   * @param tokenMetadata - Metadata containing optional icon URL for predefined icons.
   * @returns An HTML element representing the icon.
   */
  iconForAddress(
    address: string,
    diameter: number,
    tokenMetadata?: Partial<TokenMetadata>,
  ): HTMLElement | SVGSVGElement {
    if (iconExistsFor(address, tokenMetadata)) {
      return imageElFor(tokenMetadata);
    }

    return this.generateIdenticonSvg(address, diameter);
  }

  /**
   * Generates or retrieves from cache a Jazzicon SVG for a given address and diameter.
   *
   * @param address - The cryptocurrency address for the identicon.
   * @param diameter - The diameter of the identicon.
   * @returns A Jazzicon SVG element.
   */
  generateIdenticonSvg(address: string, diameter: number): SVGSVGElement {
    const cacheId = `${address}:${diameter}`;
    const identicon: SVGSVGElement =
      this.cache[cacheId] ||
      (this.cache[cacheId] = this.generateNewIdenticon(address, diameter));
    const cleanCopy: SVGSVGElement = identicon.cloneNode(true) as SVGSVGElement;
    return cleanCopy;
  }

  /**
   * Generates a new Jazzicon SVG for a given address and diameter.
   *
   * @param address - The cryptocurrency address for the identicon.
   * @param diameter - The diameter of the identicon.
   * @returns A new Jazzicon SVG element.
   */
  generateNewIdenticon(address: string, diameter: number): SVGSVGElement {
    const numericRepresentation = this.generateSeed(address);
    const identicon = this.jazzicon(diameter, numericRepresentation);
    return identicon;
  }
}

let iconFactory: IconFactory | undefined;

/**
 * Generates or retrieves an existing IconFactory instance.
 *
 * @param jazzicon - A function that returns a Jazzicon SVG given a diameter and seed.
 * @returns An IconFactory instance.
 */
export default function iconFactoryGenerator(
  jazzicon: typeof Jazzicon,
): IconFactory {
  if (!iconFactory) {
    iconFactory = new IconFactory(jazzicon);
  }
  return iconFactory;
}

/**
 * Determines if an icon already exists for a given address based on token metadata.
 *
 * @param address - The cryptocurrency address.
 * @param tokenMetadata - Metadata containing optional icon URL.
 * @returns True if an icon exists, otherwise false.
 */
function iconExistsFor(
  address: string,
  tokenMetadata?: Partial<TokenMetadata>,
): tokenMetadata is TokenMetadata {
  if (!tokenMetadata?.iconUrl) {
    return false;
  }
  return isValidHexAddress(address, { allowNonPrefixed: false });
}

/**
 * Creates an HTMLImageElement for a given token metadata.
 *
 * @param tokenMetadata - Metadata containing the icon URL. Defaults to an empty object.
 * @returns An HTMLImageElement with the source set to the icon URL.
 */
function imageElFor(tokenMetadata: TokenMetadata): HTMLImageElement {
  const img = document.createElement('img');
  img.src = tokenMetadata.iconUrl;
  img.style.width = '100%';
  return img;
}

/**
 * Converts a hexadecimal address into a numerical seed.
 *
 * @param address - The cryptocurrency address.
 * @returns A numerical seed derived from the address.
 */
function jsNumberForAddress(address: string): number {
  const addr = address.slice(2, 10);
  const seed = parseInt(addr, 16);
  return seed;
}
