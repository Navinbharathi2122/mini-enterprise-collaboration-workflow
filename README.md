# Mini Enterprise Collaboration & Workflow Management System

A full-stack enterprise collaboration and workflow management platform built using **FastAPI, React.js, SQLAlchemy, JWT Authentication and SQLite/MySQL/PostgreSQL-ready architecture**.

The application was developed incrementally across three phases:

- **Phase 1 — Mini Enterprise Collaboration & Workflow**
- **Phase 2 — Workflow & Collaboration System**
- **Phase 3 — Enterprise Features & Intelligence Layer**

The final application combines authentication, role-based access control, task management, Kanban workflow, approvals, comments, dashboard analytics, document management, audit tracking, notifications and AI-powered dashboard insights into a single enterprise workflow platform.

---

##  Table of Contents

- [Project Overview](#-project-overview)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Project Phases](#-project-phases)
- [User Roles](#-user-roles)
- [System Workflow](#-system-workflow)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Core Modules](#-core-modules)
- [Task Workflow](#-task-workflow)
- [Approval Workflow](#-approval-workflow)
- [Document Management](#-document-management)
- [Audit Logging](#-audit-logging)
- [Notification System](#-notification-system)
- [AI Dashboard Intelligence](#-ai-dashboard-intelligence)
- [Dashboard](#-dashboard)
- [API Endpoints](#-api-endpoints)
- [Database Models](#-database-models)
- [Authentication & Security](#-authentication--security)
- [Environment Configuration](#-environment-configuration)
- [Backend Setup](#-backend-setup)
- [Frontend Setup](#-frontend-setup)
- [Running the Application](#-running-the-application)
- [Swagger API Documentation](#-swagger-api-documentation)
- [Testing](#-testing)
- [GitHub Submission](#-github-submission)
- [Future Enhancements](#-future-enhancements)
- [Conclusion](#-conclusion)

---

# 📖 Project Overview

Modern organizations require a centralized platform to manage tasks, employees, workflows, approvals, documents and communication.

This project provides an enterprise-style solution where users can:

- Register and authenticate securely
- Access features according to their role
- Create and assign tasks
- Track task progress
- Manage tasks through a Kanban workflow
- Add comments and collaboration notes
- Submit and process approvals
- Upload and manage documents
- Maintain document versions
- Track important system activities
- Receive notifications
- View dashboard analytics
- View AI-powered task insights

The system was developed progressively through three phases, where each phase extends the functionality of the previous phase.

---

# 🎯 Objectives

The main objectives of the project are:

- Implement secure JWT-based authentication
- Implement role-based access control
- Build RESTful APIs using FastAPI
- Design relational database models
- Implement task management
- Implement task assignment
- Implement Kanban workflow
- Enforce valid task status transitions
- Implement approval workflows
- Implement comments and collaboration
- Build dashboard analytics
- Implement document upload and version management
- Track important system activities through audit logs
- Implement user-specific notifications
- Provide AI-powered dashboard insights
- Build a responsive React frontend
- Integrate frontend and backend APIs
- Provide Swagger API documentation
- Maintain a scalable and maintainable project structure

---

# ✨ Key Features

## 🔐 Authentication

- User registration
- User login
- JWT authentication
- Password hashing
- Protected API endpoints
- Current user information
- Token-based frontend authentication

---

## 👥 Role-Based Access Control

The system supports three primary roles:

### Admin

- Full system access
- View all users
- View all tasks
- Manage tasks
- Assign tasks
- View audit logs
- Monitor system activities
- Access enterprise dashboard information

### Manager

- Create tasks
- Assign tasks
- Manage team-related tasks
- Monitor team progress
- Manage workflow
- Process approvals
- View relevant dashboard information

### Employee

- View assigned tasks
- Update assigned task status
- Add comments
- Submit workflow/approval requests
- Upload and access permitted documents
- Receive notifications
- View relevant dashboard information

---

# 🏗 Project Phases

## Phase 1 — Mini Enterprise Collaboration & Workflow

Phase 1 established the foundation of the application.

### Implemented Features

- JWT authentication
- User registration
- User login
- Password hashing
- Role-based access control
- User management
- Task creation
- Task assignment
- Task listing
- Task update
- Task deletion
- Task status management
- Basic dashboard
- Frontend/backend integration

### Main Roles

```text
Admin
 ├── Manage Users
 ├── Manage Tasks
 └── Assign Tasks

Manager
 ├── Create Tasks
 ├── Assign Tasks
 └── Manage Team Tasks

Employee
 ├── View Assigned Tasks
 └── Update Task Status