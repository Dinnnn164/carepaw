const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CarePaw API',
      version: '1.0.0',
      description: 'API платформи допомоги безпритульним тваринам CarePaw',
    },
    servers: [
    { url: 'https://carepaw-production.up.railway.app', description: 'Production' },
    { url: 'http://localhost:5000', description: 'Local' }
],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);