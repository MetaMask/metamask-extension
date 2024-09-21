import { ResultComponent } from '@metamask/approval-controller';
import { processError, processHeader, processString } from './util';

const FALLBACK_MESSAGE = 'Fallback Message';
const mockResultComponent: ResultComponent = {
  key: 'mock-key',
  name: 'mock-component',
  properties: { message: 'mock1', message2: 'mock2' },
  children: 'Mock child',
};

const expectedTemplateRendererComponent = {
  key: 'mock-key',
  props: {
    message: 'mock1',
    message2: 'mock2',
  },
  children: 'Mock child',
  element: 'mock-component',
};

describe('processError', () => {
  it('returns TemplateRendererComponent when input is not defined', () => {
    const result = processError(undefined, FALLBACK_MESSAGE);
    expect(result).toEqual({
      key: 'error',
      element: 'ActionableMessage',
      props: { type: 'danger', message: FALLBACK_MESSAGE },
    });
  });

  it('returns TemplateRendererComponent when input is a string', () => {
    const result = processError('Error Message', FALLBACK_MESSAGE);
    expect(result).toEqual({
      key: 'error',
      element: 'ActionableMessage',
      props: { type: 'danger', message: 'Error Message' },
    });
  });

  it('returns TemplateRendererComponent when input is a ResultComponent', () => {
    const result = processError(mockResultComponent, FALLBACK_MESSAGE);
    expect(result).toEqual(expectedTemplateRendererComponent);
  });
});

describe('processString', () => {
  it('returns string when input is not defined', () => {
    const result = processString(undefined, FALLBACK_MESSAGE) as string[];
    expect(result[0]).toEqual(FALLBACK_MESSAGE);
  });

  it('returns TemplateRendererComponent when input is a string', () => {
    const result = processString('Hello', FALLBACK_MESSAGE);
    expect(result).toEqual(['Hello']);
  });

  it('returns TemplateRendererComponent when input is a ResultComponent', () => {
    const result = processString(mockResultComponent, FALLBACK_MESSAGE);
    expect(result).toEqual(expectedTemplateRendererComponent);
  });
});

describe('processHeader', () => {
  it('returns undefined when input is not defined', () => {
    const result = processHeader(undefined);
    expect(result).toBeUndefined();
  });

  it('returns array when input is array', () => {
    const result = processHeader(['Hello', mockResultComponent]);
    expect(result).toEqual(['Hello', expectedTemplateRendererComponent]);
  });
});
