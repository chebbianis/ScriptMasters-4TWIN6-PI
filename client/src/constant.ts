// @ts-ignore-unused-export
export enum Permissions {
    // Permissions existantes
    CREATE_PROJECT = 'CREATE_PROJECT',
    EDIT_PROJECT = 'EDIT_PROJECT',
    DELETE_PROJECT = 'DELETE_PROJECT',
    CREATE_TASK = 'CREATE_TASK',
    EDIT_TASK = 'EDIT_TASK',
    DELETE_TASK = 'DELETE_TASK',

    // Permissions pour les membres
    VIEW_MEMBERS = 'VIEW_MEMBERS',
    INVITE_MEMBER = 'INVITE_MEMBER',
    REMOVE_MEMBER = 'REMOVE_MEMBER',
    EDIT_MEMBER_ROLE = 'EDIT_MEMBER_ROLE',

    // Permissions pour le workspace
    EDIT_WORKSPACE = 'EDIT_WORKSPACE',
    DELETE_WORKSPACE = 'DELETE_WORKSPACE',

    // Ajoutez ces permissions
    CREATE_WORKSPACE = 'CREATE_WORKSPACE',
    MANAGE_WORKSPACE_SETTINGS = 'MANAGE_WORKSPACE_SETTINGS',
    VIEW_ONLY = 'VIEW_ONLY'
}

// Ajouter une carte de permissions par rôle
export const RolePermissions = {
    ADMIN: [
        // Toutes les permissions...
        Permissions.INVITE_MEMBER,
        // ... autres permissions
    ],
    PROJECT_MANAGER: [
        // Permissions limitées incluant l'invitation
        Permissions.INVITE_MEMBER,
        // ... autres permissions appropriées
    ],
    DEVELOPER: [
        // Permissions limitées sans l'invitation
        // ... autres permissions appropriées
    ]
};

// Ajouter les enums pour les tâches
export enum TaskStatusEnum {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    REVIEW = 'REVIEW',
    DONE = 'DONE'
}

export enum TaskPriorityEnum {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
} 