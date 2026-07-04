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

const outputPath = path.join(__dirname, '..', 'Boundary_HRMS_Video_Script.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Colors
const PRIMARY_COLOR = '#ffb703'; // Yellow glow from Adamas portal style
const SECONDARY_COLOR = '#023047'; // Deep blue
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
doc.fillColor(SECONDARY_COLOR).font('Helvetica-Bold').fontSize(22)
   .text('Boundary HRMS', { align: 'center' });
doc.fontSize(14).fillColor('#64748b').text('Odoo x Adamas University Hackathon \'26', { align: 'center' });
doc.fontSize(12).fillColor('#64748b').text('5-Minute Video Demonstration Script', { align: 'center' });
doc.moveDown(1);
drawLine();

// Introduction / Overview text
doc.fillColor(DARK_NEUTRAL).font('Helvetica').fontSize(10.5).lineGap(4.5)
   .text('This document contains the exact steps and voiceover script for your 5-minute video demonstration submission. It walks through all key features of the Boundary HRMS (Right-to-Disconnect) application.', { align: 'justify' });
doc.moveDown(1.5);

// Preparation Checklist
doc.fillColor(SECONDARY_COLOR).font('Helvetica-Bold').fontSize(14)
   .text('1. Preparation Checklist (Before Recording)');
doc.moveDown(0.5);

const checklist = [
  'Reset Database: Run "npm run seed:demo" in your terminal to ensure you have a clean set of demo data.',
  'Start Server: Run "npm start" (or "node server.js") and open the app in a browser (http://localhost:4000).',
  'Admin Login Credentials: admin@boundaryhrms.com / password: admin123',
  'Employee Login Credentials: employee@boundaryhrms.com / password: employee123',
  'Recording Software: Open OBS, Loom, or Windows Game Bar, adjust your microphone, and speak slowly.'
];

checklist.forEach(item => {
  doc.fillColor(DARK_NEUTRAL).font('Helvetica-Bold').text('  • ', { bullet: true, continued: true })
     .font('Helvetica').text(item);
  doc.moveDown(0.4);
});
doc.moveDown(1);

// Video Timeline Overview
doc.fillColor(SECONDARY_COLOR).font('Helvetica-Bold').fontSize(14)
   .text('2. Video Timeline & Segments');
doc.moveDown(0.5);

const timeline = [
  { time: '00:00 - 00:45', segment: 'Introduction & Problem Statement (45s)' },
  { time: '00:45 - 01:30', segment: 'Dashboard Overview & Setup (45s)' },
  { time: '01:30 - 02:20', segment: 'Employee Directory & CSV Export/Import (50s)' },
  { time: '02:20 - 03:20', segment: 'The Right-to-Disconnect Flow: Employee Action (60s)' },
  { time: '03:20 - 04:10', segment: 'The Right-to-Disconnect Flow: Admin Warn & Queue (50s)' },
  { time: '04:10 - 04:40', segment: 'Analytics, Shift Simulation & Audit Trail (30s)' },
  { time: '04:40 - 05:00', segment: 'Conclusion & Wrap Up (20s)' }
];

timeline.forEach(t => {
  doc.fillColor(DARK_NEUTRAL).font('Helvetica-Bold').text(`  ${t.time}  -  `, { continued: true })
     .font('Helvetica').text(t.segment);
  doc.moveDown(0.4);
});

doc.addPage();

// Detailed Storyboard & Script
doc.fillColor(SECONDARY_COLOR).font('Helvetica-Bold').fontSize(16)
   .text('3. Detailed Storyboard & Voiceover Script');
doc.moveDown(1);

const sections = [
  {
    title: 'Section 1: Introduction & Problem Statement (00:00 - 00:45)',
    visuals: 'Show the login screen of the Adamas Student Portal / Boundary HRMS. Move your cursor slightly over the subtitle: "Smart attendance, compliance, and boundary automation".',
    voiceover: 'Hello, Sir. Today, I am proud to present our final submission for the Odoo x Adamas University Hackathon: Boundary HRMS, an automated boundary engine designed for the modern workplace.\n\nWith the rise of remote work and continuous digital communication, employees are facing severe burnout. Many countries are passing "Right-to-Disconnect" laws, which prohibit employers from contacting employees outside of their shift hours.\n\nOur application solves this by creating an automated boundary engine. It blocks or queues off-hour administrative actions, calculates a real-time compliance score, and provides a full audit trail—all powered by a local SQLite WASM database.'
  },
  {
    title: 'Section 2: Dashboard Overview & Setup (00:45 - 01:30)',
    visuals: 'Log in as admin (admin@boundaryhrms.com / admin123). Hover over the dynamic cards on the Overview tab (Today\'s Attendance, Leave Balances, and Shift Schedule).',
    voiceover: 'Let\'s log in as the Administrator. Once logged in, we are welcomed by our modern, responsive dashboard.\n\nOn the left, we have a clean sidebar navigation. On the right, we see the active boundary banner indicating whether we are currently inside or outside of shift hours. The dashboard highlights three key widgets: Today\'s Attendance logs, interactive gauges showing remaining paid and sick leave balances, and the employee\'s contracted shift hours. In this case, the standard shift is set from 9:00 AM to 6:00 PM.'
  },
  {
    title: 'Section 3: Employee Directory & CSV Operations (01:30 - 02:20)',
    visuals: 'Click the Employees tab in the sidebar. Hover over "Export Employees CSV" and "Export Attendance CSV". Explain the upload CSV function.',
    voiceover: 'Now, let\'s look at employee configuration under the Employees tab. As an admin, we can modify contract details for any team member, including their exact shift hours and leave balances.\n\nTo make HR administration seamless, we built native CSV integration. We can export the entire employee directory or attendance log with a single click.\n\nMore importantly, we built a smart CSV importer. When importing users, the engine validates email patterns and roles, automatically skipping incorrect entries and returning a comprehensive validation report. This keeps the workspace database clean and error-free.'
  },
  {
    title: 'Section 4: The Right-to-Disconnect Flow (Part A - 02:20 - 03:20)',
    visuals: 'Log out of admin. Log in as employee@boundaryhrms.com (password: employee123). Point to the yellow "Active: Outside Shift Hours" banner. Go to Leave Requests, select Paid Leave for next week, fill in a reason, and click Submit.',
    voiceover: 'Now, let\'s see the core Right-to-Disconnect engine in action. I will log out as the admin and sign in as a standard employee.\n\nAs you can see, because it is past 6:00 PM, the system automatically detects that the employee is outside their shift hours. The top banner turns yellow and reads: "Active: Outside Shift Hours".\n\nLet\'s go to the Leave Requests section and apply for a paid leave for next week. I\'ll input the start date, end date, leave type, and submit. The request goes to the database with a pending status.'
  },
  {
    title: 'Section 4: The Right-to-Disconnect Flow (Part B - 03:20 - 04:10)',
    visuals: 'Log out and log back in as admin@boundaryhrms.com. Go to Leave Requests, click Approve on the pending request. Watch the "Right-to-Disconnect Boundary Breach" Modal pop up. Click the yellow "Queue for Shift Start" button.',
    voiceover: 'I will log back in as the Administrator to process this request. Under Leave Requests, I find the employee\'s pending leave.\n\nWatch what happens when I click "Approve". Because the employee is off-duty, the system blocks the immediate approval to prevent sending off-hour notifications. A warning modal alerts me that proceeding will breach compliance.\n\nWe have two choices: we can perform an "Emergency Bypass" if it is critical, or we can choose the recommended option—"Queue for Shift Start". Let\'s queue it. The system schedules the approval to be dispatched when the employee\'s next shift begins at 9:00 AM.'
  },
  {
    title: 'Section 5: Analytics, Simulation, and Audit Trail (04:10 - 04:40)',
    visuals: 'Navigate to the Compliance Center tab. Highlight the Compliance Score circle and SVG charts. Point to the queued action in the table. Click "Simulate Shift Start & Deliver". Show the updated logs.',
    voiceover: 'Let\'s go to the Compliance Center. Here, HR managers can monitor their workplace health. Our real-time Work-Hour Compliance Score tracks the percentage of administrative decisions executed within contract hours.\n\nBelow, we see the Right-to-Disconnect simulator. There is our queued leave approval, set to deliver at 9:00 AM.\n\nLet\'s click "Simulate Shift Start & Deliver" to fast-forward time. The engine instantly processes the queue, updates the employee\'s leave balance, and writes a success log to our Compliance Audit Trail. This gives us a transparent, immutable record of all boundary compliance events.'
  },
  {
    title: 'Section 6: Conclusion (04:40 - 05:00)',
    visuals: 'Hover over the compliance dashboard showing SVG graphs. End the video with a professional closing.',
    voiceover: 'In conclusion, Boundary HRMS successfully guarantees the Right-to-Disconnect for employees while ensuring the business can queue and schedule operations efficiently. It is robust, local-first, and highly responsive.\n\nThank you, Sir, for your time. I am happy to take any questions.'
  }
];

sections.forEach((sec, idx) => {
  doc.fillColor(SECONDARY_COLOR).font('Helvetica-Bold').fontSize(12)
     .text(sec.title);
  doc.moveDown(0.3);

  // Visuals box
  doc.fillColor(DARK_NEUTRAL).font('Helvetica-Oblique').fontSize(9.5)
     .text('Visuals to show: ', { continued: true })
     .font('Helvetica').text(sec.visuals);
  doc.moveDown(0.4);

  // Voiceover box
  doc.fillColor('#0f766e').font('Helvetica-Bold').fontSize(9.5)
     .text('Speak: ', { continued: true })
     .fillColor(DARK_NEUTRAL).font('Helvetica').text(sec.voiceover, { lineGap: 3.5 });
  
  if (idx < sections.length - 1) {
    doc.moveDown(1.2);
    // Add page break if getting close to page bottom
    if (doc.y > 670) {
      doc.addPage();
    } else {
      drawLine();
    }
  }
});

doc.end();
console.log('PDF generated at:', outputPath);
