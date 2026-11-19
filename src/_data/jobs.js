// MOCK job vacancies (fictional). Each record is shaped like the joined row the
// Laravel controller returns (rms_job_adv_template + label/company/city joins),
// so the templates can use the same field names as the Blade views.
// Dates are relative to the build date, so the vacancies never "expire".
import { jobTypes, workTypes, industrySectors, jobSectors, cities } from "./lookups.js";
import companies from "./companies.js";

const byId = (list, key) => Object.fromEntries(list.map((x) => [x[key], x]));
const T = byId(jobTypes, "label_id"), W = byId(workTypes, "label_id"), I = byId(industrySectors, "label_id");
const S = byId(jobSectors, "label_id"), C = byId(cities, "city_id"), CO = byId(companies, "company_id");

const day = 86400000;
const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
const iso = (offsetDays) => new Date(today.getTime() + offsetDays * day).toISOString().slice(0, 10);

const ul = (items) => "<ul>" + items.map((i) => `<li>${i}</li>`).join("") + "</ul>";
const desc = (intro, duties, reqs) =>
  `<p>${intro}</p><p><strong>Key Responsibilities</strong></p>${ul(duties)}<p><strong>Requirements</strong></p>${ul(reqs)}`;

// [ref, title, company, city, jobType, workType, sector, industry, vacancies, salary, topRated, postedDaysAgo, closesInDays, views, intro, duties, requirements, skills, benefits]
const RAW = [
  [201, "Sales Assistant", 101, 3, 1, 5, 177, 72, 4, "50000-60000", 1, 2, 28, 412,
    "Galle Coast Retail is looking for friendly and energetic Sales Assistants to join our flagship Galle store.",
    ["Greet customers and help them find products", "Keep shelves stocked, clean and correctly priced", "Operate the till and handle cash accurately", "Support stock counts and deliveries"],
    ["GCE O/L or A/L qualified", "Good communication in Sinhala and English", "Ability to work weekend shifts"],
    "Customer service, Cash handling, Merchandising", "Monthly sales bonus, Staff discount, Uniform & meals provided"],
  [202, "Showroom Manager", 101, 1, 1, 5, 180, 72, 1, "120000-150000", 1, 4, 21, 655,
    "We need an experienced Showroom Manager to lead our lifestyle store in Colombo 07.",
    ["Lead a team of 12 sales staff", "Own monthly sales targets and visual merchandising", "Manage rosters, training and performance reviews", "Report weekly KPIs to the regional manager"],
    ["3+ years retail management experience", "Proven record of hitting sales targets", "Strong leadership and MS Excel skills"],
    "Team leadership, Retail operations, KPI reporting", "Performance bonus, Medical insurance, Fuel allowance"],
  [203, "Cashier", 101, 23, 3, 6, 178, 72, 3, "35000-40000", 0, 1, 14, 98,
    "Part-time cashiers needed for our busy Gampaha supermarket.",
    ["Process payments quickly and accurately", "Balance the cash drawer at the end of each shift", "Assist with packing and customer queries"],
    ["Basic numeracy", "Honest and punctual", "Previous cashier experience is an advantage"],
    "POS systems, Cash handling", "Flexible hours, Staff discount"],
  [204, "Registered Nurse", 102, 10, 1, 5, 225, 60, 6, "90000-110000", 1, 3, 30, 980,
    "Ruhuna MediCare is expanding its Matara hospital and is hiring qualified Registered Nurses for medical and surgical wards.",
    ["Provide safe, high-quality nursing care", "Administer medication and monitor patients", "Maintain accurate clinical records", "Educate patients and families on care plans"],
    ["Diploma or BSc in Nursing", "SLNC registration", "Minimum 1 year of hospital experience"],
    "Patient care, Clinical documentation, BLS", "Night-shift allowance, Free medical cover, Training sponsorship"],
  [205, "Medical Receptionist", 102, 2, 1, 5, 301, 60, 2, "45000-55000", 0, 6, 18, 233,
    "Front-desk Medical Receptionist required for our Kandy channelling centre.",
    ["Welcome patients and manage appointments", "Handle phone and WhatsApp enquiries", "Process billing and insurance forms"],
    ["A/L qualified", "Pleasant personality", "Computer literate (MS Office)"],
    "Front desk, Scheduling, Customer care", "Meals, Medical cover"],
  [206, "Pharmacist", 102, 1, 1, 5, 253, 60, 1, "130000-160000", 0, 9, 25, 301,
    "We are seeking a registered Pharmacist to manage our Colombo hospital pharmacy.",
    ["Dispense prescriptions accurately", "Advise patients on correct use of medicines", "Manage stock and controlled drugs register"],
    ["B.Pharm degree", "SLMC registration", "2+ years experience preferred"],
    "Dispensing, Inventory control", "Annual bonus, Medical cover, Professional development"],
  [207, "Security Officer", 103, 1, 1, 5, 261, 75, 10, "55000-65000", 1, 1, 20, 1210,
    "Sigiri Secure Services is recruiting Security Officers for corporate sites in Colombo.",
    ["Control access and monitor visitors", "Patrol premises and report incidents", "Monitor CCTV and alarm systems"],
    ["Age 21–50", "Physically fit", "Ex-forces personnel are welcome"],
    "Access control, Patrolling, Incident reporting", "Overtime pay, EPF/ETF, Free uniform & accommodation"],
  [208, "CCTV Control Room Operator", 103, 23, 2, 5, 220, 75, 2, "60000-70000", 0, 5, 16, 187,
    "Fixed-term contract for CCTV Operators at our 24/7 monitoring centre in Gampaha.",
    ["Monitor live camera feeds", "Escalate incidents to response teams", "Maintain detailed logs"],
    ["Good eyesight and concentration", "Basic computer skills", "Willing to work rotating shifts"],
    "CCTV monitoring, Reporting", "Shift allowance, Meals provided"],
  [209, "Senior Laravel Developer", 104, 21, 1, 5, 321, 80, 2, "350000-450000", 1, 2, 35, 1534,
    "Nuwara Digital Labs is hiring a Senior Laravel Developer to lead back-end work on SaaS products for international clients. Fully remote.",
    ["Design and build REST APIs with Laravel", "Mentor junior developers and review code", "Optimise MySQL queries and caching", "Work with product owners in agile sprints"],
    ["5+ years PHP / Laravel experience", "Strong MySQL, Git and Docker skills", "Experience with Vue or React is a plus"],
    "PHP, Laravel, MySQL, Docker, REST APIs", "Remote work, USD-linked salary, Annual hardware budget, Health insurance"],
  [210, "Front-End Developer (React)", 104, 1, 1, 5, 321, 80, 2, "200000-280000", 0, 7, 24, 820,
    "Join our product team in Colombo to craft fast, accessible web interfaces.",
    ["Build responsive UIs with React and TypeScript", "Collaborate with designers in Figma", "Write unit and end-to-end tests"],
    ["2+ years React experience", "Solid HTML, CSS and JavaScript", "Good English communication"],
    "React, TypeScript, CSS, Testing", "Hybrid work, Learning budget, Medical cover"],
  [211, "QA Engineer", 104, 2, 2, 5, 330, 80, 1, null, 0, 12, 19, 276,
    "12-month contract for a QA Engineer at our Kandy office.",
    ["Write and run manual and automated test cases", "Report and track bugs", "Take part in release planning"],
    ["1+ year QA experience", "Knowledge of Selenium or Cypress", "Attention to detail"],
    "Manual testing, Cypress, Jira", "Hybrid work, Contract completion bonus"],
  [212, "Cyber Security Analyst", 104, 21, 1, 5, 268, 80, 1, "250000-320000", 0, 3, 27, 445,
    "Remote Cyber Security Analyst to protect our clients' cloud workloads.",
    ["Monitor SIEM alerts and investigate incidents", "Run vulnerability scans and track remediation", "Improve security policies and awareness"],
    ["Degree in IT or Computer Security", "Security+ / CEH or similar", "2+ years SOC experience"],
    "SIEM, Incident response, AWS security", "Remote work, Certification sponsorship"],
  [213, "Delivery Driver", 105, 1, 4, 6, 288, 79, 8, "40000-60000", 0, 1, 12, 389,
    "Casual Delivery Drivers needed for same-day deliveries around Colombo.",
    ["Deliver parcels safely and on time", "Use the driver app for proof of delivery", "Keep the vehicle clean and report issues"],
    ["Valid light-vehicle licence", "Good knowledge of Colombo roads", "Own smartphone"],
    "Driving, Route planning", "Per-delivery incentives, Fuel allowance"],
  [214, "Heavy Vehicle Driver", 105, 22, 1, 5, 288, 79, 3, "75000-90000", 0, 8, 22, 210,
    "Experienced heavy vehicle drivers for our Kurunegala distribution hub.",
    ["Transport freight between hubs", "Complete daily vehicle checks", "Follow road-safety rules and schedules"],
    ["Heavy vehicle licence", "3+ years experience", "Clean driving record"],
    "Heavy vehicles, Safety checks", "Trip allowance, EPF/ETF, Accommodation"],
  [215, "Corporate Chauffeur", 105, 1, 1, 5, 287, 79, 1, "65000-75000", 0, 10, 15, 154,
    "Professional chauffeur needed for senior executives.",
    ["Drive executives to meetings and the airport", "Maintain the vehicle in excellent condition"],
    ["Valid licence with 5+ years experience", "Smart appearance and discretion", "Basic English"],
    "Executive driving", "Overtime, Meals"],
  [216, "Branch Accountant", 106, 7, 1, 5, 309, 80, 1, "110000-140000", 0, 6, 26, 360,
    "Mahaweli Finance is looking for a Branch Accountant for our Ratnapura branch.",
    ["Prepare monthly management accounts", "Handle reconciliations and tax filings", "Support internal and external audits"],
    ["CA / CIMA part-qualified", "3+ years in finance or leasing", "Strong Excel skills"],
    "Accounting, Reconciliations, Excel", "Staff loan schemes, Bonus, Medical cover"],
  [217, "Customer Service Executive", 106, 3, 1, 5, 179, 80, 3, "55000-65000", 0, 2, 17, 199,
    "Customer Service Executives needed for our Galle branch.",
    ["Help customers open accounts and leases", "Answer queries in person and by phone", "Cross-sell savings products"],
    ["A/L qualified", "Good Sinhala and English", "Banking experience is an advantage"],
    "Customer service, Sales", "Attractive incentives, Medical cover"],
  [218, "Marketing Executive", 106, 1, 1, 5, 323, 80, 1, "90000-120000", 0, 11, 29, 267,
    "Drive brand awareness and lead generation for Mahaweli Finance.",
    ["Plan and run digital campaigns", "Manage social media and content calendar", "Track ROI and report results"],
    ["Degree or diploma in Marketing", "2+ years digital marketing experience", "Meta and Google Ads knowledge"],
    "Digital marketing, Social media, Analytics", "Laptop & phone, Bonus"],
  [219, "Hotel Receptionist", 107, 2, 1, 5, 302, 79, 2, "50000-60000", 1, 3, 23, 541,
    "Kelani Hospitality is hiring Hotel Receptionists for our boutique hotel in Kandy.",
    ["Handle check-ins, check-outs and reservations", "Respond to guest requests promptly", "Coordinate with housekeeping and F&B"],
    ["Diploma in hospitality is preferred", "Fluent English", "Friendly and well-groomed"],
    "Front office, Opera PMS, Guest relations", "Service charge, Meals, Accommodation"],
  [220, "Restaurant Supervisor", 107, 8, 3, 5, 180, 72, 1, "70000-85000", 0, 4, 13, 132,
    "Temporary Restaurant Supervisor for the peak season at our Trincomalee beach resort.",
    ["Supervise waiters and table service", "Ensure food safety and hygiene standards", "Handle guest feedback"],
    ["2+ years in a hotel restaurant", "Leadership skills", "Good English"],
    "F&B service, Team supervision", "Service charge, Accommodation, Meals"],
  [221, "HR Executive", 107, 1, 1, 5, 319, 80, 1, "80000-100000", 0, 14, 31, 220,
    "Support recruitment, onboarding and staff welfare across our hotel group.",
    ["Manage recruitment end to end", "Maintain HR records and payroll inputs", "Organise training and engagement events"],
    ["Degree or diploma in HRM", "2+ years HR experience", "Knowledge of labour law"],
    "Recruitment, Payroll, Employee relations", "Hotel stay vouchers, Medical cover"],
  [222, "Receptionist / Office Administrator", 104, 1, 1, 6, 304, 79, 1, "40000-50000", 0, 5, 11, 176,
    "Part-time Receptionist / Office Administrator for our Colombo office.",
    ["Manage the front desk and visitors", "Handle courier, stationery and office supplies", "Support the team with admin tasks"],
    ["Good English", "MS Office skills", "Organised and reliable"],
    "Administration, MS Office", "Flexible hours, Snacks & tea"],
  [223, "Project Manager", 104, 21, 2, 344, 325, 80, 1, "300000-380000", 0, 6, 33, 389,
    "Freelance Project Manager to run a 9-month digital transformation project.",
    ["Plan scope, timelines and budgets", "Run daily stand-ups and stakeholder updates", "Manage risks and change requests"],
    ["PMP or Prince2 certified", "5+ years managing software projects", "Excellent communication"],
    "Agile, Scrum, Stakeholder management", "Remote, Flexible schedule"],
  [224, "Store Supervisor", 101, 10, 1, 5, 180, 72, 2, "70000-80000", 0, 2, 10, 245,
    "Store Supervisor for our new Matara supermarket.",
    ["Supervise daily store operations", "Train new staff", "Control stock losses and wastage"],
    ["2+ years retail supervisory experience", "Good people skills"],
    "Retail operations, Supervision", "Bonus, Staff discount"],
];

