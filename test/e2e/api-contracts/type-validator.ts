// TypeScript compiler type and symbol flags are bit masks.
/* eslint-disable no-bitwise */
import path from 'path';
import ts from 'typescript';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const DEFAULT_TSCONFIG_PATH = path.join(REPO_ROOT, 'tsconfig.json');
export const DEFAULT_CONSUMER_TYPES_PATH = path.join(
  __dirname,
  'consumer-types.ts',
);
const CONSUMER_TYPE_MAP_NAME = 'ApiConsumerTypes';
const MAX_VALUE_PREVIEW_LENGTH = 120;

export type TypeMismatch = {
  /** JSONPath-like location of the mismatch, e.g. `$.items[0].fields.headline`. */
  path: string;
  message: string;
};

export type ConsumerTypeValidator = {
  /** Names of the consumer types declared in `ApiConsumerTypes`. */
  typeNames: string[];
  /**
   * Validates a JSON value against a consumer type.
   *
   * Extra properties that the consumer type does not declare are allowed:
   * the wallet ignores them, so they cannot break it.
   *
   * @param typeName - A key of `ApiConsumerTypes`.
   * @param value - The parsed JSON value (mock payload or live response).
   * @returns Every location where the value does not satisfy the type.
   */
  validate: (typeName: string, value: unknown) => TypeMismatch[];
  /**
   * Renders a consumer type for reports.
   *
   * @param typeName - A key of `ApiConsumerTypes`.
   */
  describeType: (typeName: string) => string;
};

type ValidatorOptions = {
  consumerTypesPath?: string;
  tsconfigPath?: string;
};

function formatPathSegment(key: string): string {
  return /^[A-Za-z_$][\w$]*$/u.test(key)
    ? `.${key}`
    : `[${JSON.stringify(key)}]`;
}

function describeValue(value: unknown): string {
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  const kind = Array.isArray(value) ? 'array' : typeof value;
  const preview = JSON.stringify(value);
  if (preview === undefined) {
    return kind;
  }
  const truncated =
    preview.length > MAX_VALUE_PREVIEW_LENGTH
      ? `${preview.slice(0, MAX_VALUE_PREVIEW_LENGTH)}…`
      : preview;
  return `${kind} ${truncated}`;
}

