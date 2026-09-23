import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Objective, User, Site, ReportConfig } from '../types';
import { CompanyInfo } from '../store/slices/createDataSlice';

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export function generateObjectivePDF(
  objective: Objective, 
  site: Site | undefined, 
  assignee: User | undefined, 
  manager: User | undefined, 
  users: User[],
  reportConfig: ReportConfig,
  companyInfo: CompanyInfo
) {
  // 1. Initialize document
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Colors from Config
  const primaryColor = hexToRgb(reportConfig.primaryColor || '#10B981');
  const secondaryColor = hexToRgb(reportConfig.secondaryColor || '#0F172A');
  const darkColor = secondaryColor;
  const lightGray: [number, number, number] = [241, 245, 249];
  const textColor: [number, number, number] = [51, 65, 85];
  const dangerColor: [number, number, number] = [239, 68, 68];
  const warningColor: [number, number, number] = [245, 158, 11];

  const fontFamily = reportConfig.fontFamily || 'helvetica';

  // Helper functions
  const addTitle = (
    text: string,
    size = 14,
    color = darkColor,
    x = margin,
    align: 'left' | 'center' | 'right' = 'left'
  ) => {
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont(fontFamily, 'bold');
    if (align === 'center') {
      doc.text(text, pageWidth / 2, currentY, { align: 'center' });
    } else if (align === 'right') {
      doc.text(text, pageWidth - margin, currentY, { align: 'right' });
    } else {
      doc.text(text, x, currentY);
    }
    currentY += size * 0.4 + 2;
    doc.setFont(fontFamily, 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  };

  const addField = (label: string, value: string, x = margin, y = currentY, width = (pageWidth - margin * 2) / 2) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, y);
    doc.setFont('helvetica', 'normal');

    const labelWidth = doc.getTextWidth(`${label}: `);
    const splitValue = doc.splitTextToSize(value || 'N/A', width - labelWidth);

    doc.text(splitValue, x + labelWidth, y);
    return y + Math.max(5, splitValue.length * 5);
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // --- HEADER ---
  if (reportConfig.showHeader) {
    doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, 10, 15, 15, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(fontFamily, 'bold');
    doc.text(companyInfo.name || 'PUMA', margin + 7.5, 20, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('RAPPORT DE PILOTAGE', margin + 20, 20);
    
    doc.setFontSize(8);
    doc.setFont(fontFamily, 'normal');
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, pageWidth - margin, 15, { align: 'right' });
    doc.text(`SITE: ${site?.name?.toUpperCase() || 'GLOBAL'}`, pageWidth - margin, 22, { align: 'right' });
  }

  currentY = 50;

  // --- HEALTH STATUS & MAIN INFO ---
  const healthColor = objective.healthStatus === 'Critique' ? dangerColor : objective.healthStatus === 'Attention' ? warningColor : primaryColor;
  
  doc.setDrawColor(healthColor[0], healthColor[1], healthColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 20, 2, 2, 'D');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('SANTÉ DE L\'OPÉRATION:', margin + 5, currentY + 12);
  
  doc.setTextColor(healthColor[0], healthColor[1], healthColor[2]);
  doc.setFontSize(14);
  doc.text(objective.healthStatus.toUpperCase(), margin + 50, currentY + 12.5);
  
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(9);
  doc.text(`ID: #${objective.id.toUpperCase()}`, pageWidth - margin - 5, currentY + 12, { align: 'right' });

  currentY += 30;

  // --- SMART WATCHER RISK ANALYSIS ---
  checkPageBreak(40);
  addTitle('SMART WATCHER : ANALYSE DE RISQUE');
  currentY += 2;
  
  const riskColor = objective.riskScore > 70 ? dangerColor : objective.riskScore > 40 ? warningColor : primaryColor;
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.rect(margin, currentY, (pageWidth - margin * 2) * (objective.riskScore / 100), 4, 'F');
  currentY += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`SCORE: ${objective.riskScore}% - NIVEAU: ${objective.riskLevel?.toUpperCase() || 'NORMAL'}`, margin, currentY);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Calculé automatiquement selon les bloqueurs, le respect des SLA et la complexité opérationnelle.', margin, currentY + 4);
  
  currentY += 15;

  // --- MISSION DESCRIPTION ---
  addTitle('1. DESCRIPTION DE L\'OPÉRATION');
  currentY += 2;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(objective.title, margin, currentY);
  currentY += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const splitDesc = doc.splitTextToSize(objective.description || 'Aucune description fournie.', pageWidth - margin * 2);
  doc.text(splitDesc, margin, currentY);
  currentY += splitDesc.length * 5 + 10;

  // --- MANAGEMENT & CONTEXT ---
  addTitle('2. RESPONSABILITÉS & CONTEXTE');
  currentY += 2;
  
  const colWidth = (pageWidth - margin * 2) / 2;
  const topY = currentY;
  
  let leftY = topY;
  leftY = addField('Donneur d\'ordre (Manager)', manager?.name || 'N/A', margin, leftY, colWidth);
  leftY = addField('Porteur (Assigné)', assignee?.name || 'N/A', margin, leftY, colWidth);
  leftY = addField('Département', objective.department || 'N/A', margin, leftY, colWidth);
  
  let rightY = topY;
  rightY = addField('Type d\'Opération', objective.type || 'N/A', margin + colWidth, rightY, colWidth);
  rightY = addField('Priorité', objective.priority || 'N/A', margin + colWidth, rightY, colWidth);
  rightY = addField('Statut Actuel', objective.status || 'N/A', margin + colWidth, rightY, colWidth);
  
  currentY = Math.max(leftY, rightY) + 5;
  
  const dateY = currentY;
  const nextLeftY = addField('Date de Début', objective.startDate ? format(new Date(objective.startDate), 'dd/MM/yyyy') : 'N/A', margin, dateY, colWidth);
  const nextRightY = addField('Échéance Prévue', objective.dueDate ? format(new Date(objective.dueDate), 'dd/MM/yyyy') : 'N/A', margin + colWidth, dateY, colWidth);
  
  currentY = Math.max(nextLeftY, nextRightY) + 10;

  // --- PLAN D'ACTION (WORKFLOW) ---
  if (objective.workflow && objective.workflow.length > 0) {
    checkPageBreak(50);
    addTitle('3. PLAN D\'ACTION & AVANCEMENT');
    currentY += 2;

    const workflowBody = objective.workflow.map((step, index) => {
      const stepAssignee = users.find((u) => u.id === step.assigneeId);
      const dateStr = step.completedAt ? format(new Date(step.completedAt), 'dd/MM/yy HH:mm') : '-';
      return [
        (index + 1).toString(),
        step.title,
        stepAssignee?.name || 'N/A',
        step.status,
        dateStr
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Étape du Processus', 'Responsable', 'Statut', 'Validation']],
      body: workflowBody,
      theme: 'grid',
      headStyles: { fillColor: darkColor, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
      alternateRowStyles: { fillColor: lightGray },
      margin: { left: margin, right: margin }
    });

    const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    currentY = (docWithAutoTable.lastAutoTable?.finalY || currentY) + 15;
  }

  // --- AUDIT TRAIL (HISTORY) ---
  if (objective.auditLog && objective.auditLog.length > 0) {
    checkPageBreak(50);
    addTitle('4. TRAÇABILITÉ & HISTORIQUE (AUDIT TRAIL)');
    currentY += 2;

    const auditBody = objective.auditLog.slice().reverse().slice(0, 15).map((log) => [
      format(new Date(log.timestamp), 'dd/MM/yy HH:mm'),
      log.userName,
      log.action,
      log.details
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Horodatage', 'Utilisateur', 'Action', 'Détails']],
      body: auditBody,
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' }
      },
      margin: { left: margin, right: margin }
    });

    const docWithAutoTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    currentY = (docWithAutoTable.lastAutoTable?.finalY || currentY) + 15;
  }

  // --- BINDER SUMMARY (FILES) ---
  if (objective.attachments && objective.attachments.length > 0) {
    checkPageBreak(40);
    addTitle('5. CLASSEUR (PIÈCES JOINTES OPÉRATION)');
    currentY += 2;
    
    const filesList = objective.attachments.map(f => `- ${f.name} (${f.type}, ${(f.size/1024).toFixed(0)} KB) - déposé le ${format(new Date(f.uploadedAt), 'dd/MM/yy')}`).join('\n');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const splitFiles = doc.splitTextToSize(filesList, pageWidth - margin * 2);
    doc.text(splitFiles, margin, currentY);
    currentY += splitFiles.length * 4 + 10;
  }

  // --- FOOTER ---
  if (reportConfig.showFooter) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.text(reportConfig.footerText || `Document confidentiel - Système de Pilotage Industriel ${companyInfo.name}`, margin, pageHeight - 8);
      doc.text(`Page ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }

  // Save the PDF
  const filename = `PUMA_REPORT_${objective.id.toUpperCase()}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}

export function generateCOMEXReport(objectives: Objective[], sites: Site[], users: User[], reportConfig: ReportConfig, _companyInfo: CompanyInfo) {
  const doc = new jsPDF('l', 'mm', 'a4'); // Paysage pour plus de place
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = 20;

  const primaryColor = hexToRgb(reportConfig.primaryColor || '#10B981');
  const secondaryColor = hexToRgb(reportConfig.secondaryColor || '#0F172A');
  const darkColor = secondaryColor;
  const fontFamily = reportConfig.fontFamily || 'helvetica';

  // Header
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont(fontFamily, 'bold');
  doc.text('RAPPORT STRATÉGIQUE ACHATS - COMEX', margin, 18);
  
  doc.setFontSize(10);
  doc.setFont(fontFamily, 'normal');
  doc.text(`Période: ${format(new Date(), 'MMMM yyyy', { locale: fr }).toUpperCase()}`, pageWidth - margin, 12, { align: 'right' });
  doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin, 18, { align: 'right' });

  currentY = 45;

  // --- GLOBAL KPI SECTION ---
  const totalSpend = objectives.reduce((acc, obj) => acc + (obj.quoteAmount || 0), 0);
  const completedCount = objectives.filter(o => o.status === 'Terminé').length;
  const criticalCount = objectives.filter(o => o.healthStatus === 'Critique').length;
  const avgRisk = Math.round(objectives.reduce((acc, obj) => acc + (obj.riskScore || 0), 0) / (objectives.length || 1));

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 40, 2, 2, 'F');
  
  const cardWidth = (pageWidth - margin * 2) / 4;
  
  const addKPICard = (label: string, value: string, color: [number, number, number], x: number) => {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + cardWidth / 2, currentY + 15, { align: 'center' });
    doc.setFontSize(18);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(value, x + cardWidth / 2, currentY + 28, { align: 'center' });
  };

  addKPICard('VOLUME ACHATS TOTAL', `${totalSpend.toLocaleString()} DZD`, darkColor, margin);
  addKPICard('OPÉRATIONS TERMINÉES', completedCount.toString(), primaryColor, margin + cardWidth);
  addKPICard('ALERTES CRITIQUES', criticalCount.toString(), [239, 68, 68], margin + cardWidth * 2);
  addKPICard('INDEX DE RISQUE MOYEN', `${avgRisk}%`, [245, 158, 11], margin + cardWidth * 3);

  currentY += 55;

  // --- TABLE: TOP STRATEGIC OBJECTIVES ---
  doc.setFontSize(12);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('SYNTHÈSE DES OPÉRATIONS STRATÉGIQUES', margin, currentY);
  currentY += 5;

  const tableData = objectives
    .sort((a, b) => (b.quoteAmount || 0) - (a.quoteAmount || 0))
    .slice(0, 15)
    .map(obj => [
      obj.id.toUpperCase(),
      obj.title,
      sites.find(s => s.id === obj.siteId)?.name || 'N/A',
      users.find(u => u.id === obj.assigneeId)?.name || 'N/A',
      `${(obj.quoteAmount || 0).toLocaleString()} ${obj.currency || 'DZD'}`,
      obj.status,
      `${obj.riskScore}%`
    ]);

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'TITRE DE L\'OPÉRATION', 'SITE', 'RESPONSABLE', 'MONTANT ESTIMÉ', 'STATUT', 'RISQUE']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: darkColor, fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      4: { fontStyle: 'bold', halign: 'right' },
      6: { halign: 'center' }
    },
    margin: { left: margin, right: margin }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CONFIDENTIEL - DIRECTION PUMA', margin, pageHeight - 10);
    doc.text(`Rapport Stratégique - Page ${i} / ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  doc.save(`PUMA_COMEX_REPORT_${format(new Date(), 'yyyyMMdd')}.pdf`);
}
