import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
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
  const onAccept = jest.fn();
  return renderWithProvider(<TermsOfUsePopup onAccept={onAccept} />, store);
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
    expect(
      screen.getByText('Our Terms of Use have updated'),
    ).toBeInTheDocument();
  });

  it('scrolls down when handleScrollDownClick is called', () => {
    const mockScrollIntoView = jest.fn();
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

    render();
    const button = document.querySelector(
      "[data-testid='popover-scroll-button']",
    );

    fireEvent.click(button);
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
    });

    window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });
});
