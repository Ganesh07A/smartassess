# 🎯 SmartAssess

<div align="center">

[![Status](https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-lightgrey.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.6-2D3748.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**SmartAssess is a high-performance, enterprise-grade assessment platform designed to revolutionize the educational examination ecosystem.**

[Explore Features](#-key-features) • [Tech Stack](#-technology-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture)

</div>

---

## 🚀 Overview

**SmartAssess** is an end-to-end, decoupled web platform designed to modernize the educational examination and evaluation pipeline. It serves as a comprehensive suite bridging the gap between educators and students by providing:

- **Automated Assessment Creation:** Drag-and-drop CSV/Excel parsing to generate hundreds of questions in seconds.
- **Secure interactive Exam Environments:** High-fidelity interfaces with live Question Palettes and dual-mode (MCQ/Coding) support.
- **Intelligent Results Generation:** Automated, print-ready, university-standard marksheets generated instantly.

Unlike legacy Learning Management Systems (LMS), SmartAssess prioritizes **visual excellence** and **deterministic logic**. It employs glassmorphism, fluid animations, and a strict server-side state machine to ensure a premium, secure, and zero-latency experience.

## ❓ Why SmartAssess?

The traditional assessment pipeline is often manual and prone to errors. SmartAssess was built to solve these critical pain points:

- **For Educators:** Designing tests is tedious. Our **Exam Builder Workspace** processes bulk data in seconds, eliminating manual entry.
- **For Students:** Legacy platforms are often clunky and stressful. SmartAssess offers a **responsive, intuitive interface** with zero-latency interactions and a clear progress tracking system.
- **For Institutions:** Processing results into official formats can take weeks. Our **Result Intelligence Engine** generates formatted marksheets immediately upon exam completion.

---

## ✨ Key Features

### 🧠 Result Intelligence Engine
Generate professional, A4-printable digital marksheets that mirror official university standards. Includes tabular breakdowns, credit points, and intelligent color-coded grading logic.

### ⚡ Deterministic Exam State Machine
Advanced backend cron and status management enforces strict server-side locking. Exams transition to 'CLOSED' automatically, preventing bypass via frontend manipulation.

### 📂 High-Fidelity Workspace
Empower educators with bulk CSV/Excel upload protocols. Process hundreds of questions in a single transaction payload instead of tedious 1-by-1 creation.

### 🖥️ Interactive Dual-Mode Environment
Seamlessly switch between `CodingView` and `MCQView`. Features a modern `QuestionPalette` navigation system for zero-latency interactions.

### 🔐 Secure Student Onboarding
Mandatory profile completion (PRN, Year, Department) ensures data integrity and secure role-based access via Clerk integration.

## 🛠 Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router), React 19
- **Styling:** Tailwind CSS v4, Framer Motion
- **Icons:** Lucide React
- **Auth:** Clerk (Role-based Student/Teacher/Admin routing)
- **Analytics:** Recharts
- **Export:** jsPDF + AutoTable

### Backend
- **Runtime:** Node.js with Express 5
- **Database:** PostgreSQL via Prisma ORM
- **Security:** Helmet, Express Rate Limiter, Clerk Middleware
- **Webhooks:** Svix (User record synchronization)

## 🏗 Architecture

SmartAssess employs a highly scalable, decoupled architecture:

- **Next.js Frontend:** Focuses on blistering-fast SSR and interactive Client Components.
- **Express API:** Handles heavy transactional processing, database interactions, and business logic.
- **Prisma/PostgreSQL:** Ensures type-safe queries and data persistence.

## 🏁 Getting Started

### Prerequisites
- Node.js (Latest LTS)
- pnpm / npm / yarn
- PostgreSQL Database
- Clerk API Keys

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/smartassess.git
   cd smartassess
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file and add your credentials
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Create a .env.local file and add your credentials
   npm run dev
   ```

## 📜 License

Distributed under the **ISC License**. See `LICENSE` for more information.

---

<div align="center">
Built with ❤️ by the Ganesh.S 
</div>
