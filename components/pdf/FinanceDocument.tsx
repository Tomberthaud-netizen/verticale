import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formaterEurosPdf } from "@/lib/pdfFormat";

export interface LigneFinanceDocument {
  nom: string;
  venduHT: number;
  coutRealisationHT: number | null;
  beneficeReel: number | null;
  dateFacture: Date;
  dateEncaissement: Date | null;
  statutLabel: string;
  alerte: boolean;
}

export interface FinanceDocumentData {
  genereLe: Date;
  ca: number;
  beneficePrevisionnel: number;
  beneficeReel: number;
  coutsEngages: number;
  lignes: LigneFinanceDocument[];
}

function formaterEuros(montant: number): string {
  return formaterEurosPdf(montant, { maximumFractionDigits: 0 });
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 8, fontFamily: "Helvetica", color: "#1c1917" },
  titre: { fontFamily: "Helvetica-Bold", fontSize: 16, marginBottom: 2 },
  sousTitre: { fontSize: 9, color: "#78716c", marginBottom: 16 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statBox: { flex: 1, borderWidth: 1, borderColor: "#e7e5e4", borderRadius: 4, padding: 8 },
  statLabel: { fontSize: 7, color: "#78716c", marginBottom: 3 },
  statValeur: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#1c1917", paddingVertical: 5, paddingHorizontal: 4 },
  tableHeaderCell: { color: "#ffffff", fontSize: 7, fontFamily: "Helvetica-Bold" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e7e5e4",
  },
  tableRowAlerte: { backgroundColor: "#fef2f2" },
  cellNom: { flex: 2.4 },
  cellMontant: { flex: 1, textAlign: "right" },
  cellDate: { flex: 1.2 },
  cellStatut: { flex: 1.2 },
});

export default function FinanceDocument({ data }: { data: FinanceDocumentData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.titre}>Récapitulatif financier</Text>
        <Text style={styles.sousTitre}>
          Généré le {format(data.genereLe, "d MMMM yyyy 'à' HH:mm", { locale: fr })}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>CA (HT)</Text>
            <Text style={styles.statValeur}>{formaterEuros(data.ca)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Bénéfice prévisionnel</Text>
            <Text style={styles.statValeur}>{formaterEuros(data.beneficePrevisionnel)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Bénéfice réel</Text>
            <Text style={styles.statValeur}>{formaterEuros(data.beneficeReel)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Coûts engagés</Text>
            <Text style={styles.statValeur}>{formaterEuros(data.coutsEngages)}</Text>
          </View>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, styles.cellNom]}>Affaire</Text>
          <Text style={[styles.tableHeaderCell, styles.cellMontant]}>Vendu HT</Text>
          <Text style={[styles.tableHeaderCell, styles.cellMontant]}>Coût réal. HT</Text>
          <Text style={[styles.tableHeaderCell, styles.cellMontant]}>Bénéfice réel</Text>
          <Text style={[styles.tableHeaderCell, styles.cellDate]}>Facturé le</Text>
          <Text style={[styles.tableHeaderCell, styles.cellDate]}>Encaissé le</Text>
          <Text style={[styles.tableHeaderCell, styles.cellStatut]}>Statut</Text>
        </View>
        {data.lignes.map((l, i) => (
          <View key={i} style={l.alerte ? [styles.tableRow, styles.tableRowAlerte] : [styles.tableRow]}>
            <Text style={styles.cellNom}>{l.nom}</Text>
            <Text style={styles.cellMontant}>{formaterEuros(l.venduHT)}</Text>
            <Text style={styles.cellMontant}>{l.coutRealisationHT != null ? formaterEuros(l.coutRealisationHT) : "—"}</Text>
            <Text style={styles.cellMontant}>{l.beneficeReel != null ? formaterEuros(l.beneficeReel) : "—"}</Text>
            <Text style={styles.cellDate}>{format(l.dateFacture, "d MMM yyyy", { locale: fr })}</Text>
            <Text style={styles.cellDate}>
              {l.dateEncaissement ? format(l.dateEncaissement, "d MMM yyyy", { locale: fr }) : "—"}
            </Text>
            <Text style={styles.cellStatut}>{l.statutLabel}{l.alerte ? " — retard" : ""}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
