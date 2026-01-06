
export enum UserRole {
  ADMIN = 'Super Admin',
  CEO = 'CEO',
  PROJECT_MANAGER = 'Project Manager',
  DEVELOPER = 'Developer',
  DESIGNER = 'Designer',
  ANALYST = 'Analyst'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  password?: string;
  avatar: string;
  skills: { name: string; level: number }[];
  projects: string[];
}

export interface ProjectLog {
  id: string;
  date: string;
  text: string;
  author: string;
  link?: string; // Added link support for logs
}

export interface Repository {
  id: string;
  alias: string; // Friendly name (e.g. "Backend Repo", "Carpeta Facturas")
  url: string; // The exact URL
  type: 'github' | 'drive' | 'other';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  encargadoCliente?: string;
  leadId: string;
  teamIds: string[];
  status: 'En Curso' | 'Finalizado' | 'Planning';
  isOngoing: boolean;
  report: boolean;
  deadline: string;
  startDate?: string;
  progress: number;
  description: string;
  technologies: string[];
  year: number;
  logs: ProjectLog[];
  repositories: Repository[]; // NEW: Flexible repo management
}

export interface Gem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
}

export interface Tool {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  isLocal?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum AppRoute {
  DASHBOARD = 'dashboard',
  PROJECTS = 'projects',
  GEMS = 'gems',
  TEAM = 'team',
  REPORTS = 'reports',
  TOOLS = 'tools',
  ADMIN = 'admin_panel'
}