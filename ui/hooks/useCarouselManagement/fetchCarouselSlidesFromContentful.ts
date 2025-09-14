import semver from 'semver';
import { CarouselSlide } from '../../../shared/constants/app-state';
import { isProduction } from '../../../shared/modules/environment';
import packageJson from '../../../package.json';

const APP_VERSION = packageJson.version;
const isProductionEnv = process.env.IN_TEST || isProduction();

const SPACE_ID = process.env.CONTENTFUL_ACCESS_SPACE_ID ?? '';
const ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN ?? '';
const ENVIRONMENT = isProductionEnv ? 'master' : 'dev';
const CONTENT_TYPE = 'promotionalBanner';
const DEFAULT_DOMAIN = isProductionEnv
  ? 'cdn.contentful.com'
  : 'preview.contentful.com';
const CONTENTFUL_API = `https://${DEFAULT_DOMAIN}/spaces/${SPACE_ID}/environments/${ENVIRONMENT}/entries`;
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

export async function fetchCarouselSlidesFromContentful(): Promise<{
  prioritySlides: CarouselSlide[];
  regularSlides: CarouselSlide[];
}> {
  if (!SPACE_ID || !ACCESS_TOKEN) {
    return { prioritySlides: [], regularSlides: [] };
  }

  const url = new URL(CONTENTFUL_API);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  url.searchParams.set('content_type', CONTENT_TYPE);
  url.searchParams.set('fields.showInExtension', 'true');
  const res: ContentfulBannerResponse = await fetch(url).then((r) => r.json());

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