// Vacancies marked "Urgent" in the admin (job_adv_urgent = 1) - shown with an Urgent badge
const URGENT_REFS = new Set([203, 204, 207, 213, 217]);

const slugify = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const jobs = RAW.map((r, i) => {
  const [ref, title, cid, city, jt, wt, sec, ind, vac, salary, top, posted, closes, views, intro, duties, reqs, skills, benefits] = r;
  const co = CO[cid];
  return {
    job_id: 1000 + i,
    job_refno: "JBS" + String(ref).padStart(6, "0"),
    job_title: title,
    slug: slugify(title),
    company_id: cid,
    company_name: co.company_name,
    company_logo: co.company_logo,
    company_overview: co.company_overview,
    city_id: city, city_name: C[city].city_name, country_name: "Sri Lanka",
    job_adv_jobtype: jt, jobtype: T[jt].label_name,
    job_adv_worktype: wt, worktype: W[wt].label_name,
    job_adv_jobsector: sec, jobsector: S[sec].label_name,
    job_industrysector: ind, industrysector: I[ind].label_name,
    job_adv_total_vacancies: vac,
    job_adv_salary: salary,
    job_adv_top_rated: top ? "1" : "0",   // shown as "Featured"
    job_adv_urgent: URGENT_REFS.has(ref) ? "1" : "0",
    job_adv_status: "1",
    job_adv_active: "1",
    job_adv_livedate: iso(-posted),
    job_adv_startdate: iso(closes + 14),
    job_adv_closingdate: iso(closes),
    days_until_closing: closes,
    isNew: posted <= 7,
    job_adv_views: views,
    job_adv_description: desc(intro, duties, reqs),
    job_adv_keyword: `<p>${skills}</p>`,
    job_benifits: ul(benefits.split(/,\s*/)),
  };
})
  // same ordering as the live board: featured first, then newest
  .sort((a, b) => b.job_adv_top_rated.localeCompare(a.job_adv_top_rated) || b.job_adv_livedate.localeCompare(a.job_adv_livedate));

export default jobs;
