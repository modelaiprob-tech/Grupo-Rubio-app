import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiClient } from '../contexts/AuthContext';
import * as trabajadoresApi from '../services/trabajadoresApi';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

function useFont(href) {
  useEffect(() => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);
}

const ESTADOS_CIVILES = [
  { value: '', label: 'Sin especificar' },
  { value: 'SOLTERO', label: 'Soltero/a' },
  { value: 'CASADO', label: 'Casado/a' },
  { value: 'DIVORCIADO', label: 'Divorciado/a' },
  { value: 'VIUDO', label: 'Viudo/a' },
  { value: 'PAREJA_DE_HECHO', label: 'Pareja de hecho' },
];

const GENEROS = [
  { value: '', label: 'Sin especificar' },
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'NO_BINARIO', label: 'No binario' },
  { value: 'PREFIERO_NO_DECIR', label: 'Prefiero no decir' },
];

const TIPOS_ID = [
  { value: 'DNI', label: 'DNI' },
  { value: 'NIE', label: 'NIE' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
];

const PROVINCIAS_ESPANA = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz',
  'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real',
  'Córdoba', 'A Coruña', 'Cuenca', 'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa',
  'Huelva', 'Huesca', 'Islas Baleares', 'Jaén', 'León', 'Lérida', 'Lugo', 'Madrid',
  'Málaga', 'Murcia', 'Navarra', 'Orense', 'Palencia', 'Las Palmas', 'Pontevedra',
  'La Rioja', 'Salamanca', 'S.C. de Tenerife', 'Segovia', 'Sevilla', 'Soria',
  'Tarragona', 'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
];

function AvatarInicial({ nombre, apellidos }) {
  const iniciales = `${nombre?.charAt(0) || ''}${apellidos?.charAt(0) || ''}`.toUpperCase();
  return (
    <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-400 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
      {iniciales || '??'}
    </div>
  );
}

