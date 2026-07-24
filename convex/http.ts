import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { ingestHttp } from "./datalake";
import { ingestHttp as forecastIngestHttp } from "./forecast";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({ path: "/datalake/ingest", method: "POST", handler: ingestHttp });
http.route({ path: "/forecast/ingest", method: "POST", handler: forecastIngestHttp });

export default http;
