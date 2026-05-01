import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import type { ParcelleDetails } from "./types";
import { formatDate, formatHa, formatNumber, polygonAreaHa } from "./utils";

/** ID du conteneur graphique dans le panneau détail parcelle */
export const PANEL_PDF_CHART_ID = "pdf-chart-container";
/** ID du conteneur graphique pour l’export PDF depuis le raccourci sidebar */
export const SHORTCUT_PDF_CHART_ID = "shortcut-pdf-chart-container";

const getAverages = (details: ParcelleDetails) => {
  const ndviAvg = details.analytics?.length
    ? details.analytics.reduce((s, d) => s + (d.ndvi ?? 0), 0) /
      details.analytics.filter((d) => d.ndvi != null).length
    : details.info.ndviMoyen;
  const ndwiAvg = details.analytics?.length
    ? details.analytics.reduce((s, d) => s + (d.ndwi ?? 0), 0) /
      details.analytics.filter((d) => d.ndwi != null).length
    : details.info.ndwiMoyen;
  return { ndviAvg, ndwiAvg };
};

const getPeriodText = (details: ParcelleDetails) =>
  details.info.datePlantation
    ? `Depuis le ${formatDate(details.info.datePlantation)}`
    : "6 derniers mois";

export async function downloadParcellePdf(
  details: ParcelleDetails,
  chartContainerId: string = PANEL_PDF_CHART_ID
): Promise<void> {
  const { ndviAvg, ndwiAvg } = getAverages(details);
  const surface = details.info.surface ?? polygonAreaHa(details.info.geometry);
  const periodText = getPeriodText(details);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  pdf.setFontSize(20);
  pdf.setTextColor(40, 40, 40);
  pdf.text(`Rapport de Parcelle : ${details.info.nom}`, 14, 22);

  pdf.setFontSize(11);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 30);

  autoTable(pdf, {
    startY: 40,
    head: [["Propriété", "Valeur"]],
    body: [
      ["Nom de la parcelle", details.info.nom],
      ["Propriétaire", details.info.proprietaire],
      ["Date de création", formatDate(details.info.createdAt)],
      ["Type de culture", details.info.cultureType ?? "Non spécifié"],
      ["Surface estimée", formatHa(surface)],
      ["NDVI Moyen", formatNumber(ndviAvg, 3)],
      ["NDWI Moyen", formatNumber(ndwiAvg, 3)],
    ],
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 4 },
  });

  const chartElement = document.getElementById(chartContainerId);
  if (chartElement) {
    const canvas = await html2canvas(chartElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");

    const finalY =
      (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 100;

    pdf.setFontSize(14);
    pdf.setTextColor(40, 40, 40);
    pdf.text(`Évolution Temporelle (${periodText})`, 14, finalY + 15);

    const pdfWidth = pdf.internal.pageSize.getWidth() - 28;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 14, finalY + 20, pdfWidth, pdfHeight);
  }

  pdf.save(`Rapport_${details.info.nom.replace(/\s+/g, "_")}.pdf`);
}

/** Retourne `true` si le fichier a été généré, `false` si aucune ligne de série. */
export function downloadParcelleCsv(details: ParcelleDetails): boolean {
  const rows = details.analytics ?? [];
  if (!rows.length) return false;

  const escapeCsv = (value: string | number | null | undefined) => {
    if (value == null) return "";
    const text = String(value);
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const header = ["date", "ndvi", "ndwi", "precip_mm", "temp_c"];
  const lines = rows.map((row) =>
    [row.date, row.ndvi ?? "", row.ndwi ?? "", row.precip ?? "", row.temp ?? ""]
      .map(escapeCsv)
      .join(",")
  );

  const csvContent = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Serie_temporelle_${details.info.nom.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
