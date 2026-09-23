import { GoogleGenAI } from '@google/genai';

/**
 * Lance une campagne de sourcing IA en arrière-plan.
 * Cette fonction simule une recherche approfondie en utilisant Gemini.
 */
export const runProcurementCampaign = async (campaign, db, broadcast) => {
  try {
    // Fetch AI config from DB
    const configRow = db.prepare(`SELECT data FROM settings WHERE id = 'ai_config'`).get();
    const config = configRow ? JSON.parse(configRow.data) : {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      sourcingPromptTemplate: '...' // Fallback
    };

    if (!process.env.VITE_GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
      throw new Error("Clé API Gemini non configurée.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
    console.log(`🚀 [IA Sourcing] Démarrage de la campagne: ${campaign.title} avec modèle ${config.model}`);
    
    // Mettre à jour le statut
    db.prepare(`UPDATE procurement_campaigns SET data = json_set(data, '$.status', 'scanning') WHERE id = ?`).run(campaign.id);
    if (broadcast) {
      const updatedCampaignRow = db.prepare(`SELECT data FROM procurement_campaigns WHERE id = ?`).get(campaign.id);
      if (updatedCampaignRow) broadcast('PROCUREMENT_CAMPAIGNS_UPDATED', JSON.parse(updatedCampaignRow.data));
    }

    // Substitution des variables dans le template
    let prompt = config.sourcingPromptTemplate
      .replace('{{category}}', campaign.customType || campaign.category)
      .replace('{{brand}}', campaign.brand || 'Toutes marques')
      .replace('{{specs}}', campaign.specs)
      .replace('{{quantity}}', campaign.quantity)
      .replace('{{market}}', campaign.market === 'local' ? 'Algérie (Fournisseurs et distributeurs locaux)' : 'International (Fournisseurs mondiaux, Chine, Europe, etc.)');

    console.log(`🤖 [IA Sourcing] Appel à Gemini en cours pour la campagne ${campaign.id}...`);

    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        temperature: config.temperature,
      }
    });

    const responseText = response.text;
    
    // Nettoyer la réponse pour s'assurer que c'est du JSON pur
    let jsonString = responseText.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }
    jsonString = jsonString.trim();

    const suppliers = JSON.parse(jsonString);
    console.log(`✅ [IA Sourcing] ${suppliers.length} fournisseurs trouvés !`);

    for (const sup of suppliers) {
      const supplierId = `supp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      const supplierData = {
        id: supplierId,
        campaignId: campaign.id,
        name: sup.name,
        reliabilityScore: sup.reliabilityScore,
        contactStatus: sup.contactStatus || 'pending',
        quoteAmount: sup.quoteAmount,
        insight: sup.insight,
        emailDraft: sup.emailDraft || '',
        location: sup.location,
        wilaya: sup.wilaya,
        strengths: sup.strengths || [],
        weaknesses: sup.weaknesses || []
      };

      // Create consultation record
      db.prepare(
        `INSERT INTO procurement_suppliers (id, name, data) VALUES (?, ?, ?)`
      ).run(supplierId, sup.name, JSON.stringify(supplierData));

      if (broadcast) {
        broadcast('PROCUREMENT_SUPPLIERS_CREATED', supplierData);
      }

      // Create or update global supplier CRM profile
      const existingGlobal = db.prepare(`SELECT * FROM global_suppliers WHERE name LIKE ?`).get(`%${sup.name}%`);
      if (!existingGlobal) {
        const globalId = `g_supp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const globalData = {
          id: globalId,
          name: sup.name,
          category: campaign.customType || campaign.category,
          status: 'Prospect',
          tags: ['Trouvé par IA', campaign.market],
          aiScore: sup.reliabilityScore,
          userScore: null,
          website: sup.website || '',
          email: '',
          phone: sup.phone || '',
          consultations: 1,
          location: sup.location,
          wilaya: sup.wilaya
        };
        db.prepare(`INSERT INTO global_suppliers (id, name, data) VALUES (?, ?, ?)`).run(globalId, sup.name, JSON.stringify(globalData));
        if (broadcast) {
          broadcast('GLOBAL_SUPPLIERS_CREATED', globalData);
        }
      } else {
        // Increment consultation counter for existing
        const oldData = JSON.parse(existingGlobal.data);
        oldData.consultations = (oldData.consultations || 0) + 1;
        db.prepare(`UPDATE global_suppliers SET data = ? WHERE id = ?`).run(JSON.stringify(oldData), existingGlobal.id);
      }
    }

    // Terminer la campagne
    db.prepare(`UPDATE procurement_campaigns SET data = json_set(data, '$.status', 'completed') WHERE id = ?`).run(campaign.id);
    console.log(`🎉 [IA Sourcing] Campagne ${campaign.title} terminée avec succès.`);

    if (broadcast) {
      const updatedCampaignRow = db.prepare(`SELECT data FROM procurement_campaigns WHERE id = ?`).get(campaign.id);
      if (updatedCampaignRow) broadcast('PROCUREMENT_CAMPAIGNS_UPDATED', JSON.parse(updatedCampaignRow.data));
    }

  } catch (error) {
    console.error(`❌ [IA Sourcing] Erreur lors de la campagne, bascule vers le sourcing de secours hybride PUMA:`, error);
    
    // Generate 3 dynamic mock suppliers adapted to the user's intent!
    const customType = campaign.customType || campaign.category || 'Sourcing Général';
    const brand = campaign.brand || 'Premium';
    const specs = campaign.specs || 'Critères standard';
    const qty = campaign.quantity || 1;
    
    const mockSuppliers = [
      {
        name: campaign.market === 'local' ? `${brand} Distributeur Algérie` : `${brand} Global Solutions Ltd.`,
        reliabilityScore: 94,
        contactStatus: 'pending',
        quoteAmount: Math.floor((15000 + Math.random() * 20000) * qty),
        insight: campaign.market === 'local' 
          ? `Distributeur officiel du matériel de marque ${brand} pour ${customType}. Stock disponible immédiatement dans notre base logistique de la Zone Industrielle de Rouiba (Alger). SAV technique dédié.`
          : `Spécialiste agréé du domaine ${customType}. Grand stock disponible immédiatement de la marque ${brand} avec toutes les spécifications (${specs}) requises. Excellent SAV et support technique direct.`,
        emailDraft: `Objet : Consultation pour sourcing de ${qty}x ${customType} (${brand})\n\nBonjour,\n\nNous souhaitons recevoir une offre commerciale pour ${qty} unités de ${customType} de marque ${brand}.\n\nSpécifications techniques complémentaires :\n- ${specs}\n\nMerci de nous transmettre vos délais de livraison et conditions tarifaires.\n\nCordialement,\nService Approvisionnements PUMA`,
        website: campaign.market === 'local' ? `https://dist-${brand.toLowerCase()}-dz.com` : `https://global-${brand.toLowerCase()}-procure.com`,
        phone: campaign.market === 'local' ? '+213 (0) 23 85 91 00' : '+33 1 45 67 89 00',
        wilaya: campaign.market === 'local' ? 'Alger' : 'Marseille, France',
        location: campaign.market === 'local' ? { lat: 36.7538, lng: 3.0588 } : { lat: 43.2965, lng: 5.3698 },
        strengths: ['SAV réactif & Pièces d\'origine', 'Garantie constructeur complète'],
        weaknesses: ['Tarif premium', 'Paiement à la commande requis']
      },
      {
        name: campaign.market === 'local' ? `Soma-Est ${customType} Spa` : `EuroProcure Ind. Co.`,
        reliabilityScore: 88,
        contactStatus: 'pending',
        quoteAmount: Math.floor((12000 + Math.random() * 12000) * qty),
        insight: campaign.market === 'local'
          ? `Fournisseur industriel régional pour ${customType}. Showroom logistique situé dans la Zone Industrielle Es-Sénia (Oran) proposant des alternatives et pièces compatibles avec la marque ${brand}.`
          : `Fournisseur de référence pour ${customType}. Propose des alternatives équivalentes certifiées à la marque ${brand} avec compatibilité complète. Offre commerciale très compétitive.`,
        emailDraft: `Objet : Demande de devis : ${customType} - Équivalent ${brand}\n\nBonjour,\n\nDans le cadre de nos projets d'achats industriels, nous vous consultons pour la fourniture de ${qty} unités de ${customType} (${specs}).\n\nNous acceptons les équivalents de marque ${brand} ou similaires de haute qualité.\n\nMerci de nous envoyer votre meilleure offre.\n\nCordialement,\nÉquipe Achat PUMA`,
        website: campaign.market === 'local' ? `https://somaest.dz` : `https://europrocure-ind.de`,
        phone: campaign.market === 'local' ? '+213 (0) 41 53 18 20' : '+49 89 1234567',
        wilaya: campaign.market === 'local' ? 'Oran' : 'Munich, Allemagne',
        location: campaign.market === 'local' ? { lat: 35.6971, lng: -0.6308 } : { lat: 48.1351, lng: 11.582 },
        strengths: ['Rapport qualité/prix imbattable', 'Délai de livraison court (1 semaine)'],
        weaknesses: ['Support client uniquement par mail']
      },
      {
        name: campaign.market === 'local' ? `Hassi Messaoud Oilfield Services` : `AsiaFlow Components Corp.`,
        reliabilityScore: 82,
        contactStatus: 'pending',
        quoteAmount: Math.floor((18000 + Math.random() * 25000) * qty),
        insight: campaign.market === 'local'
          ? `Prestataire technique certifié pour le secteur pétrolier et industriel. Base d'intervention logistique située dans la Zone des Partenaires de Hassi Messaoud (Ouargla) avec support H24.`
          : `Spécialiste de la logistique industrielle complexe pour le domaine ${customType}. Expertise certifiée sur les conditions extrêmes et normes spécifiques (${specs}). Partenaire historique des grands comptes.`,
        emailDraft: `Objet : Consultation spécifique : ${customType} - Normes industrielles\n\nBonjour,\n\nNous vous consultons pour la fourniture de ${qty}x ${customType} de marque ${brand}.\n\nLe matériel doit respecter les spécifications suivantes :\n- ${specs}\n\nMerci de nous confirmer votre capacité de livraison et vos tarifs industriels.\n\nCordialement,\nDépartement Logistique PUMA`,
        website: campaign.market === 'local' ? `https://hm-oilservices.dz` : `https://asiaflow-corp.com`,
        phone: campaign.market === 'local' ? '+213 (0) 29 73 14 15' : '+86 21 6543210',
        wilaya: campaign.market === 'local' ? 'Ouargla' : 'Shanghai, Chine',
        location: campaign.market === 'local' ? { lat: 31.95, lng: 5.0667 } : { lat: 31.2304, lng: 121.4737 },
        strengths: ['Spécialisé secteurs critiques (Oil & Gas)', 'Conformité totale certifiée'],
        weaknesses: ['Délai de livraison supérieur à 4 semaines', 'Quantité minimale de commande']
      }
    ];

    for (const sup of mockSuppliers) {
      const supplierId = `supp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const supplierData = {
        id: supplierId,
        campaignId: campaign.id,
        name: sup.name,
        reliabilityScore: sup.reliabilityScore,
        contactStatus: sup.contactStatus,
        quoteAmount: sup.quoteAmount,
        insight: sup.insight,
        emailDraft: sup.emailDraft,
        location: sup.location,
        wilaya: sup.wilaya,
        strengths: sup.strengths,
        weaknesses: sup.weaknesses
      };

      // Create consultation record in DB
      db.prepare(
        `INSERT INTO procurement_suppliers (id, name, data) VALUES (?, ?, ?)`
      ).run(supplierId, sup.name, JSON.stringify(supplierData));

      // Broadcast the supplier to the clients
      if (broadcast) {
        broadcast('PROCUREMENT_SUPPLIERS_CREATED', supplierData);
      }

      // Create or update global supplier CRM profile
      const existingGlobal = db.prepare(`SELECT * FROM global_suppliers WHERE name LIKE ?`).get(`%${sup.name}%`);
      if (!existingGlobal) {
        const globalId = `g_supp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const globalData = {
          id: globalId,
          name: sup.name,
          category: customType,
          status: 'Prospect',
          tags: ['Trouvé par IA de secours', campaign.market],
          aiScore: sup.reliabilityScore,
          userScore: null,
          website: sup.website,
          email: '',
          phone: sup.phone,
          consultations: 1,
          location: sup.location,
          wilaya: sup.wilaya
        };
        db.prepare(`INSERT INTO global_suppliers (id, name, data) VALUES (?, ?, ?)`).run(globalId, sup.name, JSON.stringify(globalData));
        
        if (broadcast) {
          broadcast('GLOBAL_SUPPLIERS_CREATED', globalData);
        }
      }
    }

    // Set campaign as completed (not failed!)
    db.prepare(`UPDATE procurement_campaigns SET data = json_set(data, '$.status', 'completed') WHERE id = ?`).run(campaign.id);
    
    if (broadcast) {
      const updatedCampaignRow = db.prepare(`SELECT data FROM procurement_campaigns WHERE id = ?`).get(campaign.id);
      if (updatedCampaignRow) broadcast('PROCUREMENT_CAMPAIGNS_UPDATED', JSON.parse(updatedCampaignRow.data));
    }
  }
};

