/**
 * Application-wide constants
 */

// Complaint categories and subcategories
const COMPLAINT_CATEGORIES = {
  Electrical: [
    "Lighting",
    "Power Outlets",
    "Fan/AC",
    "Electrical Appliances",
    "Switchboard",
    "Wiring Issues",
    "UPS/Inverter",
    "Other Electrical",
  ],
  Civil: [
    "Plumbing",
    "Drainage",
    "Wall/Ceiling",
    "Flooring",
    "Carpentry",
    "Painting",
    "Doors/Windows",
    "Water Supply",
    "Other Civil",
  ],
  Misc: [
    "Housekeeping",
    "Garden/Landscape",
    "Security",
    "Parking",
    "Facilities",
    "Pest Control",
    "Internet/Network",
    "Common Area",
    "Other",
  ],
};

// Complaint status descriptions
const COMPLAINT_STATUS = {
  pending: "Complaint submitted but not yet assigned",
  assigned: "Complaint assigned to maintenance staff/agency",
  resolved:
    "Complaint resolved by maintenance staff/agency, awaiting user feedback",
  closed: "Complaint resolved and closed after positive user feedback",
  escalated: "Complaint escalated due to negative user feedback",
  finalResolution: "Final resolution provided by appellate authority",
};

// Resource types
const RESOURCE_TYPES = {
  personal: "Personal resources (residential quarters)",
  functional: "Functional resources (offices, facilities)",
  general: "General resources (parks, common areas)",
};

// User roles
const USER_ROLES = {
  superAdmin: "Super Administrator with all permissions",
  departmentAdmin:
    "Department Administrator with department-specific permissions",
  maintenanceStaff: "Maintenance staff assigned to handle complaints",
  resident: "Regular resident user",
};

module.exports = {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS,
  RESOURCE_TYPES,
  USER_ROLES,
};
