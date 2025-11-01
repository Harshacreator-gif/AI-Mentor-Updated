import User from '../models/User.js';

// @desc    Get user analytics
// @route   GET /api/analytics
// @access  Private
const getUserAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return stored analytics data
    res.json({
      attendance: user.analytics.attendance,
      avgMarks: user.analytics.avgMarks,
      dailyHours: user.analytics.dailyHours,
      totalCourses: user.analytics.totalCourses,
      completedCourses: user.analytics.completedCourses,
      totalHours: user.analytics.totalHours,
      daysStudied: user.analytics.daysStudied,
      studySessions: user.analytics.studySessions,
      learningHoursChart: user.analytics.learningHoursChart,
      certificates: user.analytics.certificates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Record study session
// @route   POST /api/analytics/study-session
// @access  Private
const recordStudySession = async (req, res) => {
  try {
    const { hours, date } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sessionDate = date ? new Date(date) : new Date();

    // Check if this is a new day
    const isNewDay = !user.analytics.lastStudyDate ||
      new Date(user.analytics.lastStudyDate).toDateString() !== sessionDate.toDateString();

    if (isNewDay) {
      user.analytics.daysStudied += 1;
      user.analytics.lastStudyDate = sessionDate;
    }

    // Add to total hours
    user.analytics.totalHours += hours;

    // Add study session
    user.analytics.studySessions.push({
      date: sessionDate,
      hours: hours
    });

    await user.save();

    res.json({
      message: 'Study session recorded successfully',
      analytics: user.analytics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { getUserAnalytics, recordStudySession };
