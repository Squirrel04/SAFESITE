import React, { createContext, useState, useContext, useEffect } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/notifications');
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const newAlert = {
                    ...data,
                    id: data.id || Date.now() + Math.random().toString(36).substr(2, 9),
                    timestamp: data.timestamp || new Date().toISOString()
                };
                
                // Add to start of list, limit to 20 for performance
                setAlerts(prev => [newAlert, ...prev].slice(0, 20));
            } catch (err) {
                console.error("Failed to parse notification:", err);
            }
        };

        ws.onerror = (err) => console.error("Notification WS Error:", err);
        
        return () => ws.close();
    }, []);

    const dismissAlert = (id) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ alerts, dismissAlert }}>
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
