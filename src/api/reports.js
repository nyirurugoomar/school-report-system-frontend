import api from './axios'

export const getAttendanceReport = async (filters = {}) => {
  try {
    // Filter out empty strings and null values to prevent MongoDB ObjectId casting errors
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    console.log('Making attendance report request to:', `${api.defaults.baseURL}/reports/attendance`);
    console.log('Original filters:', filters);
    console.log('Clean filters:', cleanFilters);
    const response = await api.get('/reports/attendance', {
      params: cleanFilters
    });
    console.log('Attendance report response:', response);
    return response.data;
  } catch (error) {
    console.error('Attendance report API error:', error);
    throw error;
  }
};

export const getClassPerformanceReport = async (classId) => {
  try {
    console.log('Making class performance report request to:', `${api.defaults.baseURL}/reports/class-performance/${classId}`);
    const response = await api.get(`/reports/class-performance/${classId}`);
    console.log('Class performance report response:', response);
    return response.data;
  } catch (error) {
    console.error('Class performance report API error:', error);
    throw error;
  }
};

export const getStudentReport = async (studentId) => {
  try {
    console.log('Making student report request to:', `${api.defaults.baseURL}/reports/student/${studentId}`);
    const response = await api.get(`/reports/student/${studentId}`);
    console.log('Student report response:', response);
    return response.data;
  } catch (error) {
    console.error('Student report API error:', error);
    throw error;
  }
};

// Export functions for generating downloadable reports
export const exportAttendanceReport = async (filters = {}) => {
  try {
    // Filter out empty strings and null values to prevent MongoDB ObjectId casting errors
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    console.log('Exporting attendance report with filters:', filters);
    console.log('Clean filters:', cleanFilters);
    const response = await api.get('/reports/attendance', {
      params: { ...cleanFilters, export: true },
      responseType: 'blob' // For file downloads
    });
    return response.data;
  } catch (error) {
    console.error('Export attendance report error:', error);
    throw error;
  }
};

