const got = require('got');
const crypto = require('crypto');

/**
 * Some very primitive api implementation for demo purposes
 */

class TuyaApi {
  async authorize({ clientId, clientSecret }) {
    this.context = {};

    this.httpClient = got.extend({
      prefixUrl: 'https://openapi.tuyaeu.com/v1.0/',
      responseType: 'json',
      hooks: {
        beforeRequest: [
          (options) => {
            let { accessToken } = this.context;
            const now = Date.now();

            if (options.url.pathname.includes('/token')) {
              // do not add accessToken if it is token request
              accessToken = null;
            }

            const payload = [clientId, accessToken, now]
              .filter(Boolean)
              .join('');

            options.headers.client_id = clientId;
            options.headers.sign = crypto
              .createHmac('sha256', clientSecret)
              .update(payload)
              .digest('hex')
              .toUpperCase();
            options.headers.t = String(now);
            options.headers.sign_method = 'HMAC-SHA256';
            options.headers.access_token = accessToken || '';
          },
        ],
      },
    });

    await this.ensureToken();
  }

  async ensureToken() {
    if (!this.tokenExpiresAt || Date.now() - this.tokenExpiresAt > 0) {
      const { expiresAt, ...token } = await this.getToken({
        grantType: 1,
      });

      this.tokenExpiresAt = expiresAt;

      Object.assign(this.context, token);
    }
  }

  async getToken({ grantType = 1, refreshToken = null } = {}) {
    let uri = 'token';

    if (refreshToken) {
      uri += `/${refreshToken}`;
    }

    const { body } = await this.httpClient.get(uri, {
      searchParams: {
        grant_type: grantType,
      },
    });

    assertSuccess(body, 'token');

    const { result } = body;

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: Date.now() + (result.expire_time - 30) * 1000,
    };
  }

  async getLocalKey({ deviceId }) {
    const device = await this.getDevice({ deviceId });

    return device.local_key;
  }

  async getDevice({ deviceId }) {
    const { body } = await this.httpClient.get(`devices/${deviceId}`);

    assertSuccess(body, 'device');

    return body.result;
  }

  async getDeviceList({ uid }) {
    const { body } = await this.httpClient.get(`users/${uid}/devices`);

    assertSuccess(body, 'user/devices');

    return body.result;
  }

  async getDeviceWithFunctions({ deviceId }) {
    await this.ensureToken();

    const [device, { body: functions }] = await Promise.all([
      this.getDevice({ deviceId }),
      this.httpClient.get(`devices/${deviceId}/functions`),
    ]);

    assertSuccess(functions, 'functions');

    return {
      ...device.result,
      functions: functions.result,
    };
  }

  /**
   * NOTE: this may be used to issue commands directly through Tuya OpenAPI
   * over internet instead of local network
   */
  async sendCommand({ deviceId, commands }) {
    await this.ensureToken();

    const { body } = await this.httpClient.post(
      `devices/${deviceId}/commands`,
      {
        json: {
          commands,
        },
      },
    );

    assertSuccess(body, 'commands');
  }
}

function assertSuccess(body, type) {
  if (!body.success) {
    const error = new Error(
      `Error requesting ${type}: ${body['msg']} (${body['code']})`,
    );
    error['resp'] = body;

    throw error;
  }
}

module.exports = new TuyaApi();
