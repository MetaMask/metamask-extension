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

  onBegin(options: IOptions, calls: Call[]): void {
    // Ensure output directory exists
    const dir = path.dirname(this.outputPath);
    fs.mkdirSync(dir, { recursive: true });
  }

  onTestBegin(options: IOptions, call: Call): void {
    // Not needed for XML output
  }

  onTestEnd(options: IOptions, call: Call): void {
    // Not needed for XML output
  }

  onEnd(options: IOptions, calls: Call[]): void {
    const xml = this.generateXml(calls);
    fs.writeFileSync(this.outputPath, xml, 'utf8');
    console.log(`XML report written to: ${this.outputPath}`);
  }

  private generateXml(calls: Call[]): string {
    const totalTests = calls.length;
    const failedTests = calls.filter((call) => !call.valid).length;
    const passedTests = totalTests - failedTests;
    
    // Calculate total time from timings if available
    const totalTime = calls.reduce((acc, call) => {
      if (call.timings?.startTime && call.timings?.endTime) {
        return acc + (call.timings.endTime - call.timings.startTime);
      }
      return acc;
    }, 0) / 1000; // Convert to seconds

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="${this.testSuiteName}" tests="${totalTests}" failures="${failedTests}" time="${totalTime.toFixed(3)}">\n`;
    xml += `  <testsuite name="${this.testSuiteName}" tests="${totalTests}" failures="${failedTests}" time="${totalTime.toFixed(3)}">\n`;

    for (const call of calls) {
      const testName = this.escapeXml(
        call.title || call.methodName || 'Unknown Test',
      );
      const className = this.escapeXml(
        `${this.testSuiteName}.${call.methodName || 'UnknownMethod'}`,
      );
      
      // Calculate test time from timings if available
      const time = call.timings?.startTime && call.timings?.endTime 
        ? (call.timings.endTime - call.timings.startTime) / 1000 
        : 0;

      xml += `    <testcase name="${testName}" classname="${className}" time="${time.toFixed(3)}"`;

      if (!call.valid) {
        xml += '>\n';
        const errorMessage = this.escapeXml(
          call.error?.message || call.reason || 'Test failed',
        );
        const errorType = 'AssertionError';
        xml += `      <failure message="${errorMessage}" type="${errorType}">\n`;
        xml += `        ${this.escapeXml(errorMessage)}\n`;
        xml += `      </failure>\n`;
        xml += `    </testcase>\n`;
      } else {
        xml += '/>\n';
      }
    }

    xml += '  </testsuite>\n';
    xml += '</testsuites>\n';

    return xml;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export default XmlReporter;
