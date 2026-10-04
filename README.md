# ShipFix – Marine Engineer Troubleshooting Knowledge Platform

## 🚢 Overview

ShipFix is a web-based troubleshooting journal and knowledge-sharing platform designed specifically for marine engineers.

It allows engineers to document equipment problems, observations, root causes, and corrective actions in a structured format. Engineers can also explore other engineers' profiles and share knowledge through troubleshooting cases, likes, and comments.

---

## ❗ Problem Statement

Marine engineers often face recurring equipment problems that may have already been solved by another engineer on a different ship, watch, or voyage.

However, valuable troubleshooting knowledge is commonly scattered across:

- Paper logbooks
- Personal notes
- Individual experience
- Informal communication

This results in engineers having to diagnose similar problems from scratch, which can increase troubleshooting time, equipment downtime, and operational risk.

---

## 💡 Solution

ShipFix provides a centralized digital platform where marine engineers can record and share their troubleshooting experiences.

Each troubleshooting case follows a structured format:

**Problem → Observation → Equipment → Root Cause → Corrective Action**

This helps preserve practical engineering knowledge and makes it easier for engineers to learn from previously documented experiences.

---

## ✨ Key Features

### 1. Structured Troubleshooting Cases

Engineers can document:

- Equipment affected
- Problem
- Observations
- Root cause
- Corrective action
- Troubleshooting date

### 2. Engineer Profiles

Engineers can create and manage professional profiles containing information such as:

- Name
- Role
- Experience
- Bio
- Profile photo

### 3. Engineer Search

Engineers can search for other engineers by **name or role** and explore their profiles and shared troubleshooting cases.

### 4. Community Interaction

Engineers can share troubleshooting experiences and interact with other engineers through:

- Likes
- Comments

### 5. Case Management

Engineers can:

- Create troubleshooting cases
- View case details
- Edit their cases
- Delete their cases
- View their troubleshooting history

### 6. Session-Based Authentication

The platform provides:

- User registration
- Login
- Logout
- Session management
- Password hashing using bcryptjs

---

## 🛠️ Technology Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express.js
- REST API

### Database

- SQLite

### Authentication & Security

- Express Session
- bcryptjs

### Testing

- Playwright

### Development Tools

- Visual Studio Code
- GitHub
- GitHub Copilot

---

## 🔄 Project Workflow

Register / Login  
↓  
Engineer Profile  
↓  
Create Troubleshooting Case  
↓  
Store Case in SQLite Database  
↓  
View / Edit / Delete Case  
↓  
Share Troubleshooting Experience  
↓  
Likes & Comments  
↓  
Discover Engineers & Their Cases

---

## 📋 Troubleshooting Case Structure

Every troubleshooting record is organized into important engineering information:

| Field | Description |
|---|---|
| Equipment | Equipment affected by the problem |
| Problem | Description of the equipment issue |
| Observation | Symptoms or observations made during troubleshooting |
| Root Cause | Identified cause of the problem |
| Corrective Action | Action taken to resolve the issue |
| Date | Date of the troubleshooting event |

---

## 🔐 Authentication

ShipFix uses session-based authentication.

- User passwords are securely hashed using **bcryptjs**.
- **Express Session** is used to maintain authenticated user sessions.
- Users can register, log in, and log out of the platform.

---

## 🌟 What Makes ShipFix Unique?

ShipFix is designed around how engineers actually troubleshoot:

**Problem → Observation → Root Cause → Corrective Action**

Instead of functioning as a generic discussion forum, the platform focuses on converting practical marine engineering experience into structured, reusable troubleshooting knowledge.

---

## 📈 Impact

ShipFix aims to:

- Preserve valuable troubleshooting knowledge across crew changes.
- Reduce dependence on individual experience.
- Help engineers learn from previously documented equipment problems.
- Improve knowledge sharing among marine engineering teams.
- Support better and faster troubleshooting decisions.

---

## ⚙️ Setup & Installation

### 1. Clone the Repository

    git clone <repository-url>
    cd <project-folder>

### 2. Install Dependencies

    npm install

### 3. Start the Backend

    node index.js

### 4. Open the Application

Open the frontend using the project's configured frontend setup.

---

## 🚧 Project Status

### ✅ Completed

- User registration and login
- Session-based authentication
- Password hashing
- Engineer profile creation and editing
- Engineer profile viewing
- Engineer search by name or role
- Create troubleshooting cases
- View troubleshooting cases
- Edit troubleshooting cases
- Delete troubleshooting cases
- Likes and comments
- Viewing engineers' shared troubleshooting cases

### 🔄 In Progress

- Testing and refining existing features using Playwright
- Improving the overall user experience and interface

### 🔮 Planned

- Smart search for similar troubleshooting cases
- AI-based similar-case recommendations
- Offline and low-connectivity support
- Photo and voice input

---

## 🔮 Future Scope

Future versions of ShipFix can include:

- **Smart Case Search** – Find similar troubleshooting cases based on equipment and problems.
- **AI Recommendations** – Suggest relevant previous cases to engineers.
- **Offline Support** – Allow engineers to access and record information during low-connectivity conditions at sea.
- **Photo, Video and Voice Input** – Make troubleshooting documentation faster and easier.
- **OEM Documentation Integration** – Connect relevant equipment manuals and technical documentation with troubleshooting cases.

---

## 🧩 Challenges & How We Handle Them

**Scattered troubleshooting knowledge:**  
Structured case records capture the problem, observations, root cause, and corrective action.

**Inconsistent case information:**  
Defined fields ensure that every troubleshooting case follows a consistent format.

**Limited connectivity at sea:**  
The platform is kept lightweight, with offline support planned for future development.

**Sensitive vessel information:**  
Engineers are encouraged to avoid sharing confidential vessel-specific information.

---

## 🌐 Live Demo

🔗 **Live Demo:** `<add-your-live-demo-link-here>`

---

## 👥 Team

| No. | Name | USN | Role |
|---|---|---|---|
| 1 | **Vishritha V** | 4VP24CS117 | Team Leader |
| 2 | **Nethra D** | 4VP24CS062 | Team Member |
| 3 | **T. Keerthan** | 4VP24CS104 | Team Member |
| 4 | **Yashwanth Kumar Yadav** | 4VP24CS119 | Team Member |

---

## 🎯 Project Goal

The goal of ShipFix is to transform scattered marine engineering troubleshooting experiences into structured, reusable digital knowledge that can help engineers solve recurring equipment problems more effectively.

---

## 📄 License

This project is developed as an academic/hackathon project for educational and demonstration purposes.
