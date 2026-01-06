import React, { useState } from 'react';
import { Project, User, UserRole, ProjectLog } from '../types';
import { RepositoryManager } from './RepositoryManager'; // NEW IMPORT

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

export const ProjectsView = ({ 
  projects, 
  users, 
  currentUser,
  onAddProject, 
  onDeleteProject,
  onUpdateProject
}: { 
  projects: Project[], 
  users: User[],
  currentUser: User,
  onAddProject: (p: Project) => void,
  onDeleteProject: (id: string) => void,
  onUpdateProject: (p: Project) => void
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showReqModal, setShowReqModal] = useState(false);
  
  // NEW STATE: Repository Manager
  const [repoManagerConfig, setRepoManagerConfig] = useState<{ project: Project, type: 'github' | 'drive' } | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filters, setFilters] = useState({ name: '', client: '', status: 'En Curso' });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Expanded New Project State
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', 
    client: '', 
    status: 'En Curso', 
    progress: 0, 
    description: '', 
    repositories: [], // Init empty
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    teamIds: []
  });

  const [editProjectData, setEditProjectData] = useState<Partial<Project>>({});

  // --- Handlers ---
  const handleCreate = () => {
    if (!newProject.name || !newProject.client) return;
    const project: Project = {
      id: 'PROYECTO_' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
      name: newProject.name,
      client: newProject.client,
      encargadoCliente: newProject.encargadoCliente || 'Sin Asignar',
      status: newProject.status as any,
      description: newProject.description || '',
      progress: newProject.progress || 0,
      deadline: newProject.deadline || new Date().toISOString(),
      startDate: newProject.startDate || new Date().toISOString(),
      leadId: newProject.leadId || currentUser.id,
      teamIds: newProject.teamIds || [],
      technologies: [],
      isOngoing: newProject.status === 'En Curso',
      report: newProject.status === 'En Curso',
      year: parseInt(newProject.startDate?.split('-')[0] || '2025'),
      logs: [],
      repositories: [] // Start empty, user adds later via manager
    };
    onAddProject(project);
    setShowCreateModal(false);
    // Reset form
    setNewProject({ 
        name: '', client: '', status: 'En Curso', progress: 0, description: '', repositories: [],
        startDate: new Date().toISOString().split('T')[0],
        deadline: '',
        teamIds: []
    });
  };

  const toggleNewProjectTeamMember = (userId: string) => {
      const current = newProject.teamIds || [];
      if (current.includes(userId)) {
          setNewProject({ ...newProject, teamIds: current.filter(id => id !== userId) });
      } else {
          setNewProject({ ...newProject, teamIds: [...current, userId] });
      }
  };

  const handleOpenEdit = (p: Project) => { setSelectedProject(p); setEditProjectData({ ...p }); setShowEditModal(true); };
  
  const handleUpdate = () => { 
      if (selectedProject && editProjectData) { 
          const updatedStatus = editProjectData.status || selectedProject.status;
          const updatedData = {
              ...selectedProject,
              ...editProjectData,
              isOngoing: updatedStatus === 'En Curso',
              report: updatedStatus === 'En Curso'
          };
          onUpdateProject(updatedData); 
          setShowEditModal(false); 
      } 
  };
  
  // REPLACED OLD TRIGGER UPLOAD WITH REPO MANAGER OPENER
  const openRepoManager = (project: Project, type: 'github' | 'drive') => {
      setRepoManagerConfig({ project, type });
      setActiveMenuId(null);
  };
  
  const handleMenuClick = (id: string) => { setActiveMenuId(activeMenuId === id ? null : id); };
  const handleOpenLog = (p: Project) => { setSelectedProject(p); setShowLogModal(true); };
  const handleOpenTeam = (p: Project) => { setSelectedProject(p); setShowTeamModal(true); };
  const handleOpenReq = (p: Project) => { setSelectedProject(p); setShowReqModal(true); };
  
  const handleToggleTeamMember = (id: string) => { 
      if (!selectedProject) return;
      const currentIds = selectedProject.teamIds || [];
      const newIds = currentIds.includes(id) ? currentIds.filter(uid => uid !== id) : [...currentIds, id];
      const updatedProject = { ...selectedProject, teamIds: newIds };
      setSelectedProject(updatedProject); 
      onUpdateProject(updatedProject);
  };

  const filteredProjects = projects.filter(p => {
    const matchName = p.name.toLowerCase().includes(filters.name.toLowerCase()) || p.id.toLowerCase().includes(filters.name.toLowerCase());
    const matchStatus = filters.status === 'Todos' ? true : p.status === filters.status;
    return matchName && p.client.toLowerCase().includes(filters.client.toLowerCase()) && matchStatus;
  });

  return (
    <div className="space-y-6 print:hidden pb-24 lg:pb-0">
       
       {/* NEW REPO MANAGER MODAL */}
       {repoManagerConfig && (
           <RepositoryManager 
               project={repoManagerConfig.project}
               initialType={repoManagerConfig.type}
               onClose={() => setRepoManagerConfig(null)}
               onUpdateProject={onUpdateProject}
               currentUser={currentUser}
           />
       )}

       <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-2xl font-bold text-simple-900">Gestión de Proyectos</h2>
            <button onClick={() => setShowCreateModal(true)} className="w-full lg:w-auto bg-simple-600 hover:bg-simple-700 text-white px-4 py-3 lg:py-2 rounded-lg text-sm font-medium transition-colors shadow-md flex items-center justify-center">
            <Icon name="fa-plus" className="mr-2" /> Nuevo Proyecto
            </button>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
             <div className="flex-1 relative">
                 <Icon name="fa-search" className="absolute left-3 top-3 text-slate-400 text-sm" />
                 <input 
                    className="w-full border pl-9 p-2 rounded-lg text-sm bg-slate-50 focus:bg-white transition-colors" 
                    placeholder="Buscar por nombre..." 
                    value={filters.name}
                    onChange={e => setFilters({...filters, name: e.target.value})}
                 />
             </div>
             <div className="flex gap-2">
                 <input 
                    className="flex-1 md:w-40 border p-2 rounded-lg text-sm bg-slate-50" 
                    placeholder="Cliente..." 
                    value={filters.client}
                    onChange={e => setFilters({...filters, client: e.target.value})}
                 />
                 <select 
                    className="flex-1 md:w-40 border p-2 rounded-lg text-sm bg-slate-50 font-medium text-slate-700"
                    value={filters.status}
                    onChange={e => setFilters({...filters, status: e.target.value})}
                 >
                     <option value="En Curso">En Curso</option>
                     <option value="Finalizado">Finalizados</option>
                     <option value="Todos">Todos</option>
                 </select>
             </div>
        </div>
      </div>

      {/* --- DESKTOP TABLE VIEW (Hidden on Mobile) --- */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm table-fixed min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 w-1/4">Proyecto</th> <th className="p-3 w-1/5">Cliente</th> <th className="p-3 text-center w-24">Equipo</th> <th className="p-3 w-32">Fechas</th> <th className="p-3 text-center w-24">Estado</th> <th className="p-3 text-center w-28">Repositorios</th> <th className="p-3 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-slate-50">
                    <td className="p-3"><div className="font-bold truncate">{project.name}</div><button onClick={()=>handleOpenReq(project)} className="text-xs text-blue-500 hover:underline">Ver Resumen</button></td>
                    <td className="p-3"><div className="truncate">{project.client}</div></td>
                    <td className="p-3 text-center"><button onClick={()=>handleOpenTeam(project)} className="w-8 h-8 rounded-full border hover:bg-slate-100"><Icon name="fa-users-cog"/></button></td>
                    <td className="p-3 text-xs"><div>In: {new Date(project.startDate || '').toLocaleDateString()}</div><div>Fin: {new Date(project.deadline).toLocaleDateString()}</div></td>
                    <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${project.status === 'En Curso'?'bg-green-100 text-green-700':'bg-slate-200 text-slate-500'}`}>{project.status==='En Curso'?'Activo':'Fin'}</span></td>
                    <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                            {/* UPDATED: Buttons now open RepositoryManager */}
                            <button onClick={()=>openRepoManager(project,'drive')} className="p-1 relative group">
                                <Icon name="fab fa-google-drive" className={`text-lg ${project.repositories?.some(r=>r.type==='drive') ? 'text-green-600' : 'text-slate-300'}`}/>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[10px] p-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Drive</span>
                            </button>
                            <button onClick={()=>openRepoManager(project,'github')} className="p-1 relative group">
                                <Icon name="fab fa-github" className={`text-lg ${project.repositories?.some(r=>r.type==='github') ? 'text-black' : 'text-slate-300'}`}/>
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-black text-white text-[10px] p-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">GitHub</span>
                            </button>
                        </div>
                    </td>
                    <td className="p-3 text-center"><div className="flex justify-center gap-1"><button onClick={()=>handleOpenEdit(project)} className="p-1.5 hover:bg-slate-100 rounded"><Icon name="fa-pen"/></button><button onClick={()=>handleOpenLog(project)} className="p-1.5 hover:bg-slate-100 rounded text-blue-500"><Icon name="fa-history"/></button><button onClick={()=>onDeleteProject(project.id)} className="p-1.5 hover:bg-slate-100 rounded text-red-500"><Icon name="fa-trash"/></button></div></td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW (Full Features) --- */}
      <div className="lg:hidden space-y-4">
        {filteredProjects.map(project => (
           <div key={project.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                 <div className="flex-1 mr-2">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">{project.name}</h3>
                    <p className="text-sm text-slate-500 font-medium">{project.client}</p>
                 </div>
                 <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${project.status === 'En Curso' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {project.status === 'En Curso' ? 'Activo' : 'Fin'}
                 </span>
              </div>
              
              <div className="flex gap-2 my-1">
                  <button onClick={() => handleOpenTeam(project)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100">
                      <Icon name="fa-users" /> Equipo
                  </button>
                  <button onClick={() => handleOpenReq(project)} className="flex-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 flex items-center justify-center gap-2 hover:bg-slate-100">
                      <Icon name="fa-file-alt" /> Resumen
                  </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
                 <div><span className="block text-slate-400 font-bold uppercase">Inicio</span>{new Date(project.startDate || '').toLocaleDateString()}</div>
                 <div><span className="block text-slate-400 font-bold uppercase">Fin</span>{new Date(project.deadline).toLocaleDateString()}</div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                 <div className="flex gap-2">
                     <button onClick={() => openRepoManager(project, 'drive')} className={`w-10 h-10 rounded-lg flex items-center justify-center border ${project.repositories?.some(r=>r.type==='drive') ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-50 text-slate-300 border-slate-200'}`}><Icon name="fab fa-google-drive" className="text-lg" /></button>
                     <button onClick={() => openRepoManager(project, 'github')} className={`w-10 h-10 rounded-lg flex items-center justify-center border ${project.repositories?.some(r=>r.type==='github') ? 'bg-slate-800 text-white border-slate-900' : 'bg-slate-50 text-slate-300 border-slate-200'}`}><Icon name="fab fa-github" className="text-lg" /></button>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(project)} className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><Icon name="fa-pen" /></button>
                    <button onClick={() => handleOpenLog(project)} className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Icon name="fa-history" /></button>
                    <button onClick={() => onDeleteProject(project.id)} className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"><Icon name="fa-trash" /></button>
                 </div>
              </div>
           </div>
        ))}
      </div>
      
      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
          <div className="w-full h-full md:h-auto md:max-w-[700px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50 md:bg-white md:rounded-t-2xl">
                <h3 className="text-lg font-bold">{showEditModal ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
                <button onClick={() => {setShowCreateModal(false); setShowEditModal(false);}} className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full"><Icon name="fa-times"/></button>
             </div>
             <div className="p-6 overflow-y-auto flex-1 space-y-6">
                 {/* Basic Info */}
                 <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-400 uppercase">Información General</h4>
                     <input className="w-full border p-3 rounded-lg" placeholder="Nombre Proyecto" value={showEditModal ? editProjectData.name : newProject.name} onChange={e => showEditModal ? setEditProjectData({...editProjectData, name: e.target.value}) : setNewProject({...newProject, name: e.target.value})} />
                     <input className="w-full border p-3 rounded-lg" placeholder="Cliente" value={showEditModal ? editProjectData.client : newProject.client} onChange={e => showEditModal ? setEditProjectData({...editProjectData, client: e.target.value}) : setNewProject({...newProject, client: e.target.value})} />
                 </div>

                 {/* Status for Edit Mode */}
                 {showEditModal && (
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Estado</label>
                        <select 
                            className="w-full border p-3 rounded-lg"
                            value={editProjectData.status}
                            onChange={e => setEditProjectData({...editProjectData, status: e.target.value as any})}
                        >
                            <option value="En Curso">En Curso</option>
                            <option value="Finalizado">Finalizado</option>
                            <option value="Planning">Planning</option>
                        </select>
                     </div>
                 )}

                 {/* Dates */}
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Inicio</label>
                         <input type="date" className="w-full border p-3 rounded-lg" value={(showEditModal ? editProjectData.startDate : newProject.startDate) || ''} onChange={e => showEditModal ? setEditProjectData({...editProjectData, startDate: e.target.value}) : setNewProject({...newProject, startDate: e.target.value})} />
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Término (Deadline)</label>
                         <input type="date" className="w-full border p-3 rounded-lg" value={(showEditModal ? editProjectData.deadline : newProject.deadline) || ''} onChange={e => showEditModal ? setEditProjectData({...editProjectData, deadline: e.target.value}) : setNewProject({...newProject, deadline: e.target.value})} />
                     </div>
                 </div>

                 {/* Description */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                    <textarea className="w-full border p-3 rounded-lg h-24" placeholder="Detalles del proyecto..." value={showEditModal ? editProjectData.description : newProject.description} onChange={e => showEditModal ? setEditProjectData({...editProjectData, description: e.target.value}) : setNewProject({...newProject, description: e.target.value})} />
                 </div>

                 {!showEditModal && (
                     <div>
                         <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Asignar Equipo Inicial</h4>
                         <div className="border rounded-lg p-2 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {users.map(u => (
                                 <label key={u.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${newProject.teamIds?.includes(u.id) ? 'bg-simple-50 border-simple-200' : 'border-transparent hover:bg-slate-50'}`}>
                                     <input type="checkbox" checked={newProject.teamIds?.includes(u.id)} onChange={() => toggleNewProjectTeamMember(u.id)} className="rounded text-simple-600 focus:ring-simple-500" />
                                     <img src={u.avatar} className="w-6 h-6 rounded-full" />
                                     <span className="text-sm">{u.name}</span>
                                 </label>
                             ))}
                         </div>
                     </div>
                 )}
             </div>
             <div className="p-4 border-t bg-slate-50 md:rounded-b-2xl">
                <button onClick={showEditModal ? handleUpdate : handleCreate} className="w-full py-3 bg-simple-600 text-white font-bold rounded-lg shadow-lg">Guardar</button>
             </div>
          </div>
        </div>
      )}
      
      {/* Keeping other modals (Log, Team, Req) same as before but hidden for brevity in diff as they didn't change logic, just re-rendered */}
      {showLogModal && selectedProject && (
          <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
              <div className="w-full h-full md:h-[600px] md:max-w-[600px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">Bitácora</h3>
                      <button onClick={()=>setShowLogModal(false)} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><Icon name="fa-times"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {selectedProject.logs?.length === 0 && <p className="text-center text-slate-400 mt-10">Sin registros.</p>}
                    {selectedProject.logs?.map(log => (
                        <div key={log.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">
                                <span>{new Date(log.date).toLocaleDateString()}</span>
                                <span>{log.author}</span>
                            </div>
                            <p className="text-slate-800 text-sm leading-relaxed">{log.text}</p>
                            {log.link && (
                                <a href={log.link} target="_blank" className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <Icon name="fa-external-link-alt"/> Ver Archivo / Enlace
                                </a>
                            )}
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      )}

      {showTeamModal && selectedProject && (
          <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
              <div className="w-full h-full md:h-[600px] md:max-w-[500px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">Asignar Equipo</h3>
                      <button onClick={()=>setShowTeamModal(false)} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><Icon name="fa-times"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                     {users.map(u => {
                         const isSelected = selectedProject.teamIds.includes(u.id);
                         return (
                             <div key={u.id} onClick={() => handleToggleTeamMember(u.id)} className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${isSelected ? 'bg-simple-50 border-simple-200' : 'bg-white border-slate-100'}`}>
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-simple-600 border-simple-600' : 'border-slate-300'}`}>
                                     {isSelected && <Icon name="fa-check" className="text-white text-xs"/>}
                                 </div>
                                 <img src={u.avatar} className="w-8 h-8 rounded-full" />
                                 <div>
                                     <p className="font-bold text-sm">{u.name}</p>
                                     <p className="text-xs text-slate-500">{u.role}</p>
                                 </div>
                             </div>
                         )
                     })}
                  </div>
              </div>
          </div>
      )}

      {showReqModal && selectedProject && (
          <div className="fixed inset-0 z-[60] bg-white md:bg-black/50 flex flex-col md:justify-center md:items-center">
              <div className="w-full h-full md:h-auto md:max-w-[600px] bg-white md:rounded-2xl flex flex-col shadow-2xl">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg">Resumen Proyecto</h3>
                      <button onClick={()=>setShowReqModal(false)} className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><Icon name="fa-times"/></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Descripción General</h4>
                      <p className="text-slate-800 text-lg leading-relaxed mb-6">{selectedProject.description}</p>
                      
                      <h4 className="text-sm font-bold text-slate-400 uppercase mb-2">Tecnologías</h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                          {selectedProject.technologies.map(t => (
                              <span key={t} className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">{t}</span>
                          ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-xl">
                              <p className="text-green-800 font-bold text-2xl">{selectedProject.progress}%</p>
                              <p className="text-green-600 text-xs font-bold uppercase">Progreso Global</p>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-xl">
                              <p className="text-blue-800 font-bold text-2xl">{selectedProject.logs.length}</p>
                              <p className="text-blue-600 text-xs font-bold uppercase">Entradas Bitácora</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};