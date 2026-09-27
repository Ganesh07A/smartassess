import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DetailedStudentResult } from '../../types/pdf';

export class StudentReportGenerator {
  private doc: jsPDF;
  
  // Colors from the template
  private colors = {
    primary: '#111827',     // gray-900
    secondary: '#4B5563',   // gray-600
    lightGray: '#9CA3AF',   // gray-400
    border: '#E5E7EB',      // gray-200
    bgLight: '#F9FAFB',     // gray-50
    bgHeader: '#F3F4F6',    // gray-100
    emerald: '#059669',     // emerald-600
    emeraldLight: '#ECFDF5',// emerald-50
    red: '#DC2626',         // red-600
    amber: '#D97706',       // amber-600
  };

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  // --- Helpers ---

  private drawText(
    text: string,
    x: number,
    y: number,
    options: {
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: string;
      align?: 'left' | 'center' | 'right';
      charSpacing?: number;
    } = {}
  ) {
    const { fontSize = 10, fontStyle = 'normal', color = this.colors.primary, align = 'left', charSpacing = 0 } = options;
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(color);
    
    // jsPDF doesn't have native charSpacing in text(), but we can simulate for short strings if needed
    // For now we just use the standard text
    this.doc.text(text, x, y, { align });
  }

  private drawBadge(text: string, x: number, y: number, bgColor: string, textColor: string = '#FFFFFF') {
    const padding = 3;
    this.doc.setFontSize(7);
    this.doc.setFont('helvetica', 'bold');
    const textWidth = this.doc.getTextWidth(text);
    const rectWidth = textWidth + padding * 2;
    const rectHeight = 5;

    this.doc.setFillColor(bgColor);
    this.doc.roundedRect(x - rectWidth, y - 3.5, rectWidth, rectHeight, 2.5, 2.5, 'F');
    
    this.doc.setTextColor(textColor);
    this.doc.text(text, x - rectWidth/2, y, { align: 'center' });
  }

  private drawMetricCard(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    value: string,
    subtitle: string,
    isPassed: boolean = false
  ) {
    // White background
    this.doc.setFillColor('#FFFFFF');
    this.doc.roundedRect(x, y, width, height, 2, 2, 'F');
    
    // Border
    this.doc.setDrawColor(this.colors.border);
    this.doc.setLineWidth(0.1);
    this.doc.roundedRect(x, y, width, height, 2, 2, 'S');

    // Title (Uppercase)
    this.drawText(title.toUpperCase(), x + width / 2, y + 8, {
      fontSize: 7,
      color: this.colors.lightGray,
      fontStyle: 'bold',
      align: 'center'
    });

    // Value
    this.drawText(value, x + width / 2, y + 18, {
      fontSize: 16,
      color: title === 'Integrity Index' ? this.colors.emerald : this.colors.primary,
      fontStyle: 'bold',
      align: 'center'
    });

    // Subtitle / Status
    if (title === 'Total Score' && isPassed) {
        const statusText = 'PASSED';
        this.doc.setFontSize(7);
        const tw = this.doc.getTextWidth(statusText);
        this.doc.setFillColor(this.colors.emeraldLight);
        this.doc.roundedRect(x + (width - tw - 4)/2, y + 22, tw + 4, 4, 0.5, 0.5, 'F');
        this.drawText(statusText, x + width / 2, y + 25, {
            fontSize: 7,
            color: this.colors.emerald,
            fontStyle: 'bold',
            align: 'center'
        });
    } else {
        this.drawText(subtitle, x + width / 2, y + 26, {
            fontSize: 7,
            color: this.colors.lightGray,
            align: 'center'
        });
    }
  }

  // --- Main Layout Methods ---

  public generateHeader(data: DetailedStudentResult) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    
    // Top Title
    this.drawText('SHREEYASH COLLEGE OF ENGINEERING', pageWidth / 2, 20, {
      fontSize: 18,
      fontStyle: 'bold',
      align: 'center',
    });
    this.drawText('SmartAssess Academic Portal', pageWidth / 2, 26, {
      fontSize: 8,
      color: this.colors.lightGray,
      align: 'center',
    });

