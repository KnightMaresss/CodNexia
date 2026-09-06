/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://codnexia.com', // CHANGE THIS TO YOUR DOMAIN
  generateRobotsTxt: true, // This will also create robots.txt for you!
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  generateIndexSitemap: false,
}