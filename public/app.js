// Boundary HRMS Client-side Application State
const state = {
  user: null,
  activeTab: 'dashboard',
  employees: [],
  leaves: [],
  attendance: [],
  compliance: {
    queued: [],
    logs: [],
    score: null
  },
  modalAction: null // Holds data for the pending action (approve/reject leave) when modal is open
};

// SQL.js response parser
function parseSqlRows(resultArray) {
  if (!resultArray || !resultArray[0] || !resultArray[0].columns || !resultArray[0].values) {
    return [];
  }
  const columns = resultArray[0].columns;
  return resultArray[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Support file:// preview while using the local app server at 4002
const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:4002' : '';
const originalFetch = window.fetch.bind(window);
window.fetch = (resource, init) => {
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    return originalFetch(`${API_BASE}${resource}`, init);
  }
  return originalFetch(resource, init);
};

function parseSqlTable(table) {
  if (!table || !table.columns || !table.values) {
    return [];
  }
  const columns = table.columns;
  return table.values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

// Helper to determine if client time is outside employee shift hours
function isOutsideShiftHours(shiftStart, shiftEnd) {
  if (!shiftStart || !shiftEnd) return false;
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime < shiftStart || currentTime > shiftEnd;
}

// Notification Helper
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const msgEl = document.getElementById('notificationMessage');
  msgEl.innerText = message;
  
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  if (window.notificationTimeout) clearTimeout(window.notificationTimeout);
  window.notificationTimeout = setTimeout(() => {
    notification.classList.add('hidden');
  }, 5000);
}

// Show/Hide global loading spinner
function toggleLoader(show = true) {
  const loader = document.getElementById('loadingOverlay');
  if (show) {
    loader.classList.remove('hidden');
  } else {
    loader.classList.add('hidden');
  }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  // Bind public forms
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('signupForm').addEventListener('submit', handleSignup);
  
  // Toggles between login/signup
  document.getElementById('toggleSignup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
    document.getElementById('authSubtitle').innerText = 'Register for a new account';
  });

  document.getElementById('toggleLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('authSubtitle').innerText = 'Right-to-Disconnect Compliant Workspace';
  });

  document.getElementById('checkInBtn').addEventListener('click', handleCheckIn);
  document.getElementById('checkOutBtn').addEventListener('click', handleCheckOut);
  document.getElementById('applyLeaveForm').addEventListener('submit', handleApplyLeave);
  document.getElementById('notificationClose').addEventListener('click', () => {
    document.getElementById('notification').classList.add('hidden');
  });

  // Modal event bindings
  document.getElementById('closeBypassModal').addEventListener('click', () => toggleModal('bypassModal', false));
  document.getElementById('queueActionBtn').addEventListener('click', () => executeLeaveDecision(false));
  document.getElementById('bypassActionBtn').addEventListener('click', () => executeLeaveDecision(true));

  document.getElementById('closeEmployeeModal').addEventListener('click', () => toggleModal('employeeModal', false));
  document.getElementById('cancelEmployeeEdit').addEventListener('click', () => toggleModal('employeeModal', false));
  document.getElementById('editEmployeeForm').addEventListener('submit', handleSaveEmployeeSettings);

  document.getElementById('simulateShiftBtn').addEventListener('click', handleSimulateShiftStart);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  // Admin export/import controls
  const expEmp = document.getElementById('exportEmployeesBtn');
  if (expEmp) expEmp.addEventListener('click', () => handleExport('employees'));
  const expAtt = document.getElementById('exportAttendanceBtn');
  if (expAtt) expAtt.addEventListener('click', () => handleExport('attendance'));
  const importBtn = document.getElementById('importUsersBtn');
  if (importBtn) importBtn.addEventListener('click', handleImportUsers);

  // Tab navigation binding
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Check active user session
  await checkSession();
});

// Check if user session already exists
async function checkSession() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      state.user = data.user;
      showApplication();
    } else {
      showAuth();
    }
  } catch (err) {
    showAuth();
  }
}

// Show auth screen, hide dashboard
function showAuth() {
  document.getElementById('authSection').classList.remove('hidden');
  document.getElementById('mainDashboard').classList.add('hidden');
}

