import React from 'react';
import sinon from 'sinon';
import { fireEvent, screen } from '@testing-library/react';
import { tick } from '../../../../test/lib/tick';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import EndOfFlowScreen from './end-of-flow.container';

describe('End of Flow Screen', () => {
  const props = {
    history: {
      push: sinon.stub(),
    },
    setCompletedOnboarding: sinon.stub().resolves(),
  };

  beforeEach(() => {
    renderWithProvider(<EndOfFlowScreen.WrappedComponent {...props} />);
  });

  it('should render', () => {
    const endOfFlow = screen.queryByTestId('end-of-flow');
    expect(endOfFlow).toBeInTheDocument();
  });

  it('should navigate to the default route on click', async () => {
    const endOfFlowButton = screen.getByTestId('EOF-complete-button');
    fireEvent.click(endOfFlowButton);

    await tick();

    expect(
      props.history.push.calledOnceWithExactly(DEFAULT_ROUTE),
    ).toStrictEqual(true);
  });
});
