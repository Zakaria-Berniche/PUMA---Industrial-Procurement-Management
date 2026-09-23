import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
  Camera,
  Save,
  Lock,
  User,
  Shield,
  Smartphone,
  Mail,
  Building,
  Briefcase,
  Calendar,
  Clock,
  Palette,
  Bell,
  Server
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Profile() {
  const { currentUser, updateUser, sites } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for form values
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    position: currentUser?.position || '',
    themePreference: currentUser?.themePreference || 'system',
    avatar: currentUser?.avatar || ''
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [notifications, setNotifications] = useState({
    email: currentUser?.notificationPreferences?.email ?? true,
    push: currentUser?.notificationPreferences?.push ?? true
  });

  const [smtp, setSmtp] = useState({
    host: currentUser?.smtpSettings?.host || '',
    port: currentUser?.smtpSettings?.port || 587,
    user: currentUser?.smtpSettings?.user || '',
    pass: currentUser?.smtpSettings?.pass || '',
    secure: currentUser?.smtpSettings?.secure || false
  });

  const [avatarError, setAvatarError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!currentUser) return null;

  const currentSite = sites.find((s) => s.id === currentUser.siteId);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError('');

    // Check type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Format non supporté. Utilisez JPG ou PNG.');
      return;
    }

    // Check size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("L'image ne doit pas dépasser 2 Mo.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatar: previewUrl }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Basic password validation
    if (passwords.new || passwords.current) {
      if (passwords.new !== passwords.confirm) {
        setPasswordError('Les mots de passe ne correspondent pas.');
        setIsSaving(false);
        return;
      }
      if (passwords.new.length < 8) {
        setPasswordError('Le nouveau mot de passe doit faire au moins 8 caractères.');
        setIsSaving(false);
        return;
      }
      setPasswordError('');
      // In a real app we'd call an API to change password here
    }

    setTimeout(() => {
      updateUser({
        ...currentUser,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        themePreference: formData.themePreference as 'light' | 'dark' | 'system',
        avatar: formData.avatar,
        notificationPreferences: {
          ...currentUser.notificationPreferences!,
          email: notifications.email,
          push: notifications.push
        },
        smtpSettings: smtp
      });

      // Clear password fields on successful save
      setPasswords({ current: '', new: '', confirm: '' });
      setIsSaving(false);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Mon Profil</h1>
          <p className="text-slate-400 mt-1">Gérez vos informations personnelles et vos préférences de sécurité</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-50 px-4 py-2 rounded-md font-semibold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          {isSaving ? (
            <span className="animate-pulse">Sauvegarde...</span>
          ) : (
            <>
              <Save className="w-4 h-4" /> Enregistrer
            </>
          )}
        </button>
      </div>

      {showSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-md flex items-center gap-2 animate-in slide-in-from-top-2">
          <Shield className="w-5 h-5" />
          Votre profil a été mis à jour avec succès.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & System Info */}
        <div className="space-y-6">
          {/* Avatar Card */}
          <Card className="bg-slate-900/50 border-slate-800 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-emerald-500/20 to-slate-900/0"></div>
            <CardContent className="pt-8 pb-6 px-6 relative z-10 flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full mb-4 group cursor-pointer" onClick={handleAvatarClick}>
                <img
                  src={
                    formData.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=10b981&color=fff`
                  }
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-4 border-slate-950 shadow-xl"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-xs font-semibold">Modifier</span>
                </div>
              </div>
              <input
                type="file"
                title="Télécharger un avatar"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg, image/png"
              />
              {avatarError && <p className="text-red-400 text-xs mt-2">{avatarError}</p>}

              <h2 className="text-xl font-bold text-slate-50">{formData.name}</h2>
              <p className="text-emerald-400 text-sm font-medium">{currentUser.role}</p>

              <div className="mt-4 inline-block bg-slate-950 px-3 py-1 rounded-full text-xs text-slate-400 border border-slate-800">
                Taille max: 2MB (JPG, PNG)
              </div>
            </CardContent>
          </Card>

          {/* System Info Card */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/50">
              <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Infos Système
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-slate-950 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Rôle Utilisateur</p>
                  <p className="text-slate-200">{currentUser.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-slate-950 flex items-center justify-center shrink-0">
                  <Building className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Accès Site</p>
                  <p className="text-slate-200">{currentSite?.name || 'Accès Global'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-slate-950 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Membre depuis</p>
                  <p className="text-slate-200">
                    {currentUser.createdAt
                      ? format(new Date(currentUser.createdAt), 'dd MMM yyyy', { locale: fr })
                      : 'Inconnu'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-md bg-slate-950 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Dernière connexion</p>
                  <p className="text-slate-200">
                    {currentUser.lastLogin
                      ? format(new Date(currentUser.lastLogin), 'dd MMM yyyy à HH:mm', { locale: fr })
                      : 'Inconnu'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Editing Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-lg text-slate-50 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" /> Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.name}
                    placeholder="Votre nom complet"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={formData.email}
                    placeholder="votre@email.com"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Téléphone</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+33 6 00 00 00 00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Poste / Fonction</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={formData.position}
                    placeholder="Votre poste actuel"
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-400">
                  Département (Verrouillé par l'administration)
                </label>
                <div className="relative opacity-70 cursor-not-allowed">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={currentUser.department}
                    disabled
                    title="Département"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-sm text-slate-50 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-lg text-slate-50 flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-500" /> Préférences Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Thème de l'application</h4>
                  <p className="text-xs text-slate-400 mt-1">Choisissez votre apparence préférée.</p>
                </div>
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFormData({ ...formData, themePreference: t })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${formData.themePreference === t ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-800"></div>

              <div>
                <h4 className="text-sm font-medium text-slate-200 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" /> Notifications globales
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <span className="block text-sm text-slate-300 group-hover:text-slate-200">
                        Notifications par Email
                      </span>
                      <span className="block text-xs text-slate-500">Recevoir des résumés d'activité par email</span>
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full relative transition-colors ${notifications.email ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                    >
                      <div
                        className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-1'}`}
                      ></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div>
                      <span className="block text-sm text-slate-300 group-hover:text-slate-200">
                        Notifications Push
                      </span>
                      <span className="block text-xs text-slate-500">Alertes en temps réel dans l'application</span>
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full relative transition-colors ${notifications.push ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
                    >
                      <div
                        className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${notifications.push ? 'translate-x-6' : 'translate-x-1'}`}
                      ></div>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-slate-900/50 border-slate-800 border-l-4 border-l-orange-500/50">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-lg text-slate-50 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-500" /> Sécurité du compte
              </CardTitle>
              <CardDescription className="text-slate-400">
                Modifiez votre mot de passe pour sécuriser votre compte.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Ancien mot de passe</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
              {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
            </CardContent>
          </Card>

          {/* SMTP Settings */}
          <Card className="bg-slate-900/50 border-slate-800 border-l-4 border-l-blue-500/50">
            <CardHeader className="border-b border-slate-800/50">
              <CardTitle className="text-lg text-slate-50 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" /> Serveur d'Envoi (SMTP)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurez votre messagerie professionnelle pour l'envoi d'emails (ex: factures, devis, Sourcing IA).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Hôte SMTP (ex: smtp.gmail.com)</label>
                  <input
                    type="text"
                    value={smtp.host}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    placeholder="smtp.example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Port (587, 465, 25)</label>
                  <input
                    type="number"
                    value={smtp.port}
                    onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 587 })}
                    placeholder="587"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Email / Nom d'utilisateur SMTP</label>
                  <input
                    type="text"
                    value={smtp.user}
                    onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                    placeholder="contact@puma.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-slate-400">Mot de passe (ou App Password)</label>
                  <input
                    type="password"
                    value={smtp.pass}
                    onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
