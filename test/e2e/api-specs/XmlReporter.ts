import fs from 'fs';
import path from 'path';
import { Call, IOptions } from '@open-rpc/test-coverage/build/coverage';
import Reporter from '@open-rpc/test-coverage/build/reporters/reporter';

/**
 * XML/JUnit reporter for @open-rpc/test-coverage
 * Generates JUnit-compatible XML output for CI integration
 */
class XmlReporter implements Reporter {
  private outputPath: string;

  private testSuiteName: string;

  constructor(options: { outputPath?: string; testSuiteName?: string } = {}) {
    // Use environment variable or provided path, with fallback to current directory
    const defaultPath = process.env.XML_OUTPUT_PATH || './api-specs.xml';
    this.outputPath = options.outputPath || defaultPath;
    this.testSuiteName = options.testSuiteName || 'API Specs Coverage';
  }

  onBegin(_options: IOptions, _calls: Call[]): void {
    // Ensure output directory exists
    this.ensureDirectoryExists();
  }

  onTestBegin(_options: IOptions, _call: Call): void {
    // Not needed for XML output
  }

  onTestEnd(_options: IOptions, _call: Call): void {
    // Not needed for XML output
  }

  onEnd(_options: IOptions, calls: Call[]): void {
    // Ensure output directory exists (in case onBegin wasn't called)
    this.ensureDirectoryExists();

    const xml = this.generateXml(calls);
    fs.writeFileSync(this.outputPath, xml, 'utf8');
    console.log(`XML report written to: ${this.outputPath}`);
  }

  private ensureDirectoryExists(): void {
    const dir = path.dirname(this.outputPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  private generateXml(calls: Call[]): string {
    const totalTests = calls.length;
    const failedTests = calls.filter((call) => !call.valid).length;

    // Calculate total time from timings if available
    const totalTime =
      calls.reduce((acc, call) => {
        if (call.timings?.startTime && call.timings?.endTime) {
          return acc + (call.timings.endTime - call.timings.startTime);
        }
        return acc;
      }, 0) / 1000; // Convert to seconds

    const timestamp = new Date().toISOString();

    // Get job properties from environment (same as regular e2e tests)
    const jobName = process.env.JOB_NAME || '';
    const runId = process.env.RUN_ID || '';
    const prNumber = process.env.PR_NUMBER || '';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="Mocha Tests" time="${totalTime.toFixed(3)}" tests="${totalTests}" failures="${failedTests}">\n`;

    // Add Root Suite (empty, like in Mocha format)
    xml += `  <testsuite name="Root Suite" timestamp="${timestamp}" tests="0" time="0.000" failures="0">\n`;
    xml += `    <properties>\n`;
    xml += `      <property name="JOB_NAME" value="${this.escapeXml(jobName)}"/>\n`;
    xml += `      <property name="RUN_ID" value="${this.escapeXml(runId)}"/>\n`;
    xml += `      <property name="PR_NUMBER" value="${this.escapeXml(prNumber)}"/>\n`;
    xml += `    </properties>\n`;
    xml += `  </testsuite>\n`;

    // Add the actual test suite
    xml += `  <testsuite name="${this.escapeXml(this.testSuiteName)}" timestamp="${timestamp}" tests="${totalTests}" file="api-specs-coverage" time="${totalTime.toFixed(3)}" failures="${failedTests}">\n`;
    xml += `    <properties>\n`;
    xml += `      <property name="JOB_NAME" value="${this.escapeXml(jobName)}"/>\n`;
    xml += `      <property name="RUN_ID" value="${this.escapeXml(runId)}"/>\n`;
    xml += `      <property name="PR_NUMBER" value="${this.escapeXml(prNumber)}"/>\n`;
    xml += `    </properties>\n`;

    for (const call of calls) {
      const testName = this.escapeXml(
        call.title || call.methodName || 'Unknown Test',
      );
      const className = this.escapeXml(call.methodName || 'UnknownMethod');

      // Calculate test time from timings if available
      const time =
        call.timings?.startTime && call.timings?.endTime
          ? (call.timings.endTime - call.timings.startTime) / 1000
          : 0;

      xml += `    <testcase name="${testName}" time="${time.toFixed(3)}" classname="${className}"`;

      if (call.valid) {
        xml += '/>\n';
      } else {
        xml += '>\n';
        const errorMessage = this.escapeXml(
          call.error?.message || call.reason || 'Test failed',
        );
        const errorType = call.error?.code
          ? `Error${call.error.code}`
          : 'AssertionError';

        // Use CDATA format like Mocha does
        xml += `      <failure message="${errorMessage}" type="${errorType}"><![CDATA[${errorMessage}]]></failure>\n`;
        xml += `    </testcase>\n`;
      }
    }

    xml += `  </testsuite>\n`;
    xml += `</testsuites>\n`;

    return xml;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/gu, '&amp;')
      .replace(/</gu, '&lt;')
      .replace(/>/gu, '&gt;')
      .replace(/"/gu, '&quot;')
      .replace(/'/gu, '&apos;');
  }
}

export default XmlReporter;
