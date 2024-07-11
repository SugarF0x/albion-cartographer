/**
 * Path to renderer root dir at current protocol in both DEV and PROD
 */
let base = location.href
if (base.at(-1) !== '/') base = base.split('/').slice(0,base.split('/').length-1).join('/')
else base = base.slice(0,base.length-1)

export function getPublicAssetPath(path: string) {
  return base + path
}
