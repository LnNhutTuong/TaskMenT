export const ROLE_NAME_DEFAULT = {
    SUPER_ADMIN: 'Super Admin',
    WORKSPACE_MANAGER: 'Workspace Manager',
    PROJECT_LEAD: 'Project Lead',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
}

export const PERMISSION_KEYS = {
    // ─── USER ─────────────────────────────────────
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    
    // ─── ROLE ─────────────────────────────────────
    ROLE_VIEW: 'role:view',
    ROLE_CREATE: 'role:create',
    ROLE_UPDATE: 'role:update',
    ROLE_DELETE: 'role:delete',

    // ─── WORKSPACE ─────────────────────────────────────
    WORKSPACE_VIEW: 'workspace:view',
    WORKSPACE_UPDATE: 'workspace:update',
    WORKSPACE_DELETE: 'workspace:delete',
    WORKSPACE_INVITE: 'workspace:invite',
    WORKSPACE_REMOVE_MEMBER: 'workspace:remove-member',
    WORKSPACE_MANAGE_MEMBERS: 'workspace:manage-members',

    // ─── PROJECT ──────────────────────────────────────
    PROJECT_VIEW: 'project:view',    
    PROJECT_CREATE: 'project:create',
    PROJECT_UPDATE: 'project:update',
    PROJECT_DELETE: 'project:delete',
    PROJECT_MANAGE_MEMBERS: 'project:manage-members',

    // ─── TASK ──────────────────────────────────────────
    TASK_VIEW: 'task:view',
    TASK_CREATE: 'task:create',
    TASK_UPDATE: 'task:update',
    TASK_DELETE: 'task:delete',
    TASK_ASSIGN: 'task:assign',
    TASK_VIEW_KEYRESULT: 'task:view-key-result',
    TASK_LINK_KEYRESULT: 'task:link-key-result',
    TASK_UNLINK_KEYRESULT: 'task:unlink-key-result',


    // ─── OUTPUT ────────────────────────────────────────
    OUTPUT_VIEW: 'output:view',
    OUTPUT_CREATE: 'output:create',
    OUTPUT_UPDATE: 'output:update',
    OUTPUT_DELETE: 'output:delete',

    // ─── EVIDENCE ──────────────────────────────────────
    EVIDENCE_VIEW: 'evidence:view',
    EVIDENCE_SUBMIT: 'evidence:submit',
    EVIDENCE_UPDATE: 'evidence:update',
    EVIDENCE_DELETE: 'evidence:delete',
    EVIDENCE_REVIEW: 'evidence:review',

    // ─── METRIC ────────────────────────────────────────
    METRIC_VIEW: 'metric:view',
    METRIC_CREATE: 'metric:create',
    METRIC_UPDATE: 'metric:update',
    METRIC_DELETE: 'metric:delete',

    // ─── FORMULA ───────────────────────────────────────
    FORMULA_VIEW: 'formula:view',
    FORMULA_CREATE: 'formula:create',
    FORMULA_UPDATE: 'formula:update',
    FORMULA_DELETE: 'formula:delete',
    FORMULA_ASSIGN_TASK: 'formula:assign-task',

    // ─── KPI ───────────────────────────────────────────
    KPI_VIEW: 'kpi:view',
    KPI_CALCULATE: 'kpi:calculate',

    // ─── OBJECTIVE ────────────────────────────────────
    OBJECTIVE_VIEW: 'objective:view',
    OBJECTIVE_CREATE: 'objective:create',
    OBJECTIVE_UPDATE: 'objective:update',
    OBJECTIVE_DELETE: 'objective:delete',

    // ─── KEY RESULT ───────────────────────────────────
    KEY_RESULT_VIEW: 'key-result:view',
    KEY_RESULT_CREATE: 'key-result:create',
    KEY_RESULT_UPDATE: 'key-result:update',
    KEY_RESULT_DELETE: 'key-result:delete',

    // ─── WORKFLOW ─────────────────────────────────────
    WORKFLOW_VIEW: 'workflow:view',
    WORKFLOW_CREATE: 'workflow:create',
    WORKFLOW_UPDATE: 'workflow:update',
    WORKFLOW_DELETE: 'workflow:delete',
};