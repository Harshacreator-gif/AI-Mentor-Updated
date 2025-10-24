import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import { Star, Bookmark } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CoursesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('my-courses')
  const [coursesData, setCoursesData] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        const response = await fetch('/data/courses.json')
        const data = await response.json()
        setCoursesData(data)
      } catch (error) {
        console.error('Error fetching courses data:', error)
      }
    }
    fetchCoursesData()
  }, [])

  if (!coursesData) {
    return <div>Loading...</div>
  }

  const { statsCards, courseCards, popularCourses } = coursesData

  // Filter courses based on user's purchased courses
  const myCourses = courseCards.filter(course =>
    user?.purchasedCourses?.some(purchased => purchased.courseId === course.id)
  )

  const allCourses = activeTab === 'my-courses' ? myCourses : popularCourses

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activePage="courses"
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80'
      }`}>
        {/* Courses Content */}
        <main className="flex-1 mt-16 overflow-x-hidden overflow-y-auto bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Learning Hub Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Learning Hub</h1>
              <p className="text-gray-600">Discover and continue your AI learning journey</p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-2 inline-flex">
              <button
                onClick={() => setActiveTab('my-courses')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'my-courses'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                My Courses ({myCourses.length})
              </button>
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === 'explore'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Explore Courses
              </button>
            </div>

            {/* Stats Cards - Only show for My Courses */}
            {activeTab === 'my-courses' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statsCards.map((stat, index) => (
                  <div key={index} className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${stat.bgColor}`}>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                        <img src={stat.icon} alt="" className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Courses Grid */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeTab === 'my-courses' ? 'Continue Learning' : 'Popular Courses'}
              </h2>

              {allCourses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    {activeTab === 'my-courses'
                      ? 'You haven\'t purchased any courses yet. Explore courses to get started!'
                      : 'No courses available at the moment.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allCourses.map((course) => (
                    <Link
                      key={course.id}
                      to={activeTab === 'my-courses' ? `/learning/${course.id}` : `/course-preview/${course.id}`}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                    >
                      {/* Course Image */}
                      <div className="relative">
                        <img
                          src={course.image || '/AI_Tutor_New_UI/Dashboard/logo.png'}
                          alt={course.title}
                          className="w-full h-40 object-cover"
                        />
                        {/* Rating Badge */}
                        <div className="absolute bottom-3 right-3 bg-white rounded-full px-2 py-1 flex items-center space-x-1 shadow-sm">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-700">{course.rating}</span>
                        </div>
                        {/* Student count */}
                        <div className="absolute top-3 right-3 text-xs text-gray-500">
                          {course.students}
                        </div>
                      </div>

                      {/* Course Details */}
                      <div className="p-4 space-y-3">
                        {/* Category Badge */}
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${course.categoryColor}`}>
                          {course.category}
                        </div>

                        {/* Course Title */}
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{course.title}</h3>

                        {/* Course Info */}
                        <p className="text-sm text-gray-600">{course.lessons} • {course.level}</p>

                        {/* Price and Bookmark */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-lg font-bold text-gray-900">{course.price}</span>
                          <div className={`p-2 rounded-full ${course.isBookmarked ? 'bg-teal-500' : 'bg-white border border-gray-200'}`}>
                            <Bookmark className={`w-4 h-4 ${course.isBookmarked ? 'text-white fill-white' : 'text-teal-600'}`} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CoursesPage
