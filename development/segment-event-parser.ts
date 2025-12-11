#!/usr/bin/env ts-node

/**
 * Segment Event Parser and Validator Generator
 *
 * Parses Segment schema events and generates TypeScript validator functions
 * for E2E test validation.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';

interface PropertyDefinition {
  type: string | string[];
  description?: string;
  pattern?: string;
  required?: boolean;
}

interface EventSchema {
  name: string;
  description?: string;
  properties?: Record<string, PropertyDefinition>;
  default_props?: string[];
}

interface PropertySchema {
  name: string;
  properties: Record<string, PropertyDefinition>;
}

interface ParsedProperty {
  name: string;
  type: string | string[];
  required: boolean;
  pattern?: string;
}

interface SchemaLockFile {
  commit: string;
  branch: string;
  lastUpdated: string;
  note?: string;
}

/**
 * Git utilities for schema version control
 */
class GitUtils {
  static getCurrentCommit(repoPath: string): string {
    try {
      return execSync('git rev-parse HEAD', {
        cwd: repoPath,
        encoding: 'utf8',
      }).trim();
    } catch (error) {
      throw new Error(`Failed to get current commit from ${repoPath}`);
    }
  }

  static getCurrentBranch(repoPath: string): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: repoPath,
        encoding: 'utf8',
      }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  static checkoutCommit(repoPath: string, commit: string): void {
    try {
      execSync(`git checkout ${commit}`, {
        cwd: repoPath,
        stdio: 'pipe',
      });
    } catch (error) {
      throw new Error(`Failed to checkout commit ${commit} in ${repoPath}`);
    }
  }

  static hasUncommittedChanges(repoPath: string): boolean {
    try {
      const status = execSync('git status --porcelain', {
        cwd: repoPath,
        encoding: 'utf8',
      }).trim();
      return status.length > 0;
    } catch (error) {
      return false;
    }
  }
}

class SegmentEventParser {
  private schemaPath: string;
  private lockFilePath: string;

  constructor(schemaPath: string, projectRoot: string) {
    this.schemaPath = schemaPath;
    this.lockFilePath = path.join(projectRoot, '.segment-schema.lock');
  }

