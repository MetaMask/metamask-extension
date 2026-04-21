import semver from 'semver';
import { CarouselSlide } from '../../../shared/constants/app-state';
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

  for (const entry of res.items) {
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
