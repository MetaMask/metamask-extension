import { rampsController } from './ramps-controller';
import { rampsService } from './ramps-service';

describe('wallet-init ramps configurations', () => {
  it('matches snapshot for config names', () => {
    expect({
      rampsService: rampsService.name,
      rampsController: rampsController.name,
    }).toMatchSnapshot();
  });
});
