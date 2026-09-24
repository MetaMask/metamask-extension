import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  type CL24BenchmarkMetadata,
  type CL24BenchmarkResult,
  type CL24BenchmarkStage,
  runCL24Benchmark,
} from './cl24-benchmark';

export const CL24_BENCHMARK_BUTTON_TEST_ID = 'onboarding-cl24-benchmark-button';
export const CL24_BENCHMARK_RUNNING_TEST_ID =
  'onboarding-cl24-benchmark-running';
export const CL24_BENCHMARK_RESULT_TEST_ID = 'onboarding-cl24-benchmark-result';
export const CL24_BENCHMARK_ERROR_TEST_ID = 'onboarding-cl24-benchmark-error';
export const CL24_BENCHMARK_COPY_BUTTON_TEST_ID =
  'onboarding-cl24-benchmark-copy-button';

const STAGE_LABELS: Record<CL24BenchmarkStage, string> = {
  keyGeneration: 'Keygen',
  initialExport: 'Initial export',
  shareRefresh: 'Refresh',
  rosterUpdate: 'Add party',
  finalExport: 'Final export',
  total: 'Total',
};

function formatMilliseconds(value: number): string {
  return `${value.toFixed(1)} ms`;
}

function formatResult(result: CL24BenchmarkResult): string {
  return (
    Object.entries(result.summary) as [
      CL24BenchmarkStage,
      CL24BenchmarkResult['summary'][CL24BenchmarkStage],
    ][]
  )
    .map(
      ([stage, statistics]) =>
        `${STAGE_LABELS[stage]}: ${formatMilliseconds(statistics.median)} ` +
        `(${formatMilliseconds(statistics.min)}–${formatMilliseconds(statistics.max)})`,
    )
    .join('\n');
}

function getBenchmarkMetadata(): CL24BenchmarkMetadata {
  return {
    appVersion: process.env.METAMASK_VERSION?.toString() ?? 'unknown',
    buildNumber: process.env.METAMASK_BUILD_TYPE?.toString() ?? 'unknown',
    device: globalThis.navigator?.userAgent ?? 'unknown',
    operatingSystem: globalThis.navigator?.platform ?? 'unknown',
  };
}

export const CL24BenchmarkPanel = () => {
  const [result, setResult] = useState<CL24BenchmarkResult>();
  const [error, setError] = useState<string>();
  const [isRunning, setIsRunning] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard({ clearDelayMs: null });

  const metadata = useMemo(() => getBenchmarkMetadata(), []);

  const handleRun = useCallback(async () => {
    setError(undefined);
    setResult(undefined);
    setIsRunning(true);

    try {
      const benchmarkResult = await runCL24Benchmark(metadata);
      setResult(benchmarkResult);
      console.info(
        '[CL24 benchmark]',
        JSON.stringify(benchmarkResult, null, 2),
      );
    } catch (benchmarkError) {
      setError(
        benchmarkError instanceof Error
          ? benchmarkError.message
          : 'Unknown CL24 benchmark error',
      );
    } finally {
      setIsRunning(false);
    }
  }, [metadata]);

  const handleCopy = useCallback(() => {
    if (result) {
      copyToClipboard(JSON.stringify(result, null, 2));
    }
  }, [copyToClipboard, result]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={2}
      alignItems={BoxAlignItems.Center}
    >
      <Button
        variant={ButtonVariant.Secondary}
        size={ButtonSize.Md}
        className="w-full"
        isDisabled={isRunning}
        onClick={handleRun}
        data-testid={CL24_BENCHMARK_BUTTON_TEST_ID}
      >
        {isRunning ? 'Running CL24 benchmark…' : 'Run CL24 benchmark'}
      </Button>

      {isRunning && (
        <Text
          variant={TextVariant.BodySm}
          data-testid={CL24_BENCHMARK_RUNNING_TEST_ID}
        >
          Running…
        </Text>
      )}

      {error && (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.ErrorDefault}
          className="text-center"
          data-testid={CL24_BENCHMARK_ERROR_TEST_ID}
        >
          {error}
        </Text>
      )}

      {result && (
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={2}
          alignItems={BoxAlignItems.Center}
        >
          <Text
            variant={TextVariant.BodyXs}
            className="text-center whitespace-pre-wrap"
            data-testid={CL24_BENCHMARK_RESULT_TEST_ID}
          >
            {`Median (min–max), 5 samples, party-1 CPU\n${formatResult(result)}`}
          </Text>
          <Button
            variant={ButtonVariant.Tertiary}
            size={ButtonSize.Sm}
            onClick={handleCopy}
            data-testid={CL24_BENCHMARK_COPY_BUTTON_TEST_ID}
          >
            Copy benchmark JSON
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CL24BenchmarkPanel;
