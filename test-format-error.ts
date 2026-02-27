import { formatError } from "./src/web/session.js";

const payload = {
  error: {
    data: { reason: "401", location: "cln" },
    isBoom: true,
    isServer: false,
    output: {
      statusCode: 401,
      payload: {
        statusCode: 401,
        error: "Unauthorized",
        message: "Connection Failure",
      },
      headers: {},
    },
  },
  date: "2026-02-27T01:26:11.513Z",
};

console.log(formatError(payload));
