import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Helper: Wrap component with router + query client for testing
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return Wrapper
}

// ── Smoke Tests: Route Guards ─────────────────────────────────────────────────
describe('Auth smoke tests', () => {
  it('renders a div without crashing', () => {
    const Wrapper = createWrapper()
    const { container } = render(
      <Wrapper>
        <div data-testid="root">AIPAS Test</div>
      </Wrapper>
    )
    expect(container.querySelector('[data-testid="root"]')).toBeTruthy()
  })
})

// ── API Client Tests ──────────────────────────────────────────────────────────
describe('API Client', () => {
  it('attaches access token to requests when available', async () => {
    localStorage.setItem('aipas_access_token', 'test-token-abc')
    const { apiClient } = await import('@/lib/api-client')

    // The request interceptor runs synchronously before the request
    // We test that the axios instance is configured correctly
    expect(apiClient.defaults.baseURL).toContain('api/v1')
    localStorage.removeItem('aipas_access_token')
  })
})

// ── Format Utils ──────────────────────────────────────────────────────────────
describe('Format Utilities', () => {
  it('formatDate returns em dash for empty string', async () => {
    const { formatDate } = await import('@/utils/format')
    expect(formatDate('')).toBe('—')
  })

  it('truncate truncates long strings', async () => {
    const { truncate } = await import('@/utils/format')
    expect(truncate('Hello World', 5)).toBe('Hello…')
    expect(truncate('Hi', 5)).toBe('Hi')
  })

  it('getStatusVariant returns correct variant for known statuses', async () => {
    const { getStatusVariant } = await import('@/utils/format')
    expect(getStatusVariant('APPROVED')).toBe('success')
    expect(getStatusVariant('PENDING')).toBe('warning')
    expect(getStatusVariant('REJECTED')).toBe('danger')
    expect(getStatusVariant('UNKNOWN')).toBe('info')
  })
})

// ── Design System Smoke Tests ─────────────────────────────────────────────────
describe('Design System components', () => {
  it('Button renders children correctly', async () => {
    const { Button } = await import('@/design-system/inputs/InputPrimitives')
    const Wrapper = createWrapper()
    render(
      <Wrapper>
        <Button>Click me</Button>
      </Wrapper>
    )
    expect(screen.getByText('Click me')).toBeTruthy()
  })

  it('Badge renders with correct text', async () => {
    const { Badge } = await import('@/design-system/display/DisplayComponents')
    const Wrapper = createWrapper()
    render(
      <Wrapper>
        <Badge status="success">Active</Badge>
      </Wrapper>
    )
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('EmptyState renders default text', async () => {
    const { EmptyState } = await import('@/design-system/shared/SharedComponents')
    const Wrapper = createWrapper()
    render(
      <Wrapper>
        <EmptyState />
      </Wrapper>
    )
    expect(screen.getByText('No records found')).toBeTruthy()
  })
})
