const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const { validate } = require("../middleware/validator");
const { resourceRequestSchema } = require("../utils/validations");
const {
  requestResourceAllocation,
  getMyResources,
  getPendingAllocations,
  approveAllocation,
  rejectAllocation,
} = require("../controllers/userResourceController");

// All routes are protected
router.use(protect);

// User routes
/**
 * @swagger
 * /user-resources:
 *   post:
 *     summary: Request resource allocation
 *     tags: [User Resources]
 *     description: Request allocation of a specific resource to the current user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceId
 *               - reason
 *             properties:
 *               resourceId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               reason:
 *                 type: string
 *                 example: Primary accommodation for staff
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: 2023-08-01
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-07-31
 *     responses:
 *       201:
 *         description: Resource allocation request submitted successfully
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
 *                     userId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     resourceId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c87
 *                     status:
 *                       type: string
 *                       example: pending
 *                     reason:
 *                       type: string
 *                       example: Primary accommodation for staff
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       example: 2023-08-01
 *                     endDate:
 *                       type: string
 *                       format: date
 *                       example: 2024-07-31
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
 *       404:
 *         description: Resource not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", validate(resourceRequestSchema), requestResourceAllocation);

/**
 * @swagger
 * /user-resources/my:
 *   get:
 *     summary: Get my allocated resources
 *     tags: [User Resources]
 *     description: Retrieve all resources allocated to the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of allocated resources
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
 *                       resourceId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c86
 *                           name:
 *                             type: string
 *                             example: Block A - 101
 *                           type:
 *                             type: string
 *                             example: personal
 *                           location:
 *                             type: string
 *                             example: Main Campus
 *                       status:
 *                         type: string
 *                         example: active
 *                       startDate:
 *                         type: string
 *                         format: date
 *                         example: 2023-08-01
 *                       endDate:
 *                         type: string
 *                         format: date
 *                         example: 2024-07-31
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/my", getMyResources);

// Admin routes
/**
 * @swagger
 * /user-resources/pending:
 *   get:
 *     summary: Get pending allocation requests
 *     tags: [User Resources]
 *     description: Retrieve all pending resource allocation requests (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending resource allocation requests
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
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c86
 *                           name:
 *                             type: string
 *                             example: John Doe
 *                           email:
 *                             type: string
 *                             example: john@example.com
 *                       resourceId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c87
 *                           name:
 *                             type: string
 *                             example: Block A - 101
 *                           type:
 *                             type: string
 *                             example: personal
 *                       status:
 *                         type: string
 *                         example: pending
 *                       reason:
 *                         type: string
 *                         example: Primary accommodation for staff
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
  "/pending",
  checkRole("superAdmin", "departmentAdmin"),
  getPendingAllocations
);

/**
 * @swagger
 * /user-resources/{id}/approve:
 *   put:
 *     summary: Approve resource allocation
 *     tags: [User Resources]
 *     description: Approve a pending resource allocation request (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource allocation request ID
 *     responses:
 *       200:
 *         description: Resource allocation approved successfully
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
 *                     userId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     resourceId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c87
 *                     status:
 *                       type: string
 *                       example: active
 *                     approvedBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c88
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
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
 *         description: Allocation request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/approve",
  checkRole("superAdmin", "departmentAdmin"),
  approveAllocation
);

/**
 * @swagger
 * /user-resources/{id}/reject:
 *   put:
 *     summary: Reject resource allocation
 *     tags: [User Resources]
 *     description: Reject a pending resource allocation request (admin roles only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource allocation request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Resource already allocated to another user
 *     responses:
 *       200:
 *         description: Resource allocation rejected successfully
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
 *                     userId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c86
 *                     resourceId:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c87
 *                     status:
 *                       type: string
 *                       example: rejected
 *                     rejectReason:
 *                       type: string
 *                       example: Resource already allocated to another user
 *                     rejectedBy:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c88
 *                     rejectedAt:
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
 *       404:
 *         description: Allocation request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/reject",
  checkRole("superAdmin", "departmentAdmin"),
  rejectAllocation
);

module.exports = router;
