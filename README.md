# STACKLY - Mini Enterprise Collaboration & Workflow Management System (MECW)

## About the Project

**STACKLY – Mini Enterprise Collaboration & Workflow Management System (MECW)** is a full-stack enterprise workflow application developed as part of **Phase 1** and **Phase 2** of the Stackly Mini Enterprise Collaboration Project.

The application helps organizations securely manage users, tasks, approvals, comments, leave requests, and workflow tracking through **Role-Based Access Control (RBAC)**.

The project is built using **FastAPI** for the backend and **React + Vite** for the frontend with JWT authentication and a workflow-driven architecture.



# Project Phases

## Phase 1 – Enterprise Task Management Foundation

Implemented a secure role-based task management system including:

* JWT Authentication
* User Management
* Task Management
* Role-Based Dashboard
* Task Assignment Workflow

## Phase 2 – Workflow & Collaboration System

Enhanced the application into a real-world workflow platform by implementing:

* Kanban Workflow Board
* Workflow Validation Rules
* Comments & Collaboration Module
* Approval Workflow System
* Dashboard Analytics
* Leave Request Management



# Tech Stack

## Backend

* FastAPI
* SQLAlchemy ORM
* Pydantic
* Alembic
* MySQL
* JWT Authentication (`python-jose`)
* Bcrypt Password Hashing

## Frontend

* React.js
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* @hello-pangea/dnd (Drag & Drop Kanban)



# System Architecture

The project follows a **Layered Service-Based Architecture**.

```text
React Frontend
      │
    Axios API
      │
FastAPI Routers
      │
Service Layer
      │
SQLAlchemy Models
      │
MySQL Database
```


# User Roles

## Admin

* Full system access.
* Manage users.
* Create, update and delete tasks.
* Assign tasks to any user.
* View complete dashboard analytics.
* Final approval authority.

## Manager

* View employees.
* Create and assign tasks.
* Manage assigned team tasks.
* Approve, Reject or Hold approval requests.
* View team dashboard analytics.

## Employee

* View assigned tasks only.
* Update workflow status.
* Submit approval requests.
* Add comments to tasks.
* Apply leave requests.



# Features Implemented

## Authentication Module

* User Registration
* User Login
* JWT Token Authentication
* Current Logged-in User (`/auth/me`)
* Protected APIs
* Password Hashing using bcrypt

## User Management Module

* Create User
* View Users
* Update User
* Delete User
* Role-Based Access Control

## Task Management Module

* Create Task
* View Task List
* View Single Task
* Update Task
* Delete Task
* Assign Task to Employee
* Task Priority (Low / Medium / High)
* Due Date Management

## Kanban Workflow Module (Phase 2)

Workflow Lifecycle:

**TODO → IN PROGRESS → REVIEW → DONE**

Features:

* Drag & Drop Kanban Board.
* Backend Workflow Validation.
* Role-Based Kanban View.
* Task Status Update API.
* Invalid Workflow Transition Blocking.

## Workflow Validation Rules

Allowed transitions:

* TODO → IN_PROGRESS
* IN_PROGRESS → REVIEW
* REVIEW → DONE

Blocked transitions:

* TODO → DONE
* TODO → REVIEW
* IN_PROGRESS → DONE
* REVIEW → TODO

## Comments & Collaboration Module

* Add comments to tasks.
* View task comments.
* Internal comments for Manager/Admin.
* Public comments for all authorized users.
* Timestamp tracking.
* User tracking.

## Approval Workflow Module

Approval Flow:

**Employee → Manager → Admin**

Features:

* Submit approval request.
* View approval requests.
* Approve request.
* Reject request.
* Hold request.
* Approval history tracking.
* Rejection comment support.

## Leave Request Module

* Employee leave request submission.
* Manager leave review.
* Leave approval status.
* Role-Based leave visibility.

## Dashboard & Analytics Module

Dashboard displays real-time data from FastAPI.

Features:

* Total Users.
* Total Tasks.
* Tasks by Status.
* Pending Approvals.
* Leave Requests.
* Completed Tasks.
* Task Distribution Analytics.
* Role-Based Dashboard Summary.


# Project Structure

```text
STACKLY-Mini-Enterprise/
│
├── mini-enterprise-backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── requirements.txt
│   └── README.md
│
├── mini-enterprise-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```



# API Modules

## Authentication APIs

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| POST   | `/auth/register` | Register User          |
| POST   | `/auth/login`    | Login User             |
| GET    | `/auth/me`       | Current Logged-in User |

## User APIs

| Method | Endpoint      | Description  |
| ------ | ------------- | ------------ |
| GET    | `/users`      | List Users   |
| GET    | `/users/{id}` | User Details |
| POST   | `/users`      | Create User  |
| PUT    | `/users/{id}` | Update User  |
| DELETE | `/users/{id}` | Delete User  |

## Task APIs

| Method | Endpoint             | Description            |
| ------ | -------------------- | ---------------------- |
| GET    | `/tasks`             | List Tasks             |
| GET    | `/tasks/{id}`        | Task Details           |
| POST   | `/tasks`             | Create Task            |
| PUT    | `/tasks/{id}`        | Update Task            |
| DELETE | `/tasks/{id}`        | Delete Task            |
| PATCH  | `/tasks/{id}/status` | Update Workflow Status |

