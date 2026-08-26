# reflex-week-3
# Reflex

Reflex is a live delivery-management prototype for small Kenyan retailers such as electronics shops, pharmacies, and hardware stores.

It provides a centralized workflow for creating, assigning, tracking, and confirming deliveries:

Retailer Staff → Create Delivery → Dispatcher Assigns Rider → Rider Updates Status → Retailer/Dispatcher Sees Live Status

The prototype demonstrates role-based access, controlled delivery status transitions, real-time synchronization, QR/barcode confirmation, and a delivery-event audit trail.

Source of truth: PROJECT_SPEC.md defines the Reflex product and technical requirements. AI-RULES.md defines how AI assistance and the three-person team should work within those requirements.

**Overview**

Small retailers currently coordinate deliveries through WhatsApp and phone calls. This can result in:

No central delivery record

No clear assignment of deliveries to riders

Poor status visibility

Difficulty knowing which deliveries are still pending

No reliable proof that an order was delivered

Manual communication between retailer staff, dispatchers, and riders

Reflex addresses this with a simple delivery-management workflow involving three user roles:

Retailer Staff

Dispatcher

Rider

The prototype demonstrates:

Role-based authentication

Delivery creation

Rider assignment

Controlled delivery status updates

Real-time synchronization

QR/barcode confirmation

Delivery history and audit events

User Roles

Retailer Staff

Retailer Staff can:

Log in

Create a delivery request

Enter customer name

Enter customer phone

Enter delivery address

Enter item/order description

View delivery status

View delivery details

Dispatcher

Dispatcher can:

Log in

View unassigned/open deliveries

View available riders

Assign a delivery to a rider

Reassign a delivery when necessary

View delivery status

View delivery history

Rider

Rider can:

Log in

View assigned deliveries

Open delivery details

Update delivery status

Scan a QR/barcode to confirm the correct order

Confirm delivery

Core Workflow

The normal delivery lifecycle is:

Pending
   ↓
Assigned
   ↓
Picked Up
   ↓
Out for Delivery
   ↓
Delivered

The specification also permits:

Assigned → Cancelled

and, where a dispatcher needs to reassign a delivery:

Assigned → Pending

Arbitrary status changes are not permitted.

The backend must validate whether a requested status transition is allowed. The frontend must not be treated as the authority for delivery-state changes.

**Key Features**

The Reflex MVP is required to demonstrate:

Authentication

Role-based access

Delivery creation

Dispatcher assignment

Rider workflow

Real-time synchronization

QR/barcode confirmation

Delivery history and audit trail

Input validation

Security controls

Error handling

This README describes what the specification requires. It does not mean every item is already implemented.

Technology Stack

**Frontend**

The specified frontend technologies are:

React

Vite

React Router

Tailwind CSS

JavaScript or TypeScript

React Hook Form

A QR/barcode scanning library

A QR-code generation library

**Backend**

The specified backend technologies and responsibilities are:

Node.js

Express

REST API

Authentication middleware

Role-based authorization middleware

Input validation

Centralized error handling

**Database**

The specified database is:

PostgreSQL through Supabase

Real-time database subscriptions for important delivery updates

**Architecture**

Reflex follows a simple three-layer architecture:

┌──────────────────────────┐
│     React Frontend       │
│  Routes, UI, workflows   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   Node.js + Express API  │
│ Auth, validation,        │
│ authorization, business  │
│ logic and REST API       │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ PostgreSQL / Supabase    │
│ Data + real-time         │
│ subscriptions            │
└──────────────────────────┘

Frontend

The React frontend provides the role-specific interfaces, delivery views, forms, status displays, QR-code functionality, scanning interface, and real-time presentation.

API

The Node.js + Express layer provides the REST API and handles authentication, authorization, validation, business logic, and error handling.

Database

PostgreSQL through Supabase stores the required users/profiles, deliveries, riders, and delivery events and provides the specified real-time database subscriptions.

