# MOBIQ ERP (fictional)

This is the code repository of **MOBIQ**, a fictional ERP vendor for furniture and kitchen retail (Musterhaus Software GmbH). It is part of the [MOBIQ evaluation dataset](https://github.com/neuraldoc-ai/mobiq) used by [neuraldoc](https://github.com/neuraldoc-ai/neuraldoc-dashboard) as showcase and test case. All companies, people and contents are fictional; code, commit messages and the repository's own [README](../README.md) are in German, as they would be at a German customer.

| Folder | Contents |
| --- | --- |
| `server/` | Application server (Java 21) |
| `web/` | Web client (React, TypeScript) |
| `desktop/` | Desktop client (Delphi) |
| `app/fahrer/` | Driver app (Kotlin) |
| `db/migration/` | Database migrations (Flyway) |
| `config/parameter/` | Parameters per tenant |
| `druck/vorlagen/` | Document templates |

Branches: `main` with tag `v26.3.2`, the release branch `release/26.4` (default) and eight feature and hotfix branches with GitLab-style merge commits. Tickets are referenced as `MOB-xxxx` (Jira).

The dataset ends at commit `df9f414`. The commit on top of it only adds this English description and is not part of the dataset. Documentation lives in [mobiq-docs](https://github.com/neuraldoc-ai/mobiq-docs), the database in [mobiq-db](https://github.com/neuraldoc-ai/mobiq-db).

License: MIT, see [neuraldoc-ai/mobiq](https://github.com/neuraldoc-ai/mobiq/blob/main/LICENSE).
