import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';

export const PASSKEY_REGISTRATION_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateRegistrationOptions',
      'PasskeyController:generatePostRegistrationAuthenticationOptions',
      'PasskeyController:protectVaultKeyWithPasskey',
    ],
    events: [],
  });

export type PasskeyRegistrationRouteMessenger = RouteMessengerFromCapabilities<
  typeof PASSKEY_REGISTRATION_ROUTE_CAPABILITIES
>;

export const PASSKEY_SECURITY_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateAuthenticationOptions',
      'PasskeyController:removePasskeyWithPasskeyVerification',
    ],
    events: [],
  });

export type PasskeySecurityRouteMessenger = RouteMessengerFromCapabilities<
  typeof PASSKEY_SECURITY_ROUTE_CAPABILITIES
>;

export const PASSKEY_TURN_OFF_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: ['PasskeyController:removePasskeyWithPasswordVerification'],
    events: [],
  });

export type PasskeyTurnOffRouteMessenger = RouteMessengerFromCapabilities<
  typeof PASSKEY_TURN_OFF_ROUTE_CAPABILITIES
>;
