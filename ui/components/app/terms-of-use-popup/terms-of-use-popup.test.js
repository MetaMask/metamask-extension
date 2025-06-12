import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import TermsOfUsePopup from './terms-of-use-popup';

const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
  });
  const onAccept = jest.fn();
  const onClose = jest.fn();
  return renderWithProvider(
    <TermsOfUsePopup onAccept={onAccept} isOpen onClose={onClose} />,
    store,
  );
};

describe('TermsOfUsePopup', () => {
  it('renders TermsOfUse component and shows Terms of Use text', () => {
    render();
    expect(screen.getByText('Review our Terms of Use')).toBeInTheDocument();

    const agreeButton = screen.getByTestId('terms-of-use-agree-button');
    expect(agreeButton).toBeInTheDocument();
    expect(agreeButton).toBeDisabled();
  });

  it('scrolls down when handleScrollDownClick is called', () => {
    const mockScrollIntoView = jest.fn();
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    render();
    const button = document.querySelector(
      "[data-testid='terms-of-use-scroll-button']",
      5000,
    );

    fireEvent.click(button);
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
    });

    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });
});
