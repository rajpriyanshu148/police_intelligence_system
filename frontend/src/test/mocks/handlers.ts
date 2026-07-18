import { http, HttpResponse } from 'msw'

const API_BASE = 'http://localhost:8000/api/v1'

export const mockOfficer = {
  id: 'test-officer-id-001',
  username: 'officer_test',
  email: 'officer@aipas.test',
  badge_number: 'BADGE-001',
  role: 'ADMIN' as const,
  department: 'Homicide',
  status: 'Active',
}

const makeOk = (data: unknown, message = 'OK') => ({
  success: true,
  message,
  data,
})

export const handlers = [
  // ── Auth ──────────────────────────────────────────────────────────────────
  http.post(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json(
      makeOk({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        officer: mockOfficer,
      }, 'Logged in successfully.')
    )
  }),

  http.get(`${API_BASE}/auth/me`, () => {
    return HttpResponse.json(makeOk(mockOfficer, 'Profile retrieved.'))
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json(makeOk(null, 'Logged out.'))
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json(makeOk({
      access_token: 'refreshed-access-token',
      refresh_token: 'refreshed-refresh-token',
    }))
  }),

  // ── Cases ─────────────────────────────────────────────────────────────────
  http.get(`${API_BASE}/cases`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Cases retrieved.',
      data: [],
      pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
    })
  }),

  http.get(`${API_BASE}/cases/:id`, ({ params }) => {
    return HttpResponse.json(makeOk({
      id: params.id,
      case_number: 'CASE-001',
      title: 'Test Case',
      category: 'Criminal',
      status: 'Under Investigation',
      severity: 'High',
      priority: 'P2',
      complaint_id: 'test-complaint-id',
      opened_at: new Date().toISOString(),
    }))
  }),

  // ── Complaints ────────────────────────────────────────────────────────────
  http.get(`${API_BASE}/complaints`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Complaints retrieved.',
      data: [],
      pagination: { page: 1, page_size: 20, total: 0, total_pages: 0 },
    })
  }),

  // ── Health ────────────────────────────────────────────────────────────────
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      services: { database: 'ok', storage: 'ok' },
    })
  }),

  http.get(`${API_BASE}/readiness`, () => {
    return HttpResponse.json({ status: 'ready' })
  }),
]
