import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import TermsOfUsePopup from './terms-of-use-popup';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  return renderWithProvider(<TermsOfUsePopup />, store);
};

describe('TermsOfUsePopup', () => {
  beforeEach(() => {
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('renders TermsOfUse component and shows Terms of Use text', () => {
    render();
    expect(screen.getByText('Terms of Use')).toBeInTheDocument();
  });
});
