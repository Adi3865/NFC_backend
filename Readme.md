# NFC Backend API

Backend application for NFC handling:

- Complaint management
- Visitor management
- Emergency broadcast

## API Documentation

The API documentation is available through Swagger UI. After starting the server, visit:

```
http://localhost:8000/api-docs
```

The Swagger documentation provides:

- Comprehensive information about all API endpoints
- Request and response schemas
- Authentication requirements
- Interactive testing interface

## Complaint Management Information

### User Flow

1. Users can submit complaints through the app
2. Complaints are categorized by type (Electrical/Civil/Misc)
3. Complaints include subcategories (e.g., Civil General/Plumbing/Carpentry)
4. Users can provide a description (max 200 words) and up to two images
5. Maintenance agency assigns the complaint for resolution
6. After resolution, the agency closes the complaint
7. User provides feedback/rating
8. If satisfied, the complaint is closed
9. If not satisfied, the complaint is automatically forwarded to Nodal Designated Appellate Authority
10. The Appellate Authority provides final resolution and closing statement
11. The complaint is closed after final resolution

### Administrative Flow

1. Admin dashboard shows comprehensive complaint tracking and management
2. Maintenance agencies can be registered under visitor module with maintenance role
3. Agency admins can assign complaints to specific staff
4. When a complaint is submitted, it appears in the app of the respective agency and at least one level up
5. Agency staff marks resolution and agency admin verifies and closes the complaint
6. Notifications are sent to users via app or SMS when status changes
7. For miscellaneous category complaints, super admin identifies suitable agency for assignment

### Resource Types and Complaint Registration

1. Resources are classified as:
   - Personal resources (residential quarters)
   - Functional resources (various offices)
   - General resources (parks, gardens, buildings, guest houses)
2. Users can select a resource allocated to them to register a complaint
3. General resources don't need to be registered against any user and are available to all for raising complaints

### Admin Functionality

1. Super Admin has access to all information and modification rights
2. Sub Admin has view permissions to all information and can assign miscellaneous category complaints
3. Category Admins have information dashboards for their specific areas
4. All category Admins have reports dashboards showing complaints registered, resolved, etc.
5. Super Admin and Sub Admin have access to all data and report generation with customizable menus
6. Super Admin and Sub Admin can view top trending charts across all groups

### Reports and Analytics

1. Admin panel includes analysis tools for:
   - Type of complaints
   - Area-wise distribution
   - Person-specific patterns
   - Cost associated with repairs
   - Frequency of repairs
   - System abuse monitoring
   - Quality metrics
   - Resource availability
2. Reports can be viewed in different formats (table, pie chart, bar graph)
3. Reports can be filtered by department, date, and type
4. Category admins have report access only to their specific areas

### Notification System

1. When a complaint is submitted, notifications are sent to respective agencies
2. Users receive notifications about complaint status changes via app or SMS
3. Broadcast or emergency messages can be pushed via app notification or SMS from admin

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB

### Installation

1. Clone the repository

```
git clone <repository-url>
```

2. Install dependencies

```
npm install
```

3. Create a .env file with the following variables:

```
NODE_ENV=development
PORT=8000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRE=30d
```

4. Start the development server

```
npm run dev
```

5. Access the Swagger documentation at:

```
http://localhost:8000/api-docs
```
