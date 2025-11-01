import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      default: 'user',
    },
    bio: {
      type: String,
      default: "",
    },
    purchasedCourses: [{
      courseId: {
        type: Number,
        required: true
      },
      courseTitle: {
        type: String,
        required: true
      },
      purchaseDate: {
        type: Date,
        default: Date.now
      },
      progress: {
        completedLessons: [{
          lessonId: String,
          completedAt: {
            type: Date,
            default: Date.now
          }
        }],
        currentLesson: {
          lessonId: String,
          moduleTitle: String
        }
      }
    }],
    analytics: {
      totalHours: {
        type: Number,
        default: 0
      },
      daysStudied: {
        type: Number,
        default: 0
      },
      studySessions: [{
        date: {
          type: Date,
          required: true
        },
        hours: {
          type: Number,
          required: true
        }
      }],
      lastStudyDate: {
        type: Date,
        default: null
      },
      attendance: {
        type: Number,
        default: 0
      },
      avgMarks: {
        type: Number,
        default: 0
      },
      dailyHours: {
        type: Number,
        default: 0
      },
      totalCourses: {
        type: Number,
        default: 0
      },
      completedCourses: {
        type: Number,
        default: 0
      },
      certificates: {
        type: Number,
        default: 0
      },
      learningHoursChart: [{
        date: String,
        hours: Number
      }]
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

export default User;
