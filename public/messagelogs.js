const tableBody = document.querySelector("#tableBody");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const dateFrom = document.querySelector("#dateFrom");
const dateTo = document.querySelector("#dateTo");
const clearFiltersBtn = document.querySelector("#clearFilters");
const downloadBtn = document.querySelector("#downloadExcel");
const countText = document.querySelector("#countText");
const cardsView = document.querySelector("#cardsView");
const toastContainer = document.querySelector("#toastContainer");

let allData = [], filteredData = [];
let currentPage = 1, rowsPerPage = 15;
let sortColumn = '', sortDirection = 'asc';
let selectedRows = new Set();


// ── Theme ──
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') { document.body.setAttribute('data-theme', 'dark'); themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>'; }

themeToggle.addEventListener('click', () => {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? '' : 'dark');
  themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

// ── Toast ──
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = { success: 'fa-check-circle', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' }[type] || 'fa-info-circle';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Shortcuts ──
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); searchInput.focus(); }
  if (e.key === 'Escape') clearAllFilters();
  if (e.key === 'r' && e.ctrlKey) { e.preventDefault(); loadLogs(); }
  if (e.key === 'e' && e.ctrlKey) { e.preventDefault(); downloadExcel(); }
});

// ── Load ──
async function loadLogs() {
  try {
    const res = await fetch("/api/messages/logs");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allData = await res.json();
    applyFilters();
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
  } catch (err) {
    console.warn("API failed, using mock data:", err.message);
    allData = MOCK_DATA;
    applyFilters();
    document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString() + ' (mock)';
    showToast('Using demo data - API unavailable', 'warning');
  }
}

// ── Filter ──
function applyFilters() {
  const search = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
  const toDate = dateTo.value ? new Date(dateTo.value + 'T23:59:59') : null;

  filteredData = allData.filter(row => {
    const matchSearch = !search || (row.name || '').toLowerCase().includes(search) || (row.phone || '').includes(search);
    const matchStatus = !status || row.status === status;
    const rowDate = new Date(row.created_at);
    const matchDate = (!fromDate || rowDate >= fromDate) && (!toDate || rowDate <= toDate);
    return matchSearch && matchStatus && matchDate;
  });

  if (sortColumn) {
    filteredData.sort((a, b) => {
      let va, vb;
      switch(sortColumn) {
        case 'name': va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); break;
        case 'phone': va = a.phone || ''; vb = b.phone || ''; break;
        case 'time': va = new Date(a.created_at); vb = new Date(b.created_at); break;
        case 'status': va = a.status || ''; vb = b.status || ''; break;
      }
      return va < vb ? (sortDirection === 'asc' ? -1 : 1) : va > vb ? (sortDirection === 'asc' ? 1 : -1) : 0;
    });
  }

  currentPage = 1;
  updateChips();
  renderTable();
  renderCards();
  updatePagination();
}

// ── Sort ──
function sortTable(col) {
  sortDirection = (sortColumn === col && sortDirection === 'asc') ? 'desc' : 'asc';
  sortColumn = col;
  document.querySelectorAll('[id^="sort-"]').forEach(i => i.className = 'fa-solid fa-sort');
  const icon = document.getElementById(`sort-${col}`);
  if (icon) icon.className = `fa-solid fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`;
  applyFilters();
}

function updateChips() {
  const chips = document.getElementById('filterChips');
  chips.innerHTML = '';

  const addChip = (text, clearCallback) => {
    const chip = document.createElement('div');
    chip.className = 'chip';

    chip.innerHTML = `
      <span>${text}</span>
      <button type="button">×</button>
    `;

    chip.querySelector('button').addEventListener('click', () => {
      clearCallback();
      applyFilters();
    });

    chips.appendChild(chip);
  };

  if (searchInput.value) {
    addChip(`Search: "${searchInput.value}"`, () => {
      searchInput.value = '';
    });
  }

  if (statusFilter.value) {
    addChip(`Status: ${statusFilter.value}`, () => {
      statusFilter.value = '';
    });
  }

  if (dateFrom.value) {
    addChip(`From: ${dateFrom.value}`, () => {
      dateFrom.value = '';
    });
  }

  if (dateTo.value) {
    addChip(`To: ${dateTo.value}`, () => {
      dateTo.value = '';
    });
  }
}

// ── Pagination ──
function changePage(dir) {
  const total = Math.ceil(filteredData.length / rowsPerPage);
  const np = currentPage + dir;
  if (np >= 1 && np <= total) { currentPage = np; renderTable(); renderCards(); updatePagination(); }
}

function updatePagination() {
  const total = Math.ceil(filteredData.length / rowsPerPage) || 1;
  document.getElementById('currentPage').textContent = currentPage;
  document.getElementById('totalPages').textContent = total;
  document.getElementById('prevBtn').disabled = currentPage === 1;
  document.getElementById('nextBtn').disabled = currentPage === total;
}


function toggleRow(id, checked) {
  checked ? selectedRows.add(id) : selectedRows.delete(id);
  updateBulkBar();
}