## Kanban APIs

| Method | Endpoint             | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/tasks/kanban`      | Kanban Board              |
| PATCH  | `/tasks/{id}/status` | Drag & Drop Status Update |

## Comment APIs

| Method | Endpoint               | Description   |
| ------ | ---------------------- | ------------- |
| GET    | `/tasks/{id}/comments` | View Comments |
| POST   | `/tasks/{id}/comments` | Add Comment   |

## Approval APIs

| Method | Endpoint                  | Description             |
| ------ | ------------------------- | ----------------------- |
| POST   | `/approvals`              | Submit Approval Request |
| GET    | `/approvals`              | View Requests           |
| PATCH  | `/approvals/{id}/action`  | Approve / Reject / Hold |
| GET    | `/approvals/{id}/history` | Approval History        |

## Leave APIs

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| POST   | `/leave`      | Apply Leave         |
| GET    | `/leave`      | View Leave Requests |
| PATCH  | `/leave/{id}` | Update Leave Status |

## Dashboard APIs

| Method | Endpoint                       | Description                 |
| ------ | ------------------------------ | --------------------------- |
| GET    | `/dashboard/summary`           | Dashboard Summary           |
| GET    | `/dashboard/task-distribution` | Task Distribution Analytics |


# Role-Based Access Control

| Feature                 |  Admin |      Manager     |     Employee     |
| ----------------------- | :----: | :--------------: | :--------------: |
| View Users              |   All |     Employees   |         no        |
| Create User             |    yes   |         no        |         no       |
| Update User             |    yes   |         no        |         no        |
| Delete User             |    yes   |         no        |         no        |
| Create Task             |    yes   |                 |         no       |
| Assign Task             |    yes   |  Employees Only |         no        |
| Update Task             |    yes   |     Own Tasks   |    Status Only  |
| Delete Task             |    yes   |     Own Tasks   |         no        |
| View Tasks              |   All |   Created Tasks |  Assigned Tasks |
| Kanban Board            |   All |    Team Tasks   |  Assigned Tasks |
| Add Comments            |    yes   |         yes        |         yes        |
| Internal Comments       |    yes   |         yes        |         no        |
| Submit Approval Request |    no   |         no        |         yes        |
| Approve / Hold / Reject |    yes   |         yes        |         no        |
| Dashboard Analytics     | Full |       Team      |     Personal    |

---

# Database Models

## User

* id
* name
* email
* hashed_password
* role
* is_active
* created_at
* updated_at

## Task

* id
* title
* description
* status
* priority
* due_date
* created_by_id
* assigned_to_id
* created_at
* updated_at

## Comment

* id
* task_id
* user_id
* content
* is_internal
* created_at

## Approval

* id
* title
* description
* requested_by
* approver_id
* status
* current_level
* created_at

## Approval History

* id
* approval_id
* action_by
* action
* comment
* created_at

## Leave Request

* id
* employee_id
* manager_id
* reason
* start_date
* end_date
* status
* created_at

---

# Business Rules

## Workflow Rules

* Tasks follow **TODO → IN_PROGRESS → REVIEW → DONE** lifecycle.
* Invalid workflow transitions are blocked.

## Approval Rules

* Employee submits approval request.
* Manager reviews the request.
* Admin gives final approval when required.
* Rejection requires comments.
* Complete approval history is maintained.

## Comment Rules

* All comments are linked to tasks.
* Internal comments are visible only to Admin and Manager.
* Public comments are visible to authorized users.

---

# Security Features

* JWT Authentication.
* Password Hashing (bcrypt).
* Protected APIs using FastAPI Dependencies.
* Role-Based Authorization.
* Secure Request Validation using Pydantic.

---

# How to Run the Project

## Backend

1. Install dependencies.
2. Configure MySQL database.
3. Run FastAPI application.
4. Test APIs using Swagger UI.

## Frontend

1. Install dependencies.
2. Start Vite development server.
3. Login using Admin / Manager / Employee credentials.

---

# Testing

Backend APIs tested using:

* Swagger UI
* Postman

Frontend testing completed for:

* Authentication
* User Management
* Task Management
* Kanban Workflow
* Comments Module
* Approval Workflow
* Leave Requests
* Dashboard Analytics
* Protected Routes

---

# Screenshots

## Backend

* Swagger Authentication APIs
* User APIs
* Task APIs
* Kanban APIs
* Approval APIs
* Comment APIs
* Dashboard APIs

## Frontend

* Login Page
* Register Page
* Dashboard
* User Management
* Task Management
* Kanban Board
* Approval Module
* Leave Requests
* Comments Module

---

# Project Status

## Phase 1 Status

* JWT Authentication – Completed.
* Role-Based Access Control – Completed.
* User CRUD – Completed.
* Task CRUD – Completed.
* Task Assignment – Completed.
* Dashboard – Completed.
* Frontend & Backend Integration – Completed.

## Phase 2 Status

* Kanban Workflow System – Completed.
* Workflow Validation Rules – Completed.
* Comments & Collaboration Module – Completed.
* Approval Workflow Module – Completed.
* Approval History Tracking – Completed.
* Leave Request Module – Completed.
* Dashboard Analytics – Completed.
* Role-Based Dashboard Enhancements – Completed.
* Frontend & Backend Integration – Completed.

---

