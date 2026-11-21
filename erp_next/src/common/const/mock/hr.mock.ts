import { countWorkingDays, toMinutes } from "@/lib/date";
import { DEMO_TODAY } from "../app.const";
import { HOLIDAYS, SHIFTS } from "../hr.const";
import type {
  AttendanceRecord,
  Contract,
  Department,
  Employee,
  Goal,
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
const GOALS: Goal[] = [
  { id: "G-001", employeeId: "EMP-1004", title: "Cut stock-count variance below 1%", due: "2026-12-31", progress: 60 },
  { id: "G-002", employeeId: "EMP-1007", title: "Complete warehouse re-layout", due: "2026-11-30", progress: 85 },
  { id: "G-003", employeeId: "EMP-1008", title: "Introduce weekly cycle counts", due: "2026-10-31", progress: 70 },
  { id: "G-004", employeeId: "EMP-1010", title: "Shorten month-end close to 5 days", due: "2026-12-15", progress: 40 },
  { id: "G-005", employeeId: "EMP-1013", title: "Win 10 new accounts", due: "2026-12-31", progress: 100 },
  { id: "G-006", employeeId: "EMP-1011", title: "Digitise personnel files", due: "2027-03-31", progress: 20 },
];

const REVIEWS: Review[] = [
  { id: "R-001", employeeId: "EMP-1007", reviewerId: "EMP-1004", cycle: "H2 2026", stage: "manager-review", rating: null },
  { id: "R-002", employeeId: "EMP-1008", reviewerId: "EMP-1004", cycle: "H2 2026", stage: "self-review", rating: null },
  { id: "R-003", employeeId: "EMP-1009", reviewerId: "EMP-1007", cycle: "H2 2026", stage: "self-review", rating: null },
  { id: "R-004", employeeId: "EMP-1010", reviewerId: "EMP-1002", cycle: "H2 2026", stage: "completed", rating: 4 },
  { id: "R-005", employeeId: "EMP-1013", reviewerId: "EMP-1006", cycle: "H2 2026", stage: "completed", rating: 5 },
  { id: "R-006", employeeId: "EMP-1004", reviewerId: "EMP-1001", cycle: "H2 2026", stage: "manager-review", rating: null },
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
