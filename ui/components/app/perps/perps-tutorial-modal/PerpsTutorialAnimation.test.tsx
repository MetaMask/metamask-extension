import React from 'react';
import { render, screen } from '@testing-library/react';
import * as riveReactCanvas from '@rive-app/react-canvas';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
  ENVIRONMENT_TYPE_FULLSCREEN,
} from '../../../../../shared/constants/app';
import { ThemeType } from '../../../../../shared/constants/preferences';
import * as riveWasmContext from '../../../../contexts/rive-wasm';
import * as useThemeHook from '../../../../hooks/useTheme';
import PerpsTutorialAnimation from './PerpsTutorialAnimation';

// Mock the Rive hooks
jest.mock('@rive-app/react-canvas', () => ({
  useRive: jest.fn(() => ({
    rive: { play: jest.fn(), cleanup: jest.fn() },
    RiveComponent: () => <div data-testid="rive-component">Rive Animation</div>,
  })),
  useRiveFile: jest.fn(() => ({
    riveFile: { name: 'mock-rive-file' },
    status: 'success',
  })),
  Layout: jest.fn(),
  Fit: {
    Cover: 'cover',
    Contain: 'contain',
    FitWidth: 'fitWidth',
    FitHeight: 'fitHeight',
  },
  Alignment: {
    Center: 'center',
    TopCenter: 'topCenter',
    BottomCenter: 'bottomCenter',
  },
}));

// Mock Rive WASM context
jest.mock('../../../../contexts/rive-wasm', () => ({
  useRiveWasmContext: jest.fn(() => ({
    isWasmReady: true,
    loading: false,
    error: undefined,
    urlBufferMap: {},
    setUrlBufferCache: jest.fn(),
    animationCompleted: {},
    setIsAnimationCompleted: jest.fn(),
  })),
  useRiveWasmFile: jest.fn(() => ({
    buffer: new ArrayBuffer(8),
    error: undefined,
    loading: false,
  })),
}));

// Mock theme hook
jest.mock('../../../../hooks/useTheme', () => ({
  useTheme: jest.fn(() => 'light'),
}));

// Mock environment type utility
const mockGetEnvironmentType = jest.fn();
jest.mock('../../../../../app/scripts/lib/util', () => ({
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

const mockedRiveReactCanvas = jest.mocked(riveReactCanvas);
const mockedRiveWasmContext = jest.mocked(riveWasmContext);
const mockedUseTheme = jest.mocked(useThemeHook);

describe('PerpsTutorialAnimation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

    // Reset to default mocks
    mockedRiveWasmContext.useRiveWasmContext.mockReturnValue({
      isWasmReady: true,
      loading: false,
      error: undefined,
      urlBufferMap: {},
      setUrlBufferCache: jest.fn(),
      animationCompleted: {},
      setIsAnimationCompleted: jest.fn(),
    });
    mockedRiveWasmContext.useRiveWasmFile.mockReturnValue({
      buffer: new ArrayBuffer(8),
      error: undefined,
      loading: false,
    });
    mockedRiveReactCanvas.useRiveFile.mockReturnValue({
      riveFile: {
        name: 'mock-rive-file',
      } as unknown as riveReactCanvas.RiveFile,
      status: 'success',
    });
    mockedUseTheme.useTheme.mockReturnValue(ThemeType.light);
  });

  describe('rendering', () => {
    it('renders the animation container', () => {
      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(
        screen.getByTestId('perps-tutorial-animation'),
      ).toBeInTheDocument();
    });

    it('renders the Rive component', () => {
      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(screen.getByTestId('rive-component')).toBeInTheDocument();
    });

    it('passes the correct artboard name to useRive', () => {
      render(<PerpsTutorialAnimation artboardName="02_Leverage" />);

      expect(mockedRiveReactCanvas.useRive).toHaveBeenCalledWith(
        expect.objectContaining({
          artboard: '02_Leverage',
        }),
      );
    });
  });

  describe('loading state', () => {
    it('renders loading placeholder when WASM is not ready', () => {
      mockedRiveWasmContext.useRiveWasmContext.mockReturnValue({
        isWasmReady: false,
        loading: true,
        error: undefined,
        urlBufferMap: {},
        setUrlBufferCache: jest.fn(),
        animationCompleted: {},
        setIsAnimationCompleted: jest.fn(),
      });

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(
        screen.getByTestId('perps-tutorial-animation-loading'),
      ).toBeInTheDocument();
    });

    it('renders loading placeholder when buffer is loading', () => {
      mockedRiveWasmContext.useRiveWasmFile.mockReturnValue({
        buffer: undefined,
        error: undefined,
        loading: true,
      });

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(
        screen.getByTestId('perps-tutorial-animation-loading'),
      ).toBeInTheDocument();
    });

    it('renders loading placeholder when riveFile status is loading', () => {
      mockedRiveReactCanvas.useRiveFile.mockReturnValue({
        riveFile: null,
        status: 'loading' as const,
      });

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(
        screen.getByTestId('perps-tutorial-animation-loading'),
      ).toBeInTheDocument();
    });
  });

  describe('viewport-specific sizing', () => {
    it('uses Fit.Contain for side panel environment', () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(mockedRiveReactCanvas.Layout).toHaveBeenCalledWith(
        expect.objectContaining({
          fit: 'contain',
        }),
      );
    });

    it('uses Fit.Contain for popup environment', () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(mockedRiveReactCanvas.Layout).toHaveBeenCalledWith(
        expect.objectContaining({
          fit: 'contain',
        }),
      );
    });

    it('uses Fit.Cover for fullscreen environment', () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(mockedRiveReactCanvas.Layout).toHaveBeenCalledWith(
        expect.objectContaining({
          fit: 'cover',
        }),
      );
    });
  });

  describe('theme support', () => {
    it('uses light theme animation file when theme is light', () => {
      mockedUseTheme.useTheme.mockReturnValue(ThemeType.light);

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(mockedRiveWasmContext.useRiveWasmFile).toHaveBeenCalledWith(
        './images/riv_animations/perps-onboarding-carousel-light.riv',
      );
    });

    it('uses dark theme animation file when theme is dark', () => {
      mockedUseTheme.useTheme.mockReturnValue(ThemeType.dark);

      render(<PerpsTutorialAnimation artboardName="01_Short_Long" />);

      expect(mockedRiveWasmContext.useRiveWasmFile).toHaveBeenCalledWith(
        './images/riv_animations/perps-onboarding-carousel-dark.riv',
      );
    });
  });
});
