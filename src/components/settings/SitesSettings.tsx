import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Building2, User, MapPin, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SiteModal } from '../SiteModal';
import { Site } from '../../types';

export function SitesSettings() {
  const { sites, users } = useStore();
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-50">Sites & Infrastructures</CardTitle>
            <CardDescription>Gérez les usines, dépôts et showrooms.</CardDescription>
          </div>
          <Button
            variant="neon"
            size="sm"
            onClick={() => {
              setEditingSite(null);
              setIsSiteModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Site
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {sites.map((site: Site) => {
              const manager = users.find((u) => u.id === site.managerId);
              return (
                <div
                  key={site.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200">{site.name}</p>
                        <Badge variant="outline" className="text-[10px] bg-slate-900">
                          {site.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {site.location.lat.toFixed(2)}, {site.location.lng.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> Dirigé par {manager?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-slate-200"
                      onClick={() => {
                        setEditingSite(site);
                        setIsSiteModalOpen(true);
                      }}
                    >
                      Éditer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <SiteModal
        isOpen={isSiteModalOpen}
        onClose={() => {
          setIsSiteModalOpen(false);
          setEditingSite(null);
        }}
        site={editingSite}
      />
    </>
  );
}
