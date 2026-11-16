(function () {
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'customers', label: 'Customer Management', icon: 'users' },
    { id: 'meters', label: 'Meter Management', icon: 'gauge' },
    { id: 'readings', label: 'Meter Readings', icon: 'clipboard-list' },
    { id: 'billgen', label: 'Bill Generation', icon: 'calculator' },
    { id: 'bills', label: 'Bill Management', icon: 'receipt' },
    { id: 'payments', label: 'Payment Management', icon: 'credit-card' },
    { id: 'reports', label: 'Reports & Analytics', icon: 'bar-chart-3' },
    { id: 'tariffs', label: 'Tariff Management', icon: 'sliders-horizontal' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'profile', label: 'Admin Profile', icon: 'user-cog' }
  ];

  async function renderAdminPortal() {
    const { state, toggleTheme, hydrateIcons } = window.AquaState;
    const { esc } = window.AquaAPI;
    const root = document.getElementById('app-root');

    const activeTab = state.portalTab || 'dashboard';
    const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];
    const initials = (state.user.name || 'AD').split(' ').map((s) => s.charAt(0)).join('').slice(0, 2).toUpperCase();

    root.innerHTML =
      '<div class="portal-outer">' +
        '<div class="portal-shell admin-theme">' +
          '<div class="sidebar-backdrop ' + (state.sidebarOpen ? 'open' : '') + '" id="adm-backdrop"></div>' +
          '<aside class="sidebar admin-sidebar ' + (state.sidebarOpen ? 'open' : '') + '" id="adm-sidebar">' +
            '<div>' +
              '<div class="sidebar-brand">' +
                '<div class="sidebar-brand-left">' +
                  '<span class="frosted-droplet" style="width:38px;height:38px;"><i data-lucide="droplets"></i></span>' +
                  '<span class="sidebar-wordmark">AQUABILL</span>' +
                '</div>' +
                '<span class="sidebar-role-tag">Admin</span>' +
              '</div>' +
              '<nav class="sidebar-nav" aria-label="Admin Navigation">' +
                NAV_ITEMS.map((item) =>
                  '<button type="button" class="nav-item ' + (activeTab === item.id ? 'active' : '') + '" data-atab="' + item.id + '">' +
                    '<span class="nav-item-left"><i data-lucide="' + item.icon + '"></i><span>' + item.label + '</span></span>' +
                  '</button>'
                ).join('') +
              '</nav>' +
            '</div>' +
            '<div class="sidebar-bottom">' +
              '<div class="sidebar-status-box">' +
                '<div style="font-weight:700;margin-bottom:2px;">' + esc(state.user.name) + '</div>' +
                '<div style="opacity:0.82;font-size:0.72rem;word-break:break-all;">' + esc(state.user.email) + '</div>' +
              '</div>' +
              '<button type="button" class="sidebar-logout-btn" id="adm-logout-btn">' +
                '<i data-lucide="log-out"></i>' +
                '<span>Logout</span>' +
              '</button>' +
            '</div>' +
          '</aside>' +
          '<div class="portal-main">' +
            '<header class="topbar">' +
              '<div class="topbar-left">' +
                '<button type="button" class="icon-btn mobile-menu-btn" id="adm-menu-btn" aria-label="Menu"><i data-lucide="menu"></i></button>' +
                '<div>' +
                  '<h1 class="topbar-title">' + (activeTab === 'dashboard' ? 'Administrator Dashboard' : esc(currentNav.label)) + '</h1>' +
                  '<div class="topbar-sub">' + (activeTab === 'dashboard' ? 'Welcome back, Administrator.' : 'AquaBill Utility Administration Console') + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="topbar-right">' +
                '<div class="search-pill-wrap">' +
                  '<i data-lucide="search"></i>' +
                  '<input type="search" class="search-pill" id="adm-global-search" placeholder="Search customers, meters, bills..." aria-label="Global admin search" />' +
                '</div>' +
                '<button type="button" class="icon-btn" id="adm-notif-btn" title="Notifications" aria-label="Notifications"><i data-lucide="bell"></i></button>' +
                '<button type="button" class="icon-btn" id="adm-theme-btn" title="Toggle Light/Dark Mode" aria-label="Toggle theme"><i data-lucide="' + (state.theme === 'dark' ? 'sun' : 'moon') + '"></i></button>' +
                '<button type="button" class="btn btn-primary btn-sm" id="adm-quick-reading"><i data-lucide="plus"></i> Record Reading</button>' +
                '<button type="button" class="avatar-pill" id="adm-avatar-btn" title="Admin Profile">' +
                  '<span class="avatar-circle" style="background:linear-gradient(135deg,#06B6D4,#0B1F3A);">' + esc(initials) + '</span>' +
                '</button>' +
              '</div>' +
            '</header>' +
            '<main class="portal-content" id="adm-view-body"><div class="state-box"><div class="spinner" style="margin:0 auto;"></div><p>Loading console...</p></div></main>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.querySelectorAll('[data-atab]').forEach((btn) => {
      btn.onclick = () => {
        state.portalTab = btn.getAttribute('data-atab');
        state.sidebarOpen = false;
        renderAdminPortal();
      };
    });

    document.getElementById('adm-logout-btn').onclick = () => window.AquaApp.logout();
    const menuBtn = document.getElementById('adm-menu-btn');
    const backdrop = document.getElementById('adm-backdrop');
    if (menuBtn) menuBtn.onclick = () => { state.sidebarOpen = true; renderAdminPortal(); };
    if (backdrop) backdrop.onclick = () => { state.sidebarOpen = false; renderAdminPortal(); };
    document.getElementById('adm-theme-btn').onclick = () => { toggleTheme(); renderAdminPortal(); };
    document.getElementById('adm-notif-btn').onclick = () => { state.portalTab = 'notifications'; renderAdminPortal(); };
    document.getElementById('adm-avatar-btn').onclick = () => { state.portalTab = 'profile'; renderAdminPortal(); };
    document.getElementById('adm-quick-reading').onclick = () => {
      state.portalTab = 'readings';
      renderAdminPortal();
    };
    const gSearch = document.getElementById('adm-global-search');
    if (gSearch) {
      gSearch.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const q = gSearch.value.trim().toLowerCase();
          if (q.includes('aqb-') || q.includes('bill') || q.includes('inv')) state.portalTab = 'bills';
          else if (q.includes('mtr') || q.includes('meter')) state.portalTab = 'meters';
          else state.portalTab = 'customers';
          renderAdminPortal();
        }
      };
    }

    hydrateIcons();
    await loadAdminTab(activeTab);
    hydrateIcons();
  }

  async function loadAdminTab(tab) {
    const container = document.getElementById('adm-view-body');
    const { get, post, put, del, formatINR, esc, statusBadge, downloadCSV } = window.AquaAPI;
    const { state, toast, openModal, closeModal, confirmDialog, hydrateIcons } = window.AquaState;

    try {
      /* 1. ADMINISTRATOR CUSTOMER MONITORING DASHBOARD */
      if (tab === 'dashboard') {
        const [dash, monthly, cons, cRes, mRes, rRes, bRes] = await Promise.all([
          get('/api/admin/dashboard'),
          get('/api/admin/reports/monthly'),
          get('/api/admin/reports/consumption'),
          get('/api/admin/customers'),
          get('/api/admin/meters'),
          get('/api/admin/readings'),
          get('/api/admin/bills')
        ]);

        const allCustomers = cRes.customers || [];
        const allMeters = mRes.meters || [];
        const allReadings = rRes.readings || [];
        const allBills = bRes.bills || [];

        const monitoredRows = allCustomers.map((c) => {
          const cMeters = allMeters.filter((m) => m.customer_id === c.customer_id);
          const cReadings = allReadings
            .filter((r) => r.customer_id === c.customer_id)
            .sort((a, b) => (b.billing_period || '').localeCompare(a.billing_period || ''));
          const cBills = allBills.filter((b) => b.customer_id === c.customer_id);
          const latestPeriod = cReadings.length ? cReadings[0].billing_period : '';
          const latestPeriodUsage = latestPeriod
            ? cReadings.filter((r) => r.billing_period === latestPeriod).reduce((s, r) => s + Number(r.consumption || 0), 0)
            : 0;
          const totalUsage = cReadings.reduce((s, r) => s + Number(r.consumption || 0), 0);
          const overdueCount = cBills.filter((b) => b.status === 'overdue').length;
          const partialCount = cBills.filter((b) => b.status === 'partial').length;
          const unpaidCount = cBills.filter((b) => b.status === 'unpaid').length;
          const unbilledCount = cReadings.filter((r) => !r.billed).length;
          const totalBilled = cBills
            .filter((b) => b.status !== 'cancelled')
            .reduce((s, b) => s + Number(b.total_amount || 0), 0);
          const hasMaintOrInactive = cMeters.some((m) => m.status !== 'active');

          let watchState = 'healthy';
          if (overdueCount > 0) watchState = 'overdue';
          else if (partialCount > 0) watchState = 'partial';
          else if (unbilledCount > 0) watchState = 'unbilled';
          else if (unpaidCount > 0) watchState = 'unpaid';

          return {
            ...c,
            meters: cMeters,
            readings: cReadings,
            bills: cBills,
            latestPeriod,
            latestPeriodUsage,
            totalUsage,
            totalBilled,
            overdueCount,
            partialCount,
            unpaidCount,
            unbilledCount,
            hasMaintOrInactive,
            watchState
          };
        });

        const highUsageCount = monitoredRows.filter((r) => r.latestPeriodUsage > 30).length;
        if (!state.monitoredCustomerId || !monitoredRows.some((r) => r.customer_id === state.monitoredCustomerId)) {
          const priorityRow = monitoredRows.find((r) => r.overdueCount > 0) || monitoredRows[0];
          state.monitoredCustomerId = priorityRow ? priorityRow.customer_id : 0;
        }

        const recentCustomers = dash.recent_customers || [];
        const recentBills = dash.recent_bills || [];
        const recentPayments = dash.recent_payments || [];
        const outstandingList = dash.outstanding_summary || [];

        container.innerHTML =
          '<section class="admin-command-banner">' +
            '<div>' +
              '<div style="font-size:0.74rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#38BDF8;">Utility Operations &amp; Customer Monitoring Center</div>' +
              '<div style="font-size:1.18rem;font-weight:800;margin-top:2px;">Live Consumer Telemetry, Meter Health &amp; Billing Oversight</div>' +
              '<div class="admin-command-pills">' +
                '<span class="admin-telemetry-pill"><i data-lucide="users" style="width:13px;height:13px;"></i> ' + dash.total_customers + ' Active Consumers</span>' +
                '<span class="admin-telemetry-pill"><i data-lucide="gauge" style="width:13px;height:13px;"></i> ' + dash.active_meters + ' Active Meters</span>' +
                '<span class="admin-telemetry-pill"><i data-lucide="alert-triangle" style="width:13px;height:13px;"></i> ' + highUsageCount + ' Surge (&gt;30 KL)</span>' +
                '<span class="admin-telemetry-pill"><i data-lucide="file-clock" style="width:13px;height:13px;"></i> ' + (dash.unbilled_readings_count || 0) + ' Unbilled Readings</span>' +
              '</div>' +
            '</div>' +
            '<div class="toolbar-group">' +
              '<button type="button" class="btn btn-primary btn-sm" id="qa-rec-reading"><i data-lucide="clipboard-list"></i> Record Reading</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="qa-gen-bills"><i data-lucide="calculator"></i> Generate Bills (' + (dash.unbilled_readings_count || 0) + ')</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="qa-add-cust"><i data-lucide="user-plus"></i> Manage Customers</button>' +
            '</div>' +
          '</section>' +

          '<div class="admin-kpi-grid">' +
            adminKpiCard('Total Customers', dash.total_customers, 'Active utility consumer accounts', 'users', '') +
            adminKpiCard('Active Water Meters', dash.active_meters, Number(dash.total_consumption_kl).toLocaleString('en-IN') + ' KL supplied total', 'gauge', 'cyan') +
            adminKpiCard('Total Bills Generated', dash.total_bills_count, formatINR(dash.total_billed_paise) + ' total billed', 'receipt', 'navy') +
            adminKpiCard('Total Revenue Collected', formatINR(dash.total_collected_paise), 'Verified payment settlements', 'indian-rupee', 'emerald') +
            adminKpiCard('Pending Payments', formatINR(dash.pending_payments_paise), (dash.pending_payments_count || 0) + ' unpaid or partial bills', 'clock', 'amber') +
            adminKpiCard('Overdue Bills', dash.overdue_bills_count, formatINR(dash.outstanding_paise) + ' total receivable', 'alert-triangle', 'rose') +
          '</div>' +

          '<section class="admin-monitor-split">' +
            '<div class="card">' +
              '<div class="toolbar">' +
                '<div>' +
                  '<h2 style="margin:0;font-size:1.06rem;font-weight:800;">Live Customer Monitoring Matrix</h2>' +
                  '<div style="font-size:0.78rem;color:var(--text-muted);">Select any consumer row to inspect real-time usage, meters, and billing status.</div>' +
                '</div>' +
                '<div class="toolbar-group">' +
                  '<input type="search" class="input" id="mon-search" placeholder="Search customer or meter..." style="width:200px;padding:7px 11px;" />' +
                  '<select class="select" id="mon-filter" style="width:175px;padding:7px 11px;">' +
                    '<option value="all">All Customers (' + monitoredRows.length + ')</option>' +
                    '<option value="overdue">Overdue / Due Balance</option>' +
                    '<option value="surge">High Usage (&gt;30 KL)</option>' +
                    '<option value="unbilled">Unbilled Readings</option>' +
                    '<option value="multimeter">Multi-Meter / Maint.</option>' +
                  '</select>' +
                '</div>' +
              '</div>' +
              '<div class="table-wrap" style="max-height:540px;overflow-y:auto;">' +
                '<table class="data-table monitor-table">' +
                  '<thead><tr><th>Consumer</th><th>Meters</th><th>Usage</th><th>Balance</th><th style="text-align:right;">Monitor</th></tr></thead>' +
                  '<tbody id="mon-table-body"></tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +

            '<div class="card inspector-panel" id="adm-monitor-inspector">' +
              '<div class="state-box"><div class="spinner" style="margin:0 auto;"></div><p>Loading customer telemetry...</p></div>' +
            '</div>' +
          '</section>' +

          '<div class="grid-2">' +
            '<div class="card">' +
              '<div class="chart-head"><h3>Utility Revenue (Billed vs. Collected ₹)</h3><span class="badge badge-info">Revenue</span></div>' +
              '<div class="chart-box"><canvas id="adm-rev-chart"></canvas></div>' +
            '</div>' +
            '<div class="card">' +
              '<div class="chart-head"><h3>Utility Water Consumption (KL)</h3><span class="badge badge-info">Volume</span></div>' +
              '<div class="chart-box"><canvas id="adm-cons-chart"></canvas></div>' +
            '</div>' +
          '</div>' +

          '<div class="admin-feeds-grid">' +
            '<div class="card">' +
              '<div class="toolbar" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1rem;">Recent Customer Registrations</h3><button type="button" class="btn btn-ghost btn-sm" id="feed-cust-all">View All</button></div>' +
              '<div class="feed-list">' +
                (recentCustomers.length ? recentCustomers.map((c) =>
                  '<div class="feed-row">' +
                    '<div class="feed-row-main"><div class="feed-row-title">' + esc(c.name) + '</div><div class="feed-row-sub">' + esc(c.email) + '</div></div>' +
                    '<div class="feed-row-right">' + statusBadge(c.status) + '<div class="mono" style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">' + esc((c.created_at || '').slice(0, 10)) + '</div></div>' +
                  '</div>'
                ).join('') : '<div class="state-box">No customer registrations yet.</div>') +
              '</div>' +
            '</div>' +

            '<div class="card">' +
              '<div class="toolbar" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1rem;">Recent Billing Activity</h3><button type="button" class="btn btn-ghost btn-sm" id="feed-bill-all">View All</button></div>' +
              '<div class="feed-list">' +
                (recentBills.length ? recentBills.map((b) =>
                  '<div class="feed-row">' +
                    '<div class="feed-row-main"><div class="feed-row-title mono">' + esc(b.bill_number) + ' · ' + esc(b.customer_name) + '</div><div class="feed-row-sub">Period ' + esc(b.billing_period) + ' · Due ' + esc(b.due_date || '') + '</div></div>' +
                    '<div class="feed-row-right"><div class="num" style="font-weight:700;">' + formatINR(b.total_amount) + '</div>' + statusBadge(b.status) + '</div>' +
                  '</div>'
                ).join('') : '<div class="state-box">No bills generated yet.</div>') +
              '</div>' +
            '</div>' +

            '<div class="card">' +
              '<div class="toolbar" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1rem;">Recent Payment Transactions</h3><button type="button" class="btn btn-ghost btn-sm" id="feed-pay-all">View All</button></div>' +
              '<div class="feed-list">' +
                (recentPayments.length ? recentPayments.map((p) =>
                  '<div class="feed-row">' +
                    '<div class="feed-row-main"><div class="feed-row-title">' + esc(p.customer_name) + ' · ' + esc(p.payment_method) + '</div><div class="feed-row-sub mono">' + esc(p.transaction_reference) + ' (' + esc(p.bill_number) + ')</div></div>' +
                    '<div class="feed-row-right"><div class="num" style="font-weight:700;color:var(--success);">' + formatINR(p.amount) + '</div><div class="mono" style="font-size:0.72rem;color:var(--text-muted);">' + esc(p.payment_date) + '</div></div>' +
                  '</div>'
                ).join('') : '<div class="state-box">No payments recorded yet.</div>') +
              '</div>' +
            '</div>' +

            '<div class="card">' +
              '<div class="toolbar" style="margin-bottom:12px;"><h3 style="margin:0;font-size:1rem;">Outstanding Payment Summary</h3><button type="button" class="btn btn-ghost btn-sm" id="feed-out-all">Collect</button></div>' +
              '<div class="feed-list">' +
                (outstandingList.length ? outstandingList.map((o) =>
                  '<div class="feed-row">' +
                    '<div class="feed-row-main"><div class="feed-row-title">' + esc(o.customer_name) + ' <span class="mono" style="font-weight:500;">(' + esc(o.bill_number) + ')</span></div><div class="feed-row-sub">Due Date: ' + esc(o.due_date) + '</div></div>' +
                    '<div class="feed-row-right"><div class="num" style="font-weight:700;color:var(--danger);">' + formatINR(o.balance_due) + '</div>' + statusBadge(o.status) + '</div>' +
                  '</div>'
                ).join('') : '<div class="state-box">All bills are settled!</div>') +
              '</div>' +
            '</div>' +
          '</div>';

        const renderMonitorInspector = (cid) => {
          const row = monitoredRows.find((r) => r.customer_id === cid) || monitoredRows[0];
          const inspector = document.getElementById('adm-monitor-inspector');
          if (!inspector) return;
          if (!row) {
            inspector.innerHTML = '<div class="state-box">No customers found to monitor.</div>';
            return;
          }

          /* Aggregate customer monthly consumption across all assigned meters */
          const periodMap = {};
          row.readings.forEach((rd) => {
            periodMap[rd.billing_period] = (periodMap[rd.billing_period] || 0) + Number(rd.consumption || 0);
          });
          const cPeriods = Object.keys(periodMap).sort();
          const cValues = cPeriods.map((p) => periodMap[p]);
          const openBills = row.bills.filter((b) => b.status === 'unpaid' || b.status === 'partial' || b.status === 'overdue');
          const primaryOpenBill = openBills[0] || null;

          inspector.innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">' +
              '<div>' +
                '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--brand-cyan);">Live Customer Monitor</div>' +
                '<h3 style="margin:2px 0 2px;font-size:1.12rem;font-weight:800;">' + esc(row.name) + '</h3>' +
                '<div class="mono" style="font-size:0.76rem;color:var(--text-muted);">' + esc(row.email) + ' · ' + esc(row.phone) + '</div>' +
              '</div>' +
              statusBadge(row.watchState === 'healthy' ? 'active' : row.watchState) +
            '</div>' +
            '<div style="font-size:0.78rem;color:var(--text-secondary);margin-top:6px;">' + esc(row.address) + '</div>' +

            '<div class="inspector-mini-grid">' +
              '<div class="inspector-mini-stat"><div class="inspector-mini-label">Meters Assigned</div><div class="inspector-mini-val num">' + row.meters.length + ' Meter(s)</div></div>' +
              '<div class="inspector-mini-stat"><div class="inspector-mini-label">Total Water Used</div><div class="inspector-mini-val num">' + Number(row.totalUsage).toLocaleString('en-IN') + ' KL</div></div>' +
              '<div class="inspector-mini-stat"><div class="inspector-mini-label">Total Billed</div><div class="inspector-mini-val num">' + formatINR(row.totalBilled) + '</div></div>' +
              '<div class="inspector-mini-stat"><div class="inspector-mini-label">Balance Due</div><div class="inspector-mini-val num" style="color:' + (row.outstanding_paise > 0 ? 'var(--danger)' : 'var(--success)') + ';">' + formatINR(row.outstanding_paise) + '</div></div>' +
            '</div>' +

            '<div style="margin:12px 0;">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
                '<strong style="font-size:0.84rem;">Monthly Usage Trend (KL)</strong>' +
                '<span class="mono" style="font-size:0.74rem;color:var(--text-muted);">' + (row.latestPeriod ? 'Latest: ' + esc(row.latestPeriod) + ' (' + row.latestPeriodUsage + ' KL)' : 'No readings') + '</span>' +
              '</div>' +
              '<div style="height:155px;"><canvas id="adm-cust-monitor-chart"></canvas></div>' +
            '</div>' +

            '<div style="margin:12px 0;">' +
              '<strong style="font-size:0.84rem;display:block;margin-bottom:6px;">Assigned Water Meters</strong>' +
              '<div class="feed-list">' +
                (row.meters.length ? row.meters.map((m) => {
                  const mr = row.readings.find((r) => r.meter_id === m.meter_id);
                  return '<div class="feed-row" style="padding:8px 10px;">' +
                    '<div class="feed-row-main"><div class="feed-row-title mono">' + esc(m.meter_number) + '</div>' +
                      '<div class="feed-row-sub">' + (mr ? ('Latest ' + esc(mr.billing_period) + ': ' + mr.previous_reading + ' → ' + mr.current_reading + ' (' + mr.consumption + ' KL)') : 'No reading recorded') + '</div>' +
                    '</div>' +
                    '<div class="feed-row-right">' + statusBadge(m.status) + '</div>' +
                  '</div>';
                }).join('') : '<div style="font-size:0.8rem;color:var(--text-muted);">No meters assigned.</div>') +
              '</div>' +
            '</div>' +

            '<div style="margin:12px 0;">' +
              '<strong style="font-size:0.84rem;display:block;margin-bottom:6px;">Recent Invoices (' + row.bills.length + ')</strong>' +
              '<div class="feed-list">' +
                (row.bills.slice(0, 3).map((b) =>
                  '<div class="feed-row" style="padding:8px 10px;">' +
                    '<div class="feed-row-main"><div class="feed-row-title mono">' + esc(b.bill_number) + '</div><div class="feed-row-sub">' + esc(b.billing_period) + ' · Due ' + esc(b.due_date) + '</div></div>' +
                    '<div class="feed-row-right"><span class="num" style="font-weight:700;margin-right:6px;">' + formatINR(b.total_amount) + '</span>' + statusBadge(b.status) + '</div>' +
                  '</div>'
                ).join('') || '<div style="font-size:0.8rem;color:var(--text-muted);">No bills generated yet.</div>') +
              '</div>' +
            '</div>' +

            '<div class="toolbar-group" style="margin-top:14px;">' +
              '<button type="button" class="btn btn-primary btn-sm" id="insp-rec-reading"><i data-lucide="clipboard-list"></i> Record Reading</button>' +
              (primaryOpenBill ? '<button type="button" class="btn btn-secondary btn-sm" id="insp-collect-pay"><i data-lucide="credit-card"></i> Collect Payment</button>' : '') +
              '<button type="button" class="btn btn-secondary btn-sm" id="insp-send-alert"><i data-lucide="bell"></i> Send Alert</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" id="insp-full-cust"><i data-lucide="external-link"></i> Directory</button>' +
            '</div>';

          if (cPeriods.length) {
            window.AquaCharts.renderConsumptionBar('adm-cust-monitor-chart', cPeriods, cValues);
          }
          hydrateIcons();

          const recBtn = document.getElementById('insp-rec-reading');
          if (recBtn) recBtn.onclick = () => { state.portalTab = 'readings'; renderAdminPortal(); };
          const dirBtn = document.getElementById('insp-full-cust');
          if (dirBtn) dirBtn.onclick = () => { state.portalTab = 'customers'; renderAdminPortal(); };
          const payBtn = document.getElementById('insp-collect-pay');
          if (payBtn && primaryOpenBill) {
            payBtn.onclick = () => {
              const duePaise = Math.max(0, primaryOpenBill.total_amount - primaryOpenBill.paid_amount);
              openModal(
                'Collect Payment — ' + row.name,
                '<form id="insp-pay-form">' +
                  '<p style="margin-top:0;font-size:0.85rem;color:var(--text-secondary);">Invoice <strong class="mono">' + esc(primaryOpenBill.bill_number) + '</strong> (' + esc(primaryOpenBill.billing_period) + ') · Balance Due: <strong>' + formatINR(duePaise) + '</strong></p>' +
                  '<div class="form-field"><label>Amount (₹)</label><input class="input num" id="ip-amt" type="number" step="0.01" min="0.01" max="' + (duePaise / 100).toFixed(2) + '" value="' + (duePaise / 100).toFixed(2) + '" required /></div>' +
                  '<div class="form-field"><label>Payment Method</label><select class="select" id="ip-method"><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option></select></div>' +
                  '<div class="form-field"><label>Notes</label><input class="input" id="ip-notes" value="Collected via Customer Monitor" /></div>' +
                  '<div class="modal-actions"><button type="submit" class="btn btn-primary">Record Payment</button></div>' +
                '</form>'
              );
              document.getElementById('insp-pay-form').onsubmit = async (ev) => {
                ev.preventDefault();
                await post('/api/admin/payments', {
                  bill_id: primaryOpenBill.bill_id,
                  amount: Math.round(Number(document.getElementById('ip-amt').value) * 100),
                  payment_method: document.getElementById('ip-method').value,
                  notes: document.getElementById('ip-notes').value
                });
                closeModal();
                toast('Payment collected for ' + row.name, 'success');
                loadAdminTab('dashboard');
              };
            };
          }
          const alertBtn = document.getElementById('insp-send-alert');
          if (alertBtn) {
            alertBtn.onclick = () => {
              openModal(
                'Send Alert to ' + row.name,
                '<form id="insp-notif-form">' +
                  '<div class="form-field"><label>Alert Category</label><select class="select" id="in-type"><option value="due_reminder">Due Reminder</option><option value="overdue_alert">Overdue Alert</option><option value="account_update">Usage / Meter Advisory</option></select></div>' +
                  '<div class="form-field"><label>Message</label><textarea class="textarea" id="in-msg" rows="3" required>Dear ' + esc(row.name) + ', your latest water usage is ' + row.latestPeriodUsage + ' KL with balance due ' + formatINR(row.outstanding_paise) + '.</textarea></div>' +
                  '<div class="modal-actions"><button type="submit" class="btn btn-primary">Send Notification</button></div>' +
                '</form>'
              );
              document.getElementById('insp-notif-form').onsubmit = async (ev) => {
                ev.preventDefault();
                await post('/api/admin/notifications/send', {
                  user_id: row.user_id,
                  type: document.getElementById('in-type').value,
                  message: document.getElementById('in-msg').value
                });
                closeModal();
                toast('Alert sent to ' + row.name, 'success');
              };
            };
          }
        };

        const renderMonitorTable = () => {
          const q = (document.getElementById('mon-search')?.value || '').trim().toLowerCase();
          const filter = document.getElementById('mon-filter')?.value || 'all';
          const tbody = document.getElementById('mon-table-body');
          if (!tbody) return;

          const filtered = monitoredRows.filter((r) => {
            const matchSearch = !q ||
              r.name.toLowerCase().includes(q) ||
              r.email.toLowerCase().includes(q) ||
              r.meters.some((m) => m.meter_number.toLowerCase().includes(q));
            if (!matchSearch) return false;
            if (filter === 'overdue') return r.outstanding_paise > 0;
            if (filter === 'surge') return r.latestPeriodUsage > 30;
            if (filter === 'unbilled') return r.unbilledCount > 0;
            if (filter === 'multimeter') return r.meters.length > 1 || r.hasMaintOrInactive;
            return true;
          });

          if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">No matching customers for this monitor filter.</td></tr>';
            return;
          }

          tbody.innerHTML = filtered.map((r) => {
            const isActive = r.customer_id === state.monitoredCustomerId;
            const pct = Math.min(100, Math.round((r.latestPeriodUsage / 60) * 100));
            const barClass = r.latestPeriodUsage > 30 ? 'surge' : (r.latestPeriodUsage > 22 ? 'warn' : '');
            const meterTags = r.meters.map((m) => '<span class="mono" style="font-size:0.72rem;display:block;white-space:nowrap;">' + esc(m.meter_number) + '</span>').join('');
            return (
              '<tr class="monitor-row ' + (isActive ? 'active' : '') + '" data-mon-cid="' + r.customer_id + '">' +
                '<td class="monitor-consumer-cell">' +
                  '<div style="font-weight:700;line-height:1.25;">' + esc(r.name) + (r.meters.length > 1 ? ' <span class="badge badge-info" style="font-size:0.62rem;">' + r.meters.length + 'M</span>' : '') + '</div>' +
                  '<div class="mono monitor-consumer-email" title="' + esc(r.email) + '">' + esc(r.email) + '</div>' +
                '</td>' +
                '<td>' + (meterTags || '<span style="color:var(--text-muted);">None</span>') + '</td>' +
                '<td style="white-space:nowrap;">' +
                  '<div class="num" style="font-weight:700;">' + r.latestPeriodUsage + ' KL' + (r.latestPeriodUsage > 30 ? ' <span class="badge badge-danger" style="font-size:0.62rem;">Surge</span>' : '') + '</div>' +
                  '<div class="usage-meter-bar"><div class="usage-meter-fill ' + barClass + '" style="width:' + pct + '%;"></div></div>' +
                '</td>' +
                '<td style="white-space:nowrap;">' +
                  '<div class="num" style="font-weight:700;color:' + (r.outstanding_paise > 0 ? 'var(--danger)' : 'var(--success)') + ';">' + formatINR(r.outstanding_paise) + '</div>' +
                  '<div>' + statusBadge(r.watchState === 'healthy' ? 'paid' : r.watchState) + '</div>' +
                '</td>' +
                '<td style="text-align:right;white-space:nowrap;"><button type="button" class="btn ' + (isActive ? 'btn-navy' : 'btn-secondary') + ' btn-sm" style="padding:5px 10px;font-size:0.75rem;" data-mon-btn="' + r.customer_id + '">Inspect</button></td>' +
              '</tr>'
            );
          }).join('');

          tbody.querySelectorAll('[data-mon-cid]').forEach((tr) => {
            tr.onclick = () => {
              state.monitoredCustomerId = Number(tr.getAttribute('data-mon-cid'));
              renderMonitorTable();
              renderMonitorInspector(state.monitoredCustomerId);
            };
          });
        };

        renderMonitorTable();
        renderMonitorInspector(state.monitoredCustomerId);
        document.getElementById('mon-search').oninput = renderMonitorTable;
        document.getElementById('mon-filter').onchange = renderMonitorTable;

        const mRows = monthly.monthly || [];
        window.AquaCharts.renderBarLineRevenue(
          'adm-rev-chart',
          mRows.map((m) => m.billing_period),
          mRows.map((m) => Math.round(m.total_billed_paise / 100)),
          mRows.map((m) => Math.round(m.total_collected_paise / 100))
        );
        const tRows = cons.trend || [];
        window.AquaCharts.renderConsumptionLine(
          'adm-cons-chart',
          tRows.map((t) => t.billing_period),
          tRows.map((t) => t.total_kl),
          'Total Utility Consumption (KL)'
        );

        document.getElementById('qa-rec-reading').onclick = () => { state.portalTab = 'readings'; renderAdminPortal(); };
        document.getElementById('qa-gen-bills').onclick = () => { state.portalTab = 'billgen'; renderAdminPortal(); };
        document.getElementById('qa-add-cust').onclick = () => { state.portalTab = 'customers'; renderAdminPortal(); };
        document.getElementById('feed-cust-all').onclick = () => { state.portalTab = 'customers'; renderAdminPortal(); };
        document.getElementById('feed-bill-all').onclick = () => { state.portalTab = 'bills'; renderAdminPortal(); };
        document.getElementById('feed-pay-all').onclick = () => { state.portalTab = 'payments'; renderAdminPortal(); };
        document.getElementById('feed-out-all').onclick = () => { state.portalTab = 'payments'; renderAdminPortal(); };
      }

      /* 2. CUSTOMER MANAGEMENT */
      else if (tab === 'customers') {
        const renderCustList = async (search, status) => {
          const qs = '?search=' + encodeURIComponent(search || '') + '&status=' + encodeURIComponent(status || '');
          const data = await get('/api/admin/customers' + qs);
          const list = data.customers || [];
          const tbody = document.getElementById('cust-tbody');
          if (!tbody) return;
          if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:24px;">No matching customers found.</td></tr>';
            return;
          }
          tbody.innerHTML = list.map((c) =>
            '<tr>' +
              '<td class="mono">#' + c.customer_id + '</td>' +
              '<td><strong>' + esc(c.name) + '</strong><div style="font-size:0.78rem;color:var(--text-muted);">' + esc(c.email) + '</div></td>' +
              '<td class="mono">' + esc(c.phone) + '</td>' +
              '<td style="max-width:220px;">' + esc(c.address) + '</td>' +
              '<td class="num">' + c.meter_count + '</td>' +
              '<td class="num">' + formatINR(c.outstanding_paise) + '</td>' +
              '<td>' + statusBadge(c.status) + '</td>' +
              '<td><div class="toolbar-group">' +
                '<button type="button" class="btn btn-secondary btn-sm" data-cview="' + c.customer_id + '">Details</button>' +
                '<button type="button" class="btn btn-secondary btn-sm" data-cedit="' + c.customer_id + '">Edit</button>' +
                '<button type="button" class="btn btn-danger btn-sm" data-cdel="' + c.customer_id + '">Deactivate</button>' +
              '</div></td>' +
            '</tr>'
          ).join('');

          tbody.querySelectorAll('[data-cview]').forEach((btn) => {
            btn.onclick = async () => {
              const d = await get('/api/admin/customers/' + btn.getAttribute('data-cview'));
              const cust = d.customer;
              openModal(
                'Customer #' + cust.customer_id + ' — ' + cust.name,
                '<div style="margin-bottom:16px;font-size:0.9rem;">' +
                  '<div><strong>Email:</strong> ' + esc(cust.email) + ' &bull; <strong>Phone:</strong> ' + esc(cust.phone) + '</div>' +
                  '<div><strong>Address:</strong> ' + esc(cust.address) + '</div>' +
                  '<div><strong>Status:</strong> ' + statusBadge(cust.status) + ' &bull; <strong>Registered:</strong> <span class="mono">' + esc(cust.created_at) + '</span></div>' +
                '</div>' +
                '<h4>Assigned Meters (' + d.meters.length + ')</h4>' +
                '<div class="table-wrap" style="margin-bottom:16px;"><table class="data-table"><thead><tr><th>Meter #</th><th>Installed</th><th>Status</th></tr></thead><tbody>' +
                (d.meters.map((m) => '<tr><td class="mono">' + esc(m.meter_number) + '</td><td class="mono">' + esc(m.installation_date) + '</td><td>' + statusBadge(m.status) + '</td></tr>').join('') || '<tr><td colspan="3">No meters assigned</td></tr>') +
                '</tbody></table></div>' +
                '<h4>Bill History (' + d.bills.length + ')</h4>' +
                '<div class="table-wrap"><table class="data-table"><thead><tr><th>Bill #</th><th>Period</th><th>Total</th><th>Paid</th><th>Status</th></tr></thead><tbody>' +
                (d.bills.map((b) => '<tr><td class="mono">' + esc(b.bill_number) + '</td><td class="mono">' + esc(b.billing_period) + '</td><td class="num">' + formatINR(b.total_amount) + '</td><td class="num">' + formatINR(b.paid_amount) + '</td><td>' + statusBadge(b.status) + '</td></tr>').join('') || '<tr><td colspan="5">No bills generated</td></tr>') +
                '</tbody></table></div>',
                true
              );
            };
          });

          tbody.querySelectorAll('[data-cedit]').forEach((btn) => {
            btn.onclick = async () => {
              const cid = btn.getAttribute('data-cedit');
              const d = await get('/api/admin/customers/' + cid);
              const cust = d.customer;
              openModal(
                'Edit Customer — ' + cust.name,
                '<form id="edit-cust-form">' +
                  '<div class="form-field"><label>Name</label><input class="input" id="ec-name" value="' + esc(cust.name) + '" required /></div>' +
                  '<div class="form-field"><label>Phone</label><input class="input" id="ec-phone" value="' + esc(cust.phone) + '" required /></div>' +
                  '<div class="form-field"><label>Address</label><input class="input" id="ec-address" value="' + esc(cust.address) + '" required /></div>' +
                  '<div class="form-field"><label>Account Status</label><select class="select" id="ec-status">' +
                    '<option value="active" ' + (cust.status === 'active' ? 'selected' : '') + '>Active</option>' +
                    '<option value="inactive" ' + (cust.status === 'inactive' ? 'selected' : '') + '>Inactive</option>' +
                    '<option value="suspended" ' + (cust.status === 'suspended' ? 'selected' : '') + '>Suspended</option>' +
                  '</select></div>' +
                  '<div class="modal-actions"><button type="submit" class="btn btn-primary">Save Changes</button></div>' +
                '</form>'
              );
              document.getElementById('edit-cust-form').onsubmit = async (e) => {
                e.preventDefault();
                try {
                  await put('/api/admin/customers/' + cid, {
                    name: document.getElementById('ec-name').value,
                    phone: document.getElementById('ec-phone').value,
                    address: document.getElementById('ec-address').value,
                    status: document.getElementById('ec-status').value
                  });
                  closeModal();
                  toast('Customer updated.', 'success');
                  renderCustList(document.getElementById('cust-search').value, document.getElementById('cust-status').value);
                } catch (err) { toast(err.message, 'error'); }
              };
            };
          });

          tbody.querySelectorAll('[data-cdel]').forEach((btn) => {
            btn.onclick = () => {
              const cid = btn.getAttribute('data-cdel');
              confirmDialog(
                'Deactivate Customer',
                'Deactivating preserves historical billing & audit records while blocking portal sign-in. Continue?',
                'Deactivate Customer',
                async () => {
                  const res = await del('/api/admin/customers/' + cid);
                  toast(res.message, 'success');
                  renderCustList(document.getElementById('cust-search').value, document.getElementById('cust-status').value);
                },
                true
              );
            };
          });
        };

        container.innerHTML =
          '<div class="card">' +
            '<div class="toolbar">' +
              '<div class="toolbar-group">' +
                '<input class="input input-sm" id="cust-search" placeholder="Search name, email, phone..." style="width:240px;" />' +
                '<select class="select input-sm" id="cust-status" style="width:140px;">' +
                  '<option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>' +
                '</select>' +
              '</div>' +
              '<button type="button" class="btn btn-primary btn-sm" id="add-cust-btn"><i data-lucide="user-plus"></i> Add Customer</button>' +
            '</div>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Customer</th><th>Phone</th><th>Address</th><th>Meters</th><th>Outstanding</th><th>Status</th><th>Actions</th></tr></thead><tbody id="cust-tbody"></tbody></table></div>' +
          '</div>';

        document.getElementById('cust-search').oninput = (e) => renderCustList(e.target.value, document.getElementById('cust-status').value);
        document.getElementById('cust-status').onchange = (e) => renderCustList(document.getElementById('cust-search').value, e.target.value);
        document.getElementById('add-cust-btn').onclick = () => {
          openModal(
            'Register New Customer',
            '<form id="new-cust-form">' +
              '<div class="form-grid">' +
                '<div class="form-field"><label>Full Name</label><input class="input" id="nc-name" required placeholder="e.g. Rohan Kulkarni" /></div>' +
                '<div class="form-field"><label>Phone</label><input class="input" id="nc-phone" required placeholder="+91-98765-43210" /></div>' +
                '<div class="form-field full"><label>Email</label><input class="input" id="nc-email" type="email" required placeholder="rohan@example.com" /></div>' +
                '<div class="form-field full"><label>Address</label><input class="input" id="nc-address" required placeholder="House 14, Sector 7" /></div>' +
                '<div class="form-field"><label>Initial Password (min 8 chars)</label><input class="input" id="nc-pass" type="password" minlength="8" required placeholder="Enter temporary password" /></div>' +
                '<div class="form-field"><label>Assign Meter # (Optional)</label><input class="input" id="nc-meter" placeholder="e.g. AQB-MTR-1025" /></div>' +
              '</div>' +
              '<div class="modal-actions"><button type="submit" class="btn btn-primary">Create Customer</button></div>' +
            '</form>'
          );
          document.getElementById('new-cust-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
              const payload = {
                name: document.getElementById('nc-name').value,
                phone: document.getElementById('nc-phone').value,
                email: document.getElementById('nc-email').value,
                address: document.getElementById('nc-address').value,
                password: document.getElementById('nc-pass').value
              };
              const m = document.getElementById('nc-meter').value.trim();
              if (m) payload.meter_number = m;
              await post('/api/admin/customers', payload);
              closeModal();
              toast('Customer created successfully.', 'success');
              renderCustList('', '');
            } catch (err) { toast(err.message, 'error'); }
          };
        };

        await renderCustList('', '');
      }

      /* 3. METER MANAGEMENT */
      else if (tab === 'meters') {
        const cData = await get('/api/admin/customers');
        const customers = cData.customers || [];

        const renderMeters = async (search, status) => {
          const d = await get('/api/admin/meters?search=' + encodeURIComponent(search || '') + '&status=' + encodeURIComponent(status || ''));
          const list = d.meters || [];
          const tbody = document.getElementById('mtr-tbody');
          tbody.innerHTML = list.map((m) =>
            '<tr>' +
              '<td class="mono"><strong>' + esc(m.meter_number) + '</strong></td>' +
              '<td>' + esc(m.customer_name) + '</td>' +
              '<td class="mono">' + esc(m.installation_date) + '</td>' +
              '<td class="num">' + m.latest_reading + ' KL <span style="color:var(--text-muted);font-size:0.76rem;">(' + esc(m.latest_period || 'none') + ')</span></td>' +
              '<td>' + statusBadge(m.status) + '</td>' +
              '<td><div class="toolbar-group">' +
                '<button type="button" class="btn btn-secondary btn-sm" data-mhist="' + m.meter_id + '">History</button>' +
                '<button type="button" class="btn btn-secondary btn-sm" data-medit="' + m.meter_id + '" data-mnum="' + esc(m.meter_number) + '" data-mstat="' + esc(m.status) + '">Edit</button>' +
                (m.status !== 'inactive'
                  ? '<button type="button" class="btn btn-danger btn-sm" data-mtoggle="' + m.meter_id + '" data-next="inactive" data-mnum="' + esc(m.meter_number) + '">Deactivate</button>'
                  : '<button type="button" class="btn btn-primary btn-sm" data-mtoggle="' + m.meter_id + '" data-next="active" data-mnum="' + esc(m.meter_number) + '">Activate</button>') +
              '</div></td>' +
            '</tr>'
          ).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;">No meters found.</td></tr>';

          tbody.querySelectorAll('[data-mhist]').forEach((btn) => {
            btn.onclick = async () => {
              const md = await get('/api/admin/meters/' + btn.getAttribute('data-mhist'));
              openModal(
                'Meter Reading History — ' + md.meter.meter_number,
                '<p style="margin-top:0;"><strong>Customer:</strong> ' + esc(md.meter.customer_name) + ' &bull; <strong>Status:</strong> ' + statusBadge(md.meter.status) + '</p>' +
                '<div class="table-wrap"><table class="data-table"><thead><tr><th>Period</th><th>Previous</th><th>Current</th><th>Consumption</th><th>Date</th></tr></thead><tbody>' +
                (md.readings.map((r) => '<tr><td class="mono">' + esc(r.billing_period) + '</td><td class="num">' + r.previous_reading + '</td><td class="num">' + r.current_reading + '</td><td class="num"><strong>' + r.consumption + ' KL</strong></td><td class="mono">' + esc(r.reading_date) + '</td></tr>').join('') || '<tr><td colspan="5">No readings recorded.</td></tr>') +
                '</tbody></table></div>',
                true
              );
            };
          });

          tbody.querySelectorAll('[data-medit]').forEach((btn) => {
            btn.onclick = () => {
              const mid = btn.getAttribute('data-medit');
              const mnum = btn.getAttribute('data-mnum');
              const mstat = btn.getAttribute('data-mstat');
              openModal(
                'Edit Meter — ' + mnum,
                '<form id="edit-mtr-form">' +
                  '<div class="form-field"><label>Meter Number</label><input class="input" id="em-num" value="' + esc(mnum) + '" required /></div>' +
                  '<div class="form-field"><label>Status</label><select class="select" id="em-status">' +
                    '<option value="active" ' + (mstat === 'active' ? 'selected' : '') + '>Active</option>' +
                    '<option value="maintenance" ' + (mstat === 'maintenance' ? 'selected' : '') + '>Maintenance</option>' +
                    '<option value="inactive" ' + (mstat === 'inactive' ? 'selected' : '') + '>Inactive</option>' +
                  '</select></div>' +
                  '<div class="modal-actions"><button type="submit" class="btn btn-primary">Update Meter</button></div>' +
                '</form>'
              );
              document.getElementById('edit-mtr-form').onsubmit = async (e) => {
                e.preventDefault();
                try {
                  await put('/api/admin/meters/' + mid, {
                    meter_number: document.getElementById('em-num').value,
                    status: document.getElementById('em-status').value
                  });
                  closeModal();
                  toast('Meter updated.', 'success');
                  renderMeters(document.getElementById('mtr-search').value, document.getElementById('mtr-status').value);
                } catch (err) { toast(err.message, 'error'); }
              };
            };
          });

          tbody.querySelectorAll('[data-mtoggle]').forEach((btn) => {
            btn.onclick = () => {
              const mid = btn.getAttribute('data-mtoggle');
              const nextStatus = btn.getAttribute('data-next');
              const mnum = btn.getAttribute('data-mnum');
              confirmDialog(
                (nextStatus === 'inactive' ? 'Deactivate' : 'Activate') + ' Meter ' + mnum,
                nextStatus === 'inactive'
                  ? 'Inactive meters cannot accept new meter readings, while historical readings and bills remain preserved.'
                  : 'Re-activate this water meter for monthly reading entry?',
                nextStatus === 'inactive' ? 'Deactivate Meter' : 'Activate Meter',
                async () => {
                  await put('/api/admin/meters/' + mid, { status: nextStatus });
                  toast('Meter ' + mnum + ' marked ' + nextStatus + '.', 'success');
                  renderMeters(document.getElementById('mtr-search').value, document.getElementById('mtr-status').value);
                },
                nextStatus === 'inactive'
              );
            };
          });
        };

        container.innerHTML =
          '<div class="card">' +
            '<div class="toolbar">' +
              '<div class="toolbar-group">' +
                '<input class="input input-sm" id="mtr-search" placeholder="Search meter # or customer..." style="width:240px;" />' +
                '<select class="select input-sm" id="mtr-status" style="width:150px;"><option value="">All Statuses</option><option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option></select>' +
              '</div>' +
              '<button type="button" class="btn btn-primary btn-sm" id="assign-mtr-btn"><i data-lucide="plus"></i> Assign Meter</button>' +
            '</div>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Meter Number</th><th>Customer</th><th>Installed</th><th>Latest Reading</th><th>Status</th><th>Actions</th></tr></thead><tbody id="mtr-tbody"></tbody></table></div>' +
          '</div>';

        document.getElementById('mtr-search').oninput = (e) => renderMeters(e.target.value, document.getElementById('mtr-status').value);
        document.getElementById('mtr-status').onchange = (e) => renderMeters(document.getElementById('mtr-search').value, e.target.value);
        document.getElementById('assign-mtr-btn').onclick = () => {
          openModal(
            'Assign New Water Meter',
            '<form id="new-mtr-form">' +
              '<div class="form-field"><label>Customer</label><select class="select" id="nm-cust" required>' +
                customers.map((c) => '<option value="' + c.customer_id + '">' + esc(c.name) + ' (' + esc(c.email) + ')</option>').join('') +
              '</select></div>' +
              '<div class="form-field"><label>Unique Meter Number</label><input class="input" id="nm-num" required placeholder="AQB-MTR-1099" /></div>' +
              '<div class="form-field"><label>Installation Date</label><input class="input" id="nm-date" type="date" value="2026-11-13" required /></div>' +
              '<div class="modal-actions"><button type="submit" class="btn btn-primary">Assign Meter</button></div>' +
            '</form>'
          );
          document.getElementById('new-mtr-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
              await post('/api/admin/meters', {
                customer_id: Number(document.getElementById('nm-cust').value),
                meter_number: document.getElementById('nm-num').value,
                installation_date: document.getElementById('nm-date').value,
                status: 'active'
              });
              closeModal();
              toast('Meter assigned successfully.', 'success');
              renderMeters('', '');
            } catch (err) { toast(err.message, 'error'); }
          };
        };

        await renderMeters('', '');
      }

      /* 4. METER READINGS */
      else if (tab === 'readings') {
        const [cData, mData, rData] = await Promise.all([
          get('/api/admin/customers'),
          get('/api/admin/meters?status=active'),
          get('/api/admin/readings')
        ]);
        const customers = cData.customers || [];
        const meters = mData.meters || [];
        const readings = rData.readings || [];

        container.innerHTML =
          '<div class="grid-2" style="grid-template-columns:1fr 1.6fr;">' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Record Meter Reading</h3>' +
              '<form id="rec-reading-form">' +
                '<div class="form-field"><label>Filter by Customer</label><select class="select" id="rr-cust">' +
                  '<option value="">All Customers (' + meters.length + ' active meters)</option>' +
                  customers.map((c) => '<option value="' + c.customer_id + '">' + esc(c.name) + ' (' + esc(c.email) + ')</option>').join('') +
                '</select></div>' +
                '<div class="form-field"><label>Active Water Meter</label><select class="select" id="rr-meter" required></select></div>' +
                '<div class="form-grid">' +
                  '<div class="form-field"><label>Billing Period (YYYY-MM)</label><input class="input mono" id="rr-period" value="2026-12" pattern="\\d{4}-\\d{2}" required /></div>' +
                  '<div class="form-field"><label>Reading Date</label><input class="input" id="rr-date" type="date" value="2026-12-10" required /></div>' +
                  '<div class="form-field"><label>Previous Reading (KL)</label><input class="input num" id="rr-prev" type="number" min="0" required /></div>' +
                  '<div class="form-field"><label>Current Reading (KL)</label><input class="input num" id="rr-curr" type="number" min="0" required /></div>' +
                '</div>' +
                '<div class="preview-row"><span>Auto-Calculated Consumption</span><strong class="mono" id="rr-delta">0 KL</strong></div>' +
                '<button type="submit" class="btn btn-primary" style="width:100%;" id="rr-submit-btn"><i data-lucide="save"></i> Validate &amp; Save Reading</button>' +
              '</form>' +
            '</div>' +
            '<div class="card">' +
              '<div class="toolbar"><h3 style="margin:0;">Recorded Readings Ledger</h3><span class="badge badge-info">' + readings.length + ' total</span></div>' +
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Period</th><th>Date</th><th>Meter</th><th>Customer</th><th>Prev</th><th>Curr</th><th>Used</th><th>Billed</th></tr></thead><tbody>' +
              readings.map((r) =>
                '<tr>' +
                  '<td class="mono">' + esc(r.billing_period) + '</td>' +
                  '<td class="mono">' + esc(r.reading_date) + '</td>' +
                  '<td class="mono">' + esc(r.meter_number) + '</td>' +
                  '<td>' + esc(r.customer_name) + '</td>' +
                  '<td class="num">' + r.previous_reading + '</td>' +
                  '<td class="num">' + r.current_reading + '</td>' +
                  '<td class="num"><strong>' + r.consumption + ' KL</strong></td>' +
                  '<td>' + (r.billed ? '<span class="badge badge-success">Billed</span>' : '<span class="badge badge-warning">Pending</span>') + '</td>' +
                '</tr>'
              ).join('') +
              '</tbody></table></div>' +
            '</div>' +
          '</div>';

        const selCust = document.getElementById('rr-cust');
        const selMeter = document.getElementById('rr-meter');
        const prevInput = document.getElementById('rr-prev');
        const currInput = document.getElementById('rr-curr');
        const deltaEl = document.getElementById('rr-delta');

        const updateDelta = () => {
          const d = Number(currInput.value) - Number(prevInput.value);
          deltaEl.textContent = d >= 0 ? (d + ' KL (' + (d * 1000).toLocaleString('en-IN') + ' L)') : 'Invalid (Current < Previous)';
          deltaEl.style.color = d >= 0 ? 'var(--brand-blue)' : 'var(--danger)';
        };

        const syncPrev = () => {
          const opt = selMeter.options[selMeter.selectedIndex];
          if (opt) {
            const latest = Number(opt.getAttribute('data-latest') || 0);
            prevInput.value = latest;
            currInput.value = latest + 15;
            updateDelta();
          } else {
            prevInput.value = 0;
            currInput.value = 0;
            updateDelta();
          }
        };

        const populateMeters = () => {
          const cid = Number(selCust.value || 0);
          const filtered = cid ? meters.filter((m) => m.customer_id === cid) : meters;
          selMeter.innerHTML = filtered.length
            ? filtered.map((m) => '<option value="' + m.meter_id + '" data-latest="' + m.latest_reading + '">' + esc(m.meter_number) + ' — ' + esc(m.customer_name) + ' (Last: ' + m.latest_reading + ' KL)</option>').join('')
            : '<option value="">No active meters for customer</option>';
          document.getElementById('rr-submit-btn').disabled = !filtered.length;
          syncPrev();
        };

        selCust.onchange = populateMeters;
        selMeter.onchange = syncPrev;
        prevInput.oninput = updateDelta;
        currInput.oninput = updateDelta;
        populateMeters();

        document.getElementById('rec-reading-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            await post('/api/admin/readings', {
              meter_id: Number(selMeter.value),
              previous_reading: Number(prevInput.value),
              current_reading: Number(currInput.value),
              billing_period: document.getElementById('rr-period').value,
              reading_date: document.getElementById('rr-date').value
            });
            toast('Meter reading recorded and validated.', 'success');
            loadAdminTab('readings');
          } catch (err) { toast(err.message, 'error'); }
        };
      }

      /* 5. BILL GENERATION (Single Preview + Generate & Bulk Period) */
      else if (tab === 'billgen') {
        const [rData, tData, cData] = await Promise.all([
          get('/api/admin/readings'),
          get('/api/admin/tariffs'),
          get('/api/admin/customers')
        ]);
        const unbilled = (rData.readings || []).filter((r) => !r.billed);
        const tariffs = tData.tariffs || [];
        const customers = cData.customers || [];

        container.innerHTML =
          '<div class="grid-2">' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Single Bill Generator &amp; C-Engine Preview</h3>' +
              '<p style="color:var(--text-secondary);font-size:0.85rem;">Select a customer &amp; unbilled reading, preview slab breakdown from the C11 engine, then generate.</p>' +
              '<form id="single-bill-form">' +
                '<div class="form-field"><label>Customer Filter</label><select class="select" id="sb-cust">' +
                  '<option value="">All Customers (' + unbilled.length + ' unbilled readings)</option>' +
                  customers.map((c) => '<option value="' + c.customer_id + '">' + esc(c.name) + ' (' + esc(c.email) + ')</option>').join('') +
                '</select></div>' +
                '<div class="form-field"><label>Unbilled Reading</label><select class="select" id="sb-reading" required></select></div>' +
                '<div class="form-grid">' +
                  '<div class="form-field"><label>Tariff Plan</label><select class="select" id="sb-tariff">' +
                    tariffs.map((t) => '<option value="' + t.tariff_id + '" ' + (t.status === 'active' ? 'selected' : '') + '>' + esc(t.name) + ' (' + esc(t.billing_mode) + ')</option>').join('') +
                  '</select></div>' +
                  '<div class="form-field"><label>Payment Due Date</label><input class="input" id="sb-due" type="date" value="2026-12-28" required /></div>' +
                '</div>' +
                '<div id="sb-preview-box" class="calc-preview-box hidden"></div>' +
                '<div class="toolbar-group">' +
                  '<button type="button" class="btn btn-secondary" id="sb-preview-btn"><i data-lucide="eye"></i> Preview Calculation</button>' +
                  '<button type="submit" class="btn btn-primary" id="sb-gen-btn"><i data-lucide="file-plus"></i> Generate Bill</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Bulk Period Bill Generation</h3>' +
              '<p style="color:var(--text-secondary);font-size:0.85rem;">Generate invoices for all unbilled readings in a billing period atomically inside the C backend.</p>' +
              '<form id="bulk-bill-form">' +
                '<div class="form-field"><label>Billing Period (YYYY-MM)</label><input class="input mono" id="bg-period" value="2026-12" required /></div>' +
                '<div class="form-field"><label>Tariff Plan</label><select class="select" id="bg-tariff">' +
                  tariffs.map((t) => '<option value="' + t.tariff_id + '" ' + (t.status === 'active' ? 'selected' : '') + '>' + esc(t.name) + ' (' + esc(t.billing_mode) + ', ' + formatINR(t.rate_per_kl) + '/KL + ' + formatINR(t.fixed_charge) + ')</option>').join('') +
                '</select></div>' +
                '<div class="form-field"><label>Payment Due Date</label><input class="input" id="bg-due" type="date" value="2026-12-28" required /></div>' +
                '<button type="submit" class="btn btn-primary"><i data-lucide="zap"></i> Generate All Unbilled for Period</button>' +
              '</form>' +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<h3 style="margin-top:0;">Unbilled Readings Queue (' + unbilled.length + ')</h3>' +
            (unbilled.length ? (
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Period</th><th>Meter</th><th>Customer</th><th>Prev &rarr; Curr</th><th>Consumption</th><th>Action</th></tr></thead><tbody>' +
              unbilled.map((r) =>
                '<tr>' +
                  '<td class="mono">' + esc(r.billing_period) + '</td>' +
                  '<td class="mono">' + esc(r.meter_number) + '</td>' +
                  '<td>' + esc(r.customer_name) + '</td>' +
                  '<td class="num">' + r.previous_reading + ' &rarr; ' + r.current_reading + ' KL</td>' +
                  '<td class="num"><strong>' + r.consumption + ' KL</strong></td>' +
                  '<td><button type="button" class="btn btn-primary btn-sm" data-gen-rid="' + r.reading_id + '">Generate Bill</button></td>' +
                '</tr>'
              ).join('') +
              '</tbody></table></div>'
            ) : '<div class="state-box">All recorded readings already have active bills!</div>') +
          '</div>';

        const sbCust = document.getElementById('sb-cust');
        const sbRead = document.getElementById('sb-reading');
        const sbPrevBox = document.getElementById('sb-preview-box');

        const populateUnbilled = () => {
          const cid = Number(sbCust.value || 0);
          const filtered = cid ? unbilled.filter((r) => r.customer_id === cid) : unbilled;
          sbRead.innerHTML = filtered.length
            ? filtered.map((r) => '<option value="' + r.reading_id + '">' + esc(r.billing_period) + ' — ' + esc(r.customer_name) + ' (' + esc(r.meter_number) + ', ' + r.consumption + ' KL)</option>').join('')
            : '<option value="">No unbilled readings available</option>';
          document.getElementById('sb-preview-btn').disabled = !filtered.length;
          document.getElementById('sb-gen-btn').disabled = !filtered.length;
          sbPrevBox.classList.add('hidden');
        };
        sbCust.onchange = populateUnbilled;
        populateUnbilled();

        document.getElementById('sb-preview-btn').onclick = async () => {
          try {
            const res = await post('/api/admin/bills/preview', {
              reading_id: Number(sbRead.value),
              tariff_id: Number(document.getElementById('sb-tariff').value)
            });
            const pv = res.preview || res;
            sbPrevBox.innerHTML =
              '<div style="font-weight:800;margin-bottom:8px;color:#0B1F3A;">C11 Tariff Calculation Preview (' + esc(pv.tariff_name) + ' · ' + esc(pv.billing_mode) + ')</div>' +
              '<div class="invoice-total-row"><span>Consumption (' + pv.previous_reading + ' &rarr; ' + pv.current_reading + ')</span><strong class="num">' + pv.consumption + ' KL</strong></div>' +
              '<div class="invoice-total-row"><span>Water Usage Charge</span><span class="num">' + formatINR(pv.water_charge) + '</span></div>' +
              '<div class="invoice-total-row"><span>Fixed Service Charge</span><span class="num">' + formatINR(pv.service_charge) + '</span></div>' +
              '<div class="invoice-total-row"><span>Utility Tax (' + (Number(pv.tax_percentage || 0) / 100).toFixed(2) + '%)</span><span class="num">' + formatINR(pv.tax_amount) + '</span></div>' +
              '<div class="invoice-total-row invoice-grand"><span>Estimated Total Payable</span><span class="num">' + formatINR(pv.total_amount) + '</span></div>';
            sbPrevBox.classList.remove('hidden');
          } catch (err) { toast(err.message, 'error'); }
        };

        document.getElementById('single-bill-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            const res = await post('/api/admin/bills/generate', {
              reading_id: Number(sbRead.value),
              tariff_id: Number(document.getElementById('sb-tariff').value),
              due_date: document.getElementById('sb-due').value
            });
            toast('Generated ' + res.bill.bill_number + ' (' + formatINR(res.bill.total_amount) + ')', 'success');
            loadAdminTab('billgen');
          } catch (err) { toast(err.message, 'error'); }
        };

        document.getElementById('bulk-bill-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            const res = await post('/api/admin/bills/generate', {
              billing_period: document.getElementById('bg-period').value,
              tariff_id: Number(document.getElementById('bg-tariff').value),
              due_date: document.getElementById('bg-due').value
            });
            toast('Generated ' + res.generated_count + ' bill(s) via C billing engine.', 'success');
            loadAdminTab('billgen');
          } catch (err) { toast(err.message, 'error'); }
        };

        container.querySelectorAll('[data-gen-rid]').forEach((btn) => {
          btn.onclick = async () => {
            btn.disabled = true;
            try {
              const res = await post('/api/admin/bills/generate', {
                reading_id: Number(btn.getAttribute('data-gen-rid')),
                tariff_id: Number(document.getElementById('sb-tariff').value),
                due_date: document.getElementById('sb-due').value
              });
              toast('Generated ' + res.bill.bill_number + ' (' + formatINR(res.bill.total_amount) + ')', 'success');
              loadAdminTab('billgen');
            } catch (err) {
              toast(err.message, 'error');
              btn.disabled = false;
            }
          };
        });
      }

      /* 6. BILL MANAGEMENT */
      else if (tab === 'bills') {
        const cData = await get('/api/admin/customers');
        const customers = cData.customers || [];

        const renderBills = async () => {
          const search = document.getElementById('bill-search').value;
          const status = document.getElementById('bill-status').value;
          const cid = document.getElementById('bill-cust').value;
          const fromDate = document.getElementById('bill-from').value;
          const toDate = document.getElementById('bill-to').value;

          const qs = '?search=' + encodeURIComponent(search || '') +
                     '&status=' + encodeURIComponent(status || '') +
                     '&customer_id=' + encodeURIComponent(cid || '') +
                     '&from_date=' + encodeURIComponent(fromDate || '') +
                     '&to_date=' + encodeURIComponent(toDate || '');

          const d = await get('/api/admin/bills' + qs);
          const bills = d.bills || [];
          const tbody = document.getElementById('bills-tbody');
          tbody.innerHTML = bills.map((b) =>
            '<tr>' +
              '<td class="mono"><strong>' + esc(b.bill_number) + '</strong></td>' +
              '<td>' + esc(b.customer_name) + '<div style="font-size:0.75rem;color:var(--text-muted);" class="mono">' + esc(b.meter_number) + '</div></td>' +
              '<td class="mono">' + esc(b.billing_period) + '</td>' +
              '<td class="mono">' + esc(b.reading_date || '') + '</td>' +
              '<td class="num">' + b.consumption + ' KL</td>' +
              '<td class="num">' + formatINR(b.total_amount) + '</td>' +
              '<td class="num"><strong>' + formatINR(b.balance_due) + '</strong></td>' +
              '<td class="mono">' + esc(b.due_date) + '</td>' +
              '<td>' + statusBadge(b.status) + '</td>' +
              '<td><div class="toolbar-group">' +
                '<button type="button" class="btn btn-secondary btn-sm" data-vinv="' + b.bill_id + '">Invoice</button>' +
                ((b.status === 'unpaid' || b.status === 'overdue')
                  ? '<button type="button" class="btn btn-danger btn-sm" data-cancel-bill="' + b.bill_id + '" data-bnum="' + esc(b.bill_number) + '">Cancel</button>'
                  : '') +
              '</div></td>' +
            '</tr>'
          ).join('') || '<tr><td colspan="10" style="text-align:center;padding:24px;">No matching bills.</td></tr>';

          tbody.querySelectorAll('[data-vinv]').forEach((btn) => {
            btn.onclick = () => window.AquaInvoice.viewInvoice(btn.getAttribute('data-vinv'));
          });
          tbody.querySelectorAll('[data-cancel-bill]').forEach((btn) => {
            btn.onclick = () => {
              const bid = btn.getAttribute('data-cancel-bill');
              const bnum = btn.getAttribute('data-bnum');
              openModal(
                'Cancel Unpaid Bill — ' + bnum,
                '<form id="cancel-bill-form">' +
                  '<p style="margin-top:0;color:var(--text-secondary);">Paid or partially paid bills cannot be cancelled. Provide an audit reason for cancelling ' + esc(bnum) + ':</p>' +
                  '<div class="form-field"><label>Cancellation Reason</label><input class="input" id="cb-reason" required placeholder="e.g. Incorrect meter reading entry" /></div>' +
                  '<div class="modal-actions"><button type="submit" class="btn btn-danger">Confirm Cancellation</button></div>' +
                '</form>'
              );
              document.getElementById('cancel-bill-form').onsubmit = async (e) => {
                e.preventDefault();
                try {
                  await put('/api/admin/bills/' + bid + '/cancel', { reason: document.getElementById('cb-reason').value });
                  closeModal();
                  toast('Bill cancelled and logged.', 'success');
                  renderBills();
                } catch (err) { toast(err.message, 'error'); }
              };
            };
          });
        };

        container.innerHTML =
          '<div class="card">' +
            '<div class="toolbar">' +
              '<div class="toolbar-group">' +
                '<input class="input input-sm" id="bill-search" placeholder="Search bill #, customer, meter..." style="width:210px;" />' +
                '<select class="select input-sm" id="bill-cust" style="width:180px;">' +
                  '<option value="">All Customers</option>' +
                  customers.map((c) => '<option value="' + c.customer_id + '">' + esc(c.name) + '</option>').join('') +
                '</select>' +
                '<select class="select input-sm" id="bill-status" style="width:135px;"><option value="">All Statuses</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select>' +
                '<input type="date" class="input input-sm" id="bill-from" title="From Reading Date" style="width:142px;" />' +
                '<input type="date" class="input input-sm" id="bill-to" title="To Reading Date" style="width:142px;" />' +
                '<button type="button" class="btn btn-ghost btn-sm" id="bill-clear-filters">Reset</button>' +
              '</div>' +
            '</div>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Bill #</th><th>Customer</th><th>Period</th><th>Reading Date</th><th>Usage</th><th>Total</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead><tbody id="bills-tbody"></tbody></table></div>' +
          '</div>';

        document.getElementById('bill-search').oninput = renderBills;
        document.getElementById('bill-cust').onchange = renderBills;
        document.getElementById('bill-status').onchange = renderBills;
        document.getElementById('bill-from').onchange = renderBills;
        document.getElementById('bill-to').onchange = renderBills;
        document.getElementById('bill-clear-filters').onclick = () => {
          document.getElementById('bill-search').value = '';
          document.getElementById('bill-cust').value = '';
          document.getElementById('bill-status').value = '';
          document.getElementById('bill-from').value = '';
          document.getElementById('bill-to').value = '';
          renderBills();
        };
        await renderBills();
      }

      /* 7. PAYMENT MANAGEMENT */
      else if (tab === 'payments') {
        const bData = await get('/api/admin/bills');
        const payableBills = (bData.bills || []).filter((b) => ['unpaid', 'partial', 'overdue'].includes(b.status) && b.balance_due > 0);

        const renderPayments = async () => {
          const search = document.getElementById('pay-search').value;
          const method = document.getElementById('pay-method').value;
          const status = document.getElementById('pay-status').value;
          const pData = await get('/api/admin/payments?search=' + encodeURIComponent(search || '') + '&method=' + encodeURIComponent(method || '') + '&status=' + encodeURIComponent(status || ''));
          const payments = pData.payments || [];
          const tbody = document.getElementById('pay-tbody');
          tbody.innerHTML = payments.map((p) =>
            '<tr>' +
              '<td class="mono">' + esc(p.transaction_reference) + '</td>' +
              '<td class="mono">' + esc(p.bill_number) + '</td>' +
              '<td>' + esc(p.customer_name) + '</td>' +
              '<td>' + esc(p.payment_method) + '</td>' +
              '<td class="num"><strong>' + formatINR(p.amount) + '</strong></td>' +
              '<td class="mono">' + esc(p.payment_date) + '</td>' +
              '<td>' + statusBadge(p.status) + '</td>' +
              '<td><button type="button" class="btn btn-secondary btn-sm" data-pverify="' + p.bill_id + '" data-pref="' + esc(p.transaction_reference) + '" data-pmeth="' + esc(p.payment_method) + '" data-pamt="' + p.amount + '" data-pdate="' + esc(p.payment_date) + '" data-pstat="' + esc(p.status) + '">Verify</button></td>' +
            '</tr>'
          ).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;">No matching payment records.</td></tr>';

          tbody.querySelectorAll('[data-pverify]').forEach((btn) => {
            btn.onclick = async () => {
              const bid = btn.getAttribute('data-pverify');
              const bd = await get('/api/bills/' + bid);
              const bill = bd.bill;
              openModal(
                'Verify Payment Record — ' + btn.getAttribute('data-pref'),
                '<div class="calc-preview-box" style="margin-top:0;">' +
                  '<div class="invoice-total-row"><span>Transaction Reference</span><strong class="mono">' + esc(btn.getAttribute('data-pref')) + '</strong></div>' +
                  '<div class="invoice-total-row"><span>Payment Status</span>' + statusBadge(btn.getAttribute('data-pstat')) + '</div>' +
                  '<div class="invoice-total-row"><span>Payment Method</span><span>' + esc(btn.getAttribute('data-pmeth')) + '</span></div>' +
                  '<div class="invoice-total-row"><span>Settled Amount</span><strong class="num">' + formatINR(Number(btn.getAttribute('data-pamt'))) + '</strong></div>' +
                  '<div class="invoice-total-row"><span>Payment Timestamp</span><span class="mono">' + esc(btn.getAttribute('data-pdate')) + '</span></div>' +
                '</div>' +
                '<h4>Linked Invoice Verification</h4>' +
                '<div class="invoice-total-row"><span>Bill Number</span><strong class="mono">' + esc(bill.bill_number) + '</strong></div>' +
                '<div class="invoice-total-row"><span>Customer</span><span>' + esc(bill.customer_name) + '</span></div>' +
                '<div class="invoice-total-row"><span>Total Billed</span><span class="num">' + formatINR(bill.total_amount) + '</span></div>' +
                '<div class="invoice-total-row"><span>Total Paid on Invoice</span><span class="num">' + formatINR(bill.paid_amount) + '</span></div>' +
                '<div class="invoice-total-row"><span>Remaining Balance</span><strong class="num">' + formatINR(bill.balance_due) + '</strong></div>' +
                '<div class="invoice-total-row"><span>Bill Status</span>' + statusBadge(bill.status) + '</div>'
              );
            };
          });
        };

        container.innerHTML =
          '<div class="grid-2" style="grid-template-columns:1fr 1.7fr;">' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Record Customer Payment</h3>' +
              (payableBills.length ? (
                '<form id="rec-pay-form">' +
                  '<div class="form-field"><label>Open Bill</label><select class="select" id="rp-bill" required>' +
                    payableBills.map((b) => '<option value="' + b.bill_id + '" data-bal="' + b.balance_due + '">' + esc(b.bill_number) + ' — ' + esc(b.customer_name) + ' (Bal: ' + formatINR(b.balance_due) + ')</option>').join('') +
                  '</select></div>' +
                  '<div class="form-field"><label>Payment Amount (₹ INR)</label><input class="input num" id="rp-amount" type="number" step="0.01" min="0.01" required /></div>' +
                  '<div class="form-field"><label>Payment Method</label><select class="select" id="rp-method">' +
                    '<option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash Counter</option>' +
                  '</select></div>' +
                  '<div class="form-field"><label>Transaction Reference (Optional)</label><input class="input mono" id="rp-ref" placeholder="Auto-generated if left blank" /></div>' +
                  '<div class="form-field"><label>Notes</label><input class="input" id="rp-notes" placeholder="Payment remark" /></div>' +
                  '<button type="submit" class="btn btn-primary" style="width:100%;" id="rp-submit-btn"><i data-lucide="check-circle"></i> Record Payment</button>' +
                '</form>'
              ) : '<div class="state-box">No unpaid or overdue bills pending collection.</div>') +
            '</div>' +
            '<div class="card">' +
              '<div class="toolbar">' +
                '<h3 style="margin:0;">Payment Transactions Ledger</h3>' +
                '<div class="toolbar-group">' +
                  '<input class="input input-sm" id="pay-search" placeholder="Search ref, bill, customer..." style="width:185px;" />' +
                  '<select class="select input-sm" id="pay-method" style="width:130px;"><option value="">All Methods</option><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option></select>' +
                  '<select class="select input-sm" id="pay-status" style="width:125px;"><option value="">All Status</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="reversed">Reversed</option></select>' +
                '</div>' +
              '</div>' +
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Reference</th><th>Bill #</th><th>Customer</th><th>Method</th><th>Amount</th><th>Date</th><th>Status</th><th>Verify</th></tr></thead><tbody id="pay-tbody"></tbody></table></div>' +
            '</div>' +
          '</div>';

        document.getElementById('pay-search').oninput = renderPayments;
        document.getElementById('pay-method').onchange = renderPayments;
        document.getElementById('pay-status').onchange = renderPayments;

        const billSel = document.getElementById('rp-bill');
        const amtInput = document.getElementById('rp-amount');
        if (billSel && amtInput) {
          const syncBal = () => {
            const opt = billSel.options[billSel.selectedIndex];
            if (opt) amtInput.value = (Number(opt.getAttribute('data-bal') || 0) / 100).toFixed(2);
          };
          billSel.onchange = syncBal;
          syncBal();

          document.getElementById('rec-pay-form').onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('rp-submit-btn');
            btn.disabled = true;
            try {
              const paise = Math.round(Number(amtInput.value) * 100);
              const payload = {
                bill_id: Number(billSel.value),
                amount: paise,
                payment_method: document.getElementById('rp-method').value,
                notes: document.getElementById('rp-notes').value
              };
              const ref = document.getElementById('rp-ref').value.trim();
              if (ref) payload.transaction_reference = ref;
              const res = await post('/api/admin/payments', payload);
              toast('Payment recorded: ' + res.transaction_reference + ' (' + res.bill_status + ')', 'success');
              loadAdminTab('payments');
            } catch (err) {
              toast(err.message, 'error');
              btn.disabled = false;
            }
          };
        }

        await renderPayments();
      }

      /* 8. REPORTS & ANALYTICS */
      else if (tab === 'reports') {
        const fromPeriod = state.repFrom || '';
        const toPeriod = state.repTo || '';
        const pQs = (fromPeriod || toPeriod)
          ? '?from=' + encodeURIComponent(fromPeriod) + '&to=' + encodeURIComponent(toPeriod)
          : '';

        const [monthly, rev, out, summary] = await Promise.all([
          get('/api/admin/reports/monthly' + pQs),
          get('/api/admin/reports/revenue' + pQs),
          get('/api/admin/reports/outstanding'),
          get('/api/admin/reports/summary' + pQs)
        ]);

        const mRows = monthly.monthly || [];
        const methods = rev.by_method || [];
        const outRows = out.outstanding_bills || [];
        const statusRows = summary.status_breakdown || [];
        const custRows = summary.customer_wise || [];

        container.innerHTML =
          '<div class="card" style="margin-bottom:18px;">' +
            '<div class="toolbar" style="margin-bottom:0;">' +
              '<div class="toolbar-group">' +
                '<strong>Period Filter (YYYY-MM):</strong>' +
                '<input class="input input-sm mono" id="rep-from" placeholder="From e.g. 2026-08" value="' + esc(fromPeriod) + '" style="width:150px;" />' +
                '<input class="input input-sm mono" id="rep-to" placeholder="To e.g. 2026-12" value="' + esc(toPeriod) + '" style="width:150px;" />' +
                '<button type="button" class="btn btn-primary btn-sm" id="rep-apply-btn">Apply</button>' +
                '<button type="button" class="btn btn-ghost btn-sm" id="rep-reset-btn">Reset</button>' +
              '</div>' +
              '<div class="toolbar-group">' +
                '<button type="button" class="btn btn-secondary btn-sm" id="exp-monthly-csv"><i data-lucide="download"></i> Monthly CSV</button>' +
                '<button type="button" class="btn btn-secondary btn-sm" id="exp-cust-csv"><i data-lucide="download"></i> Customer CSV</button>' +
                '<button type="button" class="btn btn-secondary btn-sm" id="exp-out-csv"><i data-lucide="download"></i> Outstanding CSV</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="grid-2">' +
            '<div class="card"><h3 style="margin-top:0;">Revenue Collection by Method</h3><div class="chart-box"><canvas id="rep-method-chart"></canvas></div></div>' +
            '<div class="card"><h3 style="margin-top:0;">Monthly Billing vs. Collection</h3><div class="chart-box"><canvas id="rep-month-chart"></canvas></div></div>' +
          '</div>' +

          '<div class="grid-2">' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Bill Status Breakdown (Paid / Unpaid / Overdue)</h3>' +
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Status</th><th>Bills</th><th>Total Billed</th><th>Paid</th><th>Remaining Due</th></tr></thead><tbody>' +
              (statusRows.map((s) => {
                const rem = s.status === 'cancelled' ? 0 : Math.max(0, Number(s.total_paise || 0) - Number(s.paid_paise || 0));
                return '<tr>' +
                  '<td>' + statusBadge(s.status) + '</td>' +
                  '<td class="num">' + (s.count ?? 0) + '</td>' +
                  '<td class="num">' + formatINR(s.total_paise) + '</td>' +
                  '<td class="num">' + formatINR(s.paid_paise) + '</td>' +
                  '<td class="num"><strong>' + formatINR(rem) + '</strong></td>' +
                '</tr>';
              }).join('') || '<tr><td colspan="5" style="text-align:center;">No bills in selected period.</td></tr>') +
              '</tbody></table></div>' +
            '</div>' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Monthly Financial Summary</h3>' +
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Period</th><th>Bills</th><th>Usage</th><th>Billed</th><th>Collected</th><th>Overdue</th></tr></thead><tbody>' +
              (mRows.map((m) =>
                '<tr>' +
                  '<td class="mono">' + esc(m.billing_period) + '</td>' +
                  '<td class="num">' + m.bills_count + '</td>' +
                  '<td class="num">' + m.total_consumption_kl + ' KL</td>' +
                  '<td class="num">' + formatINR(m.total_billed_paise) + '</td>' +
                  '<td class="num">' + formatINR(m.total_collected_paise) + '</td>' +
                  '<td class="num">' + m.overdue_count + '</td>' +
                '</tr>'
              ).join('') || '<tr><td colspan="6" style="text-align:center;">No monthly records in range.</td></tr>') +
              '</tbody></table></div>' +
            '</div>' +
          '</div>' +

          '<div class="card" style="margin-bottom:20px;">' +
            '<h3 style="margin-top:0;">Customer-Wise Billing &amp; Consumption Summary</h3>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Bills</th><th>Consumption</th><th>Total Billed</th><th>Total Paid</th><th>Outstanding</th></tr></thead><tbody>' +
            (custRows.map((c) =>
              '<tr>' +
                '<td><strong>' + esc(c.customer_name || c.name) + '</strong><div style="font-size:0.76rem;color:var(--text-muted);">' + esc(c.email) + '</div></td>' +
                '<td class="num">' + c.bills_count + '</td>' +
                '<td class="num">' + c.total_consumption_kl + ' KL</td>' +
                '<td class="num">' + formatINR(c.total_billed_paise) + '</td>' +
                '<td class="num">' + formatINR(c.total_collected_paise) + '</td>' +
                '<td class="num"><strong>' + formatINR(c.outstanding_paise) + '</strong></td>' +
              '</tr>'
            ).join('') || '<tr><td colspan="6" style="text-align:center;">No customer billing data.</td></tr>') +
            '</tbody></table></div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="toolbar"><h3 style="margin:0;">Outstanding Aging Balances (' + formatINR(out.total_outstanding_paise) + ')</h3></div>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Bill #</th><th>Customer</th><th>Period</th><th>Total</th><th>Paid</th><th>Balance Due</th><th>Due Date</th><th>Status</th></tr></thead><tbody>' +
            (outRows.map((b) =>
              '<tr>' +
                '<td class="mono">' + esc(b.bill_number) + '</td>' +
                '<td>' + esc(b.customer_name) + '</td>' +
                '<td class="mono">' + esc(b.billing_period) + '</td>' +
                '<td class="num">' + formatINR(b.total_amount) + '</td>' +
                '<td class="num">' + formatINR(b.paid_amount) + '</td>' +
                '<td class="num"><strong>' + formatINR(b.balance_due) + '</strong></td>' +
                '<td class="mono">' + esc(b.due_date) + '</td>' +
                '<td>' + statusBadge(b.status) + '</td>' +
              '</tr>'
            ).join('') || '<tr><td colspan="8" style="text-align:center;padding:24px;">Zero outstanding bills!</td></tr>') +
            '</tbody></table></div>' +
          '</div>';

        window.AquaCharts.renderMethodDoughnut(
          'rep-method-chart',
          methods.map((m) => m.payment_method),
          methods.map((m) => Math.round(m.total_paise / 100))
        );
        window.AquaCharts.renderBarLineRevenue(
          'rep-month-chart',
          mRows.map((m) => m.billing_period),
          mRows.map((m) => Math.round(m.total_billed_paise / 100)),
          mRows.map((m) => Math.round(m.total_collected_paise / 100))
        );

        document.getElementById('rep-apply-btn').onclick = () => {
          state.repFrom = document.getElementById('rep-from').value.trim();
          state.repTo = document.getElementById('rep-to').value.trim();
          loadAdminTab('reports');
        };
        document.getElementById('rep-reset-btn').onclick = () => {
          state.repFrom = '';
          state.repTo = '';
          loadAdminTab('reports');
        };

        document.getElementById('exp-monthly-csv').onclick = () => {
          downloadCSV(
            'aquabill-monthly-report.csv',
            ['Billing Period', 'Bills Count', 'Consumption (KL)', 'Total Billed (INR)', 'Total Collected (INR)', 'Overdue Count'],
            mRows.map((m) => [m.billing_period, m.bills_count, m.total_consumption_kl, (m.total_billed_paise / 100).toFixed(2), (m.total_collected_paise / 100).toFixed(2), m.overdue_count])
          );
        };
        document.getElementById('exp-cust-csv').onclick = () => {
          downloadCSV(
            'aquabill-customer-summary.csv',
            ['Customer Name', 'Email', 'Bills Count', 'Consumption (KL)', 'Total Billed (INR)', 'Total Collected (INR)', 'Outstanding (INR)'],
            custRows.map((c) => [c.customer_name || c.name, c.email, c.bills_count, c.total_consumption_kl, (c.total_billed_paise / 100).toFixed(2), (c.total_collected_paise / 100).toFixed(2), (c.outstanding_paise / 100).toFixed(2)])
          );
        };
        document.getElementById('exp-out-csv').onclick = () => {
          downloadCSV(
            'aquabill-outstanding-report.csv',
            ['Bill Number', 'Customer', 'Email', 'Period', 'Total (INR)', 'Paid (INR)', 'Balance Due (INR)', 'Due Date', 'Status'],
            outRows.map((b) => [b.bill_number, b.customer_name, b.customer_email, b.billing_period, (b.total_amount / 100).toFixed(2), (b.paid_amount / 100).toFixed(2), (b.balance_due / 100).toFixed(2), b.due_date, b.status])
          );
        };
      }

      /* 9. TARIFF MANAGEMENT */
      else if (tab === 'tariffs') {
        const data = await get('/api/admin/tariffs');
        const tariffs = data.tariffs || [];
        container.innerHTML =
          '<div class="card">' +
            '<div class="toolbar">' +
              '<div><h3 style="margin:0;">Water Tariff Schedules (Fixed-Point Paise)</h3><div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">Tariff edits apply strictly to future bill generation; historical issued bills remain immutable.</div></div>' +
              '<button type="button" class="btn btn-primary btn-sm" id="add-tariff-btn"><i data-lucide="plus"></i> Create Tariff</button>' +
            '</div>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Mode</th><th>Rate / KL</th><th>Fixed Charge</th><th>Tax %</th><th>Slab Config</th><th>Effective</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
            tariffs.map((t) =>
              '<tr>' +
                '<td><strong>' + esc(t.name) + '</strong></td>' +
                '<td>' + esc(t.billing_mode) + '</td>' +
                '<td class="num">' + formatINR(t.rate_per_kl) + '</td>' +
                '<td class="num">' + formatINR(t.fixed_charge) + '</td>' +
                '<td class="num">' + (Number(t.tax_percentage || 0) / 100).toFixed(2) + '%</td>' +
                '<td class="mono" style="font-size:0.75rem;">' + esc(t.slab_config || 'Flat rate') + '</td>' +
                '<td class="mono">' + esc(t.effective_from) + '</td>' +
                '<td>' + statusBadge(t.status) + '</td>' +
                '<td><div class="toolbar-group">' +
                  '<button type="button" class="btn btn-secondary btn-sm" data-edit-tid="' + t.tariff_id + '">Edit</button>' +
                  (t.status !== 'active'
                    ? '<button type="button" class="btn btn-primary btn-sm" data-act-tid="' + t.tariff_id + '">Activate</button>'
                    : '<span style="color:var(--success);font-size:0.78rem;font-weight:700;">Default</span>') +
                '</div></td>' +
              '</tr>'
            ).join('') +
            '</tbody></table></div>' +
          '</div>';

        container.querySelectorAll('[data-edit-tid]').forEach((btn) => {
          btn.onclick = () => {
            const tid = Number(btn.getAttribute('data-edit-tid'));
            const t = tariffs.find((x) => x.tariff_id === tid);
            if (!t) return;
            openModal(
              'Edit Tariff Schedule — ' + t.name,
              '<form id="edit-tariff-form">' +
                '<div class="form-field"><label>Plan Name</label><input class="input" id="et-name" value="' + esc(t.name) + '" required /></div>' +
                '<div class="form-grid">' +
                  '<div class="form-field"><label>Billing Mode</label><select class="select" id="et-mode">' +
                    '<option value="flat" ' + (t.billing_mode === 'flat' ? 'selected' : '') + '>Flat Rate</option>' +
                    '<option value="slab" ' + (t.billing_mode === 'slab' ? 'selected' : '') + '>Progressive Slab</option>' +
                  '</select></div>' +
                  '<div class="form-field"><label>Rate per KL (₹ INR)</label><input class="input num" id="et-rate" type="number" step="0.01" value="' + (t.rate_per_kl / 100).toFixed(2) + '" required /></div>' +
                  '<div class="form-field"><label>Fixed Service Charge (₹ INR)</label><input class="input num" id="et-fixed" type="number" step="0.01" value="' + (t.fixed_charge / 100).toFixed(2) + '" required /></div>' +
                  '<div class="form-field"><label>Tax Percentage (%)</label><input class="input num" id="et-tax" type="number" step="0.01" value="' + (Number(t.tax_percentage || 0) / 100).toFixed(2) + '" required /></div>' +
                  '<div class="form-field full"><label>Slab Config (paise per KL e.g. 0-10:500,11-20:800,21-30:1200,31+:1500)</label><input class="input mono" id="et-slabs" value="' + esc(t.slab_config || '') + '" /></div>' +
                '</div>' +
                '<div class="modal-actions"><button type="submit" class="btn btn-primary">Save Tariff Rates</button></div>' +
              '</form>'
            );
            document.getElementById('edit-tariff-form').onsubmit = async (e) => {
              e.preventDefault();
              try {
                await put('/api/admin/tariffs/' + tid, {
                  name: document.getElementById('et-name').value,
                  billing_mode: document.getElementById('et-mode').value,
                  rate_per_kl: Math.round(Number(document.getElementById('et-rate').value) * 100),
                  fixed_charge: Math.round(Number(document.getElementById('et-fixed').value) * 100),
                  tax_percentage: Math.round(Number(document.getElementById('et-tax').value) * 100),
                  slab_config: document.getElementById('et-slabs').value
                });
                closeModal();
                toast('Tariff updated for future billing.', 'success');
                loadAdminTab('tariffs');
              } catch (err) { toast(err.message, 'error'); }
            };
          };
        });

        container.querySelectorAll('[data-act-tid]').forEach((btn) => {
          btn.onclick = () => {
            const tid = btn.getAttribute('data-act-tid');
            confirmDialog('Activate Tariff', 'Setting this tariff active will deactivate the previous active tariff for future bill generation.', 'Activate Tariff', async () => {
              await put('/api/admin/tariffs/' + tid, { status: 'active' });
              toast('Active tariff updated.', 'success');
              loadAdminTab('tariffs');
            });
          };
        });

        document.getElementById('add-tariff-btn').onclick = () => {
          openModal(
            'Create Water Tariff Plan',
            '<form id="new-tariff-form">' +
              '<div class="form-field"><label>Plan Name</label><input class="input" id="nt-name" required placeholder="e.g. Summer Conservation Tariff" /></div>' +
              '<div class="form-grid">' +
                '<div class="form-field"><label>Billing Mode</label><select class="select" id="nt-mode"><option value="flat">Flat Rate</option><option value="slab">Progressive Slab</option></select></div>' +
                '<div class="form-field"><label>Effective From</label><input class="input" id="nt-eff" type="date" value="2026-12-01" required /></div>' +
                '<div class="form-field"><label>Rate per KL (₹ INR)</label><input class="input num" id="nt-rate" type="number" step="0.01" value="10.00" required /></div>' +
                '<div class="form-field"><label>Fixed Charge (₹ INR)</label><input class="input num" id="nt-fixed" type="number" step="0.01" value="50.00" required /></div>' +
                '<div class="form-field"><label>Tax Percentage (%)</label><input class="input num" id="nt-tax" type="number" step="0.01" value="0.00" required /></div>' +
                '<div class="form-field"><label>Slab Config (paise if slab)</label><input class="input mono" id="nt-slabs" placeholder="0-10:800,11-20:1200,21+:1600" /></div>' +
              '</div>' +
              '<div class="modal-actions"><button type="submit" class="btn btn-primary">Create Tariff</button></div>' +
            '</form>'
          );
          document.getElementById('new-tariff-form').onsubmit = async (e) => {
            e.preventDefault();
            try {
              await post('/api/admin/tariffs', {
                name: document.getElementById('nt-name').value,
                billing_mode: document.getElementById('nt-mode').value,
                rate_per_kl: Math.round(Number(document.getElementById('nt-rate').value) * 100),
                fixed_charge: Math.round(Number(document.getElementById('nt-fixed').value) * 100),
                tax_percentage: Math.round(Number(document.getElementById('nt-tax').value) * 100),
                slab_config: document.getElementById('nt-slabs').value,
                effective_from: document.getElementById('nt-eff').value,
                activate: false
              });
              closeModal();
              toast('Tariff created.', 'success');
              loadAdminTab('tariffs');
            } catch (err) { toast(err.message, 'error'); }
          };
        };
      }

      /* 10. NOTIFICATIONS & AUDIT LOGS */
      else if (tab === 'notifications') {
        const [cData, aData] = await Promise.all([
          get('/api/admin/customers'),
          get('/api/admin/audit-logs')
        ]);
        const customers = cData.customers || [];
        const logs = aData.audit_logs || [];

        const renderNotifs = async (typeFilter) => {
          const nData = await get('/api/admin/notifications' + (typeFilter ? '?type=' + encodeURIComponent(typeFilter) : ''));
          const list = nData.notifications || [];
          const listEl = document.getElementById('adm-notif-list');
          listEl.innerHTML = list.length
            ? list.map((n) =>
                '<div class="preview-row" style="margin-bottom:8px;">' +
                  '<div>' +
                    '<div style="font-weight:600;">' + esc(n.message) + '</div>' +
                    '<div style="font-size:0.76rem;color:var(--text-muted);">' +
                      (n.recipient_name ? 'To: <strong>' + esc(n.recipient_name) + '</strong> &bull; ' : '') +
                      '<span class="mono">' + esc(n.type) + '</span> &bull; ' + esc(n.created_at) +
                    '</div>' +
                  '</div>' +
                  (!n.is_read
                    ? '<button type="button" class="btn btn-secondary btn-sm" data-adm-read="' + n.notification_id + '">Mark Read</button>'
                    : '<span class="badge badge-muted">Read</span>') +
                '</div>'
              ).join('')
            : '<div class="state-box">No notifications matching filter.</div>';

          listEl.querySelectorAll('[data-adm-read]').forEach((btn) => {
            btn.onclick = async () => {
              await put('/api/admin/notifications/' + btn.getAttribute('data-adm-read') + '/read', {});
              renderNotifs(document.getElementById('notif-type-filter').value);
            };
          });
        };

        container.innerHTML =
          '<div class="grid-2">' +
            '<div class="card">' +
              '<div class="toolbar"><h3 style="margin:0;">Dispatch Customer Notification</h3><button type="button" class="btn btn-secondary btn-sm" id="send-reminders-btn"><i data-lucide="bell-ring"></i> Auto Due Reminders</button></div>' +
              '<form id="send-notif-form">' +
                '<div class="form-grid">' +
                  '<div class="form-field"><label>Recipient</label><select class="select" id="sn-cust">' +
                    '<option value="0">Broadcast to All Active Customers</option>' +
                    customers.map((c) => '<option value="' + c.customer_id + '">' + esc(c.name) + '</option>').join('') +
                  '</select></div>' +
                  '<div class="form-field"><label>Notification Type</label><select class="select" id="sn-type">' +
                    '<option value="due_reminder">Due Reminder</option><option value="overdue_alert">Overdue Alert</option><option value="account_update">Utility Announcement</option>' +
                  '</select></div>' +
                '</div>' +
                '<div class="form-field"><label>Message</label><textarea class="textarea" id="sn-msg" rows="3" required placeholder="Enter notice regarding water supply schedule, tariff update, or bill due date..."></textarea></div>' +
                '<button type="submit" class="btn btn-primary"><i data-lucide="send"></i> Send Notification</button>' +
              '</form>' +
            '</div>' +
            '<div class="card">' +
              '<div class="toolbar">' +
                '<h3 style="margin:0;">System Alerts &amp; Notices</h3>' +
                '<div class="toolbar-group">' +
                  '<select class="select input-sm" id="notif-type-filter" style="width:160px;">' +
                    '<option value="">All Types</option>' +
                    '<option value="payment_received">Payment Received</option>' +
                    '<option value="overdue_alert">Overdue Alert</option>' +
                    '<option value="due_reminder">Due Reminder</option>' +
                    '<option value="account_update">Account Update</option>' +
                  '</select>' +
                  '<button type="button" class="btn btn-ghost btn-sm" id="adm-read-all-btn">Mark All Read</button>' +
                '</div>' +
              '</div>' +
              '<div id="adm-notif-list" style="max-height:360px;overflow-y:auto;"></div>' +
            '</div>' +
          '</div>' +
          '<div class="card">' +
            '<h3 style="margin-top:0;">Compliance &amp; Audit Trail</h3>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Details</th></tr></thead><tbody>' +
            logs.slice(0, 20).map((l) =>
              '<tr><td class="mono" style="font-size:0.74rem;">' + esc(l.created_at) + '</td><td>' + esc(l.actor_name) + '</td><td class="mono">' + esc(l.action) + '</td><td>' + esc(l.details) + '</td></tr>'
            ).join('') +
            '</tbody></table></div>' +
          '</div>';

        document.getElementById('notif-type-filter').onchange = (e) => renderNotifs(e.target.value);
        document.getElementById('adm-read-all-btn').onclick = async () => {
          await put('/api/admin/notifications/read-all', {});
          toast('All notifications marked read.', 'success');
          renderNotifs(document.getElementById('notif-type-filter').value);
        };
        document.getElementById('send-reminders-btn').onclick = async () => {
          const res = await post('/api/admin/notifications/remind', {});
          toast('Sent ' + res.reminders_sent + ' due reminder notification(s).', 'success');
          renderNotifs(document.getElementById('notif-type-filter').value);
        };
        document.getElementById('send-notif-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            const res = await post('/api/admin/notifications/send', {
              customer_id: Number(document.getElementById('sn-cust').value),
              type: document.getElementById('sn-type').value,
              message: document.getElementById('sn-msg').value
            });
            toast('Dispatched ' + res.sent_count + ' notification(s).', 'success');
            document.getElementById('sn-msg').value = '';
            renderNotifs(document.getElementById('notif-type-filter').value);
          } catch (err) { toast(err.message, 'error'); }
        };

        await renderNotifs('');
      }

      /* 11. ADMIN PROFILE */
      else if (tab === 'profile') {
        const data = await get('/api/admin/profile');
        const u = data.user;
        container.innerHTML =
          '<div class="grid-2">' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Administrator Account</h3>' +
              '<form id="adm-prof-form">' +
                '<div class="form-field"><label>Administrator Name</label><input class="input" id="ap-name" value="' + esc(u.name) + '" required /></div>' +
                '<div class="form-field"><label>Email</label><input class="input" value="' + esc(u.email) + '" disabled /></div>' +
                '<div class="form-field"><label>Role</label><input class="input" value="ADMIN (Utility Administrator)" disabled /></div>' +
                '<div class="toolbar-group">' +
                  '<button type="submit" class="btn btn-primary">Save Name</button>' +
                  '<button type="button" class="btn btn-danger" id="prof-logout-btn"><i data-lucide="log-out"></i> Logout</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Change Password</h3>' +
              '<form id="adm-pw-form">' +
                '<div class="form-field"><label>Current Password</label><input class="input" type="password" id="ap-cur" required /></div>' +
                '<div class="form-field"><label>New Password (min 8 chars)</label><input class="input" type="password" id="ap-new" minlength="8" required /></div>' +
                '<button type="submit" class="btn btn-secondary">Update Password</button>' +
              '</form>' +
            '</div>' +
          '</div>';

        document.getElementById('prof-logout-btn').onclick = () => window.AquaApp.logout();
        document.getElementById('adm-prof-form').onsubmit = async (e) => {
          e.preventDefault();
          await put('/api/admin/profile', { name: document.getElementById('ap-name').value });
          state.user.name = document.getElementById('ap-name').value;
          toast('Admin profile updated.', 'success');
          renderAdminPortal();
        };
        document.getElementById('adm-pw-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            await put('/api/admin/profile/password', {
              current_password: document.getElementById('ap-cur').value,
              new_password: document.getElementById('ap-new').value
            });
            e.target.reset();
            toast('Password updated successfully.', 'success');
          } catch (err) { toast(err.message, 'error'); }
        };
      }

      hydrateIcons();
    } catch (err) {
      container.innerHTML = '<div class="state-box"><h4>Error loading section</h4><p>' + esc(err.message) + '</p></div>';
    }
  }

  function adminKpiCard(title, value, foot, icon, tone) {
    return (
      '<div class="admin-kpi-card ' + (tone || '') + '">' +
        '<div class="kpi-head"><span>' + title + '</span><span class="admin-kpi-icon"><i data-lucide="' + icon + '"></i></span></div>' +
        '<div class="kpi-val num">' + value + '</div>' +
        '<div class="kpi-foot">' + foot + '</div>' +
      '</div>'
    );
  }

  window.AquaAdmin = { renderAdminPortal };
})();
