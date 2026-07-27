const { login, register } = require("../controllers/auth.controller");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
jest.mock("bcryptjs");
jest.mock("../models/User");

test("Should return 400 when email and password are missing", async () => {
  const req = {
    body: {},
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  await login(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Email and password are required",
  });
});

test("Should return 404 if user does not exist", async () => {
  const req = {
    body: {
      email: "test@gmail.com",
      password: "password123",
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  User.findOne.mockResolvedValue(null);
  await login(req, res);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "User not found",
  });
});

test("Should return 401 if password is invalid", async () => {
  const req = {
    body: {
      email: "user@gmail.com",
      password: "password",
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  User.findOne.mockResolvedValue({
    email: "user@gmail.com",
    password: "password",
  });
  bcrypt.compare.mockResolvedValue(false);
  await login(req, res);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Invalid email or password",
  });
});

test("Should return 403 if the role is not authorized", async () => {
  const req = {
    body: {
      email: "user@gmail.com",
      password: "password",
      role: "student",
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  User.findOne.mockResolvedValue({
    email: "user@gmail.com",
    password: "password",
    role: "alumni",
  });
  bcrypt.compare.mockResolvedValue(true);
  await login(req, res);
  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Invalid role",
  });
});

// Testing for register
test("Should return 400 if user details are missing", async () => {
  const req = {
    body: {},
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  await register(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "All required fields must be filled",
  });
});

test("Should return 400 if role is missed", async () => {
  const req = {
    body: {
      name: "user",
      email: "user@gmail.com",
      password: "password",
      role: "st",
      college: "VIT",
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  await register(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Invalid role selected",
  });
});

test("Should return 400 if image is not uploaded", async () => {
  const req = {
    body: {
      name: "user",
      email: "user@gmail.com",
      password: "password",
      role: "student",
      college: "VIT",
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  await register(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "Profile image is required",
  });
});

test("Should return 409 if user already exists with this email", async () => {
  const req = {
    body: {
      name: "user",
      email: "user@gmail.com",
      password: "password",
      role: "student",
      college: "VIT",
    },
    file: {
      path: "image.jpg",
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  User.findOne.mockResolvedValue({
    email: "user@gmail.com",
    isVerified: true,
  });
  await register(req, res);
  expect(res.status).toHaveBeenCalledWith(409);
  expect(res.json).toHaveBeenCalledWith({
    success: false,
    message: "User already exists with this email",
  });
});