function updateBulkBar() {
  const bar = document.getElementById('bulkBar');
  const count = selectedRows.size;
  bar.classList.toggle('show', count > 0);
  document.getElementById('selectedCount').textContent = `${count} selected`;
}

function clearSelection() {
  selectedRows.clear();
  document.querySelectorAll('.select-row').forEach(cb => cb.checked = false);
  document.getElementById('selectAll').checked = false;
  updateBulkBar();
}

function bulkExport() {
  const selected = allData.filter(r => selectedRows.has(String(r.id) || r.phone));
  if (!selected.length) return;
  const ws = XLSX.utils.json_to_sheet(selected.map(r => ({
    Name: r.name || 'Customer', Phone: r.phone, Message: r.message,
    Time: formatDate(r.created_at), Welcome: r.status === 'Repeated' ? 'Already Sent' : r.welcome_sent,
    Brochure: r.status === 'Repeated' ? 'Already Sent' : r.brochure_sent, Status: r.status
  })));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Selected');
  XLSX.writeFile(wb, `selected_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast(`${selected.length} records exported!`);
}

// ── Message Expand ──
function toggleMsg(el) {
  const txt = el.previousElementSibling;
  txt.classList.toggle('expanded');
  el.textContent = txt.classList.contains('expanded') ? 'Show less' : 'Read more';
}

const getMessagePreview = (row) => {
  if (row.message?.trim()) {
    return esc(row.message);
  }

  const fileName = esc(row.file_name || "");

  switch (row.message_type) {
    case "image":
      return `<i class="fa-regular fa-image"></i> ${fileName || "Image"}`;

    case "video":
      return `<i class="fa-solid fa-video"></i> ${fileName || "Video"}`;

    case "audio":
      return `<i class="fa-solid fa-microphone"></i> ${fileName || "Audio"}`;

    case "document":
      return `<i class="fa-regular fa-file-lines"></i> ${fileName || "Document"}`;

    case "sticker":
      return `<i class="fa-regular fa-face-smile"></i> ${fileName || "Sticker"}`;

    case "location":
      return `<i class="fa-solid fa-location-dot"></i> Location`;

    case "contacts":
      return `<i class="fa-regular fa-address-book"></i> Contact`;

    default:
      return "";
  }
};
// ── Render Table ──
function renderTable() {
  const start = (currentPage - 1) * rowsPerPage;
  const page = filteredData.slice(start, start + rowsPerPage);

  if (!page.length) {
    tableBody.innerHTML = `
<tr>
  <td colspan="7" class="no-data">
    <div class="no-data-content">
      <div class="no-data-icon">
        <i class="fa-solid fa-inbox"></i>
      </div>

      <h3>No records found</h3>
      <p>Adjust filters or search</p>

      <button class="btn btn-clear" onclick="clearAllFilters()">
        <i class="fa-solid fa-rotate-left"></i>
        Clear
      </button>
    </div>
  </td>
</tr>
`;return;
  }

  tableBody.innerHTML = page.map((row, i) => {
    const id = String(row.id || row.phone);
    const welcome = row.status === 'Repeated' ? 'Already Sent' : (row.welcome_sent || 'Not Sent');
    const brochure = row.status === 'Repeated' ? 'Already Sent' : (row.brochure_sent || 'Not Sent');
    const preview = getMessagePreview(row);
    const long = row.message && row.message.length > 60 && row.message_type === "text";      //<td class="message-cell"><div class="message-text" id="msg-${start+i}">${esc(row.message)}</div>
    return `<tr>
      <td><i class="fa-solid fa-user" style="color:var(--muted);margin-right:6px"></i>${esc(row.name||'Customer')}</td>
      <td><i class="fa-solid fa-phone" style="color:var(--muted);margin-right:6px"></i>${esc(row.phone)}</td>
      <td class="message-cell"><div class="message-text" id="msg-${start+i}">${preview}</div>${long?`<span class="read-more" onclick="toggleMsg(this)">Read more</span>`:''}</td>
      <td><i class="fa-regular fa-clock" style="color:var(--muted);margin-right:6px"></i>${formatDate(row.created_at)}</td>
      <td>${badge(welcome, 'welcome')}</td>
      <td>${badge(brochure, 'brochure')}</td>
      <td>${leadBadge(row.status)}</td>
    </tr>`;
  }).join('');

  countText.textContent = `${filteredData.length} record${filteredData.length!==1?'s':''}`;
}

// ── Render Cards ──
function renderCards() {
  const start = (currentPage - 1) * rowsPerPage;
  const page = filteredData.slice(start, start + rowsPerPage);

  if (!page.length) {
    cardsView.innerHTML = '<div class="no-data"><i class="fa-solid fa-inbox" style="font-size:48px;color:var(--border)"></i><h3>No records found</h3><p>Adjust filters or search</p></div>';
    return;
  }

  cardsView.innerHTML = page.map(row => {
    const welcome = row.status === 'Repeated' ? 'Already Sent' : (row.welcome_sent || 'Not Sent');
    const brochure = row.status === 'Repeated' ? 'Already Sent' : (row.brochure_sent || 'Not Sent');
    return `<div class="lead-card">
      <div class="card-header"><div><div class="card-name"><i class="fa-solid fa-user" style="color:var(--primary)"></i> ${esc(row.name||'Customer')}</div><div class="card-phone"><i class="fa-solid fa-phone"></i> ${esc(row.phone)}</div></div>${leadBadge(row.status)}</div>
      <div class="card-body"><div class="card-message">${getMessagePreview(row)}</div><div class="card-time"><i class="fa-regular fa-clock"></i> ${formatDate(row.created_at)}</div></div>
      <div class="card-footer"><div class="card-status"><span><i class="fa-solid fa-paper-plane" style="color:var(--primary)"></i> ${welcome}</span><span><i class="fa-solid fa-file-pdf" style="color:var(--danger)"></i> ${brochure}</span></div></div>
    </div>`;
  }).join('');
}

// ── Badges ──
function badge(status, type) {
  const icon = type === 'welcome' ? 'fa-paper-plane' : 'fa-file-pdf';
  if (status === 'Sent') return `<span class="badge badge-sent"><span class="pulse"></span><i class="fa-solid ${icon}"></i> ${esc(status)}</span>`;
  if (status === 'Already Sent') return `<span class="badge badge-already"><i class="fa-solid fa-check-double"></i> ${esc(status)}</span>`;
  return `<span class="badge badge-not-sent"><i class="fa-solid fa-xmark"></i> ${esc(status)}</span>`;
}

function leadBadge(status) {
  if (status === 'New Lead') return `<span class="badge badge-new"><i class="fa-solid fa-star"></i> ${esc(status)}</span>`;
  return `<span class="badge badge-repeated"><i class="fa-solid fa-rotate"></i> ${esc(status)}</span>`;
}

// ── Helpers ──
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
}

// function formatDate(iso) {
//   if (!iso) return "";

//   const date = new Date(iso);

//   const parts = new Intl.DateTimeFormat("en-IN", {
//     timeZone: "Asia/Kolkata",
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   }).formatToParts(date);

//   const get = (type) =>
//     parts.find((p) => p.type === type)?.value || "";

//   return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")} ${get("dayPeriod").toLowerCase()}`;
// };

// ── Clear Filters ──
// function clearAllFilters() {
//   searchInput.value = ''; statusFilter.value = ''; dateFrom.value = ''; dateTo.value = '';
//   applyFilters();
//   showToast('Filters cleared');
// }
function clearAllFilters(showToastMessage = true) {
  // Clear inputs
  searchInput.value = "";
  statusFilter.value = "";
  dateFrom.value = "";
  dateTo.value = "";

  // Reset sorting
  sortColumn = "";
  sortDirection = "asc";

  document
    .querySelectorAll('[id^="sort-"]')
    .forEach(i => i.className = "fa-solid fa-sort");

  // Reset page
  currentPage = 1;

  // Remove chips
  document.getElementById("filterChips").innerHTML = "";

  // Show full data immediately
  filteredData = [...allData];

  renderTable();
  renderCards();
  updatePagination();

  if (showToastMessage) {
    showToast("Filters cleared");
  }
}

// ── Download ──
function downloadExcel() {
  if (!filteredData.length) { showToast('No data to export!', 'warning'); return; }
  const data = filteredData.map(r => ({
    Name: r.name || 'Customer', Phone: r.phone, 'Incoming Message': r.message,
    'Message Time': formatDate(r.created_at), 'Welcome Sent': r.status === 'Repeated' ? 'Already Sent' : r.welcome_sent,
    'Brochure Sent': r.status === 'Repeated' ? 'Already Sent' : r.brochure_sent, Status: r.status
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Logs');
  ws['!cols'] = [{wch:20},{wch:15},{wch:50},{wch:20},{wch:15},{wch:15},{wch:12}];
  XLSX.writeFile(wb, `WhatsApp_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  showToast('Excel downloaded!');
}

// ── Events ──
searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);
dateFrom.addEventListener('change', applyFilters);
dateTo.addEventListener('change', applyFilters);
// clearFiltersBtn.addEventListener('click', clearAllFilters);
clearFiltersBtn.addEventListener("click", () => {
  clearAllFilters();
});
downloadBtn.addEventListener('click', downloadExcel);
// document.getElementById('refreshBtn')?.addEventListener('click', loadLogs);
document.getElementById("refreshBtn")?.addEventListener("click", async () => {
  try {
  clearAllFilters(false);

  await loadLogs();

  clearAllFilters(false);
      showToast("Logs refreshed successfully.", "success");
  } catch (err) {
    showToast("Failed to refresh logs.", "error");
    console.error(err);
  }
});
document.getElementById('logPageBtn')?.addEventListener('click', () => location.href = '/messagelogs');
document.getElementById('chatPageBtn')?.addEventListener('click', () => location.href = '/');

// ── Init ──
loadLogs();


//======================== Update the Incomeing Message logs Without need refresh ===============================
const socket = io();

socket.on("connect", () => {
  // console.log("Socket Connected");
});

socket.on("new-message", (msg) => {
  // console.log("New Message", msg);
  // reload chat automatically
  loadLogs();
});
