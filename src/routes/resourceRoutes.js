const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const {
  createResource,
  getAllResources,
  getResourceById,
} = require("../controllers/resourceController");

// Protected routes
router.use(protect);

// Admin routes
/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [Resources]
 *     description: Create a new resource (admin roles only)
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
 *               - type
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: Block A - 101
 *               type:
 *                 type: string
 *                 enum: [personal, functional, general]
 *                 example: personal
 *               location:
 *                 type: string
 *                 example: Main Campus
 *               department:
 *                 type: string
 *                 example: Housing
 *               details:
 *                 type: object
 *                 example: { "floor": "1st", "area": "1200 sqft" }
 *               isBookable:
 *                 type: boolean
 *                 example: false
 *               maxCapacity:
 *                 type: number
 *                 example: 4
 *     responses:
 *       201:
 *         description: Resource created successfully
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
 *                     name:
 *                       type: string
 *                       example: Block A - 101
 *                     type:
 *                       type: string
 *                       example: personal
 *                     location:
 *                       type: string
 *                       example: Main Campus
 *                     department:
 *                       type: string
 *                       example: Housing
 *                     details:
 *                       type: object
 *                       example: { "floor": "1st", "area": "1200 sqft" }
 *                     isBookable:
 *                       type: boolean
 *                       example: false
 *                     maxCapacity:
 *                       type: number
 *                       example: 4
 *                     createdAt:
 *                       type: string
 *                       format: date-time
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
 *         description: Forbidden - not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", checkRole("superAdmin", "departmentAdmin"), createResource);

// All authenticated users can access these routes
/**
 * @swagger
 * /resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     description: Retrieve a list of all resources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [personal, functional, general]
 *         description: Filter by resource type
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: isBookable
 *         schema:
 *           type: boolean
 *         description: Filter by bookable status
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
 *         description: List of resources
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
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c85
 *                           name:
 *                             type: string
 *                             example: Block A - 101
 *                           type:
 *                             type: string
 *                             example: personal
 *                           location:
 *                             type: string
 *                             example: Main Campus
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalDocs:
 *                           type: number
 *                           example: 100
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         totalPages:
 *                           type: number
 *                           example: 10
 *                         page:
 *                           type: number
 *                           example: 1
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", getAllResources);

/**
 * @swagger
 * /resources/{id}:
 *   get:
 *     summary: Get a resource by ID
 *     tags: [Resources]
 *     description: Retrieve a specific resource by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
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
 *                     name:
 *                       type: string
 *                       example: Block A - 101
 *                     type:
 *                       type: string
 *                       example: personal
 *                     location:
 *                       type: string
 *                       example: Main Campus
 *                     department:
 *                       type: string
 *                       example: Housing
 *                     details:
 *                       type: object
 *                       example: { "floor": "1st", "area": "1200 sqft" }
 *                     isBookable:
 *                       type: boolean
 *                       example: false
 *                     maxCapacity:
 *                       type: number
 *                       example: 4
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
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
router.get("/:id", getResourceById);

module.exports = router;
