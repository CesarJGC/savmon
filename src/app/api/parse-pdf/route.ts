import { NextRequest, NextResponse } from 'next/server'
import { detectarBanco, parsearCartola } from '@/lib/cartola-parser'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Solo se aceptan archivos PDF' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const data = await pdfParse(buffer)
    const texto: string = data.text

    const banco = detectarBanco(file.name)
    const transacciones = parsearCartola(texto, banco)

    return NextResponse.json({ transacciones, banco, total: transacciones.length })
  } catch (err) {
    console.error('Error parseando PDF:', err)
    return NextResponse.json({ error: 'Error procesando el PDF' }, { status: 500 })
  }
}
