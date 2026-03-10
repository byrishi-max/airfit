import { ENDPOINTS, APP_URL } from './config';

/**
 * sendPortalInvite — fires the n8n airfit-invite webhook
 * to email the client a portal access link.
 */
export async function sendPortalInvite({ name, email, phone }) {
    if (!email) {
        console.warn('⚠️ Cannot send invite: missing email address');
        return false;
    }

    const payload = {
        name:   name  || 'Athlete',
        email:  email,
        phone:  phone || '',
        appUrl: `${APP_URL}/client/login`
    };

    console.log('📧 Sending invite to:', email, 'Payload:', JSON.stringify(payload));

    try {
        const res = await fetch(ENDPOINTS.INVITE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text().catch(() => 'unknown');
            console.warn(`⚠️ Invite webhook returned ${res.status}:`, errText);
            return false;
        }

        const data = await res.json().catch(() => ({}));
        console.log('✅ Invite sent to', email, '—', data.message || 'OK');
        return true;
    } catch (e) {
        console.warn('⚠️ Invite send failed (non-critical):', e.message || e);
        return false;
    }
}
