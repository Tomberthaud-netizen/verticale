import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { calculerMontantTVA, calculerTotalHT, calculerTotalHTNet, calculerTotalLigne, calculerTotalTTC } from "@/lib/devis";
import { formaterEurosPdf } from "@/lib/pdfFormat";
import type { EntrepriseInfo } from "@/constants/entreprisesInfo";

export interface DevisDocumentData {
  numero: string;
  intitule: string;
  entreprise: string;
  clientNom: string | null;
  clientAdresse: string | null;
  clientEmail: string | null;
  clientTelephone: string | null;
  dateDevis: Date;
  validiteJours: number | null;
  tauxTVA: number;
  remiseHT: number;
  notes: string | null;
  lignes: { designation: string; unite: string | null; quantite: number; prixUnitaire: number }[];
  chantierNom: string | null;
  responsable: { nom: string; prenom: string; telephone: string | null } | null;
}

const BRANDS = {
  VERTICALE: {
    accent: "#1c1917",
    accentClaire: "#d6d3d1",
    policeTitre: "Times-Bold",
    policeTexte: "Times-Roman",
  },
  CB2B: {
    accent: "#1e3a5f",
    accentClaire: "#bcd0e4",
    policeTitre: "Helvetica-Bold",
    policeTexte: "Helvetica",
  },
} as const;

