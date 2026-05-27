# Triage Labels

This repository uses a standard five-label triage vocabulary. Labels are applied by the `triage` skill to indicate the state of an issue.

## Label reference

| Label | Meaning | Next action |
|---|---|---|
| `needs-triage` | Maintainer needs to evaluate and classify | Maintainer reviews, decides next state |
| `needs-info` | Waiting on reporter for more information | Reporter provides details or closes issue |
| `ready-for-agent` | Fully specified; an AFK agent can pick up | Agent claims and implements |
| `ready-for-human` | Needs human implementation or decision | Engineer claims and implements |
| `wontfix` | Will not be actioned | Issue remains closed |

## State machine

Issues flow through these states as they are worked on:

```
created → needs-triage → (needs-info) → ready-for-agent or ready-for-human → done
                                      ↘ wontfix
```

## Creating labels

If labels don't already exist in the GitHub repository, create them before running the `triage` skill. You can do this manually in the GitHub UI or via:

```sh
gh label create needs-triage --description "Needs maintainer triage"
gh label create needs-info --description "Waiting on reporter"
gh label create ready-for-agent --description "Ready for AFK agent"
gh label create ready-for-human --description "Ready for human implementation"
gh label create wontfix --description "Will not be actioned"
```

## Customization

If your workflow uses different label names (e.g., `bug`, `feature`, `in-progress`), edit this file to document your actual labels. The `triage` skill will use the names you document here.
