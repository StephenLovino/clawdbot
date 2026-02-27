function extractBoomDetails(err) {
  if (!err || typeof err !== "object") {
    return null;
  }
  const output = err?.output;
  if (!output || typeof output !== "object") {
    return null;
  }
  const payload = output.payload;
  const statusCode =
    typeof output.statusCode === "number"
      ? output.statusCode
      : typeof payload?.statusCode === "number"
        ? payload.statusCode
        : undefined;
  const error = typeof payload?.error === "string" ? payload.error : undefined;
  const message = typeof payload?.message === "string" ? payload.message : undefined;
  if (!statusCode && !error && !message) {
    return null;
  }
  return { statusCode, error, message };
}

function getStatusCode(err) {
  const boom =
    extractBoomDetails(err) ??
    extractBoomDetails(err?.error) ??
    extractBoomDetails(err?.lastDisconnect?.error);
  if (typeof boom?.statusCode === "number") {
    return boom.statusCode;
  }
  return err?.output?.statusCode ?? err?.status;
}

function safeStringify(value, _limit = 800) {
  return JSON.stringify(value);
}

function formatError(err) {
  if (typeof err === "string") {
    return err;
  }
  if (!err || typeof err !== "object") {
    return String(err);
  }

  // Baileys frequently wraps errors under `error` with a Boom-like shape.
  const boom =
    extractBoomDetails(err) ??
    extractBoomDetails(err?.error) ??
    extractBoomDetails(err?.lastDisconnect?.error);

  const status = boom?.statusCode ?? getStatusCode(err);
  const code = err?.code;
  const codeText = typeof code === "string" || typeof code === "number" ? String(code) : undefined;

  const messageCandidates = [
    boom?.message,
    typeof err?.message === "string" ? err.message : undefined,
    typeof err?.error?.message === "string" ? err.error.message : undefined,
  ].filter((v) => Boolean(v && v.trim().length > 0));
  const message = messageCandidates[0];

  const pieces = [];
  if (typeof status === "number") {
    pieces.push(`status=${status}`);
  }
  if (boom?.error) {
    pieces.push(boom.error);
  }
  if (message) {
    pieces.push(message);
  }
  if (codeText) {
    pieces.push(`code=${codeText}`);
  }

  if (pieces.length > 0) {
    return pieces.join(" ");
  }
  return safeStringify(err);
}

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
