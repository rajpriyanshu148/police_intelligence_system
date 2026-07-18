import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Create MSW node server with all mock handlers
export const server = setupServer(...handlers)
