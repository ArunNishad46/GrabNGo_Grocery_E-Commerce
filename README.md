# 🛒 GrabNGo – Full Stack E-commerce Grocery Store

A complete MERN-stack grocery e-commerce platform with an admin panel, secure authentication, Stripe payments, and an **AI Shopping Assistant** built with LangChain agents.

**🔗 Live Demo:** [grabngo-grocery-store.vercel.app](https://grabngo-grocery-store.vercel.app)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [AI Shopping Assistant](#-ai-shopping-assistant)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Overview](#-api-overview)
- [Scripts](#-scripts)
- [Deployment](#-deployment)
- [Author](#-author)

---

## ✨ Features

### Customer

- **Authentication:** register, email verification, login, logout, forgot password with OTP, reset password
- **Secure sessions:** short-lived access token + refresh token, with automatic token refresh on the client
- **Product catalog:** browse by category and sub-category, product detail pages with image gallery
- **Search:** debounced search with infinite scroll
- **Shopping cart:** add, update quantity, remove; cart summary with discount savings; mobile cart bar
- **Checkout:** multiple saved delivery addresses, **Cash on Delivery** and **online payment via Stripe**
- **Orders:** order history ("My Orders") with delivery address and payment status
- **Profile:** update name, email, mobile, password, and avatar
- **AI Shopping Assistant:** chat with an AI to find products and manage your cart

### Admin

- Role-based access (`ADMIN`) enforced on both client routes and server APIs
- Category and sub-category management (create, edit, delete)
- Product management (upload with images, edit, delete, search, pagination)
- Image uploads to Cloudinary

---

## 🧰 Tech Stack

| Layer        | Technologies                                                                      |
| ------------ | --------------------------------------------------------------------------------- |
| **Frontend** | React 18, Vite, Redux Toolkit, React Router, Tailwind CSS, Axios, React Hook Form |
| **Backend**  | Node.js, Express.js, JWT, bcryptjs, Multer                                        |
| **Database** | MongoDB with Mongoose                                                             |
| **Payments** | Stripe Checkout + Webhooks                                                        |
| **Email**    | Brevo (transactional email)                                                       |
| **Media**    | Cloudinary                                                                        |
| **AI**       | LangChain agent, LangGraph (`MemorySaver`), Groq (`openai/gpt-oss-120b`), Zod     |

---

## 🤖 AI Shopping Assistant

A floating chat widget (bottom-right) powered by a LangChain agent. It answers using **real data from your MongoDB catalog**, never invented products, prices, or stock.

### What it can do

| Tool                  | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `search_products`     | Find grocery products by name and/or maximum price       |
| `get_product_details` | Get price, discount, stock, and description of a product |
| `add_to_cart`         | Add a product to the logged-in user's cart               |
| `get_cart`            | Show the current cart items and total                    |
| `remove_from_cart`    | Remove a product (or some quantity) from the cart        |

### Example prompts

- _"Show me milk under ₹60"_
- _"Add 2 packets of bread to my cart"_
- _"What's in my cart?"_
- _"Remove the biscuits from my cart"_

### How it works

1. The React widget sends `{ message, sessionId }` to `POST /api/ai/chat`.
2. The server identifies the user from the JWT (guests are allowed and get a session-based thread).
3. The agent decides which tool(s) to call and returns a short answer.
4. Conversation memory is kept per user (`user_<id>`) or per guest session (`guest_<sessionId>`).

### Security design

- **The user ID never comes from the LLM.** It is read from the verified JWT on the server and passed to tools through the runtime config, so a prompt cannot make the AI modify another user's cart.
- Cart tools return _"not logged in"_ for guests; searching works for everyone.
- Search input is regex-escaped, and cart quantities are validated against stock.
- Prices and discounts always come from the database.

> The Groq API key stays on the server. The React client only calls `/api/ai/*` and never receives the key.

---

## 📁 Project Structure

```
GrabNGo/
├── client/                      # React (Vite) frontend
│   └── src/
│       ├── assets/              # Images
│       ├── common/              # SummaryApi (all API endpoints)
│       ├── components/          # Reusable UI (Header, Search, CardProduct, AIShoppingAssistant, ...)
│       ├── hooks/               # useMobile, useDebounce
│       ├── layouts/             # Dashboard, AdminPermision
│       ├── pages/               # Route pages
│       ├── provider/            # GlobalProvider (cart, address, orders)
│       ├── route/               # React Router config
│       ├── store/               # Redux slices
│       └── utils/               # Axios instance, helpers
│
└── server/                      # Express backend
    ├── config/                  # DB, Stripe, email
    ├── controllers/             # Route handlers
    ├── middleware/              # auth, admin, multer
    ├── models/                  # Mongoose schemas
    ├── route/                   # Express routers
    ├── services/                # aiAgent.js (LangChain agent)
    ├── tools/                   # AI tools (search, details, cart)
    ├── utils/                   # Cloudinary, token, OTP, email templates
    └── index.js                 # App entry point
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- A [MongoDB](https://www.mongodb.com/atlas) database (Atlas or local)
- Accounts/keys for: [Stripe](https://stripe.com), [Cloudinary](https://cloudinary.com), [Brevo](https://www.brevo.com), [Groq](https://console.groq.com)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd GrabNGo
```

### 2. Set up the server

```bash
cd server
npm install
```

Create `server/.env` (see [Environment Variables](#-environment-variables)), then:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default.

### 3. Set up the client

```bash
cd client
npm install
```

Create `client/.env` (see below), then:

```bash
npm run dev
```

The app runs on `http://localhost:5173`.

### 4. Create an admin user

Register a normal account, then change its `role` to `ADMIN` in your MongoDB `users` collection. The admin dashboard (Category, Sub Category, Upload Product, Product) will appear in the user menu.

> ⚠️ **Before sending emails:** the sender address is set in `server/config/sendEmail.js`. Replace it with an email address verified in **your** Brevo account.

---

## 🔐 Environment Variables

### `server/.env`

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/grabngo

# JWT
SECRET_KEY_ACCESS_TOKEN=your_long_random_secret
SECRET_KEY_REFRESH_TOKEN=another_long_random_secret

# Brevo (email)
BREVO_API=your_brevo_api_key

# Cloudinary (image upload)
CLODINARY_CLOUD_NAME=your_cloud_name
CLODINARY_API_KEY=your_api_key
CLODINARY_API_SECRET_KEY=your_api_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_ENPOINT_WEBHOOK_SECRET_KEY=whsec_...

# AI Assistant (Groq)
GROQ_API_KEY=your_groq_api_key
```

> The `CLODINARY_*` and `STRIPE_ENPOINT_*` spellings are intentional. They match the variable names used in the code, so keep them exactly as written.

### `client/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

> Never commit `.env` files. Make sure `.env` is listed in your `.gitignore`.

---

## 🔌 API Overview

All routes are prefixed with `/api`.

| Area           | Base path      | Notes                                                                                        |
| -------------- | -------------- | -------------------------------------------------------------------------------------------- |
| Users          | `/user`        | register, verify-email, login, logout, forgot/reset password, refresh-token, profile, avatar |
| Categories     | `/category`    | `GET` public; create/update/delete are **admin only**                                        |
| Sub-categories | `/subcategory` | `POST /get` public; create/update/delete are **admin only**                                  |
| Products       | `/product`     | public listing, search, details; create/update/delete are **admin only**                     |
| Cart           | `/cart`        | create, get, update-qty, delete-cart-item (login required)                                   |
| Addresses      | `/address`     | create, get, update, disable (login required)                                                |
| Orders         | `/order`       | cash-on-delivery, checkout (Stripe), order-list, webhook                                     |
| File upload    | `/file`        | image upload (**admin only**)                                                                |
| AI             | `/ai`          | `POST /chat`: send a message to the assistant                                                |

Authentication uses a JWT access token (cookie or `Authorization: Bearer <token>`). When it expires, the client automatically calls `/user/refresh-token` and retries the request.

---

## 📜 Scripts

### Server (`/server`)

| Command       | Description                      |
| ------------- | -------------------------------- |
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start`   | Start in production mode         |

### Client (`/client`)

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run ESLint                           |

---

## ☁️ Deployment

Both `client` and `server` include a `vercel.json` and can be deployed to [Vercel](https://vercel.com).

1. Deploy the **server** and add all server environment variables in the Vercel project settings.
2. Deploy the **client** with `VITE_API_URL` pointing to the deployed server URL.
3. Set the server's `FRONTEND_URL` to the deployed client URL. It is used for CORS and for Stripe's success/cancel redirects.
4. Register the Stripe webhook endpoint (see above).

> **Note:** AI conversation memory uses an in-memory store (`MemorySaver`), so it resets when the server restarts, and on serverless platforms it may reset between requests. For production, switch to a persistent LangGraph checkpointer such as MongoDB.

---

## 👤 Author

**Arun**
MERN stack • GenAI

⭐ If you found this project useful, consider giving it a star!
