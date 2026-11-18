// Eleventy (11ty) config for the Job Labs static prototype.
// Templates in src/ are Nunjucks ports of the Laravel Blade views; everything in
// public/ (images, favicons, mock-api.js) is copied to the site root as-is.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const slugify = (s) =>
  String(s ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ public: "/" });

  // Laravel/Carbon equivalents used by the templates
  eleventyConfig.addFilter("slug", slugify);
  eleventyConfig.addFilter("fmtDate", (d) => {            // Carbon ->format('M d, Y')
    if (!d) return "";
    const x = new Date(d);
    return `${MONTHS[x.getUTCMonth()]} ${String(x.getUTCDate()).padStart(2, "0")}, ${x.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter("diffForHumans", (d) => {      // Carbon ->diffForHumans() (past dates)
    const s = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 1000));
    const units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
    for (const [u, n] of units) if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v > 1 ? "s" : ""} ago`; }
    return "1 second ago";
  });
  eleventyConfig.addFilter("limitStr", (s, n) => {        // Str::limit
    s = String(s ?? "");
    return s.length > n ? s.slice(0, n).trimEnd() + "..." : s;
  });
  eleventyConfig.addFilter("plainText", (html) =>         // strip_tags + whitespace squeeze
    String(html ?? "").replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "")
      .replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
  eleventyConfig.addFilter("plural", (word, n) => (Number(n) === 1 ? word : word + "s"));
  eleventyConfig.addFilter("numberFormat", (n) => Number(n || 0).toLocaleString("en-US"));
  eleventyConfig.addFilter("urlencode", (s) => encodeURIComponent(String(s ?? "")).replace(/%20/g, "+"));
  eleventyConfig.addFilter("first10", (a) => (a || []).slice(0, 10));
  eleventyConfig.addFilter("shuffle", (a) => [...(a || [])].sort(() => Math.random() - 0.5)); // inRandomOrder()
  eleventyConfig.addFilter("first3", (a) => (a || []).slice(0, 3));
  eleventyConfig.addFilter("jobUrl", (job) => `/${job.job_refno}/${job.slug || slugify(job.job_title)}`);
  eleventyConfig.addFilter("companyUrl", (job) => `/company/${job.company_id}/${slugify(job.company_name)}`);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
