declare global {
  namespace Express {
    interface Request {
      auth: any;
    }
  }
}
export {};
