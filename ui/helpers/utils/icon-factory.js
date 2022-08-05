import { isValidHexAddress } from '../../../shared/modules/hexstring-utils';

let iconFactory;

export default function iconFactoryGenerator(jazzicon) {
  if (!iconFactory) {
    iconFactory = new IconFactory(jazzicon);
  }
  return iconFactory;
}

function IconFactory(jazzicon) {
  this.jazzicon = jazzicon;
  this.cache = {};
}

IconFactory.prototype.iconForAddress = function (address, diameter, tokenList) {
  if (iconExistsFor(address.toLowerCase(), tokenList)) {
    return imageElFor(address.toLowerCase(), tokenList);
  }

  return this.generateIdenticonSvg(address, diameter);
};

// returns svg dom element
IconFactory.prototype.generateIdenticonSvg = function (address, diameter) {
  const cacheId = `${address}:${diameter}`;
  // check cache, lazily generate and populate cache
  const identicon =
    this.cache[cacheId] ||
    (this.cache[cacheId] = this.generateNewIdenticon(address, diameter));
  // create a clean copy so you can modify it
  const cleanCopy = identicon.cloneNode(true);
  return cleanCopy;
};

// creates a new identicon
IconFactory.prototype.generateNewIdenticon = function (address, diameter) {
  const numericRepresentation = jsNumberForAddress(address);
  const identicon = this.jazzicon(diameter, numericRepresentation);
  return identicon;
};

// util

function iconExistsFor(address, tokenList) {
  return (
    tokenList[address] &&
    isValidHexAddress(address, { allowNonPrefixed: false }) &&
    tokenList[address].iconUrl
  );
}

function imageElFor(address, tokenList) {
  const tokenMetadata = tokenList[address];
  const img = document.createElement('img');
  img.src = tokenMetadata?.iconUrl;
  img.style.width = '100%';
  return img;
}

function jsNumberForAddress(address) {
  const addr = address.slice(2, 10);
  const seed = parseInt(addr, 16);
  return seed;
}
