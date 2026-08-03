import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import setupRouterSsrQueryIntegration, {
  getContext,
} from './integrations/tanstack-query/root-provider'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  setupRouterSsrQueryIntegration()

  return router
}