import type {
  Event,
  EventCategory,
  EventStatus,
  Organizer,
  TicketBatch,
  Venue,
} from '@eventflow/shared/types'

import { addHours, daysFromNow } from './utils'

const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`

const VENUES = {
  centroEventos: {
    name: 'Centro de Eventos do Ceará',
    address: 'Av. Washington Soares, 999 — Edson Queiroz',
    city: 'Fortaleza',
    state: 'CE',
  },
  arenaCastelao: {
    name: 'Arena Castelão',
    address: 'Av. Alberto Craveiro, 2901 — Castelão',
    city: 'Fortaleza',
    state: 'CE',
  },
  dragaoMar: {
    name: 'Centro Dragão do Mar',
    address: 'R. Dragão do Mar, 81 — Praia de Iracema',
    city: 'Fortaleza',
    state: 'CE',
  },
  expoCenter: {
    name: 'Expo Center Norte',
    address: 'R. José Bernardo Pinto, 333 — Vila Guilherme',
    city: 'São Paulo',
    state: 'SP',
  },
  recifeCentro: {
    name: 'Centro de Convenções de Pernambuco',
    address: 'Av. Prof. Andrade Bezerra, s/n — Salgadinho',
    city: 'Recife',
    state: 'PE',
  },
  guaramiranga: {
    name: 'Teatro Rachel de Queiroz',
    address: 'R. Joaquim Alves Nogueira — Centro',
    city: 'Guaramiranga',
    state: 'CE',
  },
  caruaru: {
    name: 'Pátio do Forró',
    address: 'Av. Agamenon Magalhães — Centro',
    city: 'Caruaru',
    state: 'PE',
  },
  salvador: {
    name: 'Arena Fonte Nova',
    address: 'Ladeira da Fonte das Pedras — Nazaré',
    city: 'Salvador',
    state: 'BA',
  },
  natal: {
    name: 'Parque da Cidade',
    address: 'Av. Prudente de Morais, 7000 — Candelária',
    city: 'Natal',
    state: 'RN',
  },
  beiraMar: {
    name: 'Aterro da Praia de Iracema',
    address: 'Av. Beira Mar — Praia de Iracema',
    city: 'Fortaleza',
    state: 'CE',
  },
} satisfies Record<string, Venue>

const ORGANIZERS = {
  pulse: { name: 'Pulse Entretenimento', verified: true, eventsCount: 48 },
  nordesteTech: { name: 'Nordeste Tech Hub', verified: true, eventsCount: 17 },
  culturaViva: { name: 'Instituto Cultura Viva', verified: true, eventsCount: 32 },
  sabores: { name: 'Coletivo Sabores', verified: false, eventsCount: 6 },
  arena: { name: 'Arena Combat League', verified: true, eventsCount: 21 },
} satisfies Record<string, Organizer>

interface BatchSeed {
  name: string
  price: number
  quantity: number
  sold: number
  opens: number
  closes: number
  description?: string
}

interface EventSeed {
  id: string
  title: string
  summary: string
  description: string
  category: EventCategory
  inDays: number
  time: string
  durationHours: number
  venue: Venue
  image: string
  organizer: Organizer
  status?: EventStatus
  featured?: boolean
  tags: string[]
  batches: BatchSeed[]
}

const SEEDS: EventSeed[] = [
  {
    id: 'evt_rock-festival',
    title: 'Rock Festival 2026',
    summary: 'Três palcos, doze bandas e uma noite inteira de rock pesado à beira-mar.',
    description:
      'O Rock Festival volta a Fortaleza em sua maior edição. São três palcos simultâneos, doze bandas nacionais e internacionais e uma estrutura completa de alimentação, bares e área de descanso.\n\nOs portões abrem às 16h e a programação segue até a madrugada. A área VIP conta com open bar de água e refrigerante, banheiros exclusivos e vista privilegiada do palco principal.\n\nProibida a entrada de menores de 16 anos desacompanhados. Documento com foto obrigatório.',
    category: 'shows',
    inDays: 15,
    time: '20:00',
    durationHours: 7,
    venue: VENUES.centroEventos,
    image: '1501281668745-f7f57925c3b4',
    organizer: ORGANIZERS.pulse,
    featured: true,
    tags: ['rock', 'ao ar livre', '16+'],
    batches: [
      { name: 'Pista · Lote 1', price: 80, quantity: 1500, sold: 1100, opens: -60, closes: 14 },
      { name: 'Pista · Lote 2', price: 100, quantity: 1500, sold: 640, opens: -30, closes: 14 },
      {
        name: 'VIP',
        price: 130,
        quantity: 400,
        sold: 372,
        opens: -60,
        closes: 14,
        description: 'Área exclusiva e bar dedicado',
      },
    ],
  },
  {
    id: 'evt_tech-summit',
    title: 'Tech Summit Nordeste',
    summary:
      'Dois dias de palestras sobre IA, cloud e produto com quem constrói tecnologia no Brasil.',
    description:
      'O Tech Summit Nordeste reúne engenheiras, engenheiros, lideranças de produto e fundadores para dois dias de conteúdo técnico de alto nível.\n\nTrilhas de Inteligência Artificial, Cloud & Infraestrutura, Produto e Carreira, além de workshops práticos com vagas limitadas e uma área de networking com as principais empresas de tecnologia da região.\n\nO ingresso dá acesso aos dois dias de evento, coffee breaks e certificado de participação.',
    category: 'tecnologia',
    inDays: 22,
    time: '09:00',
    durationHours: 33,
    venue: VENUES.centroEventos,
    image: '1540575467063-178a50c2df87',
    organizer: ORGANIZERS.nordesteTech,
    featured: true,
    tags: ['ia', 'cloud', 'networking'],
    batches: [
      { name: 'Early Bird', price: 149, quantity: 300, sold: 300, opens: -90, closes: -30 },
      { name: 'Regular', price: 219, quantity: 900, sold: 512, opens: -30, closes: 21 },
      {
        name: 'Estudante',
        price: 99,
        quantity: 200,
        sold: 163,
        opens: -30,
        closes: 21,
        description: 'Mediante comprovante de matrícula',
      },
    ],
  },
  {
    id: 'evt_festival-jazz',
    title: 'Festival de Jazz & Blues',
    summary: 'A serra de Guaramiranga recebe o melhor do jazz instrumental em um fim de semana.',
    description:
      'Tradicional no calendário cultural do Ceará, o Festival de Jazz & Blues transforma Guaramiranga em um grande palco a céu aberto.\n\nA programação conta com concertos no teatro, jam sessions nas praças e oficinas de improvisação para músicos. Um fim de semana para desacelerar, ouvir boa música e aproveitar o clima da serra.',
    category: 'festivais',
    inDays: 30,
    time: '19:30',
    durationHours: 4,
    venue: VENUES.guaramiranga,
    image: '1415201364774-f6f0bb35f28f',
    organizer: ORGANIZERS.culturaViva,
    featured: true,
    tags: ['jazz', 'serra', 'instrumental'],
    batches: [
      { name: 'Plateia', price: 60, quantity: 350, sold: 142, opens: -20, closes: 29 },
      { name: 'Passaporte 3 dias', price: 150, quantity: 120, sold: 58, opens: -20, closes: 29 },
    ],
  },
  {
    id: 'evt_sao-joao',
    title: 'São João Experience',
    summary: 'Forró pé de serra, quadrilhas e comidas típicas no coração do Agreste.',
    description:
      'O São João Experience leva a energia das festas juninas para uma edição especial de primavera. Trios de forró pé de serra, apresentações de quadrilhas juninas e uma vila gastronômica com o melhor da culinária nordestina.\n\nO camarote inclui buffet típico, bebidas e área coberta com vista para o palco principal.',
    category: 'festivais',
    inDays: 41,
    time: '18:00',
    durationHours: 8,
    venue: VENUES.caruaru,
    image: '1533174072545-7a4b6ad7a6c3',
    organizer: ORGANIZERS.pulse,
    tags: ['forró', 'nordeste', 'família'],
    batches: [
      { name: 'Arena', price: 45, quantity: 5000, sold: 1820, opens: -15, closes: 40 },
      { name: 'Camarote', price: 180, quantity: 600, sold: 211, opens: -15, closes: 40 },
    ],
  },
  {
    id: 'evt_startup-conference',
    title: 'Startup Conference 2026',
    summary: 'Pitches, investidores e fundadores reunidos para discutir o futuro das startups.',
    description:
      'A Startup Conference conecta empreendedores em estágio inicial a investidores-anjo, fundos de venture capital e aceleradoras.\n\nAo longo do dia, acontecem painéis sobre captação, growth e cultura, além da final do Pitch Day com premiação de R$ 100 mil para a startup vencedora.',
    category: 'tecnologia',
    inDays: 12,
    time: '08:30',
    durationHours: 10,
    venue: VENUES.recifeCentro,
    image: '1505373877841-8d25f7d46678',
    organizer: ORGANIZERS.nordesteTech,
    tags: ['startups', 'venture capital', 'pitch'],
    batches: [
      { name: 'Participante', price: 189, quantity: 700, sold: 655, opens: -45, closes: 11 },
      {
        name: 'Founder Pass',
        price: 390,
        quantity: 80,
        sold: 44,
        opens: -45,
        closes: 11,
        description: 'Inclui mentorias e jantar com investidores',
      },
    ],
  },
  {
    id: 'evt_arena-fight',
    title: 'Arena Fight Championship',
    summary: 'Card completo com disputa de cinturão peso-leve e as maiores promessas do MMA.',
    description:
      'A Arena Fight Championship chega a Salvador com um card de 11 lutas, incluindo a disputa do cinturão peso-leve.\n\nAbertura dos portões às 17h, card preliminar às 18h e card principal a partir das 21h. Os ingressos Cage Side ficam a poucos metros do octógono.',
    category: 'esportes',
    inDays: 19,
    time: '18:00',
    durationHours: 6,
    venue: VENUES.salvador,
    image: '1549719386-74dfcbf7dbed',
    organizer: ORGANIZERS.arena,
    featured: true,
    tags: ['mma', 'luta', 'cinturão'],
    batches: [
      { name: 'Arquibancada', price: 90, quantity: 6000, sold: 3410, opens: -40, closes: 18 },
      { name: 'Cadeira Superior', price: 160, quantity: 2000, sold: 1120, opens: -40, closes: 18 },
      { name: 'Cage Side', price: 650, quantity: 120, sold: 113, opens: -40, closes: 18 },
    ],
  },
  {
    id: 'evt_food-music',
    title: 'Food & Music',
    summary: 'Food trucks, chefs convidados e shows ao vivo em um domingo de sol.',
    description:
      'O Food & Music reúne mais de 30 food trucks, chefs convidados e uma programação musical que vai do samba ao pop.\n\nO ingresso dá acesso à área do evento; os pratos são vendidos separadamente. Área kids, espaço pet friendly e estacionamento no local.',
    category: 'gastronomia',
    inDays: 8,
    time: '12:00',
    durationHours: 9,
    venue: VENUES.natal,
    image: '1414235077428-338989a2e8c0',
    organizer: ORGANIZERS.sabores,
    featured: true,
    tags: ['food trucks', 'pet friendly', 'família'],
    batches: [
      { name: 'Entrada', price: 35, quantity: 3000, sold: 1240, opens: -25, closes: 8 },
      {
        name: 'Experiência Chef',
        price: 220,
        quantity: 60,
        sold: 57,
        opens: -25,
        closes: 8,
        description: 'Menu degustação de 5 tempos',
      },
    ],
  },
  {
    id: 'evt_cinema-open-air',
    title: 'Cinema Open Air',
    summary: 'Clássicos do cinema na tela gigante, sob as estrelas, com trilha ao vivo.',
    description:
      'O Cinema Open Air transforma a praça do Dragão do Mar em uma grande sala de cinema ao ar livre. Nesta edição, clássicos do cinema brasileiro são exibidos em tela de 20 metros, com trilha sonora executada ao vivo por uma orquestra de câmara.\n\nLeve sua canga ou reserve uma espreguiçadeira. Pipoca e bebidas à venda no local.',
    category: 'cultura',
    inDays: 5,
    time: '19:00',
    durationHours: 3,
    venue: VENUES.dragaoMar,
    image: '1478720568477-152d9b164e26',
    organizer: ORGANIZERS.culturaViva,
    tags: ['cinema', 'ao ar livre', 'orquestra'],
    batches: [
      { name: 'Gramado', price: 30, quantity: 800, sold: 412, opens: -20, closes: 5 },
      { name: 'Espreguiçadeira', price: 70, quantity: 150, sold: 139, opens: -20, closes: 5 },
    ],
  },
  {
    id: 'evt_maratona',
    title: 'Maratona Beira-Mar',
    summary: 'Percursos de 5, 10, 21 e 42 km pela orla mais bonita de Fortaleza.',
    description:
      'A Maratona Beira-Mar oferece percursos de 5 km, 10 km, meia maratona e maratona completa, todos com largada e chegada no Aterro da Praia de Iracema.\n\nKit do atleta com camiseta técnica, número de peito com chip e medalha de participação. Retirada de kits nos dois dias anteriores à prova.',
    category: 'esportes',
    inDays: 50,
    time: '05:00',
    durationHours: 6,
    venue: VENUES.beiraMar,
    image: '1452626038306-9aae5e071dd3',
    organizer: ORGANIZERS.arena,
    tags: ['corrida', 'kit atleta', 'orla'],
    batches: [
      { name: '5 km / 10 km', price: 110, quantity: 3000, sold: 980, opens: -10, closes: 45 },
      { name: '21 km / 42 km', price: 160, quantity: 1500, sold: 402, opens: -10, closes: 45 },
    ],
  },
  {
    id: 'evt_sinfonica',
    title: 'Orquestra Sinfônica: Trilhas de Cinema',
    summary: 'Das galáxias distantes aos castelos mágicos — as trilhas que marcaram gerações.',
    description:
      'Com 70 músicos em cena, a Orquestra Sinfônica apresenta um repertório dedicado às trilhas sonoras mais emblemáticas da história do cinema.\n\nUm espetáculo com projeções sincronizadas e regência convidada. Classificação livre.',
    category: 'cultura',
    inDays: 26,
    time: '20:30',
    durationHours: 2,
    venue: VENUES.expoCenter,
    image: '1465847899084-d164df4dedc6',
    organizer: ORGANIZERS.culturaViva,
    tags: ['música clássica', 'cinema', 'livre'],
    batches: [
      { name: 'Plateia B', price: 120, quantity: 900, sold: 488, opens: -30, closes: 26 },
      { name: 'Plateia A', price: 240, quantity: 400, sold: 306, opens: -30, closes: 26 },
    ],
  },
  {
    id: 'evt_sabores-ceara',
    title: 'Festival Sabores do Ceará',
    summary: 'Aulas-show, degustações e o melhor da cozinha cearense contemporânea.',
    description:
      'Chefs do estado se reúnem para celebrar a gastronomia cearense em aulas-show, harmonizações e um mercado de produtores locais.\n\nO passaporte inclui 6 degustações e acesso a todas as aulas-show do dia.',
    category: 'gastronomia',
    inDays: 34,
    time: '11:00',
    durationHours: 10,
    venue: VENUES.dragaoMar,
    image: '1555939594-58d7cb561ad1',
    organizer: ORGANIZERS.sabores,
    tags: ['culinária', 'degustação', 'produtores locais'],
    batches: [{ name: 'Passaporte', price: 95, quantity: 1200, sold: 318, opens: -12, closes: 33 }],
  },
  {
    id: 'evt_luna-rios',
    title: 'Luna Rios — Turnê Horizonte',
    summary: 'A cantora apresenta o novo álbum em um show intimista com banda completa.',
    description:
      'Depois de esgotar teatros em todo o país, Luna Rios traz a Turnê Horizonte para o Rio de Janeiro com repertório do novo álbum e sucessos da carreira.\n\nShow com duração aproximada de 1h40. Classificação: 14 anos.',
    category: 'shows',
    inDays: 64,
    time: '21:00',
    durationHours: 2,
    venue: {
      name: 'Vivo Rio',
      address: 'Av. Infante Dom Henrique, 85 — Parque do Flamengo',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    image: '1470229722913-7c0e2dbbafd3',
    organizer: ORGANIZERS.pulse,
    featured: true,
    tags: ['mpb', 'pop', '14+'],
    batches: [
      { name: 'Pista', price: 140, quantity: 2000, sold: 610, opens: -5, closes: 63 },
      { name: 'Mesa (4 pessoas)', price: 780, quantity: 90, sold: 31, opens: -5, closes: 63 },
      { name: 'Pista · Lote 2', price: 170, quantity: 1500, sold: 0, opens: 20, closes: 63 },
    ],
  },
  {
    id: 'evt_devops-day',
    title: 'DevOps Day 2027',
    summary: 'Observabilidade, plataformas internas e cultura DevOps na prática.',
    description:
      'Um dia inteiro dedicado a práticas de engenharia de plataforma, SRE e observabilidade, com cases de empresas brasileiras.',
    category: 'tecnologia',
    inDays: 110,
    time: '09:00',
    durationHours: 9,
    venue: VENUES.centroEventos,
    image: '1531482615713-2afd69097998',
    organizer: ORGANIZERS.nordesteTech,
    status: 'draft',
    tags: ['devops', 'sre', 'plataforma'],
    batches: [{ name: 'Lote 1', price: 129, quantity: 500, sold: 0, opens: 30, closes: 100 }],
  },
  {
    id: 'evt_summer-beats',
    title: 'Summer Beats 2026',
    summary: 'O festival de música eletrônica que abriu a temporada de verão.',
    description:
      'Doze horas de música eletrônica com DJs nacionais e internacionais em dois palcos.',
    category: 'festivais',
    inDays: -40,
    time: '16:00',
    durationHours: 12,
    venue: VENUES.beiraMar,
    image: '1492684223066-81342ee5ff30',
    organizer: ORGANIZERS.pulse,
    status: 'finished',
    tags: ['eletrônica', 'praia'],
    batches: [
      { name: 'Pista', price: 120, quantity: 4000, sold: 3920, opens: -120, closes: -41 },
      { name: 'Backstage', price: 380, quantity: 300, sold: 300, opens: -120, closes: -41 },
    ],
  },
  {
    id: 'evt_hackathon',
    title: 'Hackathon Cidade Inteligente',
    summary: '48 horas para criar soluções de mobilidade urbana com dados abertos.',
    description: 'Maratona de programação com mentorias, premiação e dados abertos da prefeitura.',
    category: 'tecnologia',
    inDays: -18,
    time: '18:00',
    durationHours: 48,
    venue: VENUES.dragaoMar,
    image: '1504384308090-c894fdcc538d',
    organizer: ORGANIZERS.nordesteTech,
    status: 'finished',
    tags: ['hackathon', 'dados abertos'],
    batches: [
      { name: 'Participante', price: 40, quantity: 250, sold: 238, opens: -60, closes: -19 },
    ],
  },
]

function toBatch(eventId: string, seed: BatchSeed, index: number): TicketBatch {
  return {
    id: `${eventId}_b${index + 1}`,
    name: seed.name,
    description: seed.description,
    price: seed.price,
    quantity: seed.quantity,
    sold: seed.sold,
    startsAt: daysFromNow(seed.opens, '00:00'),
    endsAt: daysFromNow(seed.closes, '23:59'),
  }
}

export function createMockEvents(): Event[] {
  return SEEDS.map((seed, index) => {
    const startsAt = daysFromNow(seed.inDays, seed.time)
    return {
      id: seed.id,
      title: seed.title,
      summary: seed.summary,
      description: seed.description,
      category: seed.category,
      startsAt,
      endsAt: addHours(startsAt, seed.durationHours),
      venue: seed.venue,
      bannerUrl: unsplash(seed.image),
      organizer: seed.organizer,
      batches: seed.batches.map((batch, index) => toBatch(seed.id, batch, index)),
      status: seed.status ?? 'published',
      featured: seed.featured ?? false,
      tags: seed.tags,
      createdAt: daysFromNow(Math.min(seed.inDays, 0) - 4 - ((index * 7) % 45), '10:00'),
      updatedAt: daysFromNow(-3, '15:20'),
    }
  })
}
