// The MOBIQ code repository: the 26.3 baseline and every change up to the 26.4 release.
// generate.mjs turns this into a real git repository (branches, merge requests, merge commits),
// so diffs, dates and authors are what `git` and the GitLab API would really return.
//
// Ops per commit: { write: path, content } | { edit: path, from, to } | { append: path, text } | { remove: path }

const J = 'server/src/main/java/de/musterhaus/mobiq'
const T = 'server/src/test/java/de/musterhaus/mobiq'

/* ------------------------------------------------------------------ */
/* Baseline: release 26.3.2                                            */
/* ------------------------------------------------------------------ */

export const baseline = {
  date: '2026-07-20T16:42:00+02:00',
  author: 'brenner',
  message: 'Release 26.3.2\n\nStand der ausgelieferten Version 26.3.2.',
  files: {
    VERSION: '26.3.2\n',
    'README.md': `# MOBIQ ERP

ERP und Warenwirtschaft für den Möbel- und Küchenhandel.

- \`server/\` Anwendungsserver (Java 21)
- \`web/\` Web-Client (React, TypeScript)
- \`desktop/\` Desktop-Client (Delphi)
- \`app/fahrer/\` Fahrer-App (Kotlin)
- \`db/migration/\` Datenbankmigrationen (Flyway)
- \`config/parameter/\` Parameter je Mandant
- \`druck/vorlagen/\` Belegvorlagen

Tickets: MOB-xxxx in Jira. Commit-Nachrichten beginnen mit dem Ticket-Schlüssel.
`,
    '.gitlab-ci.yml': `stages: [build, test, package]

build:
  stage: build
  script: ./gradlew assemble && npm --prefix web ci && npm --prefix web run build

test:
  stage: test
  script: ./gradlew test
`,
    'config/parameter/auftrag.yaml': `# Parameter Auftrag und Lieferung. Je Mandant unter Administration > Parameter überschreibbar.
LIEF_VORLAUF_TAGE:
  typ: int
  standard: 3
  min: 0
  max: 14
  einheit: Tage
  beschreibung: Vorlauf zwischen Wareneingang und frühestem Liefertermin
LIEF_AVIS_STUNDEN:
  typ: int
  standard: 48
  min: 12
  max: 96
  einheit: Stunden
  beschreibung: Avisierung an den Kunden vor der Lieferung
ANZ_MIN_PROZ:
  typ: int
  standard: 20
  min: 0
  max: 100
  einheit: Prozent
  beschreibung: Mindestanzahlung bei Vertragsabschluss
MONT_ZEIT_PUFFER:
  typ: int
  standard: 30
  min: 0
  max: 120
  einheit: Minuten
  beschreibung: Zeitpuffer je Montage
`,
    'config/parameter/tour.yaml': `# Parameter Tourenplanung
TOUR_MAX_STOPPS:
  typ: int
  standard: 12
  min: 1
  max: 30
  einheit: Stopps
  beschreibung: Höchstzahl Stopps je Tour
TOUR_START_ZEIT:
  typ: zeit
  standard: "07:00"
  min: "05:00"
  max: "10:00"
  beschreibung: Frühester Tourstart
`,
    'config/parameter/fibu.yaml': `# Parameter Übergabe an die Finanzbuchhaltung
FIBU_KONTO_ANZAHLUNG:
  typ: konto
  standard: "1718"
  beschreibung: Konto für erhaltene Anzahlungen (SKR03)
FIBU_EXPORT_ZEIT:
  typ: zeit
  standard: "02:00"
  min: "00:00"
  max: "05:00"
  beschreibung: Uhrzeit der nächtlichen Übergabe
`,
    'db/migration/V26_3_004__idx_kvp_artikel.sql': `-- Schnellere Suche nach Artikelnummer in Kaufvertragspositionen
CREATE INDEX idx_kvp_artikel ON kv_position (artikel_nr);
`,
    'db/migration/V26_3_009__kv_finanzkauf.sql': `-- Kennzeichen Finanzkauf (Ratenkredit über Partnerbank)
ALTER TABLE kaufvertrag ADD COLUMN finanzkauf boolean NOT NULL DEFAULT false;
`,
    [`${J}/auftrag/Kaufvertrag.java`]: `package de.musterhaus.mobiq.auftrag;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Kopf eines Kaufvertrags. Ein Kaufvertrag wird in einer Lieferung ausgeliefert. */
public class Kaufvertrag {

    private final String kvNr;
    private final String kundeNr;
    private final List<KvPosition> positionen = new ArrayList<>();
    private BigDecimal anzahlung = BigDecimal.ZERO;
    private boolean finanzkauf;
    private boolean liefersperre;
    private KvStatus status = KvStatus.ERFASST;

    public Kaufvertrag(String kvNr, String kundeNr) {
        this.kvNr = kvNr;
        this.kundeNr = kundeNr;
    }

    /** Lieferbereit, wenn alle Positionen im Lager sind und keine Liefersperre gesetzt ist. */
    public boolean istLieferbereit() {
        return !liefersperre && positionen.stream().allMatch(KvPosition::imLager);
    }

    public BigDecimal warenwert() {
        return positionen.stream().map(KvPosition::betrag).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public String kvNr() { return kvNr; }
    public String kundeNr() { return kundeNr; }
    public List<KvPosition> positionen() { return positionen; }
    public BigDecimal anzahlung() { return anzahlung; }
    public void setAnzahlung(BigDecimal anzahlung) { this.anzahlung = anzahlung; }
    public boolean finanzkauf() { return finanzkauf; }
    public boolean liefersperre() { return liefersperre; }
    public void setLiefersperre(boolean liefersperre) { this.liefersperre = liefersperre; }
    public KvStatus status() { return status; }
    public void setStatus(KvStatus status) { this.status = status; }
}
`,
    [`${J}/auftrag/KvPosition.java`]: `package de.musterhaus.mobiq.auftrag;

import java.math.BigDecimal;

/** Position eines Kaufvertrags. */
public record KvPosition(
        String artikelNr,
        String text,
        int menge,
        BigDecimal betrag,
        boolean montage,
        boolean imLager,
        BigDecimal volumenM3) {
}
`,
    [`${J}/auftrag/KvStatus.java`]: `package de.musterhaus.mobiq.auftrag;

public enum KvStatus { ERFASST, LIEFERBEREIT, DISPONIERT, AUSGELIEFERT, ABGERECHNET, STORNIERT }
`,
    [`${J}/tour/TourStopp.java`]: `package de.musterhaus.mobiq.tour;

/** Ein Stopp auf einer Tour. */
public record TourStopp(String kvNr, boolean montage, double volumenM3) {
}
`,
    [`${J}/tour/StoppBuilder.java`]: `package de.musterhaus.mobiq.tour;

import de.musterhaus.mobiq.auftrag.Kaufvertrag;
import java.util.List;

/** Baut die Stopps einer Tour aus lieferbereiten Kaufverträgen. */
public class StoppBuilder {

    /** Ein Kaufvertrag ergibt genau einen Stopp. */
    public List<TourStopp> baue(Kaufvertrag kv) {
        boolean montage = kv.positionen().stream().anyMatch(p -> p.montage());
        return List.of(new TourStopp(kv.kvNr(), montage, volumen(kv)));
    }

    private double volumen(Kaufvertrag kv) {
        return kv.positionen().stream().mapToDouble(p -> p.volumenM3().doubleValue()).sum();
    }
}
`,
    [`${J}/tour/TourPruefung.java`]: `package de.musterhaus.mobiq.tour;

import de.musterhaus.mobiq.param.Parameter;

/** Prüft eine Tour vor dem Speichern. */
public class TourPruefung {

    private final Parameter param;

    public TourPruefung(Parameter param) {
        this.param = param;
    }

    public PruefErgebnis pruefe(Tour tour) {
        if (tour.stopps().size() > param.getInt("TOUR_MAX_STOPPS")) {
            return PruefErgebnis.fehler("Zu viele Stopps auf der Tour");
        }
        return PruefErgebnis.ok();
    }
}
`,
    [`${J}/faktura/Belegart.java`]: `package de.musterhaus.mobiq.faktura;

/** Belegarten, wie sie an die Finanzbuchhaltung übergeben werden. */
public enum Belegart {
    RE("Rechnung"),
    GS("Gutschrift"),
    AZ("Anzahlung");

    private final String text;

    Belegart(String text) { this.text = text; }

    public String text() { return text; }
}
`,
    [`${J}/faktura/RechnungService.java`]: `package de.musterhaus.mobiq.faktura;

import de.musterhaus.mobiq.auftrag.Kaufvertrag;
import de.musterhaus.mobiq.auftrag.KvStatus;

/** Erstellt Rechnungen zum Kaufvertrag. */
public class RechnungService {

    private final AnzahlungVerrechnung verrechnung = new AnzahlungVerrechnung();

    /** Schlussrechnung, sobald der Kaufvertrag vollständig ausgeliefert ist. */
    public Rechnung schlussrechnung(Kaufvertrag kv) {
        if (kv.status() != KvStatus.AUSGELIEFERT) {
            throw new IllegalStateException("Kaufvertrag " + kv.kvNr() + " ist noch nicht vollständig ausgeliefert");
        }
        Rechnung r = Rechnung.neu(Belegart.RE, kv);
        r.setAnzahlungVerrechnet(verrechnung.voll(kv));
        return r;
    }
}
`,
    [`${J}/faktura/AnzahlungVerrechnung.java`]: `package de.musterhaus.mobiq.faktura;

import de.musterhaus.mobiq.auftrag.Kaufvertrag;
import java.math.BigDecimal;

/** Verrechnet die Anzahlung eines Kaufvertrags mit Rechnungen. */
public class AnzahlungVerrechnung {

    /** Die gesamte Anzahlung wird mit der Schlussrechnung verrechnet. */
    public BigDecimal voll(Kaufvertrag kv) {
        return kv.anzahlung();
    }
}
`,
    [`${J}/fibu/export/Buchungssatz.java`]: `package de.musterhaus.mobiq.fibu.export;

import de.musterhaus.mobiq.faktura.Belegart;
import java.math.BigDecimal;

/** Ein Satz in fibu_export. Der Dienst fibu-import liest die Tabelle nachts. */
public record Buchungssatz(
        Belegart belegart,
        String belegnr,
        String kvNr,
        BigDecimal betragBrutto,
        short steuerschluessel) {
}
`,
    [`${J}/fibu/export/GutscheinBuchung.java`]: `package de.musterhaus.mobiq.fibu.export;

import de.musterhaus.mobiq.kasse.Gutschein;

/** Buchungen zu Gutscheinen für die Finanzbuchhaltung. */
public class GutscheinBuchung {

    /** Verkauf: Gutscheinwert als Verbindlichkeit. */
    public Buchung verkauf(Gutschein g) {
        return Buchung.verbindlichkeit(Konten.GUTSCHEIN, g.wert());
    }

    /** Einlösung: die Verbindlichkeit wird vollständig aufgelöst. */
    public Buchung einloesung(Gutschein g) {
        return Buchung.aufloesen(Konten.GUTSCHEIN, g.wert());
    }
}
`,
    [`${J}/kasse/GutscheinService.java`]: `package de.musterhaus.mobiq.kasse;

import java.math.BigDecimal;

/** Gutscheine an der Kasse. */
public class GutscheinService {

    /**
     * Löst einen Gutschein ein. Ein Gutschein wird immer vollständig eingelöst;
     * ist der Bon günstiger, wird der Rest als neuer Gutschein ausgegeben.
     */
    public Einloesung einloesen(Gutschein g, BigDecimal bonBetrag) {
        BigDecimal rest = g.wert().subtract(bonBetrag);
        g.entwerten();
        if (rest.signum() > 0) {
            return Einloesung.mitNeuemGutschein(g.wert(), Gutschein.neu(rest));
        }
        return Einloesung.voll(g.wert());
    }
}
`,
    [`${J}/kasse/Tagesabschluss.java`]: `package de.musterhaus.mobiq.kasse;

import java.time.LocalDate;
import java.util.List;

/** Tagesabschluss je Filiale: liest alle Kassenbelege des Tages. */
public class Tagesabschluss {

    private final KassenbelegRepository belege;

    public Tagesabschluss(KassenbelegRepository belege) {
        this.belege = belege;
    }

    public Abschluss erstelle(String filiale, LocalDate tag) {
        List<Kassenbeleg> liste = belege.findeTag(filiale, tag);
        return Abschluss.aus(filiale, tag, liste.get(0).kassenNr(), liste);
    }
}
`,
    [`${J}/druck/LegacyDruck.java`]: `package de.musterhaus.mobiq.druck;

import java.util.Map;

/** Druckausgabe über FreeMarker-Vorlagen in druck/vorlagen. */
public class LegacyDruck {

    public byte[] drucke(String vorlage, Map<String, Object> daten) {
        return FreemarkerRenderer.render("druck/vorlagen/" + vorlage + ".ftl", daten);
    }
}
`,
    'druck/vorlagen/rechnung.ftl': `<#-- Rechnung -->
<h1>Rechnung ${'${'}beleg.nr}</h1>
<p>Kaufvertrag ${'${'}kv.nr} vom ${'${'}kv.datum}</p>
<#list positionen as p><tr><td>${'${'}p.text}</td><td>${'${'}p.betrag}</td></tr></#list>
<p>Abzüglich Anzahlung: ${'${'}beleg.anzahlungVerrechnet}</p>
`,
    'druck/vorlagen/lieferschein.ftl': `<#-- Lieferschein -->
<h1>Lieferschein ${'${'}kv.nr}</h1>
<#list positionen as p><tr><td>${'${'}p.menge}</td><td>${'${'}p.text}</td></tr></#list>
`,
    'druck/vorlagen/kaufvertrag.ftl': `<#-- Kaufvertrag -->
<h1>Kaufvertrag ${'${'}kv.nr}</h1>
<p>Anzahlung: ${'${'}kv.anzahlung}</p>
`,
    'druck/vorlagen/bon.xml': `<bon>
  <kopf filiale="{filiale}" kasse="{kasse}" datum="{datum}"/>
  <positionen/>
  <zahlungen/>
  <fuss text="Vielen Dank für Ihren Einkauf"/>
</bon>
`,
    'web/src/kaufvertrag/RegisterLieferung.tsx': `import { AdressFeld, Auswahl, Checkbox, Field, KwAuswahl } from '@mobiq/ui'
import type { Kaufvertrag } from '../api/types'
import { t } from '../i18n'

export function RegisterLieferung({ kv, onChange }: { kv: Kaufvertrag; onChange: (kv: Kaufvertrag) => void }) {
  return (
    <section aria-label={t('kv.lieferung.titel')}>
      <Field label={t('kv.lieferung.wunschtermin')} required>
        <KwAuswahl value={kv.wunschtermin} onChange={(wunschtermin) => onChange({ ...kv, wunschtermin })} />
      </Field>
      <Field label={t('kv.lieferung.adresse')} required>
        <AdressFeld value={kv.lieferadresse} onChange={(lieferadresse) => onChange({ ...kv, lieferadresse })} />
      </Field>
      <Field label={t('kv.lieferung.etage')}>
        <Auswahl value={kv.etage} optionen={['EG', '1. OG', '2. OG', '3. OG+', 'mit Aufzug']} onChange={(etage) => onChange({ ...kv, etage })} />
      </Field>
      <Checkbox label={t('kv.lieferung.liefersperre')} checked={kv.liefersperre} onChange={(liefersperre) => onChange({ ...kv, liefersperre })} />
      <Checkbox label={t('kv.lieferung.montage')} checked={kv.montage} onChange={(montage) => onChange({ ...kv, montage })} />
    </section>
  )
}
`,
    'web/src/tour/StoppKarte.tsx': `import { Karte, Pin } from '@mobiq/karte'
import type { TourStopp } from '../api/types'

export function StoppKarte({ stopps }: { stopps: TourStopp[] }) {
  return (
    <Karte>
      {stopps.map((s, i) => (
        <Pin key={s.kvNr} nummer={i + 1} titel={s.kvNr} montage={s.montage} />
      ))}
    </Karte>
  )
}
`,
    'web/src/tour/TourKopf.tsx': `import type { Tour } from '../api/types'
import { t } from '../i18n'

export function TourKopf({ tour }: { tour: Tour }) {
  const volumen = tour.stopps.reduce((n, s) => n + s.volumenM3, 0)
  return (
    <header className='tour-kopf'>
      <h2>{tour.name}</h2>
      <span>{t('tour.volumen')}: {volumen.toFixed(1)} m³</span>
    </header>
  )
}
`,
    'web/src/kasse/Zahlung.tsx': `import { Betrag, Field, Scanner } from '@mobiq/ui'
import { gutscheinEinloesen } from '../api/kasse'
import { t } from '../i18n'

export function GutscheinZahlung({ bon }: { bon: { id: string; offen: number } }) {
  return (
    <Field label={t('kasse.gutschein')}>
      <Scanner onScan={(code) => gutscheinEinloesen(bon.id, code)} />
      <Betrag value={bon.offen} readOnly />
    </Field>
  )
}
`,
    'web/src/stamm/Fahrzeug.tsx': `import { Auswahl, Field, Zahl, Text } from '@mobiq/ui'
import type { Fahrzeug } from '../api/types'
import { t } from '../i18n'

export function FahrzeugMaske({ fz, onChange }: { fz: Fahrzeug; onChange: (fz: Fahrzeug) => void }) {
  return (
    <form>
      <Field label={t('stamm.fahrzeug.kennzeichen')} required>
        <Text value={fz.kennzeichen} onChange={(kennzeichen) => onChange({ ...fz, kennzeichen })} />
      </Field>
      <Field label={t('stamm.fahrzeug.zuladung')}>
        <Zahl value={fz.zuladungKg} onChange={(zuladungKg) => onChange({ ...fz, zuladungKg })} />
      </Field>
      <Field label={t('stamm.fahrzeug.filiale')} required>
        <Auswahl value={fz.filiale} optionen={fz.filialen} onChange={(filiale) => onChange({ ...fz, filiale })} />
      </Field>
    </form>
  )
}
`,
    'web/src/i18n/de.json': `{
  "kv.lieferung.titel": "Lieferung",
  "kv.lieferung.wunschtermin": "Wunschtermin",
  "kv.lieferung.adresse": "Lieferadresse",
  "kv.lieferung.etage": "Etage / Aufzug",
  "kv.lieferung.liefersperre": "Liefersperre",
  "kv.lieferung.montage": "Montage",
  "tour.offen": "Offene Lieferungen",
  "tour.volumen": "Volumen",
  "kasse.gutschein": "Gutschein",
  "stamm.fahrzeug.kennzeichen": "Kennzeichen",
  "stamm.fahrzeug.zuladung": "Zuladung (kg)",
  "stamm.fahrzeug.filiale": "Filiale"
}
`,
    'web/src/i18n/nl.json': `{
  "kv.lieferung.titel": "Levering",
  "kv.lieferung.liefersperre": "Leverblokkering",
  "kv.lieferung.montage": "Montage"
}
`,
    'web/src/i18n/fr.json': `{
  "kv.lieferung.titel": "Livraison",
  "kv.lieferung.liefersperre": "Blocage de livraison",
  "kv.lieferung.montage": "Montage"
}
`,
    'desktop/kaufvertrag/FrmLieferung.pas': `unit FrmLieferung;

interface

uses
  Vcl.Forms, Vcl.StdCtrls, Vcl.Controls, MobiqKaufvertrag, MobiqTexte;

type
  TFrmLieferung = class(TForm)
    cbxWunschtermin: TComboBox;
    edtLieferadresse: TEdit;
    cbxEtage: TComboBox;
    chkLiefersperre: TCheckBox;
    chkMontage: TCheckBox;
    procedure FormShow(Sender: TObject);
  private
    FKv: TKaufvertrag;
  end;

implementation

{$R *.dfm}

procedure TFrmLieferung.FormShow(Sender: TObject);
begin
  chkLiefersperre.Caption := Texte.Get(1203);
  chkLiefersperre.Checked := FKv.Liefersperre;
  chkMontage.Checked := FKv.HatMontage;
end;

end.
`,
    'desktop/stamm/FrmFahrzeug.pas': `unit FrmFahrzeug;

interface

uses
  Vcl.Forms, Vcl.StdCtrls, Vcl.Controls, MobiqStamm;

type
  TFrmFahrzeug = class(TForm)
    edtKennzeichen: TEdit;
    edtZuladung: TEdit;
    cbxFiliale: TComboBox;
  end;

implementation

{$R *.dfm}

end.
`,
    'desktop/res/texte_de.rc': `STRINGTABLE
BEGIN
  1201, "Wunschtermin"
  1202, "Lieferadresse"
  1203, "Liefersperre"
  1204, "Montage"
  1301, "Kennzeichen"
  1302, "Zuladung (kg)"
  1303, "Filiale"
END
`,
    'app/fahrer/src/main/kotlin/de/musterhaus/mobiq/fahrer/Restzahlung.kt': `package de.musterhaus.mobiq.fahrer

import java.math.BigDecimal

/** Zeigt dem Fahrer die offene Restzahlung beim Kunden. */
class Restzahlung(private val api: FahrerApi) {

    /** Offener Betrag des Kaufvertrags: Warenwert minus Anzahlung. */
    fun offenerBetrag(stopp: Stopp): BigDecimal {
        val kv = api.kaufvertrag(stopp.kvNr)
        return kv.warenwert - kv.anzahlung
    }
}
`,
  },
}

