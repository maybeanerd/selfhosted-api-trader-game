export const latestBuildsUrl = new URL(
  'https://app.netlify.com/sites/diluzio/deploys',
);

export const gitHubProjectUrl = new URL(
  'https://github.com/T0TProduction/diluz.io',
);

export function getLinkToCommit (commitHash: string) {
  const newUrl = new URL(gitHubProjectUrl);
  newUrl.pathname = `${gitHubProjectUrl.pathname}/commit/${commitHash}`;
  return newUrl;
}
