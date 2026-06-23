// Paste the Apps Script Web App /exec URL here after deploying apps_script.gs.
const API_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

const STAGES = ['Order Confirmed', 'In Production', 'Quality Check', 'Shipped', 'Out for Delivery', 'Delivered'];

const form = document.getElementById('lookup-form');
const lookupBtn = document.getElementById('lookup-btn');
const errEl = document.getElementById('lookup-err');

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  errEl.textContent = '';
  const code = document.getElementById('in-code').value.trim();
  const pin = document.getElementById('in-pin').value.trim();
  if (!code || !pin) return;

  lookupBtn.disabled = true;
  lookupBtn.textContent = 'Looking up…';
  try {
    const url = `${API_URL}?code=${encodeURIComponent(code)}&pin=${encodeURIComponent(pin)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.found) {
      errEl.textContent = data.error || 'No order found. Check your tracking code and PIN.';
      return;
    }
    renderResult(data.order);
  } catch (ex) {
    errEl.textContent = 'Something went wrong. Please try again shortly.';
  } finally {
    lookupBtn.disabled = false;
    lookupBtn.textContent = 'Track Order';
  }
});

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('result-card').classList.add('hidden');
  document.getElementById('lookup-card').classList.remove('hidden');
  document.getElementById('lookup-form').reset();
});

function renderResult(order) {
  document.getElementById('lookup-card').classList.add('hidden');
  document.getElementById('result-card').classList.remove('hidden');

  document.getElementById('r-product').textContent = order.product || 'Your order';
  document.getElementById('r-invoice').textContent = order.invoice_number ? `Invoice ${order.invoice_number}` : '';

  renderTimeline(order.stage);

  document.getElementById('r-eta').textContent = fmtDate(order.eta) || 'To be confirmed';
  document.getElementById('r-shipping').textContent = order.shipping_status || 'Awaiting update';

  const courierLink = document.getElementById('r-courier');
  if (order.courier_link) {
    courierLink.href = order.courier_link;
    courierLink.classList.remove('hidden');
  } else {
    courierLink.classList.add('hidden');
  }

  const notesWrap = document.getElementById('r-notes-wrap');
  if (order.notes) {
    document.getElementById('r-notes').textContent = order.notes;
    notesWrap.classList.remove('hidden');
  } else {
    notesWrap.classList.add('hidden');
  }

  const installWrap = document.getElementById('r-install-wrap');
  if (String(order.install_required).toLowerCase() === 'yes') {
    installWrap.classList.remove('hidden');
    const status = order.install_status || 'Not Scheduled';
    const badge = document.getElementById('r-install-status');
    badge.textContent = status;
    badge.className = 'badge ' + status.toLowerCase().replace(/\s+/g, '-');
    document.getElementById('r-install-date').textContent = fmtDate(order.install_date) || 'To be scheduled';
    document.getElementById('r-install-notes').textContent = order.install_notes || '';
  } else {
    installWrap.classList.add('hidden');
  }
}

function renderTimeline(stage) {
  const idx = Math.max(0, STAGES.indexOf(stage));
  const el = document.getElementById('r-timeline');
  const fillPct = STAGES.length > 1 ? (idx / (STAGES.length - 1)) * 100 : 0;

  el.innerHTML = `<div class="tl-line"></div><div class="tl-line-fill" style="width:${fillPct}%"></div>` +
    STAGES.map((s, i) => {
      const cls = i < idx ? 'done' : i === idx ? 'current' : '';
      return `<div class="tl-step ${cls}"><div class="tl-dot"></div><div class="tl-label">${s}</div></div>`;
    }).join('');
}

function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Allow direct links like https://yoursite/?code=SL-1042&pin=1234 so emails can deep-link straight to a result.
(function autoFillFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const pin = params.get('pin');
  if (code && pin) {
    document.getElementById('in-code').value = code;
    document.getElementById('in-pin').value = pin;
    form.requestSubmit();
  }
})();
