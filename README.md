# MOBIQ test dataset (release 26.4)

A fictional but realistic dataset of an ERP vendor for furniture and kitchen retail (MOBIQ, Musterhaus Software GmbH). It contains what neuraldoc would read at a customer from GitLab, Jira and Confluence. The formats match the real API responses. neuraldoc uses it as its showcase and as its own evaluation dataset. The content of the dataset itself (code, tickets, documentation) is in German.

## Four repositories

| Repository | Contents | At a customer this would be |
|---|---|---|
| `mobiq` (this one) | Generator, `data/`: GitLab and Jira API responses, solution (`ground-truth.json`) | GitLab platform, Jira, evaluation |
| [`mobiq-code`](https://github.com/neuraldoc-ai/mobiq-code) | The Git repository with all branches, merge commits and a tag | The code repository |
| [`mobiq-docs`](https://github.com/neuraldoc-ai/mobiq-docs) | Confluence pages and SharePoint files | The documentation |
| [`mobiq-db`](https://github.com/neuraldoc-ai/mobiq-db) | PostgreSQL schema, migrations and data, `docker compose` | The company database |

The [neuraldoc dashboard](https://github.com/neuraldoc-ai/neuraldoc-dashboard) includes all four as Git submodules under `datasets/`.

## Regenerating

Check out the four repositories in the same folder, then run here:

```
node generate.mjs        # rebuilds ./out (deterministic, same commit hashes on every run)
node publish.mjs         # distributes ./out to data/, ../mobiq-code, ../mobiq-docs, ../mobiq-db
```

`publish.mjs` replaces only the data folders. The code repository is updated from the bundle (same commits), and only if it has no local changes. Other target folders: `--code`, `--docs`, `--db`.

The dataset ends at commit `ad176b2` on `release/26.4`. On top of it, `publish.mjs` adds one fixed commit with an English description ([`code-readme.md`](code-readme.md) as `.github/README.md`, which GitHub shows instead of the German company README). Fixed author and date keep its hash identical on every run; it is not part of the dataset, and the dashboard stays pinned to `ad176b2`.

## Contents of `out/`

After `publish.mjs`, `repo/` lives in `mobiq-code`, `confluence/` and `dokumente/` in `mobiq-docs`, `postgres/` in `mobiq-db`, and everything else under `data/`.

| File | Corresponds to | Contents |
|---|---|---|
| `repo/`, `mobiq-erp.bundle` | `git clone` | Real repository: `main` with tag `v26.3.2`, `release/26.4`, 8 feature and hotfix branches, merge commits in GitLab format. Java, TypeScript, Delphi, Kotlin, SQL, YAML |
| `gitlab/commits.json` | `GET /projects/42/repository/commits?ref_name=release/26.4&with_stats=true` | 47 commits (39 own, 8 merges) |
| `gitlab/commits/<sha>/diff.json` | `GET …/repository/commits/:sha/diff` | Real diffs per file |
| `gitlab/merge_requests.json` | `GET /projects/42/merge_requests?state=merged` | 8 MRs with description, labels, checklist, milestone |
| `gitlab/merge_requests/<iid>/commits.json` | `GET …/merge_requests/:iid/commits` | Commits per MR |
| `jira/search_jql.json` | `POST /rest/api/3/search/jql` (`fields=*all`) | 21 issues: epics, stories, bugs, sub-tasks; descriptions and comments in ADF, links, sprints (`customfield_10020`), story points (`customfield_10016`) |
| `jira/project_versions.json` | `GET /rest/api/3/project/MOB/versions` | 26.3, 26.4, 26.5 |
| `confluence/spaces.json` | `GET /wiki/api/v2/spaces` | 4 spaces: user manual, consulting, development, operations |
| `confluence/pages.json` | `GET /wiki/api/v2/pages?body-format=storage` | 33 pages in storage format (XHTML with `ac:` macros: info, note, expand, children, toc, drawio, jira, images) |
| `confluence/pages/<id>/labels.json`, `attachments.json` | `GET …/pages/{id}/labels`, `/attachments` | The document type is in the labels (`anwenderhandbuch`, `dialogbeschreibung`, `parametertabelle`, `technische-doku`, `installation`, `architektur`) |
| `confluence/storage/*.xml` | – | Page content, readably formatted |
| `ground-truth.json` | – | Solution: what the documentation team has to change for 26.4 |
| `postgres/` | `docker compose up -d` | The company database (PostgreSQL 18, 14 tables, about 3,300 rows): schema as of 26.2, sample data, the Flyway migrations from `repo/db/migration` and the data after 26.4 (financing, partial deliveries, partial invoices). The Postgres image runs `initdb/` in name order on first start; the dashboard loads the same files in the browser (PGlite) |

The Confluence pages show the state **before** 26.4. The documentation is therefore as outdated as it would be after the release without neuraldoc.

## Changes in the release and the built-in traps

| Change | Type | What makes it hard |
|---|---|---|
| Partial delivery (MOB-4812, 11 commits) | business, with finance | Superseded intermediate state (1–10 → 2–5); bug fix under another ticket (MOB-4829); typo in the key (`MOB4812`); the financing lock exists only in the code and a Jira comment; the documentation sub-task has been open for weeks |
| Partially redeeming vouchers (MOB-4777) | business | The same statement appears twice (manual and FAQ) |
| Load volume (MOB-4801) | business, parameter | There is no dialog description for the vehicle master data, so a new page is needed |
| "Liefersperre" → "Lieferstopp" (MOB-4835) | renaming | Article and grammatical gender change ("die Sperre" → "der Stopp"); code identifiers stay |
| Partitioning cash receipts (MOB-4790) | database only | Technical documentation only; the cash register manual must not get a proposal |
| Template engine (MOB-4760, 7 commits) | internal + operations | 6 commits are pure refactoring; one adds a mandatory update step |
| Delivery notice 48 h → 24 h | parameter | No ticket, no merge request, a single commit directly on the release branch |
| Test coverage cash register (MOB-4815), hotfix (MOB-4841) | internal | No documentation impact |
| MOB-4826, MOB-4819, MOB-4844, … | noise | fixVersion 26.4, but not merged, solved at the customer or only in 26.5 |

The ground truth contains 36 required changes (`must`), 9 recommendations (`should`) and 14 pages that are explicitly *not* affected. This allows measuring:
- **Found:** share of `must` entries hit by a proposal.
- **False alarms:** proposals on `notAffected` pages or on pages the ground truth does not mention.

## Format references

- Jira Cloud REST v3, issue search (`/search/jql`, `nextPageToken`/`isLast`): https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/
- Confluence Cloud REST v2, pages: https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/
- Confluence storage format and macros: https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html
- GitLab Commits API: https://docs.gitlab.com/api/commits/
- GitLab Merge Requests API: https://docs.gitlab.com/api/merge_requests/

All companies, people, customers and contents are fictional.

## License

MIT, see [LICENSE](LICENSE). The license covers the whole MOBIQ dataset, including `mobiq-code`, `mobiq-docs` and `mobiq-db`. `mobiq-code` deliberately contains no license file of its own so that its commit history stays unchanged.
