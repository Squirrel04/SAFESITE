import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAlerts = useCallback(async () => {
        try {
            const response = await api.get('/alerts/', { params: { limit: 100 } });
            setAlerts(response.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    }, []);

    useEffect(() => {
        // Fetch immediately on mount
        fetchAlerts();

        // Poll every 15 seconds for new alerts
        const interval = setInterval(fetchAlerts, 15000);

        // Also listen for live pushes via WebSocket
        const ws = new WebSocket('ws://localhost:8000/ws/notifications');

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const newAlert = {
                    ...data,
                    id: data.id || data._id || Date.now() + Math.random().toString(36).substr(2, 9),
                    timestamp: data.timestamp || new Date().toISOString()
                };

                setAlerts(prev => {
                    const index = prev.findIndex(a => a.id === newAlert.id || a._id === newAlert.id);
                    if (index >= 0) {
                        const next = [...prev];
                        next[index] = { ...next[index], ...newAlert };
                        return next;
                    }
                    return [newAlert, ...prev].slice(0, 100);
                });
            } catch (err) {
                console.error("Failed to parse notification:", err);
            }
        };

        ws.onerror = (err) => console.error("Notification WS Error:", err);

        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, [fetchAlerts]);

    const refreshAlerts = fetchAlerts;

    const dismissAlert = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id && a._id !== id));
    };

    const clearAllAlerts = async () => {
        setIsDeleting(true);
        try {
            await api.post('/alerts/clear');
            setAlerts([]);
        } catch (err) {
            console.error("Failed to clear alerts:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <NotificationContext.Provider value={{ alerts, dismissAlert, refreshAlerts, setAlerts, isDeleting, setIsDeleting, clearAllAlerts }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
