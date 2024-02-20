import { ResultComponent } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import {
  ResultContext,
  TemplateRendererComponent,
  attachResultContext,
  processError,
  processHeader,
  processString,
} from './util';

const FALLBACK_MESSAGE = 'Fallback Message';
const mockResultComponent: ResultComponent = {
  key: 'mock-key',
  name: 'mock-component',
  properties: { message: 'mock1', message2: 'mock2' },
  children: 'Mock child',
};
const mockResultContext: ResultContext = {
  type: ApprovalType.ResultSuccess,
  onSubmit: new Promise((_resolve, _reject) => {}),
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

const expectedTemplateRendererComponentWithResultContext = {
  ...expectedTemplateRendererComponent,
  props: {
    ...expectedTemplateRendererComponent.props,
    resultContext: mockResultContext,
  },
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
    const result = processString(undefined, FALLBACK_MESSAGE);
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

describe('attachResultContext', () => {
  it('returns undefined when input is not defined', () => {
    const result = attachResultContext(undefined, mockResultContext);
    expect(result).toBeUndefined();
  });

  it('returns component when input is a component', () => {
    const result = attachResultContext(
      processString(mockResultComponent, ''),
      mockResultContext,
    );
    expect(result).toEqual(expectedTemplateRendererComponentWithResultContext);
  });

  it('returns array when input is array', () => {
    const result = attachResultContext(
      processString([mockResultComponent, mockResultComponent], ''),
      mockResultContext,
    );
    expect(result).toEqual([
      expectedTemplateRendererComponentWithResultContext,
      expectedTemplateRendererComponentWithResultContext,
    ]);
  });

  it('submit promise is resolvable', () => {
    let resolveOnSubmit: () => void = () => {
      // noop
    };

    const resultContext: ResultContext = {
      type: ApprovalType.ResultSuccess,
      onSubmit: new Promise((resolve, _reject) => {
        resolveOnSubmit = resolve;
      }),
    };

    const result = attachResultContext(
      processString(mockResultComponent, ''),
      resultContext,
    );

    // Check if the computed component is able to "register" to the
    // main approval onSubmit
    const component = result as TemplateRendererComponent;
    const afterOnSubmit = jest.fn();

    // Retrieve attached context
    const componentResultContext = component.props
      ?.resultContext as ResultContext;
    componentResultContext.onSubmit.then(afterOnSubmit);

    // Resolve the main approval onSubmit
    resolveOnSubmit();
    resultContext.onSubmit.then(() => {
      expect(afterOnSubmit).toBeCalled();
    });
  });
});
