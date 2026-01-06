import { User, UserRole, Project, Gem, Tool } from './types';

// --- CONFIGURACIÓN DE ENTORNO (.ENV & LOCAL STORAGE) ---
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if (typeof process !== 'undefined' && process.env && process.env[`REACT_APP_${key}`]) {
    return process.env[`REACT_APP_${key}`] as string;
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env[key]) return import.meta.env[key];
      // @ts-ignore
      if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    // Ignore errors
  }

  // 4. FALBACK: Local Storage (Configuración Manual desde Dashboard)
  // Updated prefix to 'ada_env_'
  if (typeof window !== 'undefined') {
      const manualKey = localStorage.getItem(`ada_env_${key}`);
      if (manualKey) return manualKey;
  }
  
  return '';
};

export const APP_CONFIG = {
  GEMINI_API_KEY: getEnvVar('API_KEY'), 
  GITHUB_TOKEN: getEnvVar('GITHUB_TOKEN'),
  GOOGLE_CLIENT_ID: getEnvVar('GOOGLE_CLIENT_ID')
};

// Real ADA Team
export const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Gonzalo Arias',
    role: UserRole.CEO,
    email: 'gonzalo.arias@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Gonzalo+Arias&background=0D8ABC&color=fff',
    skills: [
      { name: 'Leadership', level: 100 },
      { name: 'Strategic Planning', level: 95 },
      { name: 'Business Intelligence', level: 90 },
      { name: 'Cloud Architecture', level: 90 }
    ],
    projects: ['PROYECTO_001', 'PROYECTO_003', 'PROYECTO_004']
  },
  {
    id: 'u2',
    name: 'Armin Salazar',
    role: UserRole.ADMIN, // Super Admin Privilege
    email: 'soporte.aiwis@gmail.com', // Mantener email de soporte externo o cambiar a armin@ada.cl si se requiere
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Armin+Salazar&background=ff0000&color=fff',
    skills: [
      { name: 'Full Stack Management', level: 100 },
      { name: 'System Architecture', level: 100 },
      { name: 'React & AI', level: 98 },
      { name: 'Scrum Master', level: 95 }
    ],
    projects: ['PROYECTO_001', 'PROYECTO_002', 'PROYECTO_003', 'PROYECTO_004']
  },
  {
    id: 'u3',
    name: 'Gabriel Martinez',
    role: UserRole.DEVELOPER,
    email: 'gabriel.martinez@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Gabriel+Martinez&background=random',
    skills: [
      { name: 'Full Stack', level: 90 },
      { name: 'React', level: 85 },
      { name: 'Node.js', level: 85 }
    ],
    projects: ['PROYECTO_001']
  },
  {
    id: 'u4',
    name: 'Francisco Valenzuela',
    role: UserRole.DEVELOPER,
    email: 'francisco.valenzuela@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Francisco+Valenzuela&background=random',
    skills: [
      { name: 'Backend', level: 92 },
      { name: 'Python', level: 88 },
      { name: 'SQL', level: 90 }
    ],
    projects: ['PROYECTO_003']
  },
  {
    id: 'u5',
    name: 'Anibal Alcazar',
    role: UserRole.DEVELOPER,
    email: 'anibal.alcazar@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Anibal+Alcazar&background=random',
    skills: [
      { name: 'Frontend', level: 90 },
      { name: 'UI/UX Implementation', level: 85 },
      { name: 'JavaScript', level: 92 }
    ],
    projects: ['PROYECTO_002']
  },
  {
    id: 'u6',
    name: 'Juan Escalona',
    role: UserRole.DEVELOPER,
    email: 'juan.escalona@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Juan+Escalona&background=random',
    skills: [
      { name: 'DevOps', level: 85 },
      { name: 'Cloud Infrastructure', level: 88 },
      { name: 'Security', level: 80 }
    ],
    projects: ['PROYECTO_004']
  },
  {
    id: 'u7',
    name: 'Cristobal Arias',
    role: UserRole.DEVELOPER,
    email: 'cristobal.ariasb@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Cristobal+Arias&background=random',
    skills: [
      { name: 'Mobile Dev', level: 85 },
      { name: 'Flutter', level: 80 },
      { name: 'API Integration', level: 85 }
    ],
    projects: ['PROYECTO_002']
  },
  {
    id: 'u8',
    name: 'Alejandro Venegas',
    role: UserRole.ANALYST,
    email: 'alejandro.venegas@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Alejandro+Venegas&background=random',
    skills: [
      { name: 'QA Automation', level: 90 },
      { name: 'Data Analysis', level: 85 },
      { name: 'Testing', level: 92 }
    ],
    projects: ['PROYECTO_001', 'PROYECTO_003']
  },
  {
    id: 'u9',
    name: 'Fernando Cid',
    role: UserRole.DESIGNER,
    email: 'fernando.cid@ada.cl',
    password: '1234',
    avatar: 'https://ui-avatars.com/api/?name=Fernando+Cid&background=random',
    skills: [
      { name: 'Product Design', level: 95 },
      { name: 'Figma', level: 98 },
      { name: 'Prototyping', level: 90 }
    ],
    projects: ['PROYECTO_002']
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'PROYECTO_001',
    name: 'Sistema de Facturación Interna',
    client: 'Interno ADA',
    encargadoCliente: 'Gerencia Admin',
    leadId: 'u2',
    teamIds: ['u3', 'u8', 'u1', 'u2'],
    status: 'En Curso',
    isOngoing: true,
    report: true,
    startDate: '2025-01-15',
    deadline: '2025-06-30',
    progress: 45,
    year: 2025,
    description: 'Desarrollar un sistema interno para la facturación y cobranza de servicios. Debe integrarse con el sistema de contabilidad.',
    technologies: ['AWS', 'Python', 'Spark', 'Terraform'],
    logs: [
      { id: 'l1', date: '2025-02-10T10:00:00', text: 'Inicio de la fase de diseño de arquitectura.', author: 'Armin Salazar' },
      { id: 'l2', date: '2025-02-12T14:30:00', text: 'Reunión con contabilidad para definir esquema de base de datos.', author: 'Gabriel Martinez' }
    ],
    repositories: [
        { id: 'r1', type: 'github', alias: 'Repositorio Fuente', url: 'https://github.com/soporteaiwis-lab/SIMPLEDATA-APP' }, // Keep URL legacy or update if repo changes
        { id: 'r2', type: 'drive', alias: 'Documentación Oficial', url: 'https://drive.google.com/drive/folders/1S3Zavf6xdp9WaM8-gowBJImdkmSD_Niw' }
    ]
  },
  {
    id: 'PROYECTO_002',
    name: 'Desarrollo de App Móvil Clientes',
    client: 'Cliente Retail XYZ',
    encargadoCliente: 'Gerente de Innovación',
    leadId: 'u2',
    teamIds: ['u5', 'u7', 'u9', 'u2'],
    status: 'En Curso',
    isOngoing: true,
    report: true,
    startDate: '2025-03-01',
    deadline: '2025-09-01',
    progress: 10,
    year: 2025,
    description: 'App móvil para iOS y Android que permita a los clientes finales visualizar su estado de cuenta, revisar catálogos y realizar compras.',
    technologies: ['React Native', 'Node.js', 'Firebase'],
    logs: [],
    repositories: [
         { id: 'r1', type: 'github', alias: 'App React Native', url: 'https://github.com/soporteaiwis-lab/SIMPLEDATA-APP' }
    ]
  },
  {
    id: 'PROYECTO_003',
    name: 'Migración de Servidores Cloud',
    client: 'Empresa Logística ABC',
    encargadoCliente: 'Jefe de IT',
    leadId: 'u4',
    teamIds: ['u8', 'u1', 'u2'],
    status: 'En Curso',
    isOngoing: true,
    report: true,
    startDate: '2024-10-01',
    deadline: '2024-12-20',
    progress: 80,
    year: 2024,
    description: 'Migrar la infraestructura on-premise del cliente a un entorno cloud en AWS, optimizando costos y mejorando la escalabilidad.',
    technologies: ['AWS', 'Docker', 'Linux'],
    logs: [
       { id: 'l1', date: '2024-12-01T18:00:00', text: 'Instancias EC2 configuradas.', author: 'Francisco Valenzuela' }
    ],
    repositories: []
  },
  {
    id: 'PROYECTO_004',
    name: 'Infraestructura DevSecOps',
    client: 'Banco Financiero',
    encargadoCliente: 'CISO',
    leadId: 'u6',
    teamIds: ['u1', 'u2'],
    status: 'En Curso',
    isOngoing: true,
    report: true,
    startDate: '2025-01-05',
    deadline: '2025-08-20',
    progress: 25,
    year: 2025,
    description: 'Implementación de pipelines de seguridad y auditoría automatizada.',
    technologies: ['Jenkins', 'SonarQube', 'Kubernetes'],
    logs: [
       { id: 'l1', date: '2025-01-20T10:00:00', text: 'Pipelines base creados.', author: 'Juan Escalona' }
    ],
    repositories: []
  }
];

