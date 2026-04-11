const mongoose = require("mongoose");

const pantsSizeGuideSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    sizes: [
      {
        size: {
          type: String,
          required: true,
        }, // "29", "30", "31", "32", "33"

        heightRange: {
          type: String,
        }, // "1m60 - 1m65", "1m66 - 1m72", etc.

        weightRange: {
          type: String,
        }, // "55kg - 63kg", "64kg - 72kg", etc.

        pantsLength: {
          type: Number,
        }, // Dài quần (cm) - 95.5, 97, 98.5, 100, 101.5

        waistCircumference: {
          type: Number,
        }, // 1/2 Vòng eo (cm) - 38.5, 40, 41.5, 43, 44.5

        hipCircumference: {
          type: Number,
        }, // 1/2 Vòng mông (cm) - 49, 50.5, 52, 53.5, 55

        thighCircumference: {
          type: Number,
        }, // 1/2 Vòng đùi (cm) - 32.4, 33.1, 33.8, 34.5, 35.2

        crotchLength: {
          type: Number,
        }, // 1/2 Vòng lai (cm) - 19, 19.5, 20, 20.5, 21

        // Thêm các trường tùy chọn khác nếu cần
        frontRise: {
          type: Number,
        }, // Độ dài phần trước (optional)

        backRise: {
          type: Number,
        }, // Độ dài phần sau (optional)

        legOpening: {
          type: Number,
        }, // Chu vi cổ chân (optional)

        inseam: {
          type: Number,
        }, // Đường may trong (optional)
      },
    ],

    note: {
      type: String,
    }, // Ghi chú hướng dẫn (VD: "Ưu tiên theo chiều cao và cân nặng")

    // Thêm metadata cho loại quần
    pantsType: {
      type: String,
      enum: ["jeans", "chinos", "shorts", "dress_pants", "casual", "other"],
      default: "casual",
    },

    // Thêm thông tin về fit
    fitType: {
      type: String,
      enum: [
        "slim",
        "regular",
        "loose",
        "skinny",
        "straight",
        "bootcut",
        "other",
      ],
      default: "regular",
    },

    // Thông tin chất liệu (ảnh hưởng đến size)
    material: {
      hasStretch: {
        type: Boolean,
        default: false,
      },
      stretchPercentage: {
        type: Number,
        default: 0,
      }, // % co giãn
    },

    // Hướng dẫn đo size
    measurementGuide: {
      waistInstruction: {
        type: String,
        default: "Đo vòng eo tại vị trí hẹp nhất",
      },
      hipInstruction: {
        type: String,
        default: "Đo vòng mông tại vị trí rộng nhất",
      },
      lengthInstruction: {
        type: String,
        default: "Đo từ eo xuống mắt cá chân",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
pantsSizeGuideSchema.index({ productId: 1 });
pantsSizeGuideSchema.index({ pantsType: 1 });
pantsSizeGuideSchema.index({ fitType: 1 });

// Virtual để tính toán full measurements
pantsSizeGuideSchema.virtual("fullMeasurements").get(function () {
  return this.sizes.map((size) => ({
    ...size.toObject(),
    fullWaistCircumference: size.waistCircumference * 2,
    fullHipCircumference: size.hipCircumference * 2,
    fullThighCircumference: size.thighCircumference * 2,
    fullCrotchLength: size.crotchLength * 2,
  }));
});

// Method để tìm size phù hợp dựa trên measurements
pantsSizeGuideSchema.methods.findBestSize = function (
  waistMeasurement,
  hipMeasurement,
  height,
  weight
) {
  let bestSize = null;
  let minDifference = Infinity;

  this.sizes.forEach((size) => {
    const waistDiff = Math.abs(size.waistCircumference * 2 - waistMeasurement);
    const hipDiff = Math.abs(size.hipCircumference * 2 - hipMeasurement);
    const totalDiff = waistDiff + hipDiff;

    // Kiểm tra height và weight range nếu có
    let inRange = true;
    if (size.heightRange && height) {
      const heightMatch = this.checkHeightRange(size.heightRange, height);
      if (!heightMatch) inRange = false;
    }
    if (size.weightRange && weight) {
      const weightMatch = this.checkWeightRange(size.weightRange, weight);
      if (!weightMatch) inRange = false;
    }

    if (totalDiff < minDifference && inRange) {
      minDifference = totalDiff;
      bestSize = size;
    }
  });

  return bestSize;
};

// Helper methods
pantsSizeGuideSchema.methods.checkHeightRange = function (rangeStr, height) {
  // Implement logic to check if height is in range
  // e.g., "1m60 - 1m65" vs height in cm
  return true; // Simplified for now
};

pantsSizeGuideSchema.methods.checkWeightRange = function (rangeStr, weight) {
  // Implement logic to check if weight is in range
  // e.g., "55kg - 63kg" vs weight in kg
  return true; // Simplified for now
};

// Pre-save middleware để validate data
pantsSizeGuideSchema.pre("save", function (next) {
  // Validate rằng các measurements hợp lý
  this.sizes.forEach((size) => {
    if (size.waistCircumference && size.waistCircumference <= 0) {
      throw new Error("Vòng eo phải lớn hơn 0");
    }
    if (size.hipCircumference && size.hipCircumference <= 0) {
      throw new Error("Vòng mông phải lớn hơn 0");
    }
    if (size.pantsLength && size.pantsLength <= 0) {
      throw new Error("Dài quần phải lớn hơn 0");
    }
  });
  next();
});

module.exports = mongoose.model("PantsSizeGuide", pantsSizeGuideSchema);
