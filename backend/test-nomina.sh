#!/bin/bash
# ============================================
# ESCENARIO DE PRUEBA COMPLETO - NOMINA
# Grupo Rubio - Verificacion de calculos
# ============================================

set -e
BASE_URL="http://localhost:3001/api"

echo "============================================"
echo "  ESCENARIO DE PRUEBA: Calculo de Nomina"
echo "============================================"
echo ""

# ============================================
# PASO 0: Login
# ============================================
echo ">> Paso 0: Autenticacion..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gruporubio.net","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')

if [ -z "$TOKEN" ]; then
  echo "ERROR: No se pudo obtener token. Respuesta:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi
echo "   Token obtenido OK"
echo ""

# ============================================
# PASO 1: Crear Categoria "Peon Especialista"
# ============================================
echo ">> Paso 1: Creando categoria 'Peon Especialista'..."
CAT_RESPONSE=$(curl -s -X POST "$BASE_URL/categorias" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "codigo": "PEON_ESP_TEST",
    "nombre": "Peon Especialista",
    "descripcion": "Categoria de prueba para verificar calculos de nomina",
    "salarioBase": 1200.00,
    "plusConvenio": 0,
    "precioHora": 10.00,
    "recargoNocturno": 25,
    "recargoFestivo": 75,
    "recargoExtra": 25,
    "recargoExtraAdicional": 50,
    "plusTransporte": 0,
    "plusPeligrosidad": 0
  }')

