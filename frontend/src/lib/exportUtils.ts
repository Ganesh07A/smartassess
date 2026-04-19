/**
 * exportUtils.ts
 * Centralized professional reporting engine for SmartAssess.
 * Implements University-Standard formatting using jsPDF and PapaParse.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

// --- Colors and Styles ---
const COLORS = {
    NAVY: [30, 41, 59], // #1e293b - Headers
    ROYAL_BLUE: [37, 99, 235], // #2563eb - Table Headers
    SLATE_50: [248, 250, 252], // #f8fafc - Zebra Stripes
    SLATE_500: [100, 116, 139], // #64748b - Labels
    SUCCESS: [22, 101, 52], // Passed Green
    ERROR: [153, 27, 27], // Failed Red
};

interface StudentInfo {
    name: string;
    email: string;
    id?: string;
}

interface PerformanceEntry {
    srNo: number;
    examTitle: string;
    score: number;
    total: number;
    percentage: number;
    status: string;
    tabSwitches: number;
    date?: string;
}

/**
 * Base helper to setup a professional academic header
 */
const setupProfessionalHeader = (doc: jsPDF, title: string) => {
    // Brand Name - Navy
    doc.setFontSize(22);
    doc.setTextColor(COLORS.NAVY[0], COLORS.NAVY[1], COLORS.NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartAssess', 15, 20);

    // Document Title - Right Aligned
    doc.setFontSize(10);
    doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(title.toUpperCase(), 195, 20, { align: 'right' });

    // Divider
    doc.setDrawColor(226, 232, 240); // #e2e8f0
    doc.setLineWidth(0.5);
    doc.line(15, 25, 195, 25);
};

/**
 * Footer generator
 */
const setupFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // #94a3b8
        
        // Page Number
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        
        // Brand & Timestamp
        doc.text(`Official Record Generated on ${new Date().toLocaleString()} by SmartAssess`, 15, 285);
        
        // Stylized Watermark/Seal
        doc.setFont('helvetica', 'italic');
        doc.text('VERIFIED ACADEMIC RECORD', 195, 285, { align: 'right' });
    }
};

/**
 * EXPORT: Individual Student Performance History
 */
