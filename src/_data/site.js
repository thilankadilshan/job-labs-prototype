// Global site data available in every template as `site`.
export default {
  name: "Job Labs",
  // Set SITE_URL on Vercel (e.g. https://job-labs-prototype.vercel.app) for absolute share/canonical links.
  // On Vercel the production domain is picked up automatically; override with SITE_URL if needed.
  url: (process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "")
  ).replace(/\/$/, ""),
  year: new Date().getFullYear(),
};
