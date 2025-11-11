import api from './axios'

const triggerPrintFromHtml = (htmlContent) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation is only supported in the browser environment.')
  }

  const printWindow = window.open('', '_blank')

  if (printWindow && printWindow.document) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 300)
    }
    return
  }

  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.srcdoc = htmlContent

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    }, 1000)
  }

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } finally {
      cleanup()
    }
  }

  document.body.appendChild(iframe)
}

const sanitizeText = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
    console.log('Downloading school report PDF for:', schoolId || 'all-schools');
    
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
    
    triggerPrintFromHtml(htmlContent);

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
    
    triggerPrintFromHtml(htmlContent);

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
    
    triggerPrintFromHtml(htmlContent);

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
    
    triggerPrintFromHtml(htmlContent);

    console.log('Class PDF generation initiated successfully');
    return true;
  } catch (error) {
    console.error('Download class report PDF error:', error);
    throw error;
  }
};

export const downloadCommentsReportPDF = async () => {
  try {
    console.log('Downloading comments report PDF')

    const response = await api.get('/comments/admin/all')
    const payload = response?.data ?? []
    const commentsArray = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.comments)
          ? payload.comments
          : []

    const comments = commentsArray.filter(Boolean)
    console.log('Comments report data received:', { count: comments.length })

    const totalComments = comments.length
    const uniqueSchools = new Set()
    const uniqueClasses = new Set()
    const uniqueTeachers = new Set()
    const classCounts = new Map()
    const subjectCounts = new Map()
    const monthlyCounts = new Map()

    comments.forEach((comment) => {
      const schoolId = typeof comment.schoolId === 'object' ? comment.schoolId?._id : comment.schoolId
      if (schoolId) uniqueSchools.add(schoolId)

      if (comment.className) {
        uniqueClasses.add(comment.className)
        classCounts.set(comment.className, (classCounts.get(comment.className) || 0) + 1)
      }

      if (comment.subjectName) {
        subjectCounts.set(comment.subjectName, (subjectCounts.get(comment.subjectName) || 0) + 1)
      }

      if (comment.teacherId) {
        const teacherKey = typeof comment.teacherId === 'object'
          ? comment.teacherId.username || comment.teacherId.email || comment.teacherId._id
          : comment.teacherId
        if (teacherKey) uniqueTeachers.add(teacherKey)
      }

      if (comment.createdAt || comment.date) {
        const date = new Date(comment.createdAt || comment.date)
        if (!Number.isNaN(date.valueOf())) {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          monthlyCounts.set(key, (monthlyCounts.get(key) || 0) + 1)
        }
      }
    })

    const toSortedArray = (map) =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

    const topClasses = toSortedArray(classCounts).slice(0, 7)
    const topSubjects = toSortedArray(subjectCounts).slice(0, 7)
    const trendData = toSortedArray(monthlyCounts).reverse()
    const maxClassCount = topClasses[0]?.count || 1
    const maxSubjectCount = topSubjects[0]?.count || 1
    const maxTrendCount = trendData[trendData.length - 1]?.count || 1

    const recentComments = comments
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 20)

    const formatDateTime = (value) => {
      const date = new Date(value)
      if (Number.isNaN(date.valueOf())) return 'N/A'
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Comment Insights Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f3f4f6;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
            color: white;
            padding: 40px 32px;
            text-align: center;
          }
          .header h1 {
            font-size: 2.5em;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 1.1em;
            opacity: 0.9;
          }
          .content {
            padding: 36px 32px 48px;
          }
          .section {
            margin-bottom: 36px;
          }
          .section h2 {
            font-size: 1.75em;
            color: #1d4ed8;
            margin-bottom: 20px;
            border-bottom: 3px solid #bfdbfe;
            padding-bottom: 8px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
          }
          .stat-card {
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            border-radius: 16px;
            padding: 24px 20px;
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.2);
          }
          .stat-card h3 {
            font-size: 2.4em;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .stat-card p {
            font-size: 1.05em;
            opacity: 0.85;
          }
          .chart-card {
            background: #f8fafc;
            border-radius: 16px;
            padding: 24px 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 3px 12px rgba(15, 23, 42, 0.05);
          }
          .chart-title {
            font-size: 1.2em;
            font-weight: 600;
            color: #334155;
            margin-bottom: 16px;
          }
          .bar {
            margin-bottom: 16px;
          }
          .bar-label {
            display: flex;
            justify-content: space-between;
            font-weight: 600;
            color: #475569;
            margin-bottom: 6px;
            font-size: 0.95em;
          }
          .bar-track {
            width: 100%;
            height: 18px;
            background: #e2e8f0;
            border-radius: 999px;
            overflow: hidden;
          }
          .bar-fill {
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #60a5fa 0%, #c084fc 100%);
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 8px;
            font-size: 0.75em;
            color: #0f172a;
            font-weight: 700;
          }
          .table-wrapper {
            overflow-x: auto;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            min-width: 720px;
          }
          thead {
            background: #1d4ed8;
            color: white;
          }
          th, td {
            padding: 14px 16px;
            text-align: left;
          }
          tbody tr:nth-child(even) {
            background: #f8fafc;
          }
          tbody tr:nth-child(odd) {
            background: #ffffff;
          }
          tbody tr:hover {
            background: #e0f2fe;
          }
          .tag {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            background: #dbeafe;
            color: #1d4ed8;
            font-weight: 600;
            font-size: 0.8em;
          }
          .footer {
            background: #0f172a;
            color: #e2e8f0;
            text-align: center;
            padding: 20px 24px;
          }
          .footer p {
            opacity: 0.8;
            font-size: 0.9em;
          }
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
            .stat-card, .chart-card, .table-wrapper { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 Comment Insights Report</h1>
            <p>Comprehensive analysis of classroom feedback</p>
            <p>Generated on ${sanitizeText(new Date().toLocaleString())}</p>
          </div>
          <div class="content">
            <div class="section">
              <h2>Overview</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <h3>${totalComments}</h3>
                  <p>Total Comments Collected</p>
                </div>
                <div class="stat-card">
                  <h3>${uniqueSchools.size}</h3>
                  <p>Schools Reporting</p>
                </div>
                <div class="stat-card">
                  <h3>${uniqueClasses.size}</h3>
                  <p>Classes Covered</p>
                </div>
                <div class="stat-card">
                  <h3>${uniqueTeachers.size}</h3>
                  <p>Reporting Teachers</p>
                </div>
              </div>
            </div>
            <div class="section">
              <h2>Engagement Highlights</h2>
              <div class="stats-grid">
                <div class="chart-card">
                  <div class="chart-title">Top Classes by Comment Volume</div>
                  ${topClasses.map(({ name, count }) => {
                    const percentage = Math.max(6, Math.round((count / maxClassCount) * 100))
                    return `
                      <div class="bar">
                        <div class="bar-label">
                          <span>${sanitizeText(name)}</span>
                          <span>${count}</span>
                        </div>
                        <div class="bar-track">
                          <div class="bar-fill" style="width: ${percentage}%;">
                            ${count} comments
                          </div>
                        </div>
                      </div>
                    `
                  }).join('') || '<p>No class data available.</p>'}
                </div>
                <div class="chart-card">
                  <div class="chart-title">Top Subjects Discussed</div>
                  ${topSubjects.map(({ name, count }) => {
                    const percentage = Math.max(6, Math.round((count / maxSubjectCount) * 100))
                    return `
                      <div class="bar">
                        <div class="bar-label">
                          <span>${sanitizeText(name)}</span>
                          <span>${count}</span>
                        </div>
                        <div class="bar-track">
                          <div class="bar-fill" style="width: ${percentage}%; background: linear-gradient(90deg, #f59e0b 0%, #f97316 100%); color: #78350f;">
                            ${count} comments
                          </div>
                        </div>
                      </div>
                    `
                  }).join('') || '<p>No subject data available.</p>'}
                </div>
              </div>
            </div>
            <div class="section">
              <h2>Trend Overview</h2>
              <div class="chart-card">
                <div class="chart-title">Monthly Comment Submissions</div>
                ${trendData.length ? trendData.map(({ name, count }) => {
                  const percentage = Math.max(6, Math.round((count / maxTrendCount) * 100))
                  const [year, month] = name.split('-')
                  const formatted = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  return `
                    <div class="bar">
                      <div class="bar-label">
                        <span>${formatted}</span>
                        <span>${count}</span>
                      </div>
                      <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%; background: linear-gradient(90deg, #22d3ee 0%, #0ea5e9 100%); color: #0f172a;">
                          ${count}
                        </div>
                      </div>
                    </div>
                  `
                }).join('') : '<p>No timeline data available.</p>'}
              </div>
            </div>
            <div class="section">
              <h2>Recent Comments Snapshot</h2>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Teacher</th>
                      <th>Students</th>
                      <th>Submitted</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recentComments.length ? recentComments.map((comment) => {
                      const teacherName = typeof comment.teacherId === 'object'
                        ? (comment.teacherId.username || comment.teacherId.email || comment.teacherId._id || 'Unknown Teacher')
                        : (comment.teacherId || 'Unknown Teacher')
                      const summary = comment.successStory || comment.challenge || comment.generalComment || 'No details provided.'
                      return `
                        <tr>
                          <td>${sanitizeText(comment.className || 'N/A')}</td>
                          <td><span class="tag">${sanitizeText(comment.subjectName || 'N/A')}</span></td>
                          <td>${sanitizeText(teacherName)}</td>
                          <td>${sanitizeText(comment.numberOfStudents ?? 'n/a')}</td>
                          <td>${sanitizeText(formatDateTime(comment.createdAt || comment.date))}</td>
                          <td>${sanitizeText(summary).slice(0, 140)}${summary.length > 140 ? '…' : ''}</td>
                        </tr>
                      `
                    }).join('') : `
                      <tr>
                        <td colspan="6" style="text-align:center; padding: 24px;">No comments available.</td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} School Report System • Comment Insights Report</p>
          </div>
        </div>
      </body>
      </html>
    `

    triggerPrintFromHtml(htmlContent)
    console.log('Comments PDF generation initiated successfully')
    return true
  } catch (error) {
    console.error('Download comments report PDF error:', error)
    throw error
  }
}