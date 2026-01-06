import React, { useState } from 'react';
import { Gem } from '../types';

const Icon = ({ name, className = "" }: { name: string, className?: string }) => (
  <i className={`fa-solid ${name} ${className}`}></i>
);

export const GemsView = ({ gems, onAddGem }: { gems: Gem[], onAddGem: (g: Gem) => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [newGem, setNewGem] = useState({ name: '', description: '', url: '', icon: '' });

  const handleAdd = () => {
    if (!newGem.name || !newGem.url) return;
    onAddGem({ id: 'g' + Date.now(), ...newGem });
    setShowModal(false);
    setNewGem({ name: '', description: '', url: '', icon: '' });
  };

  return (
    <div className="space-y-6 print:hidden pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-simple-900">Mis Gemas</h2>
        <button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Icon name="fa-plus" className="mr-2" /> <span className="hidden md:inline">Agregar Gema</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gems.map(gem => (
           <div key={gem.id} className="bg-simple-800 text-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 relative group min-h-[200px] flex flex-col">
              <div className="h-32 bg-gradient-to-br from-simple-600 to-simple-900 flex items-center justify-center relative p-4">
                 <Icon name={gem.icon || 'fa-brain'} className="text-5xl text-white/20 absolute z-0" />
                 <h3 className="text-xl font-bold font-sans z-10 text-center uppercase leading-tight">{gem.name}</h3>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between bg-simple-800">
                 <p className="text-slate-300 text-xs mb-4 line-clamp-2">{gem.description}</p>
                 <a href={gem.url} target="_blank" className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-center rounded text-sm transition-colors font-medium border border-white/10">
                    <Icon name="fa-bolt" className="mr-2" /> Usar Gema
                 </a>
              </div>
           </div>
        ))}
      </div>
       
       {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-slate-800">
            <h3 className="text-lg font-bold mb-4">Agregar Gema</h3>
            <div className="space-y-3">
              <input className="w-full border p-2 rounded-lg text-sm" placeholder="Nombre" value={newGem.name} onChange={e => setNewGem({...newGem, name: e.target.value})} />
              <input className="w-full border p-2 rounded-lg text-sm" placeholder="Descripción" value={newGem.description} onChange={e => setNewGem({...newGem, description: e.target.value})} />
              <input className="w-full border p-2 rounded-lg text-sm" placeholder="URL" value={newGem.url} onChange={e => setNewGem({...newGem, url: e.target.value})} />
              <input className="w-full border p-2 rounded-lg text-sm" placeholder="Icono (fa-icon)" value={newGem.icon} onChange={e => setNewGem({...newGem, icon: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="text-slate-500 text-sm px-3 py-2">Cancelar</button>
              <button onClick={handleAdd} className="bg-simple-600 text-white text-sm px-4 py-2 rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};