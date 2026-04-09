import { captureException } from '../../../shared/lib/sentry';
import {
  fetchCarouselSlidesFromContentful,
  getContentfulEnvironmentDetails,
  UnknownLocaleError,
} from './fetchCarouselSlidesFromContentful';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

jest.mock('../../../shared/lib/environment', () => ({
  isProduction: jest.fn().mockReturnValue(false),
}));

const mockCaptureException = jest.mocked(captureException);

const SPACE_ID = 'test-space';
const ACCESS_TOKEN = 'test-token';

const makeBannerResponse = (overrides = {}) => ({
  items: [
    {
      sys: { id: 'banner-1' },
      fields: {
        headline: 'Test Banner',
        teaser: 'Test description',
        image: { sys: { id: 'asset-1' } },
        linkUrl: 'https://example.com',
        undismissable: false,
        showInExtension: true,
        variableName: 'test',
      },
    },
  ],
  includes: {
    Asset: [
      {
        sys: { id: 'asset-1' },
        fields: { file: { url: '//images.ctfassets.net/img.png' } },
      },
    ],
  },
  ...overrides,
});

const unknownLocaleResponse = {
  sys: { type: 'Error', id: 'BadRequest' },
  message: 'Unknown locale: fr-B',
};

describe('fetchCarouselSlidesFromContentful', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONTENTFUL_ACCESS_SPACE_ID = SPACE_ID;
    process.env.CONTENTFUL_ACCESS_TOKEN = ACCESS_TOKEN;

    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => makeBannerResponse(),
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    delete process.env.CONTENTFUL_ACCESS_SPACE_ID;
    delete process.env.CONTENTFUL_ACCESS_TOKEN;
  });

  it('passes locale param to Contentful API', async () => {
    await fetchCarouselSlidesFromContentful('fr');

    const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
    expect(calledUrl.searchParams.get('locale')).toBe('fr');
  });

  it('omits locale param when not provided', async () => {
    await fetchCarouselSlidesFromContentful();

    const calledUrl = new URL(fetchSpy.mock.calls[0][0]);
    expect(calledUrl.searchParams.has('locale')).toBe(false);
  });

  it('retries without locale on UnknownLocaleError and reports to Sentry', async () => {
    fetchSpy
      .mockResolvedValueOnce({
        ok: false,
        json: async () => unknownLocaleResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => makeBannerResponse(),
      } as Response);

    const result = await fetchCarouselSlidesFromContentful('fr-B');

    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(fetchSpy.mock.calls[0][0]);
    expect(firstUrl.searchParams.get('locale')).toBe('fr-B');

    const retryUrl = new URL(fetchSpy.mock.calls[1][0]);
    expect(retryUrl.searchParams.has('locale')).toBe(false);

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.any(UnknownLocaleError),
    );

    expect(result.regularSlides).toHaveLength(1);
    expect(result.regularSlides[0].title).toBe('Test Banner');
  });

  it('throws non-locale Contentful errors without retrying', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      json: async () => ({ message: 'Something went wrong' }),
    } as Response);

    await expect(fetchCarouselSlidesFromContentful('en')).rejects.toThrow(
      'Contentful error: Something went wrong',
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});
