import type { NextFunction, Request, Response } from 'express'

export function asyncHandler<
  TRequest extends Request = Request,
  TResponse extends Response = Response,
>(
  handler: (request: TRequest, response: TResponse, next: NextFunction) => Promise<unknown>,
) {
  return (request: TRequest, response: TResponse, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next)
  }
}
