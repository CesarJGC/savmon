import { NextRequest, NextResponse } from 'next/server'
import { detectarBanco, parsearCartola, BankType } from '@/lib/cartola-parser'
import { extractText } from 'unpdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const VALID_BANCO_VALUES: BankType[] = ['bancochile', 'itau', 'cmr_nicole', 'cmr_papa', 'unknown']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'El archivo supera el límite de 10 MB' }, { status: 400 })
    }

    // Validar extensión y MIME type
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()

    // Validar magic bytes PDF (%PDF-)
    const header = new Uint8Array(arrayBuffer.slice(0, 5))
    const isPDF = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2D
    if (!isPDF) {
      return NextResponse.json({ error: 'El archivo no es un PDF válido' }, { status: 400 })
    }

    const result = await extractText(new Uint8Array(arrayBuffer), { mergePages: false })
    const text = (result.text as string[]).join('\n')

    // Validar y sanitizar parámetro banco
    const bancoParam = formData.get('banco') as string | null
    const banco: BankType = (bancoParam && VALID_BANCO_VALUES.includes(bancoParam as BankType))
      ? bancoParam as BankType
      : detectarBanco(file.name)

    const transacciones = parsearCartola(text, banco)

    return NextResponse.json({ transacciones, banco, total: transacciones.length })
  } catch (err) {
    console.error('Error parseando PDF:', err)
    return NextResponse.json({ error: 'Error procesando el PDF' }, { status: 500 })
  }
}
