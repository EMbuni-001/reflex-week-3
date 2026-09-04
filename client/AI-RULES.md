Reflex — AI Rules
1. Purpose
These rules define how AI assistance and developers must work while building the Reflex live prototype.

AI-RULES.md does not redefine the Reflex product. The product and technical requirements remain defined by PROJECT_SPEC.md.

The purpose of these rules is to keep AI-assisted development:

Consistent

Beginner-friendly

Secure

Focused

Testable

Collaborative

Within the defined MVP scope

2. Project Authority
2.1 PROJECT_SPEC.md Is the Source of Truth
PROJECT_SPEC.md is the authoritative source for Reflex requirements.

Before making a significant implementation decision, Claude and developers must check the relevant requirement in PROJECT_SPEC.md.

This includes, but is not limited to:

Product scope

User roles

Permissions

Delivery workflow

Status transitions

Architecture

Technology recommendations

API design

Database model

Frontend routes

Frontend components

Backend structure

Security requirements

Real-time behavior

QR/barcode requirements

UX requirements

MVP boundaries

Testing requirements

Deployment requirements

Acceptance criteria

Executive story

Trade-offs

Cross-examination preparation

Final success criterion

2.2 No Invented Requirements
Claude must not invent product features, business requirements, integrations, workflows, technologies, or MVP requirements that are not supported by PROJECT_SPEC.md.

If a requested change is outside the specification:

Identify that it is outside the defined requirements.

Explain the conflict or scope issue.

Do not silently add it as an MVP requirement.

2.3 Conflicts Must Be Explicit
If the requested implementation conflicts with PROJECT_SPEC.md, Claude must identify the conflict instead of silently changing the specification.

The developer and team must decide how to proceed.

Claude must not treat an assumption as an approved product requirement.

3. Beginner-Friendly AI Workflow
Claude should guide the developer through implementation rather than simply producing unexplained code.

For a meaningful development task, follow this sequence.

Step 1 — Inspect Existing Work
Inspect relevant existing files before proposing implementation changes.

First determine:

What files already exist

What functionality already exists

How the existing code is organized

What conventions are already being used

Whether the requested functionality already exists partially

Which existing components, services, routes, or utilities can be reused

Do not recreate functionality that already exists without a reason.

Step 2 — Explain What Exists
Briefly explain the relevant existing implementation in beginner-friendly language.

The developer should understand what the current code is doing before changing it.

Step 3 — Explain the Requested Task
State clearly:

What needs to be implemented

Why it is needed according to PROJECT_SPEC.md

Which existing part of the application it connects to

Step 4 — Plan Before Major Changes
Before major implementation work, provide a concise implementation plan.

The plan should identify:

Main steps

Files expected to change

New files, if necessary

Integration points

Tests that should be performed

Do not make broad changes without first establishing the plan.

Step 5 — Implement in Small Steps
Prefer small, understandable changes.

Avoid changing many unrelated parts of the application at once.

After each meaningful step, keep the implementation understandable and verify that it remains consistent with the project specification.

Step 6 — Explain Important Code
Explain important implementation decisions and code sections in beginner-friendly language.

Prioritize explanations for:

Business logic

Authentication

Authorization

Status-transition rules

Database relationships

Real-time behavior

QR/barcode validation

Error handling

Integration points

Do not overwhelm the developer with explanations of obvious syntax.

Step 7 — Test
Test the implementation against the relevant requirements in PROJECT_SPEC.md.

Do not assume that generated code works simply because it looks correct.

Step 8 — Summarize
After completing the task, report:

What was implemented

Files created

Files modified

Tests performed

Problems encountered

Anything another team member needs to know

Any PROJECT_SPEC.md requirement that remains incomplete

4. Architecture Rules
Reflex must follow the specified three-layer architecture:

React Frontend → Node.js + Express API → PostgreSQL/Supabase Database

Real-time database subscriptions must be used for important delivery updates.

4.1 Frontend
Use the frontend structure and technologies defined by PROJECT_SPEC.md.

Relevant technologies include:

React

Vite

React Router

Tailwind CSS

