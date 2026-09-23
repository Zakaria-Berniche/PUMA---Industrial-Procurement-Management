import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Site } from '../types';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  site?: Site | null;
}

export const SiteModal: React.FC<SiteModalProps> = ({ isOpen, onClose, site }) => {
  const { users, addSite, updateSite } = useStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<'Usine' | 'Showroom' | 'Dépôt' | 'Carrière'>('Usine');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [managerId, setManagerId] = useState('');

  const [prevSite, setPrevSite] = useState(site);

  if (site !== prevSite) {
    setPrevSite(site);
    if (site) {
      setName(site.name);
      setType(site.type);
      setLat(site.location.lat.toString());
      setLng(site.location.lng.toString());
      setManagerId(site.managerId);
    } else {
      setName('');
      setType('Usine');
      setLat('');
      setLng('');
      setManagerId('');
    }
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newSite: Site = {
      id: site ? site.id : `s${Date.now()}`,
      name,
      type,
      location: {
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0
      },
      managerId
    };

    if (site) {
      updateSite(newSite);
    } else {
      addSite(newSite);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-slate-50">{site ? 'Éditer le site' : 'Nouveau site'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="site-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du site</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Usine Nord"
                required
                className="bg-slate-950 border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(val: 'Usine' | 'Showroom' | 'Dépôt' | 'Carrière') => setType(val)}>
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Usine">Usine</SelectItem>
                  <SelectItem value="Showroom">Showroom</SelectItem>
                  <SelectItem value="Dépôt">Dépôt</SelectItem>
                  <SelectItem value="Carrière">Carrière</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="48.8566"
                  required
                  className="bg-slate-950 border-slate-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="2.3522"
                  required
                  className="bg-slate-950 border-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Responsable</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger className="bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Sélectionner un responsable" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" form="site-form" variant="neon">
            {site ? 'Enregistrer' : 'Créer le site'}
          </Button>
        </div>
      </div>
    </div>
  );
};
