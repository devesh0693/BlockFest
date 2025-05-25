const request = require('supertest');
const express = require('express');

// First, create mock functions before they're used in the mock
const mockCreateUser = jest.fn();
const mockGenerateEmailVerificationLink = jest.fn();
const mockGetUserByEmail = jest.fn();

// Then mock Firebase Admin SDK
jest.mock('firebase-admin', () => {
  return {
    initializeApp: jest.fn(),
    credential: {
      applicationDefault: jest.fn()
    },
    auth: jest.fn().mockReturnValue({
      createUser: mockCreateUser,
      generateEmailVerificationLink: mockGenerateEmailVerificationLink,
      getUserByEmail: mockGetUserByEmail
    })
  };
});

// Now import the mocked module
const admin = require('firebase-admin');
const authRoutes = require('../../backend/auth/auth');

describe('Authentication Routes', () => {
  let app;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });
  
  describe('POST /auth/register', () => {
    test('should register a new user and send verification email', async () => {
      // Setup mocks
      mockCreateUser.mockResolvedValue({ uid: 'test-uid' });
      mockGenerateEmailVerificationLink.mockResolvedValue('https://verify-email.example.com');
      
      // Send request
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Verify your email before login.');
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockGenerateEmailVerificationLink).toHaveBeenCalledWith('test@example.com');
    });
    
    test('should handle registration errors', async () => {
      // Setup mocks
      mockCreateUser.mockRejectedValue(new Error('Email already in use'));
      
      // Send request
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123'
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });
  });
  
  describe('POST /auth/login', () => {
    test('should allow login for verified users', async () => {
      // Setup mocks
      mockGetUserByEmail.mockResolvedValue({
        uid: 'test-uid',
        emailVerified: true
      });
      
      // Send request
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'verified@example.com'
        });
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.uid).toBe('test-uid');
    });
    
    test('should reject login for unverified users', async () => {
      // Setup mocks
      mockGetUserByEmail.mockResolvedValue({
        uid: 'test-uid',
        emailVerified: false
      });
      
      // Send request
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'unverified@example.com'
        });
      
      // Assert
      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Email not verified.');
    });
    
    test('should handle user not found errors', async () => {
      // Setup mocks
      mockGetUserByEmail.mockRejectedValue(new Error('User not found'));
      
      // Send request
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com'
        });
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User not found');
    });
  });
});