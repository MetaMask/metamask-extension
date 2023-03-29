let _supportLink = 'https://support.metamask.io';

///: BEGIN:ONLY_INCLUDE_IN(mmi)
_supportLink = 'https://mmi-support.zendesk.com/hc/en-us';
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(flask)
_supportLink = 'https://metamask-flask.zendesk.com/hc';
///: END:ONLY_INCLUDE_IN

export const SUPPORT_LINK = _supportLink;

export const COINGECKO_LINK = 'https://www.coingecko.com/';
export const CRYPTOCOMPARE_LINK = 'https://www.cryptocompare.com/';
export const PRIVACY_POLICY_LINK = 'https://consensys.net/privacy-policy/';

// TODO make sure these links are correct
export const ETHERSCAN_PRIVACY_LINK = 'https://etherscan.io/privacyPolicy';
export const CONSENSYS_PRIVACY_LINK = 'https://consensys.net/privacy-policy/';
export const AUTO_DETECT_TOKEN_LEARN_MORE_LINK =
  'https://consensys.net/privacy-policy/';
