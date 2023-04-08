import packageJson from '@/../package.json';

const serverName = process.env.INSTANCE_NAME ?? packageJson.name;

export const serverInfo = {
  name: serverName,
  version: packageJson.version,
  desciption: packageJson.description,
};