import semver from 'semver';
import type { CarouselSlide } from '../../../shared/constants/app-state';
import { isProduction } from '../../../shared/lib/environment';
import { captureException } from '../../../shared/lib/sentry';
import packageJson from '../../../package.json';
import { getNormalizedLocale } from '../../../shared/constants/locales';

const APP_VERSION = packageJson.version;
const CONTENT_TYPE = 'promotionalBanner';

const getContentPreviewToken = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const previewToken = urlParams.get('previewToken');
  return previewToken;
};

export const getContentfulEnvironmentDetails = () => {
  const SPACE_ID = process.env.CONTENTFUL_ACCESS_SPACE_ID ?? '';
  const ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN ?? '';

  // If preview mode, then show preview prod master content
  const previewToken = getContentPreviewToken();
  if (previewToken) {
    return {
      environment: 'master',
      domain: 'preview.contentful.com',
      accessToken: previewToken,
      spaceId: SPACE_ID,
    };
  }

  const isProd = isProduction();

  // If production, show prod master content
  if (isProd) {
    return {
      environment: 'master',
      domain: 'cdn.contentful.com',
      accessToken: ACCESS_TOKEN,
      spaceId: SPACE_ID,
    };
  }

  // Default to preview dev content
  return {
    environment: 'dev',
    domain: 'preview.contentful.com',
    accessToken: ACCESS_TOKEN,
    spaceId: SPACE_ID,
  };
};

// Ideally we could construct the type through contentful package, but this is not installed
type ContentfulSysField = { sys: { id: string } };
type ContentfulBanner = ContentfulSysField & {
  fields: {
    headline: string;
    teaser: string;
    image: ContentfulSysField;
    linkUrl: string;
    undismissable: boolean;
    startDate?: string;
    endDate?: string;
    priorityPlacement?: boolean;
    showInExtension?: boolean;
    variableName?: string;
    cardPlacement?: string;
    extensionMinimumVersionNumber?: string;
  };
};

type ContentfulBannerResponse = {
  items: ContentfulBanner[];
  includes?: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Asset?: (ContentfulSysField & {
      fields?: { file?: { url?: string } };
    })[];
  };
};

export class UnknownLocaleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnknownLocaleError';
  }
}

/**
 * Validates that a raw Contentful entry has the shape we rely on. The response
 * comes from an external API and cannot be trusted: if fields such as
 * `headline` come back as a non-string (e.g. an object), rendering the slide
 * crashes the wallet. Malformed entries are skipped rather than rendered.
 *
 * @param entry - A raw item from the Contentful response.
 * @returns True if the entry can be safely turned into a slide.
 */
function isValidContentfulBanner(entry: unknown): entry is ContentfulBanner {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const { sys, fields } = entry as Partial<ContentfulBanner>;
  if (
    typeof sys?.id !== 'string' ||
    typeof fields !== 'object' ||
    fields === null
  ) {
    return false;
  }
  // These fields are rendered or used for navigation directly, so they must be
  // strings to avoid runtime crashes. `image` is intentionally not validated
  // here because `resolveImage` degrades gracefully on a missing/malformed
  // reference.
  return (
    typeof fields.headline === 'string' &&
    typeof fields.teaser === 'string' &&
    typeof fields.linkUrl === 'string'
  );
}

/**
 * Safely extracts a Contentful entry id for diagnostics. The entry may itself
 * be malformed, so this never throws.
 *
 * @param entry - A raw item from the Contentful response.
 * @returns The entry's `sys.id` when it is a string, otherwise `'unknown'`.
 */
function getContentfulEntryId(entry: unknown): string {
  if (typeof entry !== 'object' || entry === null) {
    return 'unknown';
  }
  const { sys } = entry as Partial<ContentfulBanner>;
  return typeof sys?.id === 'string' ? sys.id : 'unknown';
}

