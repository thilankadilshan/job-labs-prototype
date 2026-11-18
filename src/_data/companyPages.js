// One entry per company for /company/{id}/{slug}: company + its live jobs + "at a glance" stats.
import companies from "./companies.js";
import jobs from "./jobs.js";

const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const uniq = (a) => [...new Set(a.filter(Boolean))];

export default companies.map((company) => {
  const list = jobs.filter((j) => j.company_id === company.company_id);
  return {
    company: { ...company, slug: slugify(company.company_name) },
    jobs: list,
    stats: {
      open: list.length,
      locations: uniq(list.map((j) => j.city_name)),
      jobTypes: uniq(list.map((j) => j.jobtype)),
      featured: list.filter((j) => j.job_adv_top_rated === "1").length,
    },
  };
});
