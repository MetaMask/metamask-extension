# Automated Testing in the MetaMask Extension Repository

The purpose of this document is to summarize the testing tactics we want to align on for this repository.

In its current version, this document does not include discussions on manual testing, performance testing, or browser testing. Our thoughts on our e2e tests will be shared on a separate file (to be linked here).

To contribute, submit a PR. We encourage you to read the section about fitness functions below and include automation in your contribution.

## Why We Test

Testing is important because it helps ensure that software works as intended.

Without automated tests, bugs organically occur in production or during manual regression testing for release candidates.

This can lead to user dissatisfaction and costly rework. It also carries a big process and organizational overhead because people have to stop what they are doing multiple times and reach out to each other to uphold correctness.

Speeding up the feedback loop from writing software to discovering bugs directly increases the productivity of the software delivery team. Apart from that, it minimizes context switching, increasing developer happiness and, indirectly, developer productivity.

Testing is also proven to teach developers to write better and more readable code. Unit tests, for example, encourage separating functionality into smaller units that do less.

Tests are generally the best way to document code. They are better than comments because they don't grow stale. If a block of code is moved or changed, developers must remember to update the corresponding comments. However, automated tests will break, and it'll be evident and impossible to miss what needs fixing by the developer.

## Best Practices & Recommendations

### Favor Jest instead of Mocha

For consistency in syntax and coverage tooling, we favor using Jest for all unit tests. That means we don't need to use Sinon for mocks and stubs or Assert for assertions and that we'll eventually not need Mocha to run the tests. Jest replaces functionality from all these dependencies in one package.

While Mocha is a test runner that can be used for unit, integration, and end-to-end testing, jest has been built specifically for unit testing and is much faster.

