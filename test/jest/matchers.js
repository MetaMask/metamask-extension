import { shallow, mount } from 'enzyme';

const SHALLOW_WRAPPER_CONSTRUCTOR = 'ShallowWrapper';

function isShallowWrapper(wrapper) {
  return wrapper.constructor.name
    ? wrapper.constructor.name === SHALLOW_WRAPPER_CONSTRUCTOR
    : Boolean(`${wrapper.constructor}`.match(/^function ShallowWrapper\(/u));
}

function toMatchElement(
  actualEnzymeWrapper,
  reactInstance,
  options = { ignoreProps: true },
) {
  const expectedWrapper = isShallowWrapper(actualEnzymeWrapper)
    ? shallow(reactInstance)
    : mount(reactInstance);

  const actual = actualEnzymeWrapper.debug({ verbose: true, ...options });
  const expected = expectedWrapper.debug({ verbose: true, ...options });
  const pass = actual === expected;

  return {
    pass,
    message: 'Expected actual value to match the expected value.',
    negatedMessage: 'Did not expect actual value to match the expected value.',
    contextualInformation: {
      actual: `Actual:\n ${actual}`,
      expected: `Expected:\n ${expected}`,
    },
  };
}

expect.extend({ toMatchElement });
