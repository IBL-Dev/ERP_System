import { countWorkingDays, toMinutes } from "@/lib/date";
import { DEMO_TODAY } from "../app.const";
import { HOLIDAYS, SHIFTS } from "../hr.const";
import type {
  AttendanceRecord,
  Contract,
  Department,
  Employee,
  Goal,
  GoalTask,
  LeaveRequest,
  LeaveType,
  Review,
  ShiftId,
  Training,
  HrState,
} from "../../type";

// Mock data. Replace with an API service later; the rest of the feature only reads HrState.
const HOLIDAY_DATES = HOLIDAYS.map((h) => h.date);

type Salary = [effective: string, amount: number, reason: string];

function emp(
  idx: number,
  name: string,
  jobTitle: string,
  department: Department,
  managerId: string | null,
  hireDate: string,
  salaries: Salary[],
  contract: Pick<Contract, "type" | "end"> = { type: "permanent", end: null },
): Employee {
  const slug = name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".");
  const pad = String(idx).padStart(2, "0");
  return {
    id: `EMP-${1000 + idx}`,
    name,
    jobTitle,
    department,
    managerId,
    hireDate,
    email: `${slug}@lmserp.example`,
    phone: `555-01${pad}`,
    address: `${10 + idx} Example Street`,
    dateOfBirth: `${1978 + (idx % 15)}-${String((idx % 12) + 1).padStart(2, "0")}-${String(((idx * 3) % 27) + 1).padStart(2, "0")}`,
    emergencyContact: `Family contact, 555-02${pad}`,
    contract: { type: contract.type, start: hireDate, end: contract.end },
    salaryHistory: salaries.map(([effective, amount, reason]) => ({ effective, amount, reason })),
  };
}

export const EMPLOYEES: Employee[] = [
  emp(1, "Marcus Hale", "Managing Director", "executive", null, "2019-01-07", [["2026-01-01", 7500, "Annual review"], ["2023-01-01", 6800, "Annual review"], ["2019-01-07", 6000, "Hired"]]),
  emp(2, "Priya Nair", "Finance Manager", "finance", "EMP-1001", "2020-03-02", [["2026-01-01", 4600, "Annual review"], ["2022-04-01", 4100, "Promotion"], ["2020-03-02", 3500, "Hired"]]),
  emp(3, "Daniel Okafor", "HR Manager", "hr", "EMP-1001", "2020-06-15", [["2026-01-01", 4500, "Annual review"], ["2020-06-15", 3800, "Hired"]]),
  emp(4, "Sofia Lindqvist", "Inventory Manager", "inventory", "EMP-1001", "2021-02-01", [["2026-01-01", 4400, "Annual review"], ["2023-07-01", 4000, "Promotion"], ["2021-02-01", 3400, "Hired"]]),
  emp(5, "Hiroshi Tanaka", "Supplier Manager", "supplier", "EMP-1001", "2021-08-23", [["2026-01-01", 4300, "Annual review"], ["2021-08-23", 3700, "Hired"]]),
  emp(6, "Elena Petrova", "Sales Manager", "sales", "EMP-1001", "2022-01-10", [["2026-01-01", 4700, "Annual review"], ["2022-01-10", 4000, "Hired"]]),
  emp(7, "Tomas Alvarez", "Warehouse Supervisor", "inventory", "EMP-1004", "2022-05-09", [["2026-01-01", 2600, "Annual review"], ["2022-05-09", 2200, "Hired"]]),
  emp(8, "Aisha Rahman", "Stock Controller", "inventory", "EMP-1004", "2023-02-20", [["2026-01-01", 2200, "Annual review"], ["2023-02-20", 1900, "Hired"]]),
  emp(9, "Liam O'Connor", "Forklift Operator", "inventory", "EMP-1007", "2023-09-04", [["2025-01-01", 1500, "Annual review"], ["2023-09-04", 1350, "Hired"]]),
  emp(10, "Chen Wei", "Accountant", "finance", "EMP-1002", "2022-11-14", [["2026-01-01", 2400, "Annual review"], ["2022-11-14", 2000, "Hired"]]),
  emp(11, "Grace Mwangi", "HR Officer", "hr", "EMP-1003", "2024-01-15", [["2026-01-01", 2100, "Annual review"], ["2024-01-15", 1800, "Hired"]]),
  emp(12, "Noah Fischer", "Procurement Officer", "supplier", "EMP-1005", "2024-03-18", [["2026-01-01", 2300, "Annual review"], ["2024-03-18", 2000, "Hired"]]),
  emp(13, "Zara Ahmed", "Sales Executive", "sales", "EMP-1006", "2025-04-07", [["2026-01-01", 2000, "Annual review"], ["2025-04-07", 1750, "Hired"]]),
  emp(14, "Mateo Silva", "Packing Operator", "inventory", "EMP-1007", "2026-09-01", [["2026-09-01", 1400, "Hired"]], { type: "probation", end: "2026-11-30" }),
];