**Project Structure**

The project specification recommends a modular backend structure:

server/
src/
  controllers/
  routes/
  middleware/
  services/
  validators/
  utils/
  config/
db/
app.js
server.js

The exact repository layout for the complete application may include the frontend and documentation alongside the backend structure above.

**Backend Responsibilities**

Area

Responsibility

routes/

Define HTTP endpoints

controllers/

Handle requests and responses

services/

Contain business logic

middleware/

Authentication, authorization, validation, and errors

validators/

Support input validation

utils/

Shared utility logic

config/

Configuration

db/

Database code kept separate from business logic

The team should preserve separation of responsibilities and reuse existing components and services rather than duplicating logic.

**Frontend Routes**

The specified role-specific routes are:

Route

Purpose

/login

User login

/retailer/dashboard

Retailer Staff dashboard

/retailer/deliveries/new

Create a new delivery

/retailer/deliveries/:id

View a Retailer delivery

/dispatcher/dashboard

Dispatcher dashboard

/dispatcher/deliveries/:id

View and manage a Dispatcher delivery

/rider/dashboard

Rider dashboard

/rider/deliveries/:id

View and manage an assigned delivery

/rider/scan

Rider QR/barcode scanning interface

Access to functionality must remain appropriate to the authenticated user's role.

**Reusable Components**

The specification identifies these reusable components:

Navbar

Sidebar

DeliveryCard

DeliveryTable

StatusBadge

DeliveryTimeline

AssignmentModal

QRScanner

QRCode

LoadingState

ErrorState

ConfirmationDialog

The specification does not define the internal implementation of these components. Their implementation should therefore follow the project's established conventions while satisfying the relevant Reflex requirements.

**API**

The specified REST endpoints are:

Method

Endpoint

Intended purpose

POST

/api/auth/login

Authenticate a user

GET

/api/deliveries

Retrieve deliveries

POST

/api/deliveries

Create a delivery

GET

/api/deliveries/:id

Retrieve delivery details

PATCH

/api/deliveries/:id/assign

Assign or reassign a delivery to a rider

PATCH

/api/deliveries/:id/status

Request a delivery status transition

POST

/api/deliveries/:id/confirm

Confirm a delivery

GET

/api/deliveries/:id/events

Retrieve delivery event history

GET

/api/riders

Retrieve riders for assignment

GET

/api/dashboard

Retrieve dashboard information

The project specification does not define complete request/response schemas. Do not assume additional fields, payload formats, authentication details, or error schemas from this README.

The API should remain small and resource-oriented. The specification explicitly says not to create unnecessary endpoints.

**Database**

The required database areas are:

users / profiles

deliveries

riders

delivery_events

Users

The specified fields are:

id

name

email

phone

role

created_at

Deliveries

The specified fields are:

id

tracking_code

customer_name

customer_phone

address

item_description

status

created_by

assigned_rider_id

created_at

updated_at

delivered_at

Delivery Events

The specified fields are:

id

delivery_id

event_type

performed_by

metadata

created_at

**Relationships**

The specification defines these relationships:

A user with the Rider role can be assigned to deliveries.

A delivery can have many delivery events.

Foreign keys and constraints should be used where appropriate.

The specification does not define additional database tables or fields beyond those listed above.

**Security**

Reflex must demonstrate basic production-minded security.

Required practices include:

Passwords must never be stored as plain text.

Authentication must be enforced by the backend.

Authorization must be checked server-side.

All incoming data must be validated.

Frontend-supplied role information must not be trusted.

Sensitive environment variables must be protected.

Database/service-role credentials must not be exposed in frontend code.

QR/barcode confirmation must be validated on the server.

HTTPS must be used in the deployed application.

This README does not define secret names, credentials, or environment-variable names because the project specification does not provide them.

**Real-Time Behaviour**

Real-time synchronization is a required part of the prototype.

Important delivery updates must be visible to relevant users without manually refreshing the page.

