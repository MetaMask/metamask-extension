export const ETH = 'ETH';
export const GWEI = 'GWEI';
export const WEI = 'WEI';

export const PRIMARY = 'PRIMARY';
export const SECONDARY = 'SECONDARY';

export const ERC20 = 'ERC20';
export const ERC721 = 'ERC721';
export const ERC1155 = 'ERC1155';

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

///: BEGIN:ONLY_INCLUDE_IN(flask)
_supportLink = 'https://metamask-flask.zendesk.com/hc';
_supportRequestLink =
  'https://metamask-flask.zendesk.com/hc/en-us/requests/new';
///: END:ONLY_INCLUDE_IN

export const SUPPORT_LINK = _supportLink;
export const SUPPORT_REQUEST_LINK = _supportRequestLink;
