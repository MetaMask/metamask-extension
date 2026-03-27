import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import Biometrics from './biometrics';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
}));

const buildMockStore = (firstTimeFlowType: FirstTimeFlowType) =>
  configureMockStore([thunk])({
    metamask: {
      firstTimeFlowType,
    },
  });

describe('Biometrics', () => {
  beforeEach(() => {
    mockUseNavigate.mockClear();
  });

  it('renders and matches snapshot', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { container } = renderWithProvider(<Biometrics />, mockStore);

    expect(container).toMatchSnapshot();
  });

  it('renders the heading text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(
      getByText(messages.unlockWithBiometrics.message),
    ).toBeInTheDocument();
  });

  it('renders the description text', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(
      getByText(messages.biometricsDescription.message),
    ).toBeInTheDocument();
  });

  it('renders the set up biometrics button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(getByText(messages.setUpBiometrics.message)).toBeInTheDocument();
  });

  it('renders the maybe later button', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByText } = renderWithProvider(<Biometrics />, mockStore);

    expect(getByText(messages.maybeLater.message)).toBeInTheDocument();
  });

  it('renders the biometrics image', () => {
    const mockStore = buildMockStore(FirstTimeFlowType.create);
    const { getByAltText } = renderWithProvider(<Biometrics />, mockStore);

    expect(getByAltText('Biometrics')).toBeInTheDocument();
  });

  describe('maybe later navigation', () => {
    it('navigates to SRP review route when flow type is create', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.create);
      const { getByText } = renderWithProvider(<Biometrics />, mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(
        ONBOARDING_REVIEW_SRP_ROUTE,
        {
          replace: true,
        },
      );
    });

    it('navigates to MetaMetrics route when flow type is import', () => {
      const mockStore = buildMockStore(FirstTimeFlowType.import);
      const { getByText } = renderWithProvider(<Biometrics />, mockStore);

      fireEvent.click(getByText(messages.maybeLater.message));

      expect(mockUseNavigate).toHaveBeenCalledWith(ONBOARDING_METAMETRICS, {
        replace: true,
      });
    });
  });
});
