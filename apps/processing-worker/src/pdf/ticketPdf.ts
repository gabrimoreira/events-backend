import type { EventCategory } from '@eventflow/shared/types'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import sharp from 'sharp'

const COLOR = {
  primary: '#6d5dfb',
  primaryDark: '#5848e8',
  primaryLight: '#8b7fff',
  primary50: '#f3f1ff',
  ink: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  page: '#f4f5fb',
  white: '#ffffff',
  success: '#15803d',
  successBg: '#dcfce7',
} as const

const CATEGORY_LABEL: Record<EventCategory, string> = {
  shows: 'Shows',
  festivais: 'Festivais',
  esportes: 'Esportes',
  tecnologia: 'Tecnologia',
  cultura: 'Cultura',
  gastronomia: 'Gastronomia',
}

const INSTRUCTIONS = [
  'Apresente o QR code na entrada — no celular ou impresso.',
  'Leve um documento oficial com foto do titular.',
  'O QR code é único e só pode ser utilizado uma vez.',
  'Chegue com antecedência para evitar filas.',
]

const SUPPORT_EMAIL = 'suporte@eventflow.com.br'
const TIME_ZONE = 'America/Sao_Paulo'

const LOGO_TICKET_PATH =
  'M9 11.5A2.5 2.5 0 0 1 11.5 9h9A2.5 2.5 0 0 1 23 11.5v2a2.5 2.5 0 0 0 0 5v2a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 9 20.5v-2a2.5 2.5 0 0 0 0-5z'

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: TIME_ZONE, ...options })
const formatDay = fmt({ day: '2-digit', month: 'long', year: 'numeric' })
const formatWeekday = fmt({ weekday: 'long' })
const formatTime = fmt({ hour: '2-digit', minute: '2-digit' })
const formatDateTime = fmt({ dateStyle: 'short', timeStyle: 'short' })
const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export interface TicketPdfData {
  id: string
  code: string
  holderName: string
  holderEmail: string
  price: number
  batchName: string
  orderNumber: number
  issuedAt: Date
  event: {
    title: string
    category: EventCategory
    startsAt: Date
    venueName: string
    venueAddress: string
    venueCity: string
    venueState: string
  }
  banner?: Buffer
}

const PAGE = { width: 595.28, height: 841.89 }
const MARGIN = 40
const CARD = { x: MARGIN, y: 92, width: PAGE.width - MARGIN * 2, radius: 16 }
const BANNER_HEIGHT = 200
const PAD = 26

export async function prepareBanner(url: string | undefined): Promise<Buffer | undefined> {
  if (!url?.startsWith('http')) return undefined
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) })
    if (!response.ok) return undefined
    const source = Buffer.from(await response.arrayBuffer())
    return await sharp(source)
      .resize(Math.round(CARD.width * 3), BANNER_HEIGHT * 3, {
        fit: 'cover',
        position: 'attention',
      })
      .jpeg({ quality: 82 })
      .toBuffer()
  } catch {
    return undefined
  }
}

type Doc = PDFKit.PDFDocument

function label(doc: Doc, text: string, x: number, y: number, width?: number) {
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(COLOR.muted)
    .text(text.toUpperCase(), x, y, { width, characterSpacing: 1.1, lineBreak: false })
}

function value(doc: Doc, text: string, x: number, y: number, width: number, size = 11.5) {
  doc
    .font('Helvetica-Bold')
    .fontSize(size)
    .fillColor(COLOR.ink)
    .text(text, x, y, { width, height: size * 1.3, ellipsis: true, lineBreak: false })
}

function hint(doc: Doc, text: string, x: number, y: number, width: number) {
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLOR.muted)
    .text(text, x, y, { width, height: 12, ellipsis: true, lineBreak: false })
}

function pill(doc: Doc, text: string, x: number, y: number, fg: string, bg: string, opacity = 1) {
  doc.font('Helvetica-Bold').fontSize(7.5)
  const width = doc.widthOfString(text, { characterSpacing: 1 }) + 18
  doc.save().fillOpacity(opacity).roundedRect(x, y, width, 18, 9).fill(bg).restore()
  doc.fillColor(fg).text(text, x + 9, y + 5.5, { characterSpacing: 1, lineBreak: false })
  return width
}

function drawLogo(doc: Doc, x: number, y: number, size: number) {
  doc.roundedRect(x, y, size, size, size * 0.28).fill(COLOR.primary)
  doc
    .save()
    .translate(x, y)
    .scale(size / 32)
  doc.path(LOGO_TICKET_PATH).fill(COLOR.white)
  doc.moveTo(14, 16).lineTo(18, 16).lineWidth(2).lineCap('round').stroke(COLOR.primary)
  doc.restore()
}