async function fetchEntries(
  baseUrl: URL,
  locale?: string,
): Promise<ContentfulBannerResponse> {
  const url = new URL(baseUrl.toString());
  if (locale) {
    try {
      url.searchParams.set('locale', getNormalizedLocale(locale));
    } catch (error) {
      // If locale normalization fails (invalid BCP 47 tag), pass the original locale to Contentful
      url.searchParams.set('locale', locale);
    }
  }
  const res = await fetch(url);
  const json = await res.json();

  if (!res.ok) {
    if (
      typeof json?.message === 'string' &&
      json.message.includes('Unknown locale')
    ) {
      throw new UnknownLocaleError(json.message);
    }
    throw new Error(`Contentful error: ${json?.message ?? res.statusText}`);
  }

  return json as ContentfulBannerResponse;
}

export async function fetchCarouselSlidesFromContentful(
  locale?: string,
): Promise<{
  prioritySlides: CarouselSlide[];
  regularSlides: CarouselSlide[];
}> {
  const { accessToken, domain, environment, spaceId } =
    getContentfulEnvironmentDetails();

  if (!spaceId || !accessToken) {
    return { prioritySlides: [], regularSlides: [] };
  }

  const url = new URL(
    `https://${domain}/spaces/${spaceId}/environments/${environment}/entries`,
  );
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('content_type', CONTENT_TYPE);
  url.searchParams.set('fields.showInExtension', 'true');

  let res: ContentfulBannerResponse;
  try {
    res = await fetchEntries(url, locale);
  } catch (error) {
    if (error instanceof UnknownLocaleError && locale) {
      captureException(error);
      // In case of unknown locale, fallback to default locale
      res = await fetchEntries(url);
    } else {
      throw error;
    }
  }

  const assets = res.includes?.Asset || [];
  const resolveImage = (imageRef: ContentfulSysField) => {
    const asset = assets.find((a) => a.sys.id === imageRef?.sys?.id);
    const rawUrl = asset?.fields?.file?.url || '';
    return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
  };

  const prioritySlides: CarouselSlide[] = [];
  const regularSlides: CarouselSlide[] = [];
  const skippedEntryIds: string[] = [];

  // A well-formed response always has an array here; anything else is an
  // unexpected response shape worth reporting rather than silently ignoring.
  let items: unknown[] = [];
  if (Array.isArray(res.items)) {
    items = res.items;
  } else {
    captureException(
      new Error('Contentful response `items` field was not an array'),
    );
  }

  for (const entry of items) {
    if (!isValidContentfulBanner(entry)) {
      skippedEntryIds.push(getContentfulEntryId(entry));
      continue;
    }

    const {
      headline,
      teaser,
      image,
      linkUrl,
      undismissable,
      startDate,
      endDate,
      priorityPlacement,
      variableName,
      cardPlacement,
      extensionMinimumVersionNumber,
    } = entry.fields;

    const slide: CarouselSlide = {
      id: `contentful-${entry.sys.id}`,
      title: headline,
      description: teaser,
      image: resolveImage(image),
      href: linkUrl,
      undismissable,
      dismissed: false,
      startDate,
      endDate,
      priorityPlacement,
      variableName,
      cardPlacement,
    };

    if (!isValidMinimumVersion(extensionMinimumVersionNumber)) {
      continue;
    }

    if (priorityPlacement) {
      prioritySlides.push(slide);
    } else {
      regularSlides.push(slide);
    }
  }

  // Report once per fetch (with the affected entry ids) rather than once per
  // entry, so a broken content batch cannot flood Sentry. The message is kept
  // static so Sentry groups these together; the count/ids live in `extra`.
  if (skippedEntryIds.length > 0) {
    captureException(new Error('Skipped malformed Contentful banner entries'), {
      extra: { skippedEntryIds },
    });
  }

  return { prioritySlides, regularSlides };
}

function isValidMinimumVersion(contentfulMinimumVersionNumber?: string) {
  // Field is not set, show by default
  if (!contentfulMinimumVersionNumber) {
    return true;
  }

  try {
    return semver.gte(APP_VERSION, contentfulMinimumVersionNumber);
  } catch {
    // Invalid mobile version number, not showing banner
    return false;
  }
}
