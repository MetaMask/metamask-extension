/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Derives iframe-related metric properties from frameId and origin data.
 *
 * `is_iframe` uses `frameId` (from chrome.runtime.MessageSender) which is
 * always accurate — 0 for the top-level frame, >0 for any iframe, regardless
 * of whether the iframe shares the parent's origin.
 *
 * `is_cross_origin_iframe` additionally checks whether the iframe's origin
 * differs from the top-level frame's origin. This is the primary security
 * signal (same-origin iframes are trusted by definition).
 *
 * `iframe_origin` and `top_level_origin` are only populated for cross-origin
 * iframes to avoid leaking redundant information for same-origin cases.
 *
 * @param options
 * @param options.frameId - The frame ID from the request (0 = top-level, >0 = iframe).
 * @param options.origin - The origin of the sender (the iframe or top-level page).
 * @param options.mainFrameOrigin - The origin of the top-level frame, if available.
 * @returns An object with iframe metric properties.
 */
export function getIframeProperties({
  frameId,
  origin,
  mainFrameOrigin,
}: {
  frameId?: number;
  origin: string;
  mainFrameOrigin?: string;
}): {
  is_iframe: boolean;
  is_cross_origin_iframe: boolean;
  iframe_origin: string | null;
  top_level_origin: string | null;
} {
  const isIframe = typeof frameId === 'number' && frameId !== 0;
  const isCrossOrigin =
    isIframe &&
    typeof mainFrameOrigin === 'string' &&
    origin !== mainFrameOrigin;

  return {
    is_iframe: isIframe,
    is_cross_origin_iframe: isCrossOrigin,
    iframe_origin: isCrossOrigin ? origin : null,
    top_level_origin: isCrossOrigin ? mainFrameOrigin : null,
  };
}
