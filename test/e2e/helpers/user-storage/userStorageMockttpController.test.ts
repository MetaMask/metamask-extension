import * as mockttp from 'mockttp';
import { UserStorageMockttpController } from './userStorageMockttpController';

describe('UserStorageMockttpController', () => {
  let mockServer: mockttp.Mockttp;

  const baseUrl = 'https://user-storage.api.cx.metamask.io/api/v1/userstorage';

  describe('mimics user storage behaviour', () => {
    mockServer = mockttp.getLocal({ cors: true });

    it('handles GET requests that have empty response', async () => {
      const controller = new UserStorageMockttpController();

      controller.setupPath('accounts', mockServer);

      const request = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(request.json).toEqual(null);
    });

    it('handles GET requests that have a pre-defined response', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const request = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(request.json).toEqual(mockedData);
    });

    it('handles batch GET requests', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const request = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(request.json).toEqual(mockedData);
    });

    it('handles GET requests for feature entries', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const request = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts/7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b`,
      });

      expect(request.json).toEqual(mockedData[0]);
    });

    it('handles PUT requests to create new entries', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];
      const mockedAddedData = {
        HashedKey:
          '6afbe024087495b4e0d56c4bdfc981c84eba44a7c284d4f455b5db4fcabc2173',
        Data: 'data3',
      };

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const putRequest = await controller.onPut('accounts', {
        path: `${baseUrl}/accounts/6afbe024087495b4e0d56c4bdfc981c84eba44a7c284d4f455b5db4fcabc2173`,
        body: {
          getJson: async () => ({
            data: mockedAddedData.Data,
          }),
        } as unknown as mockttp.CompletedBody,
      });

      expect(putRequest.statusCode).toEqual(204);

      const getRequest = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(getRequest.json).toEqual([...mockedData, mockedAddedData]);
    });

    it('handles PUT requests to update existing entries', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];
      const mockedUpdatedData = {
        HashedKey:
          'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
        Data: 'data3',
      };

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const putRequest = await controller.onPut('accounts', {
        path: `${baseUrl}/accounts/c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468`,
        body: {
          getJson: async () => ({
            data: mockedUpdatedData.Data,
          }),
        } as unknown as mockttp.CompletedBody,
      });

      expect(putRequest.statusCode).toEqual(204);

      const getRequest = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(getRequest.json).toEqual([mockedData[0], mockedUpdatedData]);
    });

    it('handles batch PUT requests', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];
      const mockedUpdatedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data3',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data4',
        },
      ];

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const putData = {} as { [key: string]: string };
      mockedUpdatedData.forEach((entry) => {
        putData[entry.HashedKey] = entry.Data;
      });

      const putRequest = await controller.onPut('accounts', {
        path: `${baseUrl}/accounts`,
        body: {
          getJson: async () => ({
            data: putData,
          }),
        } as unknown as mockttp.CompletedBody,
      });

      expect(putRequest.statusCode).toEqual(204);

      const getRequest = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(getRequest.json).toEqual(mockedUpdatedData);
    });

    it('handles DELETE requests', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const deleteRequest = await controller.onDelete('accounts', {
        path: `${baseUrl}/accounts/c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468`,
      });

      expect(deleteRequest.statusCode).toEqual(204);

      const getRequest = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(getRequest.json).toEqual([mockedData[0]]);
    });

    it('handles batch DELETE requests', async () => {
      const controller = new UserStorageMockttpController();
      const mockedData = [
        {
          HashedKey:
            '7f8a7963423985c50f75f6ad42a6cf4e7eac43a6c55e3c6fcd49d73f01c1471b',
          Data: 'data1',
        },
        {
          HashedKey:
            'c236b92ea7d513b2beda062cb546986961dfa7ca4334a2913f7837e43d050468',
          Data: 'data2',
        },
      ];

      controller.setupPath('accounts', mockServer, {
        getResponse: mockedData,
      });

      const deleteRequest = await controller.onDelete('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(deleteRequest.statusCode).toEqual(204);

      const getRequest = await controller.onGet('accounts', {
        path: `${baseUrl}/accounts`,
      });

      expect(getRequest.json).toEqual(null);
    });
  });
});
