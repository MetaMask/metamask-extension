import { DEEP_LINK_HOSTS } from '../../../shared/lib/deep-links/constants';

/**
 * Only MetaMask universal links may leave a campaign card.
 * @param href
 */
export function isAllowedBrazeBannerLink(href: string): boolean {
  try {
    const url = new URL(href);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      DEEP_LINK_HOSTS.includes(url.hostname)
    );
  } catch {
    return false;
  }
}
