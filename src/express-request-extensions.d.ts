import winston from 'winston';
import mysql2 from 'mysql2/promise';

declare global {
  namespace Express {
    export interface Request {
      logger: winston.Logger;
      mysqlPool: mysql2.Pool;
    }
  }
}
