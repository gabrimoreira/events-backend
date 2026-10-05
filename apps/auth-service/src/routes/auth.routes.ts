import { type AuthOptions, currentUser, parseWith, requireAuth } from '@eventflow/shared/http'
import { Router } from 'express'

import type { AuthService } from '@/services/contracts'

import { loginSchema, profileSchema, registerSchema } from './auth.schemas'

export function authRoutes(service: AuthService, auth: AuthOptions): Router {
  const router = Router()
  const authenticated = requireAuth(auth)

  router.post('/auth/login', async (req, res) => {
    res.json(await service.login(parseWith(loginSchema, req.body)))
  })

  router.post('/auth/register', async (req, res) => {
    res.status(201).json(await service.register(parseWith(registerSchema, req.body)))
  })

  router.get('/auth/me', authenticated, async (req, res) => {
    res.json(await service.getCurrentUser(currentUser(req)))
  })

  router.patch('/auth/me', authenticated, async (req, res) => {
    res.json(await service.updateProfile(currentUser(req), parseWith(profileSchema, req.body)))
  })

  router.post('/auth/logout', authenticated, async (req, res) => {
    await service.logout(currentUser(req))
    res.status(204).end()
  })

  return router
}
