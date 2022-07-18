export const ETH = 'ETH';
export const GWEI = 'GWEI';
export const WEI = 'WEI';

export const PRIMARY = 'PRIMARY';
export const SECONDARY = 'SECONDARY';

export const ERC20 = 'ERC20';
export const ERC721 = 'ERC721';
export const ERC1155 = 'ERC1155';

/**
 * @typedef {Object} TokenStandards
 * @property {'ERC20'} ERC20 - A token that conforms to the ERC20 standard.
 * @property {'ERC721'} ERC721 - A token that conforms to the ERC721 standard.
 * @property {'ERC1155'} ERC1155 - A token that conforms to the ERC1155
 *  standard.
 * @property {'NONE'} NONE - Not a token, but rather the base asset of the
 *  selected chain.
 */

/**
 * This type will work anywhere you expect a string that can be one of the
 * above statuses
 *
 * @typedef {TokenStandards[keyof TokenStandards]} TokenStandardStrings
 */

/**
 * Describes the standard which a token conforms to.
 *
 * @type {TokenStandards}
 */
export const TOKEN_STANDARDS = {
  ERC20,
  ERC721,
  ERC1155,
  NONE: 'NONE',
};

export const GAS_ESTIMATE_TYPES = {
  SLOW: 'SLOW',
  AVERAGE: 'AVERAGE',
  FAST: 'FAST',
  FASTEST: 'FASTEST',
};

let _supportLink = 'https://support.metamask.io';
let _supportRequestLink = 'https://metamask.zendesk.com/hc/en-us/requests/new';
const _contractAddressLink =
  'https://metamask.zendesk.com/hc/en-us/articles/360020028092-What-is-the-known-contract-address-warning-';

///: BEGIN:ONLY_INCLUDE_IN(flask)
_supportLink = 'https://metamask-flask.zendesk.com/hc';
_supportRequestLink =
  'https://metamask-flask.zendesk.com/hc/en-us/requests/new';
///: END:ONLY_INCLUDE_IN

export const SUPPORT_LINK = _supportLink;
export const SUPPORT_REQUEST_LINK = _supportRequestLink;
export const CONTRACT_ADDRESS_LINK = _contractAddressLink;
