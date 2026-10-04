# MOBIQ-Testdatensatz (Release 26.4)

Ein erfundener, aber praxisnaher Datensatz eines ERP-Herstellers für den Möbel- und Küchenhandel (MOBIQ, Musterhaus Software GmbH). Er enthält, was neuraldoc beim Kunden aus GitLab, Jira und Confluence lesen würde. Die Formate entsprechen den echten API-Antworten. neuraldoc nutzt ihn als Showcase und als eigenen Evaluationsdatensatz.

## Vier Repositories

| Repository | Inhalt | Beim Kunden wäre das |
|---|---|---|
| `mobiq` (dieses) | Generator, `data/`: GitLab- und Jira-API-Antworten, Lösung (`ground-truth.json`) | GitLab-Plattform, Jira, Auswertung |
| `mobiq-code` | Das Git-Repository mit allen Branches, Merge-Commits und Tag | Das Code-Repository |
| `mobiq-docs` | Confluence-Seiten und SharePoint-Dateien | Die Dokumentation |
| `mobiq-db` | PostgreSQL-Schema, Migrationen und Daten, `docker compose` | Die Unternehmensdatenbank |

Das neuraldoc-Dashboard bindet alle vier als Git-Submodule unter `datasets/` ein.

## Neu erzeugen

Die vier Repositories im selben Ordner auschecken, dann hier:

```
node generate.mjs        # erzeugt ./out neu (deterministisch, gleiche Commit-Hashes bei jedem Lauf)
node publish.mjs         # verteilt ./out nach data/, ../mobiq-code, ../mobiq-docs, ../mobiq-db
```

`publish.mjs` ersetzt nur die Datenordner. Das Code-Repository wird aus dem Bundle aktualisiert (gleiche Commits) und nur, wenn es keine lokalen Änderungen hat. Andere Zielordner: `--code`, `--docs`, `--db`.

## Inhalt von `out/`

Nach `publish.mjs` liegen `repo/` in `mobiq-code`, `confluence/` und `dokumente/` in `mobiq-docs`, `postgres/` in `mobiq-db` und alles andere unter `data/`.

| Datei | Entspricht | Inhalt |
|---|---|---|
| `repo/`, `mobiq-erp.bundle` | `git clone` | Echtes Repository: `main` mit Tag `v26.3.2`, `release/26.4`, 8 Feature- und Hotfix-Branches, Merge-Commits im GitLab-Format. Java, TypeScript, Delphi, Kotlin, SQL, YAML |
| `gitlab/commits.json` | `GET /projects/42/repository/commits?ref_name=release/26.4&with_stats=true` | 47 Commits (39 eigene, 8 Merges) |
| `gitlab/commits/<sha>/diff.json` | `GET …/repository/commits/:sha/diff` | Echte Diffs je Datei |
| `gitlab/merge_requests.json` | `GET /projects/42/merge_requests?state=merged` | 8 MRs mit Beschreibung, Labels, Checkliste, Milestone |
| `gitlab/merge_requests/<iid>/commits.json` | `GET …/merge_requests/:iid/commits` | Commits je MR |
| `jira/search_jql.json` | `POST /rest/api/3/search/jql` (`fields=*all`) | 21 Issues: Epics, Stories, Bugs, Unteraufgaben; Beschreibungen und Kommentare in ADF, Links, Sprints (`customfield_10020`), Story Points (`customfield_10016`) |
| `jira/project_versions.json` | `GET /rest/api/3/project/MOB/versions` | 26.3, 26.4, 26.5 |
| `confluence/spaces.json` | `GET /wiki/api/v2/spaces` | 4 Bereiche: Anwenderhandbuch, Fachberatung, Entwicklung, Betrieb |
| `confluence/pages.json` | `GET /wiki/api/v2/pages?body-format=storage` | 33 Seiten im Storage-Format (XHTML mit `ac:`-Makros: info, note, expand, children, toc, drawio, jira, Bilder) |
| `confluence/pages/<id>/labels.json`, `attachments.json` | `GET …/pages/{id}/labels`, `/attachments` | Doku-Art steckt in den Labels (`anwenderhandbuch`, `dialogbeschreibung`, `parametertabelle`, `technische-doku`, `installation`, `architektur`) |
| `confluence/storage/*.xml` | – | Seiteninhalt lesbar formatiert |
| `ground-truth.json` | – | Lösung: was die Redaktion für 26.4 ändern muss |
| `postgres/` | `docker compose up -d` | Die Unternehmensdatenbank (PostgreSQL 18, 14 Tabellen, rund 3.300 Zeilen): Schema Stand 26.2, Beispieldaten, die Flyway-Migrationen aus `repo/db/migration` und die Daten nach 26.4 (Finanzkauf, Teillieferungen, Teilrechnungen). `initdb/` wird vom Postgres-Image beim ersten Start in Namensreihenfolge ausgeführt, das Dashboard spielt dieselben Dateien im Browser ein (PGlite) |