    // Bottom border for header
    this.doc.setDrawColor(this.colors.primary);
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 32, pageWidth - 20, 32);

    // Section 2: Report Title & Badge
    const titleY = 45;
    this.drawText('Official Result Slip & Analysis', 20, titleY, { fontSize: 16, fontStyle: 'normal' });
    this.drawText('Ref: user_3COTvegZ2AFQi2QqcayEcCHPLqY', 20, titleY + 5, { fontSize: 7, color: this.colors.lightGray });
    
    this.drawBadge('AUTHENTICATED', pageWidth - 20, titleY, this.colors.emeraldLight, this.colors.emerald);
  }

  public generateDetailsBox(data: DetailedStudentResult) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const startY = 55;
    const height = 30;
    
    // Gray background
    this.doc.setFillColor(this.colors.bgLight);
    this.doc.roundedRect(20, startY, pageWidth - 40, height, 2, 2, 'F');
    
    // Border
    this.doc.setDrawColor(this.colors.border);
    this.doc.setLineWidth(0.2);
    this.doc.roundedRect(20, startY, pageWidth - 40, height, 2, 2, 'S');

    // Left Column: Candidate Details
    const leftX = 25;
    this.drawText('CANDIDATE DETAILS', leftX, startY + 6, { fontSize: 7, fontStyle: 'bold', color: this.colors.lightGray });
    this.drawText(data.candidate.name, leftX, startY + 12, { fontSize: 11, fontStyle: 'bold' });
    this.drawText(data.candidate.email, leftX, startY + 17, { fontSize: 8, color: this.colors.secondary });
    this.drawText(`PRN: ${data.candidate.prn} | Dept: CSE`, leftX, startY + 22, { fontSize: 8, color: this.colors.secondary });

    // Right Column: Assessment Info
    const rightX = 110;
    this.drawText('ASSESSMENT INFO', rightX, startY + 6, { fontSize: 7, fontStyle: 'bold', color: this.colors.lightGray });
    this.drawText(data.assessment.name, rightX, startY + 12, { fontSize: 11, fontStyle: 'bold' });
    this.drawText(`Date: ${data.assessment.date}`, rightX, startY + 17, { fontSize: 8, color: this.colors.secondary });
    this.drawText(`Duration: ${data.assessment.duration}`, rightX, startY + 22, { fontSize: 8, color: this.colors.secondary });
  }

  public generateHeroMetrics(data: DetailedStudentResult) {
    const startY = 92;
    const cardWidth = 53;
    const cardHeight = 32;
    const spacing = 5.5;

    // Total Score Card
    const scorePercentage = (data.metrics.totalScore / data.metrics.maxScore) * 100;
    this.drawMetricCard(
      20,
      startY,
      cardWidth,
      cardHeight,
      'Total Score',
      `${data.metrics.totalScore} / ${data.metrics.maxScore}`,
      scorePercentage > 40 ? 'PASSED' : 'RE-ATTEMPT',
      scorePercentage > 40
    );

    // Percentile Card
    this.drawMetricCard(
      20 + cardWidth + spacing,
      startY,
      cardWidth,
      cardHeight,
      'Class Percentile',
      `Top ${100 - data.metrics.percentile}%`,
      'Rank: 4th'
    );

    // Integrity Index Card
    this.drawMetricCard(
      20 + (cardWidth + spacing) * 2,
      startY,
      cardWidth,
      cardHeight,
      'Integrity Index',
      `${data.metrics.integrityIndex}%`,
      'Tab Switches: 1'
    );
  }

  public generateAnalysisTable(data: DetailedStudentResult) {
    this.drawText('QUESTION ANALYSIS', 20, 135, { fontSize: 8, fontStyle: 'bold', color: this.colors.primary });
    
    const tableBody = data.questions.map((q, index) => [
      index + 1,
      q.isCoding ? `[CODE] ${q.questionText}` : q.questionText,
      q.studentAnswer || '-- Not Attempted --',
      q.correctAnswer,
      { 
        content: `${q.marksObtained}/${q.maxMarks}\n${q.status}`, 
        status: q.status 
      }
    ]);

    autoTable(this.doc, {
      startY: 138,
      head: [['#', 'Question Reference', 'Your Response', 'Correct Response', 'Marks']],
      body: tableBody.map(row => row.slice(0, 4).concat((row[4] as any).content)),
      margin: { left: 20, right: 20 },
      styles: { fontSize: 8, cellPadding: 3, textColor: this.colors.secondary },
      headStyles: { 
        fillColor: [243, 244, 246], // bgHeader
        textColor: [75, 85, 99],    // secondary
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [209, 213, 219] // gray-300
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 60, fontStyle: 'bold', textColor: this.colors.primary },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (cellData) => {
        if (cellData.section === 'body' && cellData.column.index === 4) {
          const status = (tableBody[cellData.row.index][4] as any).status;
          if (status === 'CORRECT') cellData.cell.styles.textColor = [5, 150, 105]; // emerald
          else if (status === 'INCORRECT') cellData.cell.styles.textColor = [220, 38, 38]; // red
          else if (status === 'PARTIAL') cellData.cell.styles.textColor = [217, 119, 6]; // amber
          else cellData.cell.styles.textColor = [156, 163, 175]; // lightGray
        }

        // Italic for skipped or incorrect responses
        if (cellData.section === 'body' && cellData.column.index === 2) {
          const status = (tableBody[cellData.row.index][4] as any).status;
          if (status === 'SKIPPED') {
            cellData.cell.styles.fontStyle = 'italic';
            cellData.cell.styles.textColor = [156, 163, 175];
          }
          if (status === 'INCORRECT') {
            cellData.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
    });
  }

  public generateFooter() {
    const pageCount = (this.doc as any).internal.getNumberOfPages();
    const pageWidth = this.doc.internal.pageSize.getWidth();
    const footerY = 285;

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setDrawColor(this.colors.border);
      this.doc.setLineWidth(0.1);
      this.doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);

      this.drawText('System-generated report. No signature required.', 20, footerY, { fontSize: 7, color: this.colors.lightGray });
      this.drawText('Powered by SmartAssess Intelligence Engine', 20, footerY + 3, { fontSize: 7, color: this.colors.lightGray });

      const timestamp = new Date().toLocaleString();
      this.drawText(`Generated: ${timestamp}`, pageWidth - 20, footerY, { fontSize: 7, color: this.colors.lightGray, align: 'right' });
      this.drawText(`Page ${i} of ${pageCount}`, pageWidth - 20, footerY + 3, { fontSize: 7, color: this.colors.lightGray, align: 'right' });
    }
  }

  public downloadStudentReport(data: DetailedStudentResult, filename: string) {
    this.generateHeader(data);
    this.generateDetailsBox(data);
    this.generateHeroMetrics(data);
    this.generateAnalysisTable(data);
    this.generateFooter();
    this.doc.save(filename);
  }

  // Teacher record remains simpler but inherits some styling improvements
  public downloadOfficialRecord(data: DetailedStudentResult, filename: string) {
    const pageWidth = this.doc.internal.pageSize.getWidth();
    this.drawText('OFFICIAL ASSESSMENT RECORD', 20, 20, { fontSize: 14, fontStyle: 'bold' });
    this.drawText('CONFIDENTIAL DOCUMENT', 20, 26, { fontSize: 8, color: this.colors.red, fontStyle: 'bold' });
    
    this.doc.setDrawColor(0);
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 30, pageWidth - 20, 30);

    this.drawText(`Candidate: ${data.candidate.name} (${data.candidate.prn})`, 20, 40, { fontSize: 10 });
    this.drawText(`Assessment: ${data.assessment.name}`, 20, 46, { fontSize: 10 });
    
    autoTable(this.doc, {
      startY: 55,
      head: [['#', 'QID', 'Type', 'Status', 'Marks', 'Max']],
      body: data.questions.map((q, i) => [i + 1, q.questionId, q.isCoding ? 'CODING' : 'MCQ', q.status, q.marksObtained, q.maxMarks]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    this.generateFooter();
    this.doc.save(filename);
  }
}
