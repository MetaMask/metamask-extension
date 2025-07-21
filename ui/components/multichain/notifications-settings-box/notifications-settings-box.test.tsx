import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent } from '@testing-library/react';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { NotificationsSettingsBox } from './notifications-settings-box';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
    metamaskNotificationsList: [],
    metamaskNotificationsReadList: [],
  },
});

describe('NotificationsSettingsBox', () => {
  it('renders the component with children', () => {
    const testMessage = 'Test Child';
    render(
      <Provider store={store}>
        <NotificationsSettingsBox
          value={true}
          onToggle={() => {
            console.log('Toggled');
          }}
          dataTestId="test-id"
        >
          <div>{testMessage}</div>
        </NotificationsSettingsBox>
      </Provider>,
    );

    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });

  it('toggles value on click', () => {
    const onToggleMock = jest.fn();
    const testId = 'test-id';
    const { container } = render(
      <Provider store={store}>
        <NotificationsSettingsBox
          value={false}
          onToggle={onToggleMock}
          dataTestId={testId}
        >
          <div>Toggle Test</div>
        </NotificationsSettingsBox>
      </Provider>,
    );
    console.log(container.innerHTML);

    fireEvent.click(screen.getByTestId(`${testId}-toggle-input`));
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});