export const exportStudentHistory = ({ 
    student, 
    submissions, 
    teacherName 
}: { 
    student: StudentInfo, 
    submissions: any[],
    teacherName?: string
}) => {
    const doc = new jsPDF();
    setupProfessionalHeader(doc, 'Student Performance Record');

    // Metadata Section
    doc.setFontSize(10);
    doc.setTextColor(COLORS.NAVY[0], COLORS.NAVY[1], COLORS.NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT PROFILE', 15, 35);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${student.name}`, 15, 42);
    doc.text(`Email: ${student.email}`, 15, 47);
    doc.text(`ID: ${student.id || 'N/A'}`, 15, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENT INFO', 195, 35, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    if (teacherName) doc.text(`Authorized By: ${teacherName}`, 195, 42, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 195, 47, { align: 'right' });
    doc.text(`Status: AUTHENTICATED`, 195, 52, { align: 'right' });

    // Performance Table
    const tableData = submissions.map((sub, idx) => [
        idx + 1,
        sub.exam.title,
        `${sub.totalScore} / ${sub.exam.totalMarks}`,
        `${Math.round(sub.percentage)}%`,
        sub.passed ? 'PASSED' : 'FAILED',
        sub.tabSwitches
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Sr. No', 'Assessment Name', 'Marks Scored', '%', 'Result Status', 'Tab Sw.']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
            fillColor: [37, 99, 235], // COLORS.ROYAL_BLUE
            fontSize: 10,
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' }
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // COLORS.SLATE_50
        },
        margin: { left: 15, right: 15 },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                const val = data.cell.raw as string;
                data.cell.styles.textColor = val === 'PASSED' ? COLORS.SUCCESS as any : COLORS.ERROR as any;
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    setupFooter(doc);
    doc.save(`${student.name.replace(/\s+/g, '_')}_Performance_Record.pdf`);
};

/**
 * EXPORT: Exam Performance Summary (Teacher Leaderboard)
 */
export const exportExamLeaderboard = ({ 
    examTitle, 
    analytics, 
    students, 
    teacherName, 
    createdAt 
}: { 
    examTitle: string, 
    analytics: any, 
    students: any[],
    teacherName?: string,
    createdAt?: string
}) => {
    const doc = new jsPDF();
    setupProfessionalHeader(doc, 'Exam Performance Summary');

    // Metadata & Analytics Summary
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSESSMENT DETAILS', 15, 35);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exam: ${examTitle}`, 15, 42);
    if (teacherName) doc.text(`Teacher: ${teacherName}`, 15, 47);
    if (createdAt) doc.text(`Created: ${new Date(createdAt).toLocaleDateString()}`, 15, 52);

    doc.setFont('helvetica', 'bold');
    doc.text('PARTICIPATION SUMMARY', 195, 35, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Attempts: ${analytics?.attempts ?? 0}`, 195, 42, { align: 'right' });
    doc.text(`Pass Rate: ${analytics?.passRate ?? 0}%`, 195, 47, { align: 'right' });
    doc.text(`Avg. Score: ${analytics?.averageScore ?? 0}%`, 195, 52, { align: 'right' });

    // Results Table
    const tableData = students.map((res, idx) => [
        idx + 1,
        res.student.name,
        res.student.email,
        `${res.totalScore} / ${res.exam.totalMarks}`,
        `${Math.round(res.percentage)}%`,
        res.passed ? 'PASSED' : 'FAILED',
        res.tabSwitches
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Sr. No', 'Student', 'Email', 'Score', '%', 'Status', 'Sw.']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
            fillColor: [37, 99, 235],
            fontSize: 9,
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 5) {
                const val = data.cell.raw as string;
                data.cell.styles.textColor = val === 'PASSED' ? COLORS.SUCCESS as any : COLORS.ERROR as any;
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    setupFooter(doc);
    doc.save(`${examTitle.replace(/\s+/g, '_')}_Leaderboard.pdf`);
};

/**
 * EXPORT: Individual Exam Result Slip (Instant Result)
 */
export const exportResultSlip = ({ 
    student, 
    exam, 
    result,
    teacherName 
}: { 
    student: StudentInfo, 
    exam: any, 
    result: any,
    teacherName?: string
}) => {
    const doc = new jsPDF();
    setupProfessionalHeader(doc, 'Official Result Slip');

    // Branding Strip
    doc.setFillColor(37, 99, 235);
    doc.rect(15, 35, 180, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(exam.title.toUpperCase(), 105, 45, { align: 'center' });
    
    // Subtext: Teacher & Date
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const teacherText = teacherName ? `Teacher: ${teacherName}  |  ` : '';
    const dateText = exam.createdAt ? `Date: ${new Date(exam.createdAt).toLocaleDateString()}` : '';
    doc.text(`${teacherText}${dateText}`, 105, 53, { align: 'center' });

    // Main Score Card
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(55, 70, 100, 50);
    
    doc.setTextColor(COLORS.NAVY[0], COLORS.NAVY[1], COLORS.NAVY[2]);
    doc.setFontSize(12);
    doc.text('TOTAL SCORE', 105, 80, { align: 'center' });
    
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text(`${result.totalScore} / ${exam.totalMarks}`, 105, 100, { align: 'center' });
    
    doc.setFontSize(14);
    const passStatus = result.passed ? 'PASSED' : 'FAILED';
    doc.setTextColor(result.passed ? COLORS.SUCCESS[0] : COLORS.ERROR[0], 
                     result.passed ? COLORS.SUCCESS[1] : COLORS.ERROR[1], 
                     result.passed ? COLORS.SUCCESS[2] : COLORS.ERROR[2]);
    doc.text(passStatus, 105, 108, { align: 'center' });

    // Details Grid
    doc.setTextColor(COLORS.NAVY[0], COLORS.NAVY[1], COLORS.NAVY[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CANDIDATE DETAILS', 15, 135);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${student.name}`, 15, 142);
    doc.text(`Email: ${student.email}`, 15, 147);
    
    doc.setFont('helvetica', 'bold');
    doc.text('INTEGRITY & TIMING', 195, 135, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Tab Switches: ${result.tabSwitches}`, 195, 142, { align: 'right' });
    doc.text(`Completed On: ${new Date().toLocaleDateString()}`, 195, 147, { align: 'right' });

    // Horizontal Separator
    doc.line(15, 155, 195, 155);

    doc.setFontSize(9);
    doc.setTextColor(COLORS.SLATE_500[0], COLORS.SLATE_500[1], COLORS.SLATE_500[2]);
    doc.text('This is a system-generated result slip and serves as an official proof of assessment completion.', 105, 165, { align: 'center' });

    setupFooter(doc);
    doc.save(`${student.name.replace(/\s+/g, '_')}_Result_${exam.title.replace(/\s+/g, '_')}.pdf`);
};

/**
 * EXPORT: Generic CSV Export using PapaParse
 */
export const exportToCSV = (data: any[], filename: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
