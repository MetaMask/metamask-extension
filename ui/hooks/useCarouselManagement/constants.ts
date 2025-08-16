import { DOWNLOAD_MOBILE_APP_SLIDE_ID } from '../../../shared/constants/app';

export const BASIC_FUNCTIONALITY_SLIDE = {
  id: 'basic_functionality',
  title: 'basicConfigurationBannerTitle',
  description: 'enableIt',
  image: './images/basic-functionality.svg',
};

///: BEGIN:ONLY_INCLUDE_IF(solana)
export const SOLANA_SLIDE = {
  id: 'solana',
  title: 'slideSolanaTitle',
  description: 'slideSolanaDescription',
  image: './images/slide-solana-icon.svg',
};
///: END:ONLY_INCLUDE_IF

export const FUND_SLIDE = {
  id: 'fund',
  title: 'slideFundWalletTitle',
  description: 'slideFundWalletDescription',
  image: './images/slide-fund-icon.svg',
  href: 'https://portfolio.metamask.io/buy/build-quote',
};

export const CARD_SLIDE = {
  id: 'card',
  title: 'slideDebitCardTitle',
  description: 'slideDebitCardDescription',
  image: './images/slide-card-icon.svg',
  href: 'https://portfolio.metamask.io/card',
};

export const DOWNLOAD_MOBILE_APP_SLIDE = {
  id: DOWNLOAD_MOBILE_APP_SLIDE_ID,
  title: 'slideDownloadMobileAppTitle',
  description: 'slideDownloadMobileAppDescription',
  image: './images/slide-metamask-icon.svg',
};

export const ZERO_BALANCE = '0x0';