The specified scenario is:

Dispatcher assigns delivery to Rider A
              ↓
Rider A receives assignment without refreshing
              ↓
Rider updates delivery to Picked Up
              ↓
Dispatcher dashboard updates automatically
              ↓
Rider scans delivery QR code
              ↓
Backend validates delivery and Rider
              ↓
Delivery is confirmed
              ↓
Relevant dashboards update automatically
              ↓
Delivery timeline records the event

The final implementation should demonstrate this behavior during testing and the live demo.

**QR/Barcode Confirmation**

Each delivery must have a unique identifier that can be represented as a QR code.

The Rider must be able to use the device camera to scan the code and identify or confirm the delivery.

The backend must verify:

The scanned delivery belongs to the Rider.

The delivery is in a valid state.

Confirmation must only be allowed after successful backend validation.

If validation fails, the confirmation must not be accepted.

**Development Workflow**

The specification defines the following implementation order:

Define requirements and acceptance criteria.

Design architecture.

Design database schema.

Set up repository and project structure.

Implement database.

Implement authentication.

Implement delivery creation.

Implement dispatcher assignment.

Implement rider status workflow.

Implement delivery event history.

Implement real-time synchronization.

Implement QR generation.

Implement QR scanning and backend verification.

Build dashboards.

Add validation and error handling.

Test the complete workflow.

Deploy frontend and backend.

Seed realistic demonstration data.

Perform an end-to-end live demo.

Document architecture, trade-offs, limitations, and roadmap.

**Three-Person Team Workflow**

All three developers work on the same Reflex project and repository.

The recommended ownership areas are:

Developer 1 — Retailer + Frontend + Delivery Creation

Primary ownership:

Retailer interface

Frontend foundation

Delivery creation

Relevant areas include:

Retailer dashboard

New delivery interface

Retailer delivery details

Delivery creation workflow

Related frontend components

Developer 2 — Backend + Database + Dispatcher

Primary ownership:

Backend

Database

Dispatcher workflow

Delivery assignment

Status-transition business logic

Relevant areas include:

Node.js + Express API

PostgreSQL/Supabase

Authentication and authorization

Delivery assignment

Backend status validation

Delivery event handling

Developer 3 — Rider + QR + Real-Time + QA

Primary ownership:

Rider workflow

QR generation/scanning

Real-time integration

End-to-end QA/integration

Relevant areas include:

Rider dashboard

Rider delivery details

QR scanning

QR confirmation

Real-time delivery updates

Mobile Rider workflow

End-to-end testing

These are ownership areas within one application, not three separate applications.

The team must coordinate where features cross ownership boundaries.

**GitHub Workflow**

The team uses one shared GitHub repository with separate feature branches.

The recommended workflow is:

main
  │
  ▼
feature branch
  │
  ▼
development
  │
  ▼
testing
  │
  ▼
focused commit
  │
  ▼
push
  │
  ▼
Pull Request
  │
  ▼
review
  │
  ▼
merge

Developers should avoid directly pushing unfinished work to main.

Keep commits focused and avoid unnecessary refactoring of another developer's work.

Shared-file changes should be coordinated because they may affect multiple areas of the application.

**Codespaces**

Each developer should use their own GitHub Codespace from the shared repository.

Codespaces provide each developer with a development environment for working on their assigned feature branch.

The project specification does not define exact Codespaces configuration, commands, credentials, or environment-variable names. Those values must therefore be configured according to the actual implementation rather than invented in this README.

**Working With Normal Claude**

Normal Claude is an AI assistant used to support development. It is not the GitHub source of truth.

For AI-assisted work, provide Claude with:

PROJECT_SPEC.md

AI-RULES.md

README.md

Relevant source files

The expected workflow is:

Understand the project.

Understand the assigned task.

Inspect relevant existing files.

Explain the existing implementation.

Create an implementation plan.

Generate or suggest the implementation.

Help debug and test.