CAT_ID=$(echo "$CAT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
if [ -z "$CAT_ID" ]; then
  echo "   ERROR creando categoria. Respuesta:"
  echo "$CAT_RESPONSE"
  exit 1
fi
echo "   Categoria creada: ID=$CAT_ID"
echo "   - Salario base: 1200 EUR/mes"
echo "   - Precio hora: 10.00 EUR"
echo "   - Recargo nocturno: 25%"
echo "   - Recargo festivo: 75%"
echo "   - Recargo extras: 25%"
echo ""

# ============================================
# PASO 2: Crear Tipo de Ausencia "Baja Medica Test"
# ============================================
echo ">> Paso 2: Creando tipo de ausencia 'Baja Medica Test'..."
TIPO_AUS_RESPONSE=$(curl -s -X POST "$BASE_URL/tipos-ausencia" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "codigo": "BMT",
    "nombre": "Baja Medica Test",
    "descripcion": "Baja medica con tramos legales espanoles para test",
    "pagada": true,
    "porcentajeCobro": 60,
    "usaTramos": true,
    "tramosJson": "[{\"diaDesde\":1,\"diaHasta\":3,\"porcentaje\":0},{\"diaDesde\":4,\"diaHasta\":15,\"porcentaje\":60},{\"diaDesde\":16,\"diaHasta\":20,\"porcentaje\":75},{\"diaDesde\":21,\"diaHasta\":999,\"porcentaje\":100}]",
    "baseCalculo": "SALARIO_BASE",
    "diasCarencia": 0,
    "pagador": "SEGURIDAD_SOCIAL",
    "incluyeDomingos": false,
    "incluyeFestivos": false,
    "requiereJustificante": true,
    "tipoJustificante": "MEDICO",
    "requiereAltaMedica": true,
    "colorHex": "#EF4444",
    "diasMaximo": 365
  }')

TIPO_AUS_ID=$(echo "$TIPO_AUS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
if [ -z "$TIPO_AUS_ID" ]; then
  echo "   ERROR creando tipo de ausencia. Respuesta:"
  echo "$TIPO_AUS_RESPONSE"
  exit 1
fi
echo "   Tipo de ausencia creado: ID=$TIPO_AUS_ID"
echo "   - Tramos: dias 1-3 (0%), dias 4-15 (60%), dias 16-20 (75%), dia 21+ (100%)"
echo "   - Base calculo: SALARIO_BASE"
echo ""

# ============================================
# PASO 3: Crear Cliente
# ============================================
echo ">> Paso 3: Creando cliente 'Empresa Test Nominas'..."
CLI_RESPONSE=$(curl -s -X POST "$BASE_URL/clientes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nombre": "Empresa Test Nominas",
    "cif": "B99999999",
    "direccion": "Calle Test 1",
    "localidad": "Tudela",
    "provincia": "Navarra"
  }')

CLI_ID=$(echo "$CLI_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
if [ -z "$CLI_ID" ]; then
  echo "   ERROR creando cliente. Respuesta:"
  echo "$CLI_RESPONSE"
  exit 1
fi
echo "   Cliente creado: ID=$CLI_ID"
echo ""

# ============================================
# PASO 4: Crear Centro de Trabajo
# ============================================
echo ">> Paso 4: Creando centro 'Centro Test Nominas'..."
CENTRO_RESPONSE=$(curl -s -X POST "$BASE_URL/centros" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"nombre\": \"Centro Test Nominas\",
    \"clienteId\": $CLI_ID,
    \"direccion\": \"Calle Test 1\",
    \"localidad\": \"Tudela\",
    \"tipoHorarioLimpieza\": \"FLEXIBLE\"
  }")

CENTRO_ID=$(echo "$CENTRO_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
if [ -z "$CENTRO_ID" ]; then
  echo "   ERROR creando centro. Respuesta:"
  echo "$CENTRO_RESPONSE"
  exit 1
fi
echo "   Centro creado: ID=$CENTRO_ID"
echo ""

# ============================================
# PASO 5: Crear Trabajador "Alvaro Perez"
# ============================================
echo ">> Paso 5: Creando trabajador 'Alvaro Perez'..."
TRAB_RESPONSE=$(curl -s -X POST "$BASE_URL/trabajadores" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"dni\": \"12345678Z\",
    \"nombre\": \"Alvaro\",
    \"apellidos\": \"Perez\",
    \"fechaAlta\": \"2026-01-01\",
    \"categoriaId\": $CAT_ID,
    \"horasContrato\": 20,
    \"tipoContrato\": \"INDEFINIDO\",
    \"telefono\": \"666000001\",
    \"email\": \"alvaro.test@gruporubio.net\",
    \"direccion\": \"Calle Test 10\",
    \"localidad\": \"Tudela\"
  }")

TRAB_ID=$(echo "$TRAB_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
if [ -z "$TRAB_ID" ]; then
  echo "   ERROR creando trabajador. Respuesta:"
  echo "$TRAB_RESPONSE"
  exit 1
fi
echo "   Trabajador creado: ID=$TRAB_ID"
echo "   - Alvaro Perez (DNI: 12345678Z)"
echo "   - Contrato: 20h/semana, Indefinido"
echo "   - Categoria: Peon Especialista (ID=$CAT_ID)"
echo ""

# ============================================
# PASO 6: Crear Asignaciones (turnos enero 2026)
# ============================================
echo ">> Paso 6: Creando 21 asignaciones para enero 2026..."
echo ""

# Funcion para crear asignacion
crear_turno() {
  local FECHA=$1
  local HORA_INI=$2
  local HORA_FIN=$3
  local TIPO=$4

  local RESP=$(curl -s -X POST "$BASE_URL/asignaciones" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"trabajadorId\": $TRAB_ID,
      \"centroId\": $CENTRO_ID,
      \"fecha\": \"$FECHA\",
      \"horaInicio\": \"$HORA_INI\",
      \"horaFin\": \"$HORA_FIN\"
    }")

  local ASIG_ID=$(echo "$RESP" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
  if [ -z "$ASIG_ID" ]; then
    echo "   ERROR en $FECHA ($TIPO): $RESP"
  else
    echo "   $FECHA  $HORA_INI-$HORA_FIN  [$TIPO]  ID=$ASIG_ID"
  fi
}

echo "   --- Semana 1 (Ene 1-4) ---"
crear_turno "2026-01-01" "09:00" "13:00" "FESTIVO (Ano Nuevo)"
crear_turno "2026-01-02" "22:00" "06:00" "NOCTURNO #1"

echo "   --- Semana 2 (Ene 5-11) ---"
crear_turno "2026-01-05" "09:00" "13:00" "Normal"
crear_turno "2026-01-06" "09:00" "13:00" "FESTIVO (Epifania)"
crear_turno "2026-01-07" "09:00" "13:00" "Normal"
crear_turno "2026-01-08" "22:00" "06:00" "NOCTURNO #2"

echo "   --- Semana 3 (Ene 12-18) - BAJA MEDICA ---"
crear_turno "2026-01-12" "09:00" "13:00" "Normal (BAJA)"
crear_turno "2026-01-13" "09:00" "13:00" "Normal (BAJA)"
crear_turno "2026-01-14" "09:00" "13:00" "Normal (BAJA)"
crear_turno "2026-01-15" "09:00" "13:00" "Normal (BAJA)"
crear_turno "2026-01-16" "09:00" "13:00" "Normal (BAJA)"

echo "   --- Semana 4 (Ene 19-25) ---"
crear_turno "2026-01-19" "09:00" "13:00" "Normal (BAJA)"
crear_turno "2026-01-20" "09:00" "13:00" "Normal (BAJA)"
crear_turno "2026-01-21" "22:00" "06:00" "NOCTURNO #3"
crear_turno "2026-01-22" "09:00" "13:00" "Normal"
crear_turno "2026-01-23" "09:00" "13:00" "Normal"

echo "   --- Semana 5 (Ene 26-31) ---"
crear_turno "2026-01-26" "09:00" "13:00" "Normal"
crear_turno "2026-01-27" "09:00" "13:00" "Normal"
crear_turno "2026-01-28" "09:00" "13:00" "Normal"
crear_turno "2026-01-29" "09:00" "13:00" "Normal"
crear_turno "2026-01-30" "09:00" "13:00" "Normal"

echo ""
echo "   Total: 21 asignaciones creadas"
echo ""

# ============================================
# PASO 7: Crear Ausencia (baja medica 10-20 enero)
# ============================================
echo ">> Paso 7: Creando ausencia de baja medica (10-20 enero)..."
AUS_RESPONSE=$(curl -s -X POST "$BASE_URL/ausencias" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"trabajadorId\": $TRAB_ID,
    \"tipoAusenciaId\": $TIPO_AUS_ID,
    \"fechaInicio\": \"2026-01-10\",
    \"fechaFin\": \"2026-01-20\",
    \"motivo\": \"Baja medica test para verificacion de calculos\"
  }")

AUS_ID=$(echo "$AUS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
if [ -z "$AUS_ID" ]; then
  echo "   ERROR creando ausencia. Respuesta:"
  echo "$AUS_RESPONSE"
  exit 1
fi
echo "   Ausencia creada: ID=$AUS_ID (estado: PENDIENTE)"
echo ""

# ============================================
# PASO 8: Aprobar la ausencia
# ============================================
echo ">> Paso 8: Aprobando la ausencia..."
APROBACION_RESPONSE=$(curl -s -X PUT "$BASE_URL/ausencias/$AUS_ID/aprobar" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "   Ausencia ID=$AUS_ID aprobada"
echo ""

# ============================================
# RESUMEN FINAL
# ============================================
echo "============================================"
echo "  RESUMEN DE DATOS CREADOS"
echo "============================================"
echo ""
echo "  Categoria:      Peon Especialista (ID=$CAT_ID)"
echo "  Tipo Ausencia:  Baja Medica Test (ID=$TIPO_AUS_ID)"
echo "  Cliente:        Empresa Test Nominas (ID=$CLI_ID)"
echo "  Centro:         Centro Test Nominas (ID=$CENTRO_ID)"
echo "  Trabajador:     Alvaro Perez (ID=$TRAB_ID)"
echo "  Ausencia:       10-20 enero 2026 (ID=$AUS_ID, APROBADA)"
echo ""
echo "  Asignaciones:   21 turnos en enero 2026"
echo "    - 3 nocturnos (22:00-06:00): Ene 2, 8, 21"
echo "    - 2 festivos (09:00-13:00): Ene 1, 6"
echo "    - 7 durante baja (09:00-13:00): Ene 12-16, 19-20"
echo "    - 9 normales (09:00-13:00): Ene 5, 7, 22-23, 26-30"
echo ""
echo "============================================"
echo "  VERIFICACION: Ve a Informes > Nomina"
echo "  Selecciona: Alvaro Perez, Enero 2026"
echo "============================================"
echo ""
echo "  Trabajador ID para API directa:"
echo "  curl -H 'Authorization: Bearer $TOKEN' \\"
echo "    '$BASE_URL/control-horas/nomina?mes=1&año=2026&trabajadorId=$TRAB_ID'"
echo ""
