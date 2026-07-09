import { ENDPOINTS, APP_URL } from './config';
import { fetchWithTimeout } from './async';
import { jsonHeaders } from './apiHeaders';

/**
 * Fires the n8n invite webhook. This is intentionally non-critical:
 * Firebase is the source of truth for client creation.
 */
export async function sendPortalInvite({ name, email, phone }) {
  if (!email) {
    console.warn('Cannot send invite: missing email address');
    return false;
  }

  const payload = {
    name: name || 'Athlete',
    email,
    phone: phone || '',
    appUrl: `${APP_URL}/client/login`,
  };

  try {
    const res = await fetchWithTimeout(ENDPOINTS.INVITE, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    }, 10000);

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      console.warn(`Invite webhook returned ${res.status}:`, errText);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Invite send failed (non-critical):', error.message || error);
    return false;
  }
}
