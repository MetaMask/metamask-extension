import React from 'react';
import sinon from 'sinon';
import configureMockStore from 'redux-mock-store';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import {
  INITIALIZE_SEED_PHRASE_ROUTE,
  INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
  INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
  INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
} from '../../../helpers/constants/routes';
import SeedPhrase from '.';

describe('SeedPhrase Component', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should match snapshot', () => {
    const props = {
      history: {
        push: sinon.stub(),
      },
      verifySeedPhrase: sinon.stub().resolves('verifed seed'),
    };

    const { container } = renderWithProvider(<SeedPhrase {...props} />);

    expect(container).toMatchSnapshot();
  });

  it('should render confirm seed phrase component with seed-phrase/confirm route', () => {
    const mockState = {
      metamask: {},
    };

    const store = configureMockStore()(mockState);
    const props = {
      history: {
        push: sinon.stub(),
      },
      verifySeedPhrase: sinon.stub().resolves(),
    };

    renderWithProvider(
      <SeedPhrase {...props} />,
      store,
      INITIALIZE_CONFIRM_SEED_PHRASE_ROUTE,
    );

    const confirmSeedPhrase = screen.queryByTestId('confirm-seed-phrase');
    expect(confirmSeedPhrase).toBeInTheDocument();
  });

  it('should render reveal-seed-phrase component with /seed-phrase route', () => {
    const mockState = {
      metamask: {},
    };

    const store = configureMockStore()(mockState);
    const props = {
      history: {
        push: sinon.stub(),
      },
      verifySeedPhrase: sinon.stub().resolves(),
    };

    renderWithProvider(
      <SeedPhrase {...props} />,
      store,
      INITIALIZE_SEED_PHRASE_ROUTE,
    );

    const confirmSeedPhrase = screen.queryByTestId('reveal-seed-phrase');
    expect(confirmSeedPhrase).toBeInTheDocument();
  });

  it('should render reveal-seed-phrase component with /backup-seed-phrase route', () => {
    const mockState = {
      metamask: {
        onboardingTabs: [],
      },
    };

    const store = configureMockStore()(mockState);
    const props = {
      history: {
        push: sinon.stub(),
      },
      verifySeedPhrase: sinon.stub().resolves(),
    };

    renderWithProvider(
      <SeedPhrase {...props} />,
      store,
      INITIALIZE_BACKUP_SEED_PHRASE_ROUTE,
    );

    const confirmSeedPhrase = screen.queryByTestId('reveal-seed-phrase');
    expect(confirmSeedPhrase).toBeInTheDocument();
  });

  it('should render reveal-seed-phrase component with /seed-phrase-intro route', () => {
    const mockState = {
      metamask: {
        onboardingTabs: [],
      },
    };

    const store = configureMockStore()(mockState);
    const props = {
      history: {
        push: sinon.stub(),
      },
      verifySeedPhrase: sinon.stub().resolves(),
    };

    renderWithProvider(
      <SeedPhrase {...props} />,
      store,
      INITIALIZE_SEED_PHRASE_INTRO_ROUTE,
    );

    const seedPhraseIntro = screen.queryByTestId('seed-phrase-intro');
    expect(seedPhraseIntro).toBeInTheDocument();
  });
});