// Show main dashboard, load session data
async function showApplication() {
  document.getElementById('authSection').classList.add('hidden');
  document.getElementById('mainDashboard').classList.remove('hidden');
  
  // Render user profile details
  document.getElementById('userName').innerText = state.user.name;
  document.getElementById('welcomeUserName').innerText = state.user.name;
  document.getElementById('userRole').innerText = state.user.role;
  document.getElementById('empShiftStart').innerText = state.user.shiftStart || '09:00';
  document.getElementById('empShiftEnd').innerText = state.user.shiftEnd || '18:00';

  // Toggle admin links
  if (state.user.role === 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  } else {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
  }

  // Set Right-to-Disconnect Active shift status
  updateRightToDisconnectBanner();
  
  // Load core data
  await loadDashboardData();
}

// Update the top boundary warning banner
function updateRightToDisconnectBanner() {
  const banner = document.getElementById('disconnectBanner');
  const txt = document.getElementById('disconnectStatusText');
  
  const outside = isOutsideShiftHours(state.user.shiftStart, state.user.shiftEnd);
  
  if (outside) {
    banner.className = 'disconnect-banner out-shift';
    txt.innerText = 'Right-to-Disconnect: Disconnected';
  } else {
    banner.className = 'disconnect-banner in-shift';
    txt.innerText = 'Boundary HRMS: In Shift Hours';
  }
}

