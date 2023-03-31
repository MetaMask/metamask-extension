import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { hideModal } from '../../../store/actions';
import ComplianceModal from '.';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  hideModal: jest.fn(),
}));

describe('ComplianceModal', () => {
  let dispatchMock;

  beforeEach(() => {
    dispatchMock = jest.fn();
    useDispatch.mockReturnValue(dispatchMock);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render the correct content', () => {
    const { getByText, getByAltText } = render(<ComplianceModal />);

    expect(getByText('Codefi Compliance')).toBeInTheDocument();
    expect(getByText('DeFi raises AML/CFT risk for institutions, given the decentralised pools and pseudonymous counterparties.')).toBeInTheDocument();
    expect(getByText('Sign up to Codefi Compliance below')).toBeInTheDocument();
  });

  it('should close the modal when close button is clicked', () => {
    const { getByTestId } = render(<ComplianceModal />);

    fireEvent.click(getByTestId('compliance-modal-close'));

    expect(hideModal).toHaveBeenCalled();
    expect(dispatchMock).toHaveBeenCalledWith(hideModal());
  });

  it('should open the Codefi Compliance page when submit button is clicked', () => {
    const { getByText } = render(<ComplianceModal />);

    fireEvent.click(getByText('Open Codefi Compliance'));

    expect(global.platform.openTab).toHaveBeenCalledWith({
      url: 'https://start.compliance.codefi.network/',
    });
  });
});


// import assert from 'assert';
// import React from 'react';
// import PropTypes from 'prop-types';
// import { Provider } from 'react-redux';
// import sinon from 'sinon';
// import configureStore from 'redux-mock-store';
// import { mount } from 'enzyme';
// import ComplianceModal from '..';

// describe('Compliance Modal', function () {
//   let wrapper;

//   const state = {
//     metamask: {},
//   };

//   const props = {
//     hideModal: sinon.spy(),
//   };

//   const mockStore = configureStore();
//   const store = mockStore(state);

//   // for some reason unit tests for opening new tab are not working when there is more than one test in the one run
//   // and since there is one in account-details-modal.test.js testing here was not working
//   // TODO: Add tests after moving to jest unit tests

//   it('closes the modal', function () {
//     wrapper = mount(
//       <Provider store={store}>
//         <ComplianceModal.WrappedComponent {...props} />
//       </Provider>,
//       {
//         context: {
//           t: (str) => str,
//           store,
//         },
//         childContextTypes: {
//           t: PropTypes.func,
//           store: PropTypes.object,
//         },
//       },
//     );
//     const close = wrapper.find('[data-testid="compliance-modal-close"]');
//     close.simulate('click');

//     assert(props.hideModal.calledOnce);
//     props.hideModal.resetHistory();
//   });

//   it('opens new tab on "Open Coddefi Compliance" click', function () {
//     global.platform = { openTab: sinon.spy() };
//     wrapper = mount(
//       <Provider store={store}>
//         <ComplianceModal.WrappedComponent {...props} />
//       </Provider>,
//       {
//         context: {
//           t: (str) => str,
//           store,
//         },
//         childContextTypes: {
//           t: PropTypes.func,
//           store: PropTypes.object,
//         },
//       },
//     );
//     const signupButton = wrapper.find('.modal-container__footer .btn-primary');
//     signupButton.simulate('click');

//     expect(global.platform.openTab.called).toBeTruthy();
//   });
// });
