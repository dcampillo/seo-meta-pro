# Issue Tracker: GitHub

This repository uses GitHub Issues to track all work items, bugs, and feature requests.

## How skills interact with GitHub

When you use skills like `to-issues`, `to-prd`, `triage`, or `qa`:

- Issues are created and read via the `gh` (GitHub CLI) tool
- The repository URL is inferred from `git remote origin` (dcampillo/seo-meta-pro)
- Labels are applied to issues for triage and categorization
- Comments may be posted on issues for task completion or updates

## Accessing issues

View issues in the browser:
- **All issues:** https://github.com/dcampillo/seo-meta-pro/issues
- **By label:** https://github.com/dcampillo/seo-meta-pro/issues?q=label%3Aready-for-agent

Or use the `gh` CLI:
```sh
gh issue list
gh issue view <number>
gh issue create --title "..." --body "..."
```

## Authentication

The `gh` CLI uses your local GitHub authentication. Ensure you've authenticated:
```sh
gh auth login
```

## Permissions

You need at least **write** access to the repository to:
- Create issues
- Apply labels
- Post comments

The dcampillo/seo-meta-pro repository is public, so viewing issues requires no authentication.
