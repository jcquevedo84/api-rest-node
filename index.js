const Joi =require('joi')
const Sequelize =require('sequelize')
const Hapi = require('hapi');
const Inert = require("inert");
const Vision = require("vision");
const HapiSwagger = require("hapi-swagger");
const port = process.env.PORT || 3000;
const server = new Hapi.Server(
  {
    port
  }
);


(async () => {
  if (!process.env.POSTGRES_HOST) {
    throw Error(
      "process.env.POSTGRES_HOST must be a: user:pass@ipService:port ",
    );
  }
  const sequelize = new Sequelize(
    `postgres://${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DB || "personas"}`,
    {
      ssl: process.env.POSTGRES_SSL,
      dialectOptions: {
        ssl: process.env.POSTGRES_SSL,
      }, 
    }
  );
  await sequelize.authenticate();
  console.log("postgres is running");

  const Persona = sequelize.define("persona", {
    name: Sequelize.STRING,
    lastname: Sequelize.STRING,
  });

  await Persona.sync({ force: true });

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: "Node.js with Postgres Example - Erick Wendel",
          version: "1.0",
      },
      }
  },
  ]);

  server.route([
    {
      method: "GET",
      path: "/personas",
      handler: () => {
        return Persona.findAll();
      },
      config: {
        description: "List All personas",
        notes: "personas from database",
        tags: ["api"],
      },
    },
    {
      method: "POST",
      path: "/personas",
      config: {
        handler: (req) => {
          const { payload } = req;
          return Persona.create(payload);
        },
        description: "Create a persona",
        notes: "create a persona",
        tags: ["api"],
        validate: {
          payload: {
            name: Joi.string().required(),
            lastname: Joi.string().required(),
          },
        },
      },
    },

    {
      method: "DELETE",
      path: "/personas/{id}",
      config: {
        handler: (req) => {
          return Persona.destroy({ where: { id: req.params.id } });
        },
        description: "Delete a persona",
        notes: "Delete a persona",
        tags: ["api"],
        validate: {
          params: {
            id: Joi.string().required(),
          },
        },
      },
    },
  ]);

  await server.start();
  console.log("server running at", server.info.port);
})();
