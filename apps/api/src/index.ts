import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { registerCourseRoutes } from "./routes/courses";
import { registerMetaRoutes } from "./routes/meta";
import { registerReviewRoutes } from "./routes/reviews";
import { registerSearchRoutes } from "./routes/search";
import { registerTeacherRoutes } from "./routes/teachers";
import type { AppBindings } from "./types";

const app = new OpenAPIHono<AppBindings>();

app.use("*", secureHeaders());
app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "OPTIONS"],
  }),
);

app.get("/", (c) => c.redirect("/docs"));

registerMetaRoutes(app);
registerSearchRoutes(app);
registerTeacherRoutes(app);
registerCourseRoutes(app);
registerReviewRoutes(app);

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Huoshui Mirror API",
    version: "0.1.0",
    description: "Read-only API for the Huoshui teacher/course review mirror dataset.",
  },
});

app.get(
  "/docs",
  apiReference({
    spec: { url: "/openapi.json" },
    theme: "kepler",
  }),
);

export default app;
