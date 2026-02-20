import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

export default function ModalCambiarPassword({ onCambiar }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const requisitos = [
    { texto: 'Al menos 8 caracteres', ok: passwordNueva.length >= 8 },
    { texto: 'Al menos una mayúscula', ok: /[A-Z]/.test(passwordNueva) },
    { texto: 'Al menos un número', ok: /\d/.test(passwordNueva) },
    { texto: 'Las contraseñas coinciden', ok: passwordNueva.length > 0 && passwordNueva === passwordConfirmar },
  ];

  const todosOk = requisitos.every(r => r.ok) && passwordActual.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!todosOk) return;

    setError('');
    setCargando(true);
    try {
      await onCambiar(passwordActual, passwordNueva);
    } catch (err) {
      setError(err.error || 'Error al cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Cambiar contraseña</h2>
              <p className="text-white/80 text-sm">Es obligatorio antes de continuar</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Password actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
            <div className="relative">
              <input
                type={showActual ? 'text' : 'password'}
                value={passwordActual}
                onChange={e => setPasswordActual(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                placeholder="Tu contraseña actual"
                autoFocus
              />
              <button type="button" onClick={() => setShowActual(!showActual)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password nueva */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNueva ? 'text' : 'password'}
                value={passwordNueva}
                onChange={e => setPasswordNueva(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                placeholder="Mínimo 8 caracteres"
              />
              <button type="button" onClick={() => setShowNueva(!showNueva)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={passwordConfirmar}
              onChange={e => setPasswordConfirmar(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {/* Requisitos */}
          {passwordNueva.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {requisitos.map((r, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                  <Check className={`w-3.5 h-3.5 ${r.ok ? 'opacity-100' : 'opacity-30'}`} />
                  {r.texto}
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!todosOk || cargando}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors mt-2"
          >
            {cargando ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
