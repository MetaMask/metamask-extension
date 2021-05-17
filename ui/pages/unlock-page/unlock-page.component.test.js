import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../test/lib/render-helpers';
import UnlockPage from './unlock-page.component';

describe('Unlock Page Component', () => {
  it('clicks imports seed button', () => {
    const props = {
      history: {
        push: sinon.spy(),
      },
      isUnlocked: false,
      onRestore: sinon.spy(),
      onSubmit: sinon.spy(),
      forceUpdateMetamaskState: sinon.spy(),
      showOptInModal: sinon.spy(),
    };

    const { getByText } = renderWithProvider(
      <UnlockPage {...props} />,
      configureMockStore()({ metamask: { currentLocale: 'en' } }),
    );

    fireEvent.click(getByText('import using Secret Recovery Phrase'));
    expect(props.onRestore.calledOnce).toStrictEqual(true);
  });
});
