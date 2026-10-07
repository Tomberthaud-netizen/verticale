import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { calculerTotalHTBonCommande } from "@/lib/bonCommande";
import { calculerTotalLigne } from "@/lib/devis";
import { formaterEurosPdf } from "@/lib/pdfFormat";
import type { EntrepriseInfo } from "@/constants/entreprisesInfo";
import { BRANDS } from "@/components/pdf/DevisDocument";

export interface BonCommandeDocumentData {
  numero: string;
  devisNumero: string;
  intitule: string;
  entreprise: string;
  adresse: string | null;
  dateBon: Date;
  notes: string | null;
  sousTraitant: {
    nom: string;
    contact: string | null;
    adresse: string | null;
    telephone: string | null;
    email: string | null;
    siret: string | null;
  };
  /** Prix unitaires déjà divisés — le diviseur et les prix du devis n'apparaissent jamais ici. */
  lignes: { designation: string; detail: string | null; unite: string | null; quantite: number; prixUnitaire: number }[];
}

export default function BonCommandeDocument({
  bon,
  logoDataUri,
  info,
}: {
  bon: BonCommandeDocumentData;
  logoDataUri: string | null;
  info: EntrepriseInfo;
}) {
  const brand = BRANDS[bon.entreprise as keyof typeof BRANDS] ?? BRANDS.VERTICALE;
  const totalHT = calculerTotalHTBonCommande(bon.lignes);
  const coordonneesEntreprise = [info.adresse, info.telephone].filter(Boolean).join("\n");
  const infosLegales = [
    info.formeJuridique,
    info.siren && `N° SIREN ${info.siren}`,
    info.tvaIntracom && `N° TVA ${info.tvaIntracom}`,
  ]
    .filter(Boolean)
    .join(" — ");
  const st = bon.sousTraitant;

  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 9, fontFamily: brand.policeTexte, color: "#1c1917" },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    logo: { width: 140, height: 86, objectFit: "contain" },
    entrepriseBloc: { alignItems: "flex-end" },
    brandNom: { fontFamily: brand.policeTitre, fontSize: 16, color: brand.accent, textAlign: "right" },
    brandTagline: { fontSize: 8, color: "#78716c", marginTop: 2, textAlign: "right" },
    entrepriseInfos: { fontSize: 8, color: "#78716c", textAlign: "right", lineHeight: 1.5, marginTop: 3 },
    destinataireBloc: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: brand.accentClaire,
      borderRadius: 4,
      padding: 10,
      width: 220,
    },
    destinataireTitre: { fontFamily: brand.policeTitre, marginBottom: 3, color: brand.accent },
    titre: { fontFamily: brand.policeTitre, fontSize: 16, color: brand.accent, marginBottom: 4 },
    metaBlock: { fontSize: 9, lineHeight: 1.6, marginBottom: 20 },
    metaLabel: { color: "#78716c" },
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
    cellDesignation: { flex: 3 },
    cellDetail: { flex: 2.4, color: "#57534e" },
    cellUnite: { flex: 1, textAlign: "center" },
    cellQuantite: { flex: 1, textAlign: "right" },
    cellPU: { flex: 1.4, textAlign: "right" },
    cellTotal: { flex: 1.4, textAlign: "right" },
    totauxBloc: { marginTop: 16, alignSelf: "flex-end", width: 220 },
    totauxLigneFinal: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: brand.accent,
    },
    totauxLabelFinal: { fontFamily: brand.policeTitre, fontSize: 11 },
    totauxValeurFinal: { fontFamily: brand.policeTitre, fontSize: 11, color: brand.accent },
    mentionHT: { fontSize: 7, color: "#78716c", textAlign: "right" },
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
            <View style={styles.destinataireBloc}>
              <Text style={styles.destinataireTitre}>Sous-traitant</Text>
              <Text>{st.nom}</Text>
              {st.contact && <Text>{st.contact}</Text>}
              {st.adresse && <Text>{st.adresse}</Text>}
              {st.telephone && <Text>{st.telephone}</Text>}
              {st.email && <Text>{st.email}</Text>}
              {st.siret && <Text>SIRET {st.siret}</Text>}
            </View>
          </View>
        </View>

        <Text style={styles.titre}>BON DE COMMANDE</Text>

        <View style={styles.metaBlock}>
          <Text>
            <Text style={styles.metaLabel}>Numéro : </Text>
            {bon.numero}
          </Text>
          <Text>
            <Text style={styles.metaLabel}>Date : </Text>
            {format(bon.dateBon, "d MMMM yyyy", { locale: fr })}
          </Text>
          <Text>
            <Text style={styles.metaLabel}>Référence devis : </Text>
            {bon.devisNumero}
          </Text>
          <Text>
            <Text style={styles.metaLabel}>Objet : </Text>
            {bon.intitule}
          </Text>
          {bon.adresse && (
            <Text>
              <Text style={styles.metaLabel}>Adresse des travaux : </Text>
              {bon.adresse}
            </Text>
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.cellDesignation]}>Désignation</Text>
            <Text style={[styles.tableHeaderCell, styles.cellDetail]}>Détail</Text>
            <Text style={[styles.tableHeaderCell, styles.cellUnite]}>Unité</Text>
            <Text style={[styles.tableHeaderCell, styles.cellQuantite]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.cellPU]}>PU HT</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>Total HT</Text>
          </View>
          {bon.lignes.map((ligne, i) => (
            <View key={i} style={i % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : [styles.tableRow]}>
              <Text style={styles.cellDesignation}>{ligne.designation}</Text>
              <Text style={styles.cellDetail}>{ligne.detail ?? ""}</Text>
              <Text style={styles.cellUnite}>{ligne.unite ?? "—"}</Text>
              <Text style={styles.cellQuantite}>{ligne.quantite}</Text>
              <Text style={styles.cellPU}>{formaterEurosPdf(ligne.prixUnitaire)}</Text>
              <Text style={styles.cellTotal}>{formaterEurosPdf(calculerTotalLigne(ligne))}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totauxBloc}>
          <View style={styles.totauxLigneFinal}>
            <Text style={styles.totauxLabelFinal}>Total HT</Text>
            <Text style={styles.totauxValeurFinal}>{formaterEurosPdf(totalHT)}</Text>
          </View>
          <Text style={styles.mentionHT}>Montants hors taxes</Text>
        </View>

        {bon.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitre}>Conditions particulières</Text>
            <Text>{bon.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          {[info.nom, infosLegales].filter(Boolean).join(" — ")}
        </Text>
      </Page>
    </Document>
  );
}