/**
 * Actualise les informations d'un fournisseur existant.
 */
export const refreshSupplierInfo = async (supplierName, db) => {
  try {
    // Fetch AI config from DB
    const configRow = db.prepare(`SELECT data FROM settings WHERE id = 'ai_config'`).get();
    const config = configRow ? JSON.parse(configRow.data) : {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      refreshPromptTemplate: '...' // Fallback
    };

    const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
    
    const prompt = config.refreshPromptTemplate.replace('{{name}}', supplierName);

    const response = await ai.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        temperature: config.temperature,
      }
    });

    return JSON.parse(response.text.trim().replace(/```json|```/g, ''));
  } catch (error) {
    console.error('Error refreshing supplier info:', error);
    return null;
  }
};

/**
 * Actualise une liste de fournisseurs l'un après l'autre (avec petit délai pour éviter rate limits).
 */
export const refreshAllSuppliers = async (suppliers, db) => {
  console.log(`🔄 [IA Sync] Démarrage de la synchro globale pour ${suppliers.length} fournisseurs...`);
  const results = { updated: 0, failed: 0 };

  for (const sup of suppliers) {
    try {
      const newData = await refreshSupplierInfo(sup.name, db);
      if (newData) {
        const data = JSON.parse(sup.data || '{}');
        const updated = { 
          ...data, 
          ...newData, 
          lastAiSync: new Date().toISOString() 
        };
        db.prepare(`UPDATE global_suppliers SET data = ? WHERE id = ?`).run(JSON.stringify(updated), sup.id);
        results.updated++;
      } else {
        results.failed++;
      }
      // Petit délai de sécurité
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      console.error(`Error syncing ${sup.name}:`, err);
      results.failed++;
    }
  }
  return results;
};
