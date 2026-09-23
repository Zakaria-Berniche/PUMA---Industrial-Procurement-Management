import { WorkflowTemplate } from '../types';

export interface LintIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  category: 'Conformité' | 'Optimisation' | 'Sécurité';
}

export function lintWorkflow(template: WorkflowTemplate): LintIssue[] {
  const issues: LintIssue[] = [];
  const steps = template.steps;

  // 1. Basic Structure Checks
  if (steps.length === 0) {
    issues.push({
      id: 'empty_workflow',
      type: 'error',
      message: 'Le workflow ne contient aucune étape opérationnelle.',
      category: 'Conformité'
    });
    return issues;
  }

  // 2. Logic & Complexity Checks
  const hasValidation = steps.some(s => s.isValidationRequired);
  if (template.complexity === 'Complexe' && !hasValidation) {
    issues.push({
      id: 'missing_validation_complex',
      type: 'error',
      message: 'Un workflow complexe doit contenir au moins une étape de validation hiérarchique.',
      category: 'Sécurité'
    });
  }

  // 3. CAPEX Specific Rules
  if (template.name.toLowerCase().includes('capex') || template.type === 'Achat Stratégique') {
    const hasContract = steps.some(s => s.title.toLowerCase().includes('contrat') || s.type === 'Administratif');
    if (!hasContract) {
      issues.push({
        id: 'missing_contract_capex',
        type: 'warning',
        message: 'Pour un achat CAPEX/Stratégique, un bloc "Signature Contrat" est fortement recommandé.',
        category: 'Conformité'
      });
    }
  }

  // 4. IT Specific Rules
  if (template.name.toLowerCase().includes('it') || template.name.toLowerCase().includes('informatique')) {
    const hasDsi = steps.some(s => s.title.toLowerCase().includes('dsi') || s.title.toLowerCase().includes('it'));
    if (!hasDsi) {
      issues.push({
        id: 'missing_dsi_validation',
        type: 'warning',
        message: 'Les achats IT devraient inclure une validation de conformité DSI.',
        category: 'Conformité'
      });
    }
  }

  // 5. Import Specific Rules
  if (template.name.toLowerCase().includes('import') || template.name.toLowerCase().includes('international')) {
    const hasCustoms = steps.some(s => s.title.toLowerCase().includes('douane') || s.title.toLowerCase().includes('transit'));
    if (!hasCustoms) {
      issues.push({
        id: 'missing_customs',
        type: 'error',
        message: 'Un workflow d\'importation doit obligatoirement inclure un bloc "Douane & Documents".',
        category: 'Conformité'
      });
    }
  }

  // 6. SLA Optimization
  const totalSla = steps.reduce((acc, s) => acc + (s.slaHours || 0), 0);
  if (template.type === 'Achat Urgent' && totalSla > 120) {
    issues.push({
      id: 'long_sla_urgent',
      type: 'warning',
      message: 'Le SLA total dépasse 5 jours pour un achat urgent. Envisagez de simplifier les étapes.',
      category: 'Optimisation'
    });
  }

  // 7. Step Specific Checks
  steps.forEach((step) => {
    if (!step.slaHours || step.slaHours <= 0) {
      issues.push({
        id: `missing_sla_${step.id}`,
        type: 'error',
        message: `L'étape "${step.title}" n'a pas de délai (SLA) défini.`,
        category: 'Conformité'
      });
    }

    if (step.isCritical && !step.isValidationRequired) {
      issues.push({
        id: `critical_no_val_${step.id}`,
        type: 'info',
        message: `L'étape "${step.title}" est marquée critique mais ne nécessite pas de validation.`,
        category: 'Sécurité'
      });
    }
  });

  return issues;
}
