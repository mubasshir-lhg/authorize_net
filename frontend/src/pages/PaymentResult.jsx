import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const invoiceId = params.get('invoiceId');
  const status = params.get('status');
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;
    // Poll briefly: the redirect from Authorize.net hits the backend at the
    // same time the frontend lands here, so the invoice may need a moment
    // to flip to `paid`.
    let tries = 0;
    async function tick() {
      try {
        const inv = await api.getInvoice(invoiceId);
        if (cancelled) return;
        setInvoice(inv);
        if (inv.status === 'pending' && tries < 6) {
          tries += 1;
          setTimeout(tick, 1000);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      }
    }
    tick();
    return () => { cancelled = true; };
  }, [invoiceId]);

  const finalStatus = invoice?.status || status || 'unknown';
  const isPaid = finalStatus === 'paid';
  const isCancel = finalStatus === 'cancel';

  return (
    <div className="container">
      <div className="card">
        <h1>{isPaid ? 'Payment Successful' : isCancel ? 'Payment Cancelled' : 'Payment Result'}</h1>

        {error && <div className="error">{error}</div>}

        {invoice ? (
          <ul className="kv">
            <li><span>Invoice</span><span>{invoice.id}</span></li>
            <li><span>Amount</span><span>${invoice.amount}</span></li>
            <li><span>Description</span><span>{invoice.description}</span></li>
            <li><span>Status</span><span className={`status ${invoice.status}`}>{invoice.status}</span></li>
            {invoice.transactionId && (
              <li><span>Transaction</span><span>{invoice.transactionId}</span></li>
            )}
          </ul>
        ) : (
          <p className="muted">Loading invoice…</p>
        )}

        <Link to="/" className="button-link">← New payment</Link>
      </div>
    </div>
  );
}
