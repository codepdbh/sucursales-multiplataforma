import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('should return service status', () => {
    const controller = new HealthController();
    const response = controller.check();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('inventory-backend');
    expect(response.timestamp).toBeDefined();
  });
});
