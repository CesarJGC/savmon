import { NextRequest, NextResponse } from 'next/server'
import { detectarBanco, parsearCartola } from '@/lib/cartola-parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const uint8 = new Uint8Array(buffer)
  const doc = await pdfjsLib.getDocument({
    data: uint8,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  let text = ''
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    text += pageText + '\n'
  }
  return text
}

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
    const texto = await extractTextFromPDF(buffer)

    const banco = detectarBanco(file.name)
    const transacciones = parsearCartola(texto, banco)

    return NextResponse.json({ transacciones, banco, total: transacciones.length })
  } catch (err) {
    console.error('Error parseando PDF:', err)
    return NextResponse.json({ error: 'Error procesando el PDF' }, { status: 500 })
  }
}
