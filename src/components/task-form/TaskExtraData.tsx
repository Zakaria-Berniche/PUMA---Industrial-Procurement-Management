import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

interface TaskExtraDataProps {
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  customFields: { key: string; value: string }[];
  setCustomFields: React.Dispatch<React.SetStateAction<{ key: string; value: string }[]>>;
}

export function TaskExtraData({ tags, setTags, customFields, setCustomFields }: TaskExtraDataProps) {
  const { register } = useFormContext();
  const [tagsInput, setTagsInput] = useState('');

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagsInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagsInput.trim())) {
        setTags([...tags, tagsInput.trim()]);
      }
      setTagsInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const updateCustomField = (index: number, field: 'key' | 'value', val: string) => {
    const newFields = [...customFields];
    newFields[index][field] = val;
    setCustomFields(newFields);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-purple-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-100">Métadonnées & Tags</h3>
        </div>
        
        <div className="bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mots-clés (Entrée pour valider)</label>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl focus-within:border-purple-500/50 transition-all">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-400 px-3 py-1 rounded-lg text-xs font-bold border border-purple-500/20"
                >
                  {tag}
                  <button 
                    type="button" 
                    onClick={() => removeTag(tag)} 
                    title="Supprimer le tag"
                    className="hover:text-purple-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-100 min-w-[120px] py-1"
                placeholder="Ajouter un tag..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-slate-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-100">Commentaire Initial</h3>
        </div>
        
        <div className="bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
          <textarea
            {...register('initialComment')}
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-slate-500/50 transition-all placeholder:text-slate-700 resize-none"
            placeholder="Notes complémentaires pour l'équipe..."
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-lg font-bold text-slate-100">Champs Personnalisés</h3>
          </div>
          <button
            type="button"
            onClick={addCustomField}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {customFields.length > 0 ? (
          <div className="space-y-4">
            {customFields.map((field, index) => (
              <div key={index} className="flex items-center gap-4 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 shadow-inner group">
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                    placeholder="Clé (ex: N° Conteneur)"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                    placeholder="Valeur"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCustomField(index)}
                  title="Supprimer le champ"
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
            <p className="text-xs text-slate-600 font-medium uppercase tracking-widest">Aucun champ supplémentaire</p>
          </div>
        )}
      </div>
    </div>
  );
}
