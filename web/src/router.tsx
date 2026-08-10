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
    defaultNotFoundComponent: () => (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-4xl font-black text-slate-900">404</h1>
        <p className="mt-2 text-sm text-slate-500">Oeps! Deze pagina kon niet worden gevonden.</p>
        <a
          href="/student/portaal"
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Terug naar Portaal
        </a>
      </div>
    ),
  })

  setupRouterSsrQueryIntegration()

  return router
}