JavaScript or TypeScript

React Hook Form

QR/barcode scanning library

QR-code generation library

Do not introduce additional frontend technologies as requirements unless they are supported by the project specification.

4.2 Backend
Use:

Node.js

Express

REST API

Authentication middleware

Role-based authorization middleware

Input validation

Centralized error handling

4.3 Database
Use PostgreSQL through Supabase.

The required database areas are:

Users/profiles

Deliveries

Riders

Delivery events

Use foreign keys and constraints where appropriate.

4.4 Separation of Responsibilities
Respect the specified backend separation:

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
Follow these responsibilities:

Routes define HTTP endpoints.

Controllers handle requests and responses.

Services contain business logic.

Middleware handles authentication, authorization, validation, and errors.

Database code remains separate from business logic.

4.5 Reuse Before Duplication
Before creating a new:

Component

Service

Utility

Validator

Middleware

API helper

UI pattern

inspect the existing project for something reusable.

Prefer extending or reusing an appropriate existing implementation over creating duplicate logic.

5. Security Rules
Security requirements from PROJECT_SPEC.md must be treated as mandatory.

5.1 Secrets
Never expose secrets.

Never place sensitive environment variables directly in frontend code.

Never commit secrets to the repository.

5.2 Database Credentials
Do not expose database or service-role credentials in frontend code.

Database/service-role credentials must remain protected.

5.3 Authentication
Authentication must be enforced by the backend.

Do not treat frontend-only authentication state as sufficient backend protection.

5.4 Authorization
Authorization must be checked server-side.

Never trust a role supplied directly by the frontend.

The backend must determine whether the authenticated user is permitted to perform the requested action.

5.5 Input Validation
Validate incoming data.

Do not assume that frontend validation alone is sufficient.

5.6 QR/Barcode Security
QR/barcode confirmation must be validated on the backend.

The backend must verify that:

The scanned delivery belongs to the Rider.

The delivery is in a valid state.

The frontend must not be allowed to bypass these checks.

5.7 Deployment Security
The deployed application must use HTTPS.

Production environment variables must be configured correctly.

6. Delivery Workflow Rules
The delivery state machine is defined by PROJECT_SPEC.md.

The permitted normal workflow is:

PENDING → ASSIGNED → PICKED_UP → OUT_FOR_DELIVERY → DELIVERED

Also supported:

ASSIGNED → CANCELLED

Where appropriate for reassignment:

ASSIGNED → PENDING

6.1 No Arbitrary Status Changes
Do not allow arbitrary status changes from the frontend or backend.

The backend must validate whether the requested status transition is permitted.

6.2 Business Logic Belongs on the Backend
Status-transition rules are business logic.

They must be enforced by the backend.

The frontend may display available actions, but the backend remains responsible for validating the transition.

6.3 Invalid Transitions
Invalid transitions must return an appropriate API error.

Do not silently accept an invalid transition.

6.4 Event History
Important delivery events must be recorded.

Relevant events include:

Delivery created

Rider assigned

Delivery picked up

Delivery moved to out-for-delivery

Delivery delivered

Delivery cancelled/reassigned

Events must include:

Event type

Delivery ID

User who performed the action

Timestamp

7. QR/Barcode Rules
Each delivery must have a unique identifier that can be represented as a QR code.

The application must support the specified workflow:

Delivery has a unique identifier.

QR code represents the identifier.

Rider scans using the device camera.

The scan identifies the delivery.

Backend verifies the delivery.

Backend verifies that the delivery belongs to the Rider.

Backend verifies that the delivery is in a valid state.

Confirmation is allowed only after successful validation.

Do not implement QR/barcode confirmation as a frontend-only trust mechanism.

8. Real-Time Rules
Real-time synchronization is a required Reflex feature.

When a delivery is assigned or its status changes, relevant users must see the update without manually refreshing the page.

The implementation must support the specified scenario:

Dispatcher assigns delivery to Rider A.

Rider A receives the assignment without refreshing.

Rider A updates the delivery to Picked Up.

Dispatcher dashboard updates automatically.

Rider scans the delivery QR code.

