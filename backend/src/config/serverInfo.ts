import packageJson from '@/../package.json';

const serverName = process.env.INSTANCE_NAME ?? packageJson.name;
const baseUrl = new URL(process.env.BASE_URL ?? 'http://localhost:8080');

export const serverInfo = {
  name: serverName,
  softwareName: packageJson.name,
  baseUrl,
  version: packageJson.version,
  description: packageJson.description,
  sourceUrl: packageJson.homepage,
};
