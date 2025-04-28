// @ts-nocheck
import { FastifyInstance } from "fastify";
import {} from "@prisma/client";
import { client } from "../libs/prisma";
import { gerarNumeroSenha } from "../utils/gerarNumeroSenha";

export async function senhasRoutes(app: FastifyInstance) {
  {
    app.post("/emitir", async (req, reply) => {
      try {
        const { tipo } = req.body;
        const numero = gerarNumeroSenha(tipo);
        const senha = await client.senha.create({
          data: {
            numero: numero,
            tipo: tipo,
          },
        });

        console.log(`Senha ${numero} gerada com sucesso!`);
        reply.status(201).send({ senha });
      } catch (error) {
        console.log(`Erro ao emitir senha: ${error}`);
        return reply.status(500).send({ error: "Erro ao emitir senha." });
      }
    });
    app.post("/chamar", (req, reply) => {
      try {
        // Lógica de prioridade [SP] -> [SE, SG] -> [SP] -> [SE, SG]
        const ultimaSenhaChamada = await client.senha.findFirst({
          where: {
            atendido: true,
          },
          orderBy: {
            dataAtendimento: "desc",
          },
        });

        let proximoTipo = "SP";
        if (ultimaSenhaChamada) {
          if (ultimaSenhaChamada.tipo === "SP") {
            proximoTipo = ["SE", "SG"];
          }
        }

        const proximaSenha = await client.senha.findFirst({
          where: {
            tipo: proximoTipo,
            atendida: false,
          },
          orderBy: {
            dataEmissao: "asc",
          },
        });

        if (!proximaSenha && Array.isArray(proximoTipo)) {
          // Se não encontrar SE ou SG, busca SP
          return await client.senha.findFirst({
            where: {
              tipo: "SP",
              atendida: false,
            },
            orderBy: {
              dataEmissao: "asc",
            },
          });
        }
        if (!proximaSenha) {
          return res.status(404).json({ message: "Não há senhas na fila." });
        }

        // Lógica para atualizar a senha ao ser chamada (ex: atribuir guichê, hora de atendimento)
        proximaSenha.guiche = req.body.guiche; // Guichê que está chamando
        proximaSenha.horaAtendimento = moment().format("HH:mm:ss");
        proximaSenha.dataAtendimento = moment().format("YYYY-MM-DD");
        proximaSenha.atendida = true;
        await proximaSenha.save();

        logger.info(
          `Senha ${proximaSenha.numero} chamada para o guichê ${req.body.guiche}.`
        );
        return res.send(proximaSenha);
      } catch (error) {
        logger.error(`Erro ao chamar próxima senha: ${error}`);
        return res.status(500).send({ error: "Erro ao chamar próxima senha." });
      }
    });
    app.get("/listar", (req, reply) => {
      try {
        const senhas = await client.senha.findMany();
        return res.json(senhas);
      } catch (error) {
        logger.error(`Erro ao listar senhas: ${error}`);
        return res.status(500).send({ error: "ROTA NÃO FEITA" });
      }
    });
    app.post("/relatorio/diario", (req, reply) => {
      try {
        const now = moment();
        const inicioDia = now.clone().startOf('day').toDate();
        const fimDia = now.clone().endOf('day').toDate();

        const relatorio = {
            totalEmitidas: await prisma.senha.count({
                where: {
                    dataEmissao: {
                        gte: inicioDia,
                        lte: fimDia
                    }
                }
            }),
            totalAtendidas: await prisma.senha.count({
                where: {
                    dataAtendimento: {
                        gte: inicioDia,
                        lte: fimDia
                    }
                }
            }),
            emitidasPorPrioridade: await prisma.senha.count({
                where: {
                    dataEmissao: {
                        gte: inicioDia,
                        lte: fimDia
                    },
                    tipo: req.body.tipo
                }
            }),
            atendidasPorPrioridade: await prisma.senha.count({
                where: {
                    dataAtendimento: {
                        gte: inicioDia,
                        lte: fimDia
                    },
                    tipo: req.body.tipo
                }
            }),
            detalhado: await prisma.senha.findMany({
                where: {
                    dataEmissao: {
                        gte: inicioDia,
                        lte: fimDia
                    }
                }
            }),
        };

        return res.status(200).send(relatorio);
    } catch (error) {
        logger.error(`Erro ao gerar relatório diário: ${error}`);
        return res.status(500).send({ error: "Erro ao gerar relatório diário." });
    }
    });
    app.post("/relatorio/mensal", (req, reply) => {
      try {
        const now = moment();
        const inicioMes = now.clone().startOf("month").toDate();
        const fimMes = now.clone().endOf("month").toDate();

        const relatorio = {
          totalEmitidas: await prisma.senha.count({
            where: {
              dataEmissao: {
                gte: inicioMes,
                lte: fimMes,
              },
            },
          }),
          totalAtendidas: await prisma.senha.count({
            where: {
              dataAtendimento: {
                gte: inicioMes,
                lte: fimMes,
              },
            },
          }),
          emitidasPorPrioridade: await prisma.senha.count({
            where: {
              dataEmissao: {
                gte: inicioMes,
                lte: fimMes,
              },
              tipo: req.body.tipo,
            },
          }),
          atendidasPorPrioridade: await prisma.senha.count({
            where: {
              dataAtendimento: {
                gte: inicioMes,
                lte: fimMes,
              },
              tipo: req.body.tipo,
            },
          }),
          detalhado: await prisma.senha.findMany({
            where: {
              dataEmissao: {
                gte: inicioMes,
                lte: fimMes,
              },
            },
          }),
        };

        return res.status(200).send(relatorio);
      } catch (error) {
        logger.error(`Erro ao gerar relatório mensal: ${error}`);
        return res
          .status(500)
          .send({ error: "Erro ao gerar relatório mensal." });
      }
    });
  }
}
