const adminLogoutBtn = document.querySelector('#admin-logout-btn');
const statTotalTours = document.querySelector('#stat-total-tours');
const statTotalGuests = document.querySelector('#stat-total-guests');
const chartCanvas = document.querySelector('#guests-chart');

if (adminLogoutBtn) {
  adminLogoutBtn.addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

function formatMonthLabel(yyyyMM) {
  const [year, month] = yyyyMM.split('-');
  return `Th${parseInt(month, 10)}/${year.slice(2)}`;
}

async function init() {
  try {
    const res = await fetch('/api/admin/overview');
    if (!res.ok) throw new Error('Unauthorized');
    const data = await res.json();

    statTotalTours.textContent = data.totalCompletedTours;
    statTotalGuests.textContent = data.totalGuests;

    // Merge all months from both datasets
    const monthSet = new Set([
      ...data.past.map((r) => r.month),
      ...data.upcoming.map((r) => r.month)
    ]);
    const allMonths = Array.from(monthSet).sort();

    const pastMap = Object.fromEntries(data.past.map((r) => [r.month, r.guests]));
    const upcomingMap = Object.fromEntries(data.upcoming.map((r) => [r.month, r.guests]));

    const labels = allMonths.map((m) => formatMonthLabel(m));
    const pastValues = allMonths.map((m) => pastMap[m] || 0);
    const upcomingValues = allMonths.map((m) => upcomingMap[m] || 0);

    new Chart(chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Đã tham gia',
            data: pastValues,
            backgroundColor: 'rgba(20, 54, 0, 0.75)',
            borderColor: '#143600',
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false
          },
          {
            label: 'Sắp tham gia',
            data: upcomingValues,
            backgroundColor: 'rgba(196, 239, 164, 0.85)',
            borderColor: '#a8d38a',
            borderWidth: 0,
            borderRadius: 6,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              font: { family: 'Be Vietnam Pro', weight: '600', size: 11 },
              color: '#64748b',
              boxWidth: 12,
              boxHeight: 12,
              borderRadius: 4
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.parsed.y} khách`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Be Vietnam Pro', weight: '600', size: 11 },
              color: '#94a3b8'
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              stepSize: 1,
              font: { family: 'Be Vietnam Pro', weight: '600', size: 11 },
              color: '#94a3b8'
            }
          }
        }
      }
    });
  } catch (_e) {
    statTotalTours.textContent = '—';
    statTotalGuests.textContent = '—';
  }
}

init();
