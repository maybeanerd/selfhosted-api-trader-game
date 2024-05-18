import { getInstanceActor } from '@/modules/crossroads/activitypub/actor';
import { contentTypeActivityStreams } from '@/modules/crossroads/activitypub/utils/contentType';
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

type SigningInput = {
  url: string | URL;
  config?: AxiosRequestConfig;
} & ({ body?: undefined; type: 'get' } | { body: unknown; type: 'post' });

export async function createSignedRequestConfig({
  body,
  type,
  url,
  config,
}: SigningInput): Promise<AxiosRequestConfig> {
  const date = new Date().toUTCString();

  const requestUrl = new URL(url);
  const { pathname, host } = requestUrl;

  const { actor, privateKey } = await getInstanceActor();
  const keyId = actor.publicKey.id;

  let stringToSign = `(request-target): ${type} ${pathname}\nhost: ${host}\ndate: ${date}`;
  let signedHeaders = '(request-target) host date';
  // Only add and sign the digest header if there is a body
  if (body) {
    const base64Hash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('base64');
    const digestHeader = `SHA-256=${base64Hash}`;

    stringToSign += `\ndigest: ${digestHeader}`;
    signedHeaders += ' digest';
  }
  console.log('signing', stringToSign);
  const sign = createSign('RSA-SHA256');
  sign.update(stringToSign);
  const signature = sign.sign(privateKey, 'base64');

  const contentTypeHeader = body
    ? {
      'Content-Type': contentTypeActivityStreams,
    }
    : {};

  const headers = {
    Accept: contentTypeActivityStreams,
    Date: date,
    Host: host,
    ...contentTypeHeader,
    Signature: `keyId="${keyId}",headers="${signedHeaders}",signature="${signature}"`,
  };

  console.log('headers', JSON.stringify(headers, null, 2));

  return { ...config, headers: { ...config?.headers, ...headers } };
}