export default function DevisDocument({
  devis,
  logoDataUri,
  info,
}: {
  devis: DevisDocumentData;
  logoDataUri: string | null;
  info: EntrepriseInfo;
}) {
  const brand = BRANDS[devis.entreprise as keyof typeof BRANDS] ?? BRANDS.VERTICALE;
  const sousTotalHT = calculerTotalHT(devis.lignes);
  const totalHT = calculerTotalHTNet(sousTotalHT, devis.remiseHT);
  const montantTVA = calculerMontantTVA(totalHT, devis.tauxTVA);
  const totalTTC = calculerTotalTTC(totalHT, montantTVA);
  const dateLimite = devis.validiteJours
    ? new Date(devis.dateDevis.getTime() + devis.validiteJours * 86_400_000)
    : null;
  const coordonneesEntreprise = [info.adresse, info.telephone].filter(Boolean).join("\n");
  const infosLegales = [
    info.formeJuridique,
    info.siren && `N° SIREN ${info.siren}`,
    info.tvaIntracom && `N° TVA ${info.tvaIntracom}`,
  ]
    .filter(Boolean)
    .join(" — ");

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 9, fontFamily: brand.policeTexte, color: "#1c1917" },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    logo: { width: 140, height: 86, objectFit: "contain" },
    entrepriseBloc: { alignItems: "flex-end" },
    brandNom: { fontFamily: brand.policeTitre, fontSize: 16, color: brand.accent, textAlign: "right" },
    brandTagline: { fontSize: 8, color: "#78716c", marginTop: 2, textAlign: "right" },
    entrepriseInfos: { fontSize: 8, color: "#78716c", textAlign: "right", lineHeight: 1.5, marginTop: 3 },
    destinataireBloc: { marginTop: 12 },
    titreDevis: { fontFamily: brand.policeTitre, fontSize: 16, color: brand.accent, marginBottom: 4 },
    metaBlock: { fontSize: 9, lineHeight: 1.6, marginBottom: 20 },
    metaLabel: { color: "#78716c" },
    clientBlock: {
      borderWidth: 1,
      borderColor: brand.accentClaire,
      borderRadius: 4,
      padding: 10,
      width: 220,
    },
    clientTitre: { fontFamily: brand.policeTitre, marginBottom: 3, color: brand.accent },
    table: { marginTop: 10 },
    tableHeaderRow: { flexDirection: "row", backgroundColor: brand.accent, paddingVertical: 6, paddingHorizontal: 6 },
    tableHeaderCell: { color: "#ffffff", fontSize: 8, fontFamily: brand.policeTitre },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: "#e7e5e4",
    },
    tableRowAlt: { backgroundColor: "#fafaf9" },
    cellDesignation: { flex: 4 },
    cellUnite: { flex: 1, textAlign: "center" },
    cellQuantite: { flex: 1, textAlign: "right" },
    cellPU: { flex: 1.4, textAlign: "right" },
    cellTotal: { flex: 1.4, textAlign: "right" },
    totauxBloc: { marginTop: 16, alignSelf: "flex-end", width: 220 },
    totauxLigne: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    totauxLigneFinal: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: brand.accent,
    },
    totauxLabelFinal: { fontFamily: brand.policeTitre, fontSize: 11 },
    totauxValeurFinal: { fontFamily: brand.policeTitre, fontSize: 11, color: brand.accent },
    notes: { marginTop: 24, fontSize: 8, color: "#78716c", lineHeight: 1.5 },
    notesTitre: { fontFamily: brand.policeTitre, color: "#1c1917", marginBottom: 2 },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      fontSize: 7,
      color: "#a8a29e",
      textAlign: "center",
      borderTopWidth: 0.5,
      borderTopColor: "#e7e5e4",
      paddingTop: 8,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {logoDataUri && (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image, not an HTML <img>
            <Image src={logoDataUri} style={styles.logo} />
          )}
          <View style={styles.entrepriseBloc}>
            <Text style={styles.brandNom}>{info.nom}</Text>
            {info.tagline && <Text style={styles.brandTagline}>{info.tagline}</Text>}
            {coordonneesEntreprise && <Text style={styles.entrepriseInfos}>{coordonneesEntreprise}</Text>}
            {(devis.clientNom || devis.clientAdresse || devis.clientEmail || devis.clientTelephone) && (
              <View style={[styles.clientBlock, styles.destinataireBloc]}>
                <Text style={styles.clientTitre}>Destinataire</Text>
                {devis.clientNom && <Text>{devis.clientNom}</Text>}
                {devis.clientAdresse && <Text>{devis.clientAdresse}</Text>}
                {devis.clientEmail && <Text>{devis.clientEmail}</Text>}
                {devis.clientTelephone && <Text>{devis.clientTelephone}</Text>}
              </View>
            )}
          </View>
        </View>

        <Text style={styles.titreDevis}>DEVIS</Text>

        <View style={styles.metaBlock}>
          <Text>
            <Text style={styles.metaLabel}>Numéro : </Text>
            {devis.numero}
          </Text>
          <Text>
            <Text style={styles.metaLabel}>Date d&apos;émission : </Text>
            {format(devis.dateDevis, "d MMMM yyyy", { locale: fr })}
          </Text>
          {dateLimite && (
            <Text>
              <Text style={styles.metaLabel}>Date de validité : </Text>
              {format(dateLimite, "d MMMM yyyy", { locale: fr })}
            </Text>
          )}
          <Text>
            <Text style={styles.metaLabel}>Devis : </Text>
            {devis.intitule}
          </Text>
          {devis.chantierNom && (
            <Text>
              <Text style={styles.metaLabel}>Chantier : </Text>
              {devis.chantierNom}
            </Text>
          )}
          {devis.responsable && (
            <Text>
              <Text style={styles.metaLabel}>Responsable : </Text>
              {devis.responsable.prenom} {devis.responsable.nom}
              {devis.responsable.telephone && ` — ${devis.responsable.telephone}`}
            </Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.cellDesignation]}>Désignation</Text>
            <Text style={[styles.tableHeaderCell, styles.cellUnite]}>Unité</Text>
            <Text style={[styles.tableHeaderCell, styles.cellQuantite]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.cellPU]}>PU HT</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>Total HT</Text>
          </View>
          {devis.lignes.map((ligne, i) => (
            <View key={i} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : [styles.tableRow]}>
              <Text style={styles.cellDesignation}>{ligne.designation}</Text>
              <Text style={styles.cellUnite}>{ligne.unite ?? "—"}</Text>
              <Text style={styles.cellQuantite}>{ligne.quantite}</Text>
              <Text style={styles.cellPU}>{formaterEurosPdf(ligne.prixUnitaire)}</Text>
              <Text style={styles.cellTotal}>{formaterEurosPdf(calculerTotalLigne(ligne))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totauxBloc}>
          {devis.remiseHT > 0 && (
            <>
              <View style={styles.totauxLigne}>
                <Text>Sous-total HT</Text>
                <Text>{formaterEurosPdf(sousTotalHT)}</Text>
              </View>
              <View style={styles.totauxLigne}>
                <Text>Remise commerciale</Text>
                <Text>-{formaterEurosPdf(devis.remiseHT)}</Text>
              </View>
            </>
          )}
          <View style={styles.totauxLigne}>
            <Text>Total HT</Text>
            <Text>{formaterEurosPdf(totalHT)}</Text>
          </View>
          <View style={styles.totauxLigne}>
            <Text>TVA ({devis.tauxTVA}%)</Text>
            <Text>{formaterEurosPdf(montantTVA)}</Text>
          </View>
          <View style={styles.totauxLigneFinal}>
            <Text style={styles.totauxLabelFinal}>Total TTC</Text>
            <Text style={styles.totauxValeurFinal}>{formaterEurosPdf(totalTTC)}</Text>
          </View>
        </View>

        {devis.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitre}>Conditions particulières</Text>
            <Text>{devis.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          {[info.nom, infosLegales].filter(Boolean).join(" — ")}
        </Text>
      </Page>
    </Document>
  );
}
