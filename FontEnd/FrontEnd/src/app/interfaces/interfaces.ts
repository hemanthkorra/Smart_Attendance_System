// --- User Interface ---
// Represents the structure of a User object, typically returned from profile endpoints or login.
export interface User {
  id: number;
  username: string;
  fullName: string; // Note: camelCase for frontend, as per your console log
  email: string;
  department: string;
  role: string;
  employeeId: string; // Note: camelCase for frontend
  // passwordHash?: string; // Sensitive, usually not sent to frontend
  // createdAt?: Date; // Optional if not always needed
}

// --- Login Request Payload Interface ---
// Represents the data sent when a user tries to log in.
export interface LoginCredentials {
  username: string;
  password: string;
}

// --- Login Response Interface ---
// Represents the full response object from your backend's login API.
// Assuming your backend returns the User object directly on successful login.
export interface LoginResponse extends User {
  // If your backend returns other properties specifically for login (e.g., a token), add them here:
  // token: string;
  // refreshToken: string;
}

// --- Attendance Report Interfaces ---
export interface AttendanceRecordItem {
  id: number;
  date: string; // Or Date, if you parse it. String is common for API response.
  status: string;
  checkInTime: string | null; // Can be null if not checked in
  checkOutTime: string | null; // Can be null if not checked out
}

export interface AttendanceReport {
  totalDays: number;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  records: AttendanceRecordItem[];
}

// --- Leave Request DTO/Payload Interface ---
export interface LeaveRequestPayload {
  userId: number;
  startDate: string; // Or Date
  endDate: string;   // Or Date
  reason: string;
  status?: string; // 'Pending', 'Approved', 'Rejected' - status is usually set by backend initially
}

// --- Leave Request History Item Interface ---
export interface LeaveRequestHistoryItem {
  id: number;
  startDate: string; // Or Date
  endDate: string;   // Or Date
  reason: string;
  status: string;
}

export type UserRole = 'Admin' | 'User';

export interface LoginResponse {
  id: number;
  username: string;
  role: string; // Ensure role is here
  fullName: string;
  email: string;
}

export interface RegisterRequest {
  employeeId: string;
  username: string;
  fullName: string;
  email: string;
  department?: string;
  role: string;
  passwordHash?: string; // This will be set in backend
  password: string; // For frontend input
  faceImageBase64: string;
}

export interface EditUserRequest {
  username: string;
  role: string;
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
}

export interface UpdatePasswordRequest {
  newPassword: string;
}

export interface AttendanceRecord {
  id: number;
  date: Date;
  status: string;
  checkInTime: string; // Assuming time as string
  checkOutTime: string; // Assuming time as string
  fullName: string; // From User
  employeeId: string; // From User
  department: string; // From User
}

export interface LeaveRequest {
  id: number;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: string;
  employeeName: string;
  employeeId: string;
  department: string;
}
