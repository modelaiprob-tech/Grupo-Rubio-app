import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApiClient } from '../contexts/AuthContext';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

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
    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
      {iniciales || '??'}
    </div>
  );
}

function SeccionPerfil({ titulo, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100">{titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function CampoTexto({ label, value, onChange, type = 'text', required = false, placeholder = '', className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
      />
    </div>
  );
}

function CampoSelect({ label, value, onChange, options, required = false, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm bg-white"
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
      const data = await api.get(`/trabajadores/${id}`);
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
      await api.put(`/trabajadores/${id}`, dataToSend);
      setMensaje({ tipo: 'ok', texto: 'Perfil guardado correctamente' });
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.error || 'Error al guardar' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!trabajador) {
    return (
      <div className="p-6">
        <p className="text-red-500">Trabajador no encontrado</p>
        <button onClick={() => navigate('/trabajadores')} className="mt-4 text-blue-500 hover:underline">
          Volver a trabajadores
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/trabajadores')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Perfil del trabajador</h1>
      </div>

      {/* Card identidad */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-center gap-5">
          <AvatarInicial nombre={form.nombre} apellidos={form.apellidos} />
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {form.nombre} {form.apellidos}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {trabajador.categoria?.nombre || 'Sin categoría'}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              trabajador.activo
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
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
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
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
              className="w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="compartirCumple" className="text-sm text-slate-600">
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
            className="px-6 py-3 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
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
