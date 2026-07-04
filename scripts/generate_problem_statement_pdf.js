const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margins: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  }
});

const outputPath = path.join(__dirname, '..', 'Boundary_HRMS_Problem_Statement.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Colors
const PRIMARY_COLOR = '#005AAB'; // Endeavour Blue (Official Adamas University Color)
const ACCENT_COLOR = '#ffb703'; // Gold/Yellow
const DARK_NEUTRAL = '#1e293b'; // Slate 800
const LIGHT_NEUTRAL = '#f8fafc'; // Slate 50
const BORDER_COLOR = '#e2e8f0'; // Slate 200

// Helper to draw horizontal line
function drawLine() {
  doc.moveDown(0.5);
  doc.strokeColor(BORDER_COLOR).lineWidth(1)
     .moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke();
  doc.moveDown(0.8);
}

// Title Section
doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(22)
   .text('Boundary HRMS', { align: 'center' });
doc.fontSize(13).fillColor('#64748b').text('Odoo x Adamas University Hackathon \'26 Submission', { align: 'center' });
doc.fontSize(15).fillColor(DARK_NEUTRAL).text('HRMS Problem Statement & Solution Breakdown', { align: 'center' });
doc.moveDown(1);
drawLine();

// Introduction
doc.fillColor(DARK_NEUTRAL).font('Helvetica').fontSize(10.5).lineGap(4)
   .text('This document provides the official problem statements and solutions built into the Boundary HRMS Automated Boundary Engine, showcasing how the "Right-to-Disconnect" model is applied to both professional staff and student workers in a university ecosystem.', { align: 'justify' });
doc.moveDown(1.5);

// Case 1: University Employees
doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14)
   .text('Case 1: University Employees (Faculty & Non-Teaching Staff)');
doc.moveDown(0.6);

doc.fillColor(DARK_NEUTRAL).font('Helvetica-Bold').fontSize(11).text('The Problem Statement:');
doc.font('Helvetica').fontSize(10).lineGap(3);
const case1Problems = [
  'Continuous Connectivity: Professors, researchers, and administrative staff are constantly contacted by HODs, directors, or students outside shift hours (evenings, weekends, and holidays).',
  'Off-Hours Directives: Administrators often review and approve leave applications, update shift rotas, or assign administrative tasks late at night. Receiving these notifications off-hours forces employees to mentally re-engage with work, causing cognitive overload and burnout.',
  'Lack of Audit Trails: Universities lack a system to monitor if department heads are violating the legal "Right-to-Disconnect" policies.'
];
case1Problems.forEach(p => {
  doc.text('  • ', { bullet: true, continued: true }).text(p);
  doc.moveDown(0.3);
});

doc.moveDown(0.4);
doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text('How our HRMS Solves It:');
doc.fillColor(DARK_NEUTRAL).font('Helvetica').fontSize(10);
const case1Solutions = [
  'Boundary Guard: If a Dean or HR Admin clicks "Approve Leave" at 10 PM, the system intercepts it. The action is held in a database queue and delivered at 9 AM the next morning when the professor\'s shift starts.',
  'Emergency Bypass: Critical cases can be bypassed, but they are flagged as a "BREACH" in the audit log, which penalizes the department\'s compliance score.'
];
case1Solutions.forEach(s => {
  doc.text('  • ', { bullet: true, continued: true }).text(s);
  doc.moveDown(0.3);
});

doc.moveDown(1.5);
drawLine();

// Case 2: Student Workers
doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14)
   .text('Case 2: Student Workers (TAs, Lab Assistants, Interns, Library Helpers)');
doc.moveDown(0.6);

doc.fillColor(DARK_NEUTRAL).font('Helvetica-Bold').fontSize(11).text('The Problem Statement:');
doc.font('Helvetica').fontSize(10).lineGap(3);
const case2Problems = [
  'Class vs. Work Conflict: Student employees (TAs, researchers, peer tutors) have academic commitments (lectures, exams) alongside their part-time jobs.',
  'Unfair Boundaries: Faculty supervisors often email student workers or assign grading tasks during their lecture hours or study periods, assuming they are "always available" online.',
  'Lack of Tracking: Universities struggle to ensure that student work boundaries are respected so that their employment does not interfere with their academics.'
];
case2Problems.forEach(p => {
  doc.text('  • ', { bullet: true, continued: true }).text(p);
  doc.moveDown(0.3);
});

doc.moveDown(0.4);
doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text('How our HRMS Solves It:');
doc.fillColor(DARK_NEUTRAL).font('Helvetica').fontSize(10);
const case2Solutions = [
  'Academic-Work Shifting: The system blocks supervisor notifications and shift updates during the student\'s designated lecture/study hours.',
  'Class Hour Safeguards: Administrative decisions (like timesheet approvals) are automatically delayed and queued until the student\'s scheduled working hours start.'
];
case2Solutions.forEach(s => {
  doc.text('  • ', { bullet: true, continued: true }).text(s);
  doc.moveDown(0.3);
});

doc.addPage();

// Comparison Table Section
doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(14)
   .text('Comparison Summary for Presentation Slides');
doc.moveDown(0.8);

// Draw a simple table
const startY = doc.y;
const colWidths = [150, 170, 175];
const headers = ['Feature / User', 'University Employees', 'Student Workers (TAs/Interns)'];
const rows = [
  ['Contract Type', 'Full-time professional contract', 'Part-time work-study contract'],
  ['Protected Hours', 'Outside shift (e.g., 6 PM - 9 AM)', 'During lectures, exams, & study hours'],
  ['Source of Intrusion', 'HODs, Registrar, Administration', 'Professors, Lab Directors, HODs'],
  ['HRMS Impact', 'Prevents burn-out, improves retention', 'Protects academic performance']
];

// Draw Table Header
doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(9.5);
let currentX = 50;
headers.forEach((h, idx) => {
  doc.text(h, currentX, startY, { width: colWidths[idx] - 10 });
  currentX += colWidths[idx];
});

doc.moveDown(0.6);
doc.strokeColor(BORDER_COLOR).lineWidth(1.5)
   .moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke();
doc.moveDown(0.6);

// Draw Table Rows
rows.forEach(r => {
  const rowY = doc.y;
  let cellX = 50;
  
  // Cell 1
  doc.fillColor(DARK_NEUTRAL).font('Helvetica-Bold').fontSize(9)
     .text(r[0], cellX, rowY, { width: colWidths[0] - 10 });
  
  // Cell 2
  cellX += colWidths[0];
  doc.font('Helvetica')
     .text(r[1], cellX, rowY, { width: colWidths[1] - 10 });
     
  // Cell 3
  cellX += colWidths[1];
  doc.text(r[2], cellX, rowY, { width: colWidths[2] - 10 });
  
  doc.y = Math.max(doc.y, rowY + 25);
  doc.moveDown(0.3);
  doc.strokeColor(BORDER_COLOR).lineWidth(0.5)
     .moveTo(50, doc.y)
     .lineTo(545, doc.y)
     .stroke();
  doc.moveDown(0.4);
});

doc.end();
console.log('PDF generated at:', outputPath);
