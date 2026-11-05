  document.querySelectorAll<HTMLFormElement>('form.newsletter-form').forEach((form) => {
    const status = form.parentElement?.querySelector<HTMLParagraphElement>('.newsletter-status');
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const originalLabel = btn?.textContent ?? 'Subscribe';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!status || !btn) return;

      btn.disabled = true;
      btn.textContent = 'Subscribing...';
      status.hidden = true;

      const data = Object.fromEntries(new FormData(form).entries());

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const body = await res.json();

        if (res.ok && body.success) {
          status.textContent = form.dataset.success || "You're on the list. Thanks!";
          status.className = 'newsletter-status success';
          status.hidden = false;
          form.reset();
        } else {
          status.textContent = body.error || 'Something went wrong. Please try again.';
          status.className = 'newsletter-status error';
          status.hidden = false;
        }
      } catch {
        status.textContent = 'Network error. Please try again.';
        status.className = 'newsletter-status error';
        status.hidden = false;
      }

      btn.disabled = false;
      btn.textContent = originalLabel;
      (window as any).turnstile?.reset(form.querySelector('.cf-turnstile'));
    });
  });
