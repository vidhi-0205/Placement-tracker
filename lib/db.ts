import mysql, { type RowDataPacket } from "mysql2/promise";

type DbRow = RowDataPacket & Record<string, unknown>;

let pool: mysql.Pool | undefined;

function getPool() {
  pool ??= mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}

export type Company = {
  companyId: number;
  companyName: string;
  industry: string;
  location: string;
  website: string | null;
};

export type PlacementOpportunity = {
  companyId: number; companyName: string; industry: string | null; location: string | null;
  website: string | null; driveId: number; driveYear: number; driveDate: string | null;
  applicationDeadline: string | null; driveStatus: string | null; jobId: number; jobRole: string;
  packageLpa: number | null; minimumCgpa: number | null; eligibilityBranch: string | null;
  jobDescription: string | null; oaDate: string | null; oaTime: string | null;
  interviewDate: string | null; numberOfOpenings: number | null; backlogCriteria: string | null;
  oaInstructions: string | null;
};

export type HistoricalPlacement = Pick<PlacementOpportunity,
  "driveId" | "driveYear" | "driveDate" | "applicationDeadline" | "driveStatus" |
  "jobId" | "jobRole" | "packageLpa" | "minimumCgpa" | "eligibilityBranch">;

export type ApplicationStatus = {
  applicationId: number; applicationStatus: string | null; applicationDate: string | null;
  jobRole: string; driveYear: number; companyName: string;
};

export type AuthUser = {
  userId: number;
  enrollmentId: string;
  name: string;
  email: string;
};

const optionalColumns = [
  "oa_date", "oa_time", "interview_date", "number_of_openings", "backlog_criteria", "oa_instructions",
] as const;

async function availableOptionalColumns() {
  const [rows] = await getPool().query<DbRow[]>(
    `SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND ((TABLE_NAME = 'drive' AND COLUMN_NAME IN (?, ?, ?))
         OR (TABLE_NAME = 'job' AND COLUMN_NAME IN (?, ?, ?)))`,
    [...optionalColumns.slice(0, 3), ...optionalColumns.slice(3)],
  );
  return new Set(rows.map((row) => `${String(row.TABLE_NAME).toLowerCase()}.${String(row.COLUMN_NAME)}`));
}

function optionalSelect(columns: Set<string>, table: "drive" | "job", column: (typeof optionalColumns)[number]) {
  return columns.has(`${table}.${column}`) ? `${table}.${column}` : `NULL AS ${column}`;
}

function mapOpportunity(row: DbRow): PlacementOpportunity {
  return {
    companyId: Number(row.company_id), companyName: String(row.company_name),
    industry: row.industry ? String(row.industry) : null, location: row.location ? String(row.location) : null,
    website: row.website ? String(row.website) : null, driveId: Number(row.drive_id),
    driveYear: Number(row.drive_year), driveDate: row.drive_date ? String(row.drive_date).slice(0, 10) : null,
    applicationDeadline: row.application_deadline ? String(row.application_deadline).slice(0, 10) : null,
    driveStatus: row.drive_status ? String(row.drive_status) : null, jobId: Number(row.job_id),
    jobRole: String(row.job_role), packageLpa: row.package_lpa === null ? null : Number(row.package_lpa),
    minimumCgpa: row.minimum_cgpa === null ? null : Number(row.minimum_cgpa),
    eligibilityBranch: row.eligibility_branch ? String(row.eligibility_branch) : null,
    jobDescription: row.job_description ? String(row.job_description) : null,
    oaDate: row.oa_date ? String(row.oa_date).slice(0, 10) : null, oaTime: row.oa_time ? String(row.oa_time) : null,
    interviewDate: row.interview_date ? String(row.interview_date).slice(0, 10) : null,
    numberOfOpenings: row.number_of_openings === null ? null : Number(row.number_of_openings),
    backlogCriteria: row.backlog_criteria ? String(row.backlog_criteria) : null,
    oaInstructions: row.oa_instructions ? String(row.oa_instructions) : null,
  };
}

const opportunitySelect = (columns: Set<string>) => `
  SELECT c.company_id, c.company_name, c.industry, c.location, c.website,
         d.drive_id, d.drive_year, d.drive_date, d.application_deadline, d.status AS drive_status,
         j.job_id, j.job_role, j.package_lpa, j.minimum_cgpa, j.eligibility_branch, j.job_description,
         ${optionalSelect(columns, "drive", "oa_date")}, ${optionalSelect(columns, "drive", "oa_time")},
         ${optionalSelect(columns, "drive", "interview_date")}, ${optionalSelect(columns, "job", "number_of_openings")},
         ${optionalSelect(columns, "job", "backlog_criteria")}, ${optionalSelect(columns, "job", "oa_instructions")}
    FROM drive d INNER JOIN company c ON c.company_id = d.company_id
    INNER JOIN job j ON j.company_id = c.company_id`;

export async function getCompanies(): Promise<Company[]> {
  const [rows] = await getPool().query<DbRow[]>(
    `SELECT company_id, company_name, industry, location, website FROM company ORDER BY company_name ASC`,
  );
  return rows.map((row) => ({
    companyId: Number(row.company_id), companyName: String(row.company_name),
    industry: row.industry ? String(row.industry) : "", location: row.location ? String(row.location) : "",
    website: row.website ? String(row.website) : null,
  }));
}

