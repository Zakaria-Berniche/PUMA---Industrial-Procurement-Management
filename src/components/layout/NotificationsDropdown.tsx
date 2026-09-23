import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCircle2, MessageSquare, AlertCircle, Clock, FileText } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotificationType, Notification } from '../../types';
import { useNavigate } from 'react-router-dom';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'comments'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, currentUser, markNotificationAsRead, markAllNotificationsAsRead } = useStore();

  const userNotifications = (notifications || []).filter((n) => n.userId === currentUser?.id);
  const unreadCount = (userNotifications || []).filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'WORKFLOW_STEP_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'VALIDATION_REQUIRED':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'TASK_OVERDUE':
        return <Clock className="w-4 h-4 text-red-400" />;
      case 'NEW_COMMENT':
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
      case 'TASK_COMPLETED':
        return <Check className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredNotifications = userNotifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'critical') return n.type === 'VALIDATION_REQUIRED' || n.type === 'TASK_OVERDUE';
    if (filter === 'comments') return n.type === 'NEW_COMMENT';
    return true;
  });

  // Timeframe grouping
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const groups = {
    today: [] as Notification[],
    thisWeek: [] as Notification[],
    older: [] as Notification[]
  };

  filteredNotifications.forEach(n => {
    const d = new Date(n.createdAt);
    if (d >= today) {
      groups.today.push(n);
    } else if (d >= startOfWeek) {
      groups.thisWeek.push(n);
    } else {
      groups.older.push(n);
    }
  });

  const renderNotificationList = (list: Notification[]) => (
    <div className="divide-y divide-slate-800/30">
      {list.map((notification) => (
        <div
          key={notification.id}
          className={`p-3.5 hover:bg-slate-800/40 transition-colors cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-slate-950/20' : 'opacity-65'}`}
          onClick={() => {
            if (!notification.isRead) {
              markNotificationAsRead(notification.id);
            }
            if (notification.relatedTaskId) {
              navigate(`/tasks?taskId=${notification.relatedTaskId}`);
              setIsOpen(false);
            }
          }}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${!notification.isRead ? 'bg-slate-900 border-slate-700' : 'bg-slate-950 border-slate-800'}`}
          >
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-0.5">
              <p
                className={`text-xs font-semibold truncate pr-2 ${!notification.isRead ? 'text-slate-200' : 'text-slate-400'}`}
              >
                {notification.title}
              </p>
              <span className="text-[9px] text-slate-500 whitespace-nowrap shrink-0">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{notification.message}</p>
          </div>
          {!notification.isRead && (
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0 animate-pulse"></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-50 transition-colors rounded-full hover:bg-slate-900 focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-slate-950 font-black text-[9px] rounded-full flex items-center justify-center border border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
            <h3 className="font-semibold text-slate-50">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsAsRead}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium"
              >
                <Check className="w-3 h-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex gap-1 p-2 bg-slate-950/20 border-b border-slate-800/60 overflow-x-auto select-none scrollbar-hide">
            {(['all', 'unread', 'critical', 'comments'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors whitespace-nowrap ${
                  filter === cat
                    ? 'bg-slate-805 text-emerald-400 border border-slate-700/65'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                {cat === 'all' && 'Toutes'}
                {cat === 'unread' && 'Non lues'}
                {cat === 'critical' && 'Critiques'}
                {cat === 'comments' && 'Commentaires'}
              </button>
            ))}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-20 text-slate-400" />
                <p className="text-xs">Aucune notification correspondante</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/40">
                {groups.today.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-slate-950/40 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      Aujourd'hui
                    </div>
                    {renderNotificationList(groups.today)}
                  </div>
                )}
                {groups.thisWeek.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-slate-950/40 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      Cette semaine
                    </div>
                    {renderNotificationList(groups.thisWeek)}
                  </div>
                )}
                {groups.older.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 bg-slate-950/40 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      Plus anciennes
                    </div>
                    {renderNotificationList(groups.older)}
                  </div>
                )}
              </div>
            )}
          </div>

          {userNotifications.length > 0 && (
            <div className="p-2 border-t border-slate-800 bg-slate-950/50 text-center">
              <button
                onClick={() => {
                  navigate('/tasks');
                  setIsOpen(false);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
