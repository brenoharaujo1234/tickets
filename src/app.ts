import fastify from "fastify";
import { senhasRoutes } from "./routes/senhas";

const app = fastify()

app.register(senhasRoutes)

app.listen({ port: 3333 }).then(() => {
  console.log("Server running in localhost:3333")
})