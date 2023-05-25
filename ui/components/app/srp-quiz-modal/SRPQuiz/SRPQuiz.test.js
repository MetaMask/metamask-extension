import { fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import configureStore from '../../../../store/store';
import SRPQuiz from './SRPQuiz';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

let openTabSpy;

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: () => ({
      push: jest.fn(),
    }),
  };
});

async function waitForText(text) {
  return await waitFor(() => {
    expect(screen.getByText(text)).toBeInTheDocument();
  });
}

function clickButton(text) {
  fireEvent.click(screen.getByText(text));
}

describe('srp-reveal-quiz', () => {
  beforeAll(() => {
    global.platform = { openTab: jest.fn() };
    openTabSpy = jest.spyOn(global.platform, 'openTab');
  });

  it('should go through the full sequence of steps', async () => {
    renderWithProvider(<SRPQuiz isOpen />, store);

    expect(screen.queryByText('Get started')).toBeInTheDocument();

    expect(
      screen.queryByText(
        'If you lose your Secret Recovery Phrase, MetaMask...',
      ),
    ).not.toBeInTheDocument();

    clickButton('Learn more');

    await waitFor(() =>
      expect(openTabSpy).toHaveBeenCalledWith({
        url: expect.stringMatching(ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE),
      }),
    );

    clickButton('Get started');

    await waitForText('If you lose your Secret Recovery Phrase, MetaMask...');

    clickButton('Can get it back for you');

    await waitForText(
      'Wrong! No one can help get your Secret Recovery Phrase back',
    );

    clickButton('Try again');

    await waitForText('If you lose your Secret Recovery Phrase, MetaMask...');

    clickButton('Can’t help you');

    await waitForText(
      'Right! No one can help get your Secret Recovery Phrase back',
    );

    clickButton('Continue');

    await waitForText(
      'If anyone, even a support agent, asks for your Secret Recovery Phrase...',
    );

    clickButton('You should give it to them');

    await waitForText(
      'Nope! Never share your Secret Recovery Phrase with anyone, ever',
    );

    clickButton('Try again');

    await waitForText(
      'If anyone, even a support agent, asks for your Secret Recovery Phrase...',
    );

    clickButton('You’re being scammed');

    await waitForText(
      'Correct! Sharing your Secret Recovery Phrase is never a good idea',
    );

    clickButton('Continue');
  });
});
