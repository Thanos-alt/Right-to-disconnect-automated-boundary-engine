// Shared types and seed data for the RTD-ABE demo server

/** @typedef {{ employeeId: string, displayName: string, department: string, country: string, workWindow: { start: string, end: string }, contractType: string }} Employee */

/** @typedef {{ sender: string, subject: string, body: string, employeeId: string, timestamp: string, deliverAt: string | null }} QueuedMessage */

/** @typedef {{ managerId: string, sent: number, blocked: number, complianceRate: number }} ManagerCompliance */

/** @typedef {{ countryCode: string, delivered: number, blocked: number }} CountryStat */

/** @typedef {{ employees: number, queuedMessages: number, deliveredMessages: number, blockedMessages: number, managers: ManagerCompliance[], countries: CountryStat[] }} DashboardData */

/** @typedef {{ employees: Employee[], queuedMessages: QueuedMessage[] }} SnapshotData */

const seedEmployees = [
  { employeeId: 'EMP-001', displayName: 'Alice Chen', department: 'Engineering', country: 'FR', workWindow: { start: '09:00', end: '18:00' }, contractType: 'full-time' },
  { employeeId: 'EMP-002', displayName: 'Bob Martinez', department: 'Engineering', country: 'DE', workWindow: { start: '08:00', end: '17:00' }, contractType: 'full-time' },
  { employeeId: 'EMP-003', displayName: 'Clara Dubois', department: 'HR', country: 'FR', workWindow: { start: '09:00', end: '17:30' }, contractType: 'full-time' },
  { employeeId: 'EMP-004', displayName: 'Deepak Sharma', department: 'Finance', country: 'IN', workWindow: { start: '10:00', end: '19:00' }, contractType: 'permanent' },
  { employeeId: 'EMP-005', displayName: 'Elena Vogt', department: 'Marketing', country: 'DE', workWindow: { start: '08:30', end: '17:00' }, contractType: 'part-time' },
  { employeeId: 'EMP-006', displayName: 'Felix Ortega', department: 'Sales', country: 'FR', workWindow: { start: '09:00', end: '18:00' }, contractType: 'full-time' },
  { employeeId: 'EMP-007', displayName: 'Grace Kim', department: 'Engineering', country: 'IN', workWindow: { start: '09:00', end: '18:00' }, contractType: 'full-time' },
  { employeeId: 'EMP-008', displayName: 'Hugo Larsson', department: 'Support', country: 'DE', workWindow: { start: '07:00', end: '16:00' }, contractType: 'contract' },
  { employeeId: 'EMP-009', displayName: 'Irene Patel', department: 'HR', country: 'IN', workWindow: { start: '09:30', end: '18:30' }, contractType: 'permanent' },
  { employeeId: 'EMP-010', displayName: 'Jean Moreau', department: 'Marketing', country: 'FR', workWindow: { start: '10:00', end: '19:00' }, contractType: 'full-time' },
];

const managerIds = ['MGR-ALPHA', 'MGR-BETA', 'MGR-GAMMA', 'MGR-DELTA', 'MGR-EPSILON'];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateSeedMessages() {
  const rand = seededRandom(42);
  const subjects = [
    'Q3 Planning Review', 'Updated Roster', 'Client Feedback Summary',
    'Sprint Retrospective', 'Policy Reminder', 'Team Standup Notes',
    'Budget Approval Needed', 'Onboarding Schedule', 'Compliance Update',
    'Project Milestone Check',
  ];
  const employees = seedEmployees;
  const messages = [];

  // Generate some in-hours delivered messages
  for (let i = 0; i < 5; i++) {
    const emp = employees[i];
    const hour = 10 + Math.floor(rand() * 6);
    const ts = `2025-06-${String(10 + i).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00Z`;
    messages.push({
      sender: managerIds[i % managerIds.length],
      subject: subjects[i % subjects.length],
      body: `Meeting reminder for ${emp.displayName} regarding ${subjects[i % subjects.length].toLowerCase()}.`,
      employeeId: emp.employeeId,
      timestamp: ts,
      deliverAt: null,
    });
  }

  // Generate some after-hours queued messages
  for (let i = 0; i < 8; i++) {
    const emp = employees[(i + 3) % employees.length];
    const hour = 20 + Math.floor(rand() * 4);
    const nextDayHour = 9 + Math.floor(rand() * 3);
    const ts = `2025-06-${String(12 + Math.floor(i / 2)).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00Z`;
    const nextDay = String(13 + Math.floor(i / 2));
    messages.push({
      sender: managerIds[(i + 2) % managerIds.length],
      subject: subjects[(i + 3) % subjects.length],
      body: `Urgent: ${subjects[(i + 3) % subjects.length].toLowerCase()} - please review before EOD.`,
      employeeId: emp.employeeId,
      timestamp: ts,
      deliverAt: `2025-06-${nextDay}T${String(nextDayHour).padStart(2, '0')}:00:00Z`,
    });
  }

  return messages;
}

const seedMessages = generateSeedMessages();

function computeDashboard() {
  const managersMap = new Map();
  managerIds.forEach((id) => managersMap.set(id, { managerId: id, sent: 0, blocked: 0, complianceRate: 100 }));

  const countriesMap = new Map();
  seedEmployees.forEach((emp) => {
    if (!countriesMap.has(emp.country)) {
      countriesMap.set(emp.country, { countryCode: emp.country, delivered: 0, blocked: 0 });
    }
  });

  let deliveredCount = 0;
  let blockedCount = 0;

  seedMessages.forEach((msg) => {
    const manager = managersMap.get(msg.sender);
    if (!manager) return;

    const emp = seedEmployees.find((e) => e.employeeId === msg.employeeId);
    if (!emp) return;

    if (msg.deliverAt) {
      // Was blocked/queued
      blockedCount++;
      manager.sent++;
      manager.blocked++;
      const cc = countriesMap.get(emp.country);
      if (cc) cc.blocked++;
    } else {
      // Delivered immediately
      deliveredCount++;
      manager.sent++;
      const cc = countriesMap.get(emp.country);
      if (cc) cc.delivered++;
    }
  });

  // Compute compliance rates
  managersMap.forEach((m) => {
    if (m.sent > 0) {
      m.complianceRate = Math.round(((m.sent - m.blocked) / m.sent) * 100);
    }
  });

  return {
    employees: seedEmployees.length,
    queuedMessages: seedMessages.filter((m) => m.deliverAt).length,
    deliveredMessages: deliveredCount,
    blockedMessages: blockedCount,
    managers: Array.from(managersMap.values()),
    countries: Array.from(countriesMap.values()),
  };
}

module.exports = {
  seedEmployees,
  seedMessages,
  managerIds,
  computeDashboard,
};