Backend validates the delivery and Rider.

Delivery is confirmed.

Relevant dashboards update automatically.

Delivery timeline records the event.

Do not replace required real-time behavior with a manual-refresh workflow.

9. Team Collaboration Rules
The Reflex project is developed by three team members using:

One GitHub repository

Separate feature branches

GitHub Codespaces

Normal Claude web

Shared AI-RULES.md

Shared README.md

9.1 Branch Discipline
Work only on the assigned feature branch.

Do not directly push unfinished feature work to main.

Do not make unrelated changes on another developer's feature branch.

9.2 Focused Commits
Keep commits focused.

A commit should represent a coherent change rather than mixing unrelated features, refactoring, formatting, and fixes.

9.3 Avoid Unnecessary Refactoring
Do not refactor unrelated code simply because another implementation style is preferred.

If refactoring is necessary for the requested feature, explain why before making a broad change.

9.4 Shared Files
Shared files can affect multiple team members.

Before changing important shared files, explain:

Why the change is required

Which team members may be affected

What integration point is being changed

Avoid unnecessary modifications to shared files.

9.5 Existing Work
Do not overwrite another developer's work unnecessarily.

Before modifying code that appears to belong to another feature, inspect the current implementation and identify the integration point.

10. Three-Member Ownership
The three members have the following primary ownership areas.

Ownership is intended to reduce conflicts and clarify responsibilities. It does not remove the need for integration and review.

Member 1 — Retailer + Frontend/Delivery Creation
Primary focus:

Retailer interfaces

Retailer dashboard

Delivery creation

Delivery creation form

Delivery details relevant to Retailer Staff

Related frontend components

Relevant specification areas include:

Retailer Staff role

/retailer/dashboard

/retailer/deliveries/new

/retailer/deliveries/:id

Delivery creation requirements

Member 2 — Backend + Database + Dispatcher/Assignment
Primary focus:

Backend API

Authentication and authorization middleware

Validation

Business logic

Database structure

Delivery assignment

Dispatcher functionality

Delivery event persistence

Relevant specification areas include:

Node.js + Express API

PostgreSQL/Supabase

Dispatcher role

Delivery assignment

Status-transition business rules

Delivery events

Backend structure

Member 3 — Rider + QR + Real-Time + QA Integration
Primary focus:

Rider interfaces

Rider workflow

QR/barcode scanning

QR confirmation integration

Real-time behavior

Integration testing

Mobile Rider workflow

End-to-end QA

Relevant specification areas include:

Rider role

/rider/dashboard

/rider/deliveries/:id

/rider/scan

QR/barcode requirements

Real-time requirements

Testing requirements

End-to-end success scenario

11. Team Integration Points
The ownership areas are connected and must be coordinated.

11.1 Member 1 ↔ Member 2
Coordinate around:

Delivery creation API

Delivery data fields

Authentication

Authorization

Delivery status

Delivery identifiers

Member 1 should not invent API behavior that conflicts with the backend design.

Member 2 should communicate backend contract changes that affect the Retailer frontend.

11.2 Member 2 ↔ Member 3
Coordinate around:

Delivery assignment

Rider identity

Assigned delivery retrieval

Status-transition API

QR confirmation endpoint

Backend validation

Delivery events

Real-time updates

Member 3 must rely on backend validation rather than implementing security-sensitive business rules only in the frontend.

11.3 Member 1 ↔ Member 3
Coordinate around:

Shared delivery display

Status indicators

Delivery details

Reusable components

Real-time delivery status presentation

11.4 Shared Integration Contract
Before integrating work, the team should agree on the relevant:

Route

Request data

Response data

Delivery status values

Identifier usage

Error behavior

Do not silently change a shared contract.

12. Normal Claude Web Limitations
Claude web is an AI assistant, not the GitHub source of truth.

Claude must not claim to have performed an action that it did not actually perform.

Claude must not claim that it:

Committed code

Pushed code

Merged a branch

Created a GitHub branch

Changed a repository

Deployed the application

Ran tests

Verified a live deployment

unless it actually has the capability and has performed that action.

