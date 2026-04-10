import path from 'node:path';
import type { Compiler } from 'webpack';
import { WEBPACK_BUNDLE_ANALYZER_REPORT } from '../../../../lib/bundle-size';

const NAME = 'BundleAnalyzerReportPlugin';

const bundleAnalyzerStatsOptions = {
  all: false,
  assets: true,
  cachedAssets: false,
  chunkModules: true,
  chunkRelations: false,
  chunks: true,
  dependentModules: false,
  entrypoints: true,
  ids: true,
  modules: true,
  nestedModules: true,
  optimizationBailout: false,
  providedExports: false,
  reasons: false,
  source: false,
  timings: false,
  usedExports: false,
};

type BundleAnalyzerViewer = {
  generateReport: (
    stats: Record<string, unknown>,
    options: {
      bundleDir: string | null;
      compressionAlgorithm?: string;
      defaultSizes?: string;
      logger: Pick<Console, 'debug' | 'error' | 'info'>;
      openBrowser: boolean;
      reportFilename: string;
      reportTitle?: string;
    },
  ) => Promise<void>;
};

function getViewer(): BundleAnalyzerViewer {
  return require('webpack-bundle-analyzer/lib/viewer') as BundleAnalyzerViewer;
}

export class BundleAnalyzerReportPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.done.tapPromise(NAME, async (stats) => {
      if (stats.hasErrors()) {
        return;
      }

      await getViewer().generateReport(
        stats.toJson(bundleAnalyzerStatsOptions),
        {
          bundleDir: compiler.outputPath,
          compressionAlgorithm: 'gzip',
          logger: compiler.getInfrastructureLogger(NAME),
          defaultSizes: 'parsed',
          openBrowser: false,
          reportFilename: path.resolve(
            compiler.outputPath,
            WEBPACK_BUNDLE_ANALYZER_REPORT,
          ),
          reportTitle: String(
            compiler.options.name ?? 'Webpack Bundle Analyzer',
          ),
        },
      );
    });
  }
}
