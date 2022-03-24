import express from "express";
import dotenv from 'dotenv';
dotenv.config();
import winston from 'winston';
import mysql2 from 'mysql2/promise';
import ToDoAPI from './api/todo';
import fetch from 'node-fetch';

async function main() {
  let logTransports : winston.transport[] = [
    // More configuration options for File transport
    // https://github.com/winstonjs/winston/blob/master/docs/transports.md#file-transport
    new winston.transports.File({
      filename: process.env.LOGFILE || 'file.log',
    }),
  ];

  if (process.env.NODE_ENV !== 'production') {
    logTransports.push(new winston.transports.Console({}));
  }

  // More options
  // https://github.com/winstonjs/winston#creating-your-own-logger
  let logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: logTransports,
    handleExceptions: true,
    handleRejections: true,
  });

  process.on('uncaughtException', function(err: Error) {
    console.log(err);
    logger.error(JSON.stringify(err), () => {
      process.exit(1);
    });
  });

  const mysqlPool = mysql2.createPool({
    host: process.env.MYSQL_HOST || '',
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || '',
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || "10"),
    waitForConnections: true,
  });

  // This statement forces library to create connection and actually test if
  // credentials are working.
  await mysqlPool.query("SELECT 1 `ping`");

  let app = express();

  app.use(function(req, _, next) {
    req.logger = logger;
    req.mysqlPool = mysqlPool;
    next();
  });

  app.use(express.text());
  app.use(express.json({}));
  app.use(express.urlencoded({ extended: true }));
  app.use('/todo', ToDoAPI);
  app.get('/fetch', async function(_, res) {
    const response = await fetch('http://example.com')
    const text = await response.text()
    res.setHeader('Content-Type', 'text/html').status(200).end(text);
  })
  app.use(function(err: Error, req: express.Request, res: express.Response, _: express.NextFunction) {
    if (err) {
      logger.error(`Unhandled error ${req.method} ${req.originalUrl}: ${JSON.stringify(err)}`);
      res.status(500).json({error: 'internal_server_error'});
    }
  });

  const port = parseInt(process.env.HTTP_PORT || "8081");

  app.listen(port, () => {
    logger.warn(`Started listening on a port ${port}`);
  });
}
main();
