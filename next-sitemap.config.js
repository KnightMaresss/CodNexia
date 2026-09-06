/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://codnexia.com',
  generateRobotsTxt: true,
  // This will automatically find all your static pages
  autoLastmod: true,
  changefreq: 'daily',
  priority: 0.7,
  // Exclude the manifest file
  exclude: ['/manifest.json'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/manifest.json'],
      },
    ],
  },
}