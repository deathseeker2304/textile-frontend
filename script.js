"use strict";

// Main application module
const TextileApp = {
    API_BASE_URL: 'https://textile-backend-lxda.onrender.com', // <<< ADD THIS LINE (Temporarily for local testing)

    // Utility function for date formatting
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Utility function to validate Google Drive PDF URL
    validateGoogleDriveUrl(url) {
        const regex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(view|edit|preview)/;
        return regex.test(url);
    },

    // Utility function to validate YouTube URL
    validateYouTubeUrl(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        return regex.test(url);
    },

    // Utility function to validate URL (for notes)
    validateUrl(url) {
        const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        return regex.test(url);
    },

   

    // Notification helper
    showNotification(message) {
        let alertDiv = document.getElementById('alert-notification');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.id = 'alert-notification';
            alertDiv.className = 'alert-notification';
            document.body.appendChild(alertDiv);
        }
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 4000);
    },

    // PDF Viewer Functionality (Using Google Drive)
    async initPDFViewer() {
        const semesterSelect = document.getElementById('semester');
        const classSelect = document.getElementById('class');
        const newClassInput = document.getElementById('new-class');
        const addClassButton = document.getElementById('add-class');
        const teacherSelect = document.getElementById('teacher');
        const newTeacherInput = document.getElementById('new-teacher');
        const addTeacherButton = document.getElementById('add-teacher');
        const chapterSelect = document.getElementById('chapter');
        const newChapterInput = document.getElementById('new-chapter');
        const addChapterButton = document.getElementById('add-chapter');
        const pdfUrlInput = document.getElementById('pdf-url');
        const uploadPdfButton = document.getElementById('upload-pdf');
        const pdfList = document.getElementById('pdf-list');
        const pdfViewer = document.getElementById('pdf-viewer');
        const pdfViewerContainer = document.getElementById('pdf-viewer-container');

        if (!semesterSelect || !classSelect || !newClassInput || !addClassButton || !teacherSelect || 
            !newTeacherInput || !addTeacherButton || !chapterSelect || !newChapterInput || !addChapterButton || 
            !pdfUrlInput || !uploadPdfButton || !pdfList || !pdfViewer || !pdfViewerContainer) {
            return; // Skip if elements not found (not on this page)
        }

        // Load shared data
        let pdfStructure = await this.fetchSharedData();
        pdfStructure = pdfStructure.pdfs || {};

        // Helper function to update class dropdown
        const updateClassDropdown = () => {
            const semester = semesterSelect.value;
            classSelect.innerHTML = '<option value="">Select Class</option>';
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            pdfList.innerHTML = '';
            pdfViewer.style.display = 'none';
            if (semester && pdfStructure[semester] && pdfStructure[semester].classes) {
                Object.keys(pdfStructure[semester].classes).forEach(className => {
                    const option = document.createElement('option');
                    option.value = className;
                    option.textContent = className;
                    classSelect.appendChild(option);
                });
            }
        };

        // Helper function to update teacher dropdown
        const updateTeacherDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            pdfList.innerHTML = '';
            pdfViewer.style.display = 'none';
            if (semester && selectedClass && pdfStructure[semester] && pdfStructure[semester].classes[selectedClass]) {
                Object.keys(pdfStructure[semester].classes[selectedClass].teachers).forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher;
                    option.textContent = teacher;
                    teacherSelect.appendChild(option);
                });
            }
        };

        // Helper function to update chapter dropdown and PDF list
        const updateChapterDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            pdfList.innerHTML = '';
            pdfViewer.style.display = 'none';
            if (semester && selectedClass && selectedTeacher && 
                pdfStructure[semester] && pdfStructure[semester].classes[selectedClass] && 
                pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher]) {
                Object.keys(pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters).forEach(chapter => {
                    const option = document.createElement('option');
                    option.value = chapter;
                    option.textContent = chapter;
                    chapterSelect.appendChild(option);
                });
            }
        };

        // Helper function to display PDFs for the selected chapter
        const displayPdfs = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            pdfList.innerHTML = '';
            pdfViewer.style.display = 'none';
            if (
                semester &&
                selectedClass &&
                selectedTeacher &&
                selectedChapter &&
                pdfStructure[semester] &&
                pdfStructure[semester].classes[selectedClass] &&
                pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher] &&
                pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter]
            ) {
                const pdfs = pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].pdfs || [];

                // Create a table to display PDFs
                const table = document.createElement('table');
                table.className = 'pdf-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>PDF Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                const tbody = table.querySelector('tbody');

                pdfs.forEach(pdf => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="pdf-name">
                            <i class="fas fa-file-pdf"></i>
                            <span>${pdf.fileName}</span>
                        </td>
                        <td>
                            <button class="rename-pdf" data-id="${pdf.id}">Rename</button>
                            <button class="delete-pdf" data-id="${pdf.id}">Delete</button>
                        </td>
                    `;

                    // Click on PDF name to view
                    row.querySelector('.pdf-name').addEventListener('click', () => {
                        pdfViewer.src = pdf.url;
                        pdfViewer.style.display = 'block';
                        pdfViewerContainer.scrollIntoView({ behavior: 'smooth' });
                    });

                    // Rename PDF
                    row.querySelector('.rename-pdf').addEventListener('click', async () => {
                        const newName = prompt('Enter new PDF name:', pdf.fileName);
                        if (newName && newName.trim()) {
                            pdf.fileName = newName.trim();
                            const sharedData = await TextileApp.fetchSharedData();
                            sharedData.pdfs = pdfStructure;
                            await TextileApp.updateSharedData(sharedData);
                            displayPdfs();
                        }
                    });

                    // Delete PDF
                    row.querySelector('.delete-pdf').addEventListener('click', async () => {
                        const updatedPdfs = pdfs.filter(p => p.id !== pdf.id);
                        pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].pdfs = updatedPdfs;
                        const sharedData = await TextileApp.fetchSharedData();
                        sharedData.pdfs = pdfStructure;
                        await TextileApp.updateSharedData(sharedData);
                        displayPdfs();
                    });

                    tbody.appendChild(row);
                });

                pdfList.appendChild(table);
            }
        };

        // Semester change handler
        semesterSelect.addEventListener('change', () => {
            updateClassDropdown();
        });

        // Class change handler
        classSelect.addEventListener('change', () => {
            updateTeacherDropdown();
        });

        // Teacher change handler
        teacherSelect.addEventListener('change', () => {
            updateChapterDropdown();
        });

        // Chapter change handler
        chapterSelect.addEventListener('change', () => {
            displayPdfs();
        });

        // Add new class
        addClassButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const newClass = newClassInput.value.trim();
            if (!semester) {
                alert('Please select a semester first.');
                return;
            }
            if (!newClass) {
                alert('Please enter a class name.');
                return;
            }
            if (!pdfStructure[semester]) {
                pdfStructure[semester] = { classes: {} };
            }
            if (!pdfStructure[semester].classes[newClass]) {
                pdfStructure[semester].classes[newClass] = { teachers: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.pdfs = pdfStructure;
                await this.updateSharedData(sharedData);
                updateClassDropdown();
                newClassInput.value = '';
            } else {
                alert('Class already exists.');
            }
        });

        // Add new teacher
        addTeacherButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const newTeacher = newTeacherInput.value.trim();
            if (!semester || !selectedClass) {
                alert('Please select a semester and class first.');
                return;
            }
            if (!newTeacher) {
                alert('Please enter a teacher name.');
                return;
            }
            if (!pdfStructure[semester].classes[selectedClass].teachers[newTeacher]) {
                pdfStructure[semester].classes[selectedClass].teachers[newTeacher] = { chapters: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.pdfs = pdfStructure;
                await this.updateSharedData(sharedData);
                updateTeacherDropdown();
                newTeacherInput.value = '';
            } else {
                alert('Teacher already exists.');
            }
        });

        // Add new chapter
        addChapterButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const newChapter = newChapterInput.value.trim();
            if (!semester || !selectedClass || !selectedTeacher) {
                alert('Please select a semester, class, and teacher first.');
                return;
            }
            if (!newChapter) {
                alert('Please enter a chapter name.');
                return;
            }
            if (!pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[newChapter]) {
                pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[newChapter] = { pdfs: [] };
                const sharedData = await this.fetchSharedData();
                sharedData.pdfs = pdfStructure;
                await this.updateSharedData(sharedData);
                updateChapterDropdown();
                newChapterInput.value = '';
            } else {
                alert('Chapter already exists.');
            }
        });

        // Upload PDF
        uploadPdfButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const pdfUrl = pdfUrlInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) {
                alert('Please select a semester, class, teacher, and chapter first.');
                return;
            }
            if (!this.validateGoogleDriveUrl(pdfUrl)) {
                alert('Please enter a valid Google Drive PDF URL (e.g., https://drive.google.com/file/d/FILE_ID/view).');
                return;
            }

            const fileId = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)[1];
            const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            const pdfData = {
                id: Date.now().toString(),
                url: embedUrl,
                fileName: `PDF_${fileId}.pdf`
            };

            pdfStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].pdfs.push(pdfData);
            const sharedData = await this.fetchSharedData();
            sharedData.pdfs = pdfStructure;
            await this.updateSharedData(sharedData);
            displayPdfs();
            pdfUrlInput.value = '';
        });

        // Initial load
        updateClassDropdown();
    },

    // Video Integration Functionality
    async initVideoIntegration() {
        const semesterSelect = document.getElementById('semester-video');
        const classSelect = document.getElementById('class-video');
        const newClassInput = document.getElementById('new-class-video');
        const addClassButton = document.getElementById('add-class-video');
        const teacherSelect = document.getElementById('teacher-video');
        const newTeacherInput = document.getElementById('new-teacher-video');
        const addTeacherButton = document.getElementById('add-teacher-video');
        const chapterSelect = document.getElementById('chapter-video');
        const newChapterInput = document.getElementById('new-chapter-video');
        const addChapterButton = document.getElementById('add-chapter-video');
        const videoUrlInput = document.getElementById('video-url');
        const addVideoButton = document.getElementById('add-video-button');
        const videoList = document.getElementById('video-list');
        const videoPlayer = document.getElementById('video-player');
        const videoPlayerContainer = document.getElementById('video-player-container');

        if (!semesterSelect || !classSelect || !newClassInput || !addClassButton || !teacherSelect || 
            !newTeacherInput || !addTeacherButton || !chapterSelect || !newChapterInput || !addChapterButton || 
            !videoUrlInput || !addVideoButton || !videoList || !videoPlayer || !videoPlayerContainer) {
            return; // Skip if elements not found (not on this page)
        }

        // Load shared data
        let videoStructure = await this.fetchSharedData();
        videoStructure = videoStructure.videos || {};

        // Helper function to update class dropdown
        const updateClassDropdown = () => {
            const semester = semesterSelect.value;
            classSelect.innerHTML = '<option value="">Select Class</option>';
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            videoList.innerHTML = '';
            videoPlayer.style.display = 'none';
            if (semester && videoStructure[semester] && videoStructure[semester].classes) {
                Object.keys(videoStructure[semester].classes).forEach(className => {
                    const option = document.createElement('option');
                    option.value = className;
                    option.textContent = className;
                    classSelect.appendChild(option);
                });
            }
        };

        // Helper function to update teacher dropdown
        const updateTeacherDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            videoList.innerHTML = '';
            videoPlayer.style.display = 'none';
            if (semester && selectedClass && videoStructure[semester] && videoStructure[semester].classes[selectedClass]) {
                Object.keys(videoStructure[semester].classes[selectedClass].teachers).forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher;
                    option.textContent = teacher;
                    teacherSelect.appendChild(option);
                });
            }
        };

        // Helper function to update chapter dropdown and video list
        const updateChapterDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            videoList.innerHTML = '';
            videoPlayer.style.display = 'none';
            if (semester && selectedClass && selectedTeacher && 
                videoStructure[semester] && videoStructure[semester].classes[selectedClass] && 
                videoStructure[semester].classes[selectedClass].teachers[selectedTeacher]) {
                Object.keys(videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters).forEach(chapter => {
                    const option = document.createElement('option');
                    option.value = chapter;
                    option.textContent = chapter;
                    chapterSelect.appendChild(option);
                });
            }
        };

        // Helper function to display videos for the selected chapter
        const displayVideos = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            videoList.innerHTML = '';
            videoPlayer.style.display = 'none';
            if (semester && selectedClass && selectedTeacher && selectedChapter && 
                videoStructure[semester] && videoStructure[semester].classes[selectedClass] && 
                videoStructure[semester].classes[selectedClass].teachers[selectedTeacher] && 
                videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter]) {
                const videos = videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].videos || [];
                videos.forEach(video => {
                    const videoItem = document.createElement('div');
                    videoItem.className = 'video-item';
                    videoItem.innerHTML = `
                        <i class="fas fa-video"></i>
                        <span>Video_${video.videoId}</span>
                        <button class="delete-video" data-id="${video.id}">Delete</button>
                    `;
                    videoItem.addEventListener('click', (e) => {
                        if (e.target.className !== 'delete-video') {
                            videoPlayer.src = `https://www.youtube.com/embed/${video.videoId}`;
                            videoPlayer.style.display = 'block';
                            videoPlayerContainer.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                    videoItem.querySelector('.delete-video').addEventListener('click', async () => {
                        const updatedVideos = videos.filter(v => v.id !== video.id);
                        videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].videos = updatedVideos;
                        const sharedData = await TextileApp.fetchSharedData();
                        sharedData.videos = videoStructure;
                        await TextileApp.updateSharedData(sharedData);
                        displayVideos();
                    });
                    videoList.appendChild(videoItem);
                });
            }
        };

        // Semester change handler
        semesterSelect.addEventListener('change', () => {
            updateClassDropdown();
        });

        // Class change handler
        classSelect.addEventListener('change', () => {
            updateTeacherDropdown();
        });

        // Teacher change handler
        teacherSelect.addEventListener('change', () => {
            updateChapterDropdown();
        });

        // Chapter change handler
        chapterSelect.addEventListener('change', () => {
            displayVideos();
        });

        // Add new class
        addClassButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const newClass = newClassInput.value.trim();
            if (!semester) {
                alert('Please select a semester first.');
                return;
            }
            if (!newClass) {
                alert('Please enter a class name.');
                return;
            }
            if (!videoStructure[semester]) {
                videoStructure[semester] = { classes: {} };
            }
            if (!videoStructure[semester].classes[newClass]) {
                videoStructure[semester].classes[newClass] = { teachers: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.videos = videoStructure;
                await this.updateSharedData(sharedData);
                updateClassDropdown();
                newClassInput.value = '';
            } else {
                alert('Class already exists.');
            }
        });

        // Add new teacher
        addTeacherButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const newTeacher = newTeacherInput.value.trim();
            if (!semester || !selectedClass) {
                alert('Please select a semester and class first.');
                return;
            }
            if (!newTeacher) {
                alert('Please enter a teacher name.');
                return;
            }
            if (!videoStructure[semester].classes[selectedClass].teachers[newTeacher]) {
                videoStructure[semester].classes[selectedClass].teachers[newTeacher] = { chapters: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.videos = videoStructure;
                await this.updateSharedData(sharedData);
                updateTeacherDropdown();
                newTeacherInput.value = '';
            } else {
                alert('Teacher already exists.');
            }
        });

        // Add new chapter
        addChapterButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const newChapter = newChapterInput.value.trim();
            if (!semester || !selectedClass || !selectedTeacher) {
                alert('Please select a semester, class, and teacher first.');
                return;
            }
            if (!newChapter) {
                alert('Please enter a chapter name.');
                return;
            }
            if (!videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[newChapter]) {
                videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[newChapter] = { videos: [] };
                const sharedData = await this.fetchSharedData();
                sharedData.videos = videoStructure;
                await this.updateSharedData(sharedData);
                updateChapterDropdown();
                newChapterInput.value = '';
            } else {
                alert('Chapter already exists.');
            }
        });

        // Add video
        addVideoButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const videoUrl = videoUrlInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) {
                alert('Please select a semester, class, teacher, and chapter first.');
                return;
            }
            if (!this.validateYouTubeUrl(videoUrl)) {
                alert('Please enter a valid YouTube URL (e.g., https://youtu.be/VIDEO_ID).');
                return;
            }

            const videoId = videoUrl.match(/(?:v=|youtu\.be\/)([^"&?\/\s]{11})/)[1];
            const videoData = {
                id: Date.now().toString(),
                videoId,
                semester,
                class: selectedClass,
                teacher: selectedTeacher,
                chapter: selectedChapter
            };

            if (!videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].videos) {
                videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].videos = [];
            }
            videoStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].videos.push(videoData);
            const sharedData = await this.fetchSharedData();
            sharedData.videos = videoStructure;
            await this.updateSharedData(sharedData);
            displayVideos();
            videoUrlInput.value = '';
        });

        // Initial load
        updateClassDropdown();
    },

    // Notes Functionality
    async initNotes() {
        const semesterSelect = document.getElementById('semester-notes');
        const classSelect = document.getElementById('class-notes');
        const newClassInput = document.getElementById('new-class-notes');
        const addClassButton = document.getElementById('add-class-notes');
        const teacherSelect = document.getElementById('teacher-notes');
        const newTeacherInput = document.getElementById('new-teacher-notes');
        const addTeacherButton = document.getElementById('add-teacher-notes');
        const chapterSelect = document.getElementById('chapter-notes');
        const newChapterInput = document.getElementById('new-chapter-notes');
        const addChapterButton = document.getElementById('add-chapter-notes');
        const studentSelect = document.getElementById('student-name-notes');
        const newStudentInput = document.getElementById('new-student-name-notes');
        const addStudentButton = document.getElementById('add-student-name-notes');
        const rollSelect = document.getElementById('roll-number-notes');
        const newRollInput = document.getElementById('new-roll-number-notes');
        const addRollButton = document.getElementById('add-roll-number-notes');
        const notesContentInput = document.getElementById('notes-content');
        const uploadNotesButton = document.getElementById('upload-notes');
        const notesList = document.getElementById('notes-list');
        const notesViewer = document.getElementById('notes-viewer');
        const notesViewerContainer = document.getElementById('notes-viewer-container');

        if (!semesterSelect || !classSelect || !newClassInput || !addClassButton || !teacherSelect || 
            !newTeacherInput || !addTeacherButton || !chapterSelect || !newChapterInput || !addChapterButton || 
            !studentSelect || !newStudentInput || !addStudentButton || !rollSelect || !newRollInput || 
            !addRollButton || !notesContentInput || !uploadNotesButton || !notesList || !notesViewer || 
            !notesViewerContainer) {
            return; // Skip if elements not found (not on this page)
        }

        // Load shared data
        let notesStructure = await this.fetchSharedData();
        notesStructure = notesStructure.notes || {};

        // Helper function to update class dropdown
        const updateClassDropdown = () => {
            const semester = semesterSelect.value;
            classSelect.innerHTML = '<option value="">Select Class</option>';
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            rollSelect.innerHTML = '<option value="">Select Roll Number</option>';
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';
            if (semester && notesStructure[semester] && notesStructure[semester].classes) {
                Object.keys(notesStructure[semester].classes).forEach(className => {
                    const option = document.createElement('option');
                    option.value = className;
                    option.textContent = className;
                    classSelect.appendChild(option);
                });
            }
        };

        // Helper function to update teacher dropdown
        const updateTeacherDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            rollSelect.innerHTML = '<option value="">Select Roll Number</option>';
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';
            if (semester && selectedClass && notesStructure[semester] && notesStructure[semester].classes[selectedClass]) {
                Object.keys(notesStructure[semester].classes[selectedClass].teachers).forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher;
                    option.textContent = teacher;
                    teacherSelect.appendChild(option);
                });
            }
        };

        // Helper function to update chapter dropdown
        const updateChapterDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            rollSelect.innerHTML = '<option value="">Select Roll Number</option>';
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';
            if (semester && selectedClass && selectedTeacher && 
                notesStructure[semester] && notesStructure[semester].classes[selectedClass] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher]) {
                Object.keys(notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters).forEach(chapter => {
                    const option = document.createElement('option');
                    option.value = chapter;
                    option.textContent = chapter;
                    chapterSelect.appendChild(option);
                });
            }
        };

        // Helper function to update student dropdown
        const updateStudentDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            studentSelect.innerHTML = '<option value="">Select Student</option>';
            rollSelect.innerHTML = '<option value="">Select Roll Number</option>';
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';
            if (semester && selectedClass && selectedTeacher && selectedChapter && 
                notesStructure[semester] && notesStructure[semester].classes[selectedClass] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter]) {
                const students = notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students || {};
                Object.keys(students).forEach(student => {
                    const option = document.createElement('option');
                    option.value = student;
                    option.textContent = student;
                    studentSelect.appendChild(option);
                });
            }
        };

        // Helper function to update roll number dropdown
        const updateRollDropdown = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentSelect.value;
            rollSelect.innerHTML = '<option value="">Select Roll Number</option>';
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';
            if (semester && selectedClass && selectedTeacher && selectedChapter && selectedStudent && 
                notesStructure[semester] && notesStructure[semester].classes[selectedClass] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent]) {
                const rolls = notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls || {};
                Object.keys(rolls).forEach(roll => {
                    const option = document.createElement('option');
                    option.value = roll;
                    option.textContent = roll;
                    rollSelect.appendChild(option);
                });
            }
        };

        // Helper function to display notes for the selected roll number
        const displayNotes = () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentSelect.value;
            const selectedRoll = rollSelect.value;
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';
            if (semester && selectedClass && selectedTeacher && selectedChapter && selectedStudent && selectedRoll && 
                notesStructure[semester] && notesStructure[semester].classes[selectedClass] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent] && 
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[selectedRoll]) {
                const notes = notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[selectedRoll].notes || [];
                notes.forEach(note => {
                    const noteItem = document.createElement('div');
                    noteItem.className = 'note-item';
                    noteItem.innerHTML = `
                        <i class="fas fa-sticky-note"></i>
                        <span>Note_${note.id}</span>
                        <button class="delete-note" data-id="${note.id}">Delete</button>
                    `;
                    noteItem.addEventListener('click', (e) => {
                        if (e.target.className !== 'delete-note') {
                            if (this.validateUrl(note.content)) {
                                notesViewer.innerHTML = `<a href="${note.content}" target="_blank">Open Notes Link</a>`;
                            } else {
                                notesViewer.textContent = note.content;
                            }
                            notesViewer.style.display = 'block';
                            notesViewerContainer.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                    noteItem.querySelector('.delete-note').addEventListener('click', async () => {
                        const updatedNotes = notes.filter(n => n.id !== note.id);
                        notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[selectedRoll].notes = updatedNotes;
                        const sharedData = await TextileApp.fetchSharedData();
                        sharedData.notes = notesStructure;
                        await TextileApp.updateSharedData(sharedData);
                        displayNotes();
                    });
                    notesList.appendChild(noteItem);
                });
            }
        };

        // Semester change handler
        semesterSelect.addEventListener('change', () => {
            updateClassDropdown();
        });

        // Class change handler
        classSelect.addEventListener('change', () => {
            updateTeacherDropdown();
        });

        // Teacher change handler
        teacherSelect.addEventListener('change', () => {
            updateChapterDropdown();
        });

        // Chapter change handler
        chapterSelect.addEventListener('change', () => {
            updateStudentDropdown();
        });

        // Student change handler
        studentSelect.addEventListener('change', () => {
            updateRollDropdown();
        });

        // Roll number change handler
        rollSelect.addEventListener('change', () => {
            displayNotes();
        });

        // Add new class
        addClassButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const newClass = newClassInput.value.trim();
            if (!semester) {
                alert('Please select a semester first.');
                return;
            }
            if (!newClass) {
                alert('Please enter a class name.');
                return;
            }
            if (!notesStructure[semester]) {
                notesStructure[semester] = { classes: {} };
            }
            if (!notesStructure[semester].classes[newClass]) {
                notesStructure[semester].classes[newClass] = { teachers: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.notes = notesStructure;
                await this.updateSharedData(sharedData);
                updateClassDropdown();
                newClassInput.value = '';
            } else {
                alert('Class already exists.');
            }
        });

        // Add new teacher
        addTeacherButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const newTeacher = newTeacherInput.value.trim();
            if (!semester || !selectedClass) {
                alert('Please select a semester and class first.');
                return;
            }
            if (!newTeacher) {
                alert('Please enter a teacher name.');
                return;
            }
            if (!notesStructure[semester].classes[selectedClass].teachers[newTeacher]) {
                notesStructure[semester].classes[selectedClass].teachers[newTeacher] = { chapters: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.notes = notesStructure;
                await this.updateSharedData(sharedData);
                updateTeacherDropdown();
                newTeacherInput.value = '';
            } else {
                alert('Teacher already exists.');
            }
        });

        // Add new chapter
        addChapterButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const newChapter = newChapterInput.value.trim();
            if (!semester || !selectedClass || !selectedTeacher) {
                alert('Please select a semester, class, and teacher first.');
                return;
            }
            if (!newChapter) {
                alert('Please enter a chapter name.');
                return;
            }
            if (!notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[newChapter]) {
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[newChapter] = { students: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.notes = notesStructure;
                await this.updateSharedData(sharedData);
                updateChapterDropdown();
                newChapterInput.value = '';
            } else {
                alert('Chapter already exists.');
            }
        });

        // Add new student
        addStudentButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const newStudent = newStudentInput.value.trim();
            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) {
                alert('Please select a semester, class, teacher, and chapter first.');
                return;
            }
            if (!newStudent) {
                alert('Please enter a student name.');
                return;
            }
            if (!notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[newStudent]) {
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[newStudent] = { rolls: {} };
                const sharedData = await this.fetchSharedData();
                sharedData.notes = notesStructure;
                await this.updateSharedData(sharedData);
                updateStudentDropdown();
                newStudentInput.value = '';
            } else {
                alert('Student already exists.');
            }
        });

        // Add new roll number
        addRollButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentSelect.value;
            const newRoll = newRollInput.value.trim();
            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent) {
                alert('Please select a semester, class, teacher, chapter, and student first.');
                return;
            }
            if (!newRoll) {
                alert('Please enter a roll number.');
                return;
            }
            if (!notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[newRoll]) {
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[newRoll] = { notes: [] };
                const sharedData = await this.fetchSharedData();
                sharedData.notes = notesStructure;
                await this.updateSharedData(sharedData);
                updateRollDropdown();
                newRollInput.value = '';
            } else {
                alert('Roll number already exists.');
            }
        });

        // Upload notes
        uploadNotesButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentSelect.value;
            const selectedRoll = rollSelect.value;
            const notesContent = notesContentInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent || !selectedRoll) {
                alert('Please select a semester, class, teacher, chapter, student, and roll number first.');
                return;
            }
            if (!notesContent) {
                alert('Please enter notes content or a URL.');
                return;
            }

            const noteData = {
                id: Date.now().toString(),
                content: notesContent,
                semester,
                class: selectedClass,
                teacher: selectedTeacher,
                chapter: selectedChapter,
                student: selectedStudent,
                roll: selectedRoll
            };

            if (!notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[selectedRoll].notes) {
                notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[selectedRoll].notes = [];
            }
            notesStructure[semester].classes[selectedClass].teachers[selectedTeacher].chapters[selectedChapter].students[selectedStudent].rolls[selectedRoll].notes.push(noteData);
            const sharedData = await this.fetchSharedData();
            sharedData.notes = notesStructure;
            await this.updateSharedData(sharedData);
            displayNotes();
            notesContentInput.value = '';
        });

        // Initial load
        updateClassDropdown();
    },

    // Calendar Functionality
    async initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) {
            return; // Skip if element not found (not on this page)
        }

        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridWeek',
            events: (await this.fetchSharedData()).calendarEvents || [],
            editable: true,
            selectable: true,
            select: async function(info) {
                const title = prompt('Enter event title:');
                if (title) {
                    const event = {
                        title,
                        start: info.startStr,
                        end: info.endStr,
                        allDay: info.allDay,
                        completed: false
                    };
                    calendar.addEvent(event);
                    const sharedData = await TextileApp.fetchSharedData();
                    sharedData.calendarEvents.push(event);
                    await TextileApp.updateSharedData(sharedData);
                }
            },
            eventDrop: async function(info) {
                const sharedData = await TextileApp.fetchSharedData();
                const updatedEvents = sharedData.calendarEvents.map(event => 
                    event.start === info.oldEvent.startStr ? {
                        ...event,
                        start: info.event.startStr,
                        end: info.event.endStr
                    } : event
                );
                sharedData.calendarEvents = updatedEvents;
                await TextileApp.updateSharedData(sharedData);
            },
            eventContent: function(arg) {
                const event = arg.event;
                const wrapper = document.createElement('div');
                wrapper.className = 'calendar-event';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = event.extendedProps.completed || false;
                checkbox.className = 'task-completed';
                checkbox.addEventListener('change', async () => {
                    const sharedData = await TextileApp.fetchSharedData();
                    const updatedEvents = sharedData.calendarEvents.map(ev => 
                        ev.start === event.startStr && ev.title === event.title ? {
                            ...ev,
                            completed: checkbox.checked
                        } : ev
                    );
                    sharedData.calendarEvents = updatedEvents;
                    await TextileApp.updateSharedData(sharedData);
                    event.setExtendedProp('completed', checkbox.checked);
                    wrapper.querySelector('.event-title').style.textDecoration = checkbox.checked ? 'line-through' : 'none';
                });

                const title = document.createElement('span');
                title.className = 'event-title';
                title.innerText = event.title;
                title.style.textDecoration = event.extendedProps.completed ? 'line-through' : 'none';

                const buttonsWrapper = document.createElement('div');
                buttonsWrapper.className = 'event-buttons';

                const editButton = document.createElement('button');
                editButton.className = 'edit-task';
                editButton.innerText = 'Edit';
                editButton.addEventListener('click', async () => {
                    const newTitle = prompt('Edit event title:', event.title);
                    if (newTitle) {
                        const sharedData = await TextileApp.fetchSharedData();
                        const updatedEvents = sharedData.calendarEvents.map(ev => 
                            ev.start === event.startStr && ev.title === event.title ? {
                                ...ev,
                                title: newTitle
                            } : ev
                        );
                        sharedData.calendarEvents = updatedEvents;
                        await TextileApp.updateSharedData(sharedData);
                        event.setProp('title', newTitle);
                    }
                });

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-task';
                deleteButton.innerText = 'Delete';
                deleteButton.addEventListener('click', async () => {
                    const sharedData = await TextileApp.fetchSharedData();
                    const updatedEvents = sharedData.calendarEvents.filter(ev => 
                        !(ev.start === event.startStr && ev.title === event.title)
                    );
                    sharedData.calendarEvents = updatedEvents;
                    await TextileApp.updateSharedData(sharedData);
                    event.remove();
                });

                buttonsWrapper.appendChild(editButton);
                buttonsWrapper.appendChild(deleteButton);
                wrapper.appendChild(checkbox);
                wrapper.appendChild(title);
                wrapper.appendChild(buttonsWrapper);

                // Show buttons on hover or click
                wrapper.addEventListener('mouseenter', () => {
                    buttonsWrapper.style.display = 'inline-block';
                });
                wrapper.addEventListener('mouseleave', () => {
                    buttonsWrapper.style.display = 'none';
                });
                wrapper.addEventListener('click', () => {
                    buttonsWrapper.style.display = 'inline-block';
                });

                return { domNodes: [wrapper] };
            }
        });
        calendar.render();
    },

    // Events Functionality
    async initEvents() {
        const addEventButton = document.getElementById('add-event');
        const eventTitleInput = document.getElementById('event-title');
        const eventDateInput = document.getElementById('event-date');
        const eventDescriptionInput = document.getElementById('event-description');
        const eventList = document.getElementById('event-list');

        if (!addEventButton || !eventTitleInput || !eventDateInput || !eventDescriptionInput || !eventList) {
            return; // Skip if elements not found (not on this page)
        }

        // Load shared events
        const sharedData = await this.fetchSharedData();
        const storedEvents = sharedData.events || [];
        storedEvents.forEach(event => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>${event.title}</strong> - ${this.formatDate(event.date)}<br>
                ${event.description}
                <button class="delete-event">Delete</button>
            `;
            listItem.querySelector('.delete-event').addEventListener('click', async () => {
                listItem.remove();
                const sharedData = await this.fetchSharedData();
                sharedData.events = sharedData.events.filter(e => e.id !== event.id);
                await this.updateSharedData(sharedData);
            });
            eventList.appendChild(listItem);
        });

        addEventButton.addEventListener('click', async () => {
            const title = eventTitleInput.value;
            const date = eventDateInput.value;
            const description = eventDescriptionInput.value;

            if (!title || !date || !description) {
                alert('Please fill in all event details.');
                return;
            }

            const event = {
                id: Date.now().toString(),
                title,
                date,
                description
            };

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>${title}</strong> - ${this.formatDate(date)}<br>
                ${description}
                <button class="delete-event">Delete</button>
            `;
            listItem.querySelector('.delete-event').addEventListener('click', async () => {
                listItem.remove();
                const sharedData = await this.fetchSharedData();
                sharedData.events = sharedData.events.filter(e => e.id !== event.id);
                await this.updateSharedData(sharedData);
            });
            eventList.appendChild(listItem);

            const sharedData = await this.fetchSharedData();
            if (!sharedData.events) sharedData.events = [];
            sharedData.events.push(event);
            await this.updateSharedData(sharedData);

            eventTitleInput.value = '';
            eventDateInput.value = '';
            eventDescriptionInput.value = '';
        });
    },

    // Exam Routine Functionality
    async initExamRoutine() {
        const addExamButton = document.getElementById('add-exam');
        const examForm = document.getElementById('exam-form');
        const saveExamButton = document.getElementById('save-exam');
        const examTableBody = document.querySelector('#exam-table tbody');

        if (!addExamButton || !examForm || !saveExamButton || !examTableBody) {
            return; // Skip if elements not found (not on this page)
        }

        // Load shared exams
        const sharedData = await this.fetchSharedData();
        const storedExams = sharedData.exams || [];
        storedExams.forEach(exam => {
            const newRow = examTableBody.insertRow();
            newRow.innerHTML = `
                <td>${this.formatDate(exam.date)}</td>
                <td>${exam.subject}</td>
                <td>${exam.time}</td>
                <td>${exam.room}</td>
                <td><button class="delete-exam">Delete</button></td>
            `;
            newRow.querySelector('.delete-exam').addEventListener('click', async () => {
                newRow.remove();
                const sharedData = await this.fetchSharedData();
                sharedData.exams = sharedData.exams.filter(e => e.id !== exam.id);
                await this.updateSharedData(sharedData);
            });
        });

        addExamButton.addEventListener('click', () => {
            examForm.style.display = 'block';
        });

        saveExamButton.addEventListener('click', async () => {
            const date = document.getElementById('exam-date').value;
            const subject = document.getElementById('exam-subject').value;
            const time = document.getElementById('exam-time').value;
            const room = document.getElementById('exam-room').value;

            if (!date || !subject || !time || !room) {
                alert('Please fill in all exam details.');
                return;
            }

            const exam = {
                id: Date.now().toString(),
                date,
                subject,
                time,
                room
            };

            const newRow = examTableBody.insertRow();
            newRow.innerHTML = `
                <td>${this.formatDate(date)}</td>
                <td>${subject}</td>
                <td>${time}</td>
                <td>${room}</td>
                <td><button class="delete-exam">Delete</button></td>
            `;
            newRow.querySelector('.delete-exam').addEventListener('click', async () => {
                newRow.remove();
                const sharedData = await this.fetchSharedData();
                sharedData.exams = sharedData.exams.filter(e => e.id !== exam.id);
                await this.updateSharedData(sharedData);
            });

            const sharedData = await this.fetchSharedData();
            if (!sharedData.exams) sharedData.exams = [];
            sharedData.exams.push(exam);
            await this.updateSharedData(sharedData);

            examForm.style.display = 'none';
            document.getElementById('exam-date').value = '';
            document.getElementById('exam-subject').value = '';
            document.getElementById('exam-time').value = '';
            document.getElementById('exam-room').value = '';
        });
    },

    // Task Planner Functionality
    async initTaskPlanner() {
        const newTaskInput = document.getElementById('new-task');
        const addTaskButton = document.getElementById('add-task');
        const taskList = document.getElementById('task-list');

        if (!newTaskInput || !addTaskButton || !taskList) {
            return; // Skip if elements not found (not on this page)
        }

        // Load shared tasks
        const sharedData = await this.fetchSharedData();
        const storedTasks = sharedData.tasks || [];

        // Helper function to render tasks
        const renderTasks = () => {
            taskList.innerHTML = ''; // Clear the list
            storedTasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.className = 'task-item';
                listItem.innerHTML = `
                    <input type="checkbox" class="task-completed" ${task.completed ? 'checked' : ''}>
                    <span class="task-text" style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.text}</span>
                    <button class="edit-task">Edit</button>
                    <button class="delete-task">Delete</button>
                `;

                // Checkbox handler for marking task as completed
                const checkbox = listItem.querySelector('.task-completed');
                checkbox.addEventListener('change', async () => {
                    task.completed = checkbox.checked;
                    listItem.querySelector('.task-text').style.textDecoration = task.completed ? 'line-through' : 'none';
                    const sharedData = await TextileApp.fetchSharedData();
                    sharedData.tasks = storedTasks;
                    await TextileApp.updateSharedData(sharedData);
                });

                // Edit task handler
                listItem.querySelector('.edit-task').addEventListener('click', async () => {
                    const newText = prompt('Edit task:', task.text);
                    if (newText && newText.trim()) {
                        task.text = newText.trim();
                        listItem.querySelector('.task-text').textContent = task.text;
                        listItem.querySelector('.task-text').style.textDecoration = task.completed ? 'line-through' : 'none';
                        const sharedData = await TextileApp.fetchSharedData();
                        sharedData.tasks = storedTasks;
                        await TextileApp.updateSharedData(sharedData);
                    }
                });

                // Delete task handler
                listItem.querySelector('.delete-task').addEventListener('click', async () => {
                    listItem.remove();
                    const updatedTasks = storedTasks.filter(t => t.id !== task.id);
                    storedTasks.length = 0;
                    storedTasks.push(...updatedTasks);
                    const sharedData = await TextileApp.fetchSharedData();
                    sharedData.tasks = storedTasks;
                    await TextileApp.updateSharedData(sharedData);
                });

                taskList.appendChild(listItem);
            });
        };

        // Initial render of tasks
        renderTasks();

        // Add task handler
        addTaskButton.addEventListener('click', async () => {
            const taskText = newTaskInput.value.trim();
            if (!taskText) {
                alert('Please enter a task.');
                return;
            }

            const task = {
                id: Date.now().toString(),
                text: taskText,
                completed: false
            };

            storedTasks.push(task);
            const sharedData = await this.fetchSharedData();
            sharedData.tasks = storedTasks;
            await this.updateSharedData(sharedData);
            renderTasks();
            newTaskInput.value = '';
        });
    },

    // Chat System Functionality (Basic - no backend)
    async initChatSystem() {
        const messageInput = document.getElementById('message-input');
        const sendMessageButton = document.getElementById('send-message');
        const chatMessages = document.getElementById('chat-messages');

        if (!messageInput || !sendMessageButton || !chatMessages) {
            return; // Skip if elements not found (not on this page)
        }

        // Load shared messages
        const sharedData = await this.fetchSharedData();
        const storedMessages = sharedData.chatMessages || [];
        storedMessages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.textContent = `[${new Date(message.timestamp).toLocaleTimeString()}] ${message.text}`;
            chatMessages.appendChild(messageElement);
        });

        sendMessageButton.addEventListener('click', async () => {
            const messageText = messageInput.value.trim();
            if (!messageText) {
                alert('Please enter a message.');
                return;
            }

            const message = {
                text: messageText,
                timestamp: new Date().toISOString()
            };

            const messageElement = document.createElement('div');
            messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${messageText}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            const sharedData = await this.fetchSharedData();
            if (!sharedData.chatMessages) sharedData.chatMessages = [];
            sharedData.chatMessages.push(message);
            await this.updateSharedData(sharedData);

            messageInput.value = '';
        });

        // Allow sending messages with Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageButton.click();
            }
        });
    },

    // Initialize based on the current page
    init() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';

        if (page === 'pdfs.html') {
            this.initPDFViewer();
        } else if (page === 'videos.html') {
            this.initVideoIntegration();
        } else if (page === 'notes.html') {
            this.initNotes();
        } else if (page === 'calendar.html') {
            this.initCalendar();
        } else if (page === 'events.html') {
            this.initEvents();
        } else if (page === 'exam-routine.html') {
            this.initExamRoutine();
        } else if (page === 'task-planner.html') {
            this.initTaskPlanner();
        } else if (page === 'chat.html') {
            this.initChatSystem();
        }
    }
};

// Function to load header
TextileApp.loadHeader = function() {
    const headerElements = document.querySelectorAll('header');
    if (headerElements.length > 0) {
        fetch('header.html')
            .then(response => response.text())
            .then(data => {
                headerElements.forEach(header => {
                    header.outerHTML = data;
                });
            })
            .catch(error => console.error('Error loading header:', error));
    }
};

// Update init to include header loading
TextileApp.init = function() {
    this.loadHeader(); // Load header on every page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    if (page === 'pdfs.html') {
        this.initPDFViewer();
    } else if (page === 'videos.html') {
        this.initVideoIntegration();
    } else if (page === 'notes.html') {
        this.initNotes();
    } else if (page === 'calendar.html') {
        this.initCalendar();
    } else if (page === 'events.html') {
        this.initEvents();
    } else if (page === 'exam-routine.html') {
        this.initExamRoutine();
    } else if (page === 'task-planner.html') {
        this.initTaskPlanner();
    } else if (page === 'chat.html') {
        this.initChatSystem();
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TextileApp.init();
});