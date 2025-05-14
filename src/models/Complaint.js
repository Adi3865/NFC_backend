const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    category: {
      type: String,
      enum: ["Electrical", "Civil", "Misc"],
      required: true,
    },
    subcategory: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000, // 200 words approximately
    },
    images: [
      {
        type: String, // Base64 encoded images or URLs
      },
    ],
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "resolved",
        "closed",
        "escalated",
        "finalResolution",
      ],
      default: "pending",
    },
    assignedAgency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to maintenance agency user
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to specific staff member
    },
    assignedAt: Date,
    resolvedAt: Date,
    closedAt: Date,
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      submittedAt: Date,
    },
    escalation: {
      escalatedAt: Date,
      reason: String,
      appellateAuthority: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      finalResolution: String,
      finalResolvedAt: Date,
    },
    resolutionNotes: String,
    history: [
      {
        status: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate unique complaint ID before saving
complaintSchema.pre("save", async function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");

    // Get count of complaints for the current month and year
    const count = await mongoose.model("Complaint").countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      },
    });

    // Format: CMP-YY-MM-XXXX (e.g., CMP-23-05-0001)
    this.complaintId = `CMP-${year}-${month}-${String(count + 1).padStart(
      4,
      "0"
    )}`;
  }
  next();
});

// Add pagination plugin
complaintSchema.plugin(mongoosePaginate);

const Complaint = mongoose.model("Complaint", complaintSchema);
module.exports = Complaint;