function drawHeader(doc: Doc, ticket: TicketPdfData) {
  drawLogo(doc, MARGIN, 38, 30)
  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(COLOR.ink)
    .text('EventFlow', MARGIN + 40, 44, { lineBreak: false })

  const right = { x: PAGE.width - MARGIN - 220, width: 220 }
  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(COLOR.muted)
    .text('INGRESSO ELETRÔNICO', right.x, 40, {
      width: right.width,
      align: 'right',
      characterSpacing: 1.1,
    })
  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(COLOR.ink)
    .text(`Pedido EF-${ticket.orderNumber}`, right.x, 53, { width: right.width, align: 'right' })
}

function drawBanner(doc: Doc, ticket: TicketPdfData) {
  const { x, y, width, radius } = CARD
  doc.save()
  doc.roundedRect(x, y, width, BANNER_HEIGHT + radius, radius).clip()

  if (ticket.banner) {
    doc.image(ticket.banner, x, y, { width, height: BANNER_HEIGHT })
    const shade = doc.linearGradient(0, y, 0, y + BANNER_HEIGHT)
    shade.stop(0, COLOR.ink, 0.05).stop(0.45, COLOR.ink, 0.25).stop(1, COLOR.ink, 0.88)
    doc.rect(x, y, width, BANNER_HEIGHT).fill(shade)
  } else {
    const gradient = doc.linearGradient(x, y, x + width, y + BANNER_HEIGHT)
    gradient.stop(0, COLOR.primaryDark).stop(1, COLOR.primaryLight)
    doc.rect(x, y, width, BANNER_HEIGHT).fill(gradient)
    doc.save().fillOpacity(0.12)
    doc.circle(x + width - 60, y + 30, 110).fill(COLOR.white)
    doc.circle(x + width - 10, y + BANNER_HEIGHT, 70).fill(COLOR.white)
    doc.restore()
  }
  doc.restore()

  const category = CATEGORY_LABEL[ticket.event.category].toUpperCase()
  pill(doc, category, x + PAD, y + PAD - 4, COLOR.white, COLOR.white, 0.22)

  const titleWidth = width - PAD * 2
  doc.font('Helvetica-Bold').fontSize(24)
  const titleHeight = Math.min(doc.heightOfString(ticket.event.title, { width: titleWidth }), 60)
  doc
    .fillColor(COLOR.white)
    .text(ticket.event.title, x + PAD, y + BANNER_HEIGHT - PAD - titleHeight, {
      width: titleWidth,
      height: 60,
      ellipsis: true,
    })
}

function drawDetails(doc: Doc, ticket: TicketPdfData, top: number): number {
  const { event } = ticket
  const x = CARD.x + PAD
  const inner = CARD.width - PAD * 2
  const col = inner / 3

  label(doc, 'Data', x, top)
  value(doc, formatDay.format(event.startsAt), x, top + 13, col - 12)
  hint(doc, capitalize(formatWeekday.format(event.startsAt)), x, top + 30, col - 12)

  label(doc, 'Horário', x + col, top)
  value(doc, formatTime.format(event.startsAt), x + col, top + 13, col - 12)
  hint(doc, 'Horário de Brasília', x + col, top + 30, col - 12)

  label(doc, 'Setor / lote', x + col * 2, top)
  value(doc, ticket.batchName, x + col * 2, top + 13, col)
  hint(doc, formatPrice(ticket.price), x + col * 2, top + 30, col)

  const row2 = top + 58
  label(doc, 'Local', x, row2)
  value(doc, event.venueName, x, row2 + 13, inner)
  hint(doc, `${event.venueAddress} · ${event.venueCity}, ${event.venueState}`, x, row2 + 30, inner)

  return row2 + 46
}

function drawPerforation(doc: Doc, y: number) {
  const notch = 13
  doc.circle(CARD.x, y, notch).fill(COLOR.page)
  doc.circle(CARD.x + CARD.width, y, notch).fill(COLOR.page)
  doc
    .moveTo(CARD.x + notch + 8, y)
    .lineTo(CARD.x + CARD.width - notch - 8, y)
    .lineWidth(1.2)
    .dash(5, { space: 4 })
    .stroke(COLOR.border)
    .undash()
}

