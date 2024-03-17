class FailedError extends Error {
  constructor(msg: string) {
    super('FailedError: ' + msg);
  }
}

class NotFoundError extends Error {
  constructor(msg: string) {
    super('NotFoundError: ' + msg);
  }
}

class NetworkError extends Error {
  constructor(msg: string) {
    super('NetworkError: ' + msg);
  }
}

class UnexpectedApiError extends Error {
  constructor(msg: string) {
    super('UnexpectedApiError: ' + msg);
  }
}

class NotEnoughAssetsError extends Error {
  constructor(msg: string) {
    super('NotEnoughAssetsError: ' + msg);
  }
}

class NotEnoughValidBoxesError extends Error {
  constructor(msg: string) {
    super('NotEnoughValidBoxesError: ' + msg);
  }
}

class ImpossibleBehavior extends Error {
  constructor(msg: string) {
    super('ImpossibleBehavior: ' + msg);
  }
}

class ValueError extends Error {
  constructor(msg: string) {
    super('ValueError: ' + msg);
  }
}

class MaxParallelTxError extends Error {
  constructor(msg: string) {
    super('MaxParallelTxError: ' + msg);
  }
}

export {
  FailedError,
  ImpossibleBehavior,
  NetworkError,
  NotEnoughAssetsError,
  NotEnoughValidBoxesError,
  NotFoundError,
  UnexpectedApiError,
  ValueError,
  MaxParallelTxError,
};
