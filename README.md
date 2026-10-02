# CodNexia — Digital Services Marketplace

A full-stack SaaS marketplace where users can offer and purchase digital services. Built from scratch: architecture, development, payments, notifications, and deployment.

**Live Demo:** [https://codnexia.com](https://codnexia.com)

---

## 🚀 Features

### Core Platform
- **User authentication** — Registration and login with email verification
- **Service listings** — Create, manage, and browse digital services
- **Order system** — Full order lifecycle with status tracking
- **Order tracking by ID** — Public order lookup and progress tracking
- **Reviews & ratings** — Client feedback system

### Real-Time & Communication
- **Real-time messaging** — Instant chat between buyers and sellers (WebSockets)
- **Full notification system** — Real-time alerts for orders, payments, ratings, and messages
- **Email notifications** — Automated emails for orders, invoices, and status updates

### Payments
- **Crypto payment integration** — Automated payment processing with instant crediting
- **Payment status tracking** — Submitted, pending, confirmed states

### Admin & Management
- **Admin panel** — Full control over users, orders, services, and content
- **Order management** — View, update, and resolve disputes
- **User management** — Ban, verify, and manage accounts

### Security
- **Cloudflare Turnstile** — Bot protection on forms and registration
- **Email verification** — Prevents fake accounts
- **Secure authentication** — Protected user data and payments

---

## 🛠️ Tech Stack

**Frontend:**
- TypeScript
- React
- Next.js
- Tailwind CSS

**Backend:**
- Node.js
- REST API
- WebSockets (real-time)

**Database:**
- MongoDB

**Other:**
- Cloudflare Turnstile
- Crypto payment gateways
- Git / GitHub
- Vercel (deployment)

---

## 📸 Screenshots
<img width="1919" height="947" alt="Screenshot 2026-10-01 222354" src="https://github.com/user-attachments/assets/3548fcb9-53f7-48fc-9fba-c5c450b1ea49" />
<img width="1913" height="924" alt="Screenshot 2026-10-01 222504" src="https://github.com/user-attachments/assets/e1d0a331-acd2-4aae-bd8b-407e9a3971e5" />
<img width="1917" height="946" alt="Screenshot 2026-10-01 222520" src="https://github.com/user-attachments/assets/90772b92-f8e9-4da4-b2c7-ece9e3fca655" />
<img width="1919" height="945" alt="Screenshot 2026-10-01 222739" src="https://github.com/user-attachments/assets/6e5cb31e-7c98-4d2e-9276-e5b7271c33cd" />


---

## 📦 How to Run Locally

1. Clone the repository:
    ```bash
   git clone https://github.com/KnightMaresss/CodNexia.git
    ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env.local file with your own keys (see .env.example).
4. Run the development server:
    ```bash
   npm run dev
    ```   
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Author

**Waleed Al-Maqtari (KnightMares)**
- GitHub: [@KnightMaresss](https://github.com/KnightMaresss)
- Email: waleedalmaqtari10@gmail.com

---

## 📄 License
All rights reserved.
