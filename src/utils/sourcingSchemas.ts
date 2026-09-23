export interface SourcingField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export interface SourcingCategory {
  id: string;
  label: string;
  icon: string;
  fields: SourcingField[];
}

export const SOURCING_CATEGORIES: SourcingCategory[] = [
  {
    id: 'informatique',
    label: 'Matériel Informatique',
    icon: 'Laptop',
    fields: [
      { id: 'brand', label: 'Marque', type: 'text', placeholder: 'Ex: Dell, Apple, Lenovo', required: true },
      { id: 'model', label: 'Modèle', type: 'text', placeholder: 'Ex: Latitude 5420, MacBook Pro' },
      { id: 'ram', label: 'Mémoire RAM', type: 'select', options: ['8Go', '16Go', '32Go', '64Go', '128Go'] },
      { id: 'cpu', label: 'Processeur', type: 'text', placeholder: 'Ex: i7-12th Gen, M2 Max' },
      { id: 'storage', label: 'Stockage', type: 'select', options: ['256Go SSD', '512Go SSD', '1To SSD', '2To SSD'] }
    ]
  },
  {
    id: 'maintenance',
    label: 'Maintenance Industrielle',
    icon: 'Wrench',
    fields: [
      { id: 'machine_brand', label: 'Marque Machine', type: 'text', placeholder: 'Ex: Siemens, Schneider, ABB', required: true },
      { id: 'part_type', label: 'Type de pièce', type: 'text', placeholder: 'Ex: Automate, Capteur, Moteur' },
      { id: 'oem_ref', label: 'Référence OEM / Constructeur', type: 'text', placeholder: 'Ex: 6ES7-..., VW3A...' },
      { id: 'criticality', label: 'Niveau de Criticité', type: 'select', options: ['Faible', 'Moyen', 'Critique (Arrêt Production)'] }
    ]
  },
  {
    id: 'bureau',
    label: 'Mobilier & Bureau',
    icon: 'Desk',
    fields: [
      { id: 'item_type', label: 'Type d\'article', type: 'text', placeholder: 'Ex: Chaise ergonomique, Bureau assis-debout' },
      { id: 'material', label: 'Matériau souhaité', type: 'select', options: ['Bois', 'Métal', 'Plastique', 'Tissu'] },
      { id: 'dimensions', label: 'Dimensions approx.', type: 'text', placeholder: 'Ex: 160x80cm' }
    ]
  },
  {
    id: 'logistique',
    label: 'Logistique & Transport',
    icon: 'Truck',
    fields: [
      { id: 'freight_type', label: 'Type de Fret', type: 'select', options: ['Maritime', 'Aérien', 'Routier', 'Express'] },
      { id: 'weight', label: 'Poids estimé (Kg)', type: 'number' },
      { id: 'destination', label: 'Ville / Pays de destination', type: 'text', placeholder: 'Ex: Marseille, France' }
    ]
  },
  {
    id: 'services',
    label: 'Services & Prestations',
    icon: 'Briefcase',
    fields: [
      { id: 'service_type', label: 'Type de prestation', type: 'text', placeholder: 'Ex: Nettoyage industriel, Audit sécurité' },
      { id: 'duration', label: 'Durée estimée', type: 'text', placeholder: 'Ex: 3 mois, One-shot' },
      { id: 'expertise', label: 'Niveau d\'expertise', type: 'select', options: ['Standard', 'Expert', 'Certifié'] }
    ]
  }
];
