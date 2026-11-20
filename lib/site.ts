// The public address of the site. The custom domain wins over an old *.vercel.app SITE_URL setting.
export const CUSTOM_DOMAIN = 'https://www.thesunday.com.br';
const env = process.env.SITE_URL;
export const siteUrl = env && !/\.vercel\.app/.test(env) ? env : process.env.VERCEL ? CUSTOM_DOMAIN : env || 'http://localhost:3000';
/** Hosts the suggestion form accepts posts from. */
export const publicHosts = ['www.thesunday.com.br', 'thesunday.com.br'];
