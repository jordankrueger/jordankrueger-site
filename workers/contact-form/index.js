export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, env.ALLOWED_ORIGIN);
    }

    try {
      const data = await request.formData();
      const name = (data.get('name') || '').trim();
      const email = (data.get('email') || '').trim();
      const message = (data.get('message') || '').trim();

      if (!name || !email || !message) {
        return jsonResponse({ error: 'All fields are required' }, 400, env.ALLOWED_ORIGIN);
      }

      if (name.length > 128 || email.length > 128 || message.length > 16384) {
        return jsonResponse({ error: 'Field too long' }, 400, env.ALLOWED_ORIGIN);
      }

      if (!email.includes('@') || !email.includes('.')) {
        return jsonResponse({ error: 'Invalid email address' }, 400, env.ALLOWED_ORIGIN);
      }

      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${name} via jordankrueger.com <${env.FROM_EMAIL}>`,
          to: [env.TO_EMAIL],
          reply_to: email,
          subject: `Contact form: ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
          html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
<p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
<hr>
<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
        }),
      });

      if (!resendResponse.ok) {
        const err = await resendResponse.text();
        console.error('Resend error:', err);
        return jsonResponse({ error: 'Failed to send message' }, 500, env.ALLOWED_ORIGIN);
      }

      return jsonResponse({ success: true }, 200, env.ALLOWED_ORIGIN);
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal error' }, 500, env.ALLOWED_ORIGIN);
    }
  },
};

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
