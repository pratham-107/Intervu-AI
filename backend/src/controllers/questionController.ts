import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const FALLBACK_QUESTION_BANK: Record<string, Record<string, string[]>> = {
  'Frontend Developer': {
    easy: [
      "Can you explain the difference between let, const, and var in JavaScript?",
      "How does the CSS box model work, and what is the difference between content-box and border-box?",
      "What are React components, and what is the difference between state and props?",
      "How do event bubbling and event capturing work in the DOM?",
      "What are semantic HTML tags and why are they important for accessibility and SEO?"
    ],
    medium: [
      "How does the React reconciliation algorithm and Virtual DOM diffing work under the hood?",
      "Explain CSS Grid vs Flexbox: when would you choose one over the other in production layouts?",
      "How would you optimize Web Vitals (LCP, FID/INP, CLS) in a Next.js application?",
      "What strategies do you use for efficient global state management in complex React apps?",
      "How do you handle client-side caching, optimistic UI updates, and stale-while-revalidate data fetching?"
    ],
    hard: [
      "How would you architect a real-time collaborative canvas (like Figma or Miro) in the browser?",
      "Explain JavaScript engine execution context, call stack, microtask vs macrotask event loop phases with an example.",
      "How would you build a micro-frontend architecture with module federation and isolated styles?",
      "Design a robust client-side offline-first caching synchronization engine with IndexedDB and Web Workers.",
      "How do you debug and resolve complex memory leaks and layout thrashing in high-frequency browser animations?"
    ]
  },
  'Backend Developer': {
    easy: [
      "What is the difference between SQL and NoSQL databases, and when would you choose each?",
      "Explain the fundamental HTTP methods (GET, POST, PUT, PATCH, DELETE) and their idempotency.",
      "What is an API gateway and what core responsibilities does it handle?",
      "How does password hashing with salt work to protect user credentials?",
      "What are database indexes and how do they speed up query lookups?"
    ],
    medium: [
      "How do you design an idempotent payment webhook receiver that guarantees exactly-once processing?",
      "Explain ACID transactions in relational databases and how isolation levels prevent dirty reads.",
      "How would you design a rate-limiting middleware for a public REST API?",
      "What are message queues (e.g., RabbitMQ, Kafka) and when should background jobs be used instead of synchronous HTTP calls?",
      "How do connection pools work in PostgreSQL and how do you prevent pool exhaustion under high traffic?"
    ],
    hard: [
      "Design a distributed rate limiter and token bucket algorithm that scales across multiple regions without race conditions.",
      "How would you architect a fault-tolerant notification delivery engine sending 100M push notifications/day?",
      "Explain the CAP theorem and how you would handle network partitions in a globally distributed multi-master database.",
      "How do you design a database migration strategy for zero-downtime schema updates on high-volume tables?",
      "Design a distributed locking mechanism using Redis (Redlock) or ZooKeeper and discuss its edge cases."
    ]
  },
  'Fullstack Developer': {
    medium: [
      "Walk me through the lifecycle of a web request from typing a URL in the browser to server rendering and response.",
      "How do you design authentication using JWTs and secure HTTP-only refresh tokens?",
      "How would you design and implement a real-time notification system using WebSockets and Redis Pub/Sub?",
      "Explain Server-Side Rendering (SSR) vs Static Site Generation (SSG) vs Client-Side Rendering (CSR) in Next.js.",
      "How do you secure web applications against XSS, CSRF, and SQL Injection attacks?"
    ]
  },
  'Product Manager': {
    medium: [
      "How do you prioritize competing feature requests from sales, engineering, and active users?",
      "Tell me about a time a product launch failed or underperformed. What did you learn and how did you pivot?",
      "How would you design the onboarding flow for a new developer SaaS product to maximize Day-7 retention?",
      "If daily active users (DAU) dropped by 15% overnight, how would you systematically diagnose the root cause?",
      "How do you balance technical debt reduction with shipping new customer-facing roadmap features?"
    ]
  }
};

export const generateQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role = 'Frontend Developer', difficulty = 'medium', resume_text } = req.body;

    // Try calling Python AI service for dynamic LLM generation
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/questions/generate`, {
        role,
        difficulty,
        resume_text
      }, { timeout: 4000 });

      if (aiResponse.data?.questions && Array.isArray(aiResponse.data.questions)) {
        res.status(200).json({
          source: 'ai-engine',
          role,
          difficulty,
          questions: aiResponse.data.questions
        });
        return;
      }
    } catch (aiErr) {
      console.log('[QuestionController] AI Service unreachable or timeout; using high-quality curated bank.');
    }

    // Fallback to curated question bank
    const roleQuestions = FALLBACK_QUESTION_BANK[role] || FALLBACK_QUESTION_BANK['Frontend Developer'];
    const questionsList = roleQuestions[difficulty] || roleQuestions['medium'] || roleQuestions['easy'];

    const formattedQuestions = questionsList.map((q, idx) => ({
      id: `q-${idx + 1}`,
      order: idx + 1,
      text: q
    }));

    res.status(200).json({
      source: 'curated-bank',
      role,
      difficulty,
      questions: formattedQuestions
    });
  } catch (error: any) {
    console.error('[QuestionController] generate error:', error);
    res.status(500).json({ error: 'Failed to generate interview questions.' });
  }
};
