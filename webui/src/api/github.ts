const GITHUB_API = 'https://api.github.com'

export interface RepoStats {
  openPRs: number
  openIssues: number
  lastCommitSha: string
  lastCommitFullSha: string
  lastCommitDate: string
}

interface GitHubPullRequest {
  id: number
}

interface GitHubIssue {
  id: number
  pull_request?: unknown
}

interface GitHubCommit {
  sha: string
  commit: {
    author: {
      date: string
    }
  }
}

export async function fetchGitHubRepoStats(
  owner: string,
  repo: string,
  signal?: AbortSignal
): Promise<RepoStats> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  }

  const [prsResponse, issuesResponse, commitsResponse] = await Promise.all([
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls?state=open&per_page=100`, {
      signal,
      headers,
    }),
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues?state=open&per_page=100`, {
      signal,
      headers,
    }),
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=1`, {
      signal,
      headers,
    }),
  ])

  if (!prsResponse.ok || !issuesResponse.ok || !commitsResponse.ok) {
    const failedResponse = [prsResponse, issuesResponse, commitsResponse].find((r) => !r.ok)
    throw new Error(`GitHub API error: ${failedResponse?.status} ${failedResponse?.statusText}`)
  }

  const prs: GitHubPullRequest[] = await prsResponse.json()
  const issues: GitHubIssue[] = await issuesResponse.json()
  const commits: GitHubCommit[] = await commitsResponse.json()

  const openIssues = issues.filter((issue) => !issue.pull_request).length

  const lastCommit = commits[0]

  return {
    openPRs: prs.length,
    openIssues,
    lastCommitSha: lastCommit?.sha.slice(0, 7) ?? 'n/a',
    lastCommitFullSha: lastCommit?.sha ?? '',
    lastCommitDate: lastCommit?.commit.author.date ?? '',
  }
}
