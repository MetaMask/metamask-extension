import { BaseError } from './base';

export type SliceOffsetOutOfBoundsErrorType = SliceOffsetOutOfBoundsError & {
  name: 'SliceOffsetOutOfBoundsError';
};
export class SliceOffsetOutOfBoundsError extends BaseError {
  constructor({
    offset,
    position,
    size,
  }: {
    offset: number;
    position: 'start' | 'end';
    size: number;
  }) {
    super(
      `Slice ${
        position === 'start' ? 'starting' : 'ending'
      } at offset "${offset}" is out-of-bounds (size: ${size}).`,
      { name: 'SliceOffsetOutOfBoundsError' },
    );
  }
}

export type SizeExceedsPaddingSizeErrorType = SizeExceedsPaddingSizeError & {
  name: 'SizeExceedsPaddingSizeError';
};
export class SizeExceedsPaddingSizeError extends BaseError {
  constructor({
    size,
    targetSize,
    type,
  }: {
    size: number;
    targetSize: number;
    type: 'hex' | 'bytes';
  }) {
    super(
      `${type.charAt(0).toUpperCase()}${type
        .slice(1)
        .toLowerCase()} size (${size}) exceeds padding size (${targetSize}).`,
      { name: 'SizeExceedsPaddingSizeError' },
    );
  }
}

export type InvalidBytesLengthErrorType = InvalidBytesLengthError & {
  name: 'InvalidBytesLengthError';
};
export class InvalidBytesLengthError extends BaseError {
  constructor({
    size,
    targetSize,
    type,
  }: {
    size: number;
    targetSize: number;
    type: 'hex' | 'bytes';
  }) {
    super(
      `${type.charAt(0).toUpperCase()}${type
        .slice(1)
        .toLowerCase()} is expected to be ${targetSize} ${type} long, but is ${size} ${type} long.`,
      { name: 'InvalidBytesLengthError' },
    );
  }
}
