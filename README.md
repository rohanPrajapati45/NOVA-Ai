# Nova AI — Multi-Agent AI Chatbot Platform

> An enterprise-grade, multi-agent AI workspace powering conversational intelligence, specialized web search, live code execution, document synthesis, and multi-modal file analysis.

Nova AI is a full-stack, microservices-architected conversational AI platform built using the MERN stack and LangGraph. It features an intelligent routing system capable of dynamically directing user queries across 8 specialized AI agents — ranging from live web research and coding to vector-backed PDF RAG and vision analysis. Designed for production workloads, Nova AI combines microservice isolation, AWS cloud deployment, credit-based usage controls, and real-time interactive artifacts.

---

## 🚀 Live Demo

- **Backend API**: Deployed & Live on AWS (Dockerized microservices architecture)
- **Frontend Web App**: `[Frontend URL — deployment in progress]` *(Coming Soon)*

---

## ✨ Features

### 🔐 Auth & Sessions
- **Google Sign-In**: Firebase Authentication integration for seamless single sign-on.
- **Stateful Sessions**: Redis-backed 7-day session management enforced via central `verifySession` gateway middleware.
- **Secure Context Propagation**: Internal service secret headers preventing direct unauthorized microservice access.

### 🤖 Multi-Agent System (8 Agents)
- **Chat Agent**: Core conversational assistant leveraging Groq and Gemini with Redis-cached chat memory.
- **Search Agent**: Live web research powered by Tavily, delivering synthesized answers with embedded source citations and image search results.
- **Coding Agent**: Generates HTML, CSS, and JavaScript code rendered live in an interactive Monaco-editor artifact panel.
- **PDF Generation Agent**: Synthesizes structured PDF documents via PDFKit, automatically stored in AWS S3 with presigned access links.
- **PPT Generation Agent**: Generates downloadable PowerPoint presentations (`.pptx`) using `pptxgenjs` uploaded directly to S3.
- **Image Generation Agent**: High-quality AI image generation powered by Pollinations.ai with automated S3 persistence.
- **Image Analyzer Agent** *(Auto-Routed)*: Triggered on image attachment for multi-modal vision analysis using Gemini Vision.
- **PDF RAG Agent** *(Auto-Routed)*: Triggered on PDF attachment for document chunking, embedding, and vector retrieval via Qdrant.

### 💳 Credit & Billing System
- **Razorpay Integration**: Native checkout workflow for purchasing credit packs.
- **Usage Enforcement**: Real-time credit deduction and balance validation per agent execution.

### 📁 File Handling & Storage
- **Cloud Asset Storage**: Secure upload and retrieval of generated PDFs, slides, and images via AWS S3.
- **Presigned URLs**: Temporary access link generation for secure client downloads.

### 🎨 Frontend UX & Workspace
- **Modern Dashboard**: Built with React, Redux Toolkit, and Tailwind CSS.
- **Interactive Split-Screen**: Live artifact preview pane with Monaco Code Editor.
- **Voice Capabilities**: Speech-to-text voice input for hands-free prompting.
- **Theme Support**: Seamless Dark/Light mode toggle.
- **Cascading Cleanup**: Complete conversation deletion removing MongoDB history, Redis cache, and Qdrant vector points.

---

## 🛠️ Tech Stack

| Category | Technologies Used |
| :--- | :--- |
| **Frontend** | React, Redux Toolkit, Tailwind CSS, Monaco Editor, Lucide Icons |
| **Backend Framework** | Node.js, Express.js (Microservices Architecture) |
| **AI & Agent Orchestration** | LangGraph, LangChain, Groq, Google Gemini, Tavily API, Pollinations.ai |
| **Databases & Caching** | MongoDB (Mongoose), Redis (ioredis), Qdrant Vector DB |
| **Cloud & Storage** | AWS S3, AWS ECR/ECS |
| **DevOps & Containers** | Docker (5 service Dockerfiles built from root backend context) |
| **Payments** | Razorpay Node SDK |

---

## 🏗️ Architecture Overview

Nova AI employs an isolated microservices architecture behind a unified API Gateway. All incoming client requests pass through the gateway where session tokens are validated against Redis before being proxied to the target service.

```
                                    +-----------------------+
                                    |     React Frontend    |
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------------------+
                                    |      API Gateway      |
                                    |    (verifySession)    |
                                    +----+-----+-----+------+
                                         |     |     |
              +--------------------------+     |     +--------------------------+
              |                                |                                |
              v                                v                                v
   +--------------------+            +--------------------+            +--------------------+
   |    Auth Service    |            |    Chat Service    |            |   Billing Service  |
   +----------+---------+            +----------+---------+            +----------+---------+
              |                                 |                                 |
              v                                 v                                 v
    [MongoDB / Firebase]               [MongoDB / Redis]                [MongoDB / Razorpay]
                                                |
                                                v
                                     +--------------------+
                                     |   Agent Service    |
                                     | (LangGraph Engine) |
                                     +---+---+---+---+----+
                                         |   |   |   |
      +----------------------------------+   |   |   +----------------------------------+
      |                                      |   |                                      |
      v                                      v   v                                      v
 [Groq / Gemini]                        [Qdrant DB]                              [AWS S3]
(Model Providers)                       (Vector RAG)                        (PDF / PPT / Image)
```

