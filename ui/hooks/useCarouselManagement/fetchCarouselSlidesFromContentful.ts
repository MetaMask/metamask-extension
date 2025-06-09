import { CarouselSlide } from '../../../shared/constants/app-state';
import { isProduction } from '../../../shared/modules/environment';

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
  };
};

const noSlides: CarouselSlide[] = [];

type ContentfulBannerResponse = {
  items: ContentfulBanner[];
  includes?: {
    Asset?: (ContentfulSysField & {
      fields?: { file?: { url?: string } };
    })[];
  };
};

export async function fetchCarouselSlidesFromContentful(): Promise<
  CarouselSlide[]
> {
  if (!SPACE_ID || !ACCESS_TOKEN) {
    return noSlides;
  }

  const url = new URL(CONTENTFUL_API);
  url.searchParams.set('access_token', ACCESS_TOKEN);
  url.searchParams.set('content_type', CONTENT_TYPE);
  const res: ContentfulBannerResponse = await fetch(url).then((r) => r.json());

  const assets = res.includes?.Asset || [];
  const resolveImage = (imageRef: ContentfulSysField) => {
    const asset = assets.find((a) => a.sys.id === imageRef?.sys?.id);
    const rawUrl = asset?.fields?.file?.url || '';
    return rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
  };

  const slides: CarouselSlide[] = res.items.map((entry) => ({
    id: `contentful-${entry.sys.id}`,
    title: entry.fields.headline,
    description: entry.fields.teaser,
    image: resolveImage(entry.fields.image),
    href: entry.fields.linkUrl,
    undismissable: entry.fields.undismissable,
    dismissed: false,
    startDate: entry.fields.startDate,
    endDate: entry.fields.endDate,
  }));

  return slides;
}