Developers remain responsible for:

Moving generated code into the appropriate Codespace/project files.

Reviewing the generated code.

Testing the implementation.

Checking the implementation against PROJECT_SPEC.md.

Committing the work.

Pushing the work to the correct feature branch.

Integrating the work with the team.

Claude should clearly distinguish between:

Code it generated

Actions the developer must perform

Tests it can reason about

Tests that must actually be executed

13. Working With Existing Code
Before changing an existing implementation:

Inspect the relevant files.

Understand the current behavior.

Identify dependencies and integration points.

Check whether the current implementation already satisfies part of the requirement.

Reuse existing code where appropriate.

Make the smallest reasonable change.

Do not replace working project code simply to produce a different implementation.

Do not create duplicate implementations of the same business rule.

14. API Development Rules
Follow the API design defined in PROJECT_SPEC.md.

Specified endpoints include:

POST /api/auth/login

GET /api/deliveries
POST /api/deliveries
GET /api/deliveries/:id
PATCH /api/deliveries/:id/assign
PATCH /api/deliveries/:id/status
POST /api/deliveries/:id/confirm
GET /api/deliveries/:id/events
GET /api/riders
GET /api/dashboard
Do not create unnecessary endpoints.

Every endpoint should have a clear purpose.

Backend logic must enforce:

Authentication

Authorization

Input validation

Status-transition rules

QR/barcode confirmation rules

Appropriate error handling

15. Database Development Rules
Use PostgreSQL through Supabase.

Respect the required data model:

Users
id

name

email

phone

role

created_at

Deliveries
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
id

delivery_id

event_type

performed_by

metadata

created_at

A user with the Rider role can be assigned to deliveries.

A delivery can have many delivery events.

Use foreign keys and constraints where appropriate.

Do not add unrelated database entities as part of the MVP.

16. Frontend Development Rules
Respect the role-specific route structure defined in PROJECT_SPEC.md:

/login

/retailer/dashboard
/retailer/deliveries/new
/retailer/deliveries/:id

/dispatcher/dashboard
/dispatcher/deliveries/:id

/rider/dashboard
/rider/deliveries/:id
/rider/scan
Use reusable components where appropriate, including:

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

Do not duplicate components unnecessarily.

Prioritize clarity over visual complexity.

The Rider interface must work well on mobile devices.

17. Code Quality Rules
17.1 Existing Conventions
Follow existing project conventions when they do not conflict with PROJECT_SPEC.md.

17.2 Simplicity
Prefer simple, maintainable solutions.

Do not introduce complexity merely to make the implementation appear sophisticated.

17.3 Dependencies
Avoid unnecessary dependencies.

Before adding a dependency, verify that the required functionality cannot reasonably be handled using existing project capabilities or the technologies already specified.

17.4 Duplicate Logic
Avoid duplicate logic.

Business rules such as delivery status transitions should have a clear authoritative implementation on the backend.

17.5 Focused Changes
Keep changes focused on the requested feature or requirement.

Avoid unrelated:

Refactoring

Dependency changes

File reorganizations

UI redesigns

API changes

Database changes

unless they are necessary for the task.

18. Testing Rules
Every implemented feature must be tested against the relevant requirements in PROJECT_SPEC.md.

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

18.1 Security Testing
Test that:

Unauthorized users cannot access restricted functionality.

Frontend-supplied role information cannot bypass server-side authorization.

Invalid input is rejected.

Unauthorized delivery confirmation is rejected.

Invalid delivery status transitions are rejected.

18.2 Workflow Testing
Test the complete required workflow:

Retailer creates delivery → Dispatcher assigns rider → Rider sees assignment → Rider updates status → Rider scans QR → Delivery is confirmed → Dispatcher sees updated status → Event history records the workflow.

18.3 Real-Time Testing
Verify that relevant users receive assignment and status changes without manually refreshing the page.

18.4 QR Testing
Verify:

QR generation

QR scanning

Valid delivery confirmation

Unauthorized delivery confirmation rejection

Invalid-state confirmation rejection

18.5 Deployment Testing
The final demonstration must use the deployed application rather than depend on localhost.