### Request Flow
1. **Client** sends request with session cookie to the **API Gateway** (`:8000`).
2. **Gateway** verifies active session via **Redis** (`verifySession` middleware) and attaches authenticated user headers.
3. Request is proxied to the corresponding service:
   - `/api/auth` $\rightarrow$ **Auth Service** (`:8001`)
   - `/api/chat` $\rightarrow$ **Chat Service** (`:8002`)
   - `/api/agent` $\rightarrow$ **Agent Service** (`:8003`)
   - `/api/billing` $\rightarrow$ **Billing Service** (`:8004`)
4. **Agent Service** routes execution through the **LangGraph graph** to trigger the appropriate tool/agent and returns streaming or structured responses.

---

## ⚙️ Getting Started / Local Setup

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- **Redis Server**: Running locally or via Docker
- **MongoDB**: Local instance or MongoDB Atlas cluster

### 1. Clone the Repository
```bash
git clone https://github.com/[your-username]/nova-ai.git
cd nova-ai
```

### 2. Environment Variables Configuration

Create a `.env` file inside each respective service directory (`backend/gateway`, `backend/services/*`) using the template variable names below (never commit actual values):

#### `backend/gateway/.env`
```env
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_SECRET=your_internal_secret_key
AUTH_SERVICE_URL=http://localhost:8001
CHAT_SERVICE_URL=http://localhost:8002
AGENT_SERVICE_URL=http://localhost:8003
BILLING_SERVICE_URL=http://localhost:8004
```

#### `backend/services/auth/.env`
```env
PORT=8001
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_SECRET=your_internal_secret_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

#### `backend/services/chat/.env`
```env
PORT=8002
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_SECRET=your_internal_secret_key
```

#### `backend/services/agent/.env`
```env
PORT=8003
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_SECRET=your_internal_secret_key
GROQ_API_KEY=your_groq_key
GOOGLE_API_KEY=your_gemini_key
TAVILY_API_KEY=your_tavily_key
QDRANT_ENDPOINT=your_qdrant_endpoint
QDRANT_API_KEY=your_qdrant_key
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_BUCKET_NAME=your_s3_bucket
```

#### `backend/services/billing/.env`
```env
PORT=8004
MONGO_URI=your_mongodb_connection_string
REDIS_URL=redis://localhost:6379
INTERNAL_SERVICE_SECRET=your_internal_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

#### `frontend/.env`
```env
VITE_API_GATEWAY_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

---

### 3. Local Execution

#### Option A: Running Services Manually
Run `npm install` in each folder and launch the dev servers:

```bash
# Start Redis container for local development
cd backend
docker-compose up -d redis

# Terminal 1: Gateway
cd backend/gateway
npm install
npm run dev

# Terminal 2: Auth Service
cd backend/services/auth
npm install
npm run dev

# Terminal 3: Chat Service
cd backend/services/chat
npm install
npm run dev

# Terminal 4: Agent Service
cd backend/services/agent
npm install
npm run dev

# Terminal 5: Billing Service
cd backend/services/billing
npm install
npm run dev

# Terminal 6: Frontend App
cd frontend
npm install
npm run dev
```

#### Option B: Individual Docker Container Builds
All service Dockerfiles are configured to build from the `backend/` root directory context so shared modules (`backend/shared`) resolve correctly:

```bash
# From the backend directory
cd backend

# Build Docker images
docker build -t nova-gateway -f gateway/Dockerfile .
docker build -t nova-auth -f services/auth/Dockerfile .
docker build -t nova-chat -f services/chat/Dockerfile .
docker build -t nova-agent -f services/agent/Dockerfile .
docker build -t nova-billing -f services/billing/Dockerfile .
```

*> **Note**: Full multi-container `docker-compose` orchestration for local end-to-end spin-up is currently in progress / planned for a future update. At present, `docker-compose.yml` is used to manage local Redis.*

---

## 📊 Deployment Status

- **Backend Microservices**: **100% Built, Dockerized, & Deployed on AWS** (ECR / Cloud Infrastructure).
- **Frontend Application**: **Fully Built**, deployment to hosting environment is in progress *(coming soon)*.

---

## 📁 Project Structure

```
nova-ai/
├── backend/
│   ├── gateway/                 # API Gateway & verifySession middleware
│   ├── services/
│   │   ├── agent/               # LangGraph multi-agent engine & tool definitions
│   │   ├── auth/                # Firebase Auth & user profile handlers
│   │   ├── billing/             # Razorpay integration & credit manager
│   │   └── chat/                # Conversation persistence & history management
│   ├── shared/
│   │   ├── redis/               # Shared Redis client connection module
│   │   └── s3/                  # Shared AWS S3 upload & presigned URL helper
│   ├── docker-compose.yml       # Local Redis configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # UI Components (Artifacts, Monaco Editor, Chat)
│   │   ├── store/               # Redux Toolkit state slices
│   │   ├── services/            # API client calls
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## 👤 Author / Contact

- **Author**: `Rohan Prajapati`

---

## 📄 License

This project is licensed under the **MIT License**.
