import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { ingestHttp } from "./datalake";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({ path: "/datalake/ingest", method: "POST", handler: ingestHttp });

export default http;
