const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const { validate } = require("../middleware/validator");
const {
  visitorRequestSchema,
  visitorCheckInSchema,
  blacklistSchema,
} = require("../utils/validations");
const {
  createVisitorRequest,
  getMyVisitorRequests,
  getPendingVisitorRequests,
  approveVisitorRequest,
  rejectVisitorRequest,
  checkInVisitor,
  checkOutVisitor,
  cancelVisitorRequest,
  blacklistVisitor,
  removeFromBlacklist,
  getBlacklistedVisitors,
  getVisitorReports,
} = require("../controllers/visitorController");

// All routes are protected
router.use(protect);

// User routes
/**
 * @swagger
 * /visitors:
 *   post:
 *     summary: Create a visitor request
 *     tags: [Visitors]
 *     description: Create a new visitor request for a guest
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - purpose
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: visitor@example.com
 *               purpose:
 *                 type: string
 *                 example: Meeting regarding project discussion
 *               visitingWhom:
 *                 type: string
 *                 example: Marketing Department
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2023-08-15T10:00:00Z
 *               expectedDuration:
 *                 type: number
 *                 example: 60
 *                 description: Expected duration in minutes
 *     responses:
 *       201:
 *         description: Visitor request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visitor'
 *       400:
 *         description: Validation error
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
 */
router.post("/", validate(visitorRequestSchema), createVisitorRequest);

/**
 * @swagger
 * /visitors/my:
 *   get:
 *     summary: Get my visitor requests
 *     tags: [Visitors]
 *     description: Retrieve all visitor requests created by the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of visitor requests
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
 *                     $ref: '#/components/schemas/Visitor'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/my", getMyVisitorRequests);

/**
 * @swagger
 * /visitors/{id}/cancel:
 *   put:
 *     summary: Cancel a visitor request
 *     tags: [Visitors]
 *     description: Cancel a previously created visitor request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visitor request ID
 *     responses:
 *       200:
 *         description: Visitor request cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visitor'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - cannot cancel this request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Visitor request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id/cancel", cancelVisitorRequest);

// Security personnel routes (including admin)
const securityRoles = ["superAdmin", "departmentAdmin", "securityPersonnel"];

/**
 * @swagger
 * /visitors/pending:
 *   get:
 *     summary: Get pending visitor requests
 *     tags: [Visitors]
 *     description: Retrieve all pending visitor requests (security personnel only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending visitor requests
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
 *                     $ref: '#/components/schemas/Visitor'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/pending", checkRole(...securityRoles), getPendingVisitorRequests);

/**
 * @swagger
 * /visitors/{id}/approve:
 *   put:
 *     summary: Approve a visitor request
 *     tags: [Visitors]
 *     description: Approve a pending visitor request (security personnel only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visitor request ID
 *     responses:
 *       200:
 *         description: Visitor request approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visitor'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Visitor request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id/approve", checkRole(...securityRoles), approveVisitorRequest);

/**
 * @swagger
 * /visitors/{id}/reject:
 *   put:
 *     summary: Reject a visitor request
 *     tags: [Visitors]
 *     description: Reject a pending visitor request (security personnel only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visitor request ID
 *     responses:
 *       200:
 *         description: Visitor request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visitor'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Visitor request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id/reject", checkRole(...securityRoles), rejectVisitorRequest);

/**
 * @swagger
 * /visitors/{id}/check-in:
 *   put:
 *     summary: Check in a visitor
 *     tags: [Visitors]
 *     description: Check in an approved visitor (security personnel only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visitor request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idType
 *               - idNumber
 *             properties:
 *               idType:
 *                 type: string
 *                 example: Drivers License
 *               idNumber:
 *                 type: string
 *                 example: DL123456789
 *               photoId:
 *                 type: string
 *                 description: Base64 encoded image of ID
 *     responses:
 *       200:
 *         description: Visitor checked in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visitor'
 *       400:
 *         description: Validation error
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
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Visitor request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/check-in",
  checkRole(...securityRoles),
  validate(visitorCheckInSchema),
  checkInVisitor
);

/**
 * @swagger
 * /visitors/{id}/check-out:
 *   put:
 *     summary: Check out a visitor
 *     tags: [Visitors]
 *     description: Check out a visitor who has previously checked in (security personnel only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Visitor request ID
 *     responses:
 *       200:
 *         description: Visitor checked out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Visitor'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Visitor request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id/check-out", checkRole(...securityRoles), checkOutVisitor);

/**
 * @swagger
 * /visitors/blacklist:
 *   get:
 *     summary: Get blacklisted visitors
 *     tags: [Visitors]
 *     description: Retrieve all blacklisted visitors (security personnel only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of blacklisted visitors
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
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       idType:
 *                         type: string
 *                         example: Drivers License
 *                       idNumber:
 *                         type: string
 *                         example: DL123456789
 *                       reason:
 *                         type: string
 *                         example: Security violation
 *                       addedBy:
 *                         type: string
 *                         example: Admin User
 *                       addedAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2023-08-15T10:00:00Z
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/blacklist", checkRole(...securityRoles), getBlacklistedVisitors);

// Security admin only routes
const securityAdminRoles = ["superAdmin", "departmentAdmin"];

/**
 * @swagger
 * /visitors/blacklist:
 *   post:
 *     summary: Blacklist a visitor
 *     tags: [Visitors]
 *     description: Add a visitor to the blacklist (security admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - idType
 *               - idNumber
 *               - reason
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               idType:
 *                 type: string
 *                 example: Drivers License
 *               idNumber:
 *                 type: string
 *                 example: DL123456789
 *               reason:
 *                 type: string
 *                 example: Security violation
 *     responses:
 *       201:
 *         description: Visitor blacklisted successfully
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
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     idType:
 *                       type: string
 *                       example: Drivers License
 *                     idNumber:
 *                       type: string
 *                       example: DL123456789
 *                     reason:
 *                       type: string
 *                       example: Security violation
 *       400:
 *         description: Validation error
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
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/blacklist",
  checkRole(...securityAdminRoles),
  validate(blacklistSchema),
  blacklistVisitor
);

/**
 * @swagger
 * /visitors/blacklist/{id}/remove:
 *   put:
 *     summary: Remove from blacklist
 *     tags: [Visitors]
 *     description: Remove a visitor from the blacklist (security admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blacklist entry ID
 *     responses:
 *       200:
 *         description: Visitor removed from blacklist successfully
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
 *                   example: Visitor removed from blacklist
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Blacklist entry not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/blacklist/:id/remove",
  checkRole(...securityAdminRoles),
  removeFromBlacklist
);

/**
 * @swagger
 * /visitors/reports/{reportType}:
 *   get:
 *     summary: Get visitor reports
 *     tags: [Visitors]
 *     description: Generate visitor reports (security admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: Type of report to generate
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Visitor report generated successfully
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
 *                     totalVisitors:
 *                       type: number
 *                       example: 125
 *                     activeVisitors:
 *                       type: number
 *                       example: 15
 *                     checkedInToday:
 *                       type: number
 *                       example: 28
 *                     byPurpose:
 *                       type: object
 *                       example: {"Meeting": 45, "Delivery": 32, "Interview": 18}
 *                     byDepartment:
 *                       type: object
 *                       example: {"HR": 25, "Marketing": 35, "Engineering": 65}
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invalid report type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/reports/:reportType",
  checkRole(...securityAdminRoles),
  getVisitorReports
);

module.exports = router;
