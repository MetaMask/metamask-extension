import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import CL24BenchmarkPanel, {
  CL24_BENCHMARK_BUTTON_TEST_ID,
  CL24_BENCHMARK_COPY_BUTTON_TEST_ID,
  CL24_BENCHMARK_ERROR_TEST_ID,
  CL24_BENCHMARK_RESULT_TEST_ID,
  CL24_BENCHMARK_RUNNING_TEST_ID,
} from './cl24-benchmark-panel';
import { type CL24BenchmarkResult, runCL24Benchmark } from './cl24-benchmark';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock('./cl24-benchmark', () => ({
  ...jest.requireActual('./cl24-benchmark'),
  runCL24Benchmark: jest.fn(),
}));

const mockRunCL24Benchmark = runCL24Benchmark as jest.MockedFunction<
  typeof runCL24Benchmark
>;
const mockUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;

const createResult = (): CL24BenchmarkResult => {
  const statistics = { min: 1, median: 2, max: 3 };
  const sample = {
    keyGeneration: 2,
    initialExport: 2,
    shareRefresh: 2,
    rosterUpdate: 2,
    finalExport: 2,
    total: 10,
  };

  return {
    configuration: {
      curve: 'secp256k1',
      initialPartyCount: 2,
      threshold: 2,
      updatedPartyCount: 3,
      measuredPartyId: 'party-1',
      transport: 'turn-based-local-party-in-memory',
      warmupIterations: 1,
      sampleIterations: 5,
    },
    metadata: {
      appVersion: '13.0.0',
      buildNumber: 'main',
      device: 'Test browser',
      operatingSystem: 'Test OS',
    },
    samples: [sample],
    summary: {
      keyGeneration: statistics,
      initialExport: statistics,
      shareRefresh: statistics,
      rosterUpdate: statistics,
      finalExport: statistics,
      total: statistics,
    },
    timestamp: '2026-09-24T00:00:00.000Z',
  };
};

describe('CL24BenchmarkPanel', () => {
  const copyToClipboard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    mockUseCopyToClipboard.mockReturnValue([false, copyToClipboard, jest.fn()]);
  });

  it('shows progress and renders completed benchmark results', async () => {
    let resolveBenchmark: (result: CL24BenchmarkResult) => void = () =>
      undefined;
    mockRunCL24Benchmark.mockReturnValue(
      new Promise((resolve) => {
        resolveBenchmark = resolve;
      }),
    );
    const { getByTestId, queryByTestId } = render(<CL24BenchmarkPanel />);

    fireEvent.click(getByTestId(CL24_BENCHMARK_BUTTON_TEST_ID));

    expect(getByTestId(CL24_BENCHMARK_RUNNING_TEST_ID)).toBeInTheDocument();

    await act(async () => {
      resolveBenchmark(createResult());
    });

    await waitFor(() =>
      expect(getByTestId(CL24_BENCHMARK_RESULT_TEST_ID)).toBeInTheDocument(),
    );
    expect(
      queryByTestId(CL24_BENCHMARK_RUNNING_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it('copies the machine-readable result', async () => {
    const result = createResult();
    mockRunCL24Benchmark.mockResolvedValue(result);
    const { getByTestId } = render(<CL24BenchmarkPanel />);

    fireEvent.click(getByTestId(CL24_BENCHMARK_BUTTON_TEST_ID));
    await waitFor(() =>
      expect(
        getByTestId(CL24_BENCHMARK_COPY_BUTTON_TEST_ID),
      ).toBeInTheDocument(),
    );
    fireEvent.click(getByTestId(CL24_BENCHMARK_COPY_BUTTON_TEST_ID));

    expect(copyToClipboard).toHaveBeenCalledWith(
      JSON.stringify(result, null, 2),
    );
  });

  it('renders an error when the benchmark rejects', async () => {
    mockRunCL24Benchmark.mockRejectedValue(new Error('Benchmark failed'));
    const { getByTestId } = render(<CL24BenchmarkPanel />);

    fireEvent.click(getByTestId(CL24_BENCHMARK_BUTTON_TEST_ID));

    await waitFor(() =>
      expect(getByTestId(CL24_BENCHMARK_ERROR_TEST_ID)).toHaveTextContent(
        'Benchmark failed',
      ),
    );
  });
});
