/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { MetaMetricsController } from './metametrics-controller';

export type MetaMetricsControllerSetDataCollectionForMarketingAction = {
  type: `MetaMetricsController:setDataCollectionForMarketing`;
  handler: MetaMetricsController['setDataCollectionForMarketing'];
};

export type MetaMetricsControllerSetMarketingCampaignCookieIdAction = {
  type: `MetaMetricsController:setMarketingCampaignCookieId`;
  handler: MetaMetricsController['setMarketingCampaignCookieId'];
};

/**
 * Union of all MetaMetricsController action types.
 */
export type MetaMetricsControllerMethodActions =
  | MetaMetricsControllerSetDataCollectionForMarketingAction
  | MetaMetricsControllerSetMarketingCampaignCookieIdAction;