// ---------- attendance: 5 weekdays + today, generated deterministically ----------
const DAYS = ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", DEMO_TODAY];
const SHIFT_OF: Record<string, ShiftId> = { "EMP-1009": "early", "EMP-1014": "late" };
const ABSENCES = new Map([
  ["EMP-1011|2026-11-11", "Sick leave"],
  ["EMP-1013|2026-11-12", "Annual leave"],
  ["EMP-1013|2026-11-13", "Annual leave"],
]);
const pseudo = (n: number) => ((n * 9301 + 49297) % 233280) / 233280;
const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const ATTENDANCE: AttendanceRecord[] = EMPLOYEES.flatMap((e, ei) =>
  e.id === "EMP-1001"
    ? []
    : DAYS.flatMap((date, di): AttendanceRecord[] => {
        // The signed-in demo user has not clocked in yet today, so the Clock in button works.
        if (e.id === "EMP-1004" && date === DEMO_TODAY) return [];
        const shift = SHIFT_OF[e.id] ?? "day";
        const base = { id: `AT-${e.id.slice(4)}-${date.slice(8)}`, employeeId: e.id, date, shift };
        const note = ABSENCES.get(`${e.id}|${date}`);
        if (note) return [{ ...base, clockIn: null, clockOut: null, absent: true, note }];

        const start = toMinutes(SHIFTS[shift].start);
        const end = toMinutes(SHIFTS[shift].end);
        const r1 = pseudo(ei * 7 + di + 1);
        const r2 = pseudo(ei * 13 + di * 5 + 2);
        const clockIn = hhmm(start + Math.round(r1 * 35) - 10);
        const clockOut = date === DEMO_TODAY ? null : hhmm(end + (r2 > 0.7 ? Math.round(r2 * 120) : Math.round(r2 * 10) - 5));
        return [{ ...base, clockIn, clockOut }];
      }),
);

// ---------- leave ----------
function leave(
  n: number,
  employeeId: string,
  type: LeaveType,
  from: string,
  to: string,
  reason: string,
  status: LeaveRequest["status"],
  decidedBy: string | null,
  requestedOn: string,
): LeaveRequest {
  return { id: `LR-${3000 + n}`, employeeId, type, from, to, days: countWorkingDays(from, to, HOLIDAY_DATES), reason, status, decidedBy, requestedOn };
}

const LEAVE: LeaveRequest[] = [
  leave(1, "EMP-1011", "sick", "2026-11-11", "2026-11-11", "Fever", "approved", "EMP-1003", "2026-11-11"),
  leave(2, "EMP-1013", "annual", "2026-11-12", "2026-11-13", "Family event", "approved", "EMP-1006", "2026-10-28"),
  leave(3, "EMP-1008", "annual", "2026-12-21", "2026-12-24", "Year-end trip", "pending", null, "2026-11-10"),
  leave(4, "EMP-1014", "annual", "2026-11-23", "2026-11-25", "Personal", "pending", null, "2026-11-12"),
  leave(5, "EMP-1010", "annual", "2026-12-14", "2026-12-18", "Holiday abroad", "pending", null, "2026-11-09"),
  leave(6, "EMP-1009", "sick", "2026-11-05", "2026-11-06", "Back pain", "approved", "EMP-1004", "2026-11-05"),
  leave(7, "EMP-1012", "unpaid", "2026-11-18", "2026-11-19", "Moving house", "approved", "EMP-1005", "2026-11-02"),
  leave(8, "EMP-1004", "annual", "2026-12-28", "2026-12-31", "Family time", "pending", null, "2026-11-13"),
];

// ---------- talent ----------
function goal(
  id: string,
  employeeId: string,
  title: string,
  due: string,
  points: [text: string, done: boolean][],
  comments: [by: string, at: string, text: string][] = [],
): Goal {
  const tasks: GoalTask[] = points.map(([text, done], i) => ({ id: `T${i + 1}`, text, done }));
  return {
    id,
    employeeId,
    title,
    due,
    tasks,
    progress: Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100),
    comments: comments.map(([by, at, text], i) => ({ id: `C${i + 1}`, by, at, text })),
  };
}

