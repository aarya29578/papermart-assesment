import mongoose from 'mongoose';
import { config } from './env.js';

/**
 * Strips sensitive credentials from connection strings in log outputs
 * to prevent exposing passwords in logs or console output.
 */
const maskCredentials = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/g, '$1***:***@');
};

/**
 * Connect to MongoDB database
 * Validates environment configuration and initiates connection.
 */
export const connectDatabase = async () => {
  if (!config.mongodbUri || config.mongodbUri.trim() === '') {
    console.error('Configuration Error: MONGODB_URI environment variable is missing or empty.');
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB connected successfully: database "${connection.connection.name}"`);
    return connection;
  } catch (error) {
    const safeErrorMessage = maskCredentials(error.message || 'Unknown database connection error');
    console.error(`MongoDB connection failed: ${safeErrorMessage}`);
    process.exit(1);
  }
};