/* ------------------------------------------------------------------ */
/* Release 26.4: release branch, merge requests and direct commits     */
/* ------------------------------------------------------------------ */

export const releaseBranch = {
  name: 'release/26.4',
  date: '2026-08-25T09:05:00+02:00',
  author: 'brenner',
  message: 'Version auf 26.4.0-SNAPSHOT gesetzt',
  ops: [{ edit: 'VERSION', from: '26.3.2', to: '26.4.0-SNAPSHOT' }],
}

/**
 * Every change in merge order. `mr` = merged through a merge request; without `mr` the commits
 * go straight onto the release branch (it happens: hotfixes, "nur schnell" config changes).
 */
export const changes = [
  {
    id: 'gutschein',
    ticket: 'MOB-4777',
    branch: 'feature/MOB-4777-gutschein-teileinloesung',
    mr: {
      iid: 1244,
      title: 'MOB-4777 Gutschein teilweise einlösen',
      description:
        'Gutscheine können an der Kasse teilweise eingelöst werden. Das Restguthaben bleibt auf dem Gutschein und steht auf dem Bon.\n\nFibu: Verbindlichkeit wird nur in Höhe des eingelösten Betrags aufgelöst (mit Elif abgestimmt).\n\nCloses MOB-4777\n\n## Checkliste\n- [x] Tests\n- [x] Review\n- [ ] Doku angepasst',
      labels: ['Kasse', 'Fibu', 'Feature'],
      author: 'becker',
      created: '2026-08-27T15:10:00+02:00',
      merged: '2026-09-03T10:22:00+02:00',
      mergedBy: 'engel',
    },
    commits: [
      {
        date: '2026-08-27T14:51:00+02:00',
        author: 'becker',
        message: 'MOB-4777 Kasse: Gutschein teilweise einlösen, Restguthaben speichern',
        ops: [
          {
            edit: `${J}/kasse/GutscheinService.java`,
            from: `    /**
     * Löst einen Gutschein ein. Ein Gutschein wird immer vollständig eingelöst;
     * ist der Bon günstiger, wird der Rest als neuer Gutschein ausgegeben.
     */
    public Einloesung einloesen(Gutschein g, BigDecimal bonBetrag) {
        BigDecimal rest = g.wert().subtract(bonBetrag);
        g.entwerten();
        if (rest.signum() > 0) {
            return Einloesung.mitNeuemGutschein(g.wert(), Gutschein.neu(rest));
        }
        return Einloesung.voll(g.wert());
    }`,
            to: `    /**
     * Löst einen Gutschein ganz oder teilweise ein. Ein Restguthaben bleibt auf demselben
     * Gutschein und kann später eingelöst werden.
     */
    public Einloesung einloesen(Gutschein g, BigDecimal bonBetrag) {
        BigDecimal eingeloest = g.restwert().min(bonBetrag);
        g.belasten(eingeloest);
        return Einloesung.teilweise(eingeloest, g.restwert());
    }`,
          },
          {
            edit: 'web/src/kasse/Zahlung.tsx',
            from: `      <Betrag value={bon.offen} readOnly />`,
            to: `      <Betrag value={bon.offen} readOnly />
      <Betrag label={t('kasse.restguthaben')} value={bon.restguthaben} readOnly />`,
          },
          { edit: 'web/src/kasse/Zahlung.tsx', from: `bon: { id: string; offen: number }`, to: `bon: { id: string; offen: number; restguthaben?: number }` },
          { edit: 'web/src/i18n/de.json', from: `  "kasse.gutschein": "Gutschein",`, to: `  "kasse.gutschein": "Gutschein",\n  "kasse.restguthaben": "Restguthaben",` },
        ],
      },
      {
        date: '2026-08-29T11:20:00+02:00',
        author: 'becker',
        message: 'MOB-4777 Bon: Restguthaben drucken',
        ops: [{ edit: 'druck/vorlagen/bon.xml', from: `  <zahlungen/>`, to: `  <zahlungen/>\n  <gutschein wenn="{gutschein.restwert} > 0" text="Restguthaben Gutschein {gutschein.nr}: {gutschein.restwert}"/>` }],
      },
      {
        date: '2026-09-01T16:05:00+02:00',
        author: 'hoffmann',
        message: 'MOB-4777 Fibu: Gutscheinverbindlichkeit nur in Höhe des Einlösebetrags auflösen\n\nBisher wurde bei Einlösung immer der volle Gutscheinwert aufgelöst.\nMit Teileinlösung bleibt der Rest als Verbindlichkeit stehen.',
        ops: [
          {
            edit: `${J}/fibu/export/GutscheinBuchung.java`,
            from: `    /** Einlösung: die Verbindlichkeit wird vollständig aufgelöst. */
    public Buchung einloesung(Gutschein g) {
        return Buchung.aufloesen(Konten.GUTSCHEIN, g.wert());
    }`,
            to: `    /** Einlösung: die Verbindlichkeit wird in Höhe des eingelösten Betrags aufgelöst, der Rest bleibt stehen. */
    public Buchung einloesung(Gutschein g, BigDecimal eingeloest) {
        return Buchung.aufloesen(Konten.GUTSCHEIN, eingeloest);
    }`,
          },
          { edit: `${J}/fibu/export/GutscheinBuchung.java`, from: `import de.musterhaus.mobiq.kasse.Gutschein;`, to: `import de.musterhaus.mobiq.kasse.Gutschein;\nimport java.math.BigDecimal;` },
        ],
      },
      {
        date: '2026-09-02T09:40:00+02:00',
        author: 'becker',
        message: 'MOB-4777 Tests Teileinlösung',
        ops: [
          {
            write: `${T}/kasse/GutscheinServiceTest.java`,
            content: `package de.musterhaus.mobiq.kasse;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class GutscheinServiceTest {

    @Test
    void teileinloesungLaesstRestAufDemGutschein() {
        Gutschein g = Gutschein.neu(new BigDecimal("100.00"));
        Einloesung e = new GutscheinService().einloesen(g, new BigDecimal("30.00"));
        assertThat(e.eingeloest()).isEqualByComparingTo("30.00");
        assertThat(g.restwert()).isEqualByComparingTo("70.00");
    }
}
`,
          },
        ],
      },
    ],
  },
  {
    id: 'ladevolumen',
    ticket: 'MOB-4801',
    branch: 'feature/MOB-4801-ladevolumen',
    mr: {
      iid: 1251,
      title: 'MOB-4801 Ladevolumen je Fahrzeug prüfen',
      description: 'Fahrzeuge bekommen ein Ladevolumen. Überladene Touren werden rot markiert und lassen sich nur mit Bestätigung speichern.\n\nCloses MOB-4801',
      labels: ['Tour', 'Feature'],
      author: 'schuster',
      created: '2026-09-02T10:00:00+02:00',
      merged: '2026-09-10T14:31:00+02:00',
      mergedBy: 'engel',
    },
    commits: [
      {
        date: '2026-09-02T09:58:00+02:00',
        author: 'schuster',
        message: 'MOB-4801 Fahrzeugstamm: Feld Ladevolumen (m³)',
        ops: [
          {
            edit: 'web/src/stamm/Fahrzeug.tsx',
            from: `      <Field label={t('stamm.fahrzeug.zuladung')}>`,
            to: `      <Field label={t('stamm.fahrzeug.ladevolumen')} required>
        <Zahl value={fz.ladevolumenM3} einheit='m³' onChange={(ladevolumenM3) => onChange({ ...fz, ladevolumenM3 })} />
      </Field>
      <Field label={t('stamm.fahrzeug.zuladung')}>`,
          },
          { edit: 'web/src/i18n/de.json', from: `  "stamm.fahrzeug.zuladung": "Zuladung (kg)",`, to: `  "stamm.fahrzeug.ladevolumen": "Ladevolumen (m³)",\n  "stamm.fahrzeug.zuladung": "Zuladung (kg)",` },
          { edit: 'desktop/stamm/FrmFahrzeug.pas', from: `    edtZuladung: TEdit;`, to: `    edtLadevolumen: TEdit;\n    edtZuladung: TEdit;` },
          { edit: 'desktop/res/texte_de.rc', from: `  1303, "Filiale"`, to: `  1303, "Filiale"\n  1304, "Ladevolumen (m³)"` },
        ],
      },
      {
        date: '2026-09-04T13:12:00+02:00',
        author: 'schuster',
        message: 'MOB-4801 Parameter TOUR_MAX_LADEVOLUMEN_M3 und TOUR_UEBERLADUNG_ERLAUBT',
        ops: [
          {
            append: 'config/parameter/tour.yaml',
            text: `TOUR_MAX_LADEVOLUMEN_M3:
  typ: int
  standard: 38
  min: 5
  max: 60
  einheit: m³
  beschreibung: Ladevolumen für neu angelegte Fahrzeuge
TOUR_UEBERLADUNG_ERLAUBT:
  typ: bool
  standard: true
  beschreibung: Tour trotz Überladung speichern (mit Bestätigung)
`,
          },
        ],
      },
      {
        date: '2026-09-08T17:03:00+02:00',
        author: 'schuster',
        message: 'MOB-4801 Tour rot markieren bei Überladung, Speichern mit Bestätigung',
        ops: [
          {
            edit: `${J}/tour/TourPruefung.java`,
            from: `        return PruefErgebnis.ok();`,
            to: `        double volumen = tour.stopps().stream().mapToDouble(TourStopp::volumenM3).sum();
        if (volumen > tour.fahrzeug().ladevolumenM3()) {
            if (!param.getBool("TOUR_UEBERLADUNG_ERLAUBT")) {
                return PruefErgebnis.fehler("Ladevolumen des Fahrzeugs überschritten");
            }
            return PruefErgebnis.bestaetigen("Ladevolumen überschritten. Trotzdem speichern?");
        }
        return PruefErgebnis.ok();`,
          },
          {
            edit: 'web/src/tour/TourKopf.tsx',
            from: `      <span>{t('tour.volumen')}: {volumen.toFixed(1)} m³</span>`,
            to: `      <span className={volumen > tour.fahrzeug.ladevolumenM3 ? 'ueberladen' : undefined}>
        {t('tour.volumen')}: {volumen.toFixed(1)} / {tour.fahrzeug.ladevolumenM3} m³
      </span>`,
          },
        ],
      },
      {
        date: '2026-09-09T10:30:00+02:00',
        author: 'schuster',
        message: 'MOB-4801 Tests Volumenberechnung',
        ops: [
          {
            write: `${T}/tour/TourPruefungTest.java`,
            content: `package de.musterhaus.mobiq.tour;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TourPruefungTest {

    @Test
    void ueberladeneTourBrauchtBestaetigung() {
        Tour tour = Testdaten.tourMitVolumen(41.5, 38);
        assertThat(new TourPruefung(Testdaten.parameter()).pruefe(tour).brauchtBestaetigung()).isTrue();
    }
}
`,
          },
        ],
      },
    ],
  },
  {
    id: 'kassenbelege',
    ticket: 'MOB-4790',
    branch: 'feature/MOB-4790-kassenbeleg-partition',
    mr: {
      iid: 1262,
      title: 'MOB-4790 Kassenbelege nach Jahr partitionieren',
      description: 'Tagesabschluss bei großen Mandanten zu langsam (> 40 s). kassenbeleg wird nach Belegjahr partitioniert, jahresübergreifende Abfragen über die Sicht kassenbeleg_alle.\n\nMigration auf Kopie Möbel Kessler (4,1 Mio. Belege): 3 min 50 s.\n\nCloses MOB-4790',
      labels: ['Kasse', 'Datenbank', 'Performance'],
      author: 'brenner',
      created: '2026-09-10T08:30:00+02:00',
      merged: '2026-09-16T11:05:00+02:00',
      mergedBy: 'reuter',
    },
    commits: [
      {
        date: '2026-09-10T08:24:00+02:00',
        author: 'brenner',
        message: 'MOB-4790 kassenbeleg nach Belegjahr partitionieren',
        ops: [
          {
            write: 'db/migration/V26_4_015__kassenbeleg_partition.sql',
            content: `-- Kassenbelege nach Belegjahr partitionieren (MOB-4790)
ALTER TABLE kassenbeleg RENAME TO kassenbeleg_alt;

CREATE TABLE kassenbeleg (LIKE kassenbeleg_alt INCLUDING ALL) PARTITION BY RANGE (belegdatum);

DO $$
DECLARE jahr int;
BEGIN
  FOR jahr IN 2014..2027 LOOP
    EXECUTE format('CREATE TABLE kassenbeleg_%s PARTITION OF kassenbeleg FOR VALUES FROM (%L) TO (%L)',
                   jahr, make_date(jahr, 1, 1), make_date(jahr + 1, 1, 1));
  END LOOP;
END $$;

INSERT INTO kassenbeleg SELECT * FROM kassenbeleg_alt;
DROP TABLE kassenbeleg_alt;
`,
          },
        ],
      },
      {
        date: '2026-09-12T15:47:00+02:00',
        author: 'brenner',
        message: 'MOB-4790 Sicht kassenbeleg_alle für jahresübergreifende Abfragen',
        ops: [
          {
            write: 'db/migration/V26_4_016__kassenbeleg_alle.sql',
            content: `-- Sicht für Auswertungen über mehrere Jahre (MOB-4790)
CREATE VIEW kassenbeleg_alle AS
SELECT * FROM kassenbeleg;
`,
          },
        ],
      },
      {
        date: '2026-09-14T19:02:00+02:00',
        author: 'brenner',
        message: 'MOB-4790 Lasttest Tagesabschluss',
        ops: [{ write: 'test/last/Tagesabschluss.jmx', content: `<?xml version="1.0" encoding="UTF-8"?>\n<jmeterTestPlan version="1.2">\n  <hashTree><!-- 500 Bons je Filiale, 30 Filialen --></hashTree>\n</jmeterTestPlan>\n` }],
      },
    ],
  },
  {
    id: 'druckvorlagen',
    ticket: 'MOB-4760',
    branch: 'feature/MOB-4760-vorlagen-engine',
    mr: {
      iid: 1270,
      title: 'MOB-4760 Neue Vorlagen-Engine im Druckmanagement',
      description: 'FreeMarker-Vorlagen durch die neue HTML-Vorlagen-Engine ersetzt. Standardbelege sehen gleich aus.\n\nAchtung: kundeneigene Vorlagen müssen nach dem Update mit dem Job „Vorlagen konvertieren“ umgestellt werden.\n\nCloses MOB-4760',
      labels: ['Druck', 'Technische Schuld'],
      author: 'schuster',
      created: '2026-09-03T09:00:00+02:00',
      merged: '2026-09-18T16:12:00+02:00',
      mergedBy: 'reuter',
    },
    commits: [
      {
        date: '2026-09-03T08:55:00+02:00',
        author: 'schuster',
        message: 'MOB-4760 Druckausgabe über neue Vorlagen-Schicht',
        ops: [
          {
            write: `${J}/druck/VorlagenEngine.java`,
            content: `package de.musterhaus.mobiq.druck;

import java.util.Map;

/** Druckausgabe über HTML-Vorlagen mit Platzhaltern {{feld}}. Ersetzt LegacyDruck. */
public class VorlagenEngine {

    private final VorlagenQuelle quelle;

    public VorlagenEngine(VorlagenQuelle quelle) {
        this.quelle = quelle;
    }

    public byte[] drucke(String vorlage, Map<String, Object> daten) {
        return PdfRenderer.render(quelle.lade(vorlage + ".html"), daten);
    }
}
`,
          },
        ],
      },
      {
        date: '2026-09-07T10:15:00+02:00',
        author: 'becker',
        message: 'MOB-4760 Rechnungsvorlage umgestellt',
        ops: [
          { remove: 'druck/vorlagen/rechnung.ftl' },
          { write: 'druck/vorlagen/rechnung.html', content: `<h1>Rechnung {{beleg.nr}}</h1>\n<p>Kaufvertrag {{kv.nr}} vom {{kv.datum}}</p>\n{{#positionen}}<tr><td>{{text}}</td><td>{{betrag}}</td></tr>{{/positionen}}\n<p>Abzüglich Anzahlung: {{beleg.anzahlungVerrechnet}}</p>\n` },
        ],
      },
      {
        date: '2026-09-08T09:02:00+02:00',
        author: 'becker',
        message: 'MOB-4760 Lieferscheinvorlage umgestellt',
        ops: [
          { remove: 'druck/vorlagen/lieferschein.ftl' },
          { write: 'druck/vorlagen/lieferschein.html', content: `<h1>Lieferschein {{kv.nr}}</h1>\n{{#positionen}}<tr><td>{{menge}}</td><td>{{text}}</td></tr>{{/positionen}}\n` },
        ],
      },
      {
        date: '2026-09-09T14:40:00+02:00',
        author: 'becker',
        message: 'MOB-4760 Kaufvertragsvorlage umgestellt',
        ops: [
          { remove: 'druck/vorlagen/kaufvertrag.ftl' },
          { write: 'druck/vorlagen/kaufvertrag.html', content: `<h1>Kaufvertrag {{kv.nr}}</h1>\n<p>Anzahlung: {{kv.anzahlung}}</p>\n` },
        ],
      },
      {
        date: '2026-09-11T11:33:00+02:00',
        author: 'schuster',
        message: 'MOB-4760 Job „Vorlagen konvertieren“ für kundeneigene Vorlagen\n\nKundeneigene FreeMarker-Vorlagen (Ordner vorlagen/kunde) werden nach dem Update\nnicht automatisch umgestellt. Der Admin startet den Job unter\nAdministration > Vorlagen konvertieren. Nicht konvertierte Vorlagen fallen auf\ndas Standardlayout zurück.',
        ops: [
          {
            write: `${J}/admin/VorlagenKonvertieren.java`,
            content: `package de.musterhaus.mobiq.admin;

import de.musterhaus.mobiq.druck.VorlagenQuelle;

/** Admin-Job: konvertiert kundeneigene FreeMarker-Vorlagen in das neue HTML-Format. */
@AdminJob(name = "Vorlagen konvertieren", bereich = "Administration")
public class VorlagenKonvertieren implements Job {

    private final VorlagenQuelle quelle;

    public VorlagenKonvertieren(VorlagenQuelle quelle) {
        this.quelle = quelle;
    }

    @Override
    public JobErgebnis ausfuehren() {
        int n = 0;
        for (String datei : quelle.kundeneigeneFtl()) {
            quelle.speichere(datei.replace(".ftl", ".html"), FtlNachHtml.konvertiere(quelle.lade(datei)));
            n++;
        }
        return JobErgebnis.ok(n + " Vorlagen konvertiert");
    }
}
`,
          },
        ],
      },
      {
        date: '2026-09-15T16:20:00+02:00',
        author: 'schuster',
        message: 'MOB-4760 Alte Druck-Engine entfernt',
        ops: [{ remove: `${J}/druck/LegacyDruck.java` }],
      },
      {
        date: '2026-09-16T08:47:00+02:00',
        author: 'becker',
        message: 'MOB-4760 Tests Druckausgabe',
        ops: [
          {
            write: `${T}/druck/VorlagenEngineTest.java`,
            content: `package de.musterhaus.mobiq.druck;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.Test;

class VorlagenEngineTest {

    @Test
    void rechnungWirdGedruckt() {
        byte[] pdf = new VorlagenEngine(Testdaten.vorlagen()).drucke("rechnung", Map.of("beleg", Testdaten.rechnung()));
        assertThat(pdf).isNotEmpty();
    }
}
`,
          },
        ],
      },
    ],
  },
  {
    id: 'avis-standard',
    ticket: null,
    commits: [
      {
        date: '2026-09-19T17:58:00+02:00',
        author: 'brenner',
        message: 'Avis-Vorlauf Standard 48h -> 24h\n\nWunsch Möbel Kessler, siehe Mail von Hr. Kessler an den Support.',
        ops: [{ edit: 'config/parameter/auftrag.yaml', from: `LIEF_AVIS_STUNDEN:\n  typ: int\n  standard: 48`, to: `LIEF_AVIS_STUNDEN:\n  typ: int\n  standard: 24` }],
      },
    ],
  },
  {
    id: 'kasse-tests',
    ticket: 'MOB-4815',
    branch: 'feature/MOB-4815-tests-kasse',
    mr: {
      iid: 1275,
      title: 'MOB-4815 Testabdeckung Kasse erhöht',
      description: 'Nur Tests und Testdaten. Abdeckung Kasse von 41 % auf 68 %.\n\nCloses MOB-4815',
      labels: ['Kasse', 'Tests'],
      author: 'becker',
      created: '2026-09-17T09:00:00+02:00',
      merged: '2026-09-21T09:40:00+02:00',
      mergedBy: 'wagner',
    },
    commits: [
      { date: '2026-09-17T09:12:00+02:00', author: 'becker', message: 'MOB-4815 Tests Tagesabschluss', ops: [{ write: `${T}/kasse/TagesabschlussTest.java`, content: `package de.musterhaus.mobiq.kasse;\n\nclass TagesabschlussTest {\n    // Summen je Zahlart, Storno am selben Tag, Filiale mit mehreren Kassen\n}\n` }] },
      { date: '2026-09-17T15:30:00+02:00', author: 'becker', message: 'MOB-4815 Tests Storno', ops: [{ write: `${T}/kasse/StornoTest.java`, content: `package de.musterhaus.mobiq.kasse;\n\nclass StornoTest {\n    // Teilstorno, Storno nach Tagesabschluss\n}\n` }] },
      { date: '2026-09-18T10:05:00+02:00', author: 'becker', message: 'MOB-4815 Tests Kartenzahlung', ops: [{ write: `${T}/kasse/KartenzahlungTest.java`, content: `package de.musterhaus.mobiq.kasse;\n\nclass KartenzahlungTest {\n    // Abbruch am Terminal, doppelte Buchung\n}\n` }] },
      { date: '2026-09-18T16:44:00+02:00', author: 'becker', message: 'MOB-4815 Testdaten aufgeräumt', ops: [{ write: 'server/src/test/resources/kasse/belege.csv', content: `bon;filiale;kasse;datum;betrag\n100001;F01;1;2026-09-01;249.90\n100002;F01;1;2026-09-01;1299.00\n` }] },
      { date: '2026-09-19T08:20:00+02:00', author: 'becker', message: 'MOB-4815 Testlauf Kasse in der Pipeline', ops: [{ append: '.gitlab-ci.yml', text: `\ntest-kasse:\n  stage: test\n  script: ./gradlew :server:test --tests 'de.musterhaus.mobiq.kasse.*'\n` }] },
    ],
  },
  {
    id: 'lieferstopp',
    ticket: 'MOB-4835',
    branch: 'feature/MOB-4835-lieferstopp',
    mr: {
      iid: 1290,
      title: 'MOB-4835 „Liefersperre“ heißt jetzt „Lieferstopp“',
      description: 'Nur Beschriftung. Kunden verwechseln „Liefersperre“ mit der Zahlungssperre. Interner Feldname bleibt liefersperre.\n\nCloses MOB-4835',
      labels: ['Kaufvertrag', 'UI-Text'],
      author: 'yilmaz',
      created: '2026-09-24T11:00:00+02:00',
      merged: '2026-09-25T09:15:00+02:00',
      mergedBy: 'engel',
    },
    commits: [
      {
        date: '2026-09-24T10:41:00+02:00',
        author: 'yilmaz',
        message: 'MOB-4835 „Liefersperre“ heißt jetzt „Lieferstopp“ (Web und Desktop)',
        ops: [
          { edit: 'web/src/i18n/de.json', from: `"kv.lieferung.liefersperre": "Liefersperre"`, to: `"kv.lieferung.liefersperre": "Lieferstopp"` },
          { edit: 'desktop/res/texte_de.rc', from: `  1203, "Liefersperre"`, to: `  1203, "Lieferstopp"` },
        ],
      },
      {
        date: '2026-09-24T10:58:00+02:00',
        author: 'yilmaz',
        message: 'MOB-4835 Übersetzungen nachgezogen (nl, fr)',
        ops: [
          { edit: 'web/src/i18n/nl.json', from: `"Leverblokkering"`, to: `"Leverstop"` },
          { edit: 'web/src/i18n/fr.json', from: `"Blocage de livraison"`, to: `"Arrêt de livraison"` },
        ],
      },
    ],
  },
  {
    id: 'hotfix-tagesabschluss',
    ticket: 'MOB-4841',
    branch: 'hotfix/MOB-4841-npe-tagesabschluss',
    mr: {
      iid: 1293,
      title: 'MOB-4841 NPE im Tagesabschluss bei Filiale ohne Belege',
      description: 'Tagesabschluss ist bei Filialen ohne Bons am Tag mit IndexOutOfBounds abgebrochen (Küchenstudio Brandt, Ruhetag-Filiale).\n\nCloses MOB-4841',
      labels: ['Kasse', 'Bug', 'Hotfix'],
      author: 'becker',
      created: '2026-09-26T08:10:00+02:00',
      merged: '2026-09-26T09:02:00+02:00',
      mergedBy: 'wagner',
    },
    commits: [
      {
        date: '2026-09-26T08:05:00+02:00',
        author: 'becker',
        message: 'MOB-4841 Tagesabschluss: Filiale ohne Belege nicht mehr abbrechen',
        ops: [
          {
            edit: `${J}/kasse/Tagesabschluss.java`,
            from: `        List<Kassenbeleg> liste = belege.findeTag(filiale, tag);
        return Abschluss.aus(filiale, tag, liste.get(0).kassenNr(), liste);`,
            to: `        List<Kassenbeleg> liste = belege.findeTag(filiale, tag);
        if (liste.isEmpty()) {
            return Abschluss.leer(filiale, tag);
        }
        return Abschluss.aus(filiale, tag, liste.get(0).kassenNr(), liste);`,
          },
        ],
      },
    ],
  },
  {
    id: 'teillieferung',
    ticket: 'MOB-4812',
    branch: 'feature/MOB-4812-teillieferung',
    mr: {
      iid: 1287,
      title: 'MOB-4812 Teillieferung im Kaufvertrag',
      description:
        'Ein Kaufvertrag kann in mehrere Lieferteile aufgeteilt werden.\n\n- Register Lieferung: Checkbox „Teillieferung erlaubt“ (nur wenn TEILLIEF_ERLAUBT = Ja)\n- Dialog „Lieferung aufteilen“\n- Tour: ein Stopp je Lieferteil\n- Faktura: Teilrechnung je Lieferteil, Anzahlung anteilig\n- Fibu-Export: Belegart TR\n\nBei Finanzkauf vorerst gesperrt (siehe Kommentar in MOB-4812).\n\nCloses MOB-4812, MOB-4829\n\n## Checkliste\n- [x] Tests\n- [x] Review\n- [x] Fachabnahme\n- [ ] Doku angepasst (MOB-4813)',
      labels: ['Kaufvertrag', 'Tour', 'Faktura', 'Fibu', 'Feature'],
      author: 'albrecht',
      created: '2026-09-08T11:00:00+02:00',
      merged: '2026-09-29T15:48:00+02:00',
      mergedBy: 'engel',
    },
    commits: [
      {
        date: '2026-09-08T10:52:00+02:00',
        author: 'albrecht',
        message: 'MOB-4812 Datenmodell: Tabelle lieferteil, Spalte tour_stopp.lt_id',
        ops: [
          {
            write: 'db/migration/V26_4_012__lieferteil.sql',
            content: `-- Teillieferung (MOB-4812)
CREATE TABLE lieferteil (
  lt_id        bigserial PRIMARY KEY,
  kv_id        bigint    NOT NULL REFERENCES kaufvertrag (kv_id),
  teil_nr      smallint  NOT NULL,
  wunsch_kw    char(7),
  status       varchar(20) NOT NULL DEFAULT 'ERFASST',
  UNIQUE (kv_id, teil_nr)
);

ALTER TABLE kv_position ADD COLUMN lt_id bigint REFERENCES lieferteil (lt_id);
ALTER TABLE tour_stopp  ADD COLUMN lt_id bigint REFERENCES lieferteil (lt_id);
`,
          },
          {
            write: `${J}/auftrag/Lieferteil.java`,
            content: `package de.musterhaus.mobiq.auftrag;

import java.util.List;

/** Ein Teil einer Teillieferung: eigene Positionen, eigener Wunschtermin, eigene Tour. */
public record Lieferteil(long ltId, String kvNr, int teilNr, String wunschKw, List<KvPosition> positionen) {

    public boolean istLieferbereit() {
        return positionen.stream().allMatch(KvPosition::imLager);
    }
}
`,
          },
        ],
      },
      {
        date: '2026-09-09T14:26:00+02:00',
        author: 'albrecht',
        message: 'MOB-4812 Parameter TEILLIEF_ERLAUBT und TEILLIEF_MAX_ANZAHL (1 bis 10)',
        ops: [
          {
            append: 'config/parameter/auftrag.yaml',
            text: `TEILLIEF_ERLAUBT:
  typ: bool
  standard: false
  beschreibung: Teillieferungen im Mandanten erlauben
TEILLIEF_MAX_ANZAHL:
  typ: int
  standard: 2
  min: 1
  max: 10
  einheit: Teile
  beschreibung: Höchstzahl Lieferteile je Kaufvertrag
`,
          },
        ],
      },
      {
        date: '2026-09-11T16:18:00+02:00',
        author: 'yilmaz',
        message: 'MOB-4812 Register Lieferung: Checkbox „Teillieferung erlaubt“',
        ops: [
          {
            edit: 'web/src/kaufvertrag/RegisterLieferung.tsx',
            from: `      <Checkbox label={t('kv.lieferung.montage')} checked={kv.montage} onChange={(montage) => onChange({ ...kv, montage })} />`,
            to: `      <Checkbox label={t('kv.lieferung.montage')} checked={kv.montage} onChange={(montage) => onChange({ ...kv, montage })} />
      {param.TEILLIEF_ERLAUBT && !kv.finanzkauf && (
        <>
          <Checkbox label={t('kv.lieferung.teillieferung')} checked={kv.teillieferungErlaubt} onChange={(teillieferungErlaubt) => onChange({ ...kv, teillieferungErlaubt })} />
          <Button disabled={!kv.teillieferungErlaubt} onClick={() => oeffneAufteilen(kv)}>{t('kv.lieferung.aufteilen')}</Button>
        </>
      )}`,
          },
          { edit: 'web/src/kaufvertrag/RegisterLieferung.tsx', from: `import { AdressFeld, Auswahl, Checkbox, Field, KwAuswahl } from '@mobiq/ui'`, to: `import { AdressFeld, Auswahl, Button, Checkbox, Field, KwAuswahl } from '@mobiq/ui'\nimport { useParameter } from '../api/parameter'\nimport { oeffneAufteilen } from './LieferungAufteilen'` },
          { edit: 'web/src/kaufvertrag/RegisterLieferung.tsx', from: `  return (\n    <section aria-label={t('kv.lieferung.titel')}>`, to: `  const param = useParameter()\n  return (\n    <section aria-label={t('kv.lieferung.titel')}>` },
          { edit: 'web/src/i18n/de.json', from: `  "kv.lieferung.montage": "Montage",`, to: `  "kv.lieferung.montage": "Montage",\n  "kv.lieferung.teillieferung": "Teillieferung erlaubt",\n  "kv.lieferung.aufteilen": "Lieferung aufteilen",` },
          { edit: 'desktop/kaufvertrag/FrmLieferung.pas', from: `    chkMontage: TCheckBox;`, to: `    chkMontage: TCheckBox;\n    chkTeillieferung: TCheckBox;\n    btnAufteilen: TButton;` },
          { edit: 'desktop/res/texte_de.rc', from: `  1204, "Montage"`, to: `  1204, "Montage"\n  1205, "Teillieferung erlaubt"\n  1206, "Lieferung aufteilen"` },
        ],
      },
      {
        date: '2026-09-12T18:03:00+02:00',
        author: 'yilmaz',
        message: 'MOB-4812 WIP Dialog Lieferung aufteilen',
        ops: [
          {
            write: 'web/src/kaufvertrag/LieferungAufteilen.tsx',
            content: `import { Dialog } from '@mobiq/ui'
import type { Kaufvertrag } from '../api/types'

// TODO Positionen per Drag & Drop, Prüfung Mindestwert
export function LieferungAufteilen({ kv }: { kv: Kaufvertrag }) {
  return <Dialog titel='Lieferung aufteilen'>{kv.kvNr}</Dialog>
}

export function oeffneAufteilen(kv: Kaufvertrag) {
  Dialog.oeffne(<LieferungAufteilen kv={kv} />)
}
`,
          },
        ],
      },
      {
        date: '2026-09-15T17:36:00+02:00',
        author: 'yilmaz',
        message: 'MOB-4812 Dialog „Lieferung aufteilen“, gesperrt bei Finanzkauf',
        ops: [
          {
            write: 'web/src/kaufvertrag/LieferungAufteilen.tsx',
            content: `import { Dialog, DragListe, Field, KwAuswahl, Warnung } from '@mobiq/ui'
import { useParameter } from '../api/parameter'
import type { Kaufvertrag, KvPosition } from '../api/types'
import { t } from '../i18n'
import { useAufteilung } from './useAufteilung'

export function LieferungAufteilen({ kv }: { kv: Kaufvertrag }) {
  const param = useParameter()
  const a = useAufteilung(kv, param.TEILLIEF_MAX_ANZAHL)
  return (
    <Dialog titel={t('kv.aufteilen.titel')} speichernErlaubt={a.gueltig} onSpeichern={a.speichern}>
      {a.teile.map((teil) => (
        <fieldset key={teil.nr}>
          <legend>{t('kv.aufteilen.teil')} {teil.nr}</legend>
          <DragListe<KvPosition> items={teil.positionen} gruppe='positionen' onDrop={(p) => a.verschiebe(p, teil.nr)} />
          <Field label={t('kv.aufteilen.warenwert')}>{teil.anteilProzent} %</Field>
          <Field label={t('kv.lieferung.wunschtermin')} required>
            <KwAuswahl value={teil.wunschKw} onChange={(kw) => a.setzeTermin(teil.nr, kw)} />
          </Field>
        </fieldset>
      ))}
      {a.warnung && <Warnung>{a.warnung}</Warnung>}
    </Dialog>
  )
}

export function oeffneAufteilen(kv: Kaufvertrag) {
  if (kv.finanzkauf) return // Teillieferung bei Finanzkauf gesperrt, siehe MOB-4812
  Dialog.oeffne(<LieferungAufteilen kv={kv} />)
}
`,
          },
          {
            write: `${J}/auftrag/TeillieferungService.java`,
            content: `package de.musterhaus.mobiq.auftrag;

import de.musterhaus.mobiq.param.Parameter;
import java.util.List;

/** Teilt einen Kaufvertrag in Lieferteile auf. */
public class TeillieferungService {

    private final Parameter param;

    public TeillieferungService(Parameter param) {
        this.param = param;
    }

    public List<Lieferteil> aufteilen(Kaufvertrag kv, List<List<KvPosition>> teile) {
        if (!param.getBool("TEILLIEF_ERLAUBT")) {
            throw new FachlicherFehler("Teillieferung ist im Mandanten nicht erlaubt");
        }
        if (kv.finanzkauf()) {
            // Mit der Partnerbank noch nicht geklärt, siehe MOB-4808
            throw new FachlicherFehler("Teillieferung ist bei Finanzkauf nicht möglich");
        }
        if (teile.size() > param.getInt("TEILLIEF_MAX_ANZAHL")) {
            throw new FachlicherFehler("Zu viele Lieferteile");
        }
        return Lieferteile.aus(kv, teile);
    }
}
`,
          },
        ],
      },
      {
        date: '2026-09-17T11:09:00+02:00',
        author: 'albrecht',
        message: 'MOB-4812 Mindestwarenwert je Teil prüfen; MAX_ANZAHL 2 bis 5, Standard 3\n\nNach Abstimmung mit Markus: mehr als 5 Teile will kein Kunde, 1 Teil ist keine Teillieferung.',
        ops: [
          { edit: 'config/parameter/auftrag.yaml', from: `TEILLIEF_MAX_ANZAHL:\n  typ: int\n  standard: 2\n  min: 1\n  max: 10`, to: `TEILLIEF_MAX_ANZAHL:\n  typ: int\n  standard: 3\n  min: 2\n  max: 5` },
          {
            append: 'config/parameter/auftrag.yaml',
            text: `TEILLIEF_MIN_WARENWERT_PROZ:
  typ: int
  standard: 20
  min: 10
  max: 90
  einheit: Prozent
  beschreibung: Mindestanteil am Warenwert je Lieferteil
`,
          },
          {
            edit: `${J}/auftrag/TeillieferungService.java`,
            from: `        return Lieferteile.aus(kv, teile);`,
            to: `        BigDecimal min = kv.warenwert().multiply(BigDecimal.valueOf(param.getInt("TEILLIEF_MIN_WARENWERT_PROZ"))).movePointLeft(2);
        for (List<KvPosition> teil : teile) {
            BigDecimal wert = teil.stream().map(KvPosition::betrag).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (wert.compareTo(min) < 0) {
                throw new FachlicherFehler("Ein Lieferteil unterschreitet den Mindestwarenwert");
            }
        }
        return Lieferteile.aus(kv, teile);`,
          },
          { edit: `${J}/auftrag/TeillieferungService.java`, from: `import de.musterhaus.mobiq.param.Parameter;`, to: `import de.musterhaus.mobiq.param.Parameter;\nimport java.math.BigDecimal;` },
        ],
      },
      {
        date: '2026-09-19T09:44:00+02:00',
        author: 'schuster',
        message: 'MOB-4812 Tourenplanung: Lieferteil als eigener Stopp (T1, T2 …)',
        ops: [
          { edit: `${J}/tour/TourStopp.java`, from: `public record TourStopp(String kvNr, boolean montage, double volumenM3) {`, to: `public record TourStopp(String kvNr, Integer teilNr, boolean montage, double volumenM3) {\n\n    /** Anzeige auf Karte und Lieferschein: KV-Nummer, bei Teillieferung mit T1, T2 … */\n    public String bezeichnung() {\n        return teilNr == null ? kvNr : kvNr + " T" + teilNr;\n    }` },
          {
            edit: `${J}/tour/StoppBuilder.java`,
            from: `    /** Ein Kaufvertrag ergibt genau einen Stopp. */
    public List<TourStopp> baue(Kaufvertrag kv) {
        boolean montage = kv.positionen().stream().anyMatch(p -> p.montage());
        return List.of(new TourStopp(kv.kvNr(), montage, volumen(kv)));
    }`,
            to: `    /** Ein Kaufvertrag ergibt einen Stopp, bei Teillieferung einen Stopp je lieferbereitem Teil. */
    public List<TourStopp> baue(Kaufvertrag kv, List<Lieferteil> teile) {
        if (teile.isEmpty()) {
            boolean montage = kv.positionen().stream().anyMatch(p -> p.montage());
            return List.of(new TourStopp(kv.kvNr(), null, montage, volumen(kv.positionen())));
        }
        return teile.stream()
                .filter(Lieferteil::istLieferbereit)
                // Montage nur für den Teil, der die Montageposition enthält
                .map(t -> new TourStopp(kv.kvNr(), t.teilNr(), t.positionen().stream().anyMatch(p -> p.montage()), volumen(t.positionen())))
                .toList();
    }`,
          },
          {
            edit: `${J}/tour/StoppBuilder.java`,
            from: `    private double volumen(Kaufvertrag kv) {
        return kv.positionen().stream().mapToDouble(p -> p.volumenM3().doubleValue()).sum();`,
            to: `    private double volumen(List<KvPosition> positionen) {
        return positionen.stream().mapToDouble(p -> p.volumenM3().doubleValue()).sum();`,
          },
          { edit: `${J}/tour/StoppBuilder.java`, from: `import de.musterhaus.mobiq.auftrag.Kaufvertrag;`, to: `import de.musterhaus.mobiq.auftrag.Kaufvertrag;\nimport de.musterhaus.mobiq.auftrag.KvPosition;\nimport de.musterhaus.mobiq.auftrag.Lieferteil;` },
          { edit: 'web/src/tour/StoppKarte.tsx', from: `<Pin key={s.kvNr} nummer={i + 1} titel={s.kvNr} montage={s.montage} />`, to: `<Pin key={s.kvNr + (s.teilNr ?? '')} nummer={i + 1} titel={s.teilNr ? s.kvNr + ' T' + s.teilNr : s.kvNr} montage={s.montage} />` },
        ],
      },
      {
        date: '2026-09-22T13:57:00+02:00',
        author: 'hoffmann',
        message: 'MOB-4812 Faktura: Teilrechnung je Lieferteil, Anzahlung anteilig',
        ops: [
          {
            write: `${J}/faktura/TeilrechnungService.java`,
            content: `package de.musterhaus.mobiq.faktura;

import de.musterhaus.mobiq.auftrag.Kaufvertrag;
import de.musterhaus.mobiq.auftrag.Lieferteil;

/** Erstellt je ausgeliefertem Lieferteil eine Teilrechnung. */
public class TeilrechnungService {

    private final AnzahlungVerrechnung verrechnung = new AnzahlungVerrechnung();

    public Rechnung teilrechnung(Kaufvertrag kv, Lieferteil teil, boolean letzterTeil) {
        Rechnung r = Rechnung.neu(Belegart.RE, kv);
        r.setPositionen(teil.positionen());
        r.setTeilNr(teil.teilNr());
        r.setAnzahlungVerrechnet(verrechnung.anteilig(kv, teil));
        return r;
    }
}
`,
          },
          {
            edit: `${J}/faktura/AnzahlungVerrechnung.java`,
            from: `    /** Die gesamte Anzahlung wird mit der Schlussrechnung verrechnet. */
    public BigDecimal voll(Kaufvertrag kv) {
        return kv.anzahlung();
    }`,
            to: `    /** Ohne Teillieferung: die gesamte Anzahlung wird mit der Schlussrechnung verrechnet. */
    public BigDecimal voll(Kaufvertrag kv) {
        return kv.anzahlung();
    }

    /** Teillieferung: Anzahlung anteilig nach Warenwert des Lieferteils. */
    public BigDecimal anteilig(Kaufvertrag kv, Lieferteil teil) {
        BigDecimal anteil = teil.positionen().stream().map(KvPosition::betrag).reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(kv.warenwert(), 6, RoundingMode.HALF_UP);
        return kv.anzahlung().multiply(anteil).setScale(2, RoundingMode.HALF_UP);
    }`,
          },
          { edit: `${J}/faktura/AnzahlungVerrechnung.java`, from: `import java.math.BigDecimal;`, to: `import de.musterhaus.mobiq.auftrag.KvPosition;\nimport de.musterhaus.mobiq.auftrag.Lieferteil;\nimport java.math.BigDecimal;\nimport java.math.RoundingMode;` },
          {
            edit: 'app/fahrer/src/main/kotlin/de/musterhaus/mobiq/fahrer/Restzahlung.kt',
            from: `    /** Offener Betrag des Kaufvertrags: Warenwert minus Anzahlung. */
    fun offenerBetrag(stopp: Stopp): BigDecimal {
        val kv = api.kaufvertrag(stopp.kvNr)
        return kv.warenwert - kv.anzahlung
    }`,
            to: `    /** Offener Betrag: bei Teillieferung nur für den gelieferten Teil, sonst Warenwert minus Anzahlung. */
    fun offenerBetrag(stopp: Stopp): BigDecimal {
        val kv = api.kaufvertrag(stopp.kvNr)
        val teil = stopp.teilNr ?: return kv.warenwert - kv.anzahlung
        return api.teilrechnung(stopp.kvNr, teil).offen
    }`,
          },
        ],
      },
      {
        date: '2026-09-23T10:21:00+02:00',
        author: 'hoffmann',
        message: 'MOB-4812 Fibu-Export: Belegart TR, Felder teillieferung_nr und az_verrechnet',
        ops: [
          { edit: `${J}/faktura/Belegart.java`, from: `    AZ("Anzahlung");`, to: `    AZ("Anzahlung"),\n    TR("Teilrechnung");` },
          { edit: `${J}/faktura/TeilrechnungService.java`, from: `Rechnung.neu(Belegart.RE, kv)`, to: `Rechnung.neu(Belegart.TR, kv)` },
          { edit: `${J}/fibu/export/Buchungssatz.java`, from: `        short steuerschluessel) {`, to: `        short steuerschluessel,\n        Short teillieferungNr,\n        BigDecimal azVerrechnet) {` },
          {
            append: 'config/parameter/fibu.yaml',
            text: `FIBU_BELEGART_TEILRECHNUNG:
  typ: text
  standard: "TR"
  beschreibung: Belegart für Teilrechnungen im Export
`,
          },
        ],
      },
      {
        date: '2026-09-24T15:12:00+02:00',
        author: 'hoffmann',
        message: 'MOB-4829 Rundungsdifferenz der Anzahlung mit dem letzten Teil ausgleichen\n\nBei 3 Teilen à 33,33 % blieb 1 Cent Anzahlung offen. Der letzte Teil\nverrechnet jetzt den Rest der Anzahlung.',
        ops: [
          {
            edit: `${J}/faktura/AnzahlungVerrechnung.java`,
            from: `    /** Teillieferung: Anzahlung anteilig nach Warenwert des Lieferteils. */
    public BigDecimal anteilig(Kaufvertrag kv, Lieferteil teil) {`,
            to: `    /** Teillieferung, letzter Teil: verrechnet den Rest der Anzahlung, damit keine Rundungsdifferenz bleibt. */
    public BigDecimal rest(Kaufvertrag kv, BigDecimal bereitsVerrechnet) {
        return kv.anzahlung().subtract(bereitsVerrechnet);
    }

    /** Teillieferung: Anzahlung anteilig nach Warenwert des Lieferteils. */
    public BigDecimal anteilig(Kaufvertrag kv, Lieferteil teil) {`,
          },
          {
            edit: `${J}/faktura/TeilrechnungService.java`,
            from: `        r.setAnzahlungVerrechnet(verrechnung.anteilig(kv, teil));`,
            to: `        r.setAnzahlungVerrechnet(letzterTeil
                ? verrechnung.rest(kv, Rechnungen.verrechneteAnzahlung(kv))
                : verrechnung.anteilig(kv, teil));`,
          },
        ],
      },
      {
        date: '2026-09-26T11:30:00+02:00',
        author: 'yilmaz',
        message: 'MOB4812 Tooltip und Tab-Reihenfolge im Dialog',
        ops: [
          { edit: 'web/src/kaufvertrag/LieferungAufteilen.tsx', from: `          <Field label={t('kv.aufteilen.warenwert')}>{teil.anteilProzent} %</Field>`, to: `          <Field label={t('kv.aufteilen.warenwert')} hinweis={t('kv.aufteilen.warenwert.hinweis')}>{teil.anteilProzent} %</Field>` },
        ],
      },
    ],
  },
]
