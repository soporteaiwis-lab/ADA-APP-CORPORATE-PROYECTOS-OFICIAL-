import React, { useState, useRef, useEffect } from 'react';
import { Project, Repository, ProjectLog } from '../types';
import { APP_CONFIG } from '../constants'; 

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

declare var google: any; // Declare google global for GIS

// Predefined Folder Structure
const FOLDER_STRUCTURE = [
  "01_Documentacion",
  "02_Proceso",
  "03_Cuadratura",
  "04_QA",
  "05_Entrega_Interna",
  "06_Entrega",
  "07_PostEntrega",
  "10_Revision_Archivos"
];

interface RepositoryManagerProps {
  project: Project;
  initialType: 'github' | 'drive';
  onClose: () => void;
  onUpdateProject: (p: Project) => void;
  currentUser: { name: string };
}

export const RepositoryManager = ({ project, initialType, onClose, onUpdateProject, currentUser }: RepositoryManagerProps) => {
  const [activeTab, setActiveTab] = useState<'github' | 'drive'>(initialType);
  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
  
  // --- GITHUB TOKEN LOGIC (RESTORED TO CLASSIC) ---
  // We read directly from the key used in Dashboard to avoid sync issues
  const getStoredGithubToken = () => {
      // Prioritize the Dashboard Key - UPDATED TO ADA KEY
      return localStorage.getItem('ada_env_GITHUB_TOKEN') || APP_CONFIG.GITHUB_TOKEN || '';
  };

  const [githubToken, setGithubToken] = useState(getStoredGithubToken());
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showConfigHint, setShowConfigHint] = useState(false); // New hint for general config

  // Drive Token State
  const [driveToken, setDriveToken] = useState<string>('');

  // Add New Repo State (Manual)
  const [newRepo, setNewRepo] = useState({ alias: '', url: '' });

  // Drive Structure Generator State
  const [correlative, setCorrelative] = useState(project.id.replace(/\D/g, '') || '001');
  const [creationStatus, setCreationStatus] = useState<'idle' | 'auth' | 'creating' | 'success' | 'error'>('idle');
  const [creationLog, setCreationLog] = useState('');

  // --- STRUCT CREATION PICKER STATE ---
  const [targetParent, setTargetParent] = useState<{id: string, name: string}>({ id: 'root', name: 'Mi Unidad (Raíz)' });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerItems, setPickerItems] = useState<any[]>([]);
  const [pickerCurrentFolder, setPickerCurrentFolder] = useState<{id: string, name: string}>({ id: 'root', name: 'Mi Unidad' });
  const [pickerBreadcrumb, setPickerBreadcrumb] = useState<{id: string, name: string}[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  // --- UPLOAD BROWSER STATE (DRIVE ONLY) ---
  const [isUploadBrowserOpen, setIsUploadBrowserOpen] = useState(false);
  const [uploadBrowserItems, setUploadBrowserItems] = useState<any[]>([]);
  const [uploadCurrentFolder, setUploadCurrentFolder] = useState<{id: string, name: string}>({ id: '', name: '' });
  const [uploadBreadcrumb, setUploadBreadcrumb] = useState<{id: string, name: string}[]>([]);
  const [uploadBrowserLoading, setUploadBrowserLoading] = useState(false);

  // Upload State
  const [uploadState, setUploadState] = useState<'idle' | 'selecting' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const repositories = project.repositories?.filter(r => r.type === activeTab) || [];

  // --- HELPERS ---

  const getFolderIdFromUrl = (url: string): string | null => {
      const match = url.match(/(?:folders\/|id=)([\w-]+)/);
      return match ? match[1] : null;
  };

  const authenticateDrive = (): Promise<string> => {
      return new Promise((resolve, reject) => {
          if (driveToken) {
              resolve(driveToken);
              return;
          }
          if (!APP_CONFIG.GOOGLE_CLIENT_ID) {
            reject("Falta GOOGLE_CLIENT_ID en configuración. Usa el botón de engranaje.");
            setShowConfigHint(true);
            return;
          }
          try {
             // Wrap in try-catch for immediate errors
             const client = google.accounts.oauth2.initTokenClient({
                  client_id: APP_CONFIG.GOOGLE_CLIENT_ID,
                  scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
                  callback: (tokenResponse: any) => {
                      if (tokenResponse && tokenResponse.access_token) {
                          setDriveToken(tokenResponse.access_token);
                          resolve(tokenResponse.access_token);
                      } else {
                          reject("Google no devolvió un token de acceso.");
                      }
                  },
                  error_callback: (err: any) => {
                      reject("Error en popup de Google (Puede ser 400 redirect_uri). Revisa la Configuración.");
                      setShowConfigHint(true);
                  }
              });
              
              // This triggers the popup. If origin is bad, it will fail in the popup, 
              // but sometimes doesn't throw JS error here.
              client.requestAccessToken();
              
          } catch (e) {
              reject(e);
              setShowConfigHint(true);
          }
      });
  };

  const fetchDriveFolders = async (parentId: string, token: string) => {
      const query = `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=100&orderBy=name`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Error listando carpetas");
      const data = await response.json();
      return data.files || [];
  };

  // --- ACTIONS ---

  const handleAddRepo = () => {
      if (!newRepo.alias || !newRepo.url) return;
      const updatedRepositories = [
          ...(project.repositories || []),
          { 
              id: `r_${Date.now()}`, 
              type: activeTab, 
              alias: newRepo.alias, 
              url: newRepo.url 
          } as Repository
      ];
      onUpdateProject({ ...project, repositories: updatedRepositories });
      setNewRepo({ alias: '', url: '' });
      setViewMode('list');
  };

  const handleDeleteRepo = (repoId: string) => {
      if (!confirm("¿Eliminar este enlace del proyecto?")) return;
      const updatedRepositories = project.repositories.filter(r => r.id !== repoId);
      onUpdateProject({ ...project, repositories: updatedRepositories });
  };

  // --- STRUCTURE PICKER LOGIC ---
  const openPicker = async () => {
      setIsPickerOpen(true);
      setPickerLoading(true);
      try {
          const token = await authenticateDrive();
          const rootFolders = await fetchDriveFolders('root', token);
          setPickerItems(rootFolders);
          setPickerCurrentFolder({ id: 'root', name: 'Mi Unidad' });
          setPickerBreadcrumb([{ id: 'root', name: 'Mi Unidad' }]);
      } catch (e) {
          console.error(e);
          alert("Error de autenticación: " + e);
          setIsPickerOpen(false);
          setShowConfigHint(true);
      } finally {
          setPickerLoading(false);
      }
  };

  const handlePickerEnter = async (folder: {id: string, name: string}) => {
      setPickerLoading(true);
      try {
          const token = await authenticateDrive();
          const items = await fetchDriveFolders(folder.id, token);
          setPickerItems(items);
          setPickerCurrentFolder(folder);
          setPickerBreadcrumb([...pickerBreadcrumb, folder]);
      } catch (e) { console.error(e); } finally { setPickerLoading(false); }
  };

  const handlePickerUp = async (index: number) => {
      const target = pickerBreadcrumb[index];
      const newBreadcrumb = pickerBreadcrumb.slice(0, index + 1);
      setPickerLoading(true);
      try {
          const token = await authenticateDrive();
          const items = await fetchDriveFolders(target.id, token);
          setPickerItems(items);
          setPickerCurrentFolder(target);
          setPickerBreadcrumb(newBreadcrumb);
      } catch (e) { console.error(e); } finally { setPickerLoading(false); }
  };

  const confirmSelection = () => {
      setTargetParent(pickerCurrentFolder);
      setIsPickerOpen(false);
  };

  // --- UPLOAD BROWSER LOGIC (DRIVE) ---
  const openUploadBrowser = async (repo: Repository) => {
      const rootId = getFolderIdFromUrl(repo.url);
      if (!rootId) {
          alert("URL inválida, no se detectó ID de carpeta.");
          return;
      }
      setSelectedRepoId(repo.id);
      setIsUploadBrowserOpen(true);
      setUploadBrowserLoading(true);
      try {
          const token = await authenticateDrive();
          const items = await fetchDriveFolders(rootId, token);
          setUploadBrowserItems(items);
          setUploadCurrentFolder({ id: rootId, name: repo.alias });
          setUploadBreadcrumb([{ id: rootId, name: repo.alias }]);
      } catch (e: any) {
          // If auth fails, show alert and set config hint
          alert("Error de Acceso: " + e);
          setIsUploadBrowserOpen(false);
          setShowConfigHint(true);
      } finally {
          setUploadBrowserLoading(false);
      }
  };

  const handleUploadNavigate = async (folder: {id: string, name: string}) => {
      setUploadBrowserLoading(true);
      try {
          const token = await authenticateDrive();
          const items = await fetchDriveFolders(folder.id, token);
          setUploadBrowserItems(items);
          setUploadCurrentFolder(folder);
          setUploadBreadcrumb([...uploadBreadcrumb, folder]);
      } catch (e) { console.error(e); } finally { setUploadBrowserLoading(false); }
  };

  const handleUploadNavigateUp = async (index: number) => {
      const target = uploadBreadcrumb[index];
      const newBreadcrumb = uploadBreadcrumb.slice(0, index + 1);
      setUploadBrowserLoading(true);
      try {
          const token = await authenticateDrive();
          const items = await fetchDriveFolders(target.id, token);
          setUploadBrowserItems(items);
          setUploadCurrentFolder(target);
          setUploadBreadcrumb(newBreadcrumb);
      } catch (e) { console.error(e); } finally { setUploadBrowserLoading(false); }
  };

  const triggerFileUploadHere = () => {
      if (fileInputRef.current) fileInputRef.current.click();
  };

  // --- STRUCTURE CREATION ---
  const createDriveFolder = async (name: string, parentId: string | null, token: string) => {
      const metadata: any = { name: name, mimeType: 'application/vnd.google-apps.folder' };
      if (parentId && parentId !== 'root') metadata.parents = [parentId];
      const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(metadata)
      });
      if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || "Error creando carpeta");
      }
      return await response.json();
  };

  const handleCreateStructure = async () => {
      setCreationStatus('auth');
      setCreationLog('Autenticando...');
      try {
          const token = await authenticateDrive();
          setCreationStatus('creating');
          const safeName = project.name.replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "");
          const safeManager = (project.encargadoCliente || 'SinAsignar').replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "");
          const rootFolderName = `${correlative}_${safeName}_${safeManager}`;
          setCreationLog(`Creando raíz: ${rootFolderName}...`);
          const rootFolder = await createDriveFolder(rootFolderName, targetParent.id, token);
          let createdCount = 0;
          for (const subName of FOLDER_STRUCTURE) {
              setCreationLog(`Creando subcarpeta: ${subName}...`);
              await createDriveFolder(subName, rootFolder.id, token);
              createdCount++;
          }
          setCreationLog('¡Estructura creada exitosamente!');
          setCreationStatus('success');
          const newRepoLink: Repository = {
              id: `r_${Date.now()}`,
              type: 'drive',
              alias: `🗂️ ${rootFolderName}`,
              url: rootFolder.webViewLink
          };
          const updatedRepositories = [...(project.repositories || []), newRepoLink];
          const newLog: ProjectLog = {
            id: `log_${Date.now()}`,
            date: new Date().toISOString(),
            author: currentUser.name,
            text: `✅ ESTRUCTURA DRIVE CREADA: ${rootFolderName} en ${targetParent.name}`,
            link: rootFolder.webViewLink
          };
          onUpdateProject({ ...project, repositories: updatedRepositories, logs: [...(project.logs || []), newLog] });
          setTimeout(() => {
              setViewMode('list');
              setCreationStatus('idle');
          }, 2000);
      } catch (e: any) {
          console.error(e);
          setCreationStatus('error');
          setCreationLog('Error: ' + e.message);
          setShowConfigHint(true);
      }
  };

  // --- MAIN UPLOAD HANDLER ---
  const handleTriggerUpload = async (repoId: string) => {
      const repo = project.repositories?.find(r => r.id === repoId);
      if (!repo) return;

      // GITHUB FLOW (Classic)
      if (activeTab === 'github') {
          setSelectedRepoId(repoId);
          // READ TOKEN DIRECTLY FROM STORAGE TO AVOID STALE STATE
          const storedToken = localStorage.getItem('ada_env_GITHUB_TOKEN') || APP_CONFIG.GITHUB_TOKEN;
          
          if (!storedToken || storedToken.length < 5) {
              setShowTokenInput(true); // Only show if genuinely missing
              return;
          }
          // Proceed to file select
          if (fileInputRef.current) fileInputRef.current.click();
          return;
      }

      // DRIVE FLOW
      if (activeTab === 'drive') {
           openUploadBrowser(repo);
      }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setSelectedFile(file);
          const repo = project.repositories?.find(r => r.id === selectedRepoId);
          if (!repo) return;

          setUploadState('uploading');

          if (activeTab === 'github') {
             await uploadToGitHubReal(file, repo);
          } else {
             const targetId = isUploadBrowserOpen ? uploadCurrentFolder.id : getFolderIdFromUrl(repo.url);
             if (targetId) {
                await uploadToDriveReal(file, repo, driveToken, targetId);
             } else {
                 setUploadState('error');
                 setUploadStatusMsg("ID de carpeta destino perdido.");
             }
          }
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- DRIVE UPLOAD ---
  const uploadToDriveReal = async (file: File, repo: Repository, accessToken: string, folderId: string) => {
      setUploadStatusMsg('Iniciando carga Drive...');
      setProgress(5);
      if (!accessToken) {
          setUploadState('error');
          setUploadStatusMsg('Sesión expirada.');
          return;
      }
      try {
          setUploadStatusMsg(`Subiendo a carpeta: ...${folderId.slice(-5)}`);
          setProgress(30);
          const metadata = { name: file.name, parents: [folderId] };
          const form = new FormData();
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
          form.append('file', file);
          const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${accessToken}` },
              body: form
          });
          setProgress(80);
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.error?.message || "Error al subir a Drive");
          }
          const data = await response.json();
          setProgress(100);
          setIsUploadBrowserOpen(false);
          completeUpload(file, repo, data.webViewLink, isUploadBrowserOpen ? uploadCurrentFolder.name : undefined);
      } catch (e: any) {
          console.error(e);
          setUploadState('error');
          setUploadStatusMsg('Fallo en la subida: ' + e.message);
      }
  };

  // --- GITHUB UPLOAD (FIXED & ROBUST) ---
  const uploadToGitHubReal = async (file: File, repo: Repository) => {
      try {
          // 1. Get Token Forcefully
          const effectiveToken = localStorage.getItem('ada_env_GITHUB_TOKEN') || APP_CONFIG.GITHUB_TOKEN;
          if (!effectiveToken) throw new Error("Token de GitHub no encontrado en configuración.");

          setUploadStatusMsg('Verificando repositorio...');
          setProgress(10);
          
          // 2. Parse URL carefully
          // Example: https://github.com/owner/repo
          const cleanUrl = repo.url.replace(/\/$/, "").replace(/\.git$/, "");
          const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
          
          if (!match) throw new Error("URL inválida. Debe ser https://github.com/usuario/repositorio");
          const owner = match[1];
          const repoName = match[2];
          
          setUploadStatusMsg('Codificando archivo...');
          const base64Content = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                  const result = reader.result as string;
                  // Remove "data:application/pdf;base64," prefix
                  const base64 = result.split(',')[1];
                  resolve(base64);
              };
              reader.onerror = error => reject(error);
          });
          
          setProgress(30);
          setUploadStatusMsg(`Subiendo a ${owner}/${repoName}...`);
          
          // 3. GitHub API Endpoint
          const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${file.name}`; 
          
          // 4. PUT Request
          const response = await fetch(apiUrl, {
              method: 'PUT',
              headers: {
                  'Authorization': `Bearer ${effectiveToken}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/vnd.github.v3+json'
              },
              body: JSON.stringify({
                  message: `Upload ${file.name} via ADA Portal (${new Date().toISOString()})`,
                  content: base64Content
              })
          });
          
          setProgress(80);
          
          if (!response.ok) {
              const errorData = await response.json();
              
              // Handle 401: Invalid Token
              if (response.status === 401) {
                  // DO NOT DELETE TOKEN. Just warn.
                  throw new Error("Token rechazado por GitHub. Verifica tus permisos en el Engranaje.");
              }
              // Handle 422: File exists or validation error
              if (response.status === 422) {
                  throw new Error("El archivo ya existe o hay conflicto de SHA. Intenta renombrarlo.");
              }
              if (response.status === 404) {
                   throw new Error("Repositorio no encontrado. Verifica que el Token tenga permisos de 'Repo' y la URL sea correcta.");
              }

              throw new Error(errorData.message || `Error ${response.status} de GitHub.`);
          }
          
          const data = await response.json();
          setProgress(100);
          
          // Use html_url for the link, or fallback to repo url
          completeUpload(file, repo, data.content?.html_url || repo.url);

      } catch (error: any) {
          console.error("GitHub Upload Error:", error);
          setUploadState('error');
          setUploadStatusMsg(error.message);
      }
  };

  const completeUpload = (file: File, repo: Repository, finalUrl?: string, folderName?: string) => {
      const extraInfo = folderName ? ` en carpeta "${folderName}"` : '';
      const newLog: ProjectLog = {
          id: `log_${Date.now()}`,
          date: new Date().toISOString(),
          author: currentUser.name,
          text: `✅ ARCHIVO CARGADO: "${file.name}" a ${repo.alias}${extraInfo}`,
          link: finalUrl || repo.url
      };
      onUpdateProject({ ...project, logs: [...(project.logs || []), newLog] });
      setUploadState('success');
      setUploadStatusMsg('¡Sincronización Completada!');
      setTimeout(() => {
          setUploadState('idle');
          setSelectedFile(null);
          setProgress(0);
          setUploadStatusMsg('');
      }, 2500);
  };

  const themeColor = activeTab === 'github' ? 'slate' : 'green';
  const themeIcon = activeTab === 'github' ? 'fab fa-github' : 'fab fa-google-drive';

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-auto md:max-h-[85vh]">
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

            {/* Header */}
            <div className={`p-6 bg-${themeColor}-900 text-white flex justify-between items-center transition-colors duration-300 shrink-0`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl`}>
                        <Icon name={themeIcon} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Gestor de Repositorios</h2>
                        <p className="text-white/60 text-sm truncate max-w-[200px]">{project.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Direct Config Button */}
                    <button 
                        onClick={() => { alert("Por favor, ve al Dashboard > Engranaje para configurar el Client ID y el Origen Autorizado."); }} 
                        className="bg-white/10 hover:bg-white/20 text-xs px-3 py-1.5 rounded flex items-center gap-2"
                        title="Configuración de Accesos"
                    >
                        <Icon name="fa-cog" /> Accesos
                    </button>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><Icon name="fa-times" /></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0">
                <button 
                    onClick={() => { setActiveTab('github'); setViewMode('list'); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'github' ? 'bg-slate-50 text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Icon name="fab fa-github" className="mr-2" /> GITHUB
                </button>
                <button 
                    onClick={() => { setActiveTab('drive'); setViewMode('list'); }} 
                    className={`flex-1 py-4 font-bold text-sm transition-colors ${activeTab === 'drive' ? 'bg-green-50 text-green-800 border-b-2 border-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Icon name="fab fa-google-drive" className="mr-2" /> DRIVE
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative">
                
                {/* --- CONFIG HINT FOR DRIVE ERROR --- */}
                {showConfigHint && (
                     <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-4 animate-slide-up relative">
                         <button onClick={()=>setShowConfigHint(false)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><Icon name="fa-times"/></button>
                         <h4 className="font-bold text-red-700 text-sm mb-1"><Icon name="fa-exclamation-circle"/> Problemas de Conexión</h4>
                         <p className="text-xs text-red-600 leading-relaxed mb-2">
                             Google bloqueó el acceso (Error 400). Esto pasa cuando la URL de la web cambia.
                         </p>
                         <button 
                            onClick={() => { onClose(); alert("Ve al Dashboard > Engranaje > Cuadro Rojo para copiar la URL exacta."); }}
                            className="bg-red-600 text-white text-xs px-3 py-2 rounded font-bold shadow-sm hover:bg-red-700"
                         >
                            Ir a Solucionarlo
                         </button>
                     </div>
                )}

                {/* --- STRUCTURE PICKER OVERLAY --- */}
                {isPickerOpen && (
                    <div className="absolute inset-0 bg-white z-50 flex flex-col p-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-4 border-b pb-2 shrink-0">
                             <div>
                                 <h3 className="font-bold text-slate-800">Ubicación del Proyecto</h3>
                                 <p className="text-xs text-slate-500">¿Dónde crear la carpeta raíz?</p>
                             </div>
                             <button onClick={() => setIsPickerOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon name="fa-times" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200 p-2 space-y-1">
                             {pickerLoading ? (
                                 <div className="flex items-center justify-center h-full text-slate-400 gap-2"><Icon name="fa-circle-notch" className="animate-spin" /> Cargando...</div>
                             ) : (
                                 pickerItems.map(item => (
                                     <div key={item.id} className="flex items-center justify-between p-3 hover:bg-white cursor-pointer border-b hover:border-slate-100" onClick={() => handlePickerEnter(item)}>
                                          <div className="flex items-center gap-3">
                                              <Icon name="fa-folder" className="text-yellow-400 text-lg" />
                                              <span className="text-sm text-slate-700 font-medium truncate max-w-[180px]">{item.name}</span>
                                          </div>
                                          <Icon name="fa-chevron-right" className="text-slate-300 text-xs" />
                                     </div>
                                 ))
                             )}
                        </div>
                        <div className="mt-4 shrink-0 flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div className="text-xs text-blue-800 truncate mr-2">Selección: <strong>{pickerCurrentFolder.name}</strong></div>
                            <button onClick={confirmSelection} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Seleccionar</button>
                        </div>
                    </div>
                )}

                {/* --- UPLOAD BROWSER OVERLAY --- */}
                {isUploadBrowserOpen && (
                    <div className="absolute inset-0 bg-white z-50 flex flex-col p-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4 shrink-0">
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl"><Icon name="fab fa-google-drive" /></div>
                                 <div>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">Explorador Drive</h3>
                                    <p className="text-xs text-slate-500">Navega y sube tu archivo.</p>
                                 </div>
                             </div>
                             <button onClick={() => setIsUploadBrowserOpen(false)} className="text-slate-400 hover:text-slate-600"><Icon name="fa-times" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2">
                             {uploadBrowserLoading ? (
                                 <div className="flex items-center justify-center h-full text-slate-400 gap-2"><Icon name="fa-circle-notch" className="animate-spin" /> Cargando...</div>
                             ) : uploadBrowserItems.map(item => (
                                 <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:shadow-sm" onClick={() => handleUploadNavigate(item)}>
                                      <div className="flex items-center gap-4">
                                          <Icon name="fa-folder" className="text-yellow-500 text-xl" />
                                          <span className="text-sm font-bold text-slate-700 truncate">{item.name}</span>
                                      </div>
                                      <Icon name="fa-chevron-right" className="text-slate-300 text-xs" />
                                 </div>
                             ))}
                        </div>
                        <div className="mt-4">
                             <button onClick={triggerFileUploadHere} className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-green-700 flex items-center justify-center gap-2">
                                <Icon name="fa-cloud-upload-alt" /> SUBIR ARCHIVO AQUÍ
                             </button>
                        </div>
                    </div>
                )}

                {/* TOKEN INPUT MODAL (Only shows if localStorage is empty) */}
                {showTokenInput && (
                    <div className="absolute inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-6 animate-fade-in">
                        <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
                            <div className="text-center mb-4">
                                <Icon name="fab fa-github" className="text-4xl text-slate-800 mb-2" />
                                <h3 className="font-bold text-lg text-slate-800">Falta Token de GitHub</h3>
                                <p className="text-sm text-slate-500">No se detectó el token en la configuración global.</p>
                            </div>
                            <input 
                                type="password" 
                                className="w-full border p-3 rounded-lg font-mono text-sm mb-4"
                                placeholder="ghp_..."
                                value={githubToken}
                                onChange={e => {
                                    setGithubToken(e.target.value);
                                    // Save to Dashboard key to fix sync permanently
                                    localStorage.setItem('ada_env_GITHUB_TOKEN', e.target.value);
                                }}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setShowTokenInput(false)} className="flex-1 py-3 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">Cancelar</button>
                                <button onClick={() => setShowTokenInput(false)} className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold">Guardar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* UPLOAD PROGRESS */}
                {uploadState === 'uploading' && (
                    <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 mb-4 relative">
                            <Icon name="fa-circle-notch" className={`text-5xl text-${themeColor}-200 animate-spin absolute inset-0`} />
                            <Icon name="fa-cloud-upload-alt" className={`text-xl text-${themeColor}-600 absolute inset-0 m-auto`} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Sincronizando...</h3>
                        <p className="text-slate-500 mb-6 font-medium text-sm">{uploadStatusMsg}</p>
                        <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden mx-auto">
                            <div className={`h-full bg-${themeColor}-600 transition-all duration-200`} style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* ERROR OVERLAY */}
                {(uploadState === 'error' || creationStatus === 'error') && (
                    <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600 text-3xl mx-auto">
                            <Icon name="fa-exclamation-triangle" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Error de Sincronización</h3>
                        <p className="text-red-500 text-sm font-medium mb-6 bg-red-50 p-3 rounded border border-red-100">{uploadStatusMsg || creationLog}</p>
                        <button onClick={() => { setUploadState('idle'); setCreationStatus('idle'); }} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold">Volver</button>
                    </div>
                )}

                {/* SUCCESS OVERLAY */}
                {uploadState === 'success' && (
                    <div className="absolute inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 animate-scale-up">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600 text-4xl">
                            <Icon name="fa-check" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">¡Sincronización Exitosa!</h3>
                        <p className="text-slate-500 text-sm text-center">{uploadStatusMsg}</p>
                    </div>
                )}

                {/* VIEW MODE: LIST */}
                {viewMode === 'list' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                {activeTab === 'drive' ? 'Carpetas' : 'Repositorios'} ({repositories.length})
                            </h3>
                            <button onClick={() => setViewMode('add')} className={`text-xs font-bold text-${themeColor}-600 hover:underline flex items-center gap-1`}>
                                <Icon name="fa-plus" /> Agregar Nuevo
                            </button>
                        </div>

                        {repositories.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                                <p className="text-slate-400 font-medium text-sm">No hay rutas configuradas.</p>
                                <button onClick={() => setViewMode('add')} className={`mt-4 px-4 py-2 bg-${themeColor}-600 text-white rounded-lg text-xs font-bold`}>
                                    Vincular {activeTab === 'drive' ? 'Carpeta' : 'Repositorio'}
                                </button>
                            </div>
                        ) : (
                            repositories.map(repo => (
                                <div key={repo.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 text-xl`}>
                                                <Icon name={activeTab === 'drive' ? 'fa-folder' : 'fa-code-branch'} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{repo.alias}</h4>
                                                <a href={repo.url} target="_blank" className="text-xs text-slate-400 hover:text-blue-500 truncate max-w-[150px] block underline">
                                                    {repo.url}
                                                </a>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteRepo(repo.id)} className="text-slate-300 hover:text-red-500 px-2"><Icon name="fa-trash" /></button>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => window.open(repo.url, '_blank')} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 flex items-center justify-center gap-2">
                                            <Icon name="fa-external-link-alt" /> Abrir
                                        </button>
                                        <button 
                                            onClick={() => handleTriggerUpload(repo.id)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${activeTab === 'drive' && !driveToken ? 'bg-white text-slate-700 border border-slate-300' : `bg-${themeColor}-600 text-white hover:bg-${themeColor}-700`}`}
                                        >
                                            {activeTab === 'drive' && !driveToken ? <><Icon name="fab fa-google" /> Conectar</> : <><Icon name="fa-cloud-upload-alt" /> Subir</>}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* VIEW MODE: ADD */}
                {viewMode === 'add' && !isPickerOpen && !isUploadBrowserOpen && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Nuevo Enlace</h3>
                            <button onClick={() => setViewMode('list')} className="text-slate-400 hover:text-slate-600 text-sm">Cancelar</button>
                        </div>
                        {activeTab === 'drive' && (
                            <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-200 shadow-sm relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl shrink-0"><Icon name="fa-magic" /></div>
                                        <div>
                                            <h4 className="font-bold text-green-900">Generador de Estructura</h4>
                                            <p className="text-sm text-green-700/80 mt-1">Crea la estructura estándar de 8 carpetas.</p>
                                        </div>
                                    </div>
                                    <div className="mb-4 bg-white/60 p-2 rounded border border-green-100 flex items-center justify-between">
                                        <div className="text-xs text-green-800 truncate mr-2"><span className="font-bold uppercase opacity-60">En:</span> <span className="font-bold">{targetParent.name}</span></div>
                                        <button onClick={openPicker} className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Cambiar</button>
                                    </div>
                                    {creationStatus === 'idle' ? (
                                        <div className="flex items-end gap-3">
                                             <div className="flex-1 min-w-[50px]"><label className="block text-[10px] font-bold text-green-800 uppercase mb-1">ID</label><input value={correlative} onChange={e => setCorrelative(e.target.value)} className="w-full border border-green-300 rounded p-2 text-sm text-center font-mono font-bold" /></div>
                                             <div className="flex-[3]"><label className="block text-[10px] font-bold text-green-800 uppercase mb-1">Nombre Previsto</label><div className="w-full bg-white/50 border border-green-200 rounded p-2 text-sm text-green-900 font-mono truncate">{correlative}_{project.name.replace(/\s+/g, "")}</div></div>
                                             <button onClick={handleCreateStructure} className="bg-green-600 text-white font-bold py-2 px-4 rounded shadow-lg">Generar</button>
                                        </div>
                                    ) : (
                                        <div className="bg-white/80 p-4 rounded border border-green-200 text-center text-sm font-bold text-green-800">{creationLog}</div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">O vincular manualmente</h4>
                            <div className="space-y-4">
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alias</label><input className="w-full border border-slate-300 p-3 rounded-lg" value={newRepo.alias} onChange={e => setNewRepo({...newRepo, alias: e.target.value})} /></div>
                                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL</label><input className="w-full border border-slate-300 p-3 rounded-lg font-mono text-sm" value={newRepo.url} onChange={e => setNewRepo({...newRepo, url: e.target.value})} /></div>
                                <div className="pt-4"><button onClick={handleAddRepo} disabled={!newRepo.alias || !newRepo.url} className={`w-full py-3 bg-slate-700 text-white font-bold rounded-lg shadow-lg`}>Guardar Enlace Manual</button></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};