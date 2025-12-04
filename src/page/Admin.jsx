import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as classAPI from "../api/class";
import * as studentAPI from "../api/student";
import * as commentAPI from "../api/comment";
import * as attendanceAPI from "../api/attendance";
import * as analyticsAPI from "../api/analytics";
import * as reportsAPI from "../api/reports";
import * as marksAPI from "../api/marks";
import { 
  createAdmin,
  getAdminDashboard,
  getAllClassesAdmin,
  getClassDetailsAdmin,
  getClassStudentsAdmin,
  getClassAttendanceAdmin,
  getAllStudentsAdmin,
  getStudentDetailsAdmin,
  getStudentAttendanceAdmin,
  getAllAttendanceAdmin,
  getAttendanceStatsAdmin,
  getAttendanceByDateAdmin,
  getAllUsersAdmin,
  getUserDetailsAdmin,
  getAnalyticsOverviewAdmin,
  getClassPerformanceAnalyticsAdmin,
  getAttendanceTrendsAnalyticsAdmin,
  getAttendanceReportAdmin,
  getClassPerformanceReportAdmin,
  getStudentPerformanceReportAdmin,
} from "../api/auth";
import { useTracking } from "../hooks/useTracking";
import { utils, writeFile } from "xlsx";

const COMMENTS_PER_PAGE = 12;

