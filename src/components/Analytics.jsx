import { useEffect } from 'react';

const GA_ID = 'G-V7S6WV251S';

export default function Analytics() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);

    return () => document.head.removeChild(script);
  }, []);

  return null;
}
