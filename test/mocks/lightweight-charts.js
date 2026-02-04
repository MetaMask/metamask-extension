/* eslint-env jest */
/**
 * Mock for lightweight-charts library
 * This mock provides stub implementations for Jest tests since the actual
 * library requires browser/canvas APIs that aren't available in the test environment.
 */

const mockSeries = {
  setData: jest.fn(),
  update: jest.fn(),
  applyOptions: jest.fn(),
  priceScale: jest.fn().mockReturnValue({
    applyOptions: jest.fn(),
  }),
};

const mockTimeScale = {
  fitContent: jest.fn(),
  setVisibleRange: jest.fn(),
  setVisibleLogicalRange: jest.fn(),
  getVisibleRange: jest.fn().mockReturnValue({ from: 0, to: 100 }),
  getVisibleLogicalRange: jest.fn().mockReturnValue({ from: 0, to: 100 }),
  applyOptions: jest.fn(),
  scrollToPosition: jest.fn(),
  scrollToRealTime: jest.fn(),
  subscribeVisibleTimeRangeChange: jest.fn(),
  subscribeVisibleLogicalRangeChange: jest.fn(),
  unsubscribeVisibleTimeRangeChange: jest.fn(),
  unsubscribeVisibleLogicalRangeChange: jest.fn(),
};

// Factory to create new series mock instances
const createMockSeries = () => ({
  setData: jest.fn(),
  update: jest.fn(),
  applyOptions: jest.fn(),
  priceScale: jest.fn().mockReturnValue({
    applyOptions: jest.fn(),
  }),
});

const mockChart = {
  // v5 API: addSeries(SeriesType, options, paneIndex?)
  addSeries: jest.fn().mockImplementation(() => createMockSeries()),
  // Legacy v4 API methods (kept for compatibility)
  addCandlestickSeries: jest.fn().mockReturnValue(mockSeries),
  addHistogramSeries: jest.fn().mockReturnValue(mockSeries),
  addLineSeries: jest.fn().mockReturnValue(mockSeries),
  addAreaSeries: jest.fn().mockReturnValue(mockSeries),
  addBarSeries: jest.fn().mockReturnValue(mockSeries),
  addBaselineSeries: jest.fn().mockReturnValue(mockSeries),
  removeSeries: jest.fn(),
  timeScale: jest.fn().mockReturnValue(mockTimeScale),
  priceScale: jest.fn().mockReturnValue({
    applyOptions: jest.fn(),
  }),
  applyOptions: jest.fn(),
  resize: jest.fn(),
  remove: jest.fn(),
  subscribeCrosshairMove: jest.fn(),
  unsubscribeCrosshairMove: jest.fn(),
  subscribeClick: jest.fn(),
  unsubscribeClick: jest.fn(),
};

export const createChart = jest.fn().mockReturnValue(mockChart);
export const CandlestickSeries = 'CandlestickSeries';
export const HistogramSeries = 'HistogramSeries';
export const LineSeries = 'LineSeries';
export const AreaSeries = 'AreaSeries';
export const BarSeries = 'BarSeries';
export const BaselineSeries = 'BaselineSeries';

// Re-export for tests that need to access the mock
export const __mockChart = mockChart;
export const __mockSeries = mockSeries;
export const __mockTimeScale = mockTimeScale;
export const __createMockSeries = createMockSeries;