const GOALS: Goal[] = [
  goal("G-001", "EMP-1004", "Cut stock-count variance below 1%", "2026-12-31", [
    ["Count high-value shelves weekly", true],
    ["Fix mislabelled shelf locations", true],
    ["Train staff on scanner counts", true],
    ["Review the variance report every month", false],
    ["Stay under 1% for two months in a row", false],
  ], [["Marcus Hale", "2026-11-05", "Good start. Keep the monthly report short and focus on the top five items."]]),
  goal("G-002", "EMP-1007", "Complete warehouse re-layout", "2026-11-30", [
    ["Agree the new floor plan", true],
    ["Move fast-moving items near the dock", true],
    ["Relabel all racks", true],
    ["Update the location codes in the system", true],
    ["Retrain pickers on the new routes", true],
    ["Sign off the layout with the safety officer", false],
  ]),
  goal("G-003", "EMP-1008", "Introduce weekly cycle counts", "2026-10-31", [
    ["Write the counting procedure", true],
    ["Set up the weekly count calendar", true],
    ["Run the first four counts", true],
    ["Report the results to the manager", false],
  ], [["Sofia Lindqvist", "2026-11-02", "Deadline has passed. Please send the results report this week."]]),
  goal("G-004", "EMP-1010", "Shorten month-end close to 5 days", "2026-12-15", [
    ["Map the current closing steps", true],
    ["Automate bank reconciliation", true],
    ["Set a cut-off for supplier invoices", false],
    ["Agree the new calendar with departments", false],
    ["Run a trial close", false],
  ]),
  goal("G-005", "EMP-1013", "Win 10 new accounts", "2026-12-31", [
    ["Build the prospect list", true],
    ["Make 50 introduction calls", true],
    ["Send 20 quotes", true],
    ["Close 5 accounts", true],
    ["Close 10 accounts", true],
  ]),
  goal("G-006", "EMP-1011", "Digitise personnel files", "2027-03-31", [
    ["Choose the scanning tool", true],
    ["Scan current employee files", false],
    ["Scan former employee files", false],
    ["Check the scans against the originals", false],
    ["Archive the paper files", false],
  ]),
];

const review = (
  id: string,
  employeeId: string,
  reviewerId: string,
  stage: Review["stage"],
  rating: number | null,
  comments: [by: string, at: string, text: string][] = [],
): Review => ({
  id,
  employeeId,
  reviewerId,
  cycle: "H2 2026",
  stage,
  rating,
  comments: comments.map(([by, at, text], i) => ({ id: `C${i + 1}`, by, at, text })),
});

const REVIEWS: Review[] = [
  review("R-001", "EMP-1007", "EMP-1004", "manager-review", null, [
    ["Tomas Alvarez", "2026-11-10", "Led the re-layout and cut pick times. I would like more help from the team on documentation."],
  ]),
  review("R-002", "EMP-1008", "EMP-1004", "self-review", null),
  review("R-003", "EMP-1009", "EMP-1007", "self-review", null),
  review("R-004", "EMP-1010", "EMP-1002", "completed", 4, [
    ["Priya Nair", "2026-11-01", "Reliable and accurate. Next step: own the month-end close."],
  ]),
  review("R-005", "EMP-1013", "EMP-1006", "completed", 5, [
    ["Elena Petrova", "2026-10-28", "Exceeded the account target and mentors new joiners."],
  ]),
  review("R-006", "EMP-1004", "EMP-1001", "manager-review", null),
];

const TRAINING: Training[] = [
  { id: "T-001", employeeId: "EMP-1009", course: "Forklift certification", hours: 16, dueDate: "2026-10-15", completedOn: null },
  { id: "T-002", employeeId: "EMP-1007", course: "Workplace safety", hours: 4, dueDate: "2026-09-30", completedOn: "2026-09-24" },
  { id: "T-003", employeeId: "EMP-1008", course: "Inventory systems basics", hours: 8, dueDate: "2026-12-05", completedOn: null },
  { id: "T-004", employeeId: "EMP-1014", course: "Workplace safety", hours: 4, dueDate: "2026-11-30", completedOn: null },
  { id: "T-005", employeeId: "EMP-1004", course: "Leadership essentials", hours: 12, dueDate: "2026-11-20", completedOn: null },
  { id: "T-006", employeeId: "EMP-1011", course: "Data privacy", hours: 3, dueDate: "2026-10-31", completedOn: "2026-10-28" },
  { id: "T-007", employeeId: "EMP-1010", course: "Financial reporting update", hours: 6, dueDate: "2026-11-10", completedOn: null },
  { id: "T-008", employeeId: "EMP-1013", course: "Negotiation skills", hours: 8, dueDate: "2026-12-12", completedOn: null },
];

export const INITIAL_STATE: HrState = {
  employees: EMPLOYEES,
  attendance: ATTENDANCE,
  leave: LEAVE,
  goals: GOALS,
  reviews: REVIEWS,
  training: TRAINING,
  payrollFinalized: false,
};
