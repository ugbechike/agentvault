export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly todo: string | undefined;

  constructor(statusCode: number, code: string, message: string, todo?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.todo = todo;
  }
}

export class NotImplementedError extends AppError {
  constructor(message: string, todo: string) {
    super(501, "NOT_IMPLEMENTED", message, todo);
    this.name = "NotImplementedError";
  }
}

export class ValidationError extends AppError {
  readonly issues: readonly { path: string; message: string }[];

  constructor(issues: readonly { path: string; message: string }[]) {
    super(400, "VALIDATION_ERROR", "Request validation failed.");
    this.name = "ValidationError";
    this.issues = issues;
  }
}
