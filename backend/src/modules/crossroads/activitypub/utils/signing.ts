import { serverInfo } from '@/config/serverInfo';
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

export async function signRequest(
  body: Record<string, unknown>,
  privateKey: string,
  keyId: string,
): Promise<{
  headers: {
    Signature: string;
    Date: string;
    Host: string;
  };
}> {
  const base64Hash = createHash('sha256')
    .update(JSON.stringify(body))
    .digest('base64');

  const digestHeader = `SHA-256=${base64Hash}`;
  const date = new Date().toUTCString();
  const { host } = serverInfo.baseUrl;

  const sign = createSign('RSA-SHA256');
  sign.update(digestHeader); // TODO include everything we want to sign
  const signature = sign.sign(privateKey, 'base64');

  const headers = {
    Date: date,
    Host: host,
    Signature: `keyId="${keyId}",headers="(request-target) host date digest",signature="${signature}"`,
  };

  return { headers };
}
