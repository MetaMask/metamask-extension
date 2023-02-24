import React from 'react';
import PropTypes from 'prop-types';
import sinon from 'sinon';
import { mount } from 'enzyme';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import JwtUrlForm from './jwt-url-form.component';

describe('JwtUrlForm', function () {
  let wrapper;

  const mockStore = {
    metamask: {
      provider: {
        type: 'test',
      },
    },
  };

  const store = configureMockStore()(mockStore);

  const props = {
    jwtList: ['jwt1'],
    currentJwt: 'jwt1',
    onJwtChange: sinon.spy(),
    jwtInputText: 'input text',
    apiUrl: 'url',
    urlInputText: '',
    onUrlChange: sinon.spy(),
  };

  beforeEach(() => {
    wrapper = mount(
      <Provider store={store}>
        <JwtUrlForm {...props} />
      </Provider>,
      {
        context: {
          t: (str) => str,
          store,
          metricsEvent: () => undefined,
        },
        childContextTypes: {
          t: PropTypes.func,
          store: PropTypes.object,
          metricsEvent: () => undefined,
        },
      },
    );
  });

  it('opens JWT Url Form without input for new JWT', () => {
    const btn = wrapper.find('.jwt-url-form__btn__container .btn-secondary');
    expect(btn.html()).toContain('Add new token');
  });

  it('shows JWT textarea with provided input text', () => {
    const btn = wrapper.find('.jwt-url-form__btn__container .btn-secondary');
    btn.simulate('click');
    const textArea = wrapper.find('.jwt-url-form__instruction');
    expect(textArea.first().html()).toContain('input text');
  });

  it('goes through the api url input', () => {
    const apiUrlinput = wrapper.find('[data-testid="jwt-api-url-input"]');
    apiUrlinput.simulate('change', { target: { value: 'url' } });

    expect(apiUrlinput.prop('value')).toBe('url');
  });
});
