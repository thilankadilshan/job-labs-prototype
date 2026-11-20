// Reference lists used by the search / filter dropdowns (mirrors rms_label_master + rms_city).
const L = (pairs) => pairs.map(([label_id, label_name]) => ({ label_id, label_name }));
// A-Z, but always keep "Other" at the very bottom (same as JobsBoardController@index).
const isOther = (x) => x.label_name.trim().toLowerCase() === 'other';
const otherLast = (a, b) => (isOther(a) - isOther(b)) || a.label_name.localeCompare(b.label_name);

export const jobTypes = L([[4, "Casual"], [2, "Fixed Term"], [1, "Permanent"], [3, "Temporary"]]);
export const workTypes = L([[8, "Casual"], [344, "Freelance"], [5, "Full Time"], [6, "Part Time"]]);
export const industrySectors = L([[79, "Drivers & Receptionists"], [60, "Health Care"], [80, "Professional"], [72, "Retail"], [75, "Security"]]).sort(otherLast);
export const jobSectors = L([
  [309, "Accountant"], [311, "Administration"], [312, "Banking"], [313, "Business Development"],
  [178, "Cashier"], [287, "Chauffeur"], [179, "Customer Service Representative"], [268, "Cyber Security"],
  [288, "Delivery Driver"], [223, "Doctors"], [316, "Education"], [317, "Engineer"], [347, "Finance"],
  [302, "Hotel Receptionist"], [319, "Human Resources"], [321, "Information Technology"], [180, "Management"],
  [323, "Marketing"], [301, "Medical Receptionist"], [225, "Nursing"], [183, "Other"], [253, "Pharmacy"],
  [325, "Project Management"], [304, "Receptionist"], [177, "Sales Associate"], [220, "Security Guarding"],
  [261, "Security Officer"], [330, "Technology"],
]).sort(otherLast);
export const cities = [
  [32, "Ampara"], [6, "Anuradhapura"], [35, "Badulla"], [9, "Batticaloa"], [1, "Colombo"], [3, "Galle"],
  [23, "Gampaha"], [27, "Hambantota"], [4, "Jaffna"], [24, "Kalutara"], [2, "Kandy"], [37, "Kegalle"],
  [28, "Kilinochchi"], [22, "Kurunegala"], [29, "Mannar"], [25, "Matale"], [10, "Matara"], [36, "Monaragala"],
  [30, "Mullaitivu"], [5, "Negombo"], [26, "Nuwara Eliya"], [34, "Polonnaruwa"], [33, "Puttalam"],
  [7, "Ratnapura"], [21, "Remote"], [8, "Trincomalee"], [31, "Vavuniya"],
].map(([city_id, city_name]) => ({ city_id, city_name }));

export default { jobTypes, workTypes, industrySectors, jobSectors, cities };
