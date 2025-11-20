import fs from 'fs-extra';
import path from 'path';

import {
  createTypeMap,
  type StateLogsTypeMap,
} from '../tests/settings/state-logs-helpers';

export type FixtureSchemaDiff = {
  newKeys: string[];
  missingKeys: string[];
  typeMismatches: string[];
};

type JsonLike = Record<string, unknown>;

const sortUnique = (values: string[]): string[] =>
  Array.from(new Set(values)).sort();

const ensureJsonObject = (value: unknown, context: string): JsonLike => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be a JSON object`);
  }
  return value as JsonLike;
};

const toTypeMap = (value: JsonLike): StateLogsTypeMap => createTypeMap(value);

export const readFixtureFile = async (
  relativePath: string,
): Promise<JsonLike> => {
  const filePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(process.cwd(), relativePath);
  const contents = await fs.readJson(filePath);
  return ensureJsonObject(contents, `Fixture at ${filePath}`);
};

export const computeSchemaDiff = (
  baseline: JsonLike,
  candidate: JsonLike,
): FixtureSchemaDiff => {
  const baselineMap = toTypeMap(baseline);
  const candidateMap = toTypeMap(candidate);

  const newKeys = sortUnique(
    Object.keys(candidateMap).filter((key) => !(key in baselineMap)),
  );
  const missingKeys = sortUnique(
    Object.keys(baselineMap).filter((key) => !(key in candidateMap)),
  );
  const typeMismatches = sortUnique(
    Object.keys(candidateMap)
      .filter((key) => key in baselineMap)
      .filter((key) => baselineMap[key] !== candidateMap[key])
      .map(
        (key) =>
          `${key} (expected ${baselineMap[key]}, received ${candidateMap[key]})`,
      ),
  );

  return { newKeys, missingKeys, typeMismatches };
};

export const hasSchemaDifferences = ({
  newKeys,
  missingKeys,
  typeMismatches,
}: FixtureSchemaDiff): boolean =>
  newKeys.length > 0 || missingKeys.length > 0 || typeMismatches.length > 0;

export const formatSchemaDiff = ({
  newKeys,
  missingKeys,
  typeMismatches,
}: FixtureSchemaDiff): string => {
  const messages: string[] = [];

  if (newKeys.length > 0) {
    messages.push(
      ['Detected new keys in wallet state fixture:', ...newKeys.map((key) => `  • ${key}`)].join(
        '\n',
      ),
    );
  }

  if (missingKeys.length > 0) {
    messages.push(
      [
        'Detected missing keys compared to the existing fixture:',
        ...missingKeys.map((key) => `  • ${key}`),
      ].join('\n'),
    );
  }

  if (typeMismatches.length > 0) {
    messages.push(
      [
        'Detected keys with changed types compared to the existing fixture:',
        ...typeMismatches.map((entry) => `  • ${entry}`),
      ].join('\n'),
    );
  }

  if (messages.length === 0) {
    return '';
  }

  messages.push(
    "\nUpdate the fixture locally and commit the change, or request an update by commenting '@metamaskbot update fixture' on the pull request.",
  );

  return messages.join('\n\n');
};

