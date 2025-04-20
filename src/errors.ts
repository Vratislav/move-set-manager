//AppErrors
export class AppError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class SetIndexTakenError extends AppError {
  constructor(message: string) {
    super(message);
  }
}

export class SetIndexOutOfRangeError extends AppError {
  constructor(message: string) {
    super(message);
  }
}

export class SetColorOutOfRangeError extends AppError {
  constructor(message: string) {
    super(message);
  }
}