To get a sense of the syntactic differences between the two approaches, you can see this [example PR](https://github.com/MetaMask/metamask-extension/pull/17226/files).

### Tests Should Mirror How Software is Used

One possible way to write tests is to manipulate the internal state directly and artificially increase test coverage. Unfortunately, these tests are ephemeral and brittle because they are coupled with implementation details. In other words, if a piece of code is altered or refactored, the tests need to be substantially rewritten, and we can't conclusively determine whether or not functionality has changed.

The goal of tests is precisely to improve the quality of the implementation while keeping functionality constant. When testing the UI, the test might include inspecting the text in DOM elements and simulating clicking behaviors. [This PR includes good examples](https://github.com/MetaMask/metamask-extension/pull/17360/files) of that. Instead of changing the internal state and props of the component programmatically, the testing API encourages interaction with DOM elements. This was a [deliberate design choice](https://testing-library.com/docs/guiding-principles) for React Testing Library.

For unit tests that are not related to the UI of the extension, we can't rely on the library to direct us on how to write our tests, but the same principle can be generalized. We aim to test a unit code for all the possible interaction scenarios. Mocks should be used sparingly, as they often make the test diverge from how the unit is used in production.

### The Anatomy of a Test

A good way to reason about tests is to think of their typical structure.

The first block is the SETUP, where the object of the test is instantiated or rendered. This typically includes initializing the state to be passed as an argument and mocking or stubbing functions as needed.

ACT is the trigger after which the functionality should occur. (The first part of "**When foo**, then bar")

ASSERT is the consequence of the trigger that has happened. (The second part of "When foo, **then bar**")

The TEARDOWN block typically cancels the setup by cleaning up the state to ensure test isolation (see section "Isolation and independence").

You can read more about [this structure here](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/testingandquality/aaa.md).

Jest provides [APIs](https://jestjs.io/docs/setup-teardown) to remove duplication on setup and teardown.

### Isolation & Independence

Tests should not depend on each other to pass. This can be verified by running one test of the suite only or by changing the test order. Setup and tear-down steps are used to ensure this.

You can read more on the topic [here](https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/testingandquality/avoid-global-test-fixture.md).

### Manage Test Data

Test data makes up for a lot of the boilerplate for tests.

To avoid duplication hell and enhance readability, it's sometimes helpful to transform the base objects into object generators that accept overrides.

```javascript
const generateGasEstimatorProps = (overrides) => ({
  maxPriorityFeePerGas: '10',
  ...overrides,
});

const generateAppState = (overrides) => ({
  networkDropdownOpen: false,
  gasIsLoading: false,
  isLoading: false,
  modal: {
    open: false,
    modalState: {
      name: null,
      props: {},
    },
    previousModalState: {
      name: null,
    },
  },
  warning: null,
  ...overrides,
});

describe('<GasEstimator />', () => {
  const generateMockState = (overrides) => ({
    appState: generateAppState(),
    ...overrides,
  });

  const defaultState = generateMockState();
  const defaultStore = configureMockStore()(defaultState);

  it('renders likely estimate', async () => {
    const props = generateGasEstimatorProps({
      maxPriorityFeePerGas: '10',
    });

    const { queryByText } = renderWithProvider(
      <GasEstimator {...props} />,
      defaultStore,
    );

    await waitFor(() => {
      expect(queryByText(/Very likely/u)).toBeInTheDocument();
    });
  });

  it('renders unlikely estimate', async () => {
    const props = generateGasEstimatorProps({
      maxPriorityFeePerGas: '100',
    });

    const { queryByText } = renderWithProvider(
      <GasEstimator {...props} />,
      defaultStore,
    );

    await waitFor(() => {
      expect(queryByText(/Very unlikely/u)).toBeInTheDocument();
    });
  });
});
```

Using this pattern, each test contains the minimum sufficient information for setting up the assertion (setting the `maxPriorityFeePerGas`).

This also means test data is not entirely reused between different tests. In each test, the relevant data is explicitly stated.

The data generation functions can be placed at the top of the file if they are used exclusively in it or shared files if they are reused for testing multiple components or units of the repository.

### Using Jest timers

Imperative waiting for time to pass in a test locks the test execution more than it needs to and can cause flakiness and timeouts on slower machines and so it should generally be avoided.

Here's an example of that:

```javascript
// Wait 5 seconds
await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
```

Jest has a [set of timer APIs](https://jestjs.io/docs/timer-mocks) to replace that anti-pattern. From the docs:

> The native timer functions (i.e., setTimeout(), setInterval(), clearTimeout(), clearInterval()) are less than ideal for a testing environment since they depend on real-time to elapse. Jest can swap out timers with functions that allow you to control the passage of time.

Using `jest.advanceTimersByTime(msToRun)`, we can tell Jest what effect we want to simulate on the test (declarative programming) instead of having to provoke the effect (imperative programming) using the promisified `setTimeout`.

Unfortunately, using these APIs With asynchronous code leaves unresolved promises, so we can use a custom `flushPromises` method to resolve them and let Jest optimize the execution speed in the background ([source](https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function/58716087#58716087)):

```javascript
function flushPromises(): Promise<unknown> {
  return new Promise(jest.requireActual('timers').setImmediate);
}

async function advanceTimersByTime(ms) {
  jest.advanceTimersByTime(ms);
  await flushPromises();
}
```

Here's [an example PR](https://github.com/MetaMask/core/pull/1002/files) for this pattern in our core library.

For UI tests, React Testing Library exposes another API that relies on the same idea of abstracting the passage of time instead of explicitly managing it:

```javascript
waitFor(() => {
  expect(<element that needs will disappear once the DOM updates>).toBeRemoved()
})
```

## Automation

### Code Coverage Requirements

Thanks to @brad.decker, we can now see our total test coverage using [codecov](https://app.codecov.io/gh/MetaMask/metamask-extension).

Codeconv's quality gate enforces that code coverage does not decrease. As per our 2023 Q1 OKR of ["Increase platform-wide reliability by expanding test coverage, and improving tooling and infrastructure"](https://docs.google.com/document/d/1dUCE9PJA0L6EMlVgG3y0dyiDrht1-MG-DhbEXp78QAs/edit#bookmark=id.s8dqtv3asm7x), we are working towards 80 code coverage.

For that to happen, simply not decreasing code coverage is not enough. Developers should progressively increase the coverage of the files they change. We don't currently have an automated way of expressing this, but it can be checked manually by using the Jest flag `--changedSince` ([read Jest docs for more info](https://jestjs.io/docs/cli#--changedsince)). Apart from our individual contributions, during PR reviews, it's OK to encourage others to continue increasing code coverage for their changes within reason. Remember that code coverage is not a silver bullet and that the quality of our tests is just as important.

In the future, we may use other tools to ensure an upward trajectory for code coverage, such as [Sonarcloud](https://docs.sonarcloud.io/improving/new-code-definition/) or other static checking tools.

### Fitness functions: measuring progress in code quality and preventing regressions using custom git hooks

When designing software architecture changes, we need to define objectively what "better" or "quality" means.

This may sound like a philosophical problem initially, but it's quite pragmatic. Recommendations such as the ones enumerated above are only as good as they can be defined, and communication and enforcement of standards are harder as team size increases. This is especially true when contributions are varied, such as with this repository, which has internal contributors from several teams and external contributors.

Just as we use code coverage as an imperfect yet directionally correct way to assess the state of testing, we can extend this concept to other aspects of our codebase and tests.

Widespread code coverage and static checks tools support an incremental approach to software improvement, but linting tools don't. And given the size of our codebase, it's not always realistic to make changes across the entire codebase in one PR.

One way to go about this is to define and automate [fitness functions](https://www.thoughtworks.com/radar/techniques/architectural-fitness-function), used to drive architecture changes in complex systems and measure progress against those goals. Just as important, this framework of fitness functions allows us to prevent regressions in code quality.

We use shareable git hooks using Husky to drive these incremental changes. Fitness functions are then version controlled, reviewed as part of the standard software development workflow, and permanently prevent regressions and encourage progress.

## References and further reading

https://github.com/MetaMask/core/issues/413

https://github.com/MetaMask/metamask-extension/pull/17056/files#r1064860162

https://github.com/testjavascript/nodejs-integration-tests-best-practices
