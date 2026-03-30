import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchInitialAlerts = async () => {
            try {
                const response = await api.get('/alerts/', { params: { limit: 10000 } });
                setAlerts(response.data);
            } catch (err) {
                console.error("Failed to fetch initial notifications:", err);
            }
        };

        fetchInitialAlerts();

        const ws = new WebSocket('ws://localhost:8000/ws/notifications');
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const newAlert = {
                    ...data,
                    id: data.id || Date.now() + Math.random().toString(36).substr(2, 9),
                    timestamp: data.timestamp || new Date().toISOString()
                };
                
                // Add or update list, limit to 10000 for better persistence
                setAlerts(prev => {
                    const index = prev.findIndex(a => a.id === newAlert.id || a._id === newAlert.id);
                    if (index >= 0) {
                        const next = [...prev];
                        next[index] = { ...next[index], ...newAlert };
                        return next;
                    }
                    return [newAlert, ...prev].slice(0, 10000);
                });
            } catch (err) {
                console.error("Failed to parse notification:", err);
            }
        };

        ws.onerror = (err) => console.error("Notification WS Error:", err);
        
        // Background sync every 30 seconds
        const interval = setInterval(fetchInitialAlerts, 30000);
        
        return () => {
            ws.close();
            clearInterval(interval);
        };
    }, []);

    const refreshAlerts = async () => {
        try {
            const response = await api.get('/alerts/', { params: { limit: 10000 } });
            setAlerts(response.data);
        } catch (err) {
            console.error("Failed to refresh notifications:", err);
        }
    };

    const dismissAlert = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ alerts, dismissAlert, refreshAlerts, setAlerts, isDeleting, setIsDeleting }}>
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