export const INITIAL_GEMS: Gem[] = [
    { id: 'g1', url: 'https://gemini.google.com/gem/6257c452aac9', name: 'COTIZACIONES', description: 'Asistente experto en la generación y análisis de cotizaciones.', icon: 'fa-calculator' },
    { id: 'g2', url: 'https://gemini.google.com/gem/fa10051c004b', name: 'PIPELINES AZURE', description: 'Especialista en crear pipelines de Azure y archivos JSON.', icon: 'fa-cloud' },
    { id: 'g3', url: 'https://gemini.google.com/gem/4ca9a51fdffc', name: 'MAPEO DATA BRICKS', description: 'Analista de código para mapear y entender notebooks de Data Bricks.', icon: 'fa-project-diagram' },
    { id: 'g4', url: 'https://gemini.google.com/gem/1dbe6e06847f', name: 'FACTORIA COBOL', description: 'Herramienta para la modernización y análisis de código COBOL.', icon: 'fa-code' },
    { id: 'g5', url: 'https://gemini.google.com/gem/910761c1caf2', name: 'ANALIZADOR REQUERMIENTOS', description: 'IA para analizar y desglosar requerimientos de software complejos.', icon: 'fa-brain' },
    { id: 'g6', url: 'https://gemini.google.com/gem/5745999ccff7', name: 'QUIZ CAPACITACIONES', description: 'Generador de cuestionarios y quizzes para material de capacitación.', icon: 'fa-graduation-cap' }
];

export const INITIAL_TOOLS: Tool[] = [
  { id: 't1', name: 'VS Code Web', url: 'https://vscode.dev', icon: 'fa-code', color: 'text-blue-500' },
  { id: 't2', name: 'Azure Portal', url: 'https://portal.azure.com', icon: 'fa-cloud', color: 'text-blue-400' },
  { id: 't3', name: 'AWS Console', url: 'https://aws.amazon.com/console/', icon: 'fa-server', color: 'text-orange-500' },
  { id: 't4', name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'fa-bolt', color: 'text-emerald-500' },
  { id: 't5', name: 'Gemini', url: 'https://gemini.google.com', icon: 'fa-gem', color: 'text-purple-500' },
  { id: 't6', name: 'Firebase Console', url: 'https://console.firebase.google.com', icon: 'fa-fire', color: 'text-yellow-500' },
  { id: 't7', name: 'MongoDB Atlas', url: 'https://cloud.mongodb.com', icon: 'fa-leaf', color: 'text-green-500' },
  { id: 't8', name: 'GitHub', url: 'https://github.com', icon: 'fa-github', color: 'text-slate-800' },
];