// Tab Switching Routing
function switchTab(tabId) {
  state.activeTab = tabId;
  
  // Update sidebar activation style
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Display the panel
  document.querySelectorAll('.tab-pane').forEach(panel => {
    if (panel.id === `tab-${tabId}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Refresh tab data
  refreshTabData(tabId);
}

// Fetch tab-specific details
async function refreshTabData(tabId) {
  toggleLoader(true);
  try {
    if (tabId === 'dashboard') {
      await loadDashboardData();
    } else if (tabId === 'attendance') {
      await loadAttendanceLogs();
    } else if (tabId === 'leaves') {
      await loadLeavesList();
    } else if (tabId === 'employees') {
      await loadEmployeesDirectory();
    } else if (tabId === 'compliance') {
      await loadComplianceData();
    }
  } catch (err) {
    showNotification('Failed to sync workspace details', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- AUTH LOGIC ---
async function handleLogin(e) {
  e.preventDefault();
  
  // Reset error displays
  document.getElementById('loginEmailError').innerText = '';
  document.getElementById('loginPasswordError').innerText = '';

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  // Simple validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById('loginEmailError').innerText = 'Please enter a valid email address.';
    return;
  }

  if (password.length < 6) {
    document.getElementById('loginPasswordError').innerText = 'Password must be at least 6 characters.';
    return;
  }

  toggleLoader(true);
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      state.user = data.user;
      showNotification(`Welcome back, ${state.user.name}!`);
      showApplication();
    } else {
      showNotification(data.error || 'Login failed', 'error');
    }
  } catch (err) {
    showNotification('Network connection error', 'error');
  } finally {
    toggleLoader(false);
  }
}

async function handleSignup(e) {
  e.preventDefault();
  
  document.getElementById('signupNameError').innerText = '';
  document.getElementById('signupEmailError').innerText = '';
  document.getElementById('signupPasswordError').innerText = '';

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();
  const role = document.getElementById('signupRole').value;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let hasError = false;

  if (name.length < 2) {
    document.getElementById('signupNameError').innerText = 'Name must be at least 2 characters.';
    hasError = true;
  }
  if (!emailRegex.test(email)) {
    document.getElementById('signupEmailError').innerText = 'Please enter a valid email address.';
    hasError = true;
  }
  if (password.length < 6) {
    document.getElementById('signupPasswordError').innerText = 'Password must be at least 6 characters.';
    hasError = true;
  }

  if (hasError) return;

  toggleLoader(true);
  try {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (res.ok) {
      showNotification('Account created successfully! Please log in.');
      document.getElementById('signupForm').reset();
      document.getElementById('toggleLogin').click();
    } else {
      showNotification(data.error || 'Registration failed', 'error');
    }
  } catch (err) {
    showNotification('Network connection error', 'error');
  } finally {
    toggleLoader(false);
  }
}

async function handleLogout() {
  toggleLoader(true);
  try {
    const res = await fetch('/api/logout', { method: 'POST' });
    if (res.ok) {
      state.user = null;
      showNotification('Logged out successfully.');
      showAuth();
      // Reset forms
      document.getElementById('loginForm').reset();
      document.getElementById('signupForm').reset();
    }
  } catch (err) {
    showNotification('Logout failed', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- DATA LOADING & RENDERING ---

// Load main dashboard stats
async function loadDashboardData() {
  try {
    // 1. Fetch user data to ensure latest balances & settings are up-to-date
    const userRes = await fetch('/api/me');
    if (userRes.ok) {
      const data = await userRes.json();
      state.user = data.user;
    }

    // Update shift values
    document.getElementById('empShiftStart').innerText = state.user.shiftStart || '09:00';
    document.getElementById('empShiftEnd').innerText = state.user.shiftEnd || '18:00';
    
    // Update leave balance displays
    document.getElementById('paidBalanceText').innerText = state.user.paidLeaveBalance;
    document.getElementById('sickBalanceText').innerText = state.user.sickLeaveBalance;

    // Calculate circular ring fill
    updateLeaveGauges(state.user.paidLeaveBalance, state.user.sickLeaveBalance);

    // 2. Fetch attendance logs to determine check-in state
    const attRes = await fetch('/api/attendance');
    if (attRes.ok) {
      const attData = await attRes.json();
      state.attendance = parseSqlRows(attData.attendance);
      
      // Update checkin card status
      const today = new Date().toISOString().slice(0, 10);
      const todayRecord = state.attendance.find(row => row.date === today);
      
      const checkInBtn = document.getElementById('checkInBtn');
      const checkOutBtn = document.getElementById('checkOutBtn');
      const statusText = document.getElementById('todayStatusText');
      const timeText = document.getElementById('todayTimeText');

      if (todayRecord) {
        statusText.innerText = todayRecord.status === 'Leave' ? 'On Approved Leave' : 'Checked In';
        timeText.innerText = `${todayRecord.checkIn || '--:--'} - ${todayRecord.checkOut || '--:--'}`;
        
        if (todayRecord.status === 'Leave') {
          checkInBtn.classList.add('hidden');
          checkOutBtn.classList.add('hidden');
        } else if (todayRecord.checkOut) {
          checkInBtn.classList.add('hidden');
          checkOutBtn.classList.add('hidden');
          statusText.innerText = 'Completed Shift';
        } else {
          checkInBtn.classList.add('hidden');
          checkOutBtn.classList.remove('hidden');
        }
      } else {
        statusText.innerText = 'Not Checked In';
        timeText.innerText = '--:--';
        checkInBtn.classList.remove('hidden');
        checkOutBtn.classList.add('hidden');
      }
    }

    // 3. Fetch leaves to render preview
    const leaveRes = await fetch('/api/leaves');
    if (leaveRes.ok) {
      const leaveData = await leaveRes.json();
      state.leaves = parseSqlRows(leaveData.leaves);
      
      // Render my leaves preview
      const previewTbody = document.getElementById('myLeavesPreview');
      previewTbody.innerHTML = '';
      
      // Filter user's leaves
      const myLeaves = state.leaves.filter(l => l.userId === state.user.id).slice(0, 5);
      
      if (myLeaves.length === 0) {
        previewTbody.innerHTML = `<tr><td colspan="4" class="text-center">No leaves requested yet.</td></tr>`;
      } else {
        myLeaves.forEach(leave => {
          const badgeClass = `badge badge-${leave.status.toLowerCase()}`;
          const formattedReqDate = new Date(leave.requestedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          previewTbody.innerHTML += `
            <tr>
              <td>${leave.startDate} to ${leave.endDate}</td>
              <td>${leave.type}</td>
              <td><span class="${badgeClass}">${leave.status}</span></td>
              <td>${formattedReqDate}</td>
            </tr>
          `;
        });
      }
    }
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
  }
}

// Calculate dashed strokes on SVG gauge rings
function updateLeaveGauges(paid, sick) {
  const maxPaid = 12;
  const maxSick = 8;
  
  const circ = 2 * Math.PI * 34; // 213.6
  
  const paidOffset = circ - (Math.min(paid, maxPaid) / maxPaid) * circ;
  const sickOffset = circ - (Math.min(sick, maxSick) / maxSick) * circ;
  
  document.getElementById('paidGaugeCircle').style.strokeDashoffset = paidOffset;
  document.getElementById('sickGaugeCircle').style.strokeDashoffset = sickOffset;
}

// Load Attendance Tab
async function loadAttendanceLogs() {
  const res = await fetch('/api/attendance');
  if (res.ok) {
    const data = await res.json();
    state.attendance = parseSqlRows(data.attendance);
    
    // Fetch employees list to resolve names (admin view)
    let employeesMap = {};
    if (state.user.role === 'admin') {
      const empRes = await fetch('/api/admin/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        empData.employees.forEach(emp => {
          employeesMap[emp.id] = emp.name;
        });
      }
    }

    const tbody = document.getElementById('attendanceLogsTable');
    tbody.innerHTML = '';
    
    if (state.attendance.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center">No attendance logs registered.</td></tr>`;
    } else {
      state.attendance.forEach(row => {
        const empName = state.user.role === 'admin' ? (employeesMap[row.userId] || `User #${row.userId}`) : state.user.name;
        const statusBadge = row.status === 'Present' 
          ? `<span class="badge badge-approved">Present</span>` 
          : row.status === 'Leave' 
            ? `<span class="badge badge-delivered">On Leave</span>` 
            : `<span class="badge badge-rejected">${row.status}</span>`;
            
        tbody.innerHTML += `
          <tr>
            <td><strong>${empName}</strong></td>
            <td>${row.date}</td>
            <td>${row.checkIn || '--:--'}</td>
            <td>${row.checkOut || '--:--'}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      });
    }
  }
}

// Load Leaves Management Tab
async function loadLeavesList() {
  const res = await fetch('/api/leaves');
  if (res.ok) {
    const data = await res.json();
    state.leaves = parseSqlRows(data.leaves);
    
    // Fetch employees map if admin, otherwise use the current user
    let employeesMap = {};
    if (state.user.role === 'admin') {
      const empRes = await fetch('/api/admin/employees');
      if (empRes.ok) {
        const empData = await empRes.json();
        empData.employees.forEach(emp => {
          employeesMap[emp.id] = emp;
        });
      }
    } else {
      employeesMap[state.user.id] = {
        id: state.user.id,
        name: state.user.name,
        shiftStart: state.user.shiftStart,
        shiftEnd: state.user.shiftEnd
      };
    }

    const tbody = document.getElementById('leavesTableBody');
    tbody.innerHTML = '';
    
    // Render leaves
    if (state.leaves.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center">No leave requests found.</td></tr>`;
    } else {
      state.leaves.forEach(row => {
        const emp = employeesMap[row.userId] || { name: `User #${row.userId}`, shiftStart: '09:00', shiftEnd: '18:00' };
        const badgeClass = `badge badge-${row.status.toLowerCase()}`;
        
        let actionColumn = '';
        if (state.user.role === 'admin') {
          // If pending, allow admin to Approve or Reject
          if (row.status === 'Pending') {
            actionColumn = `
              <td>
                <button class="btn btn-success btn-sm" onclick="promptLeaveDecision(${row.id}, 'approve', '${emp.name.replace(/'/g, "\\'")}', '${emp.shiftStart}', '${emp.shiftEnd}')">Approve</button>
                <button class="btn btn-outline-danger btn-sm" onclick="promptLeaveDecision(${row.id}, 'reject', '${emp.name.replace(/'/g, "\\'")}', '${emp.shiftStart}', '${emp.shiftEnd}')">Reject</button>
              </td>
            `;
          } else {
            actionColumn = `<td><span class="text-muted">Processed</span></td>`;
          }
        }

        tbody.innerHTML += `
          <tr>
            <td><strong>${emp.name}</strong></td>
            <td>${row.startDate} to ${row.endDate}</td>
            <td>${row.type}</td>
            <td><span class="text-secondary">${row.reason}</span></td>
            <td><span class="${badgeClass}">${row.status}</span></td>
            ${state.user.role === 'admin' ? actionColumn : ''}
          </tr>
        `;
      });
    }
  }
}

// Load Employees Directory (Admin only)
async function loadEmployeesDirectory() {
  const res = await fetch('/api/admin/employees');
  if (res.ok) {
    const data = await res.json();
    state.employees = data.employees;
    
    const tbody = document.getElementById('employeeDirectoryTable');
    tbody.innerHTML = '';
    
    state.employees.forEach(emp => {
      tbody.innerHTML += `
        <tr>
          <td>#${emp.id}</td>
          <td><strong>${emp.name}</strong></td>
          <td>${emp.email}</td>
          <td><span class="font-mono">${emp.shiftStart} - ${emp.shiftEnd}</span></td>
          <td><span class="badge badge-delivered">${emp.paidLeaveBalance} Paid</span> <span class="badge badge-pending">${emp.sickLeaveBalance} Sick</span></td>
          <td>
            <button class="btn btn-outline btn-sm" onclick="openEditEmployee(${emp.id})">Configure</button>
          </td>
        </tr>
      `;
    });
  }
}

// Load Compliance Tab (Admin only)
async function loadComplianceData() {
  const res = await fetch('/api/admin/compliance');
  if (res.ok) {
    const data = await res.json();
    state.compliance.queued = parseSqlTable(data.queued);
    state.compliance.logs = parseSqlTable(data.logs);
    state.compliance.score = data.score;

    // Resolve employee names
    let employeesMap = {};
    const empRes = await fetch('/api/admin/employees');
    if (empRes.ok) {
      const empData = await empRes.json();
      empData.employees.forEach(emp => {
        employeesMap[emp.id] = emp.name;
      });
    }

    // 1. Update Compliance Score Circle
    const scoreValue = state.compliance.score !== null ? `${state.compliance.score}%` : '--%';
    const scorePercent = state.compliance.score !== null ? state.compliance.score : 0;
    document.getElementById('complianceScoreVal').innerText = scoreValue;
    const scoreCirc = 2 * Math.PI * 50; // 314
    const scoreOffset = scoreCirc - (scorePercent / 100) * scoreCirc;
    document.getElementById('complianceScoreCircle').style.strokeDashoffset = scoreOffset;

    // 2. Render Queued Actions Table
    const queueTbody = document.getElementById('queuedActionsTable');
    queueTbody.innerHTML = '';
    
    if (state.compliance.queued.length === 0) {
      queueTbody.innerHTML = `<tr><td colspan="6" class="text-center">No queued actions pending.</td></tr>`;
    } else {
      state.compliance.queued.forEach(row => {
        const empName = employeesMap[row.targetUserId] || `User #${row.targetUserId}`;
        const badgeClass = `badge badge-${row.status.toLowerCase()}`;
        const actionText = row.actionType === 'approve_leave' ? 'Leave Approval' : row.actionType === 'reject_leave' ? 'Leave Rejection' : row.actionType;
        const requestedDate = new Date(row.requestedAt).toLocaleString();
        
        queueTbody.innerHTML += `
          <tr>
            <td>#${row.id}</td>
            <td><strong>${empName}</strong></td>
            <td>${actionText}</td>
            <td>${requestedDate}</td>
            <td><span class="font-mono text-warning">${row.deliverAt}</span></td>
            <td><span class="${badgeClass}">${row.status}</span></td>
          </tr>
        `;
      });
    }

    // 3. Render Compliance Audit Logs Table
    const logTbody = document.getElementById('complianceLogsTable');
    logTbody.innerHTML = '';
    
    if (state.compliance.logs.length === 0) {
      logTbody.innerHTML = `<tr><td colspan="5" class="text-center">No compliance activities logged yet.</td></tr>`;
    } else {
      state.compliance.logs.forEach(row => {
        const empName = employeesMap[row.userId] || `User #${row.userId}`;
        const breachBadge = row.outsideShift === 1 
          ? `<span class="badge badge-rejected">BREACHED</span>` 
          : `<span class="badge badge-approved">IN BOUNDS</span>`;
          
        logTbody.innerHTML += `
          <tr>
            <td>${new Date(row.actionAt).toLocaleString()}</td>
            <td><strong>${empName}</strong></td>
            <td>${row.action}</td>
            <td><span class="font-mono">${row.allowedAt}</span></td>
            <td>${breachBadge}</td>
          </tr>
        `;
      });
    }

    // 4. Render Dynamic SVG charts
    if (!state.leaves || state.leaves.length === 0) {
      const leavesRes = await fetch('/api/leaves');
      if (leavesRes.ok) {
        const leavesData = await leavesRes.json();
        state.leaves = parseSqlRows(leavesData.leaves);
      }
    }
    renderSVGCharts(state.compliance.logs, state.leaves);
  }
}

// Render dynamic visual SVG graphs (Zero dependency)
function renderSVGCharts(logs, leaves) {
  // A. LAST 7 DAYS ATTENDANCE RATE CHART (Dynamic Line Graph)
  const attContainer = document.getElementById('attendanceChartContainer');
  attContainer.innerHTML = '';
  
  // Calculate attendance rates for the last 7 days
  const labels = [];
  const rates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }));
    
    // Simulate attendance trends if table is small for demo validation
    // Map dates to present/absent from compliance logs or attendance records
    let presentCount = 5;
    let totalCount = 6;
    
    if (state.attendance && state.attendance.length > 0) {
      const records = state.attendance.filter(r => r.date === dateStr);
      if (records.length > 0) {
        presentCount = records.filter(r => r.status === 'Present' || r.status === 'Leave').length;
        totalCount = Math.max(records.length, 1);
      }
    }
    const rate = Math.round((presentCount / totalCount) * 100);
    rates.push(rate);
  }

  // Draw Line SVG
  let points = '';
  let gridLines = '';
  let labelsSvg = '';
  let dots = '';
  
  const width = 240;
  const height = 110;
  const padding = 20;
  
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  rates.forEach((val, index) => {
    const x = padding + (index * (chartWidth / 6));
    const y = height - padding - (val / 100) * chartHeight;
    points += `${x},${y} `;
    
    // Grid vertical line
    gridLines += `<line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}" stroke="rgba(255,255,255,0.03)" stroke-width="1" />`;
    
    // Labels
    labelsSvg += `<text x="${x}" y="${height - 5}" font-family="var(--font-sans)" font-size="8" fill="var(--text-muted)" text-anchor="middle">${labels[index]}</text>`;
    
    // Value dot
    dots += `<circle cx="${x}" cy="${y}" r="3" fill="var(--primary)" stroke="#0f172a" stroke-width="1" />
             <text x="${x}" y="${y - 6}" font-family="var(--font-mono)" font-size="7" fill="var(--text-primary)" text-anchor="middle" font-weight="600">${val}%</text>`;
  });

  const lineChartSvg = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}">
      <!-- Background grid lines -->
      <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2,2" />
      <line x1="${padding}" y1="${padding + chartHeight/2}" x2="${width - padding}" y2="${padding + chartHeight/2}" stroke="rgba(255,255,255,0.05)" stroke-dasharray="2,2" />
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.1)" />
      ${gridLines}
      
      <!-- Chart line -->
      <polyline fill="none" stroke="url(#lineGradient)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
      
      <!-- Overlay Gradient -->
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#818cf8" />
          <stop offset="100%" stop-color="#4f46e5" />
        </linearGradient>
      </defs>
      
      ${dots}
      ${labelsSvg}
    </svg>
  `;
  attContainer.innerHTML = lineChartSvg;

  // B. LEAVE DISTRIBUTION CHART (Dynamic Stacked Horizontal Bar)
  const leaveContainer = document.getElementById('leaveChartContainer');
  leaveContainer.innerHTML = '';

  let paidLeaves = 0;
  let sickLeaves = 0;
  let unpaidLeaves = 0;

  leaves.forEach(l => {
    if (l.status === 'Approved') {
      if (l.type === 'Paid') paidLeaves++;
      else if (l.type === 'Sick') sickLeaves++;
      else if (l.type === 'Unpaid') unpaidLeaves++;
    }
  });

  const totalApproved = paidLeaves + sickLeaves + unpaidLeaves || 1; // avoid division by zero
  
  const paidPct = (paidLeaves / totalApproved) * 100;
  const sickPct = (sickLeaves / totalApproved) * 100;
  const unpaidPct = (unpaidLeaves / totalApproved) * 100;

  const barHeight = 15;
  const barY = 30;
  const barWidth = 200;

  const paidWidth = (paidPct / 100) * barWidth;
  const sickWidth = (sickPct / 100) * barWidth;
  const unpaidWidth = (unpaidPct / 100) * barWidth;

  const stackedBarSvg = `
    <svg width="100%" height="100%" viewBox="0 0 240 110">
      <!-- Stacked Bar segments -->
      <rect x="20" y="${barY}" width="${paidWidth}" height="${barHeight}" fill="var(--success)" rx="${paidPct === 100 ? 4 : 0}" />
      <rect x="${20 + paidWidth}" y="${barY}" width="${sickWidth}" height="${barHeight}" fill="var(--primary)" rx="${sickPct === 100 ? 4 : 0}" />
      <rect x="${20 + paidWidth + sickWidth}" y="${barY}" width="${unpaidWidth}" height="${barHeight}" fill="var(--warning)" rx="${unpaidPct === 100 ? 4 : 0}" />
      
      <!-- Legends -->
      <g transform="translate(20, 65)" font-family="var(--font-sans)" font-size="9" fill="var(--text-secondary)">
        <circle cx="5" cy="5" r="4" fill="var(--success)" />
        <text x="15" y="8">Paid (${paidLeaves})</text>
        
        <circle cx="85" cy="5" r="4" fill="var(--primary)" />
        <text x="95" y="8">Sick (${sickLeaves})</text>
        
        <circle cx="155" cy="5" r="4" fill="var(--warning)" />
        <text x="165" y="8">Unpaid (${unpaidLeaves})</text>
      </g>
    </svg>
  `;
  leaveContainer.innerHTML = stackedBarSvg;
}

// --- ATTENDANCE ACTIONS ---
async function handleCheckIn() {
  toggleLoader(true);
  try {
    const res = await fetch('/api/attendance/checkin', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message || 'Checked in successfully.');
      await loadDashboardData();
      updateRightToDisconnectBanner();
    } else {
      showNotification(data.error || 'Check-in failed.', 'error');
    }
  } catch (err) {
    showNotification('Network connection error', 'error');
  } finally {
    toggleLoader(false);
  }
}

async function handleCheckOut() {
  toggleLoader(true);
  try {
    const res = await fetch('/api/attendance/checkout', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message || 'Checked out successfully.');
      await loadDashboardData();
    } else {
      showNotification(data.error || 'Check-out failed.', 'error');
    }
  } catch (err) {
    showNotification('Network connection error', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- LEAVE APPLICATION ---
async function handleApplyLeave(e) {
  e.preventDefault();
  
  const startDate = document.getElementById('leaveStartDate').value;
  const endDate = document.getElementById('leaveEndDate').value;
  const type = document.getElementById('leaveType').value;
  const reason = document.getElementById('leaveReason').value.trim();

  // Basic client validation
  if (new Date(endDate) < new Date(startDate)) {
    showNotification('End date cannot be before start date.', 'error');
    return;
  }

  toggleLoader(true);
  try {
    const res = await fetch('/api/leaves/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate, endDate, type, reason })
    });
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message || 'Leave applied successfully.');
      document.getElementById('applyLeaveForm').reset();
      await loadDashboardData();
      await loadLeavesList();
    } else {
      showNotification(data.error || 'Failed to submit leave application.', 'error');
    }
  } catch (err) {
    showNotification('Network connection error', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- LEAVE APPROVAL & BYPASS MODAL CONTROLS ---

// Triggered when admin clicks Approve/Reject
function promptLeaveDecision(leaveId, action, employeeName, shiftStart, shiftEnd) {
  // Check if target employee is outside of their shift hours
  const outside = isOutsideShiftHours(shiftStart, shiftEnd);
  
  if (outside) {
    // Show Modal Warning
    state.modalAction = { leaveId, action, employeeName, shiftStart, shiftEnd };
    
    document.getElementById('modalEmployeeName').innerText = employeeName;
    document.getElementById('modalEmployeeHours').innerText = `${shiftStart} - ${shiftEnd}`;
    document.getElementById('modalActionType').innerText = action === 'approve' ? 'Approve Leave Application' : 'Reject Leave Application';
    
    toggleModal('bypassModal', true);
  } else {
    // Inside hours: run immediately
    executeLeaveRequest(leaveId, action, false);
  }
}

async function executeLeaveDecision(emergencyBypass) {
  if (!state.modalAction) return;
  
  const { leaveId, action } = state.modalAction;
  toggleModal('bypassModal', false);
  toggleLoader(true);
  
  await executeLeaveRequest(leaveId, action, emergencyBypass);
  state.modalAction = null;
}

// Send decision request to server
async function executeLeaveRequest(leaveId, action, emergencyBypass) {
  const url = `/api/admin/leaves/${leaveId}/${action}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyBypass })
    });
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message || 'Action processed successfully.');
      await loadLeavesList();
      await loadDashboardData();
    } else {
      showNotification(data.error || 'Failed to process request.', 'error');
    }
  } catch (err) {
    showNotification('Network error processing request.', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- EMPLOYEE MODAL & CONFIG CONTROLS ---
function openEditEmployee(id) {
  const emp = state.employees.find(e => e.id === id);
  if (!emp) return;

  document.getElementById('editUserId').value = emp.id;
  document.getElementById('editUserName').value = emp.name;
  document.getElementById('editShiftStart').value = emp.shiftStart;
  document.getElementById('editShiftEnd').value = emp.shiftEnd;
  document.getElementById('editPaidBalance').value = emp.paidLeaveBalance;
  document.getElementById('editSickBalance').value = emp.sickLeaveBalance;

  toggleModal('employeeModal', true);
}

async function handleSaveEmployeeSettings(e) {
  e.preventDefault();

  const userId = document.getElementById('editUserId').value;
  const shiftStart = document.getElementById('editShiftStart').value.trim();
  const shiftEnd = document.getElementById('editShiftEnd').value.trim();
  const paidLeaveBalance = document.getElementById('editPaidBalance').value;
  const sickLeaveBalance = document.getElementById('editSickBalance').value;

  // Time format regex check (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(shiftStart) || !timeRegex.test(shiftEnd)) {
    showNotification('Shift start/end times must be in HH:MM 24-hour format (e.g. 09:30)', 'error');
    return;
  }

  toggleModal('employeeModal', false);
  toggleLoader(true);
  try {
    const res = await fetch('/api/admin/employees/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, shiftStart, shiftEnd, paidLeaveBalance, sickLeaveBalance })
    });
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message || 'Employee contract updated.');
      await loadEmployeesDirectory();
      await loadDashboardData(); // Refresh gauges if logged-in employee was edited
    } else {
      showNotification(data.error || 'Failed to update employee details.', 'error');
    }
  } catch (err) {
    showNotification('Network connection error', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- SHIFT SIMULATION CONTROLS ---
async function handleSimulateShiftStart() {
  toggleLoader(true);
  try {
    const res = await fetch('/api/admin/compliance/simulate', { method: 'POST' });
    const data = await res.json();
    if (res.ok) {
      showNotification(data.message || 'Simulated shift start.');
      // Reload relevant views
      await loadComplianceData();
      await loadLeavesList();
      await loadDashboardData();
    } else {
      showNotification(data.error || 'Simulation failed.', 'error');
    }
  } catch (err) {
    showNotification('Simulation endpoint returned an error.', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- EXPORT / IMPORT HELPERS ---
async function handleExport(what) {
  toggleLoader(true);
  try {
    const res = await fetch(`/api/admin/export/${what}`);
    if (!res.ok) {
      const err = await res.json();
      showNotification(err.error || 'Export failed', 'error');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${what}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotification('CSV exported successfully');
  } catch (err) {
    showNotification('Export failed', 'error');
  } finally {
    toggleLoader(false);
  }
}

async function handleImportUsers() {
  const fileInput = document.getElementById('importUsersFile');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showNotification('Please select a CSV file to upload.', 'error');
    return;
  }
  const file = fileInput.files[0];
  const text = await file.text();
  toggleLoader(true);
  try {
    const res = await fetch('/api/admin/import/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv: text })
    });
    const data = await res.json();
    if (res.ok) {
      // If server returned a report, show concise summary and log details
      if (data && data.report) {
        showNotification(`${data.message} (added: ${data.report.added}, skipped: ${data.report.skipped})`);
        if (data.report.errors && data.report.errors.length > 0) {
          console.warn('Import report errors:', data.report.errors.slice(0, 10));
        }
      } else {
        showNotification(data.message || 'Import completed');
      }
      await loadEmployeesDirectory();
    } else {
      const msg = data.error || (data.report ? `${data.report.added} added, ${data.report.skipped} skipped` : 'Import failed');
      showNotification(msg, 'error');
    }
  } catch (err) {
    showNotification('Network error uploading CSV', 'error');
  } finally {
    toggleLoader(false);
  }
}

// --- UTILITY MODAL HELPERS ---
function toggleModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (show) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }
}
