import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { DailyEntry } from "./dailyEntries";

const HABIT_LABELS: Record<string, string> = {
  "wake-early": "Wake by 5:30 AM",
  "bed-early": "Bed by 10:30 PM",
  water: "3L+ Water",
  workout: "Workout 45min",
  meditate: "Meditate 15min",
  read: "Read 30min",
  journal: "Journal",
  "cold-shower": "Cold Shower",
  "healthy-food": "Clean Diet",
  "deep-work": "Deep Work 3h+",
  "learn-skill": "Learn New Skill",
  gratitude: "Gratitude Practice",
};

const NON_NEG_LABELS: Record<string, string> = {
  "no-smoking": "No Smoking",
  "no-drinking": "No Drinking",
  "no-addiction": "No Addictions",
  "no-scroll": "Screen Time < 1h",
};

type ReportType = "summary" | "detailed";

export const generateProgressPDF = (
  entries: DailyEntry[],
  fromDate: string,
  toDate: string,
  reportType: ReportType
) => {
  const doc = new jsPDF();
  const sorted = [...entries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("MONK MODE — Progress Report", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${fromDate} to ${toDate}`, 14, 30);
  doc.text(`Report type: ${reportType === "summary" ? "Summary" : "Detailed"}`, 14, 36);
  doc.text(`Total days tracked: ${sorted.length}`, 14, 42);

  // Overall stats
  const avgPct = sorted.length > 0
    ? Math.round(sorted.reduce((s, e) => s + e.percentage, 0) / sorted.length)
    : 0;
  const daysAbove90 = sorted.filter((e) => e.percentage >= 90).length;
  const perfectDays = sorted.filter((e) => e.percentage === 100).length;

  // Streak calculation
  let longestStreak = 0;
  let tempStreak = 0;
  for (const entry of sorted) {
    if (entry.percentage >= 90) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  let y = 52;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Overview", 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Average Completion", `${avgPct}%`],
      ["Days ≥ 90%", `${daysAbove90} / ${sorted.length}`],
      ["Perfect Days (100%)", `${perfectDays}`],
      ["Longest Streak (≥90%)", `${longestStreak} days`],
    ],
    theme: "striped",
    headStyles: { fillColor: [38, 95, 52] },
    styles: { fontSize: 10 },
  });

  y = (doc as any).lastAutoTable?.finalY ?? y + 40;
  y += 10;

  // Habit performance breakdown
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Habit Performance", 14, y);
  y += 8;

  const habitStats = Object.entries(HABIT_LABELS).map(([id, label]) => {
    const completed = sorted.filter((e) => e.habits[id]).length;
    const rate = sorted.length > 0 ? Math.round((completed / sorted.length) * 100) : 0;
    return [label, `${completed}/${sorted.length}`, `${rate}%`];
  });

  autoTable(doc, {
    startY: y,
    head: [["Habit", "Days Completed", "Rate"]],
    body: habitStats,
    theme: "striped",
    headStyles: { fillColor: [38, 95, 52] },
    styles: { fontSize: 9 },
  });

  y = (doc as any).lastAutoTable?.finalY ?? y + 40;
  y += 10;

  // Non-negotiables breakdown
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Non-Negotiables", 14, y);
  y += 8;

  const nonNegStats = Object.entries(NON_NEG_LABELS).map(([id, label]) => {
    const kept = sorted.filter((e) => e.non_negotiables[id]).length;
    const rate = sorted.length > 0 ? Math.round((kept / sorted.length) * 100) : 0;
    return [label, `${kept}/${sorted.length}`, `${rate}%`];
  });

  autoTable(doc, {
    startY: y,
    head: [["Rule", "Days Kept", "Rate"]],
    body: nonNegStats,
    theme: "striped",
    headStyles: { fillColor: [180, 60, 40] },
    styles: { fontSize: 9 },
  });

  // Daily completion trend
  y = (doc as any).lastAutoTable?.finalY ?? y + 40;
  y += 10;

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Completion", 14, y);
  y += 8;

  const dailyRows = sorted.map((e) => [
    e.entry_date,
    `${e.percentage}%`,
    e.percentage >= 90 ? "✓" : "✗",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Date", "Completion", "Target Met"]],
    body: dailyRows,
    theme: "striped",
    headStyles: { fillColor: [38, 95, 52] },
    styles: { fontSize: 8 },
    columnStyles: {
      2: { halign: "center" },
    },
  });

  // Detailed report: add journal entries and todos
  if (reportType === "detailed") {
    doc.addPage();
    y = 20;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Journal Entries", 14, y);
    y += 8;

    for (const entry of sorted) {
      if (!entry.journal_entries || entry.journal_entries.length === 0) continue;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(entry.entry_date, 14, y);
      y += 6;

      for (const j of entry.journal_entries) {
        if (!j.text) continue;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(j.text, 180);
        doc.text(lines, 18, y);
        y += lines.length * 4.5 + 4;
      }
      y += 4;
    }

    // Todos section
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Tasks / Todos", 14, y);
    y += 8;

    for (const entry of sorted) {
      if (!entry.todos || entry.todos.length === 0) continue;

      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(entry.entry_date, 14, y);
      y += 6;

      for (const t of entry.todos) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`${t.done ? "☑" : "☐"} ${t.text}`, 18, y);
        y += 5;
      }
      y += 4;
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Monk Mode Progress Report — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`monk-mode-report_${fromDate}_to_${toDate}.pdf`);
};
