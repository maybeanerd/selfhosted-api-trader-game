export const gitHubProjectUrl = new URL(
  'https://github.com/maybeanerd/selfhosted-api-trader-game',
);

export function getLinkToCommit (commitHash: string) {
  const newUrl = new URL(gitHubProjectUrl);
  newUrl.pathname = `${gitHubProjectUrl.pathname}/commit/${commitHash}`;
  return newUrl;
}

export function getLinkToTag (tag: string) {
  const newUrl = new URL(gitHubProjectUrl);
  newUrl.pathname = `${gitHubProjectUrl.pathname}/releases/tag/${tag}`;
  return newUrl;
}
