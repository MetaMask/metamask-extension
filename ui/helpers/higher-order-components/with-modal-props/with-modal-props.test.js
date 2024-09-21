import configureMockStore from 'redux-mock-store';
import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import withModalProps from './with-modal-props';

const mockState = {
  appState: {
    modal: {
      modalState: {
        props: {
          prop1: 'prop1',
          prop2: 2,
          prop3: true,
        },
      },
    },
  },
};

describe('withModalProps', () => {
  it('should return a component wrapped with modal state props', () => {
    const TestComponent = () => <div className="test">Testing</div>;
    const WrappedComponent = withModalProps(TestComponent);
    const store = configureMockStore()(mockState);
    const { container } = renderWithProvider(
      <WrappedComponent store={store} />,
    );

    expect(container).toMatchSnapshot();
  });
});
