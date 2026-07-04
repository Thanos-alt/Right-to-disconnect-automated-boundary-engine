// Policy enforcement engine for the RTD-ABE demo server
// Models: working-hour validation, country-specific rules, and message queuing

const { seedEmployees, seedMessages, managerIds } = require('./types');

/**
 * Country-specific work hour rules
 */
const COUNTRY_RULES = {
  FR: {
    name: 'France',
    maxWorkDayHours: 10,
    restPeriodHours: 11,
    maxWorkWeekHours: 48,
    weekendDays: [0, 6], // Sunday, Saturday
    lunchBreakMin: 30,
    afterHoursPenalty: 'block',
  },
  DE: {
    name: 'Germany',
    maxWorkDayHours: 10,
    restPeriodHours: 11,
    maxWorkWeekHours: 48,
    weekendDays: [0], // Sunday
    lunchBreakMin: 30,
    afterHoursPenalty: 'block',
  },
  IN: {
    name: 'India',
    maxWorkDayHours: 9,
    restPeriodHours: 10,
    maxWorkWeekHours: 48,
    weekendDays: [0], // Sunday
    lunchBreakMin: 60,
    afterHoursPenalty: 'block',
  },
};

/**
 * Check if a given time is within an employee's work window
 */
function isWithinWorkWindow(timeStr, workWindow) {
  const date = new Date(timeStr);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const timeMinutes = hours * 60 + minutes;

  const [startH, startM] = workWindow.start.split(':').map(Number);
  const [endH, endM] = workWindow.end.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
}

/**
 * Check if a date falls on a weekend for a given country
 */
function isWeekend(timeStr, country) {
  const rules = COUNTRY_RULES[country];
  if (!rules) return false;
  const date = new Date(timeStr);
  const day = date.getUTCDay();
  return rules.weekendDays.includes(day);
}

/**
 * Evaluate a message against policy rules
 * Returns: { allowed: boolean, reason: string, countryRule: string }
 */
function evaluateMessage(msg) {
  const employee = seedEmployees.find((e) => e.employeeId === msg.employeeId);
  if (!employee) {
    return { allowed: true, reason: 'Unknown employee - policy bypassed', countryRule: 'N/A' };
  }

  const rules = COUNTRY_RULES[employee.country];
  if (!rules) {
    return { allowed: true, reason: `No rules for country ${employee.country}`, countryRule: 'N/A' };
  }

  // Check weekend
  if (isWeekend(msg.timestamp, employee.country)) {
    return {
      allowed: false,
      reason: `Weekend delivery blocked by ${employee.country} labor law`,
      countryRule: employee.country,
    };
  }

  // Check work window
  if (!isWithinWorkWindow(msg.timestamp, employee.workWindow)) {
    return {
      allowed: false,
      reason: `Outside working hours (${employee.workWindow.start}-${employee.workWindow.end}) for ${employee.country}`,
      countryRule: employee.country,
    };
  }

  return { allowed: true, reason: 'Within policy guidelines', countryRule: employee.country };
}

/**
 * Get compliance statistics for a specific manager
 */
function getManagerCompliance(managerId) {
  const mgrMessages = seedMessages.filter((m) => m.sender === managerId);
  const total = mgrMessages.length;
  const blocked = mgrMessages.filter((m) => m.deliverAt !== null).length;

  return {
    managerId,
    sent: total,
    blocked,
    complianceRate: total > 0 ? Math.round(((total - blocked) / total) * 100) : 100,
  };
}

/**
 * Get country-level enforcement summary
 */
function getCountrySummary() {
  const summary = {};

  seedEmployees.forEach((emp) => {
    if (!summary[emp.country]) {
      const rules = COUNTRY_RULES[emp.country];
      summary[emp.country] = {
        countryCode: emp.country,
        countryName: rules ? rules.name : 'Unknown',
        employeeCount: 0,
        blockedMessages: 0,
        deliveredMessages: 0,
      };
    }
    summary[emp.country].employeeCount++;
  });

  seedMessages.forEach((msg) => {
    const emp = seedEmployees.find((e) => e.employeeId === msg.employeeId);
    if (emp && summary[emp.country]) {
      if (msg.deliverAt) {
        summary[emp.country].blockedMessages++;
      } else {
        summary[emp.country].deliveredMessages++;
      }
    }
  });

  return Object.values(summary);
}

/**
 * Simulate policy evaluation for a new message
 */
function processMessage(sender, subject, body, employeeId) {
  const employee = seedEmployees.find((e) => e.employeeId === employeeId);
  if (!employee) {
    return { accepted: false, error: 'Employee not found' };
  }

  const now = new Date();
  const timestamp = now.toISOString();

  const evaluation = evaluateMessage({
    sender,
    employeeId,
    timestamp,
  });

  if (evaluation.allowed) {
    return {
      accepted: true,
      delivered: true,
      timestamp,
      employee: employee.displayName,
      reason: evaluation.reason,
    };
  }

  // Not allowed - queue for delivery at next shift start
  const nextShiftStart = getNextShiftStart(employee.workWindow, employee.country);
  return {
    accepted: true,
    delivered: false,
    queued: true,
    timestamp,
    deliverAt: nextShiftStart,
    employee: employee.displayName,
    reason: evaluation.reason,
  };
}

/**
 * Calculate the next permitted delivery time
 */
function getNextShiftStart(workWindow, country) {
  const now = new Date();
  const [startH, startM] = workWindow.start.split(':').map(Number);

  // Try tomorrow
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(startH, startM, 0, 0);

  // If tomorrow is a weekend in the target country, skip to Monday
  while (isWeekend(tomorrow.toISOString(), country)) {
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  }

  return tomorrow.toISOString();
}

module.exports = {
  COUNTRY_RULES,
  evaluateMessage,
  isWithinWorkWindow,
  isWeekend,
  getManagerCompliance,
  getCountrySummary,
  processMessage,
};
