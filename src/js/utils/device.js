export function isDesktopDevice() {
  if (typeof navigator === 'undefined') return true;

  const { userAgent = '', vendor = '' } = navigator;
  const ua = userAgent || vendor || window.opera || '';
  const uaLower = ua.toLowerCase();

  const isMobile =
    /android|iphone|ipod|blackberry|iemobile|opera mini/.test(uaLower);
  const isTablet =
    /ipad|tablet/.test(uaLower) ||
    (/(macintosh)/.test(uaLower) && 'ontouchend' in document);

  return !isMobile && !isTablet;
}

