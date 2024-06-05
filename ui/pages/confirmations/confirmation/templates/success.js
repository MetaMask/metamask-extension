import { ApprovalType } from '@metamask/controller-utils';
import { ResultTemplate } from '../ResultTemplate';

const template = new ResultTemplate(ApprovalType.ResultSuccess);
const success = { getValues: template.getValues.bind(template) };

export default success;
