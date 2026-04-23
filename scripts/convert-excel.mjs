/**
 * Convierte gastos_mensuales.xlsx → gastos_para_importar.csv
 * Uso: node scripts/convert-excel.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const INPUT = '/Users/cesargaete/Downloads/gastos_mensuales.xlsx'
const OUTPUT = join(__dirname, '../gastos_para_importar.csv')

const MESES = {
  'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
  'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
  'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12,
}

function parseMesAnio(mesStr) {
  if (!mesStr) return { mes: null, anio: null }
  const parts = String(mesStr).trim().split(' ')
  const mes = MESES[parts[0]] ?? null
  const anio = parseInt(parts[1]) || null
  return { mes, anio }
}

const HOJAS = [
  'TC BancoChile César',
  'TC Itaú César',
  'CMR Nicole',
  'CMR Papá',
  'Depto',
]

const PERSONA_DEFAULT = {
  'TC BancoChile César': 'César',
  'TC Itaú César':       'César',
  'CMR Nicole':          'Nicole',
  'CMR Papá':            'Otro',
  'Depto':               'César',
}

// Ejemplos a ignorar
const SKIP_DESC = ['Ejemplo Comercio', 'Ejemplo Cuotas']

const wb = XLSX.readFile(INPUT)
const rows = []

for (const hoja of HOJAS) {
  const ws = wb.Sheets[hoja]
  if (!ws) { console.warn(`⚠️  Hoja no encontrada: ${hoja}`); continue }

  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  // Fila 0 = título, Fila 1 = headers, Fila 2+ = datos
  // Cols: 0=Mes, 1=Fecha, 2=Descripción, 3=Categoría, 4=Monto, 5=¿Cuotas?, 6=Cuota N°, 7=Total Cuotas, 8=Persona

  let count = 0
  for (const row of data.slice(2)) {
    const desc    = String(row[2] || '').trim()
    const monto   = Number(row[4]) || 0
    const persona = String(row[8] || PERSONA_DEFAULT[hoja] || 'Otro').trim()
    const categ   = String(row[3] || '').trim()
    const cuotaN  = parseInt(row[6]) || 1
    const cuotaT  = parseInt(row[7]) || 1

    if (!desc || !monto || SKIP_DESC.includes(desc)) continue

    const { mes, anio } = parseMesAnio(row[0])
    if (!mes || !anio) continue

    // Normalizar persona al formato de la app
    const personaNorm = persona === 'Compartido' ? 'Otro' : persona

    rows.push({
      description: desc,
      Monto: monto,
      paid_by: personaNorm,
      Estado: 'pendiente',
      Cuota: cuotaT > 1 ? `${cuotaN}/${cuotaT}` : '1',
      category: categ || 'Otro',
      Mes: mes,
      Año: anio,
    })
    count++
  }
  console.log(`✅ ${hoja}: ${count} gastos`)
}

// Generar CSV (headers sin tildes para evitar problemas de encoding al leer con XLSX)
const headers = ['description', 'Monto', 'paid_by', 'Estado', 'Cuota', 'category', 'Mes', 'Año']
const csv = [
  headers.join(','),
  ...rows.map(r =>
    headers.map(h => {
      const val = String(r[h] ?? '')
      return val.includes(',') ? `"${val}"` : val
    }).join(',')
  ),
].join('\n')

writeFileSync(OUTPUT, csv, 'utf8')
console.log(`\n📄 Archivo generado: gastos_para_importar.csv`)
console.log(`   Total gastos: ${rows.length}`)
console.log(`\n👉 Ahora ve al dashboard → "Importar Excel" → sube ese CSV`)
