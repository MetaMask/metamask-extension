import {
  isValidHexAddress,
  toChecksumHexAddress,
} from '../../../shared/modules/hexstring-utils';

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

IconFactory.prototype.iconForAddress = function (
  address,
  diameter,
  useTokenDetection,
  tokenList,
) {
  // When useTokenDetection flag is true the tokenList contains tokens with non-checksum address from the dynamic token service api,
  // When useTokenDetection flag is false the tokenList contains tokens with checksum addresses from contract-metadata.
  // So the flag indicates whether the address of tokens currently on the tokenList is checksum or not.
  const addr = useTokenDetection ? address : toChecksumHexAddress(address);
  if (iconExistsFor(addr, tokenList)) {
    return imageElFor(addr, useTokenDetection, tokenList);
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

function imageElFor(address, useTokenDetection, tokenList) {
  const tokenMetadata = tokenList[address];
  const fileName = tokenMetadata?.iconUrl;
  // token from dynamic api list is fetched when useTokenDetection is true
  // In the static list, the iconUrl will be holding only a filename for the image,
  // the corresponding images will be available in the `images/contract/` location when the contract-metadata package was added to the extension
  //  so that it can be accessed using the filename in iconUrl.
  const path = useTokenDetection ? fileName : `images/contract/${fileName}`;
  const img = document.createElement('img');
  img.src = path;
  img.style.width = '100%';
  return img;
}

function jsNumberForAddress(address) {
  const addr = address.slice(2, 10);
  const seed = parseInt(addr, 16);
  return seed;
}
