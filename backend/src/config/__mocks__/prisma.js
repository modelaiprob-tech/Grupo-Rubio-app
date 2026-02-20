const prisma = {
  festivo: {
    findFirst: jest.fn()
  },
  asignacion: {
    findMany: jest.fn(),
    update: jest.fn()
  },
  registroHoras: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  trabajador: {
    findUnique: jest.fn()
  }
};

module.exports = prisma;
