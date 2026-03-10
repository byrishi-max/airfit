import { useState } from 'react';
import {
    getAdminSession, setAdminSession, clearAdminSession,
    getClientSession, setClientSession, clearClientSession
} from '../utils/storage';

export const useAdminAuth = () => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(getAdminSession());

    const login = (password) => {
        if (password === 'airfitadmin2025') {
            setAdminSession();
            setIsAdminLoggedIn(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        clearAdminSession();
        setIsAdminLoggedIn(false);
    };

    return { isAdminLoggedIn, login, logout };
};

export const useClientAuth = () => {
    const [clientSession, setSession] = useState(getClientSession());

    const loginByPhone = (rawPhone) => {
        // Normalize: strip spaces
        const phone = rawPhone.trim().replace(/\s+/g, '');
        // Try exact match or suffix match (for country code variants)
        const clients = JSON.parse(localStorage.getItem('airfit_clients') || '[]');
        const client = clients.find(c => {
            const stored = (c.phone || '').trim().replace(/\s+/g, '');
            return stored === phone || stored.endsWith(phone) || phone.endsWith(stored);
        });

        if (!client) {
            return { success: false, error: 'No account found with this phone number. Contact your gym admin.' };
        }

        const sessionData = {
            clientId: client.clientId,
            name: client.name,
            email: client.email,
            phone: client.phone
        };
        setClientSession(sessionData);
        setSession(sessionData);
        return { success: true, client };
    };

    const logout = () => {
        clearClientSession();
        setSession(null);
    };

    return {
        isClientLoggedIn: !!clientSession,
        client: clientSession,
        loginByPhone,
        logout
    };
};
