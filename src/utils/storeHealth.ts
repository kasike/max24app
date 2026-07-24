import { StoreSettings } from '../types';

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  weight: number;
  targetTab: 'generales' | 'costos' | 'arca' | 'compliance';
  icon: string;
}

export interface StoreHealthResult {
  score: number;
  completedTasksCount: number;
  totalTasksCount: number;
  pendingTasks: PendingTask[];
  completedTasks: { id: string; title: string; weight: number }[];
}

export function calculateStoreHealthScore(settings: StoreSettings): StoreHealthResult {
  let score = 25; // 25% base for initial registration (Name, Phone, Address, CUIT)
  const pendingTasks: PendingTask[] = [];
  const completedTasks: { id: string; title: string; weight: number }[] = [
    { id: 'BASE_REGISTRATION', title: 'Registro Básico del Comercio (Nombre, Dirección, Teléfono)', weight: 25 }
  ];

  // 1. Logo Subido (+15%)
  if (settings.logoUrl && settings.logoUrl.trim().length > 0) {
    score += 15;
    completedTasks.push({ id: 'ADD_LOGO', title: 'Logo e Identidad de Marca Subidos', weight: 15 });
  } else {
    pendingTasks.push({
      id: 'ADD_LOGO',
      title: 'Sube el logo de tu comercio',
      description: 'Personaliza la cabecera de tus tickets de venta y tu catálogo online.',
      weight: 15,
      targetTab: 'generales',
      icon: '🖼️'
    });
  }

  // 2. Gastos Fijos Cargados (+20%)
  if (settings.fixedCosts && settings.fixedCosts.length > 0) {
    score += 20;
    completedTasks.push({ id: 'ADD_FIXED_COSTS', title: 'Costos Fijos Registrados (Alquiler, Luz, Internet)', weight: 20 });
  } else {
    pendingTasks.push({
      id: 'ADD_FIXED_COSTS',
      title: 'Carga tus costos fijos mensuales',
      description: 'Registra alquiler, servicios o sueldos para ver tu ganancia neta real en Reportes.',
      weight: 20,
      targetTab: 'costos',
      icon: '💵'
    });
  }

  // 3. Fechas de Habilitaciones / Matafuegos / Control Regulatorio (+20%)
  if (settings.complianceDocuments && settings.complianceDocuments.length > 0) {
    score += 20;
    completedTasks.push({ id: 'ADD_COMPLIANCE', title: 'Habilitaciones y Control Regulatorio Registrados', weight: 20 });
  } else {
    pendingTasks.push({
      id: 'ADD_COMPLIANCE',
      title: 'Registra tus habilitaciones y matafuegos',
      description: 'Evita multas y clausuras con alertas preventivas de vencimiento municipal.',
      weight: 20,
      targetTab: 'compliance',
      icon: '🛡️'
    });
  }

  // 4. Facturación Electrónica ARCA/AFIP Configurada (+20%)
  if (settings.billingConfig?.enabled || (settings.billingConfig?.certPem && settings.billingConfig?.certPem.trim().length > 0)) {
    score += 20;
    completedTasks.push({ id: 'CONFIG_ARCA', title: 'Facturación Electrónica ARCA / AFIP Configurada', weight: 20 });
  } else {
    pendingTasks.push({
      id: 'CONFIG_ARCA',
      title: 'Configura la facturación electrónica ARCA / AFIP',
      description: 'Emite comprobantes fiscales B y C oficiales directamente desde el POS.',
      weight: 20,
      targetTab: 'arca',
      icon: '🏛️'
    });
  }

  return {
    score,
    completedTasksCount: completedTasks.length,
    totalTasksCount: completedTasks.length + pendingTasks.length,
    pendingTasks,
    completedTasks
  };
}