function SeccionPerfil({ titulo, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] p-6 mb-6">
      <h2 className="text-lg font-extrabold text-gray-900 tracking-tight mb-4 pb-3 border-b border-gray-100">{titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function CampoTexto({ label, value, onChange, type = 'text', required = false, placeholder = '', className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all text-sm"
      />
    </div>
  );
}

function CampoSelect({ label, value, onChange, options, required = false, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all text-sm bg-white"
      >
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function PerfilTrabajador() {
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  const { id } = useParams();
  const navigate = useNavigate();
  const api = useApiClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [trabajador, setTrabajador] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    cargarTrabajador();
  }, [id]);

  const cargarTrabajador = async () => {
    setLoading(true);
    try {
      const data = await trabajadoresApi.getById(api, id);
      setTrabajador(data);
      setForm({
        nombre: data.nombre || '',
        apellidos: data.apellidos || '',
        tipoIdentificacion: data.tipoIdentificacion || 'DNI',
        dni: data.dni || '',
        identificacionSecundaria: data.identificacionSecundaria || '',
        tipoIdentificacionSecundaria: data.tipoIdentificacionSecundaria || '',
        nacionalidad: data.nacionalidad || '',
        estadoCivil: data.estadoCivil || '',
        fechaNacimiento: data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '',
        genero: data.genero || '',
        compartirCumpleanos: data.compartirCumpleanos || false,
        // Dirección
        direccion: data.direccion || '',
        codigoPostal: data.codigoPostal || '',
        localidad: data.localidad || '',
        provincia: data.provincia || '',
        pais: data.pais || 'España',
        // Contacto
        email: data.email || '',
        emailPersonal: data.emailPersonal || '',
        telefono: data.telefono || '',
        telefonoPersonal: data.telefonoPersonal || '',
        telefonoEmergencia: data.telefonoEmergencia || '',
      });
    } catch (err) {
      console.error('Error cargando trabajador:', err);
    }
    setLoading(false);
  };

  const updateField = (field) => (value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMensaje(null);
    try {
      const dataToSend = { ...form };
      if (dataToSend.fechaNacimiento) {
        dataToSend.fechaNacimiento = new Date(dataToSend.fechaNacimiento).toISOString();
      }
      await trabajadoresApi.actualizar(api, id, dataToSend);
      setMensaje({ tipo: 'ok', texto: 'Perfil guardado correctamente' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.error || 'Error al guardar' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]" style={{ fontFamily: '"Outfit", sans-serif' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-bounce" />
          </div>
          <p className="text-sm text-gray-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!trabajador) {
    return (
      <div className="p-6" style={{ fontFamily: '"Outfit", sans-serif' }}>
        <p className="text-red-500">Trabajador no encontrado</p>
        <button onClick={() => navigate('/trabajadores')} className="mt-4 text-teal-600 hover:underline">
          Volver a trabajadores
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8 max-w-4xl mx-auto" style={{ fontFamily: '"Outfit", sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/trabajadores')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Perfil del trabajador</h1>
      </div>

      {/* Card identidad */}
      <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] p-6 mb-6">
        <div className="flex items-center gap-5">
          <AvatarInicial nombre={form.nombre} apellidos={form.apellidos} />
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {form.nombre} {form.apellidos}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {trabajador.categoria?.nombre || 'Sin categoría'}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              trabajador.activo
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-600'
            }`}>
              {trabajador.activo ? 'Activo' : 'Dado de baja'}
            </span>
          </div>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${
          mensaje.tipo === 'ok'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-600 border border-rose-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={guardar}>
        {/* Datos Personales */}
        <SeccionPerfil titulo="Datos personales">
          <CampoTexto label="Nombre" value={form.nombre} onChange={updateField('nombre')} required />
          <CampoTexto label="Apellidos" value={form.apellidos} onChange={updateField('apellidos')} required />

          <CampoSelect
            label="Tipo de identificación"
            value={form.tipoIdentificacion}
            onChange={updateField('tipoIdentificacion')}
            options={TIPOS_ID}
          />
          <CampoTexto label="Número de identificación" value={form.dni} onChange={updateField('dni')} required />

          <CampoSelect
            label="Identificación secundaria (tipo)"
            value={form.tipoIdentificacionSecundaria}
            onChange={updateField('tipoIdentificacionSecundaria')}
            options={[{ value: '', label: 'Ninguna' }, ...TIPOS_ID]}
          />
          <CampoTexto label="Número ID secundaria" value={form.identificacionSecundaria} onChange={updateField('identificacionSecundaria')} />

          <CampoTexto label="Nacionalidad" value={form.nacionalidad} onChange={updateField('nacionalidad')} placeholder="Ej: Española" />
          <CampoSelect
            label="Estado civil"
            value={form.estadoCivil}
            onChange={updateField('estadoCivil')}
            options={ESTADOS_CIVILES}
          />

          <CampoTexto label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={updateField('fechaNacimiento')} type="date" />
          <CampoSelect
            label="Género"
            value={form.genero}
            onChange={updateField('genero')}
            options={GENEROS}
          />

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="compartirCumple"
              checked={form.compartirCumpleanos || false}
              onChange={(e) => updateField('compartirCumpleanos')(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-gray-200 focus:ring-teal-500"
            />
            <label htmlFor="compartirCumple" className="text-sm text-gray-500">
              Compartir cumpleaños con el equipo
            </label>
          </div>
        </SeccionPerfil>

        {/* Dirección */}
        <SeccionPerfil titulo="Dirección">
          <CampoTexto label="Domicilio" value={form.direccion} onChange={updateField('direccion')} className="md:col-span-2" placeholder="Calle, número, piso..." />
          <CampoTexto label="Código postal" value={form.codigoPostal} onChange={updateField('codigoPostal')} placeholder="Ej: 31001" />
          <CampoTexto label="Localidad" value={form.localidad} onChange={updateField('localidad')} placeholder="Ej: Pamplona" />
          <CampoSelect
            label="Provincia"
            value={form.provincia}
            onChange={updateField('provincia')}
            options={[{ value: '', label: 'Seleccionar provincia' }, ...PROVINCIAS_ESPANA.map(p => ({ value: p, label: p }))]}
          />
          <CampoTexto label="País" value={form.pais} onChange={updateField('pais')} placeholder="España" />
        </SeccionPerfil>

        {/* Contacto */}
        <SeccionPerfil titulo="Contacto">
          <CampoTexto label="Email empresa" value={form.email} onChange={updateField('email')} type="email" placeholder="nombre@empresa.com" />
          <CampoTexto label="Email personal" value={form.emailPersonal} onChange={updateField('emailPersonal')} type="email" placeholder="nombre@gmail.com" />
          <CampoTexto label="Teléfono empresa" value={form.telefono} onChange={updateField('telefono')} placeholder="Ej: 948 123 456" />
          <CampoTexto label="Teléfono personal" value={form.telefonoPersonal} onChange={updateField('telefonoPersonal')} placeholder="Ej: 600 123 456" />
          <CampoTexto label="Teléfono de emergencia" value={form.telefonoEmergencia} onChange={updateField('telefonoEmergencia')} placeholder="Ej: 600 789 012" />
        </SeccionPerfil>

        {/* Botón guardar */}
        <div className="flex justify-end gap-3 mb-8">
          <button
            type="button"
            onClick={() => navigate('/trabajadores')}
            className="px-6 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