Summarize changes and remaining issues.

Developers remain responsible for:

Reviewing generated code

Moving generated code into the appropriate Codespace/project files

Testing the implementation

Checking the work against PROJECT_SPEC.md

Committing changes

Pushing changes to the correct feature branch

Integrating the work with the team

Claude must not claim to have executed actions it did not actually execute.

Testing

At minimum, the project must test:

User login

Role restrictions

Delivery creation

Rider assignment

Valid status transition

Invalid status transition

Real-time status update

QR generation

QR scanning

Unauthorized delivery confirmation

Delivery event creation

Error handling

Mobile Rider workflow

Testing should verify both successful and invalid workflows where required by the specification.

End-to-End Test

The most important test is:

Retailer creates delivery
        ↓
Dispatcher assigns rider
        ↓
Rider sees assignment
        ↓
Rider updates status
        ↓
Rider scans QR
        ↓
Delivery is confirmed
        ↓
Dispatcher sees updated status
        ↓
Event history records the workflow

This is also the core workflow that should be demonstrated during the live prototype evaluation.

Deployment

The specified deployment approach is:

Frontend
   ↓
Vercel

Backend
   ↓
Render/Railway or another suitable Node hosting service

Database + Real-Time
   ↓
Supabase

The project specification does not establish that any particular deployment has already been completed.

The final prototype must:

Be accessible through a real URL.

Not depend on localhost for the demonstration.

Use correctly configured production environment variables.

Use HTTPS.

The exact deployment configuration must follow the actual implementation.

MVP Scope

The Reflex MVP intentionally does not include:

Full GPS tracking

Route optimization

Payments

Customer mobile application

SMS gateway

WhatsApp integration

Complex analytics

Multi-company enterprise administration

Advanced fleet management

These are documented as future roadmap items rather than MVP features.

No excluded feature should be treated as part of the current prototype.

**Demo Scenario**

The final live demonstration should follow this sequence:

Log in as retailer
        ↓
Create delivery
        ↓
View as dispatcher
        ↓
Assign rider
        ↓
View as rider
        ↓
Update status
        ↓
Scan QR
        ↓
Confirm delivery
        ↓
Return to dispatcher
        ↓
Observe updated status
        ↓
Inspect event history

The final success criterion is that an evaluator can perform this workflow through the deployed Reflex prototype.

**Troubleshooting**

This section is intentionally limited to issues that can be derived from the project requirements.

Authentication or Role Access Problems

Check that the user is authenticated and that access is being enforced according to the user's role.

The backend must remain responsible for authentication and authorization.

Invalid Status Transition

A status transition may fail when it is not one of the permitted transitions.

The backend must validate delivery status transitions.

Real-Time Updates Not Appearing

The required behavior is that relevant delivery updates appear without manual page refresh.

Check the real-time implementation and the relevant delivery update flow.

QR Confirmation Failing

QR confirmation depends on backend validation.

The backend must verify that:

The delivery belongs to the Rider.

The delivery is in a valid state.

**Environment Configuration**

The specification requires protected sensitive environment variables and correctly configured production environment variables.

Exact variable names and values are not defined by the specification and must come from the actual implementation.

Frontend/Backend Connection Issues

The application uses the specified React frontend and Node.js + Express API architecture.

Exact connection configuration is implementation-specific and is not defined by the project specification.

**Project Status**

Status: Implementation status to be updated by the development team.

This README describes the intended Reflex MVP based on the project specification. It does not claim that every specified feature has already been implemented.

**License / Credits**

Licensing information has not yet been defined in the Reflex project specification.

No license should be assumed or invented in this README.

**Related Project Documents**

The Reflex project uses three shared documentation files:

PROJECT_SPEC.md — product and technical source of truth

AI-RULES.md — rules for AI-assisted development and team collaboration

README.md — practical project entry point and orientation

When requirements are unclear, consult PROJECT_SPEC.md rather than inventing or silently changing a requirement.
