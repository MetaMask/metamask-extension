import React from 'react';
import classnames from 'clsx';
import { AvatarToken, AvatarTokenSize } from '@metamask/design-system-react';
import type {
  ActivityListItemAvatarConfig,
  ResolvedActivityToken,
} from './activity-list-item-avatar.types';

type ActivityListItemAvatarProps = {
  config: ActivityListItemAvatarConfig;
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
      data-testid="activity-list-item-avatar-token"
    />
  );
};

const ActivityDualTokenAvatar = ({
  from,
  to,
}: Readonly<{ from: ResolvedActivityToken; to: ResolvedActivityToken }>) => {
  return (
    <div
      className="activity-list-item-avatar-dual"
      data-testid="activity-list-item-avatar-dual"
    >
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--left">
        <ActivityTokenAvatar
          token={from}
          className="activity-list-item-avatar-dual__token bg-transparent"
        />
      </div>
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--right">
        <ActivityTokenAvatar
          token={to}
          className="activity-list-item-avatar-dual__token bg-transparent"
        />
      </div>
    </div>
  );
};

export const ActivityListItemAvatar = ({
  config,
}: Readonly<ActivityListItemAvatarProps>) => {
  if (config.variant === 'dual') {
    return <ActivityDualTokenAvatar from={config.from} to={config.to} />;
  }

  return <ActivityTokenAvatar token={config.token} />;
};
