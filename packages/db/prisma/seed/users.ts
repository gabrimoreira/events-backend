import type { User } from '@eventflow/shared/types'

import { DEMO_CREDENTIALS, daysFromNow } from './utils'

export function createMockUsers(): User[] {
  const base = (id: string, name: string, email: string, cpf: string, city: string): User => ({
    id,
    name,
    email,
    cpf,
    city,
    role: 'customer',
    createdAt: daysFromNow(-200, '10:00'),
  })

  return [
    {
      ...base(
        'usr_ana',
        'Ana Beatriz Souza',
        DEMO_CREDENTIALS.customer.email,
        '529.982.247-25',
        'Fortaleza, CE',
      ),
      phone: '(85) 99812-4410',
    },
    {
      ...base(
        'usr_admin',
        'Rafael Lima',
        DEMO_CREDENTIALS.admin.email,
        '111.444.777-35',
        'Fortaleza, CE',
      ),
      role: 'admin',
    },
    base('usr_bruno', 'Bruno Carvalho', 'bruno.carvalho@email.com', '390.533.447-05', 'Recife, PE'),
    base('usr_camila', 'Camila Ferreira', 'camila.f@email.com', '153.509.460-56', 'São Paulo, SP'),
    base(
      'usr_diego',
      'Diego Martins',
      'diego.martins@email.com',
      '713.214.380-60',
      'Fortaleza, CE',
    ),
    base('usr_elisa', 'Elisa Rocha', 'elisa.rocha@email.com', '861.297.320-06', 'Natal, RN'),
    base(
      'usr_felipe',
      'Felipe Andrade',
      'felipe.andrade@email.com',
      '254.380.630-91',
      'Salvador, BA',
    ),
    base(
      'usr_gabriela',
      'Gabriela Nunes',
      'gabi.nunes@email.com',
      '477.108.120-38',
      'Fortaleza, CE',
    ),
    base(
      'usr_henrique',
      'Henrique Alves',
      'henrique.a@email.com',
      '036.529.610-80',
      'Rio de Janeiro, RJ',
    ),
    base(
      'usr_isabela',
      'Isabela Costa',
      'isabela.costa@email.com',
      '698.217.050-04',
      'Fortaleza, CE',
    ),
    base('usr_joao', 'João Pedro Ribeiro', 'joaopedro@email.com', '325.817.400-10', 'Recife, PE'),
    base(
      'usr_larissa',
      'Larissa Mendes',
      'larissa.mendes@email.com',
      '845.093.770-22',
      'São Paulo, SP',
    ),
  ]
}