function Admin() {
  const navigate = useNavigate();
  const { trackAdminDashboardAccess, trackDataAccess, trackReportGeneration } =
    useTracking();
  const [activeTab, setActiveTab] = useState("overview");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [comments, setComments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [classPerformance, setClassPerformance] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schoolReport, setSchoolReport] = useState(null);
  const [marksReport, setMarksReport] = useState(null);
  const [commentReport, setCommentReport] = useState(null);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [selectedClassForStudents, setSelectedClassForStudents] =
    useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const [marksReportLoading, setMarksReportLoading] = useState(false);
  const [commentReportLoading, setCommentReportLoading] = useState(false);
  const [attendanceReportLoading, setAttendanceReportLoading] = useState(false);
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  
  // Modal states
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  
  // Create modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  
  // Form states
  const [newClass, setNewClass] = useState({
    className: "",
    subjectName: "",
    classRoom: "",
    classCredit: "",
  });
  
  const [newStudent, setNewStudent] = useState({
    studentName: "",
    classId: "",
    schoolId: "",
  });

  const [newAdmin, setNewAdmin] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleExportSchoolReport = () => {
    if (
      !schoolReport ||
      !schoolReport.schools ||
      schoolReport.schools.length === 0
    ) {
      alert("Please generate the school report before exporting as Excel.");
      return;
    }

    const rows = schoolReport.schools.map((school) => ({
      "School Name": school.schoolName || "N/A",
      Classes: school.statistics?.totalClasses ?? 0,
      Students: school.statistics?.totalStudents ?? 0,
      Subjects: school.statistics?.totalSubjects ?? 0,
      "Attendance Records": school.statistics?.totalAttendanceRecords ?? 0,
      "Marks Entries": school.statistics?.totalMarks ?? 0,
      Present: school.statistics?.attendanceSummary?.present ?? 0,
      Absent: school.statistics?.attendanceSummary?.absent ?? 0,
      Late: school.statistics?.attendanceSummary?.late ?? 0,
      "Attendance Rate %":
        school.statistics?.attendanceSummary?.attendanceRate ?? 0,
      "Average Score %": school.statistics?.marksSummary?.average ?? 0,
      "Highest Score %": school.statistics?.marksSummary?.highest ?? 0,
      "Lowest Score %": school.statistics?.marksSummary?.lowest ?? 0,
    }));

    rows.unshift({
      "School Name": "Summary (All Schools)",
      Classes:
        schoolReport.totalClasses ?? schoolReport.summary?.totalClasses ?? 0,
      Students:
        schoolReport.totalStudents ?? schoolReport.summary?.totalStudents ?? 0,
      Subjects: schoolReport.summary?.totalSubjects ?? 0,
      "Attendance Records": schoolReport.summary?.totalAttendanceRecords ?? 0,
      "Marks Entries": schoolReport.summary?.totalMarks ?? 0,
      Present: schoolReport.attendanceSummary?.present ?? 0,
      Absent: schoolReport.attendanceSummary?.absent ?? 0,
      Late: schoolReport.attendanceSummary?.late ?? 0,
      "Attendance Rate %": schoolReport.attendanceSummary?.attendanceRate ?? 0,
      "Average Score %": schoolReport.marksSummary?.average ?? 0,
      "Highest Score %": schoolReport.marksSummary?.highest ?? 0,
      "Lowest Score %": schoolReport.marksSummary?.lowest ?? 0,
    });

    const worksheet = utils.json_to_sheet(rows);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Schools");
    writeFile(
      workbook,
      `school-report-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");
    
    // Track admin dashboard access
    await trackAdminDashboardAccess({
      timestamp: new Date().toISOString(),
    });
    
    try {
      // Load all admin data in parallel using admin-specific APIs
      const [
        classesData,
        studentsData,
        commentsData,
        attendanceData,
        dashboardData,
        classPerfData,
        attendanceStatsData,
        usersData,
      ] = await Promise.all([
        getAllClassesAdmin(),
        getAllStudentsAdmin(),
        commentAPI.getAllCommentsForAdmin(), // Use the new admin API
        getAllAttendanceAdmin(),
        getAdminDashboard(),
        getClassPerformanceAnalyticsAdmin(),
        getAttendanceStatsAdmin(),
        getAllUsersAdmin(),
      ]);

      setClasses(classesData || []);
      setStudents(studentsData || []);
      setComments(commentsData?.data || commentsData || []); // Handle the new response structure
      setAttendanceRecords(attendanceData || []);
      setUsers(usersData || []);
      setDashboardStats(dashboardData);
      setClassPerformance(classPerfData || []);
      
      // Store additional admin data
      console.log("Admin dashboard loaded successfully:", {
        classes: classesData?.length || 0,
        students: studentsData?.length || 0,
        attendance: attendanceData?.length || 0,
        users: usersData?.length || 0,
        comments: commentsData?.data?.length || commentsData?.length || 0,
        stats: attendanceStatsData,
      });
    } catch (err) {
      console.error("Error loading admin dashboard data:", err);
      setError("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceTrends = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    
    try {
      let trends = [];
      
      if (selectedClass) {
        // Load attendance trends for specific class
        console.log("Loading attendance trends for class:", selectedClass);
        const classAttendance = await getClassAttendanceAdmin(selectedClass);
        trends = classAttendance || [];
        console.log("Class attendance data:", trends);
      } else {
        // Load general attendance trends
        console.log("Loading general attendance trends");
        trends = await getAttendanceTrendsAnalyticsAdmin(
          dateRange.startDate,
          dateRange.endDate
        );
        console.log("General trends data:", trends);
      }
      
      setAttendanceTrends(trends || []);
    } catch (err) {
      console.error("Error loading attendance trends:", err);
      setError("Failed to load attendance trends");
    }
  };


  const handleCreateClass = async () => {
    if (
      !newClass.className.trim() ||
      !newClass.subjectName.trim() ||
      !newClass.classRoom.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const createdClass = await classAPI.createClass(newClass);
      setClasses([...classes, createdClass]);
      setNewClass({
        className: "",
        subjectName: "",
        classRoom: "",
        classCredit: "",
      });
      setShowCreateClassModal(false);
      setError("");
    } catch (err) {
      console.error("Error creating class:", err);
      setError("Failed to create class");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.studentName.trim() || !newStudent.classId) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const createdStudent = await studentAPI.createStudent(newStudent);
      setStudents([...students, createdStudent]);
      setNewStudent({ studentName: "", classId: "", schoolId: "" });
      setShowCreateStudentModal(false);
      setError("");
    } catch (err) {
      console.error("Error creating student:", err);
      setError("Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    // Validation
    if (
      !newAdmin.username.trim() ||
      !newAdmin.email.trim() ||
      !newAdmin.password.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    if (newAdmin.password !== newAdmin.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newAdmin.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdmin.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const adminData = {
        username: newAdmin.username.trim(),
        email: newAdmin.email.trim(),
        password: newAdmin.password,
        confirmPassword: newAdmin.confirmPassword,
      };

      const response = await createAdmin(adminData);
      console.log("Admin created successfully:", response);
      
      // Reset form
      setNewAdmin({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setShowCreateAdminModal(false);
      
      // Show success message (you can add a success state if needed)
      alert("Admin user created successfully!");
    } catch (err) {
      console.error("Error creating admin:", err);
      setError(err.response?.data?.message || "Failed to create admin user");
    } finally {
      setLoading(false);
    }
  };

  const openCommentModal = (comment) => {
    setSelectedComment(comment);
    setShowCommentModal(true);
  };

  const openAttendanceModal = (attendance) => {
    setSelectedAttendance(attendance);
    setShowAttendanceModal(true);
  };

  const getTeacherName = (teacherId) => {
    if (!teacherId) return "Unknown Teacher";
    if (typeof teacherId === "object") {
      return (
        teacherId.username ||
        teacherId.email ||
        teacherId._id ||
        "Unknown Teacher"
      );
    }
    return teacherId;
  };

  const getTeacherId = (teacherId) => {
    if (!teacherId) return "Not specified";
    if (typeof teacherId === "object") {
      return teacherId._id || teacherId;
    }
    return teacherId;
  };

  // Helper function to safely get class name from classId
  const getClassNameFromId = (classId) => {
    if (!classId) return "No Class";
    if (typeof classId === "object") {
      return (
        classId.className || classId.name || classId._id || "Unknown Class"
      );
    }
    // If it's a string ID, find the class name from classes array
    const foundClass = classes.find((cls) => cls._id === classId);
    return foundClass ? foundClass.className : classId;
  };

  // Helper function to safely get school ID
  const getSchoolId = (schoolId) => {
    if (!schoolId) return null;
    if (typeof schoolId === "object") {
      return schoolId._id || schoolId.name || schoolId.id || "Unknown School";
    }
    return schoolId;
  };

  // Helper function to safely get class name
  const getClassName = (cls) => {
    if (!cls) return "Unknown Class";
    if (typeof cls.className === "object") {
      return cls.className.name || cls.className._id || "Unknown Class";
    }
    return cls.className || "Unknown Class";
  };

  // Helper function to safely get subject name
  const getSubjectName = (cls) => {
    if (!cls) return "Unknown Subject";
    if (typeof cls.subjectName === "object") {
      return cls.subjectName.name || cls.subjectName._id || "Unknown Subject";
    }
    return cls.subjectName || "Unknown Subject";
  };

  // Helper function to safely get student name
  const getStudentName = (studentId) => {
    if (!studentId) return "Unknown Student";
    if (typeof studentId === "object") {
      return (
        studentId.studentName ||
        studentId.name ||
        studentId._id ||
        "Unknown Student"
      );
    }
    // If it's a string ID, find the student name from students array
    const foundStudent = students.find((student) => student._id === studentId);
    return foundStudent
      ? foundStudent.studentName || foundStudent.name || studentId
      : studentId;
  };

  const filteredComments = comments.filter((comment) => {
    if (selectedClass && comment.className !== selectedClass) return false;
    return true;
  });

  useEffect(() => {
    setCurrentCommentPage(1);
  }, [selectedClass, filteredComments.length]);

  const totalCommentPages = Math.max(
    1,
    Math.ceil(filteredComments.length / COMMENTS_PER_PAGE)
  );
  const paginatedComments = filteredComments.slice(
    (currentCommentPage - 1) * COMMENTS_PER_PAGE,
    currentCommentPage * COMMENTS_PER_PAGE
  );

  const filteredAttendance = attendanceRecords.filter((record) => {
    if (selectedClass && record.classId !== selectedClass) return false;
    if (dateRange.startDate && record.date < dateRange.startDate) return false;
    if (dateRange.endDate && record.date > dateRange.endDate) return false;
    return true;
  });

  // Extract unique schools from classes
  const schoolOptions = useMemo(() => {
    const schoolMap = new Map();
    classes.forEach((cls) => {
      const schoolId = cls.schoolId?._id || cls.schoolId;
      const schoolName = cls.schoolId?.name || "Unknown School";
      if (schoolId && !schoolMap.has(schoolId)) {
        schoolMap.set(schoolId, {
          _id: schoolId,
          name: schoolName,
        });
      }
    });
    return Array.from(schoolMap.values());
  }, [classes]);

  const tabs = [
    { id: "overview", name: "Overview", icon: "📊" },
    { id: "comments", name: "Comments", icon: "💬" },
    { id: "attendance", name: "Attendance", icon: "📋" },
    { id: "reports", name: "Reports", icon: "📊" },
    { id: "admin-management", name: "Admin Management", icon: "👑" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 mt-1 text-sm sm:text-base">
                Manage and review school reports
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={() => setShowCreateClassModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <span className="mr-2">🏫</span>
                <span className="hidden sm:inline">Add Class</span>
                <span className="sm:hidden">Class</span>
              </button>
              <button
                onClick={() => setShowCreateStudentModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                <span className="mr-2">👥</span>
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Student</span>
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-600 text-white p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-800 rounded-lg p-1 mb-4 sm:mb-8">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 flex items-center justify-center px-2 sm:px-4 py-2 sm:py-3 rounded-md transition-colors text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                <span className="mr-1 sm:mr-2 text-sm sm:text-base">
                  {tab.icon}
                </span>
                <span className="hidden xs:inline sm:inline">{tab.name}</span>
                <span className="xs:hidden sm:hidden">
                  {tab.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-4 sm:space-y-8">
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-blue-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">👥</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Students
                    </p>
                    <p className="text-white text-lg sm:text-2xl font-bold">
                      {students.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-green-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">🏫</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">Classes</p>
                    <p className="text-white text-lg sm:text-2xl font-bold">
                      {classes.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-yellow-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">💬</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Comments
                    </p>
                    <p className="text-white text-lg sm:text-2xl font-bold">
                      {comments.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-700 rounded-lg p-3 sm:p-6">
                <div className="flex items-center">
                  <div className="p-1 sm:p-2 bg-purple-600 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">📋</span>
                  </div>
                  <div className="ml-2 sm:ml-4">
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Attendance
                    </p>
                    <p className="text-white text-lg sm:text-2xl font-bold">
                      {attendanceRecords.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-700 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">
                      🏫
                    </span>
                    <h4 className="font-medium text-xs sm:text-sm">
                      Create Class
                    </h4>
                    <p className="text-xs text-green-200 mt-1 hidden sm:block">
                      Add new class
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowCreateStudentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">
                      👥
                    </span>
                    <h4 className="font-medium text-xs sm:text-sm">
                      Add Student
                    </h4>
                    <p className="text-xs text-blue-200 mt-1 hidden sm:block">
                      Register student
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab("comments")}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">
                      💬
                    </span>
                    <h4 className="font-medium text-xs sm:text-sm">
                      View Comments
                    </h4>
                    <p className="text-xs text-yellow-200 mt-1 hidden sm:block">
                      Review feedback
                    </p>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab("attendance")}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-3 sm:p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-lg sm:text-2xl mb-1 sm:mb-2 block">
                      📋
                    </span>
                    <h4 className="font-medium text-xs sm:text-sm">
                      Check Attendance
                    </h4>
                    <p className="text-xs text-purple-200 mt-1 hidden sm:block">
                      View records
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Comments */}
            <div className="bg-slate-700 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Recent Comments
                </h3>
                <button
                  onClick={() => setActiveTab("comments")}
                  className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {filteredComments.slice(0, 5).map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-slate-600 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-slate-500 transition-colors"
                    onClick={() => openCommentModal(comment)}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm sm:text-base">
                          {comment.className} - {comment.subjectName}
                        </h4>
                        <p className="text-slate-300 text-xs sm:text-sm mt-1 line-clamp-2">
                          {comment.successStory ||
                            comment.challenge ||
                            comment.modelLesson ||
                            comment.lessonObservation ||
                            "No content"}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center mt-2 space-y-1 sm:space-y-0 sm:space-x-4">
                          <span className="text-blue-400 text-xs">
                            Click to view full details
                          </span>
                          {comment.teacherId && (
                            <span className="text-gray-400 text-xs">
                              {comment.commenterRole === 'mentor' ? 'Mentor' : 'Teacher'}: {getTeacherName(comment.teacherId)}
                            </span>
                          )}
                          {comment.commenterRole && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                comment.commenterRole === "mentor"
                                  ? "bg-purple-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {comment.commenterRole.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs sm:text-sm">
                          {new Date(
                            comment.createdAt || comment.date
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {comment.numberOfStudents} students
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Classes Overview */}
            <div className="bg-slate-700 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Classes Overview
                </h3>
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs sm:text-sm w-full sm:w-auto"
                >
                  + Add Class
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {classes.slice(0, 6).map((cls) => (
                  <div 
                    key={cls._id} 
                    className="bg-slate-600 rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-slate-500 transition-colors"
                    onClick={() => {
                      setSelectedClassForStudents(cls);
                      setShowStudentsModal(true);
                    }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm sm:text-base">
                          {getClassName(cls)}
                        </h4>
                        <p className="text-slate-300 text-xs sm:text-sm">
                          {getSubjectName(cls)}
                        </p>
                        <p className="text-slate-400 text-xs">
                          Room: {cls.classRoom || "N/A"}
                        </p>
                        <p className="text-blue-400 text-xs mt-1 sm:mt-2">
                          Click to view students →
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs">ID: {cls._id}</p>
                        <p className="text-slate-400 text-xs">
                          {
                            students.filter((student) => {
                              const studentClassId =
                                typeof student.classId === "object"
                                  ? student.classId._id
                                  : student.classId;
                              return studentClassId === cls._id;
                            }).length
                          }{" "}
                          students
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {classes.length === 0 && (
                  <div className="col-span-full text-center text-slate-400 py-8">
                    <p>No classes found. Create your first class!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Students Overview */}
            <div className="bg-slate-700 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Students Overview
                </h3>
                <button
                  onClick={() => setShowCreateStudentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs sm:text-sm w-full sm:w-auto"
                >
                  + Add Student
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {students.slice(0, 6).map((student) => {
                  const schoolId = getSchoolId(student.schoolId);
                  return (
                    <div
                      key={student._id}
                      className="bg-slate-600 rounded-lg p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm sm:text-base">
                            {getStudentName(student)}
                          </h4>
                          <p className="text-slate-300 text-xs sm:text-sm">
                            Class: {getClassNameFromId(student.classId)}
                          </p>
                          {schoolId && (
                            <p className="text-slate-400 text-xs">
                              School ID: {schoolId}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-xs">
                            ID: {student._id}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {students.length === 0 && (
                  <div className="col-span-full text-center text-slate-400 py-8">
                    <p>No students found. Add your first student!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Filter by Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={getClassName(cls)}>
                        {getClassName(cls)} - {getSubjectName(cls)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                All Comments ({filteredComments.length}) 
                <span className="text-sm text-slate-400 ml-2">
                  - Admin View
                </span>
              </h3>
              <div className="space-y-4">
                {paginatedComments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors"
                    onClick={() => openCommentModal(comment)}
                  >
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-white font-medium">
                            {comment.className} - {comment.subjectName}
                          </h4>
                            {comment.schoolId && (
                              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                              School:{" "}
                              {comment.schoolId.name || comment.schoolId}
                              </span>
                            )}
                          </div>
                        <p className="text-slate-300 text-sm mt-1 line-clamp-2">
                          {comment.successStory ||
                            comment.challenge ||
                            comment.modelLesson ||
                            comment.lessonObservation ||
                            "No content"}
                        </p>
                          <div className="flex items-center mt-2 space-x-4">
                          <span className="text-blue-400 text-xs">
                            Click to view full details
                          </span>
                            {comment.teacherId && (
                              <span className="text-gray-400 text-xs">
                              {comment.commenterRole === 'mentor' ? 'Mentor' : 'Teacher'}:{" "}
                              {comment.teacherId.username ||
                                comment.teacherId.email ||
                                getTeacherName(comment.teacherId)}
                              </span>
                            )}
                          {comment.commenterRole && (
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                comment.commenterRole === "mentor"
                                  ? "bg-purple-600 text-white"
                                  : "bg-blue-600 text-white"
                              }`}
                            >
                              {comment.commenterRole.toUpperCase()}
                            </span>
                          )}

                          <span className="text-green-400 text-xs">
                            {comment.numberOfStudents} students
                          </span>
                          </div>
                        </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">
                          {new Date(
                            comment.createdAt || comment.date
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {new Date(
                            comment.createdAt || comment.date
                          ).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {paginatedComments.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-slate-400 text-6xl mb-4">💬</div>
                    <h4 className="text-xl font-medium text-white mb-2">
                      No Comments Found
                    </h4>
                    <p className="text-slate-400">
                      No comments match your current filters.
                    </p>
                  </div>
                )}
              </div>

              {totalCommentPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentCommentPage((page) => Math.max(1, page - 1))
                    }
                    disabled={currentCommentPage === 1}
                    className="px-3 py-2 rounded bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-slate-300 text-sm">
                    Page {currentCommentPage} of {totalCommentPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentCommentPage((page) =>
                        Math.min(totalCommentPages, page + 1)
                      )
                    }
                    disabled={currentCommentPage === totalCommentPages}
                    className="px-3 py-2 rounded bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Filter by Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {getClassName(cls)} - {getSubjectName(cls)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, startDate: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      setDateRange({ ...dateRange, endDate: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={loadAttendanceTrends}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {selectedClass
                  ? `Load Trends for ${getClassNameFromId(selectedClass)}`
                  : "Load All Trends"}
              </button>
            </div>

            {/* Attendance Records */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Attendance Records ({filteredAttendance.length})
              </h3>
              <div className="space-y-4">
                {filteredAttendance.map((record) => (
                  <div
                    key={record._id}
                    className="bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-colors"
                    onClick={() => openAttendanceModal(record)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-white font-medium">
                          {getStudentName(record.studentId)}
                        </h4>
                        <p className="text-slate-300 text-sm">
                          Class: {getClassNameFromId(record.classId)}
                        </p>
                        {record.remarks && (
                          <p className="text-slate-400 text-xs mt-1">
                            {record.remarks}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            record.status === "present"
                              ? "bg-green-600 text-white"
                              : record.status === "absent"
                              ? "bg-red-600 text-white"
                              : record.status === "late"
                              ? "bg-yellow-600 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {record.status}
                        </span>
                        <p className="text-slate-400 text-sm mt-1">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Trends Display */}
            {attendanceTrends.length > 0 && (
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  📈 Attendance Trends{" "}
                  {selectedClass
                    ? `for ${getClassNameFromId(selectedClass)}`
                    : "(All Classes)"}
                </h3>
                <div className="space-y-4">
                  {attendanceTrends.map((trend, index) => (
                    <div
                      key={trend._id || index}
                      className="bg-slate-600 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-medium">
                            {trend.date
                              ? new Date(trend.date).toLocaleDateString()
                              : `Trend ${index + 1}`}
                          </h4>
                          {trend.className && (
                            <p className="text-slate-300 text-sm">
                              Class: {trend.className}
                            </p>
                          )}
                          {trend.studentName && (
                            <p className="text-slate-300 text-sm">
                              Student: {trend.studentName}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              trend.status === "present"
                                ? "bg-green-600 text-white"
                                : trend.status === "absent"
                                ? "bg-red-600 text-white"
                                : trend.status === "late"
                                ? "bg-yellow-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {trend.status || "Unknown"}
                          </span>
                          {trend.attendanceRate && (
                            <p className="text-slate-400 text-sm mt-1">
                              Rate: {trend.attendanceRate}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Report Generation Section */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📊 Generate Reports
              </h3>
              <p className="text-slate-300 mb-6">
                Generate comprehensive reports for your school data. All reports
                include detailed analytics and can be downloaded as PDF.
              </p>

              {/* Marks Report Display */}
              {marksReport && (
                <div className="bg-slate-600 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    📊 Marks Report
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {marksReport.totalMarks}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Marks Entries
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {marksReport.totalStudents}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Students
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {marksReport.totalClasses}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Classes
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {marksReport.totalSchools}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Schools
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        🎓 Academic Performance
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>Average: {marksReport.marksSummary?.average?.toFixed(2) || 0}%</div>
                        <div>Highest: {marksReport.marksSummary?.highest || 0}%</div>
                        <div>Lowest: {marksReport.marksSummary?.lowest || 0}%</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📚 Terms Distribution
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>First Term: {marksReport.termsCount?.FIRST_TERM || 0}</div>
                        <div>Second Term: {marksReport.termsCount?.SECOND_TERM || 0}</div>
                        <div>Third Term: {marksReport.termsCount?.THIRD_TERM || 0}</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📊 System Info
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>System: School Management System</div>
                        <div>
                          Generated: {new Date().toLocaleDateString()}
                        </div>
                        <div>Marks: {marksReport.totalMarks}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual Marks Details */}
                  {marksReport.marks && marksReport.marks.length > 0 && (
                    <div className="mt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h5 className="text-white font-semibold">
                          📊 Individual Marks Details
                        </h5>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setMarksReportLoading(true);
                              setError("");
                              
                              // Ensure users are loaded for role detection in export
                              let usersForExport = users;
                              if (users.length === 0) {
                                console.log("Loading users for Excel export role detection...");
                                try {
                                  const usersData = await getAllUsersAdmin();
                                  usersForExport = usersData || [];
                                  setUsers(usersForExport);
                                  console.log(`Loaded ${usersForExport.length} users for export`);
                                } catch (usersError) {
                                  console.warn("Could not load users for export:", usersError);
                                }
                              }
                              
                              // Try backend endpoint first
                              try {
                                const result = await marksAPI.exportMarksToExcel();
                                console.log("Marks export successful via backend:", result);
                                setError(""); // Clear any previous errors
                                // Show success message (you can replace this with a toast notification)
                                alert(`Excel file exported successfully: ${result.filename || 'marks-report.xlsx'}`);
                                return;
                              } catch (backendError) {
                                console.warn("Backend export failed, using frontend fallback:", backendError);
                                // Continue to frontend fallback
                              }
                              
                              // Fallback: Generate Excel on frontend using current marksReport data
                              if (!marksReport.marks || marksReport.marks.length === 0) {
                                throw new Error("No marks data available to export");
                              }
                              
                              const formatTerm = (term) => {
                                if (!term) return "N/A";
                                const termMap = {
                                  FIRST_TERM: "First Term",
                                  SECOND_TERM: "Second Term",
                                  THIRD_TERM: "Third Term",
                                };
                                return termMap[term] || term;
                              };

                              // Helper function to extract subject name with comprehensive fallbacks
                              const extractSubjectName = (mark) => {
                                // Try direct subject field first
                                if (mark.subject && typeof mark.subject === 'string' && mark.subject.trim() !== '') {
                                  return mark.subject.trim();
                                }
                                
                                // Try subjectName field
                                if (mark.subjectName && typeof mark.subjectName === 'string' && mark.subjectName.trim() !== '') {
                                  return mark.subjectName.trim();
                                }
                                
                                // Try populated subjectId object
                                if (mark.subjectId) {
                                  if (typeof mark.subjectId === 'object') {
                                    if (mark.subjectId.subjectName && typeof mark.subjectId.subjectName === 'string') {
                                      return mark.subjectId.subjectName.trim();
                                    }
                                    if (mark.subjectId.name && typeof mark.subjectId.name === 'string') {
                                      return mark.subjectId.name.trim();
                                    }
                                  }
                                }
                                
                                // Try populated classId object
                                if (mark.classId) {
                                  if (typeof mark.classId === 'object') {
                                    // Try classId.subjectName (most common)
                                    if (mark.classId.subjectName && typeof mark.classId.subjectName === 'string') {
                                      return mark.classId.subjectName.trim();
                                    }
                                    // Try classId.subject if it exists
                                    if (mark.classId.subject && typeof mark.classId.subject === 'string') {
                                      return mark.classId.subject.trim();
                                    }
                                    // Try classId.subjectId if it's populated
                                    if (mark.classId.subjectId) {
                                      if (typeof mark.classId.subjectId === 'object' && mark.classId.subjectId.subjectName) {
                                        return mark.classId.subjectId.subjectName.trim();
                                      }
                                    }
                                  }
                                }
                                
                                // Last resort: Look up in classes array
                                const classId = mark.classId?._id || mark.classId;
                                if (classId) {
                                  const foundClass = classes.find((cls) => {
                                    const clsId = cls._id || cls.id;
                                    return clsId === classId || clsId?.toString() === classId?.toString();
                                  });
                                  
                                  if (foundClass) {
                                    if (foundClass.subjectName && typeof foundClass.subjectName === 'string') {
                                      return foundClass.subjectName.trim();
                                    }
                                    if (foundClass.subject && typeof foundClass.subject === 'string') {
                                      return foundClass.subject.trim();
                                    }
                                    // Check if class has subjectId populated
                                    if (foundClass.subjectId) {
                                      if (typeof foundClass.subjectId === 'object' && foundClass.subjectId.subjectName) {
                                        return foundClass.subjectId.subjectName.trim();
                                      }
                                    }
                                  }
                                }
                                
                                // Debug logging for missing subjects
                                console.warn('Could not extract subject name for mark:', {
                                  markId: mark._id || mark.id,
                                  studentName: mark.studentId?.studentName || mark.studentName,
                                  className: mark.classId?.className || mark.className,
                                  availableFields: Object.keys(mark),
                                  markData: mark
                                });
                                
                                return "N/A";
                              };
                              
                              // Helper function to determine submitter role (same as in table display)
                              // Use usersForExport instead of users to ensure we have the latest data
                              const getSubmitterRole = (mark) => {
                                // Check if mark has a direct role field (like commenterRole)
                                if (mark.commenterRole) {
                                  return mark.commenterRole === 'mentor' ? 'Mentor' : 'Teacher';
                                }
                                if (mark.role) {
                                  return mark.role === 'mentor' ? 'Mentor' : 'Teacher';
                                }
                                
                                // Check if teacherId is populated and has role field
                                if (mark.teacherId) {
                                  // If teacherId is an object (populated)
                                  if (typeof mark.teacherId === 'object' && mark.teacherId !== null) {
                                    // Check if role is directly on teacherId object
                                    if (mark.teacherId.role) {
                                      return mark.teacherId.role === 'mentor' ? 'Mentor' : 'Teacher';
                                    }
                                    
                                    // Extract teacherId for lookup
                                    const teacherId = mark.teacherId._id || mark.teacherId.id || mark.teacherId;
                                    
                                    // Look up user in usersForExport array by teacherId
                                    if (teacherId && usersForExport.length > 0) {
                                      const user = usersForExport.find(u => {
                                        const userId = u._id || u.id;
                                        return userId === teacherId || userId?.toString() === teacherId?.toString();
                                      });
                                      if (user && user.role) {
                                        console.log('Found role in export:', user.role, 'for teacherId:', teacherId);
                                        return user.role === 'mentor' ? 'Mentor' : 'Teacher';
                                      }
                                    }
                                  } else if (typeof mark.teacherId === 'string') {
                                    // If teacherId is a string (not populated), look it up in usersForExport array
                                    if (usersForExport.length > 0) {
                                      const user = usersForExport.find(u => {
                                        const userId = u._id || u.id;
                                        return userId === mark.teacherId || userId?.toString() === mark.teacherId?.toString();
                                      });
                                      if (user && user.role) {
                                        console.log('Found role in export (string ID):', user.role, 'for teacherId:', mark.teacherId);
                                        return user.role === 'mentor' ? 'Mentor' : 'Teacher';
                                      }
                                    }
                                  }
                                }
                                
                                // Default to Teacher if role cannot be determined
                                console.warn('Could not determine role for mark in export, defaulting to Teacher:', mark._id);
                                return 'Teacher';
                              };
                              
                              const headers = ["Term", "School Name", "Class", "Subject", "Student Name", "Marks", "Submitted By"];
                              const dataRows = marksReport.marks.map((mark) => {
                                const subjectName = extractSubjectName(mark);
                                const submitterRole = getSubmitterRole(mark);
                                
                                return [
                                  formatTerm(mark.term || mark.academicTerm || mark.academic_term),
                                  mark.schoolId?.name || mark.schoolName || "N/A",
                                  mark.classId?.className || mark.className || "N/A",
                                  subjectName,
                                  mark.studentId?.studentName || mark.studentName || "N/A",
                                  mark.marks || mark.totalMarks || 0, // Use marks field (numeric value for Excel)
                                  submitterRole,
                                ];
                              });

                              const allRows = [headers, ...dataRows];
                              const worksheet = utils.aoa_to_sheet(allRows);
                              worksheet['!cols'] = [
                                { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 12 }
                              ];
                              const workbook = utils.book_new();
                              utils.book_append_sheet(workbook, worksheet, "Marks Report");
                              const filename = `marks-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
                              writeFile(workbook, filename);
                              
                              setError(""); // Clear any previous errors
                              // Show success message
                              alert(`Excel file exported successfully: ${filename}`);
                            } catch (err) {
                              console.error("Error exporting marks:", err);
                              setError(`Failed to export marks: ${err.message || err.toString()}`);
                            } finally {
                              setMarksReportLoading(false);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          disabled={!marksReport.marks?.length || marksReportLoading}
                        >
                          {marksReportLoading ? "Exporting..." : "Export to Excel"}
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-500">
                        <table className="min-w-full text-sm text-left">
                          <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3 border-b border-slate-600">Term</th>
                              <th className="px-4 py-3 border-b border-slate-600">School Name</th>
                              <th className="px-4 py-3 border-b border-slate-600">Class</th>
                              <th className="px-4 py-3 border-b border-slate-600">Subject</th>
                              <th className="px-4 py-3 border-b border-slate-600">Student Name</th>
                              <th className="px-4 py-3 border-b border-slate-600">Marks</th>
                              <th className="px-4 py-3 border-b border-slate-600">Submitted By</th>
                            </tr>
                          </thead>
                          <tbody>
                            {marksReport.marks.map((mark, index) => {
                              const formatTerm = (term) => {
                                if (!term) return "N/A";
                                const termMap = {
                                  FIRST_TERM: "First Term",
                                  SECOND_TERM: "Second Term",
                                  THIRD_TERM: "Third Term",
                                };
                                return termMap[term] || term;
                              };
                              
                              // Helper function to determine if mark was submitted by mentor or teacher
                              const getSubmitterRole = (mark) => {
                                console.log('Determining role for mark:', {
                                  markId: mark._id,
                                  teacherId: mark.teacherId,
                                  teacherIdType: typeof mark.teacherId,
                                  usersCount: users.length
                                });
                                
                                // Check if mark has a direct role field (like commenterRole)
                                if (mark.commenterRole) {
                                  const role = mark.commenterRole === 'mentor' ? 'Mentor' : 'Teacher';
                                  console.log('Found role from commenterRole:', role);
                                  return role;
                                }
                                if (mark.role) {
                                  const role = mark.role === 'mentor' ? 'Mentor' : 'Teacher';
                                  console.log('Found role from mark.role:', role);
                                  return role;
                                }
                                
                                // Check if teacherId is populated and has role field
                                if (mark.teacherId) {
                                  // If teacherId is an object (populated)
                                  if (typeof mark.teacherId === 'object' && mark.teacherId !== null) {
                                    // Check if role is directly on teacherId object
                                    if (mark.teacherId.role) {
                                      const role = mark.teacherId.role === 'mentor' ? 'Mentor' : 'Teacher';
                                      console.log('Found role from teacherId.role:', role);
                                      return role;
                                    }
                                    
                                    // Extract teacherId for lookup
                                    const teacherId = mark.teacherId._id || mark.teacherId.id || mark.teacherId;
                                    console.log('Looking up user with teacherId:', teacherId);
                                    
                                    // Look up user in users array by teacherId
                                    if (teacherId && users.length > 0) {
                                      const user = users.find(u => {
                                        const userId = u._id || u.id;
                                        const matches = userId === teacherId || userId?.toString() === teacherId?.toString();
                                        if (matches) {
                                          console.log('Found user:', { userId, role: u.role, username: u.username });
                                        }
                                        return matches;
                                      });
                                      if (user && user.role) {
                                        const role = user.role === 'mentor' ? 'Mentor' : 'Teacher';
                                        console.log('Found role from users array:', role);
                                        return role;
                                      }
                                    }
                                  } else if (typeof mark.teacherId === 'string') {
                                    // If teacherId is a string (not populated), look it up in users array
                                    console.log('teacherId is string, looking up:', mark.teacherId);
                                    if (users.length > 0) {
                                      const user = users.find(u => {
                                        const userId = u._id || u.id;
                                        const matches = userId === mark.teacherId || userId?.toString() === mark.teacherId?.toString();
                                        if (matches) {
                                          console.log('Found user by string ID:', { userId, role: u.role, username: u.username });
                                        }
                                        return matches;
                                      });
                                      if (user && user.role) {
                                        const role = user.role === 'mentor' ? 'Mentor' : 'Teacher';
                                        console.log('Found role from users array (string ID):', role);
                                        return role;
                                      }
                                    }
                                  }
                                }
                                
                                // Default to Teacher if role cannot be determined
                                console.warn('Could not determine role for mark, defaulting to Teacher:', mark._id);
                                return 'Teacher';
                              };
                              
                              // Use the same extraction logic as Excel export
                              const extractSubjectName = (mark) => {
                                // Try direct subject field first
                                if (mark.subject && typeof mark.subject === 'string' && mark.subject.trim() !== '') {
                                  return mark.subject.trim();
                                }
                                
                                // Try subjectName field
                                if (mark.subjectName && typeof mark.subjectName === 'string' && mark.subjectName.trim() !== '') {
                                  return mark.subjectName.trim();
                                }
                                
                                // Try populated subjectId object
                                if (mark.subjectId) {
                                  if (typeof mark.subjectId === 'object') {
                                    if (mark.subjectId.subjectName && typeof mark.subjectId.subjectName === 'string') {
                                      return mark.subjectId.subjectName.trim();
                                    }
                                    if (mark.subjectId.name && typeof mark.subjectId.name === 'string') {
                                      return mark.subjectId.name.trim();
                                    }
                                  }
                                }
                                
                                // Try populated classId object
                                if (mark.classId) {
                                  if (typeof mark.classId === 'object') {
                                    // Try classId.subjectName (most common)
                                    if (mark.classId.subjectName && typeof mark.classId.subjectName === 'string') {
                                      return mark.classId.subjectName.trim();
                                    }
                                    // Try classId.subject if it exists
                                    if (mark.classId.subject && typeof mark.classId.subject === 'string') {
                                      return mark.classId.subject.trim();
                                    }
                                    // Try classId.subjectId if it's populated
                                    if (mark.classId.subjectId) {
                                      if (typeof mark.classId.subjectId === 'object' && mark.classId.subjectId.subjectName) {
                                        return mark.classId.subjectId.subjectName.trim();
                                      }
                                    }
                                  }
                                }
                                
                                // Last resort: Look up in classes array
                                const classId = mark.classId?._id || mark.classId;
                                if (classId) {
                                  const foundClass = classes.find((cls) => {
                                    const clsId = cls._id || cls.id;
                                    return clsId === classId || clsId?.toString() === classId?.toString();
                                  });
                                  
                                  if (foundClass) {
                                    if (foundClass.subjectName && typeof foundClass.subjectName === 'string') {
                                      return foundClass.subjectName.trim();
                                    }
                                    if (foundClass.subject && typeof foundClass.subject === 'string') {
                                      return foundClass.subject.trim();
                                    }
                                    // Check if class has subjectId populated
                                    if (foundClass.subjectId) {
                                      if (typeof foundClass.subjectId === 'object' && foundClass.subjectId.subjectName) {
                                        return foundClass.subjectId.subjectName.trim();
                                      }
                                    }
                                  }
                                }
                                
                                return "N/A";
                              };
                              
                              const subjectName = extractSubjectName(mark);
                              const submitterRole = getSubmitterRole(mark);
                              
                              return (
                                <tr
                                  key={mark._id || index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-slate-700 text-white"
                                      : "bg-slate-600 text-white"
                                  }
                                >
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {formatTerm(mark.term || mark.academicTerm || mark.academic_term)}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500 font-medium">
                                    {mark.schoolId?.name || mark.schoolName || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {mark.classId?.className || mark.className || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {subjectName}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {mark.studentId?.studentName || mark.studentName || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500 font-bold">
                                    {mark.marksFormatted || (mark.totalMarks || mark.marks || 0)}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      submitterRole === 'Mentor' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-blue-600 text-white'
                                    }`}>
                                      {submitterRole}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Comment Report Display */}
              {commentReport && (
                <div className="bg-slate-600 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    💬 Comment Report
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {commentReport.totalComments}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Comments
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {commentReport.teacherComments}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Teacher Comments
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {commentReport.mentorComments}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Mentor Comments
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {commentReport.totalCommenters}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Commenters
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📊 Comment Statistics
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>Total Schools: {commentReport.totalSchools}</div>
                        <div>Total Classes: {commentReport.totalClasses}</div>
                        <div>Total Commenters: {commentReport.totalCommenters}</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        👥 Role Distribution
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>Teachers: {commentReport.teacherComments}</div>
                        <div>Mentors: {commentReport.mentorComments}</div>
                        <div>Total: {commentReport.totalComments}</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📊 System Info
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>System: School Management System</div>
                        <div>
                          Generated: {new Date(commentReport.generatedAt).toLocaleDateString()}
                        </div>
                        <div>Comments: {commentReport.totalComments}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Comments Table */}
                  {commentReport.comments && commentReport.comments.length > 0 && (
                    <div className="mt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h5 className="text-white font-semibold">
                          📋 Detailed Comments Listing
                        </h5>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setCommentReportLoading(true);
                              setError("");
                              
                              if (!commentReport.comments || commentReport.comments.length === 0) {
                                throw new Error("No comments data available to export");
                              }
                              
                              // Helper function to get commenter name
                              const getCommenterName = (comment) => {
                                if (comment.teacherId?.username) return comment.teacherId.username;
                                if (comment.teacherId?.email) return comment.teacherId.email;
                                if (typeof comment.teacherId === 'string') return comment.teacherId;
                                return 'Unknown';
                              };
                              
                              // Helper function to get commenter email
                              const getCommenterEmail = (comment) => {
                                if (comment.teacherId?.email) return comment.teacherId.email;
                                return 'N/A';
                              };
                              
                              // Helper function to get commenter role
                              const getCommenterRole = (comment) => {
                                if (comment.commenterRole) {
                                  return comment.commenterRole === 'mentor' ? 'Mentor' : 'Teacher';
                                }
                                return 'Teacher';
                              };
                              
                              // Helper function to format comment fields based on role
                              const getCommentFields = (comment) => {
                                if (comment.commenterRole === 'mentor') {
                                  return {
                                    field1: comment.modelLesson || 'N/A',
                                    field2: comment.lessonObservation || 'N/A',
                                    field1Label: 'Model Lesson',
                                    field2Label: 'Lesson Observation'
                                  };
                                } else {
                                  return {
                                    field1: comment.successStory || 'N/A',
                                    field2: comment.challenge || 'N/A',
                                    field1Label: 'Success Story',
                                    field2Label: 'Challenge'
                                  };
                                }
                              };
                              
                              const headers = [
                                "Role",
                                "Commenter Name",
                                "Commenter Email",
                                "School Name",
                                "Class",
                                "Subject",
                                "Number of Students",
                                "Field 1 (Teacher: Success Story / Mentor: Model Lesson)",
                                "Field 2 (Teacher: Challenge / Mentor: Lesson Observation)",
                                "Date"
                              ];
                              
                              const dataRows = commentReport.comments.map((comment) => {
                                const fields = getCommentFields(comment);
                                return [
                                  getCommenterRole(comment),
                                  getCommenterName(comment),
                                  getCommenterEmail(comment),
                                  comment.schoolId?.name || comment.schoolName || "N/A",
                                  comment.className || comment.classId?.className || "N/A",
                                  comment.subjectName || comment.classId?.subjectName || "N/A",
                                  comment.numberOfStudents || 0,
                                  fields.field1,
                                  fields.field2,
                                  comment.date ? new Date(comment.date).toLocaleDateString() : 
                                  (comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "N/A")
                                ];
                              });
                              
                              const allRows = [headers, ...dataRows];
                              const worksheet = utils.aoa_to_sheet(allRows);
                              worksheet['!cols'] = [
                                { wch: 10 }, // Role
                                { wch: 20 }, // Commenter Name
                                { wch: 25 }, // Commenter Email
                                { wch: 25 }, // School Name
                                { wch: 15 }, // Class
                                { wch: 20 }, // Subject
                                { wch: 15 }, // Number of Students
                                { wch: 50 }, // Field 1 (Success Story / Model Lesson)
                                { wch: 50 }, // Field 2 (Challenge / Lesson Observation)
                                { wch: 12 }  // Date
                              ];
                              const workbook = utils.book_new();
                              utils.book_append_sheet(workbook, worksheet, "Comment Report");
                              const filename = `comment-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
                              writeFile(workbook, filename);
                              
                              setError("");
                              alert(`Excel file exported successfully: ${filename}`);
                            } catch (err) {
                              console.error("Error exporting comments:", err);
                              setError(`Failed to export comments: ${err.message || err.toString()}`);
                            } finally {
                              setCommentReportLoading(false);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          disabled={!commentReport.comments?.length || commentReportLoading}
                        >
                          {commentReportLoading ? "Exporting..." : "Export to Excel"}
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-500">
                        <table className="min-w-full text-sm text-left">
                          <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3 border-b border-slate-600">Role</th>
                              <th className="px-4 py-3 border-b border-slate-600">Commenter Name</th>
                              <th className="px-4 py-3 border-b border-slate-600">Commenter Email</th>
                              <th className="px-4 py-3 border-b border-slate-600">School Name</th>
                              <th className="px-4 py-3 border-b border-slate-600">Class</th>
                              <th className="px-4 py-3 border-b border-slate-600">Subject</th>
                              <th className="px-4 py-3 border-b border-slate-600">Students</th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                <div className="flex flex-col">
                                  <span>Teacher: Success Story</span>
                                  <span className="text-xs text-purple-300">Mentor: Model Lesson</span>
                                </div>
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                <div className="flex flex-col">
                                  <span>Teacher: Challenge</span>
                                  <span className="text-xs text-purple-300">Mentor: Lesson Observation</span>
                                </div>
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {commentReport.comments.map((comment, index) => {
                              // Helper function to get commenter name
                              const getCommenterName = (comment) => {
                                if (comment.teacherId?.username) return comment.teacherId.username;
                                if (comment.teacherId?.email) return comment.teacherId.email;
                                if (typeof comment.teacherId === 'string') return comment.teacherId;
                                return 'Unknown';
                              };
                              
                              // Helper function to get commenter email
                              const getCommenterEmail = (comment) => {
                                if (comment.teacherId?.email) return comment.teacherId.email;
                                return 'N/A';
                              };
                              
                              // Helper function to get commenter role
                              const getCommenterRole = (comment) => {
                                if (comment.commenterRole) {
                                  return comment.commenterRole === 'mentor' ? 'Mentor' : 'Teacher';
                                }
                                return 'Teacher';
                              };
                              
                              // Helper function to get comment content
                              const getCommentContent = (comment) => {
                                if (comment.commenterRole === 'mentor') {
                                  return comment.modelLesson || comment.lessonObservation || comment.successStory || comment.challenge || 'N/A';
                                } else {
                                  return comment.successStory || comment.challenge || 'N/A';
                                }
                              };
                              
                              const role = getCommenterRole(comment);
                              const roleColor = role === 'Mentor' ? 'bg-purple-600' : 'bg-blue-600';
                              
                              return (
                                <tr
                                  key={comment._id || index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-slate-700 text-white"
                                      : "bg-slate-600 text-white"
                                  }
                                >
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    <span className={`${roleColor} text-white px-2 py-1 rounded text-xs`}>
                                      {role}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500 font-medium">
                                    {getCommenterName(comment)}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {getCommenterEmail(comment)}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {comment.schoolId?.name || comment.schoolName || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {comment.className || comment.classId?.className || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {comment.subjectName || comment.classId?.subjectName || "N/A"}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {comment.numberOfStudents || 0}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    <div className="max-w-md truncate" title={getCommentContent(comment)}>
                                      {getCommentContent(comment)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {comment.date ? new Date(comment.date).toLocaleDateString() : 
                                     (comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : "N/A")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance Report Display */}
              {attendanceReport && (
                <div className="bg-slate-600 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    📋 Attendance Report
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {attendanceReport.totalRecords}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Records
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {attendanceReport.presentCount}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Present
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {attendanceReport.absentCount}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Absent
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {attendanceReport.attendanceRate}%
                      </div>
                      <div className="text-slate-300 text-sm">
                        Attendance Rate
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📊 Attendance Statistics
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>Total Students: {attendanceReport.totalStudents}</div>
                        <div>Total Schools: {attendanceReport.totalSchools}</div>
                        <div>Total Classes: {attendanceReport.totalClasses}</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📈 Status Distribution
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>Present: {attendanceReport.presentCount}</div>
                        <div>Absent: {attendanceReport.absentCount}</div>
                        <div>Late: {attendanceReport.lateCount}</div>
                        <div>Excused: {attendanceReport.excusedCount}</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📊 System Info
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>System: School Management System</div>
                        <div>
                          Generated: {new Date(attendanceReport.generatedAt).toLocaleDateString()}
                        </div>
                        <div>Records: {attendanceReport.totalRecords}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed Attendance Table */}
                  {attendanceReport.attendance && attendanceReport.attendance.length > 0 && (
                    <div className="mt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h5 className="text-white font-semibold">
                          📋 Detailed Attendance Listing
                        </h5>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              setAttendanceReportLoading(true);
                              setError("");
                              
                              if (!attendanceReport.attendance || attendanceReport.attendance.length === 0) {
                                throw new Error("No attendance data available to export");
                              }
                              
                              // Helper function to extract school name with comprehensive fallbacks
                              const extractSchoolName = (attendance) => {
                                // Get the school lookup map from the report
                                const schoolMap = attendanceReport.schoolLookupMap || {};
                                
                                // Try direct schoolName field
                                if (attendance.schoolName && typeof attendance.schoolName === 'string' && attendance.schoolName.trim() !== '') {
                                  return attendance.schoolName.trim();
                                }
                                
                                // Try populated schoolId object
                                if (attendance.schoolId) {
                                  if (typeof attendance.schoolId === 'object' && !attendance.schoolId.toString) {
                                    // It's an object, not a string ObjectId
                                    if (attendance.schoolId.name && typeof attendance.schoolId.name === 'string') {
                                      return attendance.schoolId.name.trim();
                                    }
                                  }
                                }
                                
                                // Try to get school from studentId (students have schoolId)
                                if (attendance.studentId) {
                                  if (typeof attendance.studentId === 'object') {
                                    // Check if studentId has schoolId populated
                                    if (attendance.studentId.schoolId) {
                                      if (typeof attendance.studentId.schoolId === 'object' && attendance.studentId.schoolId.name) {
                                        return attendance.studentId.schoolId.name.trim();
                                      }
                                      const studentSchId = attendance.studentId.schoolId._id || attendance.studentId.schoolId;
                                      if (studentSchId && schoolMap[studentSchId.toString()]) {
                                        return schoolMap[studentSchId.toString()];
                                      }
                                    }
                                  }
                                  
                                  // Also try to find the student and get its school
                                  const studentId = attendance.studentId?._id || attendance.studentId;
                                  if (studentId) {
                                    const foundStudent = students.find((stu) => {
                                      const stuId = stu._id || stu.id;
                                      return stuId === studentId || stuId?.toString() === studentId?.toString();
                                    });
                                    if (foundStudent) {
                                      // Get school from student
                                      if (foundStudent.schoolId) {
                                        if (typeof foundStudent.schoolId === 'object' && foundStudent.schoolId.name) {
                                          return foundStudent.schoolId.name.trim();
                                        }
                                        const studentSchId = foundStudent.schoolId._id || foundStudent.schoolId;
                                        if (studentSchId && schoolMap[studentSchId.toString()]) {
                                          return schoolMap[studentSchId.toString()];
                                        }
                                      }
                                    }
                                  }
                                }
                                
                                // Try to get school from classId (classes have schoolId)
                                if (attendance.classId) {
                                  let classSchoolId = null;
                                  
                                  if (typeof attendance.classId === 'object') {
                                    // Check if classId has schoolId populated
                                    if (attendance.classId.schoolId) {
                                      if (typeof attendance.classId.schoolId === 'object' && attendance.classId.schoolId.name) {
                                        return attendance.classId.schoolId.name.trim();
                                      }
                                      classSchoolId = attendance.classId.schoolId._id || attendance.classId.schoolId;
                                    }
                                  }
                                  
                                  // If we have classSchoolId, look it up in map
                                  if (classSchoolId && schoolMap[classSchoolId.toString()]) {
                                    return schoolMap[classSchoolId.toString()];
                                  }
                                  
                                  // Also try to find the class and get its school
                                  const classId = attendance.classId?._id || attendance.classId;
                                  if (classId) {
                                    const foundClass = classes.find((cls) => {
                                      const clsId = cls._id || cls.id;
                                      return clsId === classId || clsId?.toString() === classId?.toString();
                                    });
                                    if (foundClass) {
                                      // Get school from class
                                      if (foundClass.schoolId) {
                                        if (typeof foundClass.schoolId === 'object' && foundClass.schoolId.name) {
                                          return foundClass.schoolId.name.trim();
                                        }
                                        const classSchId = foundClass.schoolId._id || foundClass.schoolId;
                                        if (classSchId && schoolMap[classSchId.toString()]) {
                                          return schoolMap[classSchId.toString()];
                                        }
                                      }
                                    }
                                  }
                                }
                                
                                // Last resort: Look up in schoolMap using attendance's schoolId
                                const schoolId = attendance.schoolId?._id || attendance.schoolId;
                                if (schoolId && schoolMap[schoolId.toString()]) {
                                  return schoolMap[schoolId.toString()];
                                }
                                
                                // Final fallback: Look up in schoolOptions array
                                if (schoolId) {
                                  const foundSchool = schoolOptions.find((school) => {
                                    const schId = school._id || school.id;
                                    return schId === schoolId || schId?.toString() === schoolId?.toString();
                                  });
                                  if (foundSchool?.name) {
                                    return foundSchool.name;
                                  }
                                }
                                
                                return "N/A";
                              };
                              
                              // Helper function to extract subject name
                              const extractSubjectName = (attendance) => {
                                if (attendance.subjectName && typeof attendance.subjectName === 'string') {
                                  return attendance.subjectName.trim();
                                }
                                if (attendance.classId?.subjectName) {
                                  return attendance.classId.subjectName;
                                }
                                if (attendance.classId?.subject) {
                                  return attendance.classId.subject;
                                }
                                // Look up in classes array
                                const classId = attendance.classId?._id || attendance.classId;
                                if (classId) {
                                  const foundClass = classes.find((cls) => {
                                    const clsId = cls._id || cls.id;
                                    return clsId === classId || clsId?.toString() === classId?.toString();
                                  });
                                  if (foundClass?.subjectName) {
                                    return foundClass.subjectName;
                                  }
                                }
                                return "N/A";
                              };
                              
                              const headers = [
                                "School Name",
                                "Student Name",
                                "Class",
                                "Subject",
                                "Date",
                                "Status"
                              ];
                              
                              const dataRows = attendanceReport.attendance.map((attendance) => {
                                const schoolName = extractSchoolName(attendance);
                                const studentName = attendance.studentId?.studentName || attendance.studentName || "N/A";
                                const className = attendance.classId?.className || attendance.className || "N/A";
                                const subjectName = extractSubjectName(attendance);
                                const date = attendance.date 
                                  ? new Date(attendance.date).toLocaleDateString() 
                                  : (attendance.createdAt 
                                    ? new Date(attendance.createdAt).toLocaleDateString() 
                                    : "N/A");
                                const status = attendance.status || "N/A";
                                
                                return [
                                  schoolName,
                                  studentName,
                                  className,
                                  subjectName,
                                  date,
                                  status
                                ];
                              });
                              
                              const allRows = [headers, ...dataRows];
                              const worksheet = utils.aoa_to_sheet(allRows);
                              worksheet['!cols'] = [
                                { wch: 25 }, // School Name
                                { wch: 30 }, // Student Name
                                { wch: 15 }, // Class
                                { wch: 20 }, // Subject
                                { wch: 12 }, // Date
                                { wch: 12 }  // Status
                              ];
                              const workbook = utils.book_new();
                              utils.book_append_sheet(workbook, worksheet, "Attendance Report");
                              const filename = `attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
                              writeFile(workbook, filename);
                              
                              setError("");
                              alert(`Excel file exported successfully: ${filename}`);
                            } catch (err) {
                              console.error("Error exporting attendance:", err);
                              setError(`Failed to export attendance: ${err.message || err.toString()}`);
                            } finally {
                              setAttendanceReportLoading(false);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          disabled={!attendanceReport.attendance?.length || attendanceReportLoading}
                        >
                          {attendanceReportLoading ? "Exporting..." : "Export to Excel"}
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-500">
                        <table className="min-w-full text-sm text-left">
                          <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3 border-b border-slate-600">School Name</th>
                              <th className="px-4 py-3 border-b border-slate-600">Student Name</th>
                              <th className="px-4 py-3 border-b border-slate-600">Class</th>
                              <th className="px-4 py-3 border-b border-slate-600">Subject</th>
                              <th className="px-4 py-3 border-b border-slate-600">Date</th>
                              <th className="px-4 py-3 border-b border-slate-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceReport.attendance.map((attendance, index) => {
                              // Helper function to extract school name with comprehensive fallbacks
                              const extractSchoolName = (attendance) => {
                                // Get the school lookup map from the report
                                const schoolMap = attendanceReport.schoolLookupMap || {};
                                
                                // Try direct schoolName field
                                if (attendance.schoolName && typeof attendance.schoolName === 'string' && attendance.schoolName.trim() !== '') {
                                  return attendance.schoolName.trim();
                                }
                                
                                // Try populated schoolId object
                                if (attendance.schoolId) {
                                  if (typeof attendance.schoolId === 'object' && !attendance.schoolId.toString) {
                                    // It's an object, not a string ObjectId
                                    if (attendance.schoolId.name && typeof attendance.schoolId.name === 'string') {
                                      return attendance.schoolId.name.trim();
                                    }
                                  }
                                }
                                
                                // Try to get school from studentId (students have schoolId)
                                if (attendance.studentId) {
                                  if (typeof attendance.studentId === 'object') {
                                    // Check if studentId has schoolId populated
                                    if (attendance.studentId.schoolId) {
                                      if (typeof attendance.studentId.schoolId === 'object' && attendance.studentId.schoolId.name) {
                                        return attendance.studentId.schoolId.name.trim();
                                      }
                                      const studentSchId = attendance.studentId.schoolId._id || attendance.studentId.schoolId;
                                      if (studentSchId && schoolMap[studentSchId.toString()]) {
                                        return schoolMap[studentSchId.toString()];
                                      }
                                    }
                                  }
                                  
                                  // Also try to find the student and get its school
                                  const studentId = attendance.studentId?._id || attendance.studentId;
                                  if (studentId) {
                                    const foundStudent = students.find((stu) => {
                                      const stuId = stu._id || stu.id;
                                      return stuId === studentId || stuId?.toString() === studentId?.toString();
                                    });
                                    if (foundStudent) {
                                      // Get school from student
                                      if (foundStudent.schoolId) {
                                        if (typeof foundStudent.schoolId === 'object' && foundStudent.schoolId.name) {
                                          return foundStudent.schoolId.name.trim();
                                        }
                                        const studentSchId = foundStudent.schoolId._id || foundStudent.schoolId;
                                        if (studentSchId && schoolMap[studentSchId.toString()]) {
                                          return schoolMap[studentSchId.toString()];
                                        }
                                      }
                                    }
                                  }
                                }
                                
                                // Try to get school from classId (classes have schoolId)
                                if (attendance.classId) {
                                  let classSchoolId = null;
                                  
                                  if (typeof attendance.classId === 'object') {
                                    // Check if classId has schoolId populated
                                    if (attendance.classId.schoolId) {
                                      if (typeof attendance.classId.schoolId === 'object' && attendance.classId.schoolId.name) {
                                        return attendance.classId.schoolId.name.trim();
                                      }
                                      classSchoolId = attendance.classId.schoolId._id || attendance.classId.schoolId;
                                    }
                                  }
                                  
                                  // If we have classSchoolId, look it up in map
                                  if (classSchoolId && schoolMap[classSchoolId.toString()]) {
                                    return schoolMap[classSchoolId.toString()];
                                  }
                                  
                                  // Also try to find the class and get its school
                                  const classId = attendance.classId?._id || attendance.classId;
                                  if (classId) {
                                    const foundClass = classes.find((cls) => {
                                      const clsId = cls._id || cls.id;
                                      return clsId === classId || clsId?.toString() === classId?.toString();
                                    });
                                    if (foundClass) {
                                      // Get school from class
                                      if (foundClass.schoolId) {
                                        if (typeof foundClass.schoolId === 'object' && foundClass.schoolId.name) {
                                          return foundClass.schoolId.name.trim();
                                        }
                                        const classSchId = foundClass.schoolId._id || foundClass.schoolId;
                                        if (classSchId && schoolMap[classSchId.toString()]) {
                                          return schoolMap[classSchId.toString()];
                                        }
                                      }
                                    }
                                  }
                                }
                                
                                // Last resort: Look up in schoolMap using attendance's schoolId
                                const schoolId = attendance.schoolId?._id || attendance.schoolId;
                                if (schoolId && schoolMap[schoolId.toString()]) {
                                  return schoolMap[schoolId.toString()];
                                }
                                
                                // Final fallback: Look up in schoolOptions array
                                if (schoolId) {
                                  const foundSchool = schoolOptions.find((school) => {
                                    const schId = school._id || school.id;
                                    return schId === schoolId || schId?.toString() === schoolId?.toString();
                                  });
                                  if (foundSchool?.name) {
                                    return foundSchool.name;
                                  }
                                }
                                
                                return "N/A";
                              };
                              
                              // Helper function to extract subject name
                              const extractSubjectName = (attendance) => {
                                if (attendance.subjectName && typeof attendance.subjectName === 'string') {
                                  return attendance.subjectName.trim();
                                }
                                if (attendance.classId?.subjectName) {
                                  return attendance.classId.subjectName;
                                }
                                if (attendance.classId?.subject) {
                                  return attendance.classId.subject;
                                }
                                // Look up in classes array
                                const classId = attendance.classId?._id || attendance.classId;
                                if (classId) {
                                  const foundClass = classes.find((cls) => {
                                    const clsId = cls._id || cls.id;
                                    return clsId === classId || clsId?.toString() === classId?.toString();
                                  });
                                  if (foundClass?.subjectName) {
                                    return foundClass.subjectName;
                                  }
                                }
                                return "N/A";
                              };
                              
                              const schoolName = extractSchoolName(attendance);
                              const studentName = attendance.studentId?.studentName || attendance.studentName || "N/A";
                              const className = attendance.classId?.className || attendance.className || "N/A";
                              const subjectName = extractSubjectName(attendance);
                              const date = attendance.date 
                                ? new Date(attendance.date).toLocaleDateString() 
                                : (attendance.createdAt 
                                  ? new Date(attendance.createdAt).toLocaleDateString() 
                                  : "N/A");
                              const status = attendance.status || "N/A";
                              
                              // Status color coding
                              const getStatusColor = (status) => {
                                const statusLower = status?.toLowerCase();
                                if (statusLower === 'present') return 'text-green-400 font-semibold';
                                if (statusLower === 'absent') return 'text-red-400 font-semibold';
                                if (statusLower === 'late') return 'text-yellow-400 font-semibold';
                                if (statusLower === 'excused') return 'text-blue-400 font-semibold';
                                return 'text-slate-300';
                              };
                              
                              return (
                                <tr
                                  key={attendance._id || index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-slate-700 text-white"
                                      : "bg-slate-600 text-white"
                                  }
                                >
                                  <td className="px-4 py-3 border-b border-slate-500 font-medium">
                                    {schoolName}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {studentName}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {className}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {subjectName}
                                  </td>
                                  <td className="px-4 py-3 border-b border-slate-500">
                                    {date}
                                  </td>
                                  <td className={`px-4 py-3 border-b border-slate-500 ${getStatusColor(status)}`}>
                                    {status.toUpperCase()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* School Report Display */}
              {schoolReport && (
                <div className="bg-slate-600 rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    🏫 School Management Report
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {schoolReport.totalSchools}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Schools
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {schoolReport.totalClasses}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Classes
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {schoolReport.totalStudents}
                      </div>
                      <div className="text-slate-300 text-sm">
                        Total Students
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-white">
                        {schoolReport.attendanceSummary.attendanceRate}%
                      </div>
                      <div className="text-slate-300 text-sm">
                        Attendance Rate
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📋 Attendance Summary
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>
                          Present: {schoolReport.attendanceSummary.present}
                        </div>
                        <div>
                          Absent: {schoolReport.attendanceSummary.absent}
                        </div>
                        <div>Late: {schoolReport.attendanceSummary.late}</div>
                        <div>
                          Rate: {schoolReport.attendanceSummary.attendanceRate}%
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        🎓 Academic Performance
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>Average: {schoolReport.marksSummary.average}%</div>
                        <div>Highest: {schoolReport.marksSummary.highest}%</div>
                        <div>Lowest: {schoolReport.marksSummary.lowest}%</div>
                      </div>
                    </div>
                    <div className="bg-slate-500 rounded-lg p-4">
                      <h5 className="text-white font-semibold mb-2">
                        📊 System Info
                      </h5>
                      <div className="text-slate-300 text-sm">
                        <div>System: {schoolReport.generatedBy}</div>
                        <div>
                          Generated:{" "}
                          {new Date(
                            schoolReport.generatedAt
                          ).toLocaleDateString()}
                        </div>
                        <div>Schools: {schoolReport.totalSchools}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual School Details */}
                  {schoolReport.schools && schoolReport.schools.length > 0 && (
                    <div className="mt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h5 className="text-white font-semibold">
                          🏫 Individual School Details
                        </h5>
                        <button
                          type="button"
                          onClick={handleExportSchoolReport}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                          disabled={!schoolReport.schools.length}
                        >
                          Export to Excel
                        </button>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-slate-500">
                        <table className="min-w-full text-sm text-left">
                          <thead className="bg-slate-800 text-slate-200 uppercase text-xs">
                            <tr>
                              <th className="px-4 py-3 border-b border-slate-600">
                                School Name
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Classes
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Students
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Subjects
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Attendance Records
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Marks Entries
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Present
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Absent
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Late
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Attendance %
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Average %
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Highest %
                              </th>
                              <th className="px-4 py-3 border-b border-slate-600">
                                Lowest %
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {schoolReport.schools.map((school, index) => (
                              <tr
                                key={school.schoolId || index}
                                className={
                                  index % 2 === 0
                                    ? "bg-slate-700 text-white"
                                    : "bg-slate-600 text-white"
                                }
                              >
                                <td className="px-4 py-3 border-b border-slate-500 font-medium">
                                  {school.schoolName || "N/A"}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.totalClasses ?? 0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.totalStudents ?? 0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.totalSubjects ?? 0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.totalAttendanceRecords ??
                                    0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.totalMarks ?? 0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.attendanceSummary
                                    ?.present ?? 0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.attendanceSummary
                                    ?.absent ?? 0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.attendanceSummary?.late ??
                                    0}
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.attendanceSummary
                                    ?.attendanceRate ?? 0}
                                  %
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.marksSummary?.average ??
                                    0}
                                  %
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.marksSummary?.highest ??
                                    0}
                                  %
                                </td>
                                <td className="px-4 py-3 border-b border-slate-500">
                                  {school.statistics?.marksSummary?.lowest ?? 0}
                                  %
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* School Report */}
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      setError("");

                      // Get school report from the new endpoint
                      const report = await reportsAPI.getSchoolReport();

                      console.log("School report generated:", report);
                      
                      // Handle the new data structure with multiple schools
                      const schools = report?.schools || [];
                      const summary = report?.summary || {};
                      
                      // Add fallback values to prevent undefined errors
                      const safeReport = {
                        school: "School Management System",
                        totalClasses: summary?.totalClasses || 0,
                        totalStudents: summary?.totalStudents || 0,
                        totalSchools: report?.totalSchools || 0,
                        attendanceSummary: {
                          present: summary?.attendanceSummary?.present || 0,
                          absent: summary?.attendanceSummary?.absent || 0,
                          late: summary?.attendanceSummary?.late || 0,
                          attendanceRate:
                            summary?.attendanceSummary?.attendanceRate || 0,
                        },
                        marksSummary: {
                          average: summary?.marksSummary?.average || 0,
                          highest: summary?.marksSummary?.highest || 0,
                          lowest: summary?.marksSummary?.lowest || 0,
                        },
                        schools: schools,
                        generatedAt:
                          report?.generatedAt || new Date().toISOString(),
                        generatedBy:
                          report?.generatedBy || "School Management System",
                      };

                      setSchoolReport(safeReport);
                    } catch (error) {
                      console.error("Error generating school report:", error);
                      setError(
                        "Failed to generate school report: " +
                          (error.response?.data?.message || error.message)
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🏫</span>
                    <h4 className="font-medium">School Report</h4>
                    <p className="text-sm text-blue-200 mt-1">
                      Complete school overview
                    </p>
                  </div>
                </button>
                
                {/* Marks Report */}
                <button
                  onClick={async () => {
                    try {
                      setMarksReportLoading(true);
                      setError("");

                      // Ensure users are loaded for role detection
                      if (users.length === 0) {
                        console.log("Loading users for role detection...");
                        try {
                          const usersData = await getAllUsersAdmin();
                          setUsers(usersData || []);
                          console.log(`Loaded ${(usersData || []).length} users`);
                        } catch (usersError) {
                          console.warn("Could not load users:", usersError);
                        }
                      }

                      // Try to fetch all marks from reports endpoint first (for admin)
                      let marksArray = [];
                      try {
                        console.log("Trying to fetch all marks from reports endpoint...");
                        const allMarksData = await reportsAPI.getAllMarksReport();
                        console.log("All marks report response:", allMarksData);
                        
                        // Handle response structure
                        if (Array.isArray(allMarksData)) {
                          marksArray = allMarksData;
                        } else if (allMarksData?.marks && Array.isArray(allMarksData.marks)) {
                          marksArray = allMarksData.marks;
                        } else if (allMarksData?.data && Array.isArray(allMarksData.data)) {
                          marksArray = allMarksData.data;
                        }
                        console.log(`Found ${marksArray.length} marks from reports endpoint`);
                      } catch (reportsError) {
                        console.warn("Reports endpoint not available, trying regular marks endpoint:", reportsError);
                        
                        // Fallback: Try regular marks endpoint
                        const marksData = await marksAPI.getMarks({});
                        console.log("Marks API response:", marksData);
                        
                        // Handle different response structures
                        if (Array.isArray(marksData)) {
                          marksArray = marksData;
                        } else if (marksData?.data && Array.isArray(marksData.data)) {
                          marksArray = marksData.data;
                        } else if (marksData?.marks && Array.isArray(marksData.marks)) {
                          marksArray = marksData.marks;
                        } else if (marksData?.records && Array.isArray(marksData.records)) {
                          marksArray = marksData.records;
                        }
                        console.log(`Found ${marksArray.length} marks from regular endpoint`);
                      }
                      
                      if (!marksArray || marksArray.length === 0) {
                        console.warn("No marks found. This might be because:");
                        console.warn("1. The backend filters marks by teacherId");
                        console.warn("2. Admin users may not have marks assigned to them");
                        console.warn("3. There might be no marks in the system");
                        console.warn("4. The /reports/marks/all endpoint might not exist yet");
                        
                        setError("No marks data found. Please add a /reports/marks/all endpoint in your backend that returns all marks (similar to exportMarksToExcel but returns JSON). The Excel export button should still work.");
                        setMarksReport(null);
                        return;
                      }

                      console.log(`Found ${marksArray.length} marks`);

                      // Calculate statistics
                      const totalMarks = marksArray.length;
                      const uniqueStudents = new Set(marksArray.map(m => m.studentId?._id || m.studentId || m.studentId?.studentName || m.studentName).filter(Boolean));
                      const uniqueClasses = new Set(marksArray.map(m => m.classId?._id || m.classId || m.classId?.className || m.className).filter(Boolean));
                      const uniqueSchools = new Set(marksArray.map(m => m.schoolId?._id || m.schoolId || m.schoolId?.name || m.schoolName).filter(Boolean));
                      
                      // Calculate marks summary (use percentage if available, otherwise use marks)
                      const marksValues = marksArray.map(m => {
                        // Prefer percentage if available, otherwise use marks/totalMarks
                        if (m.percentage !== undefined && m.percentage !== null) {
                          return m.percentage;
                        }
                        return m.totalMarks || m.marks || 0;
                      }).filter(m => m > 0);
                      const average = marksValues.length > 0 
                        ? marksValues.reduce((a, b) => a + b, 0) / marksValues.length 
                        : 0;
                      const highest = marksValues.length > 0 ? Math.max(...marksValues) : 0;
                      const lowest = marksValues.length > 0 ? Math.min(...marksValues) : 0;
                      
                      // Count terms (handle both 'term' and 'academicTerm' fields)
                      const termsCount = {
                        FIRST_TERM: marksArray.filter(m => (m.term || m.academicTerm || m.academic_term) === 'FIRST_TERM').length,
                        SECOND_TERM: marksArray.filter(m => (m.term || m.academicTerm || m.academic_term) === 'SECOND_TERM').length,
                        THIRD_TERM: marksArray.filter(m => (m.term || m.academicTerm || m.academic_term) === 'THIRD_TERM').length,
                      };
                      
                      // Create marks report object
                      const report = {
                        marks: marksArray,
                        totalMarks,
                        totalStudents: uniqueStudents.size,
                        totalClasses: uniqueClasses.size,
                        totalSchools: uniqueSchools.size,
                        marksSummary: {
                          average,
                          highest,
                          lowest,
                        },
                        termsCount,
                        generatedAt: new Date(),
                        generatedBy: 'School Management System',
                      };

                      setMarksReport(report);
                      console.log("Marks report generated:", report);
                    } catch (err) {
                      console.error("Error loading marks report:", err);
                      setError(`Failed to load marks report: ${err.message || err.response?.data?.message || "Unknown error"}`);
                      setMarksReport(null);
                    } finally {
                      setMarksReportLoading(false);
                    }
                  }}
                  disabled={marksReportLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📊</span>
                    <h4 className="font-medium">Marks Report</h4>
                    <p className="text-sm text-green-200 mt-1">
                      Complete marks overview
                    </p>
                  </div>
                </button>
                
                {/* Comment Report */}
                <button
                  onClick={async () => {
                    try {
                      setCommentReportLoading(true);
                      setError("");

                      // Fetch all comments for admin
                      let commentsArray = [];
                      try {
                        console.log("Fetching all comments for admin...");
                        const commentsData = await commentAPI.getAllCommentsForAdmin();
                        console.log("Comments API response:", commentsData);
                        
                        // Handle different response structures
                        if (Array.isArray(commentsData)) {
                          commentsArray = commentsData;
                        } else if (commentsData?.data && Array.isArray(commentsData.data)) {
                          commentsArray = commentsData.data;
                        } else if (commentsData?.comments && Array.isArray(commentsData.comments)) {
                          commentsArray = commentsData.comments;
                        } else if (commentsData?.records && Array.isArray(commentsData.records)) {
                          commentsArray = commentsData.records;
                        }
                        console.log(`Found ${commentsArray.length} comments`);
                      } catch (commentsError) {
                        console.error("Error fetching comments:", commentsError);
                        setError(`Failed to fetch comments: ${commentsError.message || "Unknown error"}`);
                        setCommentReport(null);
                        return;
                      }
                      
                      if (!commentsArray || commentsArray.length === 0) {
                        setError("No comments data found.");
                        setCommentReport(null);
                        return;
                      }

                      // Calculate statistics
                      const totalComments = commentsArray.length;
                      const teacherComments = commentsArray.filter(c => 
                        c.commenterRole === 'teacher' || (!c.commenterRole && c.teacherId)
                      ).length;
                      const mentorComments = commentsArray.filter(c => 
                        c.commenterRole === 'mentor'
                      ).length;
                      
                      // Get unique teachers/mentors
                      const uniqueCommenters = new Set(
                        commentsArray.map(c => {
                          const teacherId = c.teacherId?._id || c.teacherId || c.teacherId?.id;
                          return teacherId?.toString();
                        }).filter(Boolean)
                      );
                      
                      // Get unique schools
                      const uniqueSchools = new Set(
                        commentsArray.map(c => {
                          const schoolId = c.schoolId?._id || c.schoolId;
                          return schoolId?.toString();
                        }).filter(Boolean)
                      );
                      
                      // Get unique classes
                      const uniqueClasses = new Set(
                        commentsArray.map(c => {
                          const classId = c.classId?._id || c.classId || c.className;
                          return classId?.toString();
                        }).filter(Boolean)
                      );
                      
                      // Create comment report object
                      const report = {
                        comments: commentsArray,
                        totalComments,
                        teacherComments,
                        mentorComments,
                        totalCommenters: uniqueCommenters.size,
                        totalSchools: uniqueSchools.size,
                        totalClasses: uniqueClasses.size,
                        generatedAt: new Date(),
                        generatedBy: 'School Management System',
                      };

                      setCommentReport(report);
                      console.log("Comment report generated:", report);
                    } catch (err) {
                      console.error("Error loading comment report:", err);
                      setError(`Failed to load comment report: ${err.message || err.response?.data?.message || "Unknown error"}`);
                      setCommentReport(null);
                    } finally {
                      setCommentReportLoading(false);
                    }
                  }}
                  disabled={commentReportLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">💬</span>
                    <h4 className="font-medium">Daily Report</h4>
                    <p className="text-sm text-purple-200 mt-1">
                      Teacher & Mentor comments
                    </p>
                  </div>
                </button>
                
                {/* Attendance Report */}
                <button
                  onClick={async () => {
                    try {
                      setAttendanceReportLoading(true);
                      setError("");

                      // Fetch all attendance records for admin
                      let attendanceArray = [];
                      try {
                        console.log("Fetching all attendance records for admin...");
                        
                        // Try to fetch from reports endpoint first (with populated school data)
                        try {
                          console.log("Trying to fetch all attendance from reports endpoint...");
                          const reportsAttendanceData = await reportsAPI.getAllAttendanceReport();
                          console.log("Reports attendance response:", reportsAttendanceData);
                          
                          // Handle different response structures
                          if (Array.isArray(reportsAttendanceData)) {
                            attendanceArray = reportsAttendanceData;
                          } else if (reportsAttendanceData?.data && Array.isArray(reportsAttendanceData.data)) {
                            attendanceArray = reportsAttendanceData.data;
                          } else if (reportsAttendanceData?.records && Array.isArray(reportsAttendanceData.records)) {
                            attendanceArray = reportsAttendanceData.records;
                          } else if (reportsAttendanceData?.attendance && Array.isArray(reportsAttendanceData.attendance)) {
                            attendanceArray = reportsAttendanceData.attendance;
                          }
                          console.log(`Found ${attendanceArray.length} attendance records from reports endpoint`);
                        } catch (reportsError) {
                          console.warn("Reports endpoint not available, trying admin endpoint:", reportsError);
                          
                          // Fallback: Use admin endpoint
                          const attendanceData = await getAllAttendanceAdmin();
                          console.log("Attendance API response:", attendanceData);
                          
                          // Handle different response structures
                          if (Array.isArray(attendanceData)) {
                            attendanceArray = attendanceData;
                          } else if (attendanceData?.data && Array.isArray(attendanceData.data)) {
                            attendanceArray = attendanceData.data;
                          } else if (attendanceData?.records && Array.isArray(attendanceData.records)) {
                            attendanceArray = attendanceData.records;
                          } else if (attendanceData?.attendance && Array.isArray(attendanceData.attendance)) {
                            attendanceArray = attendanceData.attendance;
                          }
                          console.log(`Found ${attendanceArray.length} attendance records from admin endpoint`);
                        }
                        
                        // Debug: Log first attendance record structure to understand data format
                        if (attendanceArray.length > 0) {
                          console.log("Sample attendance record structure:", {
                            firstRecord: attendanceArray[0],
                            schoolId: attendanceArray[0].schoolId,
                            schoolIdType: typeof attendanceArray[0].schoolId,
                            schoolIdIsObject: attendanceArray[0].schoolId && typeof attendanceArray[0].schoolId === 'object',
                            schoolName: attendanceArray[0].schoolName,
                            classId: attendanceArray[0].classId,
                            classIdType: typeof attendanceArray[0].classId,
                            studentId: attendanceArray[0].studentId,
                            studentIdType: typeof attendanceArray[0].studentId,
                            allKeys: Object.keys(attendanceArray[0])
                          });
                        }
                      } catch (attendanceError) {
                        console.error("Error fetching attendance:", attendanceError);
                        setError(`Failed to fetch attendance: ${attendanceError.message || "Unknown error"}`);
                        setAttendanceReport(null);
                        return;
                      }
                      
                      if (!attendanceArray || attendanceArray.length === 0) {
                        setError("No attendance data found.");
                        setAttendanceReport(null);
                        return;
                      }

                      // Build comprehensive school lookup map from all available sources
                      const schoolLookupMap = new Map();
                      
                      // 1. Add schools from schoolOptions
                      schoolOptions.forEach(school => {
                        const schoolId = school._id || school.id;
                        if (schoolId && school.name) {
                          schoolLookupMap.set(schoolId.toString(), school.name);
                        }
                      });
                      
                      // 2. Add schools from classes
                      classes.forEach(cls => {
                        const schoolId = cls.schoolId?._id || cls.schoolId;
                        const schoolName = cls.schoolId?.name;
                        if (schoolId && schoolName) {
                          schoolLookupMap.set(schoolId.toString(), schoolName);
                        }
                      });
                      
                      // 3. Add schools from students
                      students.forEach(student => {
                        const schoolId = student.schoolId?._id || student.schoolId;
                        const schoolName = student.schoolId?.name;
                        if (schoolId && schoolName) {
                          schoolLookupMap.set(schoolId.toString(), schoolName);
                        }
                      });
                      
                      // 4. Add schools from attendance records themselves (if populated)
                      attendanceArray.forEach(attendance => {
                        if (attendance.schoolId) {
                          const schoolId = attendance.schoolId._id || attendance.schoolId;
                          const schoolName = attendance.schoolId.name || attendance.schoolName;
                          if (schoolId && schoolName) {
                            schoolLookupMap.set(schoolId.toString(), schoolName);
                          }
                        }
                        if (attendance.schoolName && typeof attendance.schoolName === 'string') {
                          // If we have schoolName but no schoolId, we can't map it, but we'll use it directly
                        }
                      });
                      
                      console.log(`Built school lookup map with ${schoolLookupMap.size} schools:`, Array.from(schoolLookupMap.entries()));

                      // Calculate statistics
                      const totalRecords = attendanceArray.length;
                      const presentCount = attendanceArray.filter(a => 
                        a.status?.toLowerCase() === 'present'
                      ).length;
                      const absentCount = attendanceArray.filter(a => 
                        a.status?.toLowerCase() === 'absent'
                      ).length;
                      const lateCount = attendanceArray.filter(a => 
                        a.status?.toLowerCase() === 'late'
                      ).length;
                      const excusedCount = attendanceArray.filter(a => 
                        a.status?.toLowerCase() === 'excused'
                      ).length;
                      
                      // Get unique values
                      const uniqueStudents = new Set(
                        attendanceArray.map(a => {
                          const studentId = a.studentId?._id || a.studentId || a.studentId?.id;
                          return studentId?.toString();
                        }).filter(Boolean)
                      );
                      
                      const uniqueSchools = new Set(
                        attendanceArray.map(a => {
                          const schoolId = a.schoolId?._id || a.schoolId;
                          return schoolId?.toString();
                        }).filter(Boolean)
                      );
                      
                      const uniqueClasses = new Set(
                        attendanceArray.map(a => {
                          const classId = a.classId?._id || a.classId;
                          return classId?.toString();
                        }).filter(Boolean)
                      );
                      
                      // Calculate attendance rate
                      const attendanceRate = totalRecords > 0 
                        ? Math.round((presentCount / totalRecords) * 100) 
                        : 0;
                      
                      // Create attendance report object
                      const report = {
                        attendance: attendanceArray,
                        totalRecords,
                        presentCount,
                        absentCount,
                        lateCount,
                        excusedCount,
                        attendanceRate,
                        totalStudents: uniqueStudents.size,
                        totalSchools: uniqueSchools.size,
                        totalClasses: uniqueClasses.size,
                        schoolLookupMap: Object.fromEntries(schoolLookupMap), // Store lookup map for use in extraction
                        generatedAt: new Date(),
                        generatedBy: 'School Management System',
                      };

                      setAttendanceReport(report);
                      console.log("Attendance report generated:", report);
                    } catch (err) {
                      console.error("Error loading attendance report:", err);
                      setError(`Failed to load attendance report: ${err.message || err.response?.data?.message || "Unknown error"}`);
                      setAttendanceReport(null);
                    } finally {
                      setAttendanceReportLoading(false);
                    }
                  }}
                  disabled={attendanceReportLoading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white p-4 rounded-lg transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📋</span>
                    <h4 className="font-medium">Attendance Report</h4>
                    <p className="text-sm text-purple-200 mt-1">
                      Student attendance records
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* PDF Download Section */}
            
            

            {/* Individual Class PDF Downloads */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                🎯 Download Class PDF Reports
              </h3>
              <p className="text-slate-300 mb-4">
                Download individual class performance reports as PDF files.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <button
                    key={cls._id}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setError("");
                        
                        await reportsAPI.downloadClassReportPDF(cls._id);
                        
                        // PDF will open automatically for printing/saving
                      } catch (error) {
                        console.error(
                          "Error downloading class report PDF:",
                          error
                        );
                        setError(
                          "Failed to generate class report PDF: " +
                            (error.response?.data?.message || error.message)
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="bg-slate-600 hover:bg-slate-500 text-white p-4 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{getClassName(cls)}</h4>
                        <p className="text-slate-300 text-sm">
                          {getSubjectName(cls)}
                        </p>
                        <p className="text-blue-400 text-xs mt-1">
                          Click to download PDF
                        </p>
                      </div>
                      <span className="text-2xl">📄</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin-management" && (
          <div className="space-y-6">
            {/* System Overview */}
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📊 System Overview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {classes.length}
                  </div>
                  <div className="text-slate-400 text-sm">Total Classes</div>
                </div>
                <div className="bg-green-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {students.length}
                  </div>
                  <div className="text-green-200 text-sm">Total Students</div>
                </div>
                <div className="bg-blue-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {users.length}
                  </div>
                  <div className="text-blue-200 text-sm">Total Users</div>
                </div>
                <div className="bg-purple-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {attendanceRecords.length}
                  </div>
                  <div className="text-purple-200 text-sm">
                    Attendance Records
                  </div>
                </div>
              </div>
            </div>

            {/* User Management */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text_white">
                  👥 User Management
                </h3>
                <button
                  onClick={() => setShowCreateAdminModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Create Admin</span>
                </button>
              </div>
              
              {/* Users List */}
              <div className="bg-slate-600 rounded-lg p-4 mb-4">
                <h4 className="text-white font-medium mb-3">
                  System Users ({users.length})
                </h4>
                {users.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {users.map((user, index) => (
                      <div
                        key={user._id || index}
                        className="bg-slate-500 rounded p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-white font-medium">
                            {user.username || user.email}
                          </div>
                          <div className="text-slate-300 text-sm">
                            {user.email}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              user.role === "admin"
                                ? "bg-red-600 text-red-100"
                                : "bg-slate-500 text-slate-300"
                            }`}
                          >
                            {user.role || "user"}
                          </span>
                          <button className="text-slate-400 hover:text-white text-sm">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-4">
                    No users found
                  </div>
                )}
              </div>
              
              <div className="bg-slate-600 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">
                  👑 Admin User Creation
                </h4>
                <p className="text-slate-300 text-sm mb-4">
                  Create new admin users who will have full access to the
                  system. Admin users can manage classes, students, attendance,
                  and create other admin accounts.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-500 rounded p-3">
                    <h5 className="text-white font-medium mb-2">
                      🔐 Admin Privileges
                    </h5>
                    <ul className="text-slate-300 space-y-1">
                      <li>• Full system access</li>
                      <li>• Create/edit classes</li>
                      <li>• Manage students</li>
                      <li>• View all attendance</li>
                      <li>• Generate reports</li>
                      <li>• Create other admins</li>
                      <li>• Access admin APIs</li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-500 rounded p-3">
                    <h5 className="text-white font-medium mb-2">
                      ⚠️ Security Notes
                    </h5>
                    <ul className="text-slate-300 space-y-1">
                      <li>• Use strong passwords</li>
                      <li>• Verify email addresses</li>
                      <li>• Only create trusted users</li>
                      <li>• Monitor admin activity</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Create New Class
              </h3>
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Class Name *
                </label>
                <input
                  type="text"
                  value={newClass.className}
                  onChange={(e) =>
                    setNewClass({ ...newClass, className: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Grade 10A"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={newClass.subjectName}
                  onChange={(e) =>
                    setNewClass({ ...newClass, subjectName: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mathematics"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Class Room *
                </label>
                <input
                  type="text"
                  value={newClass.classRoom}
                  onChange={(e) =>
                    setNewClass({ ...newClass, classRoom: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Room 101"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Class Credit
                </label>
                <input
                  type="text"
                  value={newClass.classCredit}
                  onChange={(e) =>
                    setNewClass({ ...newClass, classCredit: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClass}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Create Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Student Modal */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New Student</h3>
              <button
                onClick={() => setShowCreateStudentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={newStudent.studentName}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      studentName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Select Class *
                </label>
                <select
                  value={newStudent.classId}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, classId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {getClassName(cls)} - {getSubjectName(cls)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  School ID
                </label>
                <input
                  type="text"
                  value={newStudent.schoolId}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, schoolId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional school ID"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateStudentModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateStudent}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Create Admin User
              </h3>
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, username: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., admin_user"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., admin@school.com"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 6 characters"
                />
              </div>
              
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={newAdmin.confirmPassword}
                  onChange={(e) =>
                    setNewAdmin({
                      ...newAdmin,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg border border-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter password"
                />
              </div>
              
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateAdminModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdmin}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Detail Modal */}
      {showCommentModal && selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Comment Details</h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Class Name:</p>
                  <p className="text-white font-medium">
                    {selectedComment.className}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Subject:</p>
                  <p className="text-white font-medium">
                    {selectedComment.subjectName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Number of Students:</p>
                  <p className="text-white font-medium">
                    {selectedComment.numberOfStudents}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Date:</p>
                  <p className="text-white font-medium">
                    {new Date(
                      selectedComment.createdAt || selectedComment.date
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* School Information */}
              {selectedComment.schoolId && (
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">
                    🏫 School Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">School Name:</p>
                      <p className="text-white font-medium">
                        {selectedComment.schoolId.name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">School ID:</p>
                      <p className="text-white font-medium">
                        {selectedComment.schoolId._id ||
                          selectedComment.schoolId}
                      </p>
                    </div>
                    {selectedComment.schoolId.createdBy && (
                      <div>
                        <p className="text-gray-400 text-sm">Created By:</p>
                        <p className="text-white font-medium">
                          {selectedComment.schoolId.createdBy}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GPS Location Information */}
              {selectedComment.gpsLocation && (
                <div className="bg-green-800 rounded-lg p-4">
                  <h4 className="text-green-400 font-medium mb-3 flex items-center">
                    <span className="text-xl mr-2">🎯</span>
                    GPS Location (High Accuracy)
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-gray-400 text-sm">📍 Source:</p>
                      <p className="text-white font-medium capitalize">
                        {selectedComment.gpsLocation.source || "GPS"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">📏 Accuracy:</p>
                      <p className="text-white font-medium">
                        {selectedComment.gpsLocation.coordinates?.accuracy
                          ? `±${Math.round(
                              selectedComment.gpsLocation.coordinates.accuracy
                            )}m`
                          : "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">🎯 Coordinates:</p>
                      <p className="text-white font-medium font-mono text-xs">
                        {selectedComment.gpsLocation.coordinates?.latitude?.toFixed(
                          6
                        )}
                        ,{" "}
                        {selectedComment.gpsLocation.coordinates?.longitude?.toFixed(
                          6
                        )}
                      </p>
                    </div>
                    {selectedComment.gpsLocation.coordinates?.altitude && (
                      <div>
                        <p className="text-gray-400 text-sm">⛰️ Altitude:</p>
                        <p className="text-white font-medium">
                          {Math.round(
                            selectedComment.gpsLocation.coordinates.altitude
                          )}
                          m
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Detailed Address Information */}
                  <div className="border-t border-green-600 pt-4 mb-4">
                    <h5 className="text-green-300 font-medium mb-3">
                      🏠 Detailed Address Information
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedComment.gpsLocation.address?.fullAddress && (
                        <div className="mt-4 p-3 bg-green-900 rounded-lg">
                          <p className="text-green-300 font-medium">
                            {selectedComment.gpsLocation.address.fullAddress}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 text-sm">🕐 Captured:</p>
                        <p className="text-white font-medium text-xs">
                          {selectedComment.gpsLocation.timestamp
                            ? new Date(
                                selectedComment.gpsLocation.timestamp
                              ).toLocaleString()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Google Maps Button */}
                  <div className="border-t border-green-600 pt-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => {
                          const url = `https://www.google.com/maps?q=${selectedComment.gpsLocation.coordinates.latitude},${selectedComment.gpsLocation.coordinates.longitude}`;
                          window.open(url, "_blank");
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center space-x-2"
                      >
                        <span>🗺️</span>
                        <span>View GPS Location on Google Maps</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* No Tracking Data */}
              {!selectedComment.tracking && !selectedComment.gpsLocation && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-gray-400 font-medium mb-2">
                    📍 Tracking Information
                  </h4>
                  <p className="text-gray-500 text-sm">
                    No location tracking data available for this comment.
                  </p>
                </div>
              )}
              
              {selectedComment.successStory && (
                <div>
                  <p className="text-gray-400 mb-2">Success Story:</p>
                  <p className="text-white bg-slate-700 p-4 rounded-lg">
                    {selectedComment.successStory}
                  </p>
                </div>
              )}
              
              {selectedComment.challenge && (
                <div>
                  <p className="text-gray-400 mb-2">Challenge:</p>
                  <p className="text-white bg-slate-700 p-4 rounded-lg">
                    {selectedComment.challenge}
                  </p>
                </div>
              )}

              {selectedComment.modelLesson && (
                <div>
                  <p className="text-gray-400 mb-2">Model Lesson:</p>
                  <p className="text-white bg-slate-700 p-4 rounded-lg">
                    {selectedComment.modelLesson}
                  </p>
                </div>
              )}

              {selectedComment.lessonObservation && (
                <div>
                  <p className="text-gray-400 mb-2">Lesson Observation:</p>
                  <p className="text-white bg-slate-700 p-4 rounded-lg">
                    {selectedComment.lessonObservation}
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-600">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Created by:</p>
                  <div className="bg-slate-700 rounded-lg p-3">
                    <p className="text-white font-medium">
                      {selectedComment.teacherId?.username ||
                        selectedComment.teacherId?.email ||
                        getTeacherName(selectedComment.teacherId)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Email: {selectedComment.teacherId?.email || "N/A"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Role: {selectedComment.commenterRole || selectedComment.teacherId?.role || "N/A"}
                    </p>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Created:{" "}
                    {new Date(
                      selectedComment.createdAt || selectedComment.date
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div>
                    <p className="text-gray-400">User ID:</p>
                    <p className="text-white font-mono text-sm">
                      {getTeacherId(selectedComment.teacherId) || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudentsModal && selectedClassForStudents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Students in Class
                </h3>
                <p className="text-slate-400 mt-1">
                  {getClassName(selectedClassForStudents)} -{" "}
                  {getSubjectName(selectedClassForStudents)}
                </p>
              </div>
              <button
                onClick={() => setShowStudentsModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* Class Information */}
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Class Name</p>
                  <p className="text-white font-medium">
                    {getClassName(selectedClassForStudents)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Subject</p>
                  <p className="text-white font-medium">
                    {getSubjectName(selectedClassForStudents)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Room</p>
                  <p className="text-white font-medium">
                    {selectedClassForStudents.classRoom || "N/A"}
                  </p>
                </div>
              </div>
              {selectedClassForStudents.classCredit && (
                <div className="mt-4">
                  <p className="text-slate-400 text-sm">Credits</p>
                  <p className="text-white font-medium">
                    {selectedClassForStudents.classCredit}
                  </p>
                </div>
              )}
            </div>

            {/* Students List */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-white">
                  Students (
                  {
                    students.filter((student) => {
                      const studentClassId =
                        typeof student.classId === "object"
                          ? student.classId._id
                          : student.classId;
                      return studentClassId === selectedClassForStudents._id;
                    }).length
                  }
                  )
                </h4>
                <button
                  onClick={() => {
                    setShowStudentsModal(false);
                    setShowCreateStudentModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <span className="mr-2">+</span>
                  Add Student to Class
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students
                  .filter((student) => {
                    const studentClassId =
                      typeof student.classId === "object"
                        ? student.classId._id
                        : student.classId;
                    return studentClassId === selectedClassForStudents._id;
                  })
                  .map((student) => {
                    const schoolId = getSchoolId(student.schoolId);
                    return (
                      <div
                        key={student._id}
                        className="bg-slate-600 rounded-lg p-4 hover:bg-slate-500 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h5 className="text-white font-medium text-lg">
                              {getStudentName(student)}
                            </h5>
                            <p className="text-slate-300 text-sm">
                              Student ID: {student._id}
                            </p>
                            {schoolId && (
                              <p className="text-slate-400 text-xs mt-1">
                                School ID: {schoolId}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                              Active
                            </span>
                          </div>
                        </div>
                        
                        {/* Student Details */}
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">
                              Class:
                            </span>
                            <span className="text-white text-sm">
                              {getClassNameFromId(student.classId)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">
                              Enrolled:
                            </span>
                            <span className="text-white text-sm">
                              {new Date(
                                student.createdAt || student.date || Date.now()
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => {
                              // You can add functionality to view student details
                              console.log("View student details:", student);
                            }}
                            className="flex-1 bg-slate-500 hover:bg-slate-400 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => {
                              // You can add functionality to edit student
                              console.log("Edit student:", student);
                            }}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* No Students Message */}
              {students.filter((student) => {
                const studentClassId =
                  typeof student.classId === "object"
                    ? student.classId._id
                    : student.classId;
                return studentClassId === selectedClassForStudents._id;
              }).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-slate-400 text-6xl mb-4">👥</div>
                  <h4 className="text-xl font-medium text-white mb-2">
                    No Students Found
                  </h4>
                  <p className="text-slate-400 mb-6">
                    This class doesn't have any students yet.
                  </p>
                  <button
                    onClick={() => {
                      setShowStudentsModal(false);
                      setShowCreateStudentModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    Add First Student
                  </button>
                </div>
              )}
            </div>
            
            {/* Class Statistics */}
            <div className="bg-slate-700 rounded-lg p-6 mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Class Statistics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {
                      students.filter((student) => {
                        const studentClassId =
                          typeof student.classId === "object"
                            ? student.classId._id
                            : student.classId;
                        return studentClassId === selectedClassForStudents._id;
                      }).length
                    }
                  </div>
                  <div className="text-slate-400 text-sm">Total Students</div>
                </div>
                
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {
                      comments.filter(
                        (comment) =>
                          comment.className ===
                          getClassName(selectedClassForStudents)
                      ).length
                    }
                  </div>
                  <div className="text-slate-400 text-sm">Comments</div>
                </div>
                
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {
                      attendanceRecords.filter((record) => {
                        const recordClassId =
                          typeof record.classId === "object"
                            ? record.classId._id
                            : record.classId;
                        return recordClassId === selectedClassForStudents._id;
                      }).length
                    }
                  </div>
                  <div className="text-slate-400 text-sm">
                    Attendance Records
                  </div>
                </div>
                
                <div className="bg-slate-600 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">
                    {
                      attendanceRecords.filter((record) => {
                        const recordClassId =
                          typeof record.classId === "object"
                            ? record.classId._id
                            : record.classId;
                        return (
                          recordClassId === selectedClassForStudents._id &&
                          record.status === "present"
                        );
                      }).length
                    }
                  </div>
                  <div className="text-slate-400 text-sm">Present Days</div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-600">
              <button
                onClick={() => setShowStudentsModal(false)}
                className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowStudentsModal(false);
                  setShowCreateStudentModal(true);
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add New Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Detail Modal */}
      {showAttendanceModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Attendance Details
              </h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">Student ID:</p>
                <p className="text-white font-medium">
                  {selectedAttendance.studentId}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Class ID:</p>
                <p className="text-white font-medium">
                  {selectedAttendance.classId}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Status:</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAttendance.status === "present"
                      ? "bg-green-600 text-white"
                      : selectedAttendance.status === "absent"
                      ? "bg-red-600 text-white"
                      : selectedAttendance.status === "late"
                      ? "bg-yellow-600 text-white"
                      : "bg-gray-600 text-white"
                  }`}
                >
                  {selectedAttendance.status}
                </span>
              </div>
              <div>
                <p className="text-gray-400">Date:</p>
                <p className="text-white font-medium">
                  {new Date(selectedAttendance.date).toLocaleDateString()}
                </p>
              </div>
              {selectedAttendance.remarks && (
                <div>
                  <p className="text-gray-400">Remarks:</p>
                  <p className="text-white bg-slate-700 p-3 rounded-lg">
                    {selectedAttendance.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;
