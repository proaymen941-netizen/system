import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { Announcement, AnnouncementInput, AttendanceRecord, AuthResponse, CheckInInput, CheckOutInput, DailyReport, DashboardStats, Employee, EmployeeInput, EmployeeUpdate, ErrorResponse, GetDailyReportParams, GetMonthlyReportParams, HealthStatus, LeaveInput, LeaveRequest, ListAttendanceParams, ListEmployeesParams, ListLeavesParams, ListOvertimeParams, LiveAttendance, LoginInput, MessageResponse, MonthlyReport, OvertimeInput, OvertimeRequest, RejectInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getLoginUrl: () => string;
/**
 * @summary Login
 */
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<ErrorResponse>;
/**
* @summary Login
*/
export declare const useLogin: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export declare const getLogoutUrl: () => string;
/**
 * @summary Logout
 */
export declare const logout: (options?: RequestInit) => Promise<MessageResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
* @summary Logout
*/
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export declare const getGetMeUrl: () => string;
/**
 * @summary Get current user
 */
export declare const getMe: (options?: RequestInit) => Promise<Employee>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get current user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<ErrorResponse>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListEmployeesUrl: (params?: ListEmployeesParams) => string;
/**
 * @summary List all employees
 */
export declare const listEmployees: (params?: ListEmployeesParams, options?: RequestInit) => Promise<Employee[]>;
export declare const getListEmployeesQueryKey: (params?: ListEmployeesParams) => readonly ["/api/employees", ...ListEmployeesParams[]];
export declare const getListEmployeesQueryOptions: <TData = Awaited<ReturnType<typeof listEmployees>>, TError = ErrorType<unknown>>(params?: ListEmployeesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEmployees>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listEmployees>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListEmployeesQueryResult = NonNullable<Awaited<ReturnType<typeof listEmployees>>>;
export type ListEmployeesQueryError = ErrorType<unknown>;
/**
 * @summary List all employees
 */
export declare function useListEmployees<TData = Awaited<ReturnType<typeof listEmployees>>, TError = ErrorType<unknown>>(params?: ListEmployeesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listEmployees>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateEmployeeUrl: () => string;
/**
 * @summary Create employee
 */
export declare const createEmployee: (employeeInput: EmployeeInput, options?: RequestInit) => Promise<Employee>;
export declare const getCreateEmployeeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEmployee>>, TError, {
        data: BodyType<EmployeeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createEmployee>>, TError, {
    data: BodyType<EmployeeInput>;
}, TContext>;
export type CreateEmployeeMutationResult = NonNullable<Awaited<ReturnType<typeof createEmployee>>>;
export type CreateEmployeeMutationBody = BodyType<EmployeeInput>;
export type CreateEmployeeMutationError = ErrorType<unknown>;
/**
* @summary Create employee
*/
export declare const useCreateEmployee: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createEmployee>>, TError, {
        data: BodyType<EmployeeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createEmployee>>, TError, {
    data: BodyType<EmployeeInput>;
}, TContext>;
export declare const getGetEmployeeUrl: (id: number) => string;
/**
 * @summary Get employee by ID
 */
export declare const getEmployee: (id: number, options?: RequestInit) => Promise<Employee>;
export declare const getGetEmployeeQueryKey: (id: number) => readonly [`/api/employees/${number}`];
export declare const getGetEmployeeQueryOptions: <TData = Awaited<ReturnType<typeof getEmployee>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEmployee>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getEmployee>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetEmployeeQueryResult = NonNullable<Awaited<ReturnType<typeof getEmployee>>>;
export type GetEmployeeQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get employee by ID
 */
export declare function useGetEmployee<TData = Awaited<ReturnType<typeof getEmployee>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getEmployee>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateEmployeeUrl: (id: number) => string;
/**
 * @summary Update employee
 */
export declare const updateEmployee: (id: number, employeeUpdate: EmployeeUpdate, options?: RequestInit) => Promise<Employee>;
export declare const getUpdateEmployeeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEmployee>>, TError, {
        id: number;
        data: BodyType<EmployeeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateEmployee>>, TError, {
    id: number;
    data: BodyType<EmployeeUpdate>;
}, TContext>;
export type UpdateEmployeeMutationResult = NonNullable<Awaited<ReturnType<typeof updateEmployee>>>;
export type UpdateEmployeeMutationBody = BodyType<EmployeeUpdate>;
export type UpdateEmployeeMutationError = ErrorType<unknown>;
/**
* @summary Update employee
*/
export declare const useUpdateEmployee: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateEmployee>>, TError, {
        id: number;
        data: BodyType<EmployeeUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateEmployee>>, TError, {
    id: number;
    data: BodyType<EmployeeUpdate>;
}, TContext>;
export declare const getDeleteEmployeeUrl: (id: number) => string;
/**
 * @summary Delete/disable employee
 */
export declare const deleteEmployee: (id: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteEmployeeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEmployee>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteEmployee>>, TError, {
    id: number;
}, TContext>;
export type DeleteEmployeeMutationResult = NonNullable<Awaited<ReturnType<typeof deleteEmployee>>>;
export type DeleteEmployeeMutationError = ErrorType<unknown>;
/**
* @summary Delete/disable employee
*/
export declare const useDeleteEmployee: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteEmployee>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteEmployee>>, TError, {
    id: number;
}, TContext>;
export declare const getCheckInUrl: () => string;
/**
 * @summary Check in
 */
export declare const checkIn: (checkInInput: CheckInInput, options?: RequestInit) => Promise<AttendanceRecord>;
export declare const getCheckInMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkIn>>, TError, {
        data: BodyType<CheckInInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof checkIn>>, TError, {
    data: BodyType<CheckInInput>;
}, TContext>;
export type CheckInMutationResult = NonNullable<Awaited<ReturnType<typeof checkIn>>>;
export type CheckInMutationBody = BodyType<CheckInInput>;
export type CheckInMutationError = ErrorType<ErrorResponse>;
/**
* @summary Check in
*/
export declare const useCheckIn: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkIn>>, TError, {
        data: BodyType<CheckInInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof checkIn>>, TError, {
    data: BodyType<CheckInInput>;
}, TContext>;
export declare const getCheckOutUrl: () => string;
/**
 * @summary Check out
 */
export declare const checkOut: (checkOutInput: CheckOutInput, options?: RequestInit) => Promise<AttendanceRecord>;
export declare const getCheckOutMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkOut>>, TError, {
        data: BodyType<CheckOutInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof checkOut>>, TError, {
    data: BodyType<CheckOutInput>;
}, TContext>;
export type CheckOutMutationResult = NonNullable<Awaited<ReturnType<typeof checkOut>>>;
export type CheckOutMutationBody = BodyType<CheckOutInput>;
export type CheckOutMutationError = ErrorType<ErrorResponse>;
/**
* @summary Check out
*/
export declare const useCheckOut: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof checkOut>>, TError, {
        data: BodyType<CheckOutInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof checkOut>>, TError, {
    data: BodyType<CheckOutInput>;
}, TContext>;
export declare const getGetTodayAttendanceUrl: () => string;
/**
 * @summary Get today's attendance status for current user
 */
export declare const getTodayAttendance: (options?: RequestInit) => Promise<AttendanceRecord>;
export declare const getGetTodayAttendanceQueryKey: () => readonly ["/api/attendance/today"];
export declare const getGetTodayAttendanceQueryOptions: <TData = Awaited<ReturnType<typeof getTodayAttendance>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTodayAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTodayAttendance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTodayAttendanceQueryResult = NonNullable<Awaited<ReturnType<typeof getTodayAttendance>>>;
export type GetTodayAttendanceQueryError = ErrorType<unknown>;
/**
 * @summary Get today's attendance status for current user
 */
export declare function useGetTodayAttendance<TData = Awaited<ReturnType<typeof getTodayAttendance>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTodayAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAttendanceUrl: (params?: ListAttendanceParams) => string;
/**
 * @summary List attendance records
 */
export declare const listAttendance: (params?: ListAttendanceParams, options?: RequestInit) => Promise<AttendanceRecord[]>;
export declare const getListAttendanceQueryKey: (params?: ListAttendanceParams) => readonly ["/api/attendance", ...ListAttendanceParams[]];
export declare const getListAttendanceQueryOptions: <TData = Awaited<ReturnType<typeof listAttendance>>, TError = ErrorType<unknown>>(params?: ListAttendanceParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAttendance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAttendanceQueryResult = NonNullable<Awaited<ReturnType<typeof listAttendance>>>;
export type ListAttendanceQueryError = ErrorType<unknown>;
/**
 * @summary List attendance records
 */
export declare function useListAttendance<TData = Awaited<ReturnType<typeof listAttendance>>, TError = ErrorType<unknown>>(params?: ListAttendanceParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLiveAttendanceUrl: () => string;
/**
 * @summary Get live attendance (who is currently checked in)
 */
export declare const getLiveAttendance: (options?: RequestInit) => Promise<LiveAttendance>;
export declare const getGetLiveAttendanceQueryKey: () => readonly ["/api/attendance/live"];
export declare const getGetLiveAttendanceQueryOptions: <TData = Awaited<ReturnType<typeof getLiveAttendance>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiveAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLiveAttendance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLiveAttendanceQueryResult = NonNullable<Awaited<ReturnType<typeof getLiveAttendance>>>;
export type GetLiveAttendanceQueryError = ErrorType<unknown>;
/**
 * @summary Get live attendance (who is currently checked in)
 */
export declare function useGetLiveAttendance<TData = Awaited<ReturnType<typeof getLiveAttendance>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLiveAttendance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListLeavesUrl: (params?: ListLeavesParams) => string;
/**
 * @summary List leave requests
 */
export declare const listLeaves: (params?: ListLeavesParams, options?: RequestInit) => Promise<LeaveRequest[]>;
export declare const getListLeavesQueryKey: (params?: ListLeavesParams) => readonly ["/api/leaves", ...ListLeavesParams[]];
export declare const getListLeavesQueryOptions: <TData = Awaited<ReturnType<typeof listLeaves>>, TError = ErrorType<unknown>>(params?: ListLeavesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaves>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listLeaves>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListLeavesQueryResult = NonNullable<Awaited<ReturnType<typeof listLeaves>>>;
export type ListLeavesQueryError = ErrorType<unknown>;
/**
 * @summary List leave requests
 */
export declare function useListLeaves<TData = Awaited<ReturnType<typeof listLeaves>>, TError = ErrorType<unknown>>(params?: ListLeavesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listLeaves>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateLeaveUrl: () => string;
/**
 * @summary Submit leave request
 */
export declare const createLeave: (leaveInput: LeaveInput, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getCreateLeaveMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLeave>>, TError, {
        data: BodyType<LeaveInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createLeave>>, TError, {
    data: BodyType<LeaveInput>;
}, TContext>;
export type CreateLeaveMutationResult = NonNullable<Awaited<ReturnType<typeof createLeave>>>;
export type CreateLeaveMutationBody = BodyType<LeaveInput>;
export type CreateLeaveMutationError = ErrorType<unknown>;
/**
* @summary Submit leave request
*/
export declare const useCreateLeave: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createLeave>>, TError, {
        data: BodyType<LeaveInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createLeave>>, TError, {
    data: BodyType<LeaveInput>;
}, TContext>;
export declare const getGetLeaveUrl: (id: number) => string;
/**
 * @summary Get leave request by ID
 */
export declare const getLeave: (id: number, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getGetLeaveQueryKey: (id: number) => readonly [`/api/leaves/${number}`];
export declare const getGetLeaveQueryOptions: <TData = Awaited<ReturnType<typeof getLeave>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeave>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLeave>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLeaveQueryResult = NonNullable<Awaited<ReturnType<typeof getLeave>>>;
export type GetLeaveQueryError = ErrorType<unknown>;
/**
 * @summary Get leave request by ID
 */
export declare function useGetLeave<TData = Awaited<ReturnType<typeof getLeave>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeave>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getApproveLeaveUrl: (id: number) => string;
/**
 * @summary Approve leave request
 */
export declare const approveLeave: (id: number, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getApproveLeaveMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveLeave>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approveLeave>>, TError, {
    id: number;
}, TContext>;
export type ApproveLeaveMutationResult = NonNullable<Awaited<ReturnType<typeof approveLeave>>>;
export type ApproveLeaveMutationError = ErrorType<unknown>;
/**
* @summary Approve leave request
*/
export declare const useApproveLeave: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveLeave>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approveLeave>>, TError, {
    id: number;
}, TContext>;
export declare const getRejectLeaveUrl: (id: number) => string;
/**
 * @summary Reject leave request
 */
export declare const rejectLeave: (id: number, rejectInput?: RejectInput, options?: RequestInit) => Promise<LeaveRequest>;
export declare const getRejectLeaveMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectLeave>>, TError, {
        id: number;
        data?: BodyType<RejectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectLeave>>, TError, {
    id: number;
    data?: BodyType<RejectInput>;
}, TContext>;
export type RejectLeaveMutationResult = NonNullable<Awaited<ReturnType<typeof rejectLeave>>>;
export type RejectLeaveMutationBody = BodyType<RejectInput> | undefined;
export type RejectLeaveMutationError = ErrorType<unknown>;
/**
* @summary Reject leave request
*/
export declare const useRejectLeave: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectLeave>>, TError, {
        id: number;
        data?: BodyType<RejectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectLeave>>, TError, {
    id: number;
    data?: BodyType<RejectInput>;
}, TContext>;
export declare const getListOvertimeUrl: (params?: ListOvertimeParams) => string;
/**
 * @summary List overtime requests
 */
export declare const listOvertime: (params?: ListOvertimeParams, options?: RequestInit) => Promise<OvertimeRequest[]>;
export declare const getListOvertimeQueryKey: (params?: ListOvertimeParams) => readonly ["/api/overtime", ...ListOvertimeParams[]];
export declare const getListOvertimeQueryOptions: <TData = Awaited<ReturnType<typeof listOvertime>>, TError = ErrorType<unknown>>(params?: ListOvertimeParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOvertime>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOvertime>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOvertimeQueryResult = NonNullable<Awaited<ReturnType<typeof listOvertime>>>;
export type ListOvertimeQueryError = ErrorType<unknown>;
/**
 * @summary List overtime requests
 */
export declare function useListOvertime<TData = Awaited<ReturnType<typeof listOvertime>>, TError = ErrorType<unknown>>(params?: ListOvertimeParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOvertime>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateOvertimeUrl: () => string;
/**
 * @summary Submit overtime request
 */
export declare const createOvertime: (overtimeInput: OvertimeInput, options?: RequestInit) => Promise<OvertimeRequest>;
export declare const getCreateOvertimeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOvertime>>, TError, {
        data: BodyType<OvertimeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createOvertime>>, TError, {
    data: BodyType<OvertimeInput>;
}, TContext>;
export type CreateOvertimeMutationResult = NonNullable<Awaited<ReturnType<typeof createOvertime>>>;
export type CreateOvertimeMutationBody = BodyType<OvertimeInput>;
export type CreateOvertimeMutationError = ErrorType<unknown>;
/**
* @summary Submit overtime request
*/
export declare const useCreateOvertime: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOvertime>>, TError, {
        data: BodyType<OvertimeInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createOvertime>>, TError, {
    data: BodyType<OvertimeInput>;
}, TContext>;
export declare const getApproveOvertimeUrl: (id: number) => string;
/**
 * @summary Approve overtime request
 */
export declare const approveOvertime: (id: number, options?: RequestInit) => Promise<OvertimeRequest>;
export declare const getApproveOvertimeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveOvertime>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approveOvertime>>, TError, {
    id: number;
}, TContext>;
export type ApproveOvertimeMutationResult = NonNullable<Awaited<ReturnType<typeof approveOvertime>>>;
export type ApproveOvertimeMutationError = ErrorType<unknown>;
/**
* @summary Approve overtime request
*/
export declare const useApproveOvertime: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveOvertime>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approveOvertime>>, TError, {
    id: number;
}, TContext>;
export declare const getRejectOvertimeUrl: (id: number) => string;
/**
 * @summary Reject overtime request
 */
export declare const rejectOvertime: (id: number, rejectInput?: RejectInput, options?: RequestInit) => Promise<OvertimeRequest>;
export declare const getRejectOvertimeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectOvertime>>, TError, {
        id: number;
        data?: BodyType<RejectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rejectOvertime>>, TError, {
    id: number;
    data?: BodyType<RejectInput>;
}, TContext>;
export type RejectOvertimeMutationResult = NonNullable<Awaited<ReturnType<typeof rejectOvertime>>>;
export type RejectOvertimeMutationBody = BodyType<RejectInput> | undefined;
export type RejectOvertimeMutationError = ErrorType<unknown>;
/**
* @summary Reject overtime request
*/
export declare const useRejectOvertime: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rejectOvertime>>, TError, {
        id: number;
        data?: BodyType<RejectInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rejectOvertime>>, TError, {
    id: number;
    data?: BodyType<RejectInput>;
}, TContext>;
export declare const getListAnnouncementsUrl: () => string;
/**
 * @summary List announcements
 */
export declare const listAnnouncements: (options?: RequestInit) => Promise<Announcement[]>;
export declare const getListAnnouncementsQueryKey: () => readonly ["/api/announcements"];
export declare const getListAnnouncementsQueryOptions: <TData = Awaited<ReturnType<typeof listAnnouncements>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAnnouncements>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAnnouncements>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAnnouncementsQueryResult = NonNullable<Awaited<ReturnType<typeof listAnnouncements>>>;
export type ListAnnouncementsQueryError = ErrorType<unknown>;
/**
 * @summary List announcements
 */
export declare function useListAnnouncements<TData = Awaited<ReturnType<typeof listAnnouncements>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAnnouncements>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateAnnouncementUrl: () => string;
/**
 * @summary Create announcement
 */
export declare const createAnnouncement: (announcementInput: AnnouncementInput, options?: RequestInit) => Promise<Announcement>;
export declare const getCreateAnnouncementMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAnnouncement>>, TError, {
        data: BodyType<AnnouncementInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAnnouncement>>, TError, {
    data: BodyType<AnnouncementInput>;
}, TContext>;
export type CreateAnnouncementMutationResult = NonNullable<Awaited<ReturnType<typeof createAnnouncement>>>;
export type CreateAnnouncementMutationBody = BodyType<AnnouncementInput>;
export type CreateAnnouncementMutationError = ErrorType<unknown>;
/**
* @summary Create announcement
*/
export declare const useCreateAnnouncement: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAnnouncement>>, TError, {
        data: BodyType<AnnouncementInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAnnouncement>>, TError, {
    data: BodyType<AnnouncementInput>;
}, TContext>;
export declare const getDeleteAnnouncementUrl: (id: number) => string;
/**
 * @summary Delete announcement
 */
export declare const deleteAnnouncement: (id: number, options?: RequestInit) => Promise<MessageResponse>;
export declare const getDeleteAnnouncementMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAnnouncement>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAnnouncement>>, TError, {
    id: number;
}, TContext>;
export type DeleteAnnouncementMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAnnouncement>>>;
export type DeleteAnnouncementMutationError = ErrorType<unknown>;
/**
* @summary Delete announcement
*/
export declare const useDeleteAnnouncement: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAnnouncement>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAnnouncement>>, TError, {
    id: number;
}, TContext>;
export declare const getGetDashboardStatsUrl: () => string;
/**
 * @summary Get dashboard statistics
 */
export declare const getDashboardStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetDashboardStatsQueryKey: () => readonly ["/api/reports/dashboard"];
export declare const getGetDashboardStatsQueryOptions: <TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDashboardStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getDashboardStats>>>;
export type GetDashboardStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetDashboardStats<TData = Awaited<ReturnType<typeof getDashboardStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDashboardStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMonthlyReportUrl: (params: GetMonthlyReportParams) => string;
/**
 * @summary Get monthly attendance report
 */
export declare const getMonthlyReport: (params: GetMonthlyReportParams, options?: RequestInit) => Promise<MonthlyReport>;
export declare const getGetMonthlyReportQueryKey: (params?: GetMonthlyReportParams) => readonly ["/api/reports/monthly", ...GetMonthlyReportParams[]];
export declare const getGetMonthlyReportQueryOptions: <TData = Awaited<ReturnType<typeof getMonthlyReport>>, TError = ErrorType<unknown>>(params: GetMonthlyReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMonthlyReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMonthlyReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMonthlyReportQueryResult = NonNullable<Awaited<ReturnType<typeof getMonthlyReport>>>;
export type GetMonthlyReportQueryError = ErrorType<unknown>;
/**
 * @summary Get monthly attendance report
 */
export declare function useGetMonthlyReport<TData = Awaited<ReturnType<typeof getMonthlyReport>>, TError = ErrorType<unknown>>(params: GetMonthlyReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMonthlyReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDailyReportUrl: (params: GetDailyReportParams) => string;
/**
 * @summary Get daily attendance report
 */
export declare const getDailyReport: (params: GetDailyReportParams, options?: RequestInit) => Promise<DailyReport>;
export declare const getGetDailyReportQueryKey: (params?: GetDailyReportParams) => readonly ["/api/reports/daily", ...GetDailyReportParams[]];
export declare const getGetDailyReportQueryOptions: <TData = Awaited<ReturnType<typeof getDailyReport>>, TError = ErrorType<unknown>>(params: GetDailyReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDailyReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDailyReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDailyReportQueryResult = NonNullable<Awaited<ReturnType<typeof getDailyReport>>>;
export type GetDailyReportQueryError = ErrorType<unknown>;
/**
 * @summary Get daily attendance report
 */
export declare function useGetDailyReport<TData = Awaited<ReturnType<typeof getDailyReport>>, TError = ErrorType<unknown>>(params: GetDailyReportParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDailyReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map