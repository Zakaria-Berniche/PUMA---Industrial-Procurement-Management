import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function NotificationsSettings() {
  const { currentUser, updateUser } = useStore();

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: currentUser?.notificationPreferences?.email ?? true,
    push: currentUser?.notificationPreferences?.push ?? true,
    taskAssigned: currentUser?.notificationPreferences?.taskAssigned ?? true,
    workflowStepCompleted: currentUser?.notificationPreferences?.workflowStepCompleted ?? true,
    validationRequired: currentUser?.notificationPreferences?.validationRequired ?? true,
    taskOverdue: currentUser?.notificationPreferences?.taskOverdue ?? true,
    newComment: currentUser?.notificationPreferences?.newComment ?? true,
    taskCompleted: currentUser?.notificationPreferences?.taskCompleted ?? true
  });

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [savePrefsSuccess, setSavePrefsSuccess] = useState(false);

  const handleSaveNotificationPrefs = () => {
    if (!currentUser) return;
    setIsSavingPrefs(true);
    setTimeout(() => {
      updateUser({
        ...currentUser,
        notificationPreferences: notificationPrefs
      });
      setIsSavingPrefs(false);
      setSavePrefsSuccess(true);
      setTimeout(() => setSavePrefsSuccess(false), 3000);
    }, 600);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader>
        <CardTitle className="text-xl text-slate-50">Préférences de Notifications</CardTitle>
        <CardDescription>Gérez comment et quand vous souhaitez être notifié.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-slate-200 uppercase tracking-wider">Canaux de notification</h3>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-200">Notifications Push</p>
              <p className="text-xs text-slate-400 mt-1">Recevoir des notifications dans l'application</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                title="Notifications Push"
                className="sr-only peer"
                checked={notificationPrefs.push}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-200">Emails</p>
              <p className="text-xs text-slate-400 mt-1">Recevoir un résumé par email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                title="Notifications Emails"
                className="sr-only peer"
                checked={notificationPrefs.email}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-medium text-slate-200 uppercase tracking-wider">Événements</h3>

          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-950 transition-colors">
              <span className="text-sm text-slate-300">Nouvelle tâche assignée</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  title="Nouvelle tâche assignée"
                  className="sr-only peer"
                  checked={notificationPrefs.taskAssigned}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, taskAssigned: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-950 transition-colors">
              <span className="text-sm text-slate-300">Étape de workflow terminée</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  title="Étape de workflow terminée"
                  className="sr-only peer"
                  checked={notificationPrefs.workflowStepCompleted}
                  onChange={(e) =>
                    setNotificationPrefs({ ...notificationPrefs, workflowStepCompleted: e.target.checked })
                  }
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-950 transition-colors">
              <span className="text-sm text-slate-300">Validation requise</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  title="Validation requise"
                  className="sr-only peer"
                  checked={notificationPrefs.validationRequired}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, validationRequired: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-950 transition-colors">
              <span className="text-sm text-slate-300">Tâche en retard</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  title="Tâche en retard"
                  className="sr-only peer"
                  checked={notificationPrefs.taskOverdue}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, taskOverdue: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-950 transition-colors">
              <span className="text-sm text-slate-300">Nouveau commentaire</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  title="Nouveau commentaire"
                  className="sr-only peer"
                  checked={notificationPrefs.newComment}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, newComment: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-950 transition-colors">
              <span className="text-sm text-slate-300">Tâche terminée</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  title="Tâche terminée"
                  className="sr-only peer"
                  checked={notificationPrefs.taskCompleted}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, taskCompleted: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            variant="neon"
            onClick={handleSaveNotificationPrefs}
            disabled={isSavingPrefs}
            className={
              savePrefsSuccess
                ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                : ''
            }
          >
            {isSavingPrefs ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-50/30 border-t-slate-50 rounded-full animate-spin"></div>
                Enregistrement...
              </span>
            ) : savePrefsSuccess ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Préférences enregistrées
              </span>
            ) : (
              'Enregistrer les préférences'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
