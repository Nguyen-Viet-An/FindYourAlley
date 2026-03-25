import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
    '/',
    '/stats',
    '/tags',
    '/map',
    '/tags/:tag',
    '/events/:id',
    '/oc-cards',
    '/oc-cards/:id',
    '/artists(.*)',
    '/gallery',
    '/featured',
    '/stamprally',
    '/api/webhooks(.*)',
    '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Only run middleware on page routes and API routes, skip all static assets
    '/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
}