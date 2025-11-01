import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const name = `${firstName} ${lastName}`;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        purchasedCourses: user.purchasedCourses,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        purchasedCourses: user.purchasedCourses,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        purchasedCourses: user.purchasedCourses,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Purchase a course
// @route   POST /api/users/purchase-course
// @access  Private
const purchaseCourse = async (req, res) => {
  try {
    const { courseId, courseTitle } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if course is already purchased
    const alreadyPurchased = user.purchasedCourses.some(course => course.courseId == courseId);
    if (alreadyPurchased) {
      return res.status(400).json({ message: 'Course already purchased' });
    }

    // Add course to purchased courses
    user.purchasedCourses.push({
      courseId: parseInt(courseId),
      courseTitle,
      purchaseDate: new Date(),
      progress: {
        completedLessons: [],
        currentLesson: null
      }
    });

    await user.save();

    res.json({
      message: 'Course purchased successfully',
      purchasedCourses: user.purchasedCourses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update course progress
// @route   PUT /api/users/course-progress
// @access  Private
const updateCourseProgress = async (req, res) => {
  try {
    const { courseId, completedLessons, currentLesson, studyHours } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the course in purchased courses
    const courseIndex = user.purchasedCourses.findIndex(course => course.courseId == courseId);
    if (courseIndex === -1) {
      return res.status(404).json({ message: 'Course not found in purchased courses' });
    }

    let newLessonsCompleted = 0;

    // Update progress
    if (completedLessons) {
      const existingCompleted = user.purchasedCourses[courseIndex].progress.completedLessons || [];
      const newCompleted = completedLessons
        .filter(lessonId => !existingCompleted.some(cl => cl.lessonId === lessonId))
        .map(lessonId => ({
          lessonId,
          completedAt: new Date()
        }));
      user.purchasedCourses[courseIndex].progress.completedLessons = [...existingCompleted, ...newCompleted];
      newLessonsCompleted = newCompleted.length;
    }

    if (currentLesson) {
      user.purchasedCourses[courseIndex].progress.currentLesson = currentLesson;
    }

    // Update analytics
    if (newLessonsCompleted > 0 || (studyHours && studyHours > 0)) {
      const today = new Date();
      const todayString = today.toDateString();

      // Check if this is a new study day
      const isNewDay = !user.analytics.lastStudyDate ||
        new Date(user.analytics.lastStudyDate).toDateString() !== todayString;

      if (isNewDay) {
        user.analytics.daysStudied += 1;
        user.analytics.lastStudyDate = today;
      }

      // Add study hours (assume 0.1667 hours per lesson if not provided)
      const hoursToAdd = studyHours || (newLessonsCompleted * 0.1667);
      user.analytics.totalHours += hoursToAdd;

      // Add study session
      user.analytics.studySessions.push({
        date: today,
        hours: hoursToAdd
      });

      // Update learning hours chart (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dateKey = today.toISOString().split('T')[0];
      const existingEntry = user.analytics.learningHoursChart.find(entry => entry.date === dateKey);

      if (existingEntry) {
        existingEntry.hours += hoursToAdd;
      } else {
        user.analytics.learningHoursChart.push({
          date: dateKey,
          hours: hoursToAdd
        });
      }

      // Keep only last 7 days
      user.analytics.learningHoursChart = user.analytics.learningHoursChart
        .filter(entry => new Date(entry.date) >= sevenDaysAgo)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Recalculate derived analytics
      const totalPossibleDays = 30;
      user.analytics.attendance = Math.min((user.analytics.daysStudied / totalPossibleDays) * 100, 100);
      user.analytics.dailyHours = user.analytics.daysStudied > 0 ? user.analytics.totalHours / user.analytics.daysStudied : 0;
      user.analytics.totalCourses = user.purchasedCourses.length;

      // Check if course is completed
      const Course = (await import('../models/Course.js')).default;
      const courseData = await Course.findOne({ id: courseId });
      if (courseData) {
        const totalLessons = courseData.modules?.flatMap(module => module.lessons).length || 0;
        const completedLessonsCount = user.purchasedCourses[courseIndex].progress.completedLessons.length;

        if (completedLessonsCount >= totalLessons && totalLessons > 0) {
          user.analytics.completedCourses += 1;
          user.analytics.certificates += 1;
        }
      }
    }

    await user.save();

    res.json({
      message: 'Progress updated successfully',
      purchasedCourses: user.purchasedCourses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.name = `${req.body.firstName || user.firstName || ''} ${req.body.lastName || user.lastName || ''}`.trim();
      user.email = req.body.email || user.email;
      user.bio = req.body.bio || user.bio;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        purchasedCourses: updatedUser.purchasedCourses,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { registerUser, loginUser, getUserProfile, updateUserProfile, purchaseCourse, updateCourseProgress };
