import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import ConfirmDetailRow from './confirm-detail-row.component';

const propsMethodSpies = {
  onHeaderClick: sinon.spy(),
};

describe('Confirm Detail Row Component', () => {
  describe('render', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = shallow(
        <ConfirmDetailRow
          errorType="mockErrorType"
          label="mockLabel"
          showError={false}
          primaryText="mockFiatText"
          secondaryText="mockEthText"
          primaryValueTextColor="mockColor"
          onHeaderClick={propsMethodSpies.onHeaderClick}
          headerText="mockHeaderText"
          headerTextClassName="mockHeaderClass"
        />,
      );
    });

    it('should render a div with a confirm-detail-row class', () => {
      expect(wrapper.find('div.confirm-detail-row')).toHaveLength(1);
    });

    it('should render the label as a child of the confirm-detail-row__label', () => {
      expect(
        wrapper
          .find('.confirm-detail-row > .confirm-detail-row__label')
          .childAt(0)
          .text(),
      ).toStrictEqual('mockLabel');
    });

    it('should render the headerText as a child of the confirm-detail-row__header-text', () => {
      expect(
        wrapper
          .find(
            '.confirm-detail-row__details > .confirm-detail-row__header-text',
          )
          .childAt(0)
          .text(),
      ).toStrictEqual('mockHeaderText');
    });

    it('should render the primaryText as a child of the confirm-detail-row__primary', () => {
      expect(
        wrapper
          .find('.confirm-detail-row__details > .confirm-detail-row__primary')
          .childAt(0)
          .text(),
      ).toStrictEqual('mockFiatText');
    });

    it('should render the ethText as a child of the confirm-detail-row__secondary', () => {
      expect(
        wrapper
          .find('.confirm-detail-row__details > .confirm-detail-row__secondary')
          .childAt(0)
          .text(),
      ).toStrictEqual('mockEthText');
    });

    it('should set the fiatTextColor on confirm-detail-row__primary', () => {
      expect(
        wrapper.find('.confirm-detail-row__primary').props().style.color,
      ).toStrictEqual('mockColor');
    });

    it('should assure the confirm-detail-row__header-text classname is correct', () => {
      expect(
        wrapper.find('.confirm-detail-row__header-text').props().className,
      ).toStrictEqual('confirm-detail-row__header-text mockHeaderClass');
    });

    it('should call onHeaderClick when headerText div gets clicked', () => {
      wrapper.find('.confirm-detail-row__header-text').props().onClick();
      expect(propsMethodSpies.onHeaderClick.calledOnce).toStrictEqual(true);
    });
  });
});
