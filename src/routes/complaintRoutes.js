const express = require("express");
const { protect } = require("../middleware/auth");
const { checkRole } = require("../middleware/roleCheck");
const { check } = require("express-validator");
const complaintController = require("../controllers/complaintController");

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * @swagger
 * /complaints/categories:
 *   get:
 *     summary: Get all complaint categories
 *     tags: [Complaints]
 *     description: Retrieve all available complaint categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of complaint categories
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
 *                     type: string
 *                   example: ["Electrical", "Civil", "Misc"]
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/categories", complaintController.getCategories);

/**
 * @swagger
 * /complaints/subcategories/{category}:
 *   get:
 *     summary: Get subcategories for a specific category
 *     tags: [Complaints]
 *     description: Retrieve all subcategories belonging to a specific complaint category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Category name
 *         example: Electrical
 *     responses:
 *       200:
 *         description: List of subcategories for the specified category
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
 *                     type: string
 *                   example: ["Lighting", "Power socket", "Fan"]
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/subcategories/:category", complaintController.getSubcategories);

/**
 * @swagger
 * /complaints/stats:
 *   get:
 *     summary: Get complaint statistics
 *     tags: [Complaints]
 *     description: Retrieve statistics about complaints (counts by status, etc.)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaint statistics
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
 *                     total:
 *                       type: number
 *                       example: 100
 *                     open:
 *                       type: number
 *                       example: 25
 *                     inProgress:
 *                       type: number
 *                       example: 35
 *                     resolved:
 *                       type: number
 *                       example: 30
 *                     closed:
 *                       type: number
 *                       example: 10
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/stats", complaintController.getComplaintStats);

/**
 * @swagger
 * /complaints/category-distribution:
 *   get:
 *     summary: Get category distribution
 *     tags: [Complaints]
 *     description: Retrieve the distribution of complaints by category
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complaint distribution by category
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
 *                       category:
 *                         type: string
 *                         example: Electrical
 *                       count:
 *                         type: number
 *                         example: 45
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/category-distribution",
  complaintController.getCategoryDistribution
);

/**
 * @swagger
 * /complaints:
 *   post:
 *     summary: Create a new complaint
 *     tags: [Complaints]
 *     description: Create a new complaint in the system
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
 *               - category
 *               - subcategory
 *               - description
 *             properties:
 *               resourceId:
 *                 type: string
 *                 description: ID of the resource the complaint is about
 *                 example: 60d21b4667d0d8992e610c85
 *               category:
 *                 type: string
 *                 enum: [Electrical, Civil, Misc]
 *                 example: Electrical
 *               subcategory:
 *                 type: string
 *                 example: Lighting
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 example: The light fixture in the hallway is not working
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 2
 *                 description: Optional images showing the issue
 *     responses:
 *       201:
 *         description: Complaint created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
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
router.post(
  "/",
  [
    check("resourceId", "Resource ID is required").notEmpty(),
    check("category", "Category is required").isIn([
      "Electrical",
      "Civil",
      "Misc",
    ]),
    check("subcategory", "Subcategory is required").notEmpty(),
    check(
      "description",
      "Description is required and should not exceed 1000 characters"
    )
      .notEmpty()
      .isLength({ max: 1000 }),
    check("images").optional().isArray({ max: 2 }),
  ],
  complaintController.createComplaint
);

/**
 * @swagger
 * /complaints:
 *   get:
 *     summary: Get all complaints
 *     tags: [Complaints]
 *     description: Retrieve all complaints with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in-progress, resolved, closed]
 *         description: Filter by complaint status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by complaint category
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by complaint subcategory
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: Filter by resource ID
 *     responses:
 *       200:
 *         description: List of complaints
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
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Complaint'
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
 *                         pagingCounter:
 *                           type: number
 *                           example: 1
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         prevPage:
 *                           type: number
 *                           nullable: true
 *                           example: null
 *                         nextPage:
 *                           type: number
 *                           example: 2
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", complaintController.getComplaints);

/**
 * @swagger
 * /complaints/{id}/assign:
 *   put:
 *     summary: Assign complaint to an agency
 *     tags: [Complaints]
 *     description: Assign a complaint to a maintenance agency
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agencyId
 *             properties:
 *               agencyId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Complaint assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
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
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/assign",
  [
    check("agencyId", "Agency ID is required").notEmpty(),
    checkRole("superAdmin", "departmentAdmin"),
  ],
  complaintController.assignComplaint
);

/**
 * @swagger
 * /complaints/{id}/assign-staff:
 *   put:
 *     summary: Assign complaint to staff
 *     tags: [Complaints]
 *     description: Assign a complaint to a maintenance staff member
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - staffId
 *             properties:
 *               staffId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: Complaint assigned to staff successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
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
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/assign-staff",
  [
    check("staffId", "Staff ID is required").notEmpty(),
    checkRole("departmentAdmin"),
  ],
  complaintController.assignToStaff
);

/**
 * @swagger
 * /complaints/{id}/resolve:
 *   put:
 *     summary: Mark complaint as resolved
 *     tags: [Complaints]
 *     description: Mark a complaint as resolved with resolution notes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolutionNotes
 *             properties:
 *               resolutionNotes:
 *                 type: string
 *                 example: Fixed the lighting issue by replacing the bulb and repairing the wiring.
 *     responses:
 *       200:
 *         description: Complaint marked as resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
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
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/resolve",
  [
    check("resolutionNotes", "Resolution notes are required").notEmpty(),
    checkRole("maintenanceStaff", "departmentAdmin"),
  ],
  complaintController.resolveComplaint
);

/**
 * @swagger
 * /complaints/{id}/feedback:
 *   put:
 *     summary: Submit feedback for resolved complaint
 *     tags: [Complaints]
 *     description: Submit user feedback for a resolved complaint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Great job fixing the issue quickly.
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
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
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/feedback",
  [
    check("rating", "Rating is required and must be between 1-5")
      .notEmpty()
      .isInt({ min: 1, max: 5 }),
    check("comment").optional(),
    checkRole("resident"),
  ],
  complaintController.submitFeedback
);

/**
 * @swagger
 * /complaints/{id}/final-resolution:
 *   put:
 *     summary: Final resolution by appellate authority
 *     tags: [Complaints]
 *     description: Provide final resolution for a complaint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *             properties:
 *               resolution:
 *                 type: string
 *                 example: After reviewing the case, we've approved additional maintenance work to prevent future issues.
 *     responses:
 *       200:
 *         description: Final resolution provided successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
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
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  "/:id/final-resolution",
  [
    check("resolution", "Final resolution is required").notEmpty(),
    checkRole("superAdmin"),
  ],
  complaintController.finalizeComplaint
);

/**
 * @swagger
 * /complaints/{id}:
 *   get:
 *     summary: Get a complaint by ID
 *     tags: [Complaints]
 *     description: Retrieve details of a specific complaint by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Complaint'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Complaint not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", complaintController.getComplaintById);

module.exports = router;
