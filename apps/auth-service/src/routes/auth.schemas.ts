import { z } from 'zod'

const email = z.email('Informe um e-mail válido.').trim().toLowerCase()

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe a senha.'),
  remember: z.boolean().default(false),
})

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.'),
  email,
  cpf: z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'Informe um CPF válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

export const profileSchema = z
  .object({
    name: z.string().trim().min(3),
    phone: z.string().trim(),
    city: z.string().trim(),
  })
  .partial()
