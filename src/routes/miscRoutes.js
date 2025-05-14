const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const { validate } = require("../middleware/validator");
const {
  broadcastSchema,
  pollSchema,
  pollResponseSchema,
} = require("../utils/miscValidations");

// Import controllers
const {
  getDashboardData,
  getUserDashboardData,
} = require("../controllers/miscController");

const {
  createBroadcast,
  getAllBroadcasts,
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
  sendBroadcast,
  cancelScheduledBroadcast,
  processScheduledBroadcasts,
} = require("../controllers/broadcastController");

const {
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
  deletePoll,
  submitPollResponse,
  getPollResults,
  closePoll,
  archivePoll,
  getActivePolls,
} = require("../controllers/pollController");

// All routes are protected
router.use(protect);

// General misc routes
/**
 * @swagger
 * /misc/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Dashboard]
 *     description: Retrieve dashboard data for admin users (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 450
 *                         active:
 *                           type: number
 *                           example: 380
 *                         pending:
 *                           type: number
 *                           example: 25
 *                     complaints:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 320
 *                         open:
 *                           type: number
 *                           example: 45
 *                         inProgress:
 *                           type: number
 *                           example: 120
 *                         resolved:
 *                           type: number
 *                           example: 130
 *                         closed:
 *                           type: number
 *                           example: 25
 *                     visitors:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 250
 *                         pending:
 *                           type: number
 *                           example: 30
 *                         active:
 *                           type: number
 *                           example: 45
 *                         completed:
 *                           type: number
 *                           example: 175
 *                     resources:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 520
 *                         personal:
 *                           type: number
 *                           example: 320
 *                         functional:
 *                           type: number
 *                           example: 150
 *                         general:
 *                           type: number
 *                           example: 50
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/dashboard",
  checkRole("superAdmin", "departmentAdmin"),
  getDashboardData
);

/**
 * @swagger
 * /misc/user-dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     tags: [Dashboard]
 *     description: Retrieve dashboard data for regular users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     complaints:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 12
 *                         open:
 *                           type: number
 *                           example: 2
 *                         inProgress:
 *                           type: number
 *                           example: 5
 *                         resolved:
 *                           type: number
 *                           example: 3
 *                         closed:
 *                           type: number
 *                           example: 2
 *                     visitors:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 8
 *                         pending:
 *                           type: number
 *                           example: 2
 *                         active:
 *                           type: number
 *                           example: 1
 *                         completed:
 *                           type: number
 *                           example: 5
 *                     resources:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                           example: 3
 *                         active:
 *                           type: number
 *                           example: 2
 *                         pending:
 *                           type: number
 *                           example: 1
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c85
 *                           message:
 *                             type: string
 *                             example: Your complaint has been assigned to a maintenance staff
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           read:
 *                             type: boolean
 *                             example: false
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/user-dashboard", getUserDashboardData);

// Broadcast routes - Admin only
/**
 * @swagger
 * /misc/broadcasts:
 *   post:
 *     summary: Create a new broadcast
 *     tags: [Broadcasts]
 *     description: Create a new broadcast message (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - audience
 *             properties:
 *               title:
 *                 type: string
 *                 example: Emergency Maintenance Notice
 *               message:
 *                 type: string
 *                 example: Water supply will be interrupted on July 15th from 10 AM to 2 PM for maintenance.
 *               audience:
 *                 type: string
 *                 enum: [all, residents, staff, maintenance]
 *                 example: all
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, emergency]
 *                 example: medium
 *               sendSMS:
 *                 type: boolean
 *                 example: false
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-07-14T09:00:00Z
 *                 description: Leave empty to send immediately
 *     responses:
 *       201:
 *         description: Broadcast created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     title:
 *                       type: string
 *                       example: Emergency Maintenance Notice
 *                     message:
 *                       type: string
 *                       example: Water supply will be interrupted on July 15th from 10 AM to 2 PM for maintenance.
 *                     audience:
 *                       type: string
 *                       example: all
 *                     priority:
 *                       type: string
 *                       example: medium
 *                     sendSMS:
 *                       type: boolean
 *                       example: false
 *                     scheduledFor:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-07-14T09:00:00Z
 *                     status:
 *                       type: string
 *                       example: scheduled
 *                     createdBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/broadcasts",
  checkRole("superAdmin", "departmentAdmin"),
  validate(broadcastSchema),
  createBroadcast
);

/**
 * @swagger
 * /misc/broadcasts:
 *   get:
 *     summary: Get all broadcasts
 *     tags: [Broadcasts]
 *     description: Retrieve all broadcast messages (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sent, cancelled]
 *         description: Filter by broadcast status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, emergency]
 *         description: Filter by priority level
 *       - in: query
 *         name: audience
 *         schema:
 *           type: string
 *           enum: [all, residents, staff, maintenance]
 *         description: Filter by target audience
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of broadcasts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     broadcasts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c85
 *                           title:
 *                             type: string
 *                             example: Emergency Maintenance Notice
 *                           audience:
 *                             type: string
 *                             example: all
 *                           priority:
 *                             type: string
 *                             example: medium
 *                           status:
 *                             type: string
 *                             example: scheduled
 *                           scheduledFor:
 *                             type: string
 *                             format: date-time
 *                             example: 2023-07-14T09:00:00Z
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalDocs:
 *                           type: number
 *                           example: 50
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         totalPages:
 *                           type: number
 *                           example: 5
 *                         page:
 *                           type: number
 *                           example: 1
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/broadcasts",
  checkRole("superAdmin", "departmentAdmin"),
  getAllBroadcasts
);

/**
 * @swagger
 * /misc/broadcasts/{id}:
 *   get:
 *     summary: Get a broadcast by ID
 *     tags: [Broadcasts]
 *     description: Retrieve a specific broadcast by its ID (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     responses:
 *       200:
 *         description: Broadcast retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     title:
 *                       type: string
 *                       example: Emergency Maintenance Notice
 *                     message:
 *                       type: string
 *                       example: Water supply will be interrupted on July 15th from 10 AM to 2 PM for maintenance.
 *                     audience:
 *                       type: string
 *                       example: all
 *                     priority:
 *                       type: string
 *                       example: medium
 *                     sendSMS:
 *                       type: boolean
 *                       example: false
 *                     scheduledFor:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-07-14T09:00:00Z
 *                     status:
 *                       type: string
 *                       example: scheduled
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 60d21b4667d0d8992e610c86
 *                         name:
 *                           type: string
 *                           example: Admin User
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Broadcast not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/broadcasts/:id",
  checkRole("superAdmin", "departmentAdmin"),
  getBroadcastById
);

/**
 * @swagger
 * /misc/broadcasts/{id}:
 *   put:
 *     summary: Update a broadcast
 *     tags: [Broadcasts]
 *     description: Update an existing broadcast (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Emergency Maintenance Notice"
 *               message:
 *                 type: string
 *                 example: "Water supply will be interrupted on July 16th from 9 AM to 1 PM for maintenance."
 *               audience:
 *                 type: string
 *                 enum: [all, residents, staff, maintenance]
 *                 example: residents
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, emergency]
 *                 example: high
 *               sendSMS:
 *                 type: boolean
 *                 example: true
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-07-15T09:00:00Z
 *     responses:
 *       200:
 *         description: Broadcast updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     title:
 *                       type: string
 *                       example: "Updated Emergency Maintenance Notice"
 *                     message:
 *                       type: string
 *                       example: "Water supply will be interrupted on July 16th from 9 AM to 1 PM for maintenance."
 *                     audience:
 *                       type: string
 *                       example: residents
 *                     priority:
 *                       type: string
 *                       example: high
 *                     sendSMS:
 *                       type: boolean
 *                       example: true
 *                     scheduledFor:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-07-15T09:00:00Z
 *                     status:
 *                       type: string
 *                       example: scheduled
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or broadcast already sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Broadcast not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/broadcasts/:id",
  checkRole("superAdmin", "departmentAdmin"),
  validate(broadcastSchema),
  updateBroadcast
);

/**
 * @swagger
 * /misc/broadcasts/{id}:
 *   delete:
 *     summary: Delete a broadcast
 *     tags: [Broadcasts]
 *     description: Delete an existing broadcast (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     responses:
 *       200:
 *         description: Broadcast deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Broadcast deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or broadcast already sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Broadcast not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/broadcasts/:id",
  checkRole("superAdmin", "departmentAdmin"),
  deleteBroadcast
);

/**
 * @swagger
 * /misc/broadcasts/{id}/send:
 *   post:
 *     summary: Send a broadcast
 *     tags: [Broadcasts]
 *     description: Immediately send a drafted or scheduled broadcast (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     responses:
 *       200:
 *         description: Broadcast sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     status:
 *                       type: string
 *                       example: sent
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                     sentBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     recipientCount:
 *                       type: number
 *                       example: 325
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or broadcast already sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Broadcast not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/broadcasts/:id/send",
  checkRole("superAdmin", "departmentAdmin"),
  sendBroadcast
);

/**
 * @swagger
 * /misc/broadcasts/{id}/cancel:
 *   post:
 *     summary: Cancel a scheduled broadcast
 *     tags: [Broadcasts]
 *     description: Cancel a scheduled broadcast that hasn't been sent yet (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     responses:
 *       200:
 *         description: Broadcast cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     status:
 *                       type: string
 *                       example: cancelled
 *                     cancelledAt:
 *                       type: string
 *                       format: date-time
 *                     cancelledBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or broadcast not in scheduled status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Broadcast not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/broadcasts/:id/cancel",
  checkRole("superAdmin", "departmentAdmin"),
  cancelScheduledBroadcast
);

/**
 * @swagger
 * /misc/broadcasts/process-scheduled:
 *   post:
 *     summary: Process scheduled broadcasts
 *     tags: [Broadcasts]
 *     description: Manually trigger processing of scheduled broadcasts (superAdmin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled broadcasts processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: number
 *                       example: 3
 *                     broadcasts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c85
 *                           title:
 *                             type: string
 *                             example: Emergency Maintenance Notice
 *                           recipientCount:
 *                             type: number
 *                             example: 325
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not a super admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/broadcasts/process-scheduled",
  checkRole("superAdmin"),
  processScheduledBroadcasts
);

// Poll routes
// Admin routes
/**
 * @swagger
 * /misc/polls:
 *   post:
 *     summary: Create a new poll
 *     tags: [Polls]
 *     description: Create a new poll for users to respond to (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - options
 *               - audience
 *             properties:
 *               title:
 *                 type: string
 *                 example: Cafeteria Menu Preferences
 *               description:
 *                 type: string
 *                 example: Help us improve the cafeteria menu by sharing your preferences
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["More vegetarian options", "More international cuisine", "More traditional food", "More healthy options"]
 *               audience:
 *                 type: string
 *                 enum: [all, residents, staff]
 *                 example: all
 *               allowMultipleChoices:
 *                 type: boolean
 *                 example: true
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-07-30T23:59:59Z
 *     responses:
 *       201:
 *         description: Poll created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     title:
 *                       type: string
 *                       example: Cafeteria Menu Preferences
 *                     description:
 *                       type: string
 *                       example: Help us improve the cafeteria menu by sharing your preferences
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["More vegetarian options", "More international cuisine", "More traditional food", "More healthy options"]
 *                     audience:
 *                       type: string
 *                       example: all
 *                     allowMultipleChoices:
 *                       type: boolean
 *                       example: true
 *                     status:
 *                       type: string
 *                       example: active
 *                     createdBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-07-30T23:59:59Z
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/polls",
  checkRole("superAdmin", "departmentAdmin"),
  validate(pollSchema),
  createPoll
);

/**
 * @swagger
 * /misc/polls:
 *   get:
 *     summary: Get all polls
 *     tags: [Polls]
 *     description: Retrieve all polls (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, archived]
 *         description: Filter by poll status
 *       - in: query
 *         name: audience
 *         schema:
 *           type: string
 *           enum: [all, residents, staff]
 *         description: Filter by target audience
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of polls retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     polls:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c85
 *                           title:
 *                             type: string
 *                             example: Cafeteria Menu Preferences
 *                           audience:
 *                             type: string
 *                             example: all
 *                           status:
 *                             type: string
 *                             example: active
 *                           responseCount:
 *                             type: number
 *                             example: 87
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalDocs:
 *                           type: number
 *                           example: 25
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         totalPages:
 *                           type: number
 *                           example: 3
 *                         page:
 *                           type: number
 *                           example: 1
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/polls", checkRole("superAdmin", "departmentAdmin"), getAllPolls);

/**
 * @swagger
 * /misc/polls/{id}:
 *   get:
 *     summary: Get a poll by ID
 *     tags: [Polls]
 *     description: Retrieve a specific poll by its ID (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     title:
 *                       type: string
 *                       example: Cafeteria Menu Preferences
 *                     description:
 *                       type: string
 *                       example: Help us improve the cafeteria menu by sharing your preferences
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["More vegetarian options", "More international cuisine", "More traditional food", "More healthy options"]
 *                     audience:
 *                       type: string
 *                       example: all
 *                     allowMultipleChoices:
 *                       type: boolean
 *                       example: true
 *                     status:
 *                       type: string
 *                       example: active
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 60d21b4667d0d8992e610c86
 *                         name:
 *                           type: string
 *                           example: Admin User
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     responseCount:
 *                       type: number
 *                       example: 87
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Poll not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/polls/:id",
  checkRole("superAdmin", "departmentAdmin"),
  getPollById
);

/**
 * @swagger
 * /misc/polls/{id}:
 *   put:
 *     summary: Update a poll
 *     tags: [Polls]
 *     description: Update an existing poll (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Cafeteria Menu Preferences"
 *               description:
 *                 type: string
 *                 example: "Help us improve the cafeteria menu by sharing your preferences"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["More vegetarian options", "More international cuisine", "More traditional food", "More healthy options", "More seasonal items"]
 *               audience:
 *                 type: string
 *                 enum: [all, residents, staff]
 *                 example: all
 *               allowMultipleChoices:
 *                 type: boolean
 *                 example: true
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-08-15T23:59:59Z
 *     responses:
 *       200:
 *         description: Poll updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     title:
 *                       type: string
 *                       example: "Updated Cafeteria Menu Preferences"
 *                     description:
 *                       type: string
 *                       example: "Help us improve the cafeteria menu by sharing your preferences"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or poll cannot be edited
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Poll not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/polls/:id",
  checkRole("superAdmin", "departmentAdmin"),
  validate(pollSchema),
  updatePoll
);

/**
 * @swagger
 * /misc/polls/{id}:
 *   delete:
 *     summary: Delete a poll
 *     tags: [Polls]
 *     description: Delete an existing poll (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Poll deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or poll has responses
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Poll not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/polls/:id",
  checkRole("superAdmin", "departmentAdmin"),
  deletePoll
);

/**
 * @swagger
 * /misc/polls/{id}/results:
 *   get:
 *     summary: Get poll results
 *     tags: [Polls]
 *     description: Retrieve the results of a specific poll (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     title:
 *                       type: string
 *                       example: Cafeteria Menu Preferences
 *                     totalResponses:
 *                       type: number
 *                       example: 87
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           option:
 *                             type: string
 *                             example: More vegetarian options
 *                           count:
 *                             type: number
 *                             example: 32
 *                           percentage:
 *                             type: number
 *                             example: 36.8
 *                     responses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: 60d21b4667d0d8992e610c87
 *                               name:
 *                                 type: string
 *                                 example: John Doe
 *                           choices:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["More vegetarian options", "More healthy options"]
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Poll not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/polls/:id/results",
  checkRole("superAdmin", "departmentAdmin"),
  getPollResults
);

/**
 * @swagger
 * /misc/polls/{id}/close:
 *   put:
 *     summary: Close a poll
 *     tags: [Polls]
 *     description: Close an active poll to prevent further responses (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     status:
 *                       type: string
 *                       example: closed
 *                     closedAt:
 *                       type: string
 *                       format: date-time
 *                     closedBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or poll not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Poll not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/polls/:id/close",
  checkRole("superAdmin", "departmentAdmin"),
  closePoll
);

/**
 * @swagger
 * /misc/polls/{id}/archive:
 *   put:
 *     summary: Archive a poll
 *     tags: [Polls]
 *     description: Archive a closed poll (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     responses:
 *       200:
 *         description: Poll archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     status:
 *                       type: string
 *                       example: archived
 *                     archivedAt:
 *                       type: string
 *                       format: date-time
 *                     archivedBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - not an admin or poll not closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Poll not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/polls/:id/archive",
  checkRole("superAdmin", "departmentAdmin"),
  archivePoll
);

// User routes
/**
 * @swagger
 * /misc/polls/active:
 *   get:
 *     summary: Get active polls
 *     tags: [Polls]
 *     description: Retrieve all active polls that the current user can respond to
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active polls retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 60d21b4667d0d8992e610c85
 *                       title:
 *                         type: string
 *                         example: Cafeteria Menu Preferences
 *                       description:
 *                         type: string
 *                         example: Help us improve the cafeteria menu by sharing your preferences
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["More vegetarian options", "More international cuisine", "More traditional food", "More healthy options"]
 *                       allowMultipleChoices:
 *                         type: boolean
 *                         example: true
 *                       endDate:
 *                         type: string
 *                         format: date-time
 *                       hasResponded:
 *                         type: boolean
 *                         example: false
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/polls/active", getActivePolls);

/**
 * @swagger
 * /misc/polls/{id}/respond:
 *   post:
 *     summary: Submit poll response
 *     tags: [Polls]
 *     description: Submit a response to an active poll
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Poll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - choices
 *             properties:
 *               choices:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["More vegetarian options", "More healthy options"]
 *     responses:
 *       200:
 *         description: Poll response submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Response submitted successfully
 *       400:
 *         description: Bad request - validation error or already responded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Poll not found or not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/polls/:id/respond",
  validate(pollResponseSchema),
  submitPollResponse
);

module.exports = router;
