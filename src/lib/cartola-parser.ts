/**
 * cartola-parser.ts
 * Porta la lógica de procesar_cartolas.py a TypeScript.
 * Soporta: BancoChile, Itaú, CMR Falabella.
 */

export type BankType = 'bancochile' | 'itau' | 'cmr_nicole' | 'cmr_papa' | 'unknown'

export type ParsedTransaction = {
  fecha: string        // YYYY-MM-DD
  descripcion: string
  monto: number
  categoria: string
  cuota_actual: number
  total_cuotas: number
  persona?: string
}

// ─── Palabras a omitir ────────────────────────────────────────────────────────
const SKIP_KEYWORDS = [
  'pago automatico', 'pago tarjeta', 'monto cancelado', 'total pagos',
  'traspaso deuda', 'saldo adeudado', 'monto facturado', 'monto mínimo',
  'monto minimo', 'monto pagado', 'nota credito', 'nota crédito',
  'total operaciones', 'total transacciones', 'sin movimientos',
  'total productos', 'total cargos', 'total tarjeta',
  'cargo automático', 'cargo automatico', 'pago normal',
  'pago pesos tef', 'pago cuota', 'abono', 'transferencia recibida',
  'total pat', 'total pagos a la cuenta',
]

// ─── Categorías automáticas ───────────────────────────────────────────────────
const CATEGORIAS: Record<string, string[]> = {
  'Supermercado':          ['lider', 'jumbo', 'santa isabel', 'unimarc', 'tottus', 'supermercado', 'hiperlider'],
  'Restaurante / Comida':  ['restaurant', 'sushi', 'pizza', 'burger', 'mcdonalds', 'starbucks', 'rappi',
                            'pedidosya', 'uber eats', 'cafe', 'café', 'sandwich', 'streat burger',
                            'pasteleria', 'cerveceria', 'barrafun', 'emporios', 'tommy beans', 'wokco'],
  'Transporte':            ['uber', 'cabify', 'bip', 'copec', 'shell', 'petrobras',
                            'parking', 'estacionamiento', 'autopista', 'peaje', 'muevo', 'copec app'],
  'Salud / Farmacia':      ['farmacia', 'salcobrand', 'ahumada', 'cruz verde', 'clinica', 'clínica',
                            'hospital', 'dental', 'medico', 'laboratorio', 'integramedica'],
  'Educación':             ['universidad', 'colegio', 'academia', 'instituto', 'duoc', 'libreria'],
  'Entretenimiento':       ['cine', 'hoyts', 'cinemark', 'netflix', 'spotify', 'disney',
                            'youtube', 'amazon prime', 'nintendo'],
  'Ropa / Calzado':        ['falabella', 'ripley', 'paris', 'zara', 'h&m', 'adidas',
                            'nike', 'bata', 'calzado', 'merrell', 'lippi', 'decathlon'],
  'Hogar / Depto':         ['sodimac', 'easy', 'ferreteria', 'muebles', 'ikea', 'construmart', 'casaideas'],
  'Mascotas':              ['superzoo', 'petco', 'baco pet', 'mascotas', 'pet city', 'mundo animal', 'pet shop'],
  'Viajes':                ['latam', 'sky', 'jetsmart', 'airbnb', 'booking', 'hotel', 'hostal', 'vuelo'],
  'Servicios básicos':     ['entel', 'movistar', 'claro', 'wom', 'vtr', 'gtd', 'internet', 'enel', 'chilectra'],
  'Tecnología':            ['apple.com', 'samsung', 'mercadolibre', 'amazon', 'abcdin', 'pcfactory', 'adobe', 'geekz'],
  'Seguros':               ['seg desgravamen', 'seg cesantia', 'seg. vida', 'seguros', 'desgravamen'],
  'Gastos bancarios':      ['comision', 'comisión', 'impuesto decreto', 'intereses', 'servicio administracion'],
}

function detectarCategoria(desc: string): string {
  const d = desc.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORIAS)) {
    if (keywords.some(kw => d.includes(kw))) return cat
  }
  return 'Otro'
}

function debeOmitir(linea: string): boolean {
  const l = linea.toLowerCase()
  return SKIP_KEYWORDS.some(kw => l.includes(kw))
}

function limpiarMonto(s: string): number {
  const clean = s.trim().replace(/\./g, '').replace(',', '.')
  return Math.abs(parseFloat(clean) || 0)
}

function limpiarDescripcion(texto: string): string {
  return texto
    .replace(/TASA\s+INT\.?\s*[\d,]+\s*%?/gi, '')
    .replace(/\b\d{8,}\b/g, '')
    .replace(/^\s*\d{4}\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[-·•|/]+|[-·•|/]+$/g, '')
    .trim()
}

function parsearCuota(texto: string): { actual: number; total: number } {
  const RE_CUOTA = /\b(\d{1,2})\/(\d{1,2})\b/g
  let m: RegExpExecArray | null
  while ((m = RE_CUOTA.exec(texto)) !== null) {
    const ca = parseInt(m[1])
    const ct = parseInt(m[2])
    if (ca >= 1 && ca <= ct && ct <= 120) return { actual: ca, total: ct }
  }
  return { actual: 1, total: 1 }
}

