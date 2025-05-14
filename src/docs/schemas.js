/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         userId:
 *           type: string
 *           description: Custom user identifier
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password (never returned in responses)
 *         phone:
 *           type: string
 *           description: User's phone number
 *         role:
 *           type: string
 *           enum: [user, admin, superadmin]
 *           description: User role
 *         status:
 *           type: string
 *           enum: [pending, active, inactive, rejected]
 *           description: User account status
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Account last update timestamp
 *
 *     Complaint:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         title:
 *           type: string
 *           description: Title of the complaint
 *         description:
 *           type: string
 *           description: Detailed description of the complaint
 *         category:
 *           type: string
 *           description: Complaint category
 *         status:
 *           type: string
 *           enum: [open, in-progress, resolved, closed]
 *           description: Current status of the complaint
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Priority level of the complaint
 *         submittedBy:
 *           type: string
 *           description: ID of the user who submitted the complaint
 *         assignedTo:
 *           type: string
 *           description: ID of the staff assigned to handle the complaint
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of attachment URLs
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Complaint creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Complaint last update timestamp
 *
 *     Visitor:
 *       type: object
 *       required:
 *         - name
 *         - purpose
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         name:
 *           type: string
 *           description: Visitor's full name
 *         phone:
 *           type: string
 *           description: Visitor's phone number
 *         email:
 *           type: string
 *           description: Visitor's email address
 *         purpose:
 *           type: string
 *           description: Purpose of visit
 *         visitingWhom:
 *           type: string
 *           description: Person or department being visited
 *         checkIn:
 *           type: string
 *           format: date-time
 *           description: Check-in timestamp
 *         checkOut:
 *           type: string
 *           format: date-time
 *           description: Check-out timestamp
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           description: Visit status
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 */