async function drawStub(doc: Doc, ticket: TicketPdfData, top: number): Promise<number> {
  const qrSize = 150
  const boxPad = 10
  const x = CARD.x + PAD

  const qr = await QRCode.toBuffer(ticket.code, {
    width: qrSize * 4,
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: COLOR.ink, light: COLOR.white },
  })
  doc
    .roundedRect(x, top, qrSize + boxPad * 2, qrSize + boxPad * 2, 12)
    .lineWidth(1)
    .stroke(COLOR.border)
  doc.image(qr, x + boxPad, top + boxPad, { width: qrSize, height: qrSize })
  doc
    .font('Courier-Bold')
    .fontSize(13)
    .fillColor(COLOR.ink)
    .text(ticket.code, x, top + qrSize + boxPad * 2 + 10, {
      width: qrSize + boxPad * 2,
      align: 'center',
      characterSpacing: 1,
    })

  const infoX = x + qrSize + boxPad * 2 + 30
  const infoWidth = CARD.x + CARD.width - PAD - infoX

  pill(doc, 'INGRESSO VÁLIDO', infoX, top, COLOR.success, COLOR.successBg)

  label(doc, 'Titular', infoX, top + 34)
  value(doc, ticket.holderName, infoX, top + 47, infoWidth, 15)
  hint(doc, ticket.holderEmail, infoX, top + 67, infoWidth)

  const half = infoWidth / 2
  const row = top + 96
  label(doc, 'Pedido', infoX, row)
  value(doc, `EF-${ticket.orderNumber}`, infoX, row + 13, half - 10)
  label(doc, 'Emitido em', infoX + half, row)
  value(doc, formatDateTime.format(ticket.issuedAt), infoX + half, row + 13, half)

  label(doc, 'ID do ingresso', infoX, row + 44)
  doc
    .font('Courier')
    .fontSize(9.5)
    .fillColor(COLOR.muted)
    .text(ticket.id, infoX, row + 57, { width: infoWidth, lineBreak: false })

  return top + qrSize + boxPad * 2 + 34
}

function drawInstructions(doc: Doc, top: number) {
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(COLOR.ink)
    .text('Antes de ir', MARGIN, top, { lineBreak: false })

  const colWidth = (CARD.width - 20) / 2
  INSTRUCTIONS.forEach((text, index) => {
    const x = MARGIN + (index % 2) * (colWidth + 20)
    const y = top + 22 + Math.floor(index / 2) * 30
    doc.circle(x + 8, y + 7, 8).fill(COLOR.primary50)
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLOR.primary)
      .text(String(index + 1), x, y + 3.5, { width: 16, align: 'center', lineBreak: false })
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR.muted)
      .text(text, x + 24, y + 2, { width: colWidth - 24 })
  })
}

function drawFooter(doc: Doc, ticket: TicketPdfData) {
  const y = PAGE.height - 52
  doc
    .moveTo(MARGIN, y)
    .lineTo(PAGE.width - MARGIN, y)
    .lineWidth(0.8)
    .stroke(COLOR.border)
  const text = { width: CARD.width / 2, lineBreak: false } as const
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLOR.muted)
    .text(`EventFlow · ${SUPPORT_EMAIL}`, MARGIN, y + 12, text)
  doc.text(`Ingresso pessoal e intransferível · ${ticket.code}`, MARGIN + CARD.width / 2, y + 12, {
    ...text,
    align: 'right',
  })
}

export async function renderTicketPdf(ticket: TicketPdfData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    info: {
      Title: `Ingresso ${ticket.code} — ${ticket.event.title}`,
      Author: 'EventFlow',
      Subject: 'Ingresso eletrônico',
    },
  })
  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  doc.rect(0, 0, PAGE.width, PAGE.height).fill(COLOR.page)
  drawHeader(doc, ticket)

  const detailsTop = CARD.y + BANNER_HEIGHT + 24
  const perforationY = detailsTop + 128
  const stubTop = perforationY + 26
  const cardBottom = stubTop + 214
  doc
    .roundedRect(CARD.x, CARD.y + 3, CARD.width, cardBottom - CARD.y, CARD.radius)
    .fill(COLOR.border)
  doc.roundedRect(CARD.x, CARD.y, CARD.width, cardBottom - CARD.y, CARD.radius).fill(COLOR.white)

  drawBanner(doc, ticket)
  drawDetails(doc, ticket, detailsTop)
  drawPerforation(doc, perforationY)
  await drawStub(doc, ticket, stubTop)
  drawInstructions(doc, cardBottom + 30)
  drawFooter(doc, ticket)

  doc.end()
  return done
}
