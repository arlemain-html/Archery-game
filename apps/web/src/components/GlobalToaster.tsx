"use client";

import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { useNotificationStore } from '../stores/notification.store';

export function GlobalToaster() {
  const notifications = useNotificationStore(state => state.notifications);
  const removeNotification = useNotificationStore(state => state.removeNotification);

  useEffect(() => {
    notifications.forEach((notif) => {
      // Show toast
      if (notif.type === 'success') {
        toast.success(notif.title, { description: notif.message });
      } else if (notif.type === 'error') {
        toast.error(notif.title, { description: notif.message });
      } else if (notif.type === 'warning') {
        toast.warning(notif.title, { description: notif.message });
      } else {
        toast.info(notif.title, { description: notif.message });
      }

      // Remove from store after rendering
      removeNotification(notif.id);
    });
  }, [notifications, removeNotification]);

  return <Toaster position="bottom-right" richColors />;
}