export async function getPlacementOpportunities(year: number, filters: {
  search?: string; status?: string; role?: string; eligibility?: string;
}) {
  const columns = await availableOptionalColumns();
  const conditions = ["d.drive_year = ?"];
  const values: (number | string)[] = [year];
  if (filters.search) { conditions.push("c.company_name LIKE ?"); values.push(`%${filters.search}%`); }
  if (filters.status) { conditions.push("d.status = ?"); values.push(filters.status); }
  if (filters.role) { conditions.push("j.job_role LIKE ?"); values.push(`%${filters.role}%`); }
  if (filters.eligibility) {
    conditions.push("(j.eligibility_branch LIKE ? OR CAST(j.minimum_cgpa AS CHAR) LIKE ?)");
    values.push(`%${filters.eligibility}%`, `%${filters.eligibility}%`);
  }
  const [rows] = await getPool().query<DbRow[]>(
    `${opportunitySelect(columns)} WHERE ${conditions.join(" AND ")}
     ORDER BY c.company_name, d.drive_date, j.job_role`, values,
  );
  return rows.map(mapOpportunity);
}

export async function getHistoricalPlacements(companyId: number, year: number) {
  const [rows] = await getPool().query<DbRow[]>(
    `SELECT d.drive_id, d.drive_year, d.drive_date, d.application_deadline, d.status AS drive_status,
            j.job_id, j.job_role, j.package_lpa, j.minimum_cgpa, j.eligibility_branch
       FROM drive d INNER JOIN job j ON j.company_id = d.company_id
      WHERE d.company_id = ? AND d.drive_year < ?
      ORDER BY d.drive_year DESC, d.drive_date DESC, j.job_role`, [companyId, year],
  );
  return rows.map((row) => ({
    driveId: Number(row.drive_id), driveYear: Number(row.drive_year),
    driveDate: row.drive_date ? String(row.drive_date).slice(0, 10) : null,
    applicationDeadline: row.application_deadline ? String(row.application_deadline).slice(0, 10) : null,
    driveStatus: row.drive_status ? String(row.drive_status) : null, jobId: Number(row.job_id),
    jobRole: String(row.job_role), packageLpa: row.package_lpa === null ? null : Number(row.package_lpa),
    minimumCgpa: row.minimum_cgpa === null ? null : Number(row.minimum_cgpa),
    eligibilityBranch: row.eligibility_branch ? String(row.eligibility_branch) : null,
  })) as HistoricalPlacement[];
}

export async function getApplicationStatuses(userId: number, companyId: number, year: number) {
  const [rows] = await getPool().query<DbRow[]>(
    `SELECT a.application_id, a.application_status, a.application_date, j.job_role,
            d.drive_year, c.company_name
       FROM application a INNER JOIN drive d ON d.drive_id = a.drive_id
       INNER JOIN job j ON j.job_id = a.job_id INNER JOIN company c ON c.company_id = d.company_id
      WHERE a.user_id = ? AND d.company_id = ? AND d.drive_year = ?
      ORDER BY a.application_date DESC, j.job_role`, [userId, companyId, year],
  );
  return rows.map((row) => ({
    applicationId: Number(row.application_id),
    applicationStatus: row.application_status ? String(row.application_status) : null,
    applicationDate: row.application_date ? String(row.application_date).slice(0, 10) : null,
    jobRole: String(row.job_role), driveYear: Number(row.drive_year), companyName: String(row.company_name),
  })) as ApplicationStatus[];
}

export async function createUser(input: {
  enrollmentId: string; name: string; email: string; phone?: string;
  branch?: string; graduationYear?: number; cgpa?: number; passwordHash: string;
}) {
  const [result] = await getPool().execute<mysql.ResultSetHeader>(
    `INSERT INTO user
      (enrollment_id, name, email, phone, branch, graduation_year, cgpa, password_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.enrollmentId, input.name, input.email, input.phone || null, input.branch || null,
      input.graduationYear ?? null, input.cgpa ?? null, input.passwordHash,
    ],
  );
  return { userId: result.insertId, enrollmentId: input.enrollmentId, name: input.name, email: input.email };
}

export async function findUserByEmail(email: string) {
  const [rows] = await getPool().query<DbRow[]>(
    `SELECT user_id, enrollment_id, name, email, password_hash
       FROM user WHERE email = ? LIMIT 1`,
    [email],
  );
  return rows[0] ? {
    userId: Number(rows[0].user_id),
    enrollmentId: String(rows[0].enrollment_id),
    name: String(rows[0].name),
    email: String(rows[0].email),
    passwordHash: String(rows[0].password_hash),
  } : null;
}

export async function findUserByEnrollmentId(enrollmentId: string) {
  const [rows] = await getPool().query<DbRow[]>(
    `SELECT user_id, enrollment_id, name, email
       FROM user WHERE enrollment_id = ? LIMIT 1`,
    [enrollmentId],
  );
  return rows[0] ? {
    userId: Number(rows[0].user_id),
    enrollmentId: String(rows[0].enrollment_id),
    name: String(rows[0].name),
    email: String(rows[0].email),
  } : null;
}

export async function getApplicationCount(userId: number, year: number) {
  const [rows] = await getPool().query<DbRow[]>(
    `SELECT COUNT(*) AS application_count
       FROM application a INNER JOIN drive d ON d.drive_id = a.drive_id
      WHERE a.user_id = ? AND d.drive_year = ?`,
    [userId, year],
  );
  return Number(rows[0]?.application_count ?? 0);
}