19. Scope Control
The following features are explicitly outside the Reflex MVP:

Full GPS tracking

Route optimization

Payments

Customer mobile application

SMS gateway

WhatsApp integration

Complex analytics

Multi-company enterprise administration

Advanced fleet management

Do not implement these as MVP features.

They may be documented as future roadmap items, consistent with PROJECT_SPEC.md.

Do not replace excluded features with invented alternatives.

20. Handling Requests Outside Scope
When a developer asks Claude to implement something outside the defined MVP:

Check PROJECT_SPEC.md.

Identify whether the request is supported.

If it is excluded, clearly state that it is outside the MVP.

Do not silently implement it as part of Reflex.

If appropriate, identify it as a future-roadmap item rather than changing the MVP.

When the request is ambiguous, ask for clarification rather than inventing a requirement.

21. Requirements Traceability
For meaningful changes, Claude should identify the relevant PROJECT_SPEC.md requirement before implementation.

The developer should be able to answer:

Which requirement does this change implement?

Which role uses it?

Which route/API/database area does it affect?

What business rule applies?

How will it be tested?

Does it affect another team member's area?

This keeps implementation connected to the product specification.

22. Integration and Merge Discipline
Before another developer integrates a feature:

Confirm the feature is focused.

Confirm the implementation follows the project specification.

Confirm relevant tests have been performed.

Identify shared files changed.

Identify API/database/component contracts affected.

Identify anything another developer needs to adjust.

Do not merge incomplete functionality without clearly identifying what remains unfinished.

23. No Silent Requirement Changes
Claude and developers must not silently change:

User roles

Permissions

Delivery statuses

Status transitions

API responsibilities

Database responsibilities

Security requirements

MVP boundaries

Required workflow

Acceptance criteria

If a change is believed to be necessary, identify it explicitly and resolve the conflict before treating it as an approved requirement.

24. AI Output Rules During Implementation
Claude should communicate in a way that a beginner developer can follow.

For implementation tasks, prefer this structure:

Existing State
Explain what relevant code already exists.

Task
Explain what needs to be done.

Plan
List the implementation steps.

Files
Identify files that will be created or modified.

Implementation
Provide the focused implementation.

Explanation
Explain important code and decisions.

Testing
State what should be tested and what was actually tested.

Integration Notes
Explain anything another team member needs to know.

Do not claim tests or actions were performed when they were not.

25. Final AI Response Format
After completing a task, Claude must report the following:

What Was Implemented
Clearly summarize the completed functionality.

Files Created
List every newly created file.

If none were created, state that none were created.

Files Modified
List every modified file.

If none were modified, state that none were modified.

Tests Performed
List the tests that were actually performed.

Do not list unperformed tests as completed.

Problems Encountered
List errors, limitations, blockers, or unresolved issues.

If there were none, state that there were no known problems.

Team Notes
State anything another team member needs to know, especially:

Shared-file changes

API contract changes

Database changes

Component changes

Integration dependencies

Follow-up work

Remaining Requirements
Identify any requirement from PROJECT_SPEC.md that remains incomplete.

If all relevant requirements for the task are complete, state that clearly.

26. Definition of AI-Assisted Completion
An AI-assisted task is not considered complete merely because Claude generated code.

Completion requires the developer/team to:

Review the generated code.

Place it into the correct project files.

Verify that it follows PROJECT_SPEC.md.

Run the relevant tests.

Resolve errors.

Confirm integration behavior.

Commit the focused work.

Push it to the appropriate feature branch.

Communicate integration notes to the team.

The final Reflex prototype must satisfy the acceptance criteria and final success criterion in PROJECT_SPEC.md.

27. Final End-to-End Guardrail
Before considering the Reflex MVP ready for demonstration, the team must verify the complete required scenario:

Log in as retailer → create delivery → log in/view as dispatcher → assign rider → view as rider → update status → scan QR → confirm delivery → return to dispatcher → observe updated delivery status and event history.

The implementation must remain within the defined MVP scope and demonstrate intentional, understandable, testable, and defensible engineering decisions.