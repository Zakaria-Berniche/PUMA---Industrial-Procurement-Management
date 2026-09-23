import { describe, it, expect } from 'vitest';
import { lintWorkflow, LintIssue } from './workflowLinter';
import { WorkflowTemplate, WorkflowTemplateStep } from '../types';

const makeStep = (overrides: Partial<WorkflowTemplateStep> = {}): WorkflowTemplateStep => ({
  id: `step_${Math.random().toString(36).substr(2, 6)}`,
  title: 'Étape Test',
  type: 'Analyse',
  isValidationRequired: false,
  slaHours: 8,
  order: 0,
  microSteps: [],
  ...overrides
});

const makeTemplate = (overrides: Partial<WorkflowTemplate> = {}): WorkflowTemplate => ({
  id: 'wt_test',
  name: 'Template Test',
  description: 'Template de test',
  type: 'Achat Standard',
  steps: [
    makeStep({ id: 'step_1', title: 'Analyse besoin', slaHours: 8, order: 0 }),
    makeStep({ id: 'step_2', title: 'Consultation fournisseur', slaHours: 24, order: 1 }),
  ],
  complexity: 'Simple',
  estimatedTotalSlaHours: 32,
  ...overrides
});

describe('lintWorkflow', () => {
  it('retourne une erreur si le workflow ne contient aucune étape', () => {
    const template = makeTemplate({ steps: [] });
    const issues = lintWorkflow(template);
    expect(issues).toHaveLength(1);
    expect(issues[0].id).toBe('empty_workflow');
    expect(issues[0].type).toBe('error');
  });

  it('passe sans erreur sur un template simple valide', () => {
    const template = makeTemplate();
    const issues = lintWorkflow(template);
    const errors = issues.filter(i => i.type === 'error');
    expect(errors).toHaveLength(0);
  });

  it('signale une erreur pour un workflow complexe sans étape de validation', () => {
    const template = makeTemplate({
      complexity: 'Complexe',
      steps: [
        makeStep({ slaHours: 12, isValidationRequired: false }),
        makeStep({ slaHours: 24, isValidationRequired: false }),
      ]
    });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === 'missing_validation_complex');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('error');
    expect(issue?.category).toBe('Sécurité');
  });

  it('ne signale pas d\'erreur pour un workflow complexe avec validation', () => {
    const template = makeTemplate({
      complexity: 'Complexe',
      steps: [
        makeStep({ slaHours: 12, isValidationRequired: true }),
        makeStep({ slaHours: 24 }),
      ]
    });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === 'missing_validation_complex');
    expect(issue).toBeUndefined();
  });

  it('signale un warning pour un workflow d\'import sans bloc douane', () => {
    const template = makeTemplate({
      name: 'Achat Import International',
      steps: [makeStep({ slaHours: 12 })]
    });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === 'missing_customs');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('error');
  });

  it('ne signale pas d\'erreur douane si le workflow contient une étape douane', () => {
    const template = makeTemplate({
      name: 'Achat Import',
      steps: [makeStep({ title: 'Dédouanement & Douane', slaHours: 12 })]
    });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === 'missing_customs');
    expect(issue).toBeUndefined();
  });

  it('signale une erreur si une étape n\'a pas de SLA', () => {
    const step = makeStep({ id: 'step_nosla', title: 'Étape sans SLA', slaHours: 0 });
    const template = makeTemplate({ steps: [step] });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === `missing_sla_${step.id}`);
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('error');
    expect(issue?.category).toBe('Conformité');
  });

  it('signale un warning CAPEX si le type est Achat Stratégique sans bloc contrat', () => {
    const template = makeTemplate({
      type: 'Achat Stratégique',
      steps: [makeStep({ slaHours: 8, title: 'Analyse', type: 'Analyse' })]
    });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === 'missing_contract_capex');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('warning');
  });

  it('signale un warning SLA trop long pour un achat urgent', () => {
    const template = makeTemplate({
      type: 'Achat Urgent',
      steps: [
        makeStep({ slaHours: 60, order: 0 }),
        makeStep({ slaHours: 72, order: 1 }),
      ]
    });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === 'long_sla_urgent');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('warning');
    expect(issue?.category).toBe('Optimisation');
  });

  it('signale un info si une étape critique n\'a pas de validation', () => {
    const step = makeStep({ id: 'step_crit', title: 'Étape critique', isCritical: true, isValidationRequired: false, slaHours: 8 });
    const template = makeTemplate({ steps: [step] });
    const issues = lintWorkflow(template);
    const issue = issues.find((i: LintIssue) => i.id === `critical_no_val_${step.id}`);
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('info');
  });
});
