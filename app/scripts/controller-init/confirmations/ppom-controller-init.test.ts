import {
  PPOMController,
  PPOMControllerMessenger,
} from '@metamask/ppom-validator';
import { PPOMControllerInitMessenger } from '../messengers/ppom-controller-messenger';
import {
  buildControllerInitRequestMock,
  expectValidMessengerCallback,
} from '../test/utils';
import { PPOMControllerInit } from './ppom-controller-init';

function buildInitRequestMock() {
  const requetMock = buildControllerInitRequestMock<
    PPOMControllerMessenger,
    PPOMControllerInitMessenger
  >();

  requetMock.getController.mockReturnValue({
    state: { securityAlertsEnabled: true },
  });

  return requetMock;
}

describe('PPOM Controller Init', () => {
  describe('init', () => {
    it('returns controller instance', () => {
      const requestMock = buildInitRequestMock();
      expect(new PPOMControllerInit().init(requestMock)).toBeInstanceOf(
        PPOMController,
      );
    });
  });

  describe('getControllerMessengerCallback', () => {
    it('returns a valid messenger callback', () => {
      expectValidMessengerCallback(
        new PPOMControllerInit().getControllerMessengerCallback(),
      );
    });

    describe('getInitMessengerCallback', () => {
      it('returns a valid messenger callback', () => {
        expectValidMessengerCallback(
          new PPOMControllerInit().getInitMessengerCallback(),
        );
      });
    });
  });
});