function dedupe(mismatches: TypeMismatch[]): TypeMismatch[] {
  const seen = new Set<string>();
  return mismatches.filter((mismatch) => {
    const key = `${mismatch.path}\u0000${mismatch.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function loadCompilerOptions(tsconfigPath: string): ts.CompilerOptions {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'),
    );
  }
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
  );
  return {
    ...parsed.options,
    noEmit: true,
    incremental: false,
    skipLibCheck: true,
  };
}

/**
 * Creates a validator that checks JSON values against the TypeScript types the
 * wallet uses to consume API responses (see `consumer-types.ts`).
 *
 * The types are resolved with the TypeScript compiler, so the validator always
 * reflects the currently installed packages and wallet code: there is no
 * hand-maintained schema to keep in sync.
 *
 * @param options - Validator options.
 * @param options.consumerTypesPath - File exporting the `ApiConsumerTypes` map.
 * @param options.tsconfigPath - tsconfig used to resolve the consumer types.
 * @returns The validator.
 */
export function createConsumerTypeValidator({
  consumerTypesPath = DEFAULT_CONSUMER_TYPES_PATH,
  tsconfigPath = DEFAULT_TSCONFIG_PATH,
}: ValidatorOptions = {}): ConsumerTypeValidator {
  const program = ts.createProgram({
    rootNames: [consumerTypesPath],
    options: loadCompilerOptions(tsconfigPath),
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(consumerTypesPath);
  if (!sourceFile) {
    throw new Error(`Unable to load consumer types from ${consumerTypesPath}`);
  }

  const diagnostics = ts.getPreEmitDiagnostics(program, sourceFile);
  if (diagnostics.length > 0) {
    throw new Error(
      `Consumer types do not compile:\n${ts.formatDiagnostics(diagnostics, {
        getCanonicalFileName: (fileName) => fileName,
        getCurrentDirectory: () => REPO_ROOT,
        getNewLine: () => '\n',
      })}`,
    );
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
  const mapSymbol = moduleSymbol
    ? checker
        .getExportsOfModule(moduleSymbol)
        .find((symbol) => symbol.getName() === CONSUMER_TYPE_MAP_NAME)
    : undefined;
  if (!mapSymbol) {
    throw new Error(
      `${consumerTypesPath} must export a \`${CONSUMER_TYPE_MAP_NAME}\` type`,
    );
  }
  const consumerTypeMap = checker.getDeclaredTypeOfSymbol(mapSymbol);
  const consumerTypes = new Map<string, ts.Type>(
    checker
      .getPropertiesOfType(consumerTypeMap)
      .map((property) => [
        property.getName(),
        checker.getTypeOfSymbol(property),
      ]),
  );

  const typeToString = (type: ts.Type) =>
    checker.typeToString(
      type,
      undefined,
      ts.TypeFormatFlags.NoTruncation |
        ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope,
    );

  const mismatch = (
    valuePath: string,
    type: ts.Type,
    value: unknown,
  ): TypeMismatch[] => [
    {
      path: valuePath,
      message: `expected ${typeToString(type)}, received ${describeValue(value)}`,
    },
  ];

  const isStringLike = (type: ts.Type) =>
    Boolean(
      type.flags &
      (ts.TypeFlags.String |
        ts.TypeFlags.TemplateLiteral |
        ts.TypeFlags.StringMapping),
    );

  /**
   * Whether a union member describes the same kind of JSON value (array,
   * object or primitive) as the value, e.g. `State[]` rather than `undefined`
   * for an array assigned to an optional `states?: State[]` property.
   *
   * @param value - The value being validated.
   * @param member - A union member.
   * @returns True when the kinds match.
   */
  function isSameJsonKind(value: unknown, member: ts.Type): boolean {
    const isObjectMember = Boolean(
      member.flags & (ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive),
    );
    const isArrayMember =
      checker.isArrayType(member) || checker.isTupleType(member);
    if (Array.isArray(value)) {
      return isArrayMember;
    }
    if (value !== null && typeof value === 'object') {
      return isObjectMember && !isArrayMember;
    }
    return !isObjectMember;
  }

  /**
   * Counts the literal-typed properties (e.g. `success: true`) of a union
   * member that the value contradicts, so that discriminated unions report
   * mismatches against the variant the value claims to be.
   *
   * @param value - The value being validated.
   * @param member - A union member.
   * @returns The number of contradicted discriminant properties.
   */
  function countDiscriminantConflicts(value: unknown, member: ts.Type): number {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return 0;
    }
    const record = value as Record<string, unknown>;
    return checker.getPropertiesOfType(member).filter((property) => {
      const key = property.getName();
      if (!Object.hasOwn(record, key)) {
        return false;
      }
      const propertyType = checker.getTypeOfSymbol(property);
      const isUnitLiteral =
        propertyType.isLiteral() ||
        Boolean(propertyType.flags & ts.TypeFlags.BooleanLiteral);
      return (
        isUnitLiteral &&
        validateValue(record[key], propertyType, '$').length > 0
      );
    }).length;
  }

  function validateUnion(
    value: unknown,
    type: ts.UnionType,
    valuePath: string,
  ): TypeMismatch[] {
    let closest: { score: number; mismatches: TypeMismatch[] } | undefined;
    for (const member of type.types) {
      const mismatches = validateValue(value, member, valuePath);
      if (mismatches.length === 0) {
        return [];
      }
      const score =
        (isSameJsonKind(value, member) ? 0 : 1_000_000) +
        countDiscriminantConflicts(value, member) * 1_000 +
        mismatches.length;
      if (!closest || score < closest.score) {
        closest = { score, mismatches };
      }
    }
    // For objects, report the mismatches of the closest variant rather than
    // the whole (often huge) union type.
    if (value !== null && typeof value === 'object' && closest) {
      return closest.mismatches;
    }
    return mismatch(valuePath, type, value);
  }

  function validateObject(
    value: unknown,
    type: ts.Type,
    valuePath: string,
  ): TypeMismatch[] {
    if (checker.getSignaturesOfType(type, ts.SignatureKind.Call).length > 0) {
      return mismatch(valuePath, type, value);
    }
    if (checker.isTupleType(type)) {
      if (!Array.isArray(value)) {
        return mismatch(valuePath, type, value);
      }
      const elementTypes = checker.getTypeArguments(type as ts.TypeReference);
      return elementTypes.flatMap((elementType, index) =>
        validateValue(value[index], elementType, `${valuePath}[${index}]`),
      );
    }
    if (checker.isArrayType(type)) {
      if (!Array.isArray(value)) {
        return mismatch(valuePath, type, value);
      }
      const [elementType] = checker.getTypeArguments(type as ts.TypeReference);
      return value.flatMap((element, index) =>
        validateValue(element, elementType, `${valuePath}[${index}]`),
      );
    }
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return mismatch(valuePath, type, value);
    }

    const record = value as Record<string, unknown>;
    const mismatches: TypeMismatch[] = [];
    const declaredKeys = new Set<string>();

    for (const property of checker.getPropertiesOfType(type)) {
      const key = property.getName();
      declaredKeys.add(key);
      const propertyType = checker.getTypeOfSymbol(property);
      const propertyPath = `${valuePath}${formatPathSegment(key)}`;
      if (!Object.hasOwn(record, key)) {
        const isOptional = Boolean(property.flags & ts.SymbolFlags.Optional);
        if (!isOptional) {
          mismatches.push({
            path: propertyPath,
            message: `missing required property (expected ${typeToString(propertyType)})`,
          });
        }
        continue;
      }
      mismatches.push(
        ...validateValue(record[key], propertyType, propertyPath),
      );
    }

    const indexInfos = checker.getIndexInfosOfType(type);
    if (indexInfos.length > 0) {
      for (const [key, entry] of Object.entries(record)) {
        if (declaredKeys.has(key)) {
          continue;
        }
        const indexInfo = indexInfos.find(
          (info) =>
            isStringLike(info.keyType) &&
            (info.keyType.flags & ts.TypeFlags.String ||
              checker.isTypeAssignableTo(
                checker.getStringLiteralType(key),
                info.keyType,
              )),
        );
        if (indexInfo) {
          mismatches.push(
            ...validateValue(
              entry,
              indexInfo.type,
              `${valuePath}${formatPathSegment(key)}`,
            ),
          );
        }
      }
    }

    return mismatches;
  }

  function validateValue(
    value: unknown,
    type: ts.Type,
    valuePath: string,
  ): TypeMismatch[] {
    const { flags } = type;

    if (flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
      return [];
    }
    if (type.isUnion()) {
      return validateUnion(value, type, valuePath);
    }
    if (type.isIntersection()) {
      return dedupe(
        type.types.flatMap((member) => validateValue(value, member, valuePath)),
      );
    }
    if (flags & ts.TypeFlags.Null) {
      return value === null ? [] : mismatch(valuePath, type, value);
    }
    if (flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) {
      return value === undefined ? [] : mismatch(valuePath, type, value);
    }
    if (type.isStringLiteral() || type.isNumberLiteral()) {
      return value === type.value ? [] : mismatch(valuePath, type, value);
    }
    if (flags & ts.TypeFlags.BooleanLiteral) {
      return value === (typeToString(type) === 'true')
        ? []
        : mismatch(valuePath, type, value);
    }
    if (flags & ts.TypeFlags.String) {
      return typeof value === 'string' ? [] : mismatch(valuePath, type, value);
    }
    if (flags & (ts.TypeFlags.TemplateLiteral | ts.TypeFlags.StringMapping)) {
      return typeof value === 'string' &&
        checker.isTypeAssignableTo(checker.getStringLiteralType(value), type)
        ? []
        : mismatch(valuePath, type, value);
    }
    if (flags & ts.TypeFlags.Number) {
      return typeof value === 'number' ? [] : mismatch(valuePath, type, value);
    }
    if (flags & ts.TypeFlags.Boolean) {
      return typeof value === 'boolean' ? [] : mismatch(valuePath, type, value);
    }
    if (flags & ts.TypeFlags.TypeParameter) {
      const constraint = checker.getBaseConstraintOfType(type);
      return constraint ? validateValue(value, constraint, valuePath) : [];
    }
    if (flags & ts.TypeFlags.NonPrimitive) {
      return value !== null && typeof value === 'object'
        ? []
        : mismatch(valuePath, type, value);
    }
    if (flags & ts.TypeFlags.Object) {
      return validateObject(value, type, valuePath);
    }
    // `never`, bigint, symbol and other types cannot be represented in JSON.
    return mismatch(valuePath, type, value);
  }

  const getConsumerType = (typeName: string): ts.Type => {
    const type = consumerTypes.get(typeName);
    if (!type) {
      throw new Error(
        `Unknown consumer type "${typeName}". Add it to ${CONSUMER_TYPE_MAP_NAME} in ${path.relative(REPO_ROOT, consumerTypesPath)}.`,
      );
    }
    return type;
  };

  return {
    typeNames: [...consumerTypes.keys()],
    validate: (typeName, value) =>
      validateValue(value, getConsumerType(typeName), '$'),
    describeType: (typeName) => typeToString(getConsumerType(typeName)),
  };
}
