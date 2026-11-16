(function () {
  function renderPublicShell(activePage) {
    const { state, toggleTheme, hydrateIcons } = window.AquaState;
    const root = document.getElementById('app-root');

    const navItem = (id, label) =>
      '<button type="button" class="pub-link ' + (activePage === id ? 'active' : '') + '" data-pub="' + id + '">' + label + '</button>';

    let bodyHtml = '';
    if (activePage === 'home') bodyHtml = renderHome();
    else if (activePage === 'about') bodyHtml = renderAbout();
    else if (activePage === 'features') bodyHtml = renderFeatures();
    else if (activePage === 'contact') bodyHtml = renderContact();
    else if (activePage === 'admin-login') bodyHtml = renderAdminLogin();
    else if (activePage === 'login') bodyHtml = renderAuthSplit('login');
    else if (activePage === 'register') bodyHtml = renderAuthSplit('register');

    root.innerHTML =
      '<div class="pub-outer">' +
        '<div class="pub-frame">' +
          '<header class="pub-nav-inner">' +
            '<button type="button" class="brand-mark" data-pub="home">' +
              '<span class="brand-icon-circle"><i data-lucide="droplets"></i></span>' +
              '<span class="mono" style="letter-spacing:0.06em;">AQUA</span>' +
            '</button>' +
            '<nav class="pub-links" aria-label="Public Navigation">' +
              navItem('home', 'Home') +
              navItem('about', 'About Us') +
              navItem('features', 'Features') +
              navItem('contact', 'Contact') +
            '</nav>' +
            '<div class="pub-actions">' +
              '<button type="button" class="icon-btn" id="pub-theme-btn" title="Toggle Light/Dark Mode" aria-label="Toggle theme">' +
                '<i data-lucide="' + (state.theme === 'dark' ? 'sun' : 'moon') + '"></i>' +
              '</button>' +
              '<button type="button" class="btn btn-secondary btn-sm" data-pub="login">Customer Sign In</button>' +
              '<button type="button" class="btn btn-navy btn-sm" data-pub="admin-login"><i data-lucide="shield-check"></i> Admin Portal</button>' +
              '<button type="button" class="btn btn-primary btn-sm" data-pub="register">Register</button>' +
            '</div>' +
          '</header>' +
          '<main class="pub-container">' + bodyHtml + '</main>' +
          '<footer class="pub-footer">' +
            '<div class="pub-footer-inner">' +
              '<span><strong>AquaBill</strong> — Smart Water Consumption Monitoring &amp; Billing System</span>' +
              '<span>C11 Mongoose HTTP Engine · SQLite3 Relational Storage</span>' +
            '</div>' +
          '</footer>' +
        '</div>' +
      '</div>';

    document.querySelectorAll('[data-pub]').forEach((el) => {
      el.addEventListener('click', () => {
        state.publicPage = el.getAttribute('data-pub');
        renderPublicShell(state.publicPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    const themeBtn = document.getElementById('pub-theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        toggleTheme();
        renderPublicShell(state.publicPage);
      });
    }

    bindPageHandlers(activePage);
    hydrateIcons();
  }

  function renderHome() {
    return (
      '<section class="hero-grid">' +
        '<div class="hero-card-left">' +
          '<div>' +
            '<p style="margin:0 0 10px;font-size:0.82rem;font-weight:700;color:var(--brand-blue);">Smart Water Monitoring &amp; Billing Platform</p>' +
            '<h1 class="hero-title">Smart Water Consumption Monitoring &amp; Automated Billing</h1>' +
            '<p class="hero-sub">AquaBill streamlines municipal and residential water metering, fixed-point tariff billing, payment reconciliation, and customer transparency through a dedicated C11 &amp; SQLite3 engine.</p>' +
            '<div class="hero-cta">' +
              '<button type="button" class="btn btn-primary" data-pub="login"><i data-lucide="log-in"></i> Sign In to Portal</button>' +
              '<button type="button" class="btn btn-secondary" data-pub="register"><i data-lucide="user-plus"></i> Register Household</button>' +
            '</div>' +
          '</div>' +
          '<div class="hero-metrics">' +
            '<div><div class="hero-metric-val num">100%</div><div class="hero-metric-lbl">Fixed-Point Paise Precision</div></div>' +
            '<div><div class="hero-metric-val num">2 Portals</div><div class="hero-metric-lbl">Admin &amp; Customer RBAC</div></div>' +
            '<div><div class="hero-metric-val num">C11 + SQL</div><div class="hero-metric-lbl">Mongoose REST &amp; SQLite3</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="hero-preview-gradient">' +
          '<div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span class="frosted-droplet" style="width:36px;height:36px;"><i data-lucide="droplets"></i></span>' +
                '<div><div style="font-weight:800;font-size:1rem;">Live Tariff Calculation</div><div style="font-size:0.78rem;color:rgba(224,242,254,0.85);">Standard Domestic Schedule</div></div>' +
              '</div>' +
              '<span style="font-size:0.74rem;font-weight:700;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,0.2);">Active</span>' +
            '</div>' +
            '<div class="preview-glass-row"><span>Meter Reading Delta</span><span class="mono">1000 &rarr; 1025 KL (25 KL)</span></div>' +
            '<div class="preview-glass-row"><span>Water Usage Charge (@ ₹10.00/KL)</span><span class="mono">₹250.00</span></div>' +
            '<div class="preview-glass-row"><span>Fixed Service Charge</span><span class="mono">₹50.00</span></div>' +
            '<div class="preview-glass-row"><span>Utility Tax (0.00%)</span><span class="mono">₹0.00</span></div>' +
          '</div>' +
          '<div class="preview-glass-row" style="margin-top:8px;margin-bottom:0;background:rgba(255,255,255,0.26);font-weight:800;">' +
            '<span>Total Payable Invoice</span><span class="mono" style="font-size:1.05rem;">₹300.00</span>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section>' +
        '<h2 class="section-heading">Built for Utility Operators &amp; Households</h2>' +
        '<p class="section-lead">Every reading, invoice, and payment is validated on the C backend and stored with strict relational integrity.</p>' +
        renderFeatureCards() +
      '</section>'
    );
  }

  function renderFeatureCards() {
    const items = [
      { icon: 'gauge', title: 'Meter & Reading Validation', desc: 'Prevents negative consumption, rejects duplicate billing periods, and enforces unique meter serials.' },
      { icon: 'calculator', title: 'Fixed-Point Tariff Engine', desc: 'Supports flat and progressive slab billing in integer paise arithmetic with zero rounding drift.' },
      { icon: 'file-text', title: 'Instant Invoice & Print Export', desc: 'Generates itemized official statements with printable layout and standalone statement downloads.' },
      { icon: 'credit-card', title: 'Multi-Mode Payment Ledger', desc: 'Tracks Cash, UPI, and Bank Transfer settlements, partial payments, and duplicate reference guards.' },
      { icon: 'bar-chart-3', title: 'Revenue & Usage Analytics', desc: 'Interactive monthly collection, consumption trend graphs, outstanding aging, and 1-click CSV export.' },
      { icon: 'lock', title: 'Role-Scoped Access Control', desc: 'Strict separation between Administrator management endpoints and Customer self-service records.' }
    ];
    return (
      '<div class="feature-grid">' +
      items.map((it) =>
        '<div class="card">' +
          '<div class="feature-icon"><i data-lucide="' + it.icon + '"></i></div>' +
          '<h3 style="margin:0 0 8px;font-size:1.02rem;font-weight:700;">' + it.title + '</h3>' +
          '<p style="margin:0;color:var(--text-secondary);font-size:0.87rem;">' + it.desc + '</p>' +
        '</div>'
      ).join('') +
      '</div>'
    );
  }

  function renderAbout() {
    return (
      '<div style="max-width:920px;margin:0 auto;">' +
        '<h1 class="section-heading">About AquaBill</h1>' +
        '<p class="section-lead">AquaBill is a full-stack smart water consumption monitoring and billing management system designed to modernize municipal and residential water utility operations.</p>' +
        '<div class="grid-2">' +
          '<div class="card">' +
            '<div class="feature-icon"><i data-lucide="cpu"></i></div>' +
            '<h3 style="margin:0 0 8px;">Engineering Architecture</h3>' +
            '<p style="color:var(--text-secondary);font-size:0.9rem;margin:0;">All business logic, authentication, PBKDF2-SHA256 password verification, and billing calculations execute inside a compiled <strong>C11 backend</strong> powered by the <strong>Mongoose HTTP server library</strong> and <strong>SQLite3</strong> prepared statements.</p>' +
          '</div>' +
          '<div class="card">' +
            '<div class="feature-icon"><i data-lucide="shield-check"></i></div>' +
            '<h3 style="margin:0 0 8px;">Transparency &amp; Auditability</h3>' +
            '<p style="color:var(--text-secondary);font-size:0.9rem;margin:0;">Paid bills are financially immutable, unpaid cancellations require an audit reason, and every customer sees real-time consumption comparisons and itemized invoices.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderFeatures() {
    return (
      '<div>' +
        '<h1 class="section-heading">Platform Capabilities</h1>' +
        '<p class="section-lead">Complete utility lifecycle coverage from meter commissioning to payment reconciliation and analytics.</p>' +
        renderFeatureCards() +
      '</div>'
    );
  }

  function renderContact() {
    return (
      '<div style="max-width:640px;margin:0 auto;">' +
        '<h1 class="section-heading">Contact Utility Support</h1>' +
        '<p class="section-lead">Have a question about meter connections, tariff slabs, or billing statements? Send an inquiry directly to our database-backed support queue.</p>' +
        '<div class="card">' +
          '<form id="contact-form">' +
            '<div class="form-field"><label for="c-name">Full Name</label><input class="input" id="c-name" required placeholder="e.g. Aarav Sharma" /></div>' +
            '<div class="form-field"><label for="c-email">Email Address</label><input class="input" id="c-email" type="email" required placeholder="name@example.com" /></div>' +
            '<div class="form-field"><label for="c-subject">Subject</label><input class="input" id="c-subject" required placeholder="Meter inspection or billing inquiry" /></div>' +
            '<div class="form-field"><label for="c-message">Message</label><textarea class="textarea" id="c-message" rows="4" required placeholder="Describe your query..."></textarea></div>' +
            '<button type="submit" class="btn btn-primary" id="contact-submit-btn"><i data-lucide="send"></i> Send Message</button>' +
          '</form>' +
        '</div>' +
      '</div>'
    );
  }

  function renderAdminLogin() {
    return (
      '<div class="auth-split-card">' +
        '<section class="auth-gradient-panel" style="background:linear-gradient(165deg, #071426 0%, #0B1F3A 55%, #0E7490 100%);">' +
          '<div>' +
            '<div class="auth-brand-row">' +
              '<span class="frosted-droplet"><i data-lucide="shield-check"></i></span>' +
              '<span class="auth-brand-word">AQUABILL ADMIN</span>' +
            '</div>' +
            '<h1 class="auth-hero-h1">Customer Monitoring &amp; Utility Operations Center.</h1>' +
            '<p class="auth-hero-p">Dedicated administrator workspace to monitor every customer account, track live meter consumption surges, generate C11 tariff bills, and reconcile utility payments.</p>' +
            '<div class="auth-tariff-box">' +
              '<div class="auth-tariff-title">Administrator Command Capabilities</div>' +
              '<div class="auth-tariff-row"><span>Customer Monitor</span><strong class="mono">Live Matrix &amp; Inspector</strong></div>' +
              '<div class="auth-tariff-row"><span>Meter &amp; Surge Watch</span><strong class="mono">Readings &amp; Alerts</strong></div>' +
              '<div class="auth-tariff-row"><span>Billing Engine</span><strong class="mono">C11 Flat &amp; Slab</strong></div>' +
              '<div class="auth-tariff-row"><span>Access Enforcement</span><strong class="mono">Strict /api/admin/* RBAC</strong></div>' +
            '</div>' +
          '</div>' +
          '<div style="padding-top:18px;margin-top:20px;border-top:1px solid rgba(255,255,255,0.2);font-size:0.78rem;color:rgba(224,242,254,0.88);">' +
            'Restricted Utility Operations Console · C11 Mongoose &amp; SQLite3' +
          '</div>' +
        '</section>' +
        '<section class="auth-form-panel">' +
          '<div class="auth-form-inner">' +
            '<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:8px;background:#0B1F3A;color:#38BDF8;font-size:0.74rem;font-weight:700;margin-bottom:14px;">' +
              '<i data-lucide="lock" style="width:13px;height:13px;"></i><span>ADMINISTRATOR PORTAL LOGIN</span>' +
            '</div>' +
            '<h2 style="margin:0 0 4px;font-size:1.55rem;font-weight:800;letter-spacing:-0.02em;">Administrator Sign In</h2>' +
            '<p style="margin:0 0 18px;color:var(--text-muted);font-size:0.875rem;">Sign in with an administrator account to launch the Customer Monitoring Dashboard. Customer credentials are rejected.</p>' +
            '<form id="admin-login-form">' +
              '<div class="form-field">' +
                '<label for="adm-login-email">Administrator Email</label>' +
                '<div class="input-icon-wrap">' +
                  '<i data-lucide="mail" class="input-icon-left"></i>' +
                  '<input class="input with-icon" id="adm-login-email" type="email" required autocomplete="email" placeholder="admin@aquabill.local" />' +
                '</div>' +
              '</div>' +
              '<div class="form-field">' +
                '<label for="adm-login-password">Administrator Password</label>' +
                '<div class="input-icon-wrap">' +
                  '<i data-lucide="lock" class="input-icon-left"></i>' +
                  '<input class="input with-icon" id="adm-login-password" type="password" required autocomplete="current-password" placeholder="Enter administrator password" />' +
                '</div>' +
              '</div>' +
              '<div id="adm-login-error" class="hidden" style="color:var(--danger);font-size:0.84rem;margin-bottom:12px;"></div>' +
              '<button type="submit" class="btn btn-navy" style="width:100%;" id="adm-login-submit-btn"><i data-lucide="shield-check"></i> Launch Administrator Dashboard</button>' +
            '</form>' +
            '<div class="demo-cards">' +
              '<div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);">Administrator Account Prefill (configure password via server env / FACULTY_DEMO_GUIDE.md)</div>' +
              '<button type="button" class="demo-card-btn" id="fill-only-admin-btn">' +
                '<div style="display:flex;align-items:center;gap:10px;">' +
                  '<span class="demo-avatar" style="background:#0B1F3A;color:#38BDF8;">AD</span>' +
                  '<div><div style="font-size:0.82rem;font-weight:700;">Vikramaditya Rao (Utility Admin)</div><div style="font-size:0.74rem;color:var(--text-muted);" class="mono">admin@aquabill.local · Role: ADMIN</div></div>' +
                '</div>' +
                '<span style="font-size:0.78rem;font-weight:700;color:#0B1F3A;">Use Email &rarr;</span>' +
              '</button>' +
              '<div style="margin-top:14px;text-align:center;">' +
                '<button type="button" class="btn btn-ghost btn-sm" data-pub="login">&larr; Switch to Customer Portal Sign In</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>' +
      '</div>'
    );
  }

  function renderAuthSplit(mode) {
    const isLogin = mode === 'login';

    const formHtml = isLogin
      ? '<div>' +
          '<h2 style="margin:0 0 4px;font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;">Customer Portal Sign In</h2>' +
          '<p style="margin:0 0 18px;color:var(--text-muted);font-size:0.875rem;">Access your household or campus water consumption, bills, and payment history.</p>' +
          '<form id="login-form">' +
            '<div class="form-field">' +
              '<label for="login-email">Customer Email Address</label>' +
              '<div class="input-icon-wrap">' +
                '<i data-lucide="mail" class="input-icon-left"></i>' +
                '<input class="input with-icon" id="login-email" type="email" required autocomplete="email" placeholder="aarav.sharma@aquabill.local" />' +
              '</div>' +
            '</div>' +
            '<div class="form-field">' +
              '<label for="login-password">Password</label>' +
              '<div class="input-icon-wrap">' +
                '<i data-lucide="lock" class="input-icon-left"></i>' +
                '<input class="input with-icon" id="login-password" type="password" required autocomplete="current-password" placeholder="Enter your password" />' +
              '</div>' +
            '</div>' +
            '<div id="login-error" class="hidden" style="color:var(--danger);font-size:0.84rem;margin-bottom:12px;"></div>' +
            '<button type="submit" class="btn btn-primary" style="width:100%;" id="login-submit-btn"><i data-lucide="log-in"></i> Sign In to Customer Portal</button>' +
          '</form>' +
          '<div class="demo-cards">' +
            '<div style="font-size:0.78rem;font-weight:700;color:var(--text-muted);">Customer demo email prefill (enter password to authenticate)</div>' +
            '<button type="button" class="demo-card-btn" id="fill-cust-btn">' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span class="demo-avatar">AS</span>' +
                '<div><div style="font-size:0.82rem;font-weight:700;">Aarav Sharma (Household)</div><div style="font-size:0.74rem;color:var(--text-muted);" class="mono">aarav.sharma@aquabill.local · Meter 1001</div></div>' +
              '</div>' +
              '<span style="font-size:0.78rem;font-weight:700;color:var(--brand-blue);">Use Email &rarr;</span>' +
            '</button>' +
            '<button type="button" class="demo-card-btn" id="fill-hostel-btn">' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
                '<span class="demo-avatar" style="background:#E0F2FE;color:#0369A1;">EH</span>' +
                '<div><div style="font-size:0.82rem;font-weight:700;">Engineering Hostel Wing A (Multi-Meter)</div><div style="font-size:0.74rem;color:var(--text-muted);" class="mono">hostel.winga@aquabill.local · 2 Meters</div></div>' +
              '</div>' +
              '<span style="font-size:0.78rem;font-weight:700;color:var(--brand-blue);">Use Email &rarr;</span>' +
            '</button>' +
            '<div style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--border-color);display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
              '<span style="font-size:0.78rem;color:var(--text-muted);">Are you a water utility operator?</span>' +
              '<button type="button" class="btn btn-navy btn-sm" id="open-admin-login-btn" data-pub="admin-login"><i data-lucide="shield-check"></i> Open Admin Portal</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      : '<div>' +
          '<h2 style="margin:0 0 4px;font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;">Register a new household</h2>' +
          '<p style="margin:0 0 18px;color:var(--text-muted);font-size:0.875rem;">Create a Customer portal account. Administrator accounts cannot be self-registered.</p>' +
          '<form id="register-form">' +
            '<div class="form-grid">' +
              '<div class="form-field">' +
                '<label for="reg-name">Full Name</label>' +
                '<div class="input-icon-wrap"><i data-lucide="user" class="input-icon-left"></i><input class="input with-icon" id="reg-name" required placeholder="e.g. Riya Deshpande" /></div>' +
              '</div>' +
              '<div class="form-field">' +
                '<label for="reg-phone">Phone Number</label>' +
                '<div class="input-icon-wrap"><i data-lucide="phone" class="input-icon-left"></i><input class="input with-icon" id="reg-phone" required placeholder="+91-98765-43210" /></div>' +
              '</div>' +
              '<div class="form-field full">' +
                '<label for="reg-email">Email Address</label>' +
                '<div class="input-icon-wrap"><i data-lucide="mail" class="input-icon-left"></i><input class="input with-icon" id="reg-email" type="email" required placeholder="riya@example.com" /></div>' +
              '</div>' +
              '<div class="form-field full">' +
                '<label for="reg-address">Service Address</label>' +
                '<div class="input-icon-wrap"><i data-lucide="map-pin" class="input-icon-left"></i><input class="input with-icon" id="reg-address" required placeholder="Flat 301, Lakeview Apartments, Pune" /></div>' +
              '</div>' +
              '<div class="form-field full">' +
                '<label for="reg-password">Password (min 8 characters)</label>' +
                '<div class="input-icon-wrap"><i data-lucide="lock" class="input-icon-left"></i><input class="input with-icon" id="reg-password" type="password" minlength="8" required placeholder="Minimum 8 characters" /></div>' +
              '</div>' +
            '</div>' +
            '<div id="reg-error" class="hidden" style="color:var(--danger);font-size:0.84rem;margin-bottom:12px;"></div>' +
            '<button type="submit" class="btn btn-primary" style="width:100%;" id="reg-submit-btn"><i data-lucide="user-plus"></i> Register Customer Account</button>' +
          '</form>' +
        '</div>';

    return (
      '<div class="auth-split-card">' +
        '<section class="auth-gradient-panel">' +
          '<div>' +
            '<div class="auth-brand-row">' +
              '<span class="frosted-droplet"><i data-lucide="droplets"></i></span>' +
              '<span class="auth-brand-word">AQUA</span>' +
            '</div>' +
            '<h1 class="auth-hero-h1">Smart water monitoring and billing portal.</h1>' +
            '<p class="auth-hero-p">Monitor household meter consumption in kilolitres, inspect progressive slab bills, and reconcile utility payments through our C11 engine.</p>' +
            '<div class="auth-tariff-box">' +
              '<div class="auth-tariff-title">Progressive Domestic Tariff Schedule</div>' +
              '<div class="auth-tariff-row"><span>Tier 1 (0 – 10 KL)</span><strong class="mono">₹5.00 / KL</strong></div>' +
              '<div class="auth-tariff-row"><span>Tier 2 (11 – 20 KL)</span><strong class="mono">₹8.00 / KL</strong></div>' +
              '<div class="auth-tariff-row"><span>Tier 3 (21 – 30 KL)</span><strong class="mono">₹12.00 / KL</strong></div>' +
              '<div class="auth-tariff-row"><span>Tier 4 (Above 30 KL)</span><strong class="mono">₹15.00 / KL</strong></div>' +
            '</div>' +
          '</div>' +
          '<div style="padding-top:18px;margin-top:20px;border-top:1px solid rgba(255,255,255,0.2);font-size:0.78rem;color:rgba(224,242,254,0.88);">' +
            'Municipal Utility Portal · C11 Mongoose &amp; SQLite3' +
          '</div>' +
        '</section>' +
        '<section class="auth-form-panel">' +
          '<div class="auth-form-inner">' +
            '<div class="segmented-tabs" role="tablist">' +
              '<button type="button" class="segmented-tab ' + (isLogin ? 'active' : '') + '" data-pub="login" role="tab" aria-selected="' + isLogin + '">Customer Sign In</button>' +
              '<button type="button" class="segmented-tab ' + (!isLogin ? 'active' : '') + '" data-pub="register" role="tab" aria-selected="' + (!isLogin) + '">Register Household</button>' +
            '</div>' +
            formHtml +
          '</div>' +
        '</section>' +
      '</div>'
    );
  }

  function bindPageHandlers(page) {
    const { post, setToken } = window.AquaAPI;
    const { state, toast } = window.AquaState;

    if (page === 'contact') {
      const form = document.getElementById('contact-form');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const btn = document.getElementById('contact-submit-btn');
          btn.disabled = true;
          try {
            const res = await post('/api/contact', {
              name: document.getElementById('c-name').value,
              email: document.getElementById('c-email').value,
              subject: document.getElementById('c-subject').value,
              message: document.getElementById('c-message').value
            });
            toast(res.message, 'success');
            form.reset();
          } catch (err) {
            toast(err.message, 'error');
          } finally {
            btn.disabled = false;
          }
        };
      }
    }

    if (page === 'admin-login') {
      const fillOnlyAdmin = document.getElementById('fill-only-admin-btn');
      if (fillOnlyAdmin) {
        fillOnlyAdmin.onclick = () => {
          const emailEl = document.getElementById('adm-login-email');
          const pwEl = document.getElementById('adm-login-password');
          if (emailEl) emailEl.value = 'admin@aquabill.local';
          if (pwEl) pwEl.focus();
        };
      }
      const adminForm = document.getElementById('admin-login-form');
      if (adminForm) {
        adminForm.onsubmit = async (e) => {
          e.preventDefault();
          const btn = document.getElementById('adm-login-submit-btn');
          const errBox = document.getElementById('adm-login-error');
          errBox.classList.add('hidden');
          btn.disabled = true;
          try {
            const data = await post('/api/admin/auth/login', {
              email: document.getElementById('adm-login-email').value,
              password: document.getElementById('adm-login-password').value
            });
            setToken(data.token);
            state.user = data.user;
            state.portalTab = 'dashboard';
            toast('Administrator signed in: ' + data.user.name, 'success');
            window.AquaApp.render();
          } catch (err) {
            errBox.textContent = err.message;
            errBox.classList.remove('hidden');
            btn.disabled = false;
          }
        };
      }
    }

    if (page === 'login') {
      const fillCust = document.getElementById('fill-cust-btn');
      const fillHostel = document.getElementById('fill-hostel-btn');
      if (fillCust) {
        fillCust.onclick = () => {
          const emailEl = document.getElementById('login-email');
          const pwEl = document.getElementById('login-password');
          if (emailEl) emailEl.value = 'aarav.sharma@aquabill.local';
          if (pwEl) pwEl.focus();
        };
      }
      if (fillHostel) {
        fillHostel.onclick = () => {
          const emailEl = document.getElementById('login-email');
          const pwEl = document.getElementById('login-password');
          if (emailEl) emailEl.value = 'hostel.winga@aquabill.local';
          if (pwEl) pwEl.focus();
        };
      }

      const form = document.getElementById('login-form');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const btn = document.getElementById('login-submit-btn');
          const errBox = document.getElementById('login-error');
          errBox.classList.add('hidden');
          btn.disabled = true;
          try {
            const data = await post('/api/auth/login', {
              email: document.getElementById('login-email').value,
              password: document.getElementById('login-password').value
            });
            setToken(data.token);
            state.user = data.user;
            state.portalTab = 'dashboard';
            toast('Signed in as ' + data.user.name, 'success');
            window.AquaApp.render();
          } catch (err) {
            errBox.textContent = err.message;
            errBox.classList.remove('hidden');
            btn.disabled = false;
          }
        };
      }
    }

    if (page === 'register') {
      const form = document.getElementById('register-form');
      if (form) {
        form.onsubmit = async (e) => {
          e.preventDefault();
          const btn = document.getElementById('reg-submit-btn');
          const errBox = document.getElementById('reg-error');
          errBox.classList.add('hidden');
          btn.disabled = true;
          try {
            const data = await post('/api/auth/register', {
              name: document.getElementById('reg-name').value,
              phone: document.getElementById('reg-phone').value,
              email: document.getElementById('reg-email').value,
              address: document.getElementById('reg-address').value,
              password: document.getElementById('reg-password').value
            });
            setToken(data.token);
            state.user = data.user;
            state.portalTab = 'dashboard';
            toast('Account created! Welcome to AquaBill.', 'success');
            window.AquaApp.render();
          } catch (err) {
            errBox.textContent = err.message;
            errBox.classList.remove('hidden');
            btn.disabled = false;
          }
        };
      }
    }
  }

  window.AquaPublic = { renderPublicShell };
})();
