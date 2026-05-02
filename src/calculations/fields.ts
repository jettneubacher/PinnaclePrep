/**
 * Maps internal field identifiers to the exact CSV column headers produced in source files.
 * All other code should import column names from here only.
 */
export const FIELDS = {
  DATE: "date",
  REVENUE: "revenue",
  UNITS: "units",
  CUSTOMER_ID: "customer_id",
  REGION: "region",
} as const;
