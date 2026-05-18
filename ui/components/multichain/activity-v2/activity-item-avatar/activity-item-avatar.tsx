import React from 'react';
import classnames from 'clsx';
import { AvatarToken, AvatarTokenSize } from '@metamask/design-system-react';
import type {
  ActivityAvatarConfig,
  ResolvedActivityToken,
} from './activity-item-avatar.types';

type ActivityItemAvatarProps = {
  config: ActivityAvatarConfig;
};

const ActivityTokenAvatar = ({
  token,
  className,
}: Readonly<{ token: ResolvedActivityToken; className?: string }>) => {
  return (
    <AvatarToken
      size={AvatarTokenSize.Md}
      name={token.symbol}
      fallbackText={token.fallbackName.charAt(0)}
      src={token.imageUrl}
      className={classnames(className)}
      data-testid="activity-item-avatar-token"
    />
  );
};

const ActivityDualTokenAvatar = ({
  from,
  to,
}: Readonly<{ from: ResolvedActivityToken; to: ResolvedActivityToken }>) => {
  return (
    <div
      className="activity-item-avatar-dual"
      data-testid="activity-item-avatar-dual"
    >
      <div className="activity-item-avatar-dual__half activity-item-avatar-dual__half--left">
        <ActivityTokenAvatar
          token={from}
          className="activity-item-avatar-dual__token bg-transparent"
        />
      </div>
      <div className="activity-item-avatar-dual__half activity-item-avatar-dual__half--right">
        <ActivityTokenAvatar
          token={to}
          className="activity-item-avatar-dual__token bg-transparent"
        />
      </div>
    </div>
  );
};

export const ActivityItemAvatar = ({
  config,
}: Readonly<ActivityItemAvatarProps>) => {
  if (config.variant === 'dual') {
    return <ActivityDualTokenAvatar from={config.from} to={config.to} />;
  }
  return <ActivityTokenAvatar token={config.token} />;
};
