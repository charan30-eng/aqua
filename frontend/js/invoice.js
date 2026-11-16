(function () {
  function buildInvoiceMarkup(bill, payments) {
    const { esc, formatINR, statusBadge } = window.AquaAPI;
    const payRows = (payments || []).map((p) =>
      '<tr>' +
        '<td class="mono">' + esc(p.transaction_reference) + '</td>' +
        '<td>' + esc(p.payment_method) + '</td>' +
        '<td>' + esc(p.payment_date) + '</td>' +
        '<td class="num">' + formatINR(p.amount) + '</td>' +
      '</tr>'
    ).join('');

    return (
      '<div class="invoice-box">' +
        '<div class="invoice-top">' +
          '<div>' +
            '<h2 style="margin:0;color:#0B1F3A;">AQUABILL WATER UTILITY</h2>' +
            '<p style="margin:4px 0 0;color:#475569;font-size:0.85rem;">Official Water Consumption &amp; Billing Statement</p>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div class="mono" style="font-weight:700;font-size:1rem;">' + esc(bill.bill_number) + '</div>' +
            '<div style="margin-top:4px;">' + statusBadge(bill.status) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="invoice-meta-grid">' +
          '<div>' +
            '<div style="font-size:0.75rem;text-transform:uppercase;color:#64748B;font-weight:700;">Billed To</div>' +
            '<div style="font-weight:700;margin-top:4px;">' + esc(bill.customer_name) + '</div>' +
            '<div style="color:#475569;">' + esc(bill.customer_email) + '</div>' +
            '<div style="color:#475569;">' + esc(bill.customer_phone || '') + '</div>' +
            '<div style="color:#475569;">' + esc(bill.customer_address || '') + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div><strong>Meter No:</strong> <span class="mono">' + esc(bill.meter_number) + '</span></div>' +
            '<div><strong>Billing Period:</strong> <span class="mono">' + esc(bill.billing_period) + '</span></div>' +
            '<div><strong>Reading Date:</strong> <span class="mono">' + esc(bill.reading_date || '') + '</span></div>' +
            '<div><strong>Due Date:</strong> <span class="mono">' + esc(bill.due_date) + '</span></div>' +
            '<div><strong>Tariff Plan:</strong> ' + esc(bill.tariff_name) + '</div>' +
          '</div>' +
        '</div>' +
        '<table class="data-table" style="margin-bottom:18px;border:1px solid #CBD5E1;">' +
          '<thead><tr><th>Previous Reading</th><th>Current Reading</th><th>Consumption (KL)</th><th>Rate / KL</th></tr></thead>' +
          '<tbody><tr>' +
            '<td class="num">' + esc(bill.previous_reading) + ' KL</td>' +
            '<td class="num">' + esc(bill.current_reading) + ' KL</td>' +
            '<td class="num"><strong>' + esc(bill.consumption) + ' KL</strong></td>' +
            '<td class="num">' + formatINR(bill.rate_per_kl) + '</td>' +
          '</tr></tbody>' +
        '</table>' +
        '<div style="max-width:340px;margin-left:auto;">' +
          '<div class="invoice-total-row"><span>Water Usage Charge</span><span class="num">' + formatINR(bill.water_charge) + '</span></div>' +
          '<div class="invoice-total-row"><span>Fixed Service Charge</span><span class="num">' + formatINR(bill.service_charge) + '</span></div>' +
          '<div class="invoice-total-row"><span>Utility Tax (' + ((Number(bill.tax_percentage || 0) / 100).toFixed(2)) + '%)</span><span class="num">' + formatINR(bill.tax_amount) + '</span></div>' +
          '<div class="invoice-total-row invoice-grand"><span>Total Billed</span><span class="num">' + formatINR(bill.total_amount) + '</span></div>' +
          '<div class="invoice-total-row"><span>Amount Paid</span><span class="num">' + formatINR(bill.paid_amount) + '</span></div>' +
          '<div class="invoice-total-row" style="font-weight:700;color:#0284C7;"><span>Balance Due</span><span class="num">' + formatINR(bill.balance_due) + '</span></div>' +
        '</div>' +
        (payRows ? (
          '<div style="margin-top:20px;">' +
            '<div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;color:#64748B;margin-bottom:8px;">Verified Payment Transactions</div>' +
            '<table class="data-table" style="border:1px solid #CBD5E1;">' +
              '<thead><tr><th>Reference</th><th>Method</th><th>Date</th><th>Amount</th></tr></thead>' +
              '<tbody>' + payRows + '</tbody>' +
            '</table>' +
          '</div>'
        ) : '') +
      '</div>'
    );
  }

  async function viewInvoice(billId) {
    try {
      const data = await window.AquaAPI.get('/api/bills/' + billId);
      const markup = buildInvoiceMarkup(data.bill, data.payments);
      const printRoot = document.getElementById('print-invoice-root');
      if (printRoot) printRoot.innerHTML = markup;

      window.AquaState.openModal(
        'Invoice ' + data.bill.bill_number,
        markup +
        '<div class="modal-actions">' +
          '<button type="button" class="btn btn-secondary" id="inv-download-btn"><i data-lucide="download"></i> Download Statement (.html)</button>' +
          '<button type="button" class="btn btn-primary" id="inv-print-btn"><i data-lucide="printer"></i> Print / Save PDF</button>' +
        '</div>',
        true
      );

      document.getElementById('inv-print-btn').onclick = () => {
        window.print();
      };
      document.getElementById('inv-download-btn').onclick = () => {
        const docHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
          window.AquaAPI.esc(data.bill.bill_number) +
          '</title><style>body{font-family:sans-serif;padding:24px;background:#f4f7fa;}table{width:100%;border-collapse:collapse;}th,td{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left;}.invoice-box{background:#fff;padding:24px;border:1px solid #cbd5e1;max-width:780px;margin:0 auto;}.invoice-top{display:flex;justify-content:space-between;border-bottom:2px solid #0b1f3a;padding-bottom:14px;margin-bottom:16px;}.invoice-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}.invoice-total-row{display:flex;justify-content:space-between;padding:5px 0;}.invoice-grand{border-top:2px solid #0f172a;font-weight:700;padding-top:8px;margin-top:6px;}.num,.mono{font-family:monospace;}</style></head><body>' +
          markup + '</body></html>';
        const blob = new Blob([docHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.bill.bill_number + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      window.AquaState.toast(e.message, 'error');
    }
  }

  window.AquaInvoice = { viewInvoice };
})();
