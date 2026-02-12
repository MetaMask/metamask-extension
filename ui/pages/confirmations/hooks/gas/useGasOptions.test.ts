import { renderHook } from '@testing-library/react-hooks';

import { type GasOption } from '../../types/gas';
import { useAdvancedGasFeeOption } from './useAdvancedGasFeeOption';
import { useGasFeeEstimateLevelOptions } from './useGasFeeEstimateLevelOptions';
import { useGasPriceEstimateOption } from './useGasPriceEstimateOption';
import { useDappSuggestedGasFeeOption } from './useDappSuggestedGasFeeOption';
import { useGasOptions } from './useGasOptions';

jest.mock('./useAdvancedGasFeeOption');
jest.mock('./useGasFeeEstimateLevelOptions');
jest.mock('./useGasPriceEstimateOption');
jest.mock('./useDappSuggestedGasFeeOption');

describe('useGasOptions', () => {
  const mockUseAdvancedGasFeeOption = jest.mocked(useAdvancedGasFeeOption);
  const mockUseGasFeeEstimateLevelOptions = jest.mocked(
    useGasFeeEstimateLevelOptions,
  );
  const mockUseGasPriceEstimateOption = jest.mocked(useGasPriceEstimateOption);
  const mockUseDappSuggestedGasFeeOption = jest.mocked(
    useDappSuggestedGasFeeOption,
  );

  const mockAdvancedOption: GasOption = {
    estimatedTime: '',
    isSelected: false,
    key: 'advanced',
    name: 'Advanced',
    onSelect: jest.fn(),
    value: '10',
    valueInFiat: '$10',
  };

  const mockLowLevelOption: GasOption = {
    estimatedTime: '~1 min',
    isSelected: false,
    key: 'low',
    name: 'Low',
    onSelect: jest.fn(),
    value: '5',
    valueInFiat: '$5',
  };

  const mockMediumLevelOption: GasOption = {
    estimatedTime: '~30 sec',
    isSelected: true,
    key: 'medium',
    name: 'Medium',
    onSelect: jest.fn(),
    value: '10',
    valueInFiat: '$10',
  };

  const mockGasPriceOption: GasOption = {
    estimatedTime: '',
    isSelected: false,
    key: 'gasPrice',
    name: 'Network proposed',
    onSelect: jest.fn(),
    value: '8',
    valueInFiat: '$8',
  };

  const mockDappSuggestedOption: GasOption = {
    estimatedTime: '',
    isSelected: false,
    key: 'site_suggested',
    name: 'Site Suggested',
    onSelect: jest.fn(),
    value: '12',
    valueInFiat: '$12',
  };

  const mockSetActiveModal = jest.fn();
  const mockHandleCloseModals = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns combined options from all hooks when all hooks return options', () => {
    mockUseAdvancedGasFeeOption.mockReturnValue([mockAdvancedOption]);
    mockUseGasFeeEstimateLevelOptions.mockReturnValue([
      mockLowLevelOption,
      mockMediumLevelOption,
    ]);
    mockUseGasPriceEstimateOption.mockReturnValue([mockGasPriceOption]);
    mockUseDappSuggestedGasFeeOption.mockReturnValue([mockDappSuggestedOption]);

    const { result } = renderHook(() =>
      useGasOptions({
        handleCloseModals: mockHandleCloseModals,
        setActiveModal: mockSetActiveModal,
      }),
    );

    expect(mockUseAdvancedGasFeeOption).toHaveBeenCalledWith({
      setActiveModal: mockSetActiveModal,
    });
    expect(mockUseGasFeeEstimateLevelOptions).toHaveBeenCalledWith({
      handleCloseModals: mockHandleCloseModals,
    });
    expect(mockUseGasPriceEstimateOption).toHaveBeenCalledWith({
      handleCloseModals: mockHandleCloseModals,
    });
    expect(mockUseDappSuggestedGasFeeOption).toHaveBeenCalledWith({
      handleCloseModals: mockHandleCloseModals,
    });

    expect(result.current.options.length).toBe(5);
    expect(result.current.options).toEqual([
      mockLowLevelOption,
      mockMediumLevelOption,
      mockGasPriceOption,
      mockDappSuggestedOption,
      mockAdvancedOption,
    ]);
  });

  it('returns options when some hooks return empty arrays', () => {
    mockUseAdvancedGasFeeOption.mockReturnValue([mockAdvancedOption]);
    mockUseGasFeeEstimateLevelOptions.mockReturnValue([]);
    mockUseGasPriceEstimateOption.mockReturnValue([]);
    mockUseDappSuggestedGasFeeOption.mockReturnValue([mockDappSuggestedOption]);

    const { result } = renderHook(() =>
      useGasOptions({
        handleCloseModals: mockHandleCloseModals,
        setActiveModal: mockSetActiveModal,
      }),
    );

    expect(result.current.options.length).toBe(2);
    expect(result.current.options).toEqual([
      mockDappSuggestedOption,
      mockAdvancedOption,
    ]);
  });

  it('returns empty array when all hooks return empty arrays', () => {
    mockUseAdvancedGasFeeOption.mockReturnValue([]);
    mockUseGasFeeEstimateLevelOptions.mockReturnValue([]);
    mockUseGasPriceEstimateOption.mockReturnValue([]);
    mockUseDappSuggestedGasFeeOption.mockReturnValue([]);

    const { result } = renderHook(() =>
      useGasOptions({
        handleCloseModals: mockHandleCloseModals,
        setActiveModal: mockSetActiveModal,
      }),
    );

    expect(result.current.options.length).toBe(0);
    expect(result.current.options).toEqual([]);
  });

  it('maintains the correct order of options from each hook', () => {
    mockUseAdvancedGasFeeOption.mockReturnValue([mockAdvancedOption]);
    mockUseGasFeeEstimateLevelOptions.mockReturnValue([
      mockLowLevelOption,
      mockMediumLevelOption,
    ]);
    mockUseGasPriceEstimateOption.mockReturnValue([mockGasPriceOption]);
    mockUseDappSuggestedGasFeeOption.mockReturnValue([mockDappSuggestedOption]);

    const { result } = renderHook(() =>
      useGasOptions({
        handleCloseModals: mockHandleCloseModals,
        setActiveModal: mockSetActiveModal,
      }),
    );

    expect(result.current.options[0].key).toBe('low');
    expect(result.current.options[1].key).toBe('medium');
    expect(result.current.options[2].key).toBe('gasPrice');
    expect(result.current.options[3].key).toBe('site_suggested');
    expect(result.current.options[4].key).toBe('advanced');
  });
});