  /**
   * Read the schema lockfile
   */
  private readLockFile(): SchemaLockFile | null {
    if (!fs.existsSync(this.lockFilePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.lockFilePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Warning: Could not read lockfile, will create new one');
      return null;
    }
  }

  /**
   * Write the schema lockfile
   */
  private writeLockFile(lockData: SchemaLockFile): void {
    fs.writeFileSync(
      this.lockFilePath,
      JSON.stringify(lockData, null, 2) + '\n',
      'utf8'
    );
  }

  /**
   * Get or initialize schema version
   */
  private getSchemaVersion(updateSchema: boolean, overrideCommit?: string): {
    commit: string;
    branch: string;
    isNewVersion: boolean;
  } {
    const currentCommit = GitUtils.getCurrentCommit(this.schemaPath);
    const currentBranch = GitUtils.getCurrentBranch(this.schemaPath);

    if (overrideCommit) {
      return {
        commit: overrideCommit,
        branch: currentBranch,
        isNewVersion: false,
      };
    }

    const lockFile = this.readLockFile();

    if (updateSchema || !lockFile || !lockFile.commit) {
      // Update to current commit
      return {
        commit: currentCommit,
        branch: currentBranch,
        isNewVersion: true,
      };
    }

    // Use locked commit
    return {
      commit: lockFile.commit,
      branch: lockFile.branch,
      isNewVersion: false,
    };
  }

  /**
   * Find event YAML file by event name (searches by 'name' field, not filename)
   */
  private findEventFile(eventName: string): string | null {
    const eventsDir = path.join(this.schemaPath, 'libraries', 'events');

    const searchDirectory = (dir: string): string | null => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const result = searchDirectory(fullPath);
          if (result) return result;
        } else if (entry.isFile() && entry.name.endsWith('.yaml')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const parsed = yaml.load(content) as EventSchema;
            if (parsed.name === eventName) {
              return fullPath;
            }
          } catch (error) {
            // Skip files that can't be parsed
            continue;
          }
        }
      }

      return null;
    };

    return searchDirectory(eventsDir);
  }

  /**
   * Parse event YAML file
   */
  private parseEventFile(filePath: string): EventSchema {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content) as EventSchema;
  }

  /**
   * Parse property YAML file
   */
  private parsePropertyFile(propertyName: string): PropertySchema | null {
    const propertyPath = path.join(
      this.schemaPath,
      'libraries',
      'properties',
      `${propertyName}.yaml`
    );

    if (!fs.existsSync(propertyPath)) {
      console.warn(`Warning: Property file not found: ${propertyName}.yaml`);
      return null;
    }

    const content = fs.readFileSync(propertyPath, 'utf8');
    const parsed = yaml.load(content) as PropertySchema;
    return parsed;
  }

  /**
   * Collect all properties for an event (event properties + default_props)
   */
  private collectProperties(event: EventSchema): Record<string, ParsedProperty> {
    const allProperties: Record<string, ParsedProperty> = {};

    // First, collect properties from default_props
    if (event.default_props) {
      for (const propName of event.default_props) {
        const propSchema = this.parsePropertyFile(propName);
        if (propSchema?.properties) {
          for (const [key, value] of Object.entries(propSchema.properties)) {
            allProperties[key] = {
              name: key,
              type: value.type,
              required: value.required || false,
              pattern: value.pattern,
            };
          }
        }
      }
    }

    // Then, override with event-specific properties (more specific)
    if (event.properties) {
      for (const [key, value] of Object.entries(event.properties)) {
        allProperties[key] = {
          name: key,
          type: value.type,
          required: value.required || false,
          pattern: value.pattern,
        };
      }
    }

    return allProperties;
  }

  /**
   * Generate TypeScript validator function
   */
  private generateValidator(
    eventName: string,
    properties: Record<string, ParsedProperty>,
    schemaVersion: { commit: string; branch: string }
  ): string {
    const functionName = this.toFunctionName(eventName);
    const requiredProps = Object.values(properties).filter(p => p.required);
    const allProps = Object.values(properties);

    const shortCommit = schemaVersion.commit.substring(0, 7);
    const generatedDate = new Date().toISOString();

    let code = `/**
 * Auto-generated validator for "${eventName}" event
 * Generated from Segment schema
 *
 * Schema version: ${shortCommit} (${schemaVersion.branch})
 * Generated at: ${generatedDate}
 *
 * To regenerate this file, run:
 * yarn tsx development/segment-event-parser.ts \\
 *   --event "${eventName}" \\
 *   --destination ./test/e2e/tests/metrics/helpers
 *
 * To update schema version:
 * yarn tsx development/segment-event-parser.ts \\
 *   --event "${eventName}" \\
 *   --destination ./test/e2e/tests/metrics/helpers \\
 *   --update-schema
 */

type EventPayload = {
  event: string;
  messageId: string;
  userId?: string;
  anonymousId?: string;
  properties: Record<string, unknown>;
  context?: Record<string, unknown>;
  timestamp?: string;
  type?: string;
};

type AssertionFunction = (event: EventPayload, errors?: string[]) => void;

/**
 * Validates a "${eventName}" event payload
 * @param event - The event payload to validate (full event object with properties nested)
 * @param assertFn - Optional assertion function(s) to handle validation.
 *                   Can be a single function or array of functions.
 *                   Each function receives the event payload and optional array of validation errors.
 *                   If not provided, throws Error if there are validation errors.
 */
export function ${functionName}(
  event: EventPayload,
  assertFn?: AssertionFunction | AssertionFunction[]
): void {
  const errors: string[] = [];

  // Check required properties
`;

    // Add required property checks
    for (const prop of requiredProps) {
      code += `  if (event.properties.${prop.name} === undefined || event.properties.${prop.name} === null) {\n`;
      code += `    errors.push('Required property "${prop.name}" is missing');\n`;
      code += `  }\n`;
    }

    code += `\n  // Validate property types\n`;

    // Add type validation for all properties
    for (const prop of allProps) {
      const typeCheck = this.generateTypeCheck(prop);
      code += `  // ${prop.name} (${prop.required ? 'required' : 'optional'})\n`;
      code += `  if (event.properties.${prop.name} !== undefined && event.properties.${prop.name} !== null) {\n`;
      code += `    ${typeCheck}\n`;
      code += `  }\n\n`;
    }

    code += `  // Handle validation errors\n`;
    code += `  // Always check schema validation first\n`;
    code += `  if (errors.length > 0 && !assertFn) {\n`;
    code += `    // No custom assertions: throw immediately\n`;
    code += `    throw new Error(\`Validation failed for "${eventName}" event:\\n\${errors.join('\\n')}\`);\n`;
    code += `  }\n\n`;
    code += `  if (assertFn) {\n`;
    code += `    // Check schema validation before running custom assertions\n`;
    code += `    if (errors.length > 0) {\n`;
    code += `      throw new Error(\`Schema validation failed for "${eventName}" event:\\n\${errors.join('\\n')}\`);\n`;
    code += `    }\n\n`;
    code += `    // Schema is valid, run custom assertion function(s)\n`;
    code += `    const assertions = Array.isArray(assertFn) ? assertFn : [assertFn];\n`;
    code += `    assertions.forEach(fn => fn(event, errors));\n`;
    code += `  }\n`;
    code += `}\n`;

    return code;
  }

  /**
   * Generate type check code for a property
   */
  private generateTypeCheck(prop: ParsedProperty): string {
    const types = Array.isArray(prop.type) ? prop.type : [prop.type];

    // Filter out NULL type for checking
    const checkTypes = types.filter(t => t !== 'NULL' && t !== null);

    if (checkTypes.length === 0) {
      return `// Type check skipped (NULL allowed)`;
    }

    const checks: string[] = [];

    for (const type of checkTypes) {
      switch (type) {
        case 'string':
          checks.push(`typeof event.properties.${prop.name} === 'string'`);
          break;
        case 'number':
        case 'integer':
          checks.push(`typeof event.properties.${prop.name} === 'number'`);
          break;
        case 'boolean':
          checks.push(`typeof event.properties.${prop.name} === 'boolean'`);
          break;
        case 'array':
          checks.push(`Array.isArray(event.properties.${prop.name})`);
          break;
        case 'object':
          checks.push(`typeof event.properties.${prop.name} === 'object'`);
          break;
        default:
          checks.push(`typeof event.properties.${prop.name} === 'string'`); // Default to string
      }
    }

    const condition = checks.join(' || ');
    return `if (!(${condition})) {
      errors.push('Property "${prop.name}" has invalid type. Expected: ${checkTypes.join(' or ')}');
    }`;
  }

  /**
   * Convert event name to function name
   */
  private toFunctionName(eventName: string): string {
    return 'validate' + eventName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Convert event name to filename
   */
  private toFileName(eventName: string): string {
    return 'validate-' + eventName
      .toLowerCase()
      .replace(/\s+/g, '-') + '.ts';
  }

  /**
   * Main parsing and generation logic
   */
  public async generate(
    eventName: string,
    destination: string,
    options: {
      updateSchema?: boolean;
      overrideCommit?: string;
    } = {}
  ): Promise<void> {
    console.log(`Searching for event: "${eventName}"...`);

    // Get schema version
    const version = this.getSchemaVersion(
      options.updateSchema || false,
      options.overrideCommit
    );

    console.log(`Using schema version: ${version.commit.substring(0, 7)} (${version.branch})`);

    // Check for uncommitted changes
    if (GitUtils.hasUncommittedChanges(this.schemaPath)) {
      console.warn('⚠️  Warning: Schema repository has uncommitted changes');
    }

    // Store original commit to restore later
    const originalCommit = GitUtils.getCurrentCommit(this.schemaPath);

    try {
      // Checkout the locked version
      if (version.commit !== originalCommit) {
        console.log(`Checking out commit ${version.commit.substring(0, 7)}...`);
        GitUtils.checkoutCommit(this.schemaPath, version.commit);
      }

      // Find event file
      const eventFile = this.findEventFile(eventName);
      if (!eventFile) {
        throw new Error(`Event "${eventName}" not found in schema`);
      }

      console.log(`Found event at: ${eventFile}`);

      // Parse event
      const event = this.parseEventFile(eventFile);
      console.log(`Parsing event with ${event.default_props?.length || 0} default_props...`);

      // Collect all properties
      const properties = this.collectProperties(event);
      const propCount = Object.keys(properties).length;
      const requiredCount = Object.values(properties).filter(p => p.required).length;
      console.log(`Collected ${propCount} properties (${requiredCount} required)`);

      // Generate validator
      const code = this.generateValidator(eventName, properties, version);

      // Write to destination
      const fileName = this.toFileName(eventName);
      const outputPath = path.join(destination, fileName);
      fs.writeFileSync(outputPath, code, 'utf8');

      console.log(`✓ Generated validator: ${outputPath}`);
      console.log(`  Function: ${this.toFunctionName(eventName)}(event)`);

      // Update lockfile if this is a new version
      if (version.isNewVersion) {
        const lockData: SchemaLockFile = {
          commit: version.commit,
          branch: version.branch,
          lastUpdated: new Date().toISOString(),
          note: 'This file locks the segment-schema version used for generating event validators. Update with --update-schema flag.',
        };
        this.writeLockFile(lockData);
        console.log(`✓ Updated lockfile to commit ${version.commit.substring(0, 7)}`);
      }
    } finally {
      // Restore original commit if we changed it
      if (version.commit !== originalCommit) {
        console.log(`Restoring to commit ${originalCommit.substring(0, 7)}...`);
        GitUtils.checkoutCommit(this.schemaPath, originalCommit);
      }
    }
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);

  let schemaPath = '';
  let eventName = '';
  let destination = '';
  let updateSchema = false;
  let overrideCommit = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--schema' && args[i + 1]) {
      schemaPath = args[i + 1];
      i++;
    } else if (args[i] === '--event' && args[i + 1]) {
      eventName = args[i + 1];
      i++;
    } else if (args[i] === '--destination' && args[i + 1]) {
      destination = args[i + 1];
      i++;
    } else if (args[i] === '--update-schema') {
      updateSchema = true;
    } else if (args[i] === '--schema-commit' && args[i + 1]) {
      overrideCommit = args[i + 1];
      i++;
    }
  }

  // Get project root (where lockfile lives)
  const projectRoot = process.cwd();

  if (!schemaPath || !eventName || !destination) {
    console.error('Usage: yarn tsx development/segment-event-parser.ts [OPTIONS]');
    console.error('\nRequired:');
    console.error('  --schema <path>        Path to segment-schema repository');
    console.error('  --event <name>         Event name to generate validator for');
    console.error('  --destination <path>   Where to save the generated validator');
    console.error('\nOptional:');
    console.error('  --update-schema        Update lockfile to latest schema commit');
    console.error('  --schema-commit <hash> Override to use specific commit (for testing)');
    console.error('\nExamples:');
    console.error('  # Generate with locked schema version:');
    console.error('  yarn tsx development/segment-event-parser.ts \\');
    console.error('    --schema ~/segment-schema \\');
    console.error('    --event "Transaction Finalized" \\');
    console.error('    --destination ./test/e2e/tests/metrics/helpers');
    console.error('');
    console.error('  # Update to latest schema:');
    console.error('  yarn tsx development/segment-event-parser.ts \\');
    console.error('    --schema ~/segment-schema \\');
    console.error('    --event "Transaction Finalized" \\');
    console.error('    --destination ./test/e2e/tests/metrics/helpers \\');
    console.error('    --update-schema');
    console.error('');
    console.error('  # Test with specific commit:');
    console.error('  yarn tsx development/segment-event-parser.ts \\');
    console.error('    --schema ~/segment-schema \\');
    console.error('    --event "Transaction Finalized" \\');
    console.error('    --destination ./test/e2e/tests/metrics/helpers \\');
    console.error('    --schema-commit abc1234');
    process.exit(1);
  }

  // Ensure destination directory exists
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const parser = new SegmentEventParser(schemaPath, projectRoot);
  await parser.generate(eventName, destination, {
    updateSchema,
    overrideCommit: overrideCommit || undefined,
  });
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});

