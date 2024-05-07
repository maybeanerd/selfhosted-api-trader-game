import packageJson from '@/../package.json';

const serverName = process.env.INSTANCE_NAME ?? packageJson.name;
const baseUrl = process.env.BASE_URL ?? 'http://localhost:8080';

export const serverInfo = {
  name: serverName,
  baseUrl,
  version: packageJson.version,
  description: packageJson.description,
  sourceUrl: packageJson.homepage,
};
