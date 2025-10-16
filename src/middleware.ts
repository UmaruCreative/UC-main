export function onRequest(context, next) {
  const url = new URL(context.request.url);
  
  // Redirect root path to /en/
  //if (url.pathname === '/' || url.pathname === '/') {
  //  return Response.redirect(new URL('/en/', context.request.url), 302);
 // }
  
  return next();
}