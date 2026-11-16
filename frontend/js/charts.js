(function () {
  const instances = {};

  function palette() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text: isDark ? '#CBD5E1' : '#64748B',
      grid: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.22)',
      sky: '#0EA5E9',
      skyLight: '#38BDF8',
      blue: '#0284C7',
      lime: '#84CC16',
      emerald: '#10B981',
      amber: '#F59E0B'
    };
  }

  function destroy(canvasId) {
    if (instances[canvasId]) {
      instances[canvasId].destroy();
      delete instances[canvasId];
    }
  }

  function renderBarLineRevenue(canvasId, labels, billedInr, collectedInr) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    destroy(canvasId);
    const p = palette();

    instances[canvasId] = new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Billed (₹)',
            data: billedInr,
            backgroundColor: p.skyLight,
            hoverBackgroundColor: p.sky,
            borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: 'bottom',
            barPercentage: 0.55,
            categoryPercentage: 0.7
          },
          {
            label: 'Collected (₹)',
            data: collectedInr,
            backgroundColor: p.blue,
            hoverBackgroundColor: '#0369A1',
            borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: 'bottom',
            barPercentage: 0.55,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: p.text,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8
            }
          }
        },
        scales: {
          x: {
            ticks: { color: p.text, font: { size: 11 } },
            grid: { display: false }
          },
          y: {
            ticks: { color: p.text, font: { size: 11 } },
            grid: { color: p.grid },
            border: { dash: [4, 4], display: false },
            beginAtZero: true
          }
        }
      }
    });
  }

  function renderConsumptionLine(canvasId, labels, klValues, titleLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    destroy(canvasId);
    const p = palette();
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 240);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

    // Benchmark target line (15% conservation goal) matching the dual-line look
    const targetValues = klValues.map((v) => Math.max(0, Math.round(v * 0.85)));

    instances[canvasId] = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: titleLabel || 'Usage (KL)',
            data: klValues,
            borderColor: p.blue,
            backgroundColor: grad,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: p.blue,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 2
          },
          {
            label: 'Conservation Target (KL)',
            data: targetValues,
            borderColor: p.lime,
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: p.lime,
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: p.text,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8
            }
          }
        },
        scales: {
          x: {
            ticks: { color: p.text, font: { size: 11 } },
            grid: { display: false }
          },
          y: {
            ticks: { color: p.text, font: { size: 11 } },
            grid: { color: p.grid },
            border: { dash: [4, 4], display: false },
            beginAtZero: true
          }
        }
      }
    });
  }

  function renderMethodDoughnut(canvasId, labels, totalsInr) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    destroy(canvasId);
    const p = palette();

    instances[canvasId] = new window.Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: totalsInr,
          backgroundColor: [p.sky, p.blue, p.lime, p.amber],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: p.text,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16
            }
          }
        }
      }
    });
  }

  function refreshTheme() {
    const p = palette();
    Object.values(instances).forEach((chart) => {
      if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.color = p.text;
      }
      if (chart.options.scales) {
        if (chart.options.scales.x) chart.options.scales.x.ticks.color = p.text;
        if (chart.options.scales.y) {
          chart.options.scales.y.ticks.color = p.text;
          chart.options.scales.y.grid.color = p.grid;
        }
      }
      chart.update();
    });
  }

  function renderConsumptionBar(canvasId, labels, klValues) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    destroy(canvasId);
    const p = palette();

    instances[canvasId] = new window.Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Water Used (KL)',
            data: klValues,
            backgroundColor: p.sky,
            hoverBackgroundColor: p.blue,
            borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: 'bottom',
            barPercentage: 0.45
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: p.text,
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 8,
              boxHeight: 8
            }
          }
        },
        scales: {
          x: { ticks: { color: p.text, font: { size: 11 } }, grid: { display: false } },
          y: {
            ticks: { color: p.text, font: { size: 11 } },
            grid: { color: p.grid },
            border: { dash: [4, 4], display: false },
            beginAtZero: true
          }
        }
      }
    });
  }

  window.AquaCharts = {
    destroy,
    renderBarLineRevenue,
    renderConsumptionBar,
    renderConsumptionLine,
    renderMethodDoughnut,
    refreshTheme
  };
})();
