/**
 * Copy that replaces the generic third-party warning on the deep link
 * interstitial. Both values are i18n keys.
 */
export type DeepLinkNotice = {
  title: string;
  /**
   * Must contain `$1`, which receives `deepLink_ContinueDescription` so the
   * user always sees where the link opens.
   */
  description: string;
};

/**
 * Picks a notice for a deep link, or returns null to keep the generic copy.
 *
 * The interstitial only consults it for unsigned links that open inside
 * MetaMask.
 *
 * @param url - The canonical deep link URL, with its original query.
 */
export type DeepLinkNoticeResolver = (url: URL) => DeepLinkNotice | null;

export type DeepLinkProps = {
  /** Lets a feature describe its own links. Keep it referentially stable. */
  getNotice?: DeepLinkNoticeResolver;
};
