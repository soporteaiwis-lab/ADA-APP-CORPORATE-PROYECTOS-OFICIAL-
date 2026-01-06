import React, { useState } from 'react';
import { Tool } from '../types';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

// Helper for URI Schemes (Apps that open directly)
const URI_SCHEMES = [
    { name: 'Calculadora', scheme: 'calculator:', icon: 'fa-calculator' },
    { name: 'Configuración', scheme: 'ms-settings:', icon: 'fa-cog' },
    { name: 'Correo', scheme: 'mailto:', icon: 'fa-envelope' },
    { name: 'VS Code', scheme: 'vscode:', icon: 'fa-code' },
    { name: 'Store', scheme: 'ms-windows-store:', icon: 'fa-shopping-bag' },
    { name: 'Reloj', scheme: 'ms-clock:', icon: 'fa-clock' }
];

export const ToolsModal = ({ onClose, tools, onAddTool }: { onClose: () => void, tools: Tool[], onAddTool: (t: Tool) => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTool, setNewTool] = useState({ name: '', url: '', icon: 'fa-cube' });
  
  // New State for "Launcher Assistant" to fix the "stale copy" bug
  const [selectedLocalTool, setSelectedLocalTool] = useState<Tool | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleAddTool = () => {
    if(!newTool.name || !newTool.url) return;
    
    // Auto-detect local path pattern or URI scheme
    // If it doesn't start with http/https, we treat it as "System/Local"
    const isWebUrl = newTool.url.startsWith('http') || newTool.url.startsWith('https');
    
    onAddTool({
        id: 't' + Date.now(),
        name: newTool.name,
        url: newTool.url,
        icon: newTool.icon,
        color: isWebUrl ? 'text-blue-400' : 'text-orange-400',
        isLocal: !isWebUrl
    });
    
    setIsAdding(false);
    setNewTool({ name: '', url: '', icon: 'fa-cube' });
  };

  const handleToolClick = (e: React.MouseEvent, tool: Tool) => {
      // 1. Identify Type
      const isWebUrl = tool.url.startsWith('http') || tool.url.startsWith('https');
      const isProtocol = tool.url.includes(':') && !tool.url.includes('C:') && !tool.url.includes('/'); 

      // 2. If it's a Web URL or a Direct Protocol (like 'calculator:'), let the browser handle it
      if (isWebUrl || isProtocol) {
          // Allow default behavior (href target blank)
          return;
      }

      // 3. If it's a Local File Path (C:\...), block default and show Assistant
      e.preventDefault();
      setCopySuccess(false);
      setSelectedLocalTool(tool); // Set the specific tool clicked
  };

  const handleCopyPath = () => {
      if (selectedLocalTool) {
          navigator.clipboard.writeText(selectedLocalTool.url);
          setCopySuccess(true);
      }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/95 md:bg-slate-900/90 flex flex-col md:justify-center md:items-center backdrop-blur-md animate-fade-in">
      
      {/* Close Button */}
      <button 
          onClick={onClose} 
          className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-red-500/80 rounded-full text-white flex items-center justify-center transition-all z-[80]"
          title="Cerrar"
      >
          <Icon name="fa-times" className="text-xl" />
      </button>

      {/* Main Content */}
      <div className="w-full md:max-w-6xl relative p-4 overflow-y-auto h-full md:h-auto flex flex-col items-center">
        <div className="text-center mb-8 text-white mt-10 md:mt-0">
            <h2 className="text-3xl font-bold mb-2">Herramientas & Accesos</h2>
            <p className="text-white/60">Ecosistema de aplicaciones Web y Locales.</p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-items-center w-full max-w-5xl pb-24 md:pb-0">
            {tools.map((tool) => (
                <a 
                    key={tool.id} 
                    href={tool.url} 
                    target="_blank"
                    onClick={(e) => handleToolClick(e, tool)}
                    className="flex flex-col items-center gap-3 group w-full p-2 cursor-pointer relative"
                >
                    <div className={`w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:scale-110 group-hover:bg-white/10 group-hover:border-simple-400 transition-all duration-300 shadow-xl relative overflow-hidden`}>
                        <Icon name={tool.icon} className={`text-3xl ${tool.color}`} />
                        
                        {/* Type Indicator */}
                        {tool.isLocal && (
                            <div className="absolute bottom-0 left-0 right-0 bg-orange-500/80 text-[9px] text-white text-center py-0.5 font-bold uppercase">
                                Local
                            </div>
                        )}
                    </div>
                    <span className="text-white text-sm font-medium group-hover:text-simple-accent transition-colors text-center truncate w-full px-1">{tool.name}</span>
                </a>
            ))}

            {/* Add Button */}
            <button 
                onClick={() => setIsAdding(true)}
                className="flex flex-col items-center gap-3 group w-full p-2"
            >
                <div className="w-20 h-20 bg-simple-600/10 rounded-2xl flex items-center justify-center border-2 border-dashed border-simple-500/30 group-hover:bg-simple-600 group-hover:border-simple-500 group-hover:scale-105 transition-all duration-300">
                    <Icon name="fa-plus" className="text-2xl text-simple-400 group-hover:text-white" />
                </div>
                <span className="text-white/50 text-sm font-medium group-hover:text-white transition-colors">Nuevo</span>
            </button>
        </div>
      </div>

      {/* --- MODAL 1: LOCAL APP LAUNCHER ASSISTANT (Fixes the "Stuck" issue) --- */}
      {selectedLocalTool && (
        <div className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4 animate-scale-up backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
                <button onClick={() => setSelectedLocalTool(null)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Icon name="fa-times" /></button>
                
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        <Icon name={selectedLocalTool.icon} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Abrir Aplicación Local</h3>
                    <p className="text-sm text-slate-500 mt-1">Por seguridad, el navegador no ejecuta .exe directamente.</p>
                </div>

                <div className="bg-slate-100 p-4 rounded-xl mb-4 border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Ruta del programa:</p>
                    <code className="block bg-white p-2 rounded border border-slate-300 text-xs font-mono break-all text-slate-700">
                        {selectedLocalTool.url}
                    </code>
                </div>

                <button 
                    onClick={handleCopyPath}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${copySuccess ? 'bg-green-600 text-white' : 'bg-simple-900 text-white hover:bg-simple-800'}`}
                >
                    {copySuccess ? <><Icon name="fa-check" /> ¡Copiado!</> : <><Icon name="fa-copy" /> 1. Copiar Ruta</>}
                </button>

                <div className="mt-6 space-y-3">
                    <p className="text-sm font-bold text-slate-700 text-center">Instrucciones Rápidas:</p>
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center font-bold text-xs">2</span>
                        <span>Presiona <kbd className="bg-white border border-slate-300 rounded px-1 text-xs">Win</kbd> + <kbd className="bg-white border border-slate-300 rounded px-1 text-xs">R</kbd> en tu teclado.</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                        <span className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center font-bold text-xs">3</span>
                        <span>Pega (Ctrl+V) y presiona Enter.</span>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL 2: ADD NEW TOOL --- */}
      {isAdding && (
            <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-[90] animate-scale-up">
                <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-slate-700 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white text-xl font-bold">Agregar Herramienta</h3>
                        <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-white"><Icon name="fa-times" /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg mt-1 focus:border-simple-500 outline-none" 
                                placeholder="Ej. Calculadora" 
                                value={newTool.name}
                                onChange={e => setNewTool({...newTool, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Ruta, URL o Protocolo</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg mt-1 focus:border-simple-500 outline-none font-mono text-sm" 
                                placeholder="https://... o C:\... o calculator:" 
                                value={newTool.url}
                                onChange={e => setNewTool({...newTool, url: e.target.value})}
                            />
                        </div>
                        
                        {/* Protocol Suggestions */}
                        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                            <p className="text-xs text-simple-400 font-bold mb-2">💡 Tips para abrir directo (Sin Copiar/Pegar):</p>
                            <div className="flex flex-wrap gap-2">
                                {URI_SCHEMES.map(s => (
                                    <button 
                                        key={s.scheme}
                                        onClick={() => setNewTool({ ...newTool, url: s.scheme, name: newTool.name || s.name, icon: s.icon })}
                                        className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded border border-slate-600 transition-colors"
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase">Icono (FontAwesome)</label>
                            <input 
                                className="w-full bg-slate-900 border border-slate-600 text-white p-3 rounded-lg mt-1 focus:border-simple-500 outline-none" 
                                placeholder="fa-cube" 
                                value={newTool.icon}
                                onChange={e => setNewTool({...newTool, icon: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-400 hover:bg-slate-700 rounded-lg">Cancelar</button>
                        <button onClick={handleAddTool} className="flex-1 py-3 bg-simple-600 hover:bg-simple-500 text-white rounded-lg font-bold">Agregar</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
