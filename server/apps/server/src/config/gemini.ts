// Gemini SDK initialization (GoogleGenerativeAI) using GEMINI_API_KEY.
// A single shared instance is reused by the LLM client and the embedding pipeline.

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
