import { NextRequest, NextResponse } from 'next/server'
import { detectarBanco, parsearCartola } from '@/lib/cartola-parser'
import { extractText } from 'unpdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
    const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })

    const banco = detectarBanco(file.name)
    const transacciones = parsearCartola(text, banco)

    return NextResponse.json({ transacciones, banco, total: transacciones.length })
  } catch (err) {
    console.error('Error parseando PDF:', err)
    return NextResponse.json({ error: 'Error procesando el PDF' }, { status: 500 })
  }
}
