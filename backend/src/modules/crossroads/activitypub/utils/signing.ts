import { serverInfo } from '@/config/serverInfo';
import { getInstanceActor } from '@/modules/crossroads/activitypub/actor';
import { contentType } from '@/modules/crossroads/activitypub/utils/contentType';
import type { AxiosRequestConfig } from 'axios';
import { createHash, createSign, generateKeyPair } from 'crypto';

export async function generateKeys(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  return new Promise<{
    publicKey: string;
    privateKey: string;
  }>((resolve, reject) => {
    generateKeyPair(
      'rsa',
      {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },

      (err, publicKey, privateKey) => {
        if (err) {
          reject(err);
        } else {
          resolve({ publicKey, privateKey });
        }
      },
    );
  });
}

export async function createSignedRequestConfig({
  body,
  type,
  url,
  config,
}: {
  body?: unknown;
  type: 'post' | 'get';
  url: string | URL;
  config?: AxiosRequestConfig;
}): Promise<AxiosRequestConfig> {
  const base64Hash = createHash('sha256')
    .update(body ? JSON.stringify(body) : '')
    .digest('base64');

  const digestHeader = `SHA-256=${base64Hash}`;
  const date = new Date().toUTCString();
  const { host } = serverInfo.baseUrl;

  const requestPath = new URL(url).pathname;

  const { actor, privateKey } = await getInstanceActor();
  const keyId = actor.publicKey.id;

  const stringToSign = `(request-target): ${type} ${requestPath}\nhost: ${host}\ndate: ${date}\ndigest: ${digestHeader}`;
  console.log('signing', stringToSign);
  const sign = createSign('RSA-SHA256');
  sign.update(stringToSign);
  const signature = sign.sign(privateKey, 'base64');

  const headers = {
    Accept: contentType,
    Date: date,
    Host: host,
    Signature: `keyId="${keyId}",headers="(request-target) host date digest",signature="${signature}"`,
  };

  console.log('headers', JSON.stringify(headers, null, 2));

  return { ...config, headers: { ...config?.headers, ...headers } };
}
