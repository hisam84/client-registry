export interface MailServiceSettings {
  masterEnabled: boolean;
  taskAssignment: boolean;
  passwordReset: boolean;
  taskOverdue: boolean;
  taskDueSoon: boolean;
  taskCompletion: boolean;
}

export const DEFAULT_MAIL_SETTINGS: MailServiceSettings = {
  masterEnabled: true,
  taskAssignment: true,
  passwordReset: true,
  taskOverdue: true,
  taskDueSoon: true,
  taskCompletion: true,
};
