(function () {
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'profile', label: 'My Profile', icon: 'user' },
    { id: 'meter', label: 'My Meter', icon: 'gauge' },
    { id: 'consumption', label: 'Water Consumption', icon: 'activity' },
    { id: 'bills', label: 'My Bills', icon: 'receipt' },
    { id: 'payments', label: 'Payment History', icon: 'credit-card' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' }
  ];

  async function renderCustomerPortal() {
    const { state, toggleTheme, hydrateIcons } = window.AquaState;
    const { esc } = window.AquaAPI;
    const root = document.getElementById('app-root');

    const activeTab = state.portalTab || 'dashboard';
    const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];
    const firstName = (state.user.name || 'Customer').split(' ')[0];
    const initials = (state.user.name || 'CU').split(' ').map((s) => s.charAt(0)).join('').slice(0, 2).toUpperCase();

    root.innerHTML =
      '<div class="portal-outer">' +
        '<div class="portal-shell">' +
          '<div class="sidebar-backdrop ' + (state.sidebarOpen ? 'open' : '') + '" id="cust-backdrop"></div>' +
          '<aside class="sidebar ' + (state.sidebarOpen ? 'open' : '') + '" id="cust-sidebar">' +
            '<div>' +
              '<div class="sidebar-brand">' +
                '<div class="sidebar-brand-left">' +
                  '<span class="frosted-droplet" style="width:38px;height:38px;"><i data-lucide="droplets"></i></span>' +
                  '<span class="sidebar-wordmark">AQUA</span>' +
                '</div>' +
                '<span class="sidebar-role-tag">Customer</span>' +
              '</div>' +
              '<nav class="sidebar-nav" aria-label="Customer Navigation">' +
                NAV_ITEMS.map((item) =>
                  '<button type="button" class="nav-item ' + (activeTab === item.id ? 'active' : '') + '" data-ctab="' + item.id + '">' +
                    '<span class="nav-item-left"><i data-lucide="' + item.icon + '"></i><span>' + item.label + '</span></span>' +
                    (item.id === 'notifications' && state.unreadCount > 0 ? '<span class="nav-badge">' + state.unreadCount + '</span>' : '') +
                  '</button>'
                ).join('') +
              '</nav>' +
            '</div>' +
            '<div class="sidebar-bottom">' +
              '<div class="sidebar-status-box">' +
                '<div style="font-weight:700;margin-bottom:2px;">' + esc(state.user.name) + '</div>' +
                '<div style="opacity:0.82;font-size:0.72rem;word-break:break-all;">' + esc(state.user.email) + '</div>' +
              '</div>' +
              '<button type="button" class="sidebar-logout-btn" id="cust-logout-btn">' +
                '<i data-lucide="log-out"></i>' +
                '<span>Logout</span>' +
              '</button>' +
            '</div>' +
          '</aside>' +
          '<div class="portal-main">' +
            '<header class="topbar">' +
              '<div class="topbar-left">' +
                '<button type="button" class="icon-btn mobile-menu-btn" id="cust-menu-btn" aria-label="Menu"><i data-lucide="menu"></i></button>' +
                '<div>' +
                  '<h1 class="topbar-title">' + (activeTab === 'dashboard' ? 'Welcome back, ' + esc(firstName) : esc(currentNav.label)) + '</h1>' +
                  '<div class="topbar-sub">' + (activeTab === 'dashboard' ? "Let's use water consciously" : 'Customer Self-Service Utility Portal') + '</div>' +
                '</div>' +
              '</div>' +
              '<div class="topbar-right">' +
                '<div class="search-pill-wrap">' +
                  '<i data-lucide="search"></i>' +
                  '<input type="search" class="search-pill" id="cust-global-search" placeholder="Search bills or readings..." aria-label="Search bills or readings" />' +
                '</div>' +
                '<button type="button" class="icon-btn" id="cust-notif-quick" title="View Alerts" aria-label="Notifications">' +
                  '<i data-lucide="bell"></i>' +
                  (state.unreadCount > 0 ? '<span class="notif-dot"></span>' : '') +
                '</button>' +
                '<button type="button" class="icon-btn" id="cust-theme-btn" title="Toggle Light/Dark Mode" aria-label="Toggle theme">' +
                  '<i data-lucide="' + (state.theme === 'dark' ? 'sun' : 'moon') + '"></i>' +
                '</button>' +
                '<button type="button" class="avatar-pill" id="cust-avatar-btn" title="My Profile">' +
                  '<span class="avatar-circle">' + esc(initials) + '</span>' +
                  '<span>' + esc(firstName) + '</span>' +
                '</button>' +
              '</div>' +
            '</header>' +
            '<main class="portal-content" id="cust-view-body"><div class="state-box"><div class="spinner" style="margin:0 auto;"></div><p>Loading...</p></div></main>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.querySelectorAll('[data-ctab]').forEach((btn) => {
      btn.onclick = () => {
        state.portalTab = btn.getAttribute('data-ctab');
        state.sidebarOpen = false;
        renderCustomerPortal();
      };
    });

    document.getElementById('cust-logout-btn').onclick = () => window.AquaApp.logout();
    const menuBtn = document.getElementById('cust-menu-btn');
    const backdrop = document.getElementById('cust-backdrop');
    if (menuBtn) menuBtn.onclick = () => { state.sidebarOpen = true; renderCustomerPortal(); };
    if (backdrop) backdrop.onclick = () => { state.sidebarOpen = false; renderCustomerPortal(); };
    document.getElementById('cust-theme-btn').onclick = () => { toggleTheme(); renderCustomerPortal(); };
    document.getElementById('cust-notif-quick').onclick = () => { state.portalTab = 'notifications'; renderCustomerPortal(); };
    document.getElementById('cust-avatar-btn').onclick = () => { state.portalTab = 'profile'; renderCustomerPortal(); };

    const gSearch = document.getElementById('cust-global-search');
    if (gSearch) {
      gSearch.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const q = gSearch.value.trim().toLowerCase();
          if (q.includes('meter') || q.includes('read')) state.portalTab = 'meter';
          else if (q.includes('pay')) state.portalTab = 'payments';
          else if (q.includes('alert') || q.includes('notif')) state.portalTab = 'notifications';
          else state.portalTab = 'bills';
          renderCustomerPortal();
        }
      };
    }

    hydrateIcons();
    await loadCustomerTab(activeTab);
    hydrateIcons();
  }

  async function loadCustomerTab(tab) {
    const container = document.getElementById('cust-view-body');
    const { get, put, formatINR, esc, statusBadge } = window.AquaAPI;
    const { state, toast } = window.AquaState;

    try {
      if (tab === 'dashboard') {
        const [dash, cons, billsData, readingsData, notifData] = await Promise.all([
          get('/api/dashboard'),
          get('/api/reports/consumption'),
          get('/api/bills'),
          get('/api/readings'),
          get('/api/notifications')
        ]);
        state.unreadCount = dash.unread_notifications || 0;
        const recentBills = (billsData.bills || []).slice(0, 4);
        const readings = (readingsData.readings || []).slice(0, 4);
        const notifs = (notifData.notifications || []).slice(0, 3);
        const trend = cons.trend || [];

        const activityItems = [];
        notifs.forEach((n) => {
          activityItems.push({
            warn: n.type === 'alert' || n.type === 'overdue' || /leak|overdue|due/i.test(n.message),
            title: n.message,
            sub: (n.type || 'alert').toUpperCase(),
            time: (n.created_at || '').slice(0, 10)
          });
        });
        readings.forEach((r) => {
          activityItems.push({
            warn: r.consumption >= 35,
            title: 'Meter ' + r.meter_number + ' · ' + r.billing_period,
            sub: (r.consumption * 1000).toLocaleString('en-IN') + ' Ltrs. (' + r.consumption + ' KL)',
            time: r.reading_date
          });
        });

        const days = [
          { num: 16, name: 'Thu' }, { num: 17, name: 'Fri' }, { num: 18, name: 'Sat' },
          { num: 19, name: 'Sun' }, { num: 20, name: 'Mon' }, { num: 21, name: 'Tue' }
        ];
        if (!state.selectedCalDay) state.selectedCalDay = 17;

        container.innerHTML =
          '<div class="dash-split">' +
            '<div class="dash-left-col">' +
              '<div class="kpi-grid">' +
                kpiCard('Active Meters', dash.active_meters, 'Assigned connections', 'gauge') +
                kpiCard('Latest Usage', dash.latest_consumption_kl + ' KL', (dash.latest_consumption_kl * 1000).toLocaleString('en-IN') + ' Litres', 'droplet') +
                kpiCard('Outstanding Due', formatINR(dash.outstanding_paise), dash.unpaid_bills_count + ' pending bill(s)', 'alert-circle') +
                kpiCard('Total Paid', formatINR(dash.total_paid_paise), 'Verified settlements', 'check-circle-2') +
              '</div>' +
              '<div class="card">' +
                '<div class="chart-head">' +
                  '<h3>Water Usage - Monthly Metering</h3>' +
                  '<span style="font-size:0.78rem;color:var(--text-muted);font-weight:600;">Kilolitres (KL)</span>' +
                '</div>' +
                '<div class="chart-box"><canvas id="cust-bar-chart"></canvas></div>' +
              '</div>' +
              '<div class="card">' +
                '<div class="chart-head">' +
                  '<h3>Usage &amp; Conservation Target</h3>' +
                  '<span style="font-size:0.78rem;color:var(--text-muted);font-weight:600;">Recent Periods</span>' +
                '</div>' +
                '<div class="chart-box"><canvas id="cust-dash-chart"></canvas></div>' +
              '</div>' +
              '<div class="card">' +
                '<div class="toolbar" style="margin-bottom:12px;">' +
                  '<h3 style="margin:0;font-size:1.02rem;font-weight:800;">Recent Water Bills</h3>' +
                  '<button type="button" class="btn btn-secondary btn-sm" id="cust-all-bills-btn">View All Bills</button>' +
                '</div>' +
                (recentBills.length ? (
                  '<div class="table-wrap"><table class="data-table"><thead><tr><th>Bill #</th><th>Period</th><th>Usage</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>' +
                  recentBills.map((b) =>
                    '<tr>' +
                      '<td class="mono">' + esc(b.bill_number) + '</td>' +
                      '<td class="mono">' + esc(b.billing_period) + '</td>' +
                      '<td class="num">' + esc(b.consumption) + ' KL</td>' +
                      '<td class="num"><strong>' + formatINR(b.total_amount) + '</strong></td>' +
                      '<td>' + statusBadge(b.status) + '</td>' +
                      '<td><button type="button" class="btn btn-secondary btn-sm" data-view-bill="' + b.bill_id + '">Invoice</button></td>' +
                    '</tr>'
                  ).join('') +
                  '</tbody></table></div>'
                ) : '<div class="state-box">No bills generated yet.</div>') +
              '</div>' +
            '</div>' +
            '<aside class="activity-panel">' +
              '<div class="activity-header">' +
                '<div><h3>Usage Activity</h3><span style="font-size:0.78rem;color:var(--text-muted);font-weight:600;">Recent Meter &amp; Alert Log</span></div>' +
                '<span class="badge badge-info">' + activityItems.length + ' updates</span>' +
              '</div>' +
              '<div class="mini-calendar-ribbon">' +
                days.map((d) =>
                  '<button type="button" class="cal-day-btn ' + (state.selectedCalDay === d.num ? 'active' : '') + '" data-calday="' + d.num + '">' +
                    '<span class="cal-day-num">' + d.num + '</span>' +
                    '<span class="cal-day-name">' + d.name + '</span>' +
                  '</button>'
                ).join('') +
              '</div>' +
              '<div class="activity-list">' +
                (activityItems.length ? activityItems.map((act) =>
                  '<div class="activity-item ' + (act.warn ? 'highlight' : '') + '">' +
                    '<div class="activity-icon-circle ' + (act.warn ? 'warn' : '') + '"><i data-lucide="' + (act.warn ? 'alert-triangle' : 'droplet') + '"></i></div>' +
                    '<div class="activity-meta">' +
                      '<div class="activity-title">' + esc(act.title) + '</div>' +
                      '<div class="activity-sub">' + esc(act.sub) + '</div>' +
                    '</div>' +
                    '<div class="activity-time mono">' + esc(act.time) + '</div>' +
                  '</div>'
                ).join('') : '<div class="state-box">No recent meter activity recorded.</div>') +
              '</div>' +
              '<button type="button" class="btn btn-primary" style="width:100%;" id="cust-panel-bills-btn"><i data-lucide="receipt"></i> Inspect My Water Bills</button>' +
            '</aside>' +
          '</div>';

        const barCanvas = document.getElementById('cust-bar-chart');
        if (barCanvas && window.Chart) {
          window.AquaCharts.renderConsumptionBar(
            'cust-bar-chart',
            trend.map((t) => t.billing_period),
            trend.map((t) => t.total_kl)
          );
        }
        window.AquaCharts.renderConsumptionLine(
          'cust-dash-chart',
          trend.map((t) => t.billing_period),
          trend.map((t) => t.total_kl),
          'My Water Usage (KL)'
        );
        container.querySelectorAll('[data-view-bill]').forEach((b) => {
          b.onclick = () => window.AquaInvoice.viewInvoice(b.getAttribute('data-view-bill'));
        });
        container.querySelectorAll('[data-calday]').forEach((btn) => {
          btn.onclick = () => {
            state.selectedCalDay = Number(btn.getAttribute('data-calday'));
            container.querySelectorAll('[data-calday]').forEach((el) => el.classList.remove('active'));
            btn.classList.add('active');
          };
        });
        const allBillsBtn = document.getElementById('cust-all-bills-btn');
        if (allBillsBtn) allBillsBtn.onclick = () => { state.portalTab = 'bills'; renderCustomerPortal(); };
        const panelBillsBtn = document.getElementById('cust-panel-bills-btn');
        if (panelBillsBtn) panelBillsBtn.onclick = () => { state.portalTab = 'bills'; renderCustomerPortal(); };
      } else if (tab === 'profile') {
        const data = await get('/api/profile');
        const u = data.user;
        container.innerHTML =
          '<div class="grid-2">' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Contact &amp; Service Profile</h3>' +
              '<form id="cust-profile-form">' +
                '<div class="form-field"><label>Full Name</label><input class="input" id="cp-name" value="' + esc(u.name) + '" required /></div>' +
                '<div class="form-field"><label>Email Address (Read-only)</label><input class="input" value="' + esc(u.email) + '" disabled /></div>' +
                '<div class="form-field"><label>Phone Number</label><input class="input" id="cp-phone" value="' + esc(u.phone || '') + '" required /></div>' +
                '<div class="form-field"><label>Service Address</label><input class="input" id="cp-address" value="' + esc(u.address || '') + '" required /></div>' +
                '<button type="submit" class="btn btn-primary">Save Profile Changes</button>' +
              '</form>' +
            '</div>' +
            '<div class="card">' +
              '<h3 style="margin-top:0;">Change Password</h3>' +
              '<form id="cust-pw-form">' +
                '<div class="form-field"><label>Current Password</label><input class="input" type="password" id="cp-cur-pw" required /></div>' +
                '<div class="form-field"><label>New Password (min 8 chars)</label><input class="input" type="password" id="cp-new-pw" minlength="8" required /></div>' +
                '<button type="submit" class="btn btn-secondary">Update Password</button>' +
              '</form>' +
            '</div>' +
          '</div>';

        document.getElementById('cust-profile-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            await put('/api/profile', {
              name: document.getElementById('cp-name').value,
              phone: document.getElementById('cp-phone').value,
              address: document.getElementById('cp-address').value
            });
            state.user.name = document.getElementById('cp-name').value;
            toast('Profile updated successfully.', 'success');
          } catch (err) { toast(err.message, 'error'); }
        };
        document.getElementById('cust-pw-form').onsubmit = async (e) => {
          e.preventDefault();
          try {
            await put('/api/profile/password', {
              current_password: document.getElementById('cp-cur-pw').value,
              new_password: document.getElementById('cp-new-pw').value
            });
            e.target.reset();
            toast('Password changed successfully.', 'success');
          } catch (err) { toast(err.message, 'error'); }
        };
      } else if (tab === 'meter') {
        const [mData, rData] = await Promise.all([get('/api/meters'), get('/api/readings')]);
        const meters = mData.meters || [];
        const readings = rData.readings || [];
        container.innerHTML =
          '<div class="card" style="margin-bottom:20px;">' +
            '<h3 style="margin-top:0;">Assigned Water Meters</h3>' +
            (meters.length ? (
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Meter Number</th><th>Installed</th><th>Latest Period</th><th>Latest Reading</th><th>Status</th></tr></thead><tbody>' +
              meters.map((m) =>
                '<tr>' +
                  '<td class="mono"><strong>' + esc(m.meter_number) + '</strong></td>' +
                  '<td class="mono">' + esc(m.installation_date) + '</td>' +
                  '<td class="mono">' + esc(m.latest_period || '—') + '</td>' +
                  '<td class="num">' + esc(m.latest_reading) + ' KL</td>' +
                  '<td>' + statusBadge(m.status) + '</td>' +
                '</tr>'
              ).join('') +
              '</tbody></table></div>'
            ) : '<div class="state-box">No water meter has been assigned to your account yet.</div>') +
          '</div>' +
          '<div class="card">' +
            '<h3 style="margin-top:0;">Meter Reading History</h3>' +
            (readings.length ? (
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Period</th><th>Meter</th><th>Previous</th><th>Current</th><th>Consumption</th><th>Reading Date</th></tr></thead><tbody>' +
              readings.map((r) =>
                '<tr>' +
                  '<td class="mono">' + esc(r.billing_period) + '</td>' +
                  '<td class="mono">' + esc(r.meter_number) + '</td>' +
                  '<td class="num">' + esc(r.previous_reading) + ' KL</td>' +
                  '<td class="num">' + esc(r.current_reading) + ' KL</td>' +
                  '<td class="num"><strong>' + esc(r.consumption) + ' KL</strong></td>' +
                  '<td class="mono">' + esc(r.reading_date) + '</td>' +
                '</tr>'
              ).join('') +
              '</tbody></table></div>'
            ) : '<div class="state-box">No readings recorded yet.</div>') +
          '</div>';
      } else if (tab === 'consumption') {
        const cons = await get('/api/reports/consumption');
        const trend = cons.trend || [];
        let compText = 'Need at least 2 billing periods to compare.';
        if (trend.length >= 2) {
          const prev = trend[trend.length - 2].total_kl;
          const curr = trend[trend.length - 1].total_kl;
          const diff = curr - prev;
          const pct = prev > 0 ? ((diff / prev) * 100).toFixed(1) : '0.0';
          compText = (diff >= 0 ? '+' : '') + diff + ' KL (' + (diff >= 0 ? '+' : '') + pct + '%) vs ' + trend[trend.length - 2].billing_period;
        }
        const avg = trend.length ? (trend.reduce((a, b) => a + b.total_kl, 0) / trend.length).toFixed(1) : '0.0';
        const peak = trend.reduce((m, t) => (t.total_kl > m.total_kl ? t : m), { billing_period: '—', total_kl: 0 });

        container.innerHTML =
          '<div class="kpi-grid">' +
            kpiCard('Average Monthly Usage', avg + ' KL', 'Across ' + trend.length + ' period(s)', 'bar-chart-2') +
            kpiCard('Peak Usage Period', peak.total_kl + ' KL', 'Period: ' + peak.billing_period, 'trending-up') +
            kpiCard('Month-over-Month', compText, 'Latest comparison', 'git-compare') +
            kpiCard('Conservation Tip', '35+ KL Alert', 'Simulated leak threshold', 'shield-alert') +
          '</div>' +
          '<div class="card" style="margin-bottom:20px;">' +
            '<h3 style="margin-top:0;">Consumption Trend (Kilolitres)</h3>' +
            '<div class="chart-box"><canvas id="cust-cons-chart"></canvas></div>' +
          '</div>' +
          '<div class="card">' +
            '<h3 style="margin-top:0;">Monthly Breakdown</h3>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Billing Period</th><th>Consumption (KL)</th><th>Equivalent Litres</th></tr></thead><tbody>' +
            trend.map((t) =>
              '<tr><td class="mono">' + esc(t.billing_period) + '</td><td class="num"><strong>' + esc(t.total_kl) + ' KL</strong></td><td class="num">' + (t.total_kl * 1000).toLocaleString('en-IN') + ' L</td></tr>'
            ).join('') +
            '</tbody></table></div>' +
          '</div>';

        window.AquaCharts.renderConsumptionLine(
          'cust-cons-chart',
          trend.map((t) => t.billing_period),
          trend.map((t) => t.total_kl),
          'Water Consumption (KL)'
        );
      } else if (tab === 'bills') {
        const data = await get('/api/bills');
        const bills = data.bills || [];
        container.innerHTML =
          '<div class="card">' +
            '<div class="toolbar">' +
              '<h3 style="margin:0;">My Water Bills</h3>' +
              '<span style="font-size:0.82rem;color:var(--text-muted);">Bills are read-only statements verified by the utility administrator.</span>' +
            '</div>' +
            (bills.length ? (
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Bill #</th><th>Period</th><th>Usage</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th>Invoice</th></tr></thead><tbody>' +
              bills.map((b) =>
                '<tr>' +
                  '<td class="mono">' + esc(b.bill_number) + '</td>' +
                  '<td class="mono">' + esc(b.billing_period) + '</td>' +
                  '<td class="num">' + esc(b.consumption) + ' KL</td>' +
                  '<td class="num">' + formatINR(b.total_amount) + '</td>' +
                  '<td class="num">' + formatINR(b.paid_amount) + '</td>' +
                  '<td class="num"><strong>' + formatINR(b.balance_due) + '</strong></td>' +
                  '<td class="mono">' + esc(b.due_date) + '</td>' +
                  '<td>' + statusBadge(b.status) + '</td>' +
                  '<td><button type="button" class="btn btn-secondary btn-sm" data-view-bill="' + b.bill_id + '"><i data-lucide="file-text"></i> View / Print</button></td>' +
                '</tr>'
              ).join('') +
              '</tbody></table></div>'
            ) : '<div class="state-box">You have no bills yet.</div>') +
          '</div>';

        container.querySelectorAll('[data-view-bill]').forEach((b) => {
          b.onclick = () => window.AquaInvoice.viewInvoice(b.getAttribute('data-view-bill'));
        });
      } else if (tab === 'payments') {
        const data = await get('/api/payments');
        const payments = data.payments || [];
        container.innerHTML =
          '<div class="card">' +
            '<h3 style="margin-top:0;">Verified Payment Receipts</h3>' +
            (payments.length ? (
              '<div class="table-wrap"><table class="data-table"><thead><tr><th>Transaction Ref</th><th>Bill #</th><th>Period</th><th>Method</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>' +
              payments.map((p) =>
                '<tr>' +
                  '<td class="mono">' + esc(p.transaction_reference) + '</td>' +
                  '<td class="mono">' + esc(p.bill_number) + '</td>' +
                  '<td class="mono">' + esc(p.billing_period) + '</td>' +
                  '<td>' + esc(p.payment_method) + '</td>' +
                  '<td class="mono">' + esc(p.payment_date) + '</td>' +
                  '<td class="num"><strong>' + formatINR(p.amount) + '</strong></td>' +
                  '<td>' + statusBadge(p.status) + '</td>' +
                '</tr>'
              ).join('') +
              '</tbody></table></div>'
            ) : '<div class="state-box">No payments recorded yet.</div>') +
          '</div>';
      } else if (tab === 'notifications') {
        const data = await get('/api/notifications');
        const list = data.notifications || [];
        state.unreadCount = data.unread_count || 0;
        container.innerHTML =
          '<div class="card">' +
            '<div class="toolbar">' +
              '<h3 style="margin:0;">My Alerts &amp; Notifications</h3>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="cust-read-all-btn">Mark All Read</button>' +
            '</div>' +
            (list.length ? list.map((n) =>
              '<div class="preview-row" style="align-items:flex-start;gap:12px;">' +
                '<div>' +
                  '<div style="font-weight:' + (n.is_read ? '500' : '700') + ';">' + esc(n.message) + '</div>' +
                  '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">' + esc(n.type) + ' &bull; ' + esc(n.created_at) + '</div>' +
                '</div>' +
                (!n.is_read
                  ? '<button type="button" class="btn btn-primary btn-sm" data-read-nid="' + n.notification_id + '">Mark Read</button>'
                  : '<span class="badge badge-muted">Read</span>') +
              '</div>'
            ).join('') : '<div class="state-box">No notifications right now.</div>') +
          '</div>';

        const readAllBtn = document.getElementById('cust-read-all-btn');
        if (readAllBtn) {
          readAllBtn.onclick = async () => {
            await put('/api/notifications/read-all', {});
            loadCustomerTab('notifications');
          };
        }
        container.querySelectorAll('[data-read-nid]').forEach((btn) => {
          btn.onclick = async () => {
            await put('/api/notifications/' + btn.getAttribute('data-read-nid') + '/read', {});
            loadCustomerTab('notifications');
          };
        });
      }
    } catch (err) {
      container.innerHTML = '<div class="state-box"><h4>Could not load section</h4><p>' + esc(err.message) + '</p></div>';
    }
  }

  function kpiCard(title, value, foot, icon) {
    return (
      '<div class="kpi-card">' +
        '<div class="kpi-head"><span>' + title + '</span><span class="kpi-icon-badge"><i data-lucide="' + icon + '"></i></span></div>' +
        '<div class="kpi-val num">' + value + '</div>' +
        '<div class="kpi-foot">' + foot + '</div>' +
      '</div>'
    );
  }

  window.AquaCustomer = { renderCustomerPortal };
})();