export const exportClassReport = async (classId) => {
  try {
    console.log('Exporting class report for class:', classId);
    const response = await api.get(`/reports/class-performance/${classId}`, {
      params: { export: true },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Export class report error:', error);
    throw error;
  }
};

// New Reports API functions based on your backend
export const getSchoolReport = async () => {
  try {
    console.log('Making school report request to:', `${api.defaults.baseURL}/reports/schools`);
    const response = await api.get('/reports/schools');
    console.log('School report response:', response);
    return response.data;
  } catch (error) {
    console.error('School report API error:', error);
    throw error;
  }
};

export const getMarksReport = async (schoolId) => {
  try {
    console.log('Making marks report request to:', `${api.defaults.baseURL}/reports/marks/${schoolId}`);
    const response = await api.get(`/reports/marks/${schoolId}`);
    console.log('Marks report response:', response);
    return response.data;
  } catch (error) {
    console.error('Marks report API error:', error);
    throw error;
  }
};

export const getAttendanceReportNew = async (schoolId) => {
  try {
    console.log('Making attendance report request to:', `${api.defaults.baseURL}/reports/attendance/${schoolId}`);
    const response = await api.get(`/reports/attendance/${schoolId}`);
    console.log('Attendance report response:', response);
    return response.data;
  } catch (error) {
    console.error('Attendance report API error:', error);
    throw error;
  }
};

export const getClassPerformanceReportNew = async (classId) => {
  try {
    console.log('Making class performance report request to:', `${api.defaults.baseURL}/reports/class/${classId}`);
    const response = await api.get(`/reports/class/${classId}`);
    console.log('Class performance report response:', response);
    return response.data;
  } catch (error) {
    console.error('Class performance report API error:', error);
    throw error;
  }
};

export const downloadSchoolReportPDF = async (schoolId) => {
  try {
    console.log('Downloading school report PDF for:', schoolId);
    
    // First get the report data
    const reportData = await getSchoolReport();
    console.log('Report data received:', reportData);
    
    // Handle the new data structure with multiple schools
    const schools = reportData?.schools || [];
    const summary = reportData?.summary || {};
    
    // Use the first school's data for the PDF, or summary data if no schools
    const primarySchool = schools.length > 0 ? schools[0] : null;
    
    // Add fallback values to prevent undefined errors
    const safeReportData = {
      school: primarySchool?.schoolName || summary?.schoolName || 'School Management System',
      totalClasses: summary?.totalClasses || 0,
      totalStudents: summary?.totalStudents || 0,
      totalSchools: reportData?.totalSchools || 0,
      attendanceSummary: {
        present: summary?.attendanceSummary?.present || 0,
        absent: summary?.attendanceSummary?.absent || 0,
        late: summary?.attendanceSummary?.late || 0,
        attendanceRate: summary?.attendanceSummary?.attendanceRate || 0
      },
      marksSummary: {
        average: summary?.marksSummary?.average || 0,
        highest: summary?.marksSummary?.highest || 0,
        lowest: summary?.marksSummary?.lowest || 0
      },
      summary: summary,
      schools: schools,
      generatedAt: reportData?.generatedAt || new Date().toISOString(),
      generatedBy: reportData?.generatedBy || 'School Management System'
    };
    
    console.log('Safe report data:', safeReportData);
    
    // Create a well-designed HTML report
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>School Report - ${safeReportData.school}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          
          .header p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .section {
            margin-bottom: 40px;
          }
          
          .section h2 {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          
          .stat-card h3 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .stat-card p {
            font-size: 1.1em;
            opacity: 0.9;
          }
          
          .attendance-summary, .marks-summary {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #667eea;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-weight: 600;
            color: #495057;
          }
          
          .summary-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #667eea;
          }
          
          .footer {
            background: #343a40;
            color: white;
            padding: 20px 30px;
            text-align: center;
          }
          
          .footer p {
            opacity: 0.8;
          }
          
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 School Management Report</h1>
            <p>${safeReportData.generatedBy}</p>
            <p>Generated on ${new Date(safeReportData.generatedAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>📈 System Overview</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <h3>${safeReportData.totalSchools}</h3>
                  <p>Total Schools</p>
                </div>
                <div class="stat-card">
                  <h3>${safeReportData.totalClasses}</h3>
                  <p>Total Classes</p>
                </div>
                <div class="stat-card">
                  <h3>${safeReportData.totalStudents}</h3>
                  <p>Total Students</p>
                </div>
                <div class="stat-card">
                  <h3>${safeReportData.attendanceSummary.attendanceRate}%</h3>
                  <p>Overall Attendance Rate</p>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📊 System Summary</h2>
              <div class="summary-section" style="background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 5px solid #667eea;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                  <div>
                    <h4 style="color: #667eea; margin-bottom: 10px;">📚 Academic Data</h4>
                    <div style="color: #495057;">
                      <div><strong>Total Classes:</strong> ${safeReportData.totalClasses}</div>
                      <div><strong>Total Students:</strong> ${safeReportData.totalStudents}</div>
                      <div><strong>Total Attendance Records:</strong> ${safeReportData.summary?.totalAttendanceRecords || 0}</div>
                      <div><strong>Total Marks:</strong> ${safeReportData.summary?.totalMarks || 0}</div>
                    </div>
                  </div>
                  <div>
                    <h4 style="color: #667eea; margin-bottom: 10px;">📈 Averages</h4>
                    <div style="color: #495057;">
                      <div><strong>Students per School:</strong> ${safeReportData.summary?.averageStudentsPerSchool || 0}</div>
                      <div><strong>Classes per School:</strong> ${safeReportData.summary?.averageClassesPerSchool || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📋 Attendance Summary</h2>
              <div class="attendance-summary">
                <div class="summary-item">
                  <span class="summary-label">Present Students</span>
                  <span class="summary-value">${safeReportData.attendanceSummary.present}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Absent Students</span>
                  <span class="summary-value">${safeReportData.attendanceSummary.absent}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Late Students</span>
                  <span class="summary-value">${safeReportData.attendanceSummary.late}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>🎓 Academic Performance</h2>
              <div class="marks-summary">
                <div class="summary-item">
                  <span class="summary-label">Average Score</span>
                  <span class="summary-value">${safeReportData.marksSummary.average}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Highest Score</span>
                  <span class="summary-value">${safeReportData.marksSummary.highest}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Lowest Score</span>
                  <span class="summary-value">${safeReportData.marksSummary.lowest}%</span>
                </div>
              </div>
            </div>
            
            ${safeReportData.schools && safeReportData.schools.length > 0 ? `
            <div class="section">
              <h2>🏫 Individual School Details</h2>
              ${safeReportData.schools.map((school, index) => `
                <div class="school-detail" style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin-bottom: 25px; border-left: 5px solid #667eea; page-break-inside: avoid;">
                  <h3 style="color: #667eea; margin-bottom: 20px; font-size: 1.4em;">${school.schoolName}</h3>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div>
                      <h4 style="color: #667eea; margin-bottom: 10px; font-size: 1.1em;">📚 Basic Information</h4>
                      <div style="color: #495057; line-height: 1.6;">
                        <div><strong>School ID:</strong> ${school.schoolId}</div>
                        <div><strong>School Name:</strong> ${school.schoolDetails?.name || school.schoolName}</div>
                        <div><strong>Total Classes:</strong> ${school.statistics.totalClasses}</div>
                        <div><strong>Total Students:</strong> ${school.statistics.totalStudents}</div>
                        <div><strong>Total Subjects:</strong> ${school.statistics.totalSubjects}</div>
                      </div>
                    </div>
                    <div>
                      <h4 style="color: #667eea; margin-bottom: 10px; font-size: 1.1em;">📊 Records & Data</h4>
                      <div style="color: #495057; line-height: 1.6;">
                        <div><strong>Attendance Records:</strong> ${school.statistics.totalAttendanceRecords}</div>
                        <div><strong>Total Marks:</strong> ${school.statistics.totalMarks}</div>
                        <div><strong>Attendance Rate:</strong> ${school.statistics.attendanceSummary.attendanceRate}%</div>
                      </div>
                    </div>
                    <div>
                      <h4 style="color: #667eea; margin-bottom: 10px; font-size: 1.1em;">📋 Attendance Details</h4>
                      <div style="color: #495057; line-height: 1.6;">
                        <div><strong>Present:</strong> ${school.statistics.attendanceSummary.present}</div>
                        <div><strong>Absent:</strong> ${school.statistics.attendanceSummary.absent}</div>
                        <div><strong>Late:</strong> ${school.statistics.attendanceSummary.late}</div>
                      </div>
                    </div>
                    <div>
                      <h4 style="color: #667eea; margin-bottom: 10px; font-size: 1.1em;">🎓 Academic Performance</h4>
                      <div style="color: #495057; line-height: 1.6;">
                        <div><strong>Average Score:</strong> ${school.statistics.marksSummary.average}%</div>
                        <div><strong>Highest Score:</strong> ${school.statistics.marksSummary.highest}%</div>
                        <div><strong>Lowest Score:</strong> ${school.statistics.marksSummary.lowest}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} School Report System - Generated by Admin</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    console.log('PDF generation initiated successfully');
    return true;
  } catch (error) {
    console.error('Download school report PDF error:', error);
    throw error;
  }
};

// Additional PDF download functions for other reports
export const downloadMarksReportPDF = async (schoolId) => {
  try {
    console.log('Downloading marks report PDF for:', schoolId);
    
    // Get the marks report data
    const reportData = await getMarksReport(schoolId);
    console.log('Marks report data received:', reportData);
    
    // Create a well-designed HTML report for marks
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Marks Report - School ${schoolId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .section h2 {
            color: #4facfe;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #4facfe;
            padding-bottom: 10px;
          }
          
          .marks-summary {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #4facfe;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-weight: 600;
            color: #495057;
          }
          
          .summary-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #4facfe;
          }
          
          .footer {
            background: #343a40;
            color: white;
            padding: 20px 30px;
            text-align: center;
          }
          
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Marks Report</h1>
            <p>Academic Performance Analysis</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>📊 Academic Performance Summary</h2>
              <div class="marks-summary">
                <div class="summary-item">
                  <span class="summary-label">Average Score</span>
                  <span class="summary-value">${reportData.marksSummary.average}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Highest Score</span>
                  <span class="summary-value">${reportData.marksSummary.highest}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Lowest Score</span>
                  <span class="summary-value">${reportData.marksSummary.lowest}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} School Report System - Marks Analysis</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    console.log('Marks PDF generation initiated successfully');
    return true;
  } catch (error) {
    console.error('Download marks report PDF error:', error);
    throw error;
  }
};

export const downloadAttendanceReportPDF = async (schoolId) => {
  try {
    console.log('Downloading attendance report PDF for:', schoolId);
    
    // Get the attendance report data
    const reportData = await getAttendanceReportNew(schoolId);
    console.log('Attendance report data received:', reportData);
    
    // Create a well-designed HTML report for attendance
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Attendance Report - School ${schoolId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .section h2 {
            color: #fa709a;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #fa709a;
            padding-bottom: 10px;
          }
          
          .attendance-summary {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #fa709a;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-weight: 600;
            color: #495057;
          }
          
          .summary-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #fa709a;
          }
          
          .footer {
            background: #343a40;
            color: white;
            padding: 20px 30px;
            text-align: center;
          }
          
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Attendance Report</h1>
            <p>Student Attendance Analysis</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>📈 Attendance Summary</h2>
              <div class="attendance-summary">
                <div class="summary-item">
                  <span class="summary-label">Present Students</span>
                  <span class="summary-value">${reportData.attendanceSummary.present}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Absent Students</span>
                  <span class="summary-value">${reportData.attendanceSummary.absent}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Late Students</span>
                  <span class="summary-value">${reportData.attendanceSummary.late}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} School Report System - Attendance Analysis</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    console.log('Attendance PDF generation initiated successfully');
    return true;
  } catch (error) {
    console.error('Download attendance report PDF error:', error);
    throw error;
  }
};

export const downloadClassReportPDF = async (classId) => {
  try {
    console.log('Downloading class report PDF for:', classId);
    
    // Get the class performance report data
    const reportData = await getClassPerformanceReportNew(classId);
    console.log('Class report data received:', reportData);
    
    // Create a well-designed HTML report for class performance
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Class Report - ${reportData.class}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            color: #333;
            padding: 40px 30px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
          }
          
          .content {
            padding: 40px 30px;
          }
          
          .section h2 {
            color: #a8edea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #a8edea;
            padding-bottom: 10px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            color: #333;
            padding: 25px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          
          .stat-card h3 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
          }
          
          .summary-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #a8edea;
            margin-bottom: 20px;
          }
          
          .summary-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid #e9ecef;
          }
          
          .summary-item:last-child {
            border-bottom: none;
          }
          
          .summary-label {
            font-weight: 600;
            color: #495057;
          }
          
          .summary-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #a8edea;
          }
          
          .footer {
            background: #343a40;
            color: white;
            padding: 20px 30px;
            text-align: center;
          }
          
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Class Performance Report</h1>
            <p>${reportData.class}</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h2>📊 Class Overview</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <h3>${reportData.totalStudents}</h3>
                  <p>Total Students</p>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>📋 Attendance Summary</h2>
              <div class="summary-section">
                <div class="summary-item">
                  <span class="summary-label">Present Students</span>
                  <span class="summary-value">${reportData.attendanceSummary.present}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Absent Students</span>
                  <span class="summary-value">${reportData.attendanceSummary.absent}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Late Students</span>
                  <span class="summary-value">${reportData.attendanceSummary.late}</span>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h2>🎓 Academic Performance</h2>
              <div class="summary-section">
                <div class="summary-item">
                  <span class="summary-label">Average Score</span>
                  <span class="summary-value">${reportData.marksSummary.average}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Highest Score</span>
                  <span class="summary-value">${reportData.marksSummary.highest}%</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Lowest Score</span>
                  <span class="summary-value">${reportData.marksSummary.lowest}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} School Report System - Class Performance Analysis</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
    
    console.log('Class PDF generation initiated successfully');
    return true;
  } catch (error) {
    console.error('Download class report PDF error:', error);
    throw error;
  }
};