Die Confluence-Seiten zeigen den Stand **vor** 26.4. Die Doku ist also so veraltet, wie sie es nach dem Release ohne neuraldoc wäre.

## Änderungen im Release und die eingebauten Fallen

| Änderung | Art | Was es schwer macht |
|---|---|---|
| Teillieferung (MOB-4812, 11 Commits) | fachlich, mit Finance | Überholter Zwischenstand (1–10 → 2–5); Bugfix unter anderem Ticket (MOB-4829); Tippfehler im Schlüssel (`MOB4812`); Finanzkauf-Sperre steht nur im Code und in einem Jira-Kommentar; Doku-Unteraufgabe liegt seit Wochen offen |
| Gutschein teilweise einlösen (MOB-4777) | fachlich | Dieselbe Aussage steht doppelt (Handbuch und FAQ) |
| Ladevolumen (MOB-4801) | fachlich, Parameter | Für den Fahrzeugstamm gibt es keine Dialogbeschreibung, also eine neue Seite |
| Liefersperre → Lieferstopp (MOB-4835) | Umbenennung | Artikel und Genus ändern sich („die Sperre“ → „der Stopp“); Code-Bezeichner bleiben |
| Kassenbelege partitionieren (MOB-4790) | nur Datenbank | Nur technische Doku; das Kassen-Handbuch darf keinen Vorschlag bekommen |
| Vorlagen-Engine (MOB-4760, 7 Commits) | intern + Betrieb | 6 Commits sind reiner Umbau; einer bringt einen Pflichtschritt fürs Update |
| Avisierung 48 h → 24 h | Parameter | Kein Ticket, kein Merge-Request, ein Commit direkt auf dem Release-Branch |
| Testabdeckung Kasse (MOB-4815), Hotfix (MOB-4841) | intern | Keine Doku-Wirkung |
| MOB-4826, MOB-4819, MOB-4844, … | Rauschen | fixVersion 26.4, aber nicht gemergt, beim Kunden gelöst oder erst 26.5 |

Die Ground Truth enthält 36 Pflicht-Änderungen (`must`), 9 Empfehlungen (`should`) und 14 Seiten, die ausdrücklich *nicht* betroffen sind. Damit lassen sich messen:
- **Gefunden:** Anteil der `must`-Einträge, die ein Vorschlag trifft.
- **Fehlalarme:** Vorschläge auf `notAffected`-Seiten oder auf Seiten, die keine Ground Truth nennt.

## Quellen für die Formate

- Jira Cloud REST v3, Issue-Suche (`/search/jql`, `nextPageToken`/`isLast`): https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/
- Confluence Cloud REST v2, Seiten: https://developer.atlassian.com/cloud/confluence/rest/v2/api-group-page/
- Confluence Storage-Format und Makros: https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html
- GitLab Commits API: https://docs.gitlab.com/api/commits/
- GitLab Merge Requests API: https://docs.gitlab.com/api/merge_requests/

Alle Firmen, Personen, Kunden und Inhalte sind erfunden.
