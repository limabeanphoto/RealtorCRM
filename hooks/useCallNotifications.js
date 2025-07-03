// Hook for handling real-time call completion notifications
import { useState, useEffect, useCallback } from 'react';

const useCallNotifications = (userId) => {
  const [callNotification, setCallNotification] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Poll for completed calls (simple approach without WebSocket)
  const pollForCompletedCalls = useCallback(async () => {
    if (!userId || !isListening) return;

    try {
      const response = await fetch(`/api/openphone/pending-calls?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check for newly completed calls
        const completedCall = data.find(call => 
          call.status === 'completed' && 
          !call.notificationShown &&
          call.openPhoneCallId // Only show for calls that were matched
        );

        if (completedCall) {
          setCallNotification({
            call: completedCall,
            contact: completedCall.contact,
            timestamp: new Date()
          });

          // Mark as notification shown to prevent duplicates
          await fetch(`/api/openphone/pending-calls/${completedCall.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ notificationShown: true })
          });
        }
      }
    } catch (error) {
      console.error('Error polling for completed calls:', error);
    }
  }, [userId, isListening]);

  // Start/stop listening for call completions
  const startListening = useCallback(() => {
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  // Clear the current notification
  const clearNotification = useCallback(() => {
    setCallNotification(null);
  }, []);

  // Set up polling interval
  useEffect(() => {
    if (!isListening) return;

    const interval = setInterval(pollForCompletedCalls, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [pollForCompletedCalls, isListening]);

  // Auto-start listening when userId is available
  useEffect(() => {
    if (userId) {
      startListening();
    }

    return () => stopListening();
  }, [userId, startListening, stopListening]);

  return {
    callNotification,
    isListening,
    startListening,
    stopListening,
    clearNotification
  };
};

export default useCallNotifications;