function formatFecha(dia: number, mes: number, anio: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

// ─── Parser BancoChile / Itaú ─────────────────────────────────────────────────
function parsearBcItau(texto: string): ParsedTransaction[] {
  const RE_FECHA = /\b(\d{2})\/(\d{2})\/(\d{2})\b/
  const RE_MONTO = /\$\s*-?\s*([\d.]+)/g
  const txs: ParsedTransaction[] = []

  for (const linea of texto.split('\n')) {
    const l = linea.trim()
    if (!l || debeOmitir(l)) continue

    const fm = RE_FECHA.exec(l)
    if (!fm) continue

    const dia = parseInt(fm[1])
    const mes = parseInt(fm[2])
    const anio = 2000 + parseInt(fm[3])

    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) continue

    const montos = [...l.matchAll(/\$\s*-?\s*([\d.]+)/g)].map(m => limpiarMonto(m[1]))
    if (montos.length === 0) continue

    const monto = montos[montos.length - 1]
    if (monto < 10) continue

    const resto = l.slice(fm.index + fm[0].length)
    const { actual, total } = parsearCuota(resto)

    const posPrimerMonto = l.indexOf('$', fm.index + fm[0].length)
    const descRaw = posPrimerMonto > 0 ? l.slice(fm.index + fm[0].length, posPrimerMonto) : resto
    const descripcion = limpiarDescripcion(descRaw)
    if (descripcion.length < 3) continue

    txs.push({
      fecha: formatFecha(dia, mes, anio),
      descripcion,
      monto,
      categoria: detectarCategoria(descripcion),
      cuota_actual: actual,
      total_cuotas: total,
    })
  }
  return txs
}

// ─── Parser CMR Falabella ─────────────────────────────────────────────────────
function parsearCmr(texto: string, esNicole = false): ParsedTransaction[] {
  const RE_FECHA = /\b(\d{2})\/(\d{2})\/(\d{4})\b/
  const RE_MONTO_PLANO = /(?<!\d)(\d{1,3}(?:\.\d{3})+)(?!\d)/g
  const RE_TARJETA = /\b(A2|A1|T)\b/
  const txs: ParsedTransaction[] = []

  for (const linea of texto.split('\n')) {
    const l = linea.trim()
    if (!l || l.includes('****') || debeOmitir(l)) continue

    const fm = RE_FECHA.exec(l)
    if (!fm) continue

    const dia = parseInt(fm[1])
    const mes = parseInt(fm[2])
    const anio = parseInt(fm[3])
    if (mes < 1 || mes > 12 || anio < 2000) continue

    const posAfterFecha = fm.index + fm[0].length
    const resto = l.slice(posAfterFecha)

    const marcadorM = RE_TARJETA.exec(resto)
    const marcador = marcadorM ? marcadorM[1] : null

    let montosStr = [...resto.matchAll(/(?<!\d)(\d{1,3}(?:\.\d{3})+)(?!\d)/g)].map(m => m[1])

    // Filtrar años del final
    while (montosStr.length > 0) {
      const val = parseInt(montosStr[montosStr.length - 1].replace(/\./g, ''))
      if (val >= 2000 && val <= 2099) montosStr = montosStr.slice(0, -1)
      else break
    }

    if (montosStr.length === 0) continue
    const monto = limpiarMonto(montosStr[montosStr.length - 1])
    if (monto < 100 || monto > 10_000_000) continue

    // Omitir compras futuras (cuota 00/N)
    if (/\b0+\/\d{1,2}\b/.test(resto)) continue

    const { actual, total } = parsearCuota(resto)

    const primerNumM = /(?<!\d)(\d{1,3}(?:\.\d{3})+)(?!\d)/.exec(resto)
    let descCandidate = primerNumM ? resto.slice(0, primerNumM.index) : resto
    descCandidate = descCandidate.replace(/^S\/I\s*/i, '').replace(/\s*\b(?:A2|A1|T)\b\s*/g, ' ')
    const descripcion = limpiarDescripcion(descCandidate)
    if (descripcion.length < 3) continue

    let persona: string | undefined
    if (esNicole) {
      persona = marcador === 'A2' ? 'Compartido' : 'Nicole'
    }

    txs.push({
      fecha: formatFecha(dia, mes, anio),
      descripcion,
      monto,
      categoria: detectarCategoria(descripcion),
      cuota_actual: actual,
      total_cuotas: total,
      persona,
    })
  }
  return txs
}

// ─── API pública ──────────────────────────────────────────────────────────────
export function detectarBanco(filename: string): BankType {
  const name = filename.toLowerCase()
  if (name.includes('cmr_nicole') || name.includes('cmr-nicole')) return 'cmr_nicole'
  if (name.includes('cmr_papa') || name.includes('cmr-papa')) return 'cmr_papa'
  if (name.includes('cmr')) return 'cmr_nicole'
  if (name.includes('itau') || name.includes('itaú')) return 'itau'
  if (name.includes('bancochile') || name.includes('banco_chile') || name.includes('bc_')) return 'bancochile'
  return 'unknown'
}

export function parsearCartola(texto: string, banco: BankType): ParsedTransaction[] {
  switch (banco) {
    case 'cmr_nicole': return parsearCmr(texto, true)
    case 'cmr_papa':   return parsearCmr(texto, false)
    case 'bancochile':
    case 'itau':       return parsearBcItau(texto)
    default:           return parsearBcItau(texto) // intento genérico
  }
}
