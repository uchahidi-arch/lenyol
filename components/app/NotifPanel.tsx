'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Notif {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  created_at: string;
  type?: string;
  data?: any;
}

interface NotifPanelProps {
  open: boolean;
  onClose: () => void;
  onCountChange: (n: number) => void;
}

export default function NotifPanel({ open, onClose, onCountChange }: NotifPanelProps) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  useEffect(() => {
    onCountChange(notifs.filter(n => !n.read).length);
  }, [notifs]);

  const load = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotifs(data || []);
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('user_id', user!.id).eq('read', false);
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className={`notif-panel${open ? ' open' : ''}`} id="notif-panel">
      <div className="notif-hdr">
        <div className="notif-title">Notifications</div>
        <span className="notif-mark" onClick={markAllRead}>Tout marquer lu</span>
      </div>
      <div className="notif-list">
        {notifs.length === 0 ? (
          <div className="notif-empty">Aucune notification</div>
        ) : (
          notifs.map(n => (
            <div
              key={n.id}
              className={`notif-item${n.read ? '' : ' unread'}`}
              onClick={() => markRead(n.id)}
            >
              <div className="notif-item-title">{n.title}</div>
              {n.body && <div className="notif-item-body">{n.body}</div>}
              <div className="notif-item-time">
                {n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR') : ''}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
