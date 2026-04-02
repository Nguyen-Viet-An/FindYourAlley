import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const isPublicRoute = createRouteMatcher([
    '/',
    '/:locale',
    '/:locale/stats',
    '/:locale/tags',
    '/:locale/map',
    '/:locale/tags/:tag',
    '/:locale/events/:id',
    '/:locale/oc-cards',
    '/:locale/oc-cards/:id',
    '/:locale/artists(.*)',
    '/:locale/gallery',
    '/:locale/featured',
    '/:locale/stamprally',
    '/:locale/guide',
    '/api/webhooks(.*)',
    '/:locale/sign-in(.*)', '/:locale/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  // Skip intl middleware for API routes — they should not have a locale prefix
  if (request.nextUrl.pathname.startsWith('/api')) {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
    return;
  }

  // Run intl middleware for locale detection/redirect
  const response = intlMiddleware(request);

  // If intl middleware is redirecting (e.g. / → /vi), let it through
  if (response.headers.get('location')) {
    return response;
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return response;
})

export const config = {
  matcher: [
    // Only run middleware on page routes and API routes, skip all static assets
    '/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}