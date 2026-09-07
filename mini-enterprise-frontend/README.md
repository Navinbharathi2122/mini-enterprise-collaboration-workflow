# STACKLY - Mini Enterprise Collaboration & Workflow Management System

## About the Project

STACKLY is a Mini Enterprise Collaboration and Workflow Management System developed as part of **Phase 1**. The application helps organizations manage users and tasks through a secure role-based workflow system.

The project is built with **FastAPI** for the backend and **React + Vite** for the frontend. It uses JWT authentication and Role-Based Access Control (RBAC) for Admin, Manager, and Employee users.





### Backend

* FastAPI
* SQLAlchemy
* Pydantic
* Alembic
* MySQL
* JWT Authentication
* Bcrypt Password Hashing

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router DOM
* Axios



## User Roles

### Admin

* Manage all users.
* Create, update and delete users.
* Create and assign tasks to any user.
* View all tasks and dashboard details.

### Manager

* View employees.
* Create tasks.
* Assign tasks only to employees.
* Update tasks created by the manager.

### Employee

* View only assigned tasks.
* Update task status.
* Cannot create, assign or delete tasks.


## Features Implemented

### Authentication

* User Registration
* User Login
* JWT Token Authentication
* Current Logged-in User (`/auth/me`)

### User Management

* Create User
* View Users
* Update User
* Delete User

### Task Management

* Create Task
* View Tasks
* Update Task
* Delete Task
* Assign Task
* Task Status and Priority

### Dashboard

* Total Users
* Total Tasks
* Pending Tasks
* Completed Tasks
* Role-Based Dashboard View

---

## Project Structure

```text
STACKLY-Mini-Enterprise
│
├── mini-enterprise-backend
│   ├── app
│   ├── alembic
│   ├── requirements.txt
│   └── main.py
│
├── mini-enterprise-frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## API Modules

### Authentication APIs

* POST `/auth/register`
* POST `/auth/login`
* GET `/auth/me`

### User APIs

* GET `/users`
* GET `/users/{id}`
* POST `/users`
* PUT `/users/{id}`
* DELETE `/users/{id}`

### Task APIs

* POST `/tasks`
* GET `/tasks`
* GET `/tasks/{id}`
* PUT `/tasks/{id}`
* PATCH `/tasks/{id}/assign`
* DELETE `/tasks/{id}`

### Dashboard API

* GET `/dashboard`

---

## Role-Based Access Control

| Feature     |    Admin    |      Manager     |     Employee     |
| ----------- | :---------: | :--------------: | :--------------: |
| View Users  |      YES      | YES Employees Only |        NO        |
| Create User |      YES      |         NO        |         NO        |
| Update User |      YES      |         NO        |         NO        |
| Delete User |      YES      |         NO        |         NO        |
| Create Task |      YES     |         YES        |         NO        |
| Assign Task |      YES     | YES Employees Only |         NO        |
| Update Task |      YES     |         YES        |   YES Status Only  |
| Delete Task |      YES     |         NO        |         NO        |
| View Tasks  | YES All Tasks |  YES Related Tasks | YES Assigned Tasks |

---

## Database Models

### User

* id
* name
* email
* hashed_password
* role
* is_active
* created_at
* updated_at

### Task

* id
* title
* description
* status
* priority
* due_date
* created_by
* assigned_to
* created_at
* updated_at

---

## How to Run the Project

### Backend

1. Install the backend dependencies.
2. Configure the database.
3. Run the FastAPI server.
4. Open Swagger UI.

### Frontend

1. Install frontend dependencies.
2. Start the Vite development server.
3. Open the application in the browser.

---

## Testing

The project was tested using **Swagger UI** and **Postman**.

The frontend was tested for:

* Admin Login
* Manager Login
* Employee Login
* User Management
* Task Management
* Dashboard
* Protected Routes

---

## Screenshots

### Swagger UI

* Authentication APIs
* User APIs
* Task APIs
* Dashboard API

### Frontend

* Login Page
* Dashboard
* User Management
* Task Management
* Manager Dashboard
* Employee Dashboard

---

## Project Status

* JWT Authentication Completed.
* Role-Based Access Control Completed.
* User CRUD Completed.
* Task CRUD Completed.
* Task Assignment Completed.
* Dashboard Completed.
* Frontend and Backend Integration Completed.


