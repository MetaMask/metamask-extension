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

export const PASSKEY_PASSWORD_CHANGE_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateAuthenticationOptions',
      'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
      'PasskeyController:removePasskeyWithPasswordVerification',
    ],
    events: [],
  });

export const PASSKEY_SECURITY_ROUTE_CAPABILITIES =
  defineAllowedRouteCapabilities({
    actions: [
      'PasskeyController:generateAuthenticationOptions',
      'PasskeyController:removePasskeyWithPasskeyVerification',
      'PasskeyController:removePasskeyWithPasswordVerification',
      'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
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

export type PasskeyPasswordChangeRouteMessenger =
  RouteMessengerFromCapabilities<
    typeof PASSKEY_PASSWORD_CHANGE_ROUTE_CAPABILITIES
  >;
