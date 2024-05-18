import { getInstanceActor } from '@/modules/crossroads/activitypub/actor';
import { ActivityPubActorObject } from '@/modules/crossroads/activitypub/actor/types';
import { contentTypeActivityStreams } from '@/modules/crossroads/activitypub/utils/contentType';
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { createHash, createSign, createVerify, generateKeyPair } from 'crypto';
import { z } from 'zod';

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

export async function validateSignedRequest(request: {
  headers: Record<string, string>;
  body?: Record<string, unknown>;
}): Promise<null | { ownerId: string }> {
  const { headers, body } = request;
  const { date, signature, host } = headers;

  console.log('verifying', signature);

  const keyId = signature.match(/keyId="([^"]+)"/)?.[1];
  const signedHeaders = signature.match(/headers="([^"]+)"/)?.[1];
  const signatureValue = signature.match(/signature="([^"]+)"/)?.[1];

  if (!keyId || !signedHeaders || !signatureValue) {
    return null;
  }

  if (body) {
    const base64Hash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('base64');
    const digestHeader = `SHA-256=${base64Hash}`;

    const signedDigest = signature.match(/digest="([^"]+)"/)?.[1];

    if (signedDigest !== digestHeader) {
      console.error('Digest header does not match body');
      return null;
    }
  }

  try {
    // TODO check if keyId exists for an actor in the DB already
    // Only if not do this remote get

    const publicKey = await axios.request({
      url: keyId,
      method: 'get',
    });

    const parsedPublicKey = await z
      .object({
        publicKey: z.object({
          publicKeyPem: z.string(),
          owner: z.string(),
        }),
      })
      .parseAsync(publicKey.data);

    const { publicKeyPem, owner } = parsedPublicKey.publicKey;

    const verify = createVerify('RSA-SHA256');
    verify.update(signatureValue);

    const signatureIsValid = verify.verify(
      publicKeyPem,
      signatureValue,
      'base64',
    );

    // TODO somehow get date and digest from the signature?
    // so that we can compare the body and current date with it, and make sure they align
    // just a valid signature doesnt mean the request is valid in total

    if (!signatureIsValid) {
      console.error('Signature is invalid');
      return null;
    }

    // TODO validate later on that the activity actually came from this actor
    return { ownerId: owner };
  } catch (e) {
    console.error('Failed to verify signature:', e);
    return null;
  }
}
