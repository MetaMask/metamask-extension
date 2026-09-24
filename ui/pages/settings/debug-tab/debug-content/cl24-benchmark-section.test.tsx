import React from 'react';
import { render } from '@testing-library/react';
import { CL24_BENCHMARK_BUTTON_TEST_ID } from '../../../../components/app/cl24-benchmark/cl24-benchmark-panel';
import CL24BenchmarkSection from './cl24-benchmark-section';

describe('CL24BenchmarkSection', () => {
  const originalValue = process.env.CL24_BENCHMARK_ENABLED;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.CL24_BENCHMARK_ENABLED;
    } else {
      process.env.CL24_BENCHMARK_ENABLED = originalValue;
    }
  });

  it('renders the benchmark panel when CL24_BENCHMARK_ENABLED is "true"', () => {
    process.env.CL24_BENCHMARK_ENABLED = 'true';

    const { getByTestId } = render(<CL24BenchmarkSection />);

    expect(getByTestId(CL24_BENCHMARK_BUTTON_TEST_ID)).toBeInTheDocument();
  });

  it('renders nothing when CL24_BENCHMARK_ENABLED is not set', () => {
    delete process.env.CL24_BENCHMARK_ENABLED;

    const { queryByTestId } = render(<CL24BenchmarkSection />);

    expect(
      queryByTestId(CL24_BENCHMARK_BUTTON_TEST_ID),
    ).not.toBeInTheDocument();
  });
});
