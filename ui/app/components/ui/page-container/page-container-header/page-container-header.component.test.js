import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import PageContainerHeader from './page-container-header.component';

describe('Page Container Header', () => {
  let wrapper, style, onBackButtonClick, onClose;

  beforeEach(() => {
    style = { test: 'style' };
    onBackButtonClick = sinon.spy();
    onClose = sinon.spy();

    wrapper = shallow(
      <PageContainerHeader
        showBackButton
        onBackButtonClick={onBackButtonClick}
        backButtonStyles={style}
        title="Test Title"
        subtitle="Test Subtitle"
        tabs="Test Tab"
        onClose={onClose}
      />,
    );
  });

  describe('Render Header Row', () => {
    it('renders back button', () => {
      expect(wrapper.find('.page-container__back-button')).toHaveLength(1);
      expect(wrapper.find('.page-container__back-button').text()).toStrictEqual(
        'Back',
      );
    });

    it('ensures style prop', () => {
      expect(
        wrapper.find('.page-container__back-button').props().style,
      ).toStrictEqual(style);
    });

    it('should call back button when click is simulated', () => {
      wrapper.find('.page-container__back-button').prop('onClick')();
      expect(onBackButtonClick.callCount).toStrictEqual(1);
    });
  });

  describe('Render', () => {
    let header, headerRow, pageTitle, pageSubtitle, pageClose, pageTab;

    beforeEach(() => {
      header = wrapper.find('.page-container__header--no-padding-bottom');
      headerRow = wrapper.find('.page-container__header-row');
      pageTitle = wrapper.find('.page-container__title');
      pageSubtitle = wrapper.find('.page-container__subtitle');
      pageClose = wrapper.find('.page-container__header-close');
      pageTab = wrapper.find('.page-container__tabs');
    });

    it('renders page container', () => {
      expect(header).toHaveLength(1);
      expect(headerRow).toHaveLength(1);
      expect(pageTitle).toHaveLength(1);
      expect(pageSubtitle).toHaveLength(1);
      expect(pageClose).toHaveLength(1);
      expect(pageTab).toHaveLength(1);
    });

    it('renders title', () => {
      expect(pageTitle.text()).toStrictEqual('Test Title');
    });

    it('renders subtitle', () => {
      expect(pageSubtitle.text()).toStrictEqual('Test Subtitle');
    });

    it('renders tabs', () => {
      expect(pageTab.text()).toStrictEqual('Test Tab');
    });

    it('should call close when click is simulated', () => {
      pageClose.prop('onClick')();
      expect(onClose.callCount).toStrictEqual(1);
    });
  });
});
