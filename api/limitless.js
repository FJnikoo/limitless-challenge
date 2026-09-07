const UPSTREAM = "https://api.limitless.exchange";

function isAllowedPath(path) {
  if (path === "/ugm/esports/matches") return true;

  if (path === "/ugm/football-live/fixtures") return true;

  if (path === "/markets/active") return true;

  if (
    /^\/ugm\/football-live\/fixtures\/[^/]+\/availability$/.test(path)
  ) {
    return true;
  }

  if (
    /^\/ugm\/esports\/matches\/[^/]+\/availability$/.test(path)
  ) {
    return true;
  }

  return false;
}

function sendJson(res, status, payload) {
  res.status(status).json(payload);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return sendJson(res, 405, {
      error: "Method not allowed"
    });
  }

  const path = typeof req.query.path === "string"
    ? req.query.path
    : "";

  if (!isAllowedPath(path)) {
    return sendJson(res, 400, {
      error: "Unsupported Limitless API path",
      path
    });
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(req.query)) {
    if (key === "path") continue;

    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (typeof value === "string") {
      params.set(key, value);
    }
  }

  const targetUrl = `${UPSTREAM}${path}${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "limitless-challenge/1.0"
      },
      cache: "no-store"
    });

    const body = await upstream.text();

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ||
        "application/json; charset=utf-8"
    );

    return res.status(upstream.status).send(body);
  } catch (error) {
    return sendJson(res, 502, {
      error: "Could not reach Limitless API",
      detail: String(error)
    });
  }
}
