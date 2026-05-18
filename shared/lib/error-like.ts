import { hasProperty, isObject } from '@metamask/utils';
import type { ErrorLike } from '../constants/errors';

function getStringProperty(
  object: Record<PropertyKey, unknown>,
  property: string,
): string | undefined {
  return property in object && typeof object[property] === 'string'
    ? object[property]
    : undefined;
}

function serializeErrorCause(
  error: Record<PropertyKey, unknown>,
): ErrorLike['cause'] | undefined {
  if (!hasProperty(error, 'cause') || !error.cause) {
    return undefined;
  }
  if (!isObject(error.cause)) {
    return {
      message: String(error.cause),
    };
  }
  return {
    message: getStringProperty(error.cause, 'message') ?? String(error.cause),
    name: getStringProperty(error.cause, 'name'),
    stack: getStringProperty(error.cause, 'stack'),
  };
}

function serializeSentryTags(
  error: Record<PropertyKey, unknown>,
): ErrorLike['sentryTags'] | undefined {
  if (!hasProperty(error, 'sentryTags') || !isObject(error.sentryTags)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(error.sentryTags).filter(
      (entry): entry is [string, string] => {
        const [, value] = entry;
        return typeof value === 'string';
      },
    ),
  );
}

/**
 * Converts an unknown thrown value into the serializable error shape sent over
 * the raw startup port.
 *
 * @param error - The thrown value to serialize.
 * @returns A serializable error-like object.
 */
export function getErrorLike(error: unknown): ErrorLike {
  if (!isObject(error)) {
    return {
      message: String(error),
      name: 'UnknownError',
      stack: '',
    };
  }

  const cause = serializeErrorCause(error);
  const sentryTags = serializeSentryTags(error);

  return {
    message: getStringProperty(error, 'message') ?? 'Unknown error',
    name: getStringProperty(error, 'name') ?? 'UnknownError',
    stack: getStringProperty(error, 'stack'),
    ...(cause ? { cause } : {}),
    ...(sentryTags && Object.keys(sentryTags).length > 0 ? { sentryTags } : {}),
  };
}
