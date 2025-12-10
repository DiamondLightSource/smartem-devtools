import { useQuery } from '@tanstack/react-query'
import { fetchGitHubRepoStats, type RepoStats } from '~/api/github'

export function useRepoStats(owner: string, repo: string, enabled: boolean) {
  return useQuery<RepoStats, Error>({
    queryKey: ['repoStats', owner, repo],
    queryFn: ({ signal }) => fetchGitHubRepoStats(owner, repo, signal),
    enabled,
  })
}
