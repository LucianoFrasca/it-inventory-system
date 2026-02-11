import React from 'react';
import { AlertTriangle, CheckCircle, FileUp, X, ArrowRight, Save, RefreshCw } from 'lucide-react';

const ImportModal = ({ isOpen, onClose, analysis, onConfirm, loading }) => {
  if (!isOpen || !analysis) return null;

  const { nuevos, exactos, conflictos } = analysis;
  const totalItems = (nuevos?.length || 0) + (exactos?.length || 0) + (conflictos?.length || 0);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileUp className="text-blue-500" /> Resultados del Análisis
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Se detectaron <b>{totalItems}</b> registros en el archivo.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
        </div>

        {/* BODY - SCROLLABLE */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* 1. NUEVOS */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg text-green-600 dark:text-green-300">
                <CheckCircle size={24}/>
            </div>
            <div>
                <h3 className="font-bold text-green-700 dark:text-green-300 text-lg">{nuevos?.length || 0} Nuevos Activos</h3>
                <p className="text-sm text-green-600 dark:text-green-400">Estos registros no existen y se crearán limpiamente.</p>
            </div>
          </div>

          {/* 2. DUPLICADOS EXACTOS */}
          {exactos?.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 opacity-75">
                <div className="bg-gray-200 dark:bg-slate-600 p-2 rounded-lg text-gray-500 dark:text-slate-300">
                    <Save size={24}/>
                </div>
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 text-lg">{exactos.length} Ignorados (Idénticos)</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ya existen en el sistema con la misma información. No se hará nada.</p>
                </div>
              </div>
          )}

          {/* 3. CONFLICTOS / MERGE */}
          {conflictos?.length > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-lg text-orange-600 dark:text-orange-300">
                    <RefreshCw size={24}/>
                </div>
                <div className="w-full">
                    <h3 className="font-bold text-orange-700 dark:text-orange-300 text-lg">{conflictos.length} Actualizables (Coincidencias)</h3>
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">
                        Existen activos con el mismo Serial pero el archivo trae datos nuevos.
                    </p>
                    
                    {/* Ejemplo de diferencias (Solo mostramos el primero para no saturar) */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded border border-orange-200 dark:border-orange-800/50 text-xs font-mono">
                        <p className="font-bold text-slate-500 mb-1">Ejemplo de cambio ({conflictos[0].identificador}):</p>
                        {Object.entries(conflictos[0].diferencias).slice(0, 3).map(([key, val]) => (
                            <div key={key} className="grid grid-cols-2 gap-2 border-b border-slate-100 dark:border-slate-800 py-1 last:border-0">
                                <span className="text-red-400 line-through truncate">{key}: {val.anterior || '(vacío)'}</span>
                                <span className="text-green-500 truncate flex items-center gap-1"><ArrowRight size={10}/> {val.nuevo}</span>
                            </div>
                        ))}
                        {Object.keys(conflictos[0].diferencias).length > 3 && <span className="text-slate-400 italic">... y más campos.</span>}
                    </div>
                </div>
              </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2 rounded-lg font-bold text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                Cancelar
            </button>
            
            {/* Si solo hay nuevos */}
            {(!conflictos || conflictos.length === 0) && (
                 <button 
                    onClick={() => onConfirm('skip')} 
                    disabled={loading || (nuevos?.length === 0)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                 >
                    {loading ? 'Procesando...' : `Importar ${nuevos?.length || 0} Nuevos`}
                 </button>
            )}

            {/* Si hay conflictos, damos a elegir */}
            {conflictos?.length > 0 && (
                <>
                    <button 
                        onClick={() => onConfirm('skip')} 
                        disabled={loading}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:brightness-110"
                    >
                        Solo Nuevos ({nuevos?.length || 0})
                    </button>
                    <button 
                        onClick={() => onConfirm('overwrite')} 
                        disabled={loading}
                        className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 animate-pulse"
                    >
                        {loading ? 'Mezclando...' : 'Mergear Todo (Actualizar)'}
                    </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;