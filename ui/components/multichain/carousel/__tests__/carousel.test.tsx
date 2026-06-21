import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Carousel } from '../carousel';
import { fetchCarouselSlidesFromContentful } from '../../../../hooks/useCarouselManagement/fetchCarouselSlidesFromContentful';

const it = globalThis.it as unknown as jest.It;
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

jest.mock('../../../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
  sentryLogger: {
    extend: jest.fn(() => jest.fn()),
  },
}));

jest.mock('../../../../../shared/lib/environment', () => ({
  isProduction: jest.fn().mockReturnValue(false),
}));

// Mock Redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn(() => ({ address: '0x123' })), // Mock selected account
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

// Mock the hooks and components that might cause issues
jest.mock('../../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

// Mock the animation hooks
jest.mock('../animations/useTransitionToNextCard', () => ({
  useTransitionToNextCard: () => ({
    transitionToNextCard: jest.fn(),
    isTransitioning: false,
  }),
}));

jest.mock('../animations/useTransitionToEmpty', () => ({
  useTransitionToEmpty: () => ({
    startEmptyStateSequence: jest.fn(),
    isEmptyStateFolding: false,
  }),
}));

// Simple mock slides for testing
const mockSlides = [
  {
    id: 'test-slide-1',
    title: 'Test Slide 1',
    description: 'Test description 1',
    image: 'https://example.com/image1.jpg',
    dismissed: false,
    variableName: 'test1',
  },
  {
    id: 'test-slide-2',
    title: 'Test Slide 2',
    description: 'Test description 2',
    image: 'https://example.com/image2.jpg',
    dismissed: false,
    variableName: 'test2',
  },
];

const makeBannerResponse = (linkUrl: string) => ({
  items: [
    {
      sys: { id: 'banner-1' },
      fields: {
        headline: 'Test Banner',
        teaser: 'Test description',
        image: { sys: { id: 'asset-1' } },
        linkUrl,
        undismissable: false,
        showInExtension: true,
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
});

describe('Carousel', () => {
  let fetchSpy: jest.SpyInstance;
  let previousPlatform: typeof global.platform;

  const defaultProps = {
    slides: mockSlides,
    isLoading: false,
    onSlideClose: jest.fn(),
    onSlideClick: jest.fn(),
    onActiveSlideChange: jest.fn(),
    className: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CONTENTFUL_ACCESS_SPACE_ID = 'test-space';
    process.env.CONTENTFUL_ACCESS_TOKEN = 'test-token';
    fetchSpy = jest.spyOn(globalThis, 'fetch');
    previousPlatform = global.platform;
    global.platform = {
      openTab: jest.fn(),
    } as unknown as typeof global.platform;
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    global.platform = previousPlatform;
    delete process.env.CONTENTFUL_ACCESS_SPACE_ID;
    delete process.env.CONTENTFUL_ACCESS_TOKEN;
  });

  it('renders without crashing', () => {
    render(<Carousel {...defaultProps} />);
    expect(
      screen.getByTestId('carousel-slide-test-slide-1'),
    ).toBeInTheDocument();
  });

  it('renders slide titles and descriptions', () => {
    render(<Carousel {...defaultProps} />);

    expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
  });

  it('returns null when no slides (initial load)', () => {
    const { container } = render(<Carousel {...defaultProps} slides={[]} />);

    // Should not render anything when there are no slides initially
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state when loading', () => {
    render(<Carousel {...defaultProps} isLoading={true} />);

    // Should not render slides when loading
    expect(screen.queryByText('Test Slide 1')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-carousel';
    const { container } = render(
      <Carousel {...defaultProps} className={customClass} />,
    );

    expect(container.firstChild).toHaveClass(customClass);
  });

  it('calls onActiveSlideChange with the current slide when slides are provided', () => {
    const onActiveSlideChangeMock = jest.fn();
    render(
      <Carousel
        {...defaultProps}
        onActiveSlideChange={onActiveSlideChangeMock}
      />,
    );

    expect(onActiveSlideChangeMock).toHaveBeenCalledWith(mockSlides[0]);
  });

  it('filters out dismissed slides', () => {
    const slidesWithDismissed = [
      ...mockSlides,
      {
        id: 'dismissed-slide',
        title: 'Dismissed Slide',
        description: 'Should not show',
        image: 'https://example.com/dismissed.jpg',
        dismissed: true,
        variableName: 'dismissed',
      },
    ];

    render(<Carousel {...defaultProps} slides={slidesWithDismissed} />);

    // Should not show dismissed slide
    expect(screen.queryByText('Dismissed Slide')).not.toBeInTheDocument();
    // Should still show non-dismissed slides
    expect(screen.getByText('Test Slide 1')).toBeInTheDocument();
  });

  it('does not follow href when the slide click handler consumes the click', async () => {
    const onSlideClickMock = jest.fn().mockReturnValue(true);
    const slides = [
      {
        ...mockSlides[0],
        id: 'download-mobile-slide',
        href: 'https://link.metamask.io/buy?amount=100',
        variableName: 'downloadMobileApp',
      },
    ];

    render(
      <Carousel
        {...defaultProps}
        slides={slides}
        onSlideClick={onSlideClickMock}
      />,
    );

    fireEvent.click(screen.getByTestId('carousel-slide-download-mobile-slide'));

    expect(onSlideClickMock).toHaveBeenCalledWith('download-mobile-slide');
    await flushPromises();
    expect(mockUseNavigate).not.toHaveBeenCalled();
    expect(global.platform.openTab).not.toHaveBeenCalled();
  });

  type CarouselClickTestCase = {
    testName: string;
    linkUrl: string;
    expected: { navigate: string } | { openTab: string };
  };

  const carouselClickTestCases: CarouselClickTestCase[] = [
    {
      testName: 'existing internal route',
      linkUrl: '/settings',
      expected: { navigate: '/settings' },
    },
    {
      testName: 'deep link that resolves to an internal route',
      linkUrl: 'https://link.metamask.io/home?openNetworkSelector=true',
      expected: { navigate: '/?openNetworkSelector=true' },
    },
    {
      testName: 'deep link subdomain that resolves to an internal route',
      linkUrl: 'https://links.link.metamask.io/home?openNetworkSelector=true',
      expected: { navigate: '/?openNetworkSelector=true' },
    },
    {
      testName: 'deep link that resolves to a redirect URL',
      linkUrl: 'https://link.metamask.io/buy?amount=100',
      expected: { openTab: 'https://app.metamask.io/buy?amount=100' },
    },
    {
      testName: 'external URL that only starts with the deep link host',
      linkUrl:
        'https://link.metamask.io.evil.com/home?openNetworkSelector=true',
      expected: {
        openTab:
          'https://link.metamask.io.evil.com/home?openNetworkSelector=true',
      },
    },
    {
      testName: 'non-deep-link external URL',
      linkUrl: 'https://example.com',
      expected: { openTab: 'https://example.com' },
    },
  ];

  it.each(carouselClickTestCases)(
    'clicks a Contentful slide with a $testName',
    async ({ linkUrl, expected }: CarouselClickTestCase) => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => makeBannerResponse(linkUrl),
      } as Response);
      const { regularSlides } = await fetchCarouselSlidesFromContentful();

      render(<Carousel {...defaultProps} slides={regularSlides} />);

      fireEvent.click(screen.getByTestId('carousel-slide-contentful-banner-1'));

      if ('navigate' in expected) {
        await waitFor(() =>
          expect(mockUseNavigate).toHaveBeenCalledWith(expected.navigate),
        );
        expect(global.platform.openTab).not.toHaveBeenCalled();
      } else {
        await waitFor(() =>
          expect(global.platform.openTab).toHaveBeenCalledWith({
            url: expected.openTab,
          }),
        );
        expect(mockUseNavigate).not.toHaveBeenCalled();
      }
    },
  );
});
