"use strict";

// Main application module
const TextileApp = {
    API_BASE_URL: 'https://textile-backend-lxda.onrender.com/api',

    // Utility function for date formatting
    formatDate(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return 'Invalid Date';
        }
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
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

    // Utility function to extract Google Drive embed URL
    getGoogleDriveEmbedUrl(url) {
        const match = url.match(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/(view|edit|preview)/);
        return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
    },

    // Notification helper
    showNotification(message, isError = false) {
        let alertDiv = document.getElementById('alert-notification');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.id = 'alert-notification';
            document.body.appendChild(alertDiv);
        }
        alertDiv.textContent = message;
        alertDiv.className = isError ? 'alert-notification error' : 'alert-notification';
        alertDiv.style.display = 'block';
        setTimeout(() => {
            if (alertDiv) alertDiv.style.display = 'none';
        }, 4000);
    },

    // PDF Viewer Functionality
    async initPDFViewer() {
        // Get Elements
        const semesterSelect = document.getElementById('semester');
        const classSelect = document.getElementById('class');
        const teacherSelect = document.getElementById('teacher');
        const chapterSelect = document.getElementById('chapter');
        const pdfUrlInput = document.getElementById('pdf-url');
        const uploadPdfButton = document.getElementById('upload-pdf');
        const pdfList = document.getElementById('pdf-list');
        const pdfViewer = document.getElementById('pdf-viewer');
        const pdfViewerContainer = document.getElementById('pdf-viewer-container');
        const addClassButton = document.getElementById('add-class');
        const addTeacherButton = document.getElementById('add-teacher');
        const addChapterButton = document.getElementById('add-chapter');
        const newClassInput = document.getElementById('new-class');
        const newTeacherInput = document.getElementById('new-teacher');
        const newChapterInput = document.getElementById('new-chapter');

        // Check Elements
        if (!semesterSelect || !classSelect || !teacherSelect || !chapterSelect || !pdfUrlInput || 
            !uploadPdfButton || !pdfList || !pdfViewer || !pdfViewerContainer || !addClassButton || 
            !addTeacherButton || !addChapterButton || !newClassInput || !newTeacherInput || !newChapterInput) {
            console.error("Essential PDF Viewer elements missing.");
            return;
        }

        // Helper to Populate a Select Dropdown
        const populateDropdown = (selectElement, items, defaultOptionText = "Select Option") => {
            selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
            if (items && items.length > 0) {
                items.forEach(item => {
                    if (item) {
                        const option = document.createElement('option');
                        option.value = item;
                        option.textContent = item;
                        selectElement.appendChild(option);
                    }
                });
            }
            console.log(`Populating ${selectElement.id}: Items=`, items, `Length=`, items?.length);
            selectElement.disabled = !items || items.length === 0;
        };

        // Fetch and Populate Classes
        const fetchAndPopulateClasses = async () => {
            console.log("fetchAndPopulateClasses STARTING...");
            const semester = semesterSelect.value;
            populateDropdown(classSelect, [], "Select Class");
            populateDropdown(teacherSelect, [], "Select Teacher");
            populateDropdown(chapterSelect, [], "Select Chapter");
            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';

            if (!semester) {
                classSelect.disabled = true;
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/classes?semester=${semester}`);
                if (!response.ok) throw new Error(`Failed to fetch classes: ${await response.text()}`);
                const classes = await response.json();
                populateDropdown(classSelect, classes, "Select Class");
            } catch (error) {
                console.error("Error fetching classes:", error);
                this.showNotification("Failed to load classes.", true);
                classSelect.disabled = true;
            }
        };

        const fetchAndPopulateTeachers = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            populateDropdown(teacherSelect, [], "Select Teacher");
            populateDropdown(chapterSelect, [], "Select Chapter");
            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';
        
            if (!semester || !selectedClass) {
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
                this.showNotification("Please select both semester and class to load teachers.", true);
                return;
            }
        
            try {
                const queryParams = new URLSearchParams({ semester, class: selectedClass }).toString();
                const response = await fetch(`${this.API_BASE_URL}/teachers?${queryParams}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch teachers: ${response.status} ${await response.text()}`);
                }
                const teachers = await response.json();
                if (!Array.isArray(teachers)) {
                    throw new Error("Invalid response format: Teachers data is not an array.");
                }
                if (teachers.length === 0) {
                    this.showNotification("No teachers found for the selected class and semester. Please add a teacher.", true);
                    teacherSelect.disabled = true;
                    chapterSelect.disabled = true;
                    return;
                }
                populateDropdown(teacherSelect, teachers, "Select Teacher");
                teacherSelect.disabled = false;
                chapterSelect.disabled = true;
            } catch (error) {
                console.error("Error fetching teachers:", error.message);
                this.showNotification(`Failed to load teachers: ${error.message}`, true);
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
            }
        };
        
        const fetchAndPopulateChapters = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            populateDropdown(chapterSelect, [], "Select Chapter");
            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';
        
            if (!semester || !selectedClass || !selectedTeacher) {
                chapterSelect.disabled = true;
                this.showNotification("Please select semester, class, and teacher to load chapters.", true);
                return;
            }
        
            try {
                const queryParams = new URLSearchParams({ semester, class: selectedClass, teacher: selectedTeacher }).toString();
                const response = await fetch(`${this.API_BASE_URL}/chapters?${queryParams}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch chapters: ${response.status} ${await response.text()}`);
                }
                const chapters = await response.json();
                if (!Array.isArray(chapters)) {
                    throw new Error("Invalid response format: Chapters data is not an array.");
                }
                if (chapters.length === 0) {
                    this.showNotification("No chapters found for the selected teacher, class, and semester. Please add a chapter.", true);
                    chapterSelect.disabled = true;
                    return;
                }
                populateDropdown(chapterSelect, chapters, "Select Chapter");
                chapterSelect.disabled = false;
            } catch (error) {
                console.error("Error fetching chapters:", error.message);
                this.showNotification(`Failed to load chapters: ${error.message}`, true);
                chapterSelect.disabled = true;
            }
        };

        // Add Class Functionality
        addClassButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const newClassName = newClassInput.value.trim();
            if (!semester) {
                this.showNotification('Please select a semester first.', true);
                return;
            }
            if (!newClassName) {
                this.showNotification('Please enter a class name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/classes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ semester: parseInt(semester, 10), className: newClassName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add class: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Class "${newClassName}" added for Semester ${semester}.`);
                newClassInput.value = '';
                await fetchAndPopulateClasses();
            } catch (error) {
                console.error("Error adding class:", error);
                this.showNotification(error.message, true);
            }
        });

        // Add Teacher Functionality
        addTeacherButton.addEventListener('click', async () => {
            const newTeacherName = newTeacherInput.value.trim();
            if (!newTeacherName) {
                this.showNotification('Please enter a teacher name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/teachers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherName: newTeacherName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add teacher: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Teacher "${newTeacherName}" added.`);
                newTeacherInput.value = '';
                await fetchAndPopulateTeachers();
            } catch (error) {
                console.error("Error adding teacher:", error);
                this.showNotification(error.message, true);
            }
        });

        // Add Chapter Functionality
        addChapterButton.addEventListener('click', async () => {
            const newChapterName = newChapterInput.value.trim();
            if (!newChapterName) {
                this.showNotification('Please enter a chapter name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/chapters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapterName: newChapterName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add chapter: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Chapter "${newChapterName}" added.`);
                newChapterInput.value = '';
                await fetchAndPopulateChapters();
            } catch (error) {
                console.error("Error adding chapter:", error);
                this.showNotification(error.message, true);
            }
        });

        // Fetch and Display PDFs
        const displayPdfs = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;

            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) return;

            const queryParams = new URLSearchParams({ semester, class: selectedClass, teacher: selectedTeacher, chapter: selectedChapter }).toString();

            try {
                const response = await fetch(`${this.API_BASE_URL}/pdfs?${queryParams}`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                const pdfs = await response.json();

                if (pdfs.length === 0) {
                    pdfList.innerHTML = '<li>No PDFs found for this selection.</li>';
                    return;
                }

                const table = document.createElement('table');
                table.className = 'pdf-table';
                table.innerHTML = `<thead><tr><th>PDF Name</th><th>Actions</th></tr></thead><tbody></tbody>`;
                const tbody = table.querySelector('tbody');

                pdfs.forEach(pdf => {
                    const row = document.createElement('tr');
                    row.dataset.pdfId = pdf.id;
                    row.innerHTML = `
                        <td class="pdf-name">
                            <i class="fas fa-file-pdf" style="margin-right: 5px; color: #D32F2F;"></i>
                            <span>${pdf.file_name || 'Unnamed PDF'}</span>
                        </td>
                        <td>
                            <button class="rename-pdf">Rename</button>
                            <button class="delete-pdf">Delete</button>
                        </td>
                    `;
                    row.querySelector('.pdf-name span').addEventListener('click', () => {
                        if (pdf.url && pdf.url.includes('/preview')) {
                            pdfViewer.src = pdf.url;
                            pdfViewer.style.display = 'block';
                            pdfViewerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            this.showNotification("Cannot display PDF directly. URL might be incorrect.", true);
                            console.warn("PDF URL missing or not embeddable:", pdf.url);
                        }
                    });
                    row.querySelector('.rename-pdf').addEventListener('click', async () => {
                        const pdfId = row.dataset.pdfId;
                        const currentName = row.querySelector('.pdf-name span').textContent;
                        const newName = prompt('Enter new PDF name:', currentName);
                        if (newName && newName.trim() && newName.trim() !== currentName) {
                            try {
                                const updateResponse = await fetch(`${this.API_BASE_URL}/pdfs/${pdfId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ fileName: newName.trim() })
                                });
                                if (!updateResponse.ok) throw new Error(`Failed to rename: ${await updateResponse.text()}`);
                                const updatedPdf = await updateResponse.json();
                                row.querySelector('.pdf-name span').textContent = updatedPdf.file_name;
                                this.showNotification('PDF renamed.');
                            } catch (error) {
                                console.error(error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });
                    row.querySelector('.delete-pdf').addEventListener('click', async () => {
                        const pdfId = row.dataset.pdfId;
                        const pdfName = row.querySelector('.pdf-name span').textContent;
                        if (confirm(`Delete "${pdfName}"?`)) {
                            try {
                                const deleteResponse = await fetch(`${this.API_BASE_URL}/pdfs/${pdfId}`, { method: 'DELETE' });
                                if (!deleteResponse.ok) throw new Error(`Failed to delete: ${await deleteResponse.text()}`);
                                row.remove();
                                this.showNotification('PDF deleted.');
                            } catch (error) {
                                console.error(error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });
                    tbody.appendChild(row);
                });
                pdfList.appendChild(table);
            } catch (error) {
                console.error('Error displaying PDFs:', error);
                pdfList.innerHTML = '<li>Error loading PDFs.</li>';
                this.showNotification(`Failed to load PDFs: ${error.message}`, true);
            }
        };

        // Event Listeners for Dropdowns
        console.log("Adding event listener to semesterSelect:", semesterSelect);
        semesterSelect.addEventListener('change', () => {
            console.log("Semester CHANGED! Value:", semesterSelect.value);
            fetchAndPopulateClasses();
        });
        classSelect.addEventListener('change', fetchAndPopulateTeachers);
        teacherSelect.addEventListener('change', fetchAndPopulateChapters);
        chapterSelect.addEventListener('change', displayPdfs);

        // Upload PDF Button Handler
        uploadPdfButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const pdfUrl = pdfUrlInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !pdfUrl) {
                this.showNotification('Please select semester, class, teacher, chapter, and enter a PDF URL.', true);
                return;
            }
            if (!this.validateGoogleDriveUrl(pdfUrl)) {
                this.showNotification('Please enter a valid Google Drive file URL.', true);
                return;
            }
            const embedUrl = this.getGoogleDriveEmbedUrl(pdfUrl);
            if (!embedUrl) {
                this.showNotification('Could not extract File ID from URL.', true);
                return;
            }

            const suggestedFileName = `PDF_${embedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)[1]}.pdf`;
            const userFileName = prompt("Enter a filename for this PDF:", suggestedFileName);
            const finalFileName = (userFileName && userFileName.trim()) ? userFileName.trim() : suggestedFileName;

            const pdfData = {
                fileName: finalFileName,
                url: embedUrl,
                semester: parseInt(semester, 10),
                className: selectedClass,
                teacherName: selectedTeacher,
                chapterName: selectedChapter
            };

            try {
                const response = await fetch(`${this.API_BASE_URL}/pdfs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pdfData)
                });
                if (!response.ok) throw new Error(`Failed to add PDF: ${await response.text()}`);
                this.showNotification('PDF entry added.');
                pdfUrlInput.value = '';
                await displayPdfs();
            } catch (error) {
                console.error('Error adding PDF:', error);
                this.showNotification(error.message, true);
            }
        });

        // Initial State
        classSelect.disabled = true;
        teacherSelect.disabled = true;
        chapterSelect.disabled = true;
    },

    // Video Integration Functionality
    async initVideoIntegration() {
        // Get All Elements
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

        // Check If All Essential Elements Exist
        if (!semesterSelect || !classSelect || !teacherSelect || !chapterSelect || 
            !videoUrlInput || !addVideoButton || !videoList || !videoPlayer || !videoPlayerContainer) {
            console.error("Essential Video Integration elements missing.");
            return;
        }

        // Helper to Populate a Select Dropdown
        const populateDropdown = (selectElement, items, defaultOptionText = "Select Option") => {
            selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
            if (items && items.length > 0) {
                items.forEach(item => {
                    if (item) {
                        const option = document.createElement('option');
                        option.value = item;
                        option.textContent = item;
                        selectElement.appendChild(option);
                    }
                });
            }
            console.log(`Populating ${selectElement.id}: Items=`, items, `Length=`, items?.length);
            selectElement.disabled = !items || items.length === 0;
        };

        // Fetch and Populate Classes
        const fetchAndPopulateClasses = async () => {
            const semester = semesterSelect.value;
            populateDropdown(classSelect, [], "Select Class");
            populateDropdown(teacherSelect, [], "Select Teacher");
            populateDropdown(chapterSelect, [], "Select Chapter");
            videoList.innerHTML = '';
            videoPlayer.style.display = 'none';

            if (!semester) {
                classSelect.disabled = true;
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/classes?semester=${semester}`);
                if (!response.ok) throw new Error(`Failed to fetch classes: ${await response.text()}`);
                const classes = await response.json();
                populateDropdown(classSelect, classes, "Select Class");
            } catch (error) {
                console.error("Error fetching classes:", error);
                this.showNotification("Failed to load classes.", true);
                classSelect.disabled = true;
            }
        };

        const fetchAndPopulateTeachers = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            populateDropdown(teacherSelect, [], "Select Teacher");
            populateDropdown(chapterSelect, [], "Select Chapter");
            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';
        
            if (!semester || !selectedClass) {
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
                this.showNotification("Please select both semester and class to load teachers.", true);
                return;
            }
        
            try {
                const queryParams = new URLSearchParams({ semester, class: selectedClass }).toString();
                const response = await fetch(`${this.API_BASE_URL}/teachers?${queryParams}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch teachers: ${response.status} ${await response.text()}`);
                }
                const teachers = await response.json();
                if (!Array.isArray(teachers)) {
                    throw new Error("Invalid response format: Teachers data is not an array.");
                }
                if (teachers.length === 0) {
                    this.showNotification("No teachers found for the selected class and semester. Please add a teacher.", true);
                    teacherSelect.disabled = true;
                    chapterSelect.disabled = true;
                    return;
                }
                populateDropdown(teacherSelect, teachers, "Select Teacher");
                teacherSelect.disabled = false;
                chapterSelect.disabled = true;
            } catch (error) {
                console.error("Error fetching teachers:", error.message);
                this.showNotification(`Failed to load teachers: ${error.message}`, true);
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
            }
        };
        
        const fetchAndPopulateChapters = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            populateDropdown(chapterSelect, [], "Select Chapter");
            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';
        
            if (!semester || !selectedClass || !selectedTeacher) {
                chapterSelect.disabled = true;
                this.showNotification("Please select semester, class, and teacher to load chapters.", true);
                return;
            }
        
            try {
                const queryParams = new URLSearchParams({ semester, class: selectedClass, teacher: selectedTeacher }).toString();
                const response = await fetch(`${this.API_BASE_URL}/chapters?${queryParams}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch chapters: ${response.status} ${await response.text()}`);
                }
                const chapters = await response.json();
                if (!Array.isArray(chapters)) {
                    throw new Error("Invalid response format: Chapters data is not an array.");
                }
                if (chapters.length === 0) {
                    this.showNotification("No chapters found for the selected teacher, class, and semester. Please add a chapter.", true);
                    chapterSelect.disabled = true;
                    return;
                }
                populateDropdown(chapterSelect, chapters, "Select Chapter");
                chapterSelect.disabled = false;
            } catch (error) {
                console.error("Error fetching chapters:", error.message);
                this.showNotification(`Failed to load chapters: ${error.message}`, true);
                chapterSelect.disabled = true;
            }
        };
        // Add Class Functionality
        addClassButton?.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const newClassName = newClassInput.value.trim();
            if (!semester) {
                this.showNotification('Please select a semester first.', true);
                return;
            }
            if (!newClassName) {
                this.showNotification('Please enter a class name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/classes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ semester: parseInt(semester, 10), className: newClassName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add class: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Class "${newClassName}" added for Semester ${semester}.`);
                newClassInput.value = '';
                await fetchAndPopulateClasses();
            } catch (error) {
                console.error("Error adding class:", error);
                this.showNotification(error.message, true);
            }
        });

        // Add Teacher Functionality
        addTeacherButton?.addEventListener('click', async () => {
            const newTeacherName = newTeacherInput.value.trim();
            if (!newTeacherName) {
                this.showNotification('Please enter a teacher name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/teachers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherName: newTeacherName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add teacher: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Teacher "${newTeacherName}" added.`);
                newTeacherInput.value = '';
                await fetchAndPopulateTeachers();
            } catch (error) {
                console.error("Error adding teacher:", error);
                this.showNotification(error.message, true);
            }
        });

        // Add Chapter Functionality
        addChapterButton?.addEventListener('click', async () => {
            const newChapterName = newChapterInput.value.trim();
            if (!newChapterName) {
                this.showNotification('Please enter a chapter name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/chapters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapterName: newChapterName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add chapter: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Chapter "${newChapterName}" added.`);
                newChapterInput.value = '';
                await fetchAndPopulateChapters();
            } catch (error) {
                console.error("Error adding chapter:", error);
                this.showNotification(error.message, true);
            }
        });

        // Display Videos
        const displayVideos = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;

            videoList.innerHTML = '';
            if (videoPlayer) videoPlayer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) {
                return;
            }

            const queryParams = new URLSearchParams({
                semester: semester,
                class: selectedClass,
                teacher: selectedTeacher,
                chapter: selectedChapter
            }).toString();

            try {
                const response = await fetch(`${this.API_BASE_URL}/videos?${queryParams}`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const videos = await response.json();

                if (videos.length === 0) {
                    videoList.innerHTML = '<li>No videos found for this selection.</li>';
                    return;
                }

                videos.forEach(video => {
                    const videoItem = document.createElement('div');
                    videoItem.className = 'video-item';
                    videoItem.innerHTML = `
                        <i class="fas fa-video" style="margin-right: 5px; color: #1976D2;"></i>
                        <span>Video ${video.video_id}</span>
                        <button class="delete-video" data-id="${video.id}" style="margin-left: auto; background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">Del</button>
                    `;
                    videoItem.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('delete-video')) {
                            videoPlayer.src = `https://www.youtube.com/embed/${video.video_id}`;
                            videoPlayer.style.display = 'block';
                            videoPlayerContainer?.scrollIntoView({ behavior: 'smooth' });
                        }
                    });
                    videoItem.querySelector('.delete-video').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const videoEntryId = video.id;
                        if (confirm(`Are you sure you want to delete video ${video.video_id}?`)) {
                            try {
                                const deleteResponse = await fetch(`${this.API_BASE_URL}/videos/${videoEntryId}`, { method: 'DELETE' });
                                if (!deleteResponse.ok) throw new Error('Failed to delete video');
                                videoItem.remove();
                                this.showNotification('Video deleted.');
                            } catch (error) {
                                console.error('Error deleting video:', error);
                                this.showNotification('Failed to delete video.', true);
                            }
                        }
                    });
                    videoList.appendChild(videoItem);
                });
            } catch (error) {
                console.error('Error displaying videos:', error);
                videoList.innerHTML = '<li>Error loading videos. Please try again.</li>';
                this.showNotification(`Failed to load videos: ${error.message}`, true);
            }
        };

        // Add Event Listeners
        semesterSelect.addEventListener('change', async () => {
            await fetchAndPopulateClasses();
            await displayVideos();
        });
        classSelect.addEventListener('change', async () => {
            await fetchAndPopulateTeachers();
            await displayVideos();
        });
        teacherSelect.addEventListener('change', async () => {
            await fetchAndPopulateChapters();
            await displayVideos();
        });
        chapterSelect.addEventListener('change', displayVideos);

        // Add Video Button Handler
        addVideoButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const videoUrl = videoUrlInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !videoUrl) {
                this.showNotification('Please select all fields and enter a YouTube Video URL.', true);
                return;
            }
            if (!this.validateYouTubeUrl(videoUrl)) {
                this.showNotification('Please enter a valid YouTube Video URL (e.g., https://youtu.be/VIDEO_ID or full URL).', true);
                return;
            }

            const videoIdMatch = videoUrl.match(/(?:v=|v\/|embed\/|youtu\.be\/|\/user\/[^#]*#([^\/]*?\/)*?p\/a\/u\/\d+\/|(?<=watch\?v=))([^"&?\/\s]{11})/);
            if (!videoIdMatch || !videoIdMatch[2]) {
                this.showNotification('Could not extract Video ID from URL.', true);
                return;
            }
            const videoId = videoIdMatch[2];

            const videoData = {
                videoId: videoId,
                semester: parseInt(semester, 10),
                className: selectedClass,
                teacherName: selectedTeacher,
                chapterName: selectedChapter
            };

            try {
                const response = await fetch(`${this.API_BASE_URL}/videos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(videoData)
                });
                if (!response.ok) throw new Error(`Failed to add video: ${await response.text()}`);
                this.showNotification('Video added.');
                videoUrlInput.value = '';
                await displayVideos();
            } catch (error) {
                console.error('Error adding video:', error);
                this.showNotification(`Failed to add video: ${error.message}`, true);
            }
        });

        // Initial State
        classSelect.disabled = true;
        teacherSelect.disabled = true;
        chapterSelect.disabled = true;
    },

    // Notes Functionality
    async initNotes() {
        // Get All Elements
        const semesterSelect = document.getElementById('semester-notes');
        const classSelect = document.getElementById('class-notes');
        const teacherSelect = document.getElementById('teacher-notes');
        const chapterSelect = document.getElementById('chapter-notes');
        const studentNameSelect = document.getElementById('student-name-notes');
        const rollSelect = document.getElementById('roll-number-notes');
        const notesContentInput = document.getElementById('notes-content');
        const uploadNotesButton = document.getElementById('upload-notes');
        const notesList = document.getElementById('notes-list');
        const notesViewer = document.getElementById('notes-viewer');
        const notesViewerContainer = document.getElementById('notes-viewer-container');
        const addClassButton = document.getElementById('add-class-notes');
        const addTeacherButton = document.getElementById('add-teacher-notes');
        const addChapterButton = document.getElementById('add-chapter-notes');
        const addStudentButton = document.getElementById('add-student-name-notes');
        const addRollButton = document.getElementById('add-roll-number-notes');
        const newClassInput = document.getElementById('new-class-notes');
        const newTeacherInput = document.getElementById('new-teacher-notes');
        const newChapterInput = document.getElementById('new-chapter-notes');
        const newStudentInput = document.getElementById('new-student-name-notes');
        const newRollInput = document.getElementById('new-roll-number-notes');

        // Check If All Essential Elements Exist
        if (!semesterSelect || !classSelect || !teacherSelect || !chapterSelect || !studentNameSelect || 
            !rollSelect || !notesContentInput || !uploadNotesButton || !notesList || !notesViewer || 
            !notesViewerContainer || !addClassButton || !addTeacherButton || !addChapterButton || 
            !addStudentButton || !addRollButton || !newClassInput || !newTeacherInput || !newChapterInput || 
            !newStudentInput || !newRollInput) {
            console.error("Essential Notes elements missing.");
            return;
        }

        // Helper to Populate a Select Dropdown
        const populateDropdown = (selectElement, items, defaultOptionText = "Select Option") => {
            selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
            if (items && items.length > 0) {
                items.forEach(item => {
                    if (item) {
                        const option = document.createElement('option');
                        option.value = item;
                        option.textContent = item;
                        selectElement.appendChild(option);
                    }
                });
            }
            console.log(`Populating ${selectElement.id}: Items=`, items, `Length=`, items?.length);
            selectElement.disabled = !items || items.length === 0;
        };

        // Fetch and Populate Classes
        const fetchAndPopulateClasses = async () => {
            const semester = semesterSelect.value;
            populateDropdown(classSelect, [], "Select Class");
            populateDropdown(teacherSelect, [], "Select Teacher");
            populateDropdown(chapterSelect, [], "Select Chapter");
            populateDropdown(studentNameSelect, [], "Select Student");
            populateDropdown(rollSelect, [], "Select Roll");
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';

            if (!semester) {
                classSelect.disabled = true;
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
                studentNameSelect.disabled = true;
                rollSelect.disabled = true;
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/classes?semester=${semester}`);
                if (!response.ok) throw new Error(`Failed to fetch classes: ${await response.text()}`);
                const classes = await response.json();
                populateDropdown(classSelect, classes, "Select Class");
            } catch (error) {
                console.error("Error fetching classes:", error);
                this.showNotification("Failed to load classes.", true);
                classSelect.disabled = true;
            }
        };

        const fetchAndPopulateTeachers = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            populateDropdown(teacherSelect, [], "Select Teacher");
            populateDropdown(chapterSelect, [], "Select Chapter");
            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';
        
            if (!semester || !selectedClass) {
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
                this.showNotification("Please select both semester and class to load teachers.", true);
                return;
            }
        
            try {
                const queryParams = new URLSearchParams({ semester, class: selectedClass }).toString();
                const response = await fetch(`${this.API_BASE_URL}/teachers?${queryParams}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch teachers: ${response.status} ${await response.text()}`);
                }
                const teachers = await response.json();
                if (!Array.isArray(teachers)) {
                    throw new Error("Invalid response format: Teachers data is not an array.");
                }
                if (teachers.length === 0) {
                    this.showNotification("No teachers found for the selected class and semester. Please add a teacher.", true);
                    teacherSelect.disabled = true;
                    chapterSelect.disabled = true;
                    return;
                }
                populateDropdown(teacherSelect, teachers, "Select Teacher");
                teacherSelect.disabled = false;
                chapterSelect.disabled = true;
            } catch (error) {
                console.error("Error fetching teachers:", error.message);
                this.showNotification(`Failed to load teachers: ${error.message}`, true);
                teacherSelect.disabled = true;
                chapterSelect.disabled = true;
            }
        };
        
        const fetchAndPopulateChapters = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            populateDropdown(chapterSelect, [], "Select Chapter");
            pdfList.innerHTML = '';
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';
        
            if (!semester || !selectedClass || !selectedTeacher) {
                chapterSelect.disabled = true;
                this.showNotification("Please select semester, class, and teacher to load chapters.", true);
                return;
            }
        
            try {
                const queryParams = new URLSearchParams({ semester, class: selectedClass, teacher: selectedTeacher }).toString();
                const response = await fetch(`${this.API_BASE_URL}/chapters?${queryParams}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch chapters: ${response.status} ${await response.text()}`);
                }
                const chapters = await response.json();
                if (!Array.isArray(chapters)) {
                    throw new Error("Invalid response format: Chapters data is not an array.");
                }
                if (chapters.length === 0) {
                    this.showNotification("No chapters found for the selected teacher, class, and semester. Please add a chapter.", true);
                    chapterSelect.disabled = true;
                    return;
                }
                populateDropdown(chapterSelect, chapters, "Select Chapter");
                chapterSelect.disabled = false;
            } catch (error) {
                console.error("Error fetching chapters:", error.message);
                this.showNotification(`Failed to load chapters: ${error.message}`, true);
                chapterSelect.disabled = true;
            }
        };
        // Fetch and Populate Students (Dummy for now)
        const fetchAndPopulateStudents = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            populateDropdown(studentNameSelect, [], "Select Student");
            populateDropdown(rollSelect, [], "Select Roll");
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) {
                studentNameSelect.disabled = true;
                rollSelect.disabled = true;
                return;
            }

            // Dummy data for students (since there's no backend endpoint for this yet)
            const students = ["Student A", "Student B", "Student C"];
            populateDropdown(studentNameSelect, students, "Select Student");
        };

        // Fetch and Populate Rolls (Dummy for now)
        const fetchAndPopulateRolls = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentNameSelect.value;
            populateDropdown(rollSelect, [], "Select Roll");
            notesList.innerHTML = '';
            notesViewer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent) {
                rollSelect.disabled = true;
                return;
            }

            // Dummy data for rolls (since there's no backend endpoint for this yet)
            const rolls = ["001", "002", "003"];
            populateDropdown(rollSelect, rolls, "Select Roll");
        };

        // Add Class Functionality
        addClassButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const newClassName = newClassInput.value.trim();
            if (!semester) {
                this.showNotification('Please select a semester first.', true);
                return;
            }
            if (!newClassName) {
                this.showNotification('Please enter a class name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/classes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ semester: parseInt(semester, 10), className: newClassName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add class: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Class "${newClassName}" added for Semester ${semester}.`);
                newClassInput.value = '';
                await fetchAndPopulateClasses();
            } catch (error) {
                console.error("Error adding class:", error);
                this.showNotification(error.message, true);
            }
        });

        // Add Teacher Functionality
        addTeacherButton.addEventListener('click', async () => {
            const newTeacherName = newTeacherInput.value.trim();
            if (!newTeacherName) {
                this.showNotification('Please enter a teacher name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/teachers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherName: newTeacherName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add teacher: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Teacher "${newTeacherName}" added.`);
                newTeacherInput.value = '';
                await fetchAndPopulateTeachers();
            } catch (error) {
                console.error("Error adding teacher:", error);
                this.showNotification(error.message, true);
            }
        });

        // Add Chapter Functionality
        addChapterButton.addEventListener('click', async () => {
            const newChapterName = newChapterInput.value.trim();
            if (!newChapterName) {
                this.showNotification('Please enter a chapter name to add.', true);
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/chapters`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chapterName: newChapterName })
                });
                if (!response.ok && response.status !== 409) {
                    throw new Error(`Failed to add chapter: ${await response.text()}`);
                }
                const result = await response.json();
                this.showNotification(result.message || `Chapter "${newChapterName}" added.`);
                newChapterInput.value = '';
                await fetchAndPopulateChapters();
            } catch (error) {
                console.error("Error adding chapter:", error);
                this.showNotification(error.message, true);
            }
        });

        // Add Student Functionality (Dummy for now)
        addStudentButton.addEventListener('click', () => {
            const newStudentName = newStudentInput.value.trim();
            if (!newStudentName) {
                this.showNotification('Please enter a student name to add.', true);
                return;
            }
            this.showNotification('Add Student functionality not implemented yet.', true);
            newStudentInput.value = '';
        });

        // Add Roll Functionality (Dummy for now)
        addRollButton.addEventListener('click', () => {
            const newRollNumber = newRollInput.value.trim();
            if (!newRollNumber) {
                this.showNotification('Please enter a roll number to add.', true);
                return;
            }
            this.showNotification('Add Roll functionality not implemented yet.', true);
            newRollInput.value = '';
        });

        // Display Notes
        const displayNotes = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentNameSelect.value;
            const selectedRoll = rollSelect.value;

            notesList.innerHTML = '';
            if (notesViewer) notesViewer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent || !selectedRoll) {
                return;
            }

            const queryParams = new URLSearchParams({
                semester,
                class: selectedClass,
                teacher: selectedTeacher,
                chapter: selectedChapter,
                student: selectedStudent,
                roll: selectedRoll
            }).toString();

            try {
                const response = await fetch(`${this.API_BASE_URL}/notes?${queryParams}`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const notes = await response.json();

                if (notes.length === 0) {
                    notesList.innerHTML = '<li>No notes found for this selection.</li>';
                    return;
                }

                notes.forEach(note => {
                    const noteItem = document.createElement('div');
                    noteItem.className = 'note-item';
                    const notePreview = (note.content.length > 50) ? note.content.substring(0, 50) + '...' : note.content;
                    noteItem.innerHTML = `
                        <i class="fas fa-sticky-note" style="margin-right: 5px; color: #FFC107;"></i>
                        <span>${notePreview}</span>
                        <button class="delete-note" data-id="${note.id}" style="margin-left: auto; background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">Del</button>
                    `;
                    noteItem.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('delete-note')) {
                            if (this.validateUrl(note.content)) {
                                window.open(note.content.startsWith('http') ? note.content : 'http://' + note.content, '_blank');
                            } else {
                                notesViewer.textContent = note.content;
                                notesViewer.style.display = 'block';
                                notesViewerContainer?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }
                    });
                    noteItem.querySelector('.delete-note').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const noteId = note.id;
                        if (confirm(`Are you sure you want to delete this note?`)) {
                            try {
                                const deleteResponse = await fetch(`${this.API_BASE_URL}/notes/${noteId}`, { method: 'DELETE' });
                                if (!deleteResponse.ok) throw new Error('Failed to delete note');
                                noteItem.remove();
                                this.showNotification('Note deleted.');
                            } catch (error) {
                                console.error('Error deleting note:', error);
                                this.showNotification('Failed to delete note.', true);
                            }
                        }
                    });
                    notesList.appendChild(noteItem);
                });
            } catch (error) {
                console.error('Error displaying notes:', error);
                notesList.innerHTML = '<li>Error loading notes. Please try again.</li>';
                this.showNotification(`Failed to load notes: ${error.message}`, true);
            }
        };

        // Add Event Listeners
        semesterSelect.addEventListener('change', async () => {
            await fetchAndPopulateClasses();
            await displayNotes();
        });
        classSelect.addEventListener('change', async () => {
            await fetchAndPopulateTeachers();
            await displayNotes();
        });
        teacherSelect.addEventListener('change', async () => {
            await fetchAndPopulateChapters();
            await displayNotes();
        });
        chapterSelect.addEventListener('change', async () => {
            await fetchAndPopulateStudents();
            await displayNotes();
        });
        studentNameSelect.addEventListener('change', async () => {
            await fetchAndPopulateRolls();
            await displayNotes();
        });
        rollSelect.addEventListener('change', displayNotes);

        // Upload Notes Button
        uploadNotesButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentNameSelect.value;
            const selectedRoll = rollSelect.value;
            const notesContent = notesContentInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent || !selectedRoll || !notesContent) {
                this.showNotification('Please select all fields and enter note content.', true);
                return;
            }

            const noteData = {
                content: notesContent,
                semester: parseInt(semester, 10),
                className: selectedClass,
                teacherName: selectedTeacher,
                chapterName: selectedChapter,
                studentName: selectedStudent,
                rollNumber: selectedRoll
            };

            try {
                const response = await fetch(`${this.API_BASE_URL}/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(noteData)
                });
                if (!response.ok) throw new Error(`Failed to upload note: ${await response.text()}`);
                this.showNotification('Note uploaded.');
                notesContentInput.value = '';
                await displayNotes();
            } catch (error) {
                console.error('Error uploading note:', error);
                this.showNotification(`Failed to upload note: ${error.message}`, true);
            }
        });

        // Initial State
        classSelect.disabled = true;
        teacherSelect.disabled = true;
        chapterSelect.disabled = true;
        studentNameSelect.disabled = true;
        rollSelect.disabled = true;
    },

    // Calendar Functionality
    async initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl || typeof FullCalendar === 'undefined') {
            console.error("Calendar element or FullCalendar library not found.");
            return;
        }

        let calendarInstance = null;

        const fetchCalendarEvents = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/calendarEvents`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const events = await response.json();
                return events.map(event => ({
                    id: event.id,
                    title: event.title,
                    start: event.start_time,
                    end: event.end_time,
                    allDay: event.all_day,
                    extendedProps: { completed: event.completed }
                }));
            } catch (error) {
                console.error("Error fetching calendar events:", error);
                this.showNotification("Failed to load calendar events.", true);
                return [];
            }
        };

        calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: await fetchCalendarEvents(),
            editable: true,
            selectable: true,
            select: async (info) => {
                const title = prompt('Enter event title:');
                if (title) {
                    const newEventData = {
                        title,
                        start: info.startStr,
                        end: info.endStr,
                        allDay: info.allDay,
                        completed: false
                    };
                    try {
                        const response = await fetch(`${this.API_BASE_URL}/calendarEvents`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newEventData)
                        });
                        if (!response.ok) throw new Error('Failed to add event');
                        const createdEvent = await response.json();
                        calendarInstance.addEvent({
                            id: createdEvent.id,
                            title: createdEvent.title,
                            start: createdEvent.start_time,
                            end: createdEvent.end_time,
                            allDay: createdEvent.all_day,
                            extendedProps: { completed: createdEvent.completed }
                        });
                        this.showNotification("Event added.");
                    } catch (error) {
                        console.error("Error adding calendar event:", error);
                        this.showNotification("Failed to add event.", true);
                    }
                }
                calendarInstance.unselect();
            },
            eventChange: async (changeInfo) => {
                const event = changeInfo.event;
                const eventData = {
                    title: event.title,
                    start: event.startStr,
                    end: event.endStr,
                    allDay: event.allDay
                };
                try {
                    const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(eventData)
                    });
                    if (!response.ok) {
                        changeInfo.revert();
                        throw new Error('Failed to update event time/date');
                    }
                    this.showNotification("Event updated.");
                } catch (error) {
                    console.error("Error updating calendar event time/date:", error);
                    this.showNotification("Failed to update event.", true);
                    changeInfo.revert();
                }
            },
            eventContent: (arg) => {
                const event = arg.event;
                const props = event.extendedProps;

                let italicEl = document.createElement('i');
                let buttonsWrapper = document.createElement('div');
                let checkbox = document.createElement('input');
                let editButton = document.createElement('button');
                let deleteButton = document.createElement('button');

                italicEl.innerText = event.title;
                if (props.completed) {
                    italicEl.style.textDecoration = 'line-through';
                    italicEl.style.opacity = '0.7';
                }

                buttonsWrapper.className = 'event-buttons-fc';
                buttonsWrapper.style.display = 'none';
                buttonsWrapper.style.marginLeft = '10px';
                buttonsWrapper.style.fontSize = '0.8em';

                checkbox.type = 'checkbox';
                checkbox.checked = props.completed || false;
                checkbox.title = 'Mark as completed';
                checkbox.addEventListener('change', async () => {
                    const isCompleted = checkbox.checked;
                    try {
                        const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ completed: isCompleted })
                        });
                        if (!response.ok) throw new Error('Failed to update completion status');
                        event.setExtendedProp('completed', isCompleted);
                        italicEl.style.textDecoration = isCompleted ? 'line-through' : 'none';
                        italicEl.style.opacity = isCompleted ? '0.7' : '1';
                        this.showNotification("Event completion status updated.");
                    } catch (error) {
                        console.error("Error updating event completion:", error);
                        this.showNotification("Failed to update completion.", true);
                        checkbox.checked = !isCompleted;
                    }
                });

                editButton.innerText = '✎';
                editButton.title = 'Edit title';
                editButton.style.cursor = 'pointer';
                editButton.style.border = 'none';
                editButton.style.background = 'none';
                editButton.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newTitle = prompt('Edit event title:', event.title);
                    if (newTitle && newTitle.trim() && newTitle !== event.title) {
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title: newTitle.trim() })
                            });
                            if (!response.ok) throw new Error('Failed to edit event title');
                            event.setProp('title', newTitle.trim());
                            this.showNotification("Event title updated.");
                        } catch (error) {
                            console.error("Error editing event title:", error);
                            this.showNotification("Failed to edit title.", true);
                        }
                    }
                });

                deleteButton.innerText = '🗑️';
                deleteButton.title = 'Delete event';
                deleteButton.style.cursor = 'pointer';
                deleteButton.style.border = 'none';
                deleteButton.style.background = 'none';
                deleteButton.style.marginLeft = '5px';
                deleteButton.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete event "${event.title}"?`)) {
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, { method: 'DELETE' });
                            if (!response.ok) throw new Error('Failed to delete event');
                            event.remove();
                            this.showNotification("Event deleted.");
                        } catch (error) {
                            console.error("Error deleting calendar event:", error);
                            this.showNotification("Failed to delete event.", true);
                        }
                    }
                });

                buttonsWrapper.appendChild(checkbox);
                buttonsWrapper.appendChild(editButton);
                buttonsWrapper.appendChild(deleteButton);

                let containerEl = document.createElement('div');
                containerEl.style.display = 'flex';
                containerEl.style.alignItems = 'center';
                containerEl.appendChild(italicEl);
                containerEl.appendChild(buttonsWrapper);

                containerEl.addEventListener('mouseenter', () => { buttonsWrapper.style.display = 'inline-flex'; });
                containerEl.addEventListener('mouseleave', () => { buttonsWrapper.style.display = 'none'; });

                return { domNodes: [containerEl] };
            }
        });
        calendarInstance.render();
    },

    // Events Functionality (Separate Events Page)
    async initEvents() {
        const addEventButton = document.getElementById('add-event');
        const eventTitleInput = document.getElementById('event-title');
        const eventDateInput = document.getElementById('event-date');
        const eventDescriptionInput = document.getElementById('event-description');
        const eventList = document.getElementById('event-list');

        if (!addEventButton || !eventTitleInput || !eventDateInput || !eventDescriptionInput || !eventList) {
            console.error("Events page elements not found.");
            return;
        }

        const renderEvents = (events) => {
            eventList.innerHTML = '';
            if (!events || events.length === 0) {
                eventList.innerHTML = '<li>No events found.</li>';
                return;
            }
            events.forEach(event => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${event.title}</strong> - ${this.formatDate(event.event_date)}<br>
                    ${event.description || ''}
                    <button class="delete-event" data-id="${event.id}" style="margin-left: 10px; background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; float: right;">Delete</button>
                `;
                listItem.querySelector('.delete-event').addEventListener('click', async () => {
                    const eventId = event.id;
                    if (confirm(`Delete event "${event.title}"?`)) {
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/events/${eventId}`, { method: 'DELETE' });
                            if (!response.ok) throw new Error('Failed to delete event');
                            listItem.remove();
                            this.showNotification("Event deleted.");
                        } catch (error) {
                            console.error("Error deleting event:", error);
                            this.showNotification("Failed to delete event.", true);
                        }
                    }
                });
                eventList.appendChild(listItem);
            });
        };

        const fetchAndRenderEvents = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/events`);
                if (!response.ok) throw new Error('Failed to load events');
                const events = await response.json();
                renderEvents(events);
            } catch (error) {
                console.error("Error fetching events:", error);
                this.showNotification("Could not load events.", true);
                eventList.innerHTML = '<li>Error loading events.</li>';
            }
        };

        addEventButton.addEventListener('click', async () => {
            const title = eventTitleInput.value.trim();
            const date = eventDateInput.value;
            const description = eventDescriptionInput.value.trim();

            if (!title || !date || !description) {
                this.showNotification('Please fill in all event details.', true);
                return;
            }

            const eventData = { title, date, description };

            try {
                const response = await fetch(`${this.API_BASE_URL}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                if (!response.ok) throw new Error(`Failed to add event: ${await response.text()}`);
                this.showNotification("Event added.");
                eventTitleInput.value = '';
                eventDateInput.value = '';
                eventDescriptionInput.value = '';
                await fetchAndRenderEvents();
            } catch (error) {
                console.error("Error adding event:", error);
                this.showNotification(`Failed to add event: ${error.message}`, true);
            }
        });

        fetchAndRenderEvents();
    },

    // Exam Routine Functionality
    async initExamRoutine() {
        const addExamButton = document.getElementById('add-exam');
        const examForm = document.getElementById('exam-form');
        const saveExamButton = document.getElementById('save-exam');
        const examTableBody = document.querySelector('#exam-table tbody');
        const dateInput = document.getElementById('exam-date');
        const subjectInput = document.getElementById('exam-subject');
        const timeInput = document.getElementById('exam-time');
        const roomInput = document.getElementById('exam-room');

        if (!addExamButton || !examForm || !saveExamButton || !examTableBody || !dateInput || !subjectInput || !timeInput || !roomInput) {
            console.error("Exam routine elements not found.");
            return;
        }

        const renderExams = (exams) => {
            examTableBody.innerHTML = '';
            if (!exams || exams.length === 0) {
                examTableBody.innerHTML = '<tr><td colspan="5">No exams scheduled.</td></tr>';
                return;
            }
            exams.forEach(exam => {
                const row = examTableBody.insertRow();
                row.innerHTML = `
                    <td>${this.formatDate(exam.exam_date)}</td>
                    <td>${exam.subject || ''}</td>
                    <td>${exam.exam_time || ''}</td>
                    <td>${exam.room || ''}</td>
                    <td><button class="delete-exam" data-id="${exam.id}" style="background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">Delete</button></td>
                `;
                row.querySelector('.delete-exam').addEventListener('click', async () => {
                    const examId = exam.id;
                    if (confirm(`Delete exam "${exam.subject}" on ${this.formatDate(exam.exam_date)}?`)) {
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/exams/${examId}`, { method: 'DELETE' });
                            if (!response.ok) throw new Error('Failed to delete exam');
                            row.remove();
                            this.showNotification("Exam deleted.");
                        } catch (error) {
                            console.error("Error deleting exam:", error);
                            this.showNotification("Failed to delete exam.", true);
                        }
                    }
                });
            });
        };

        const fetchAndRenderExams = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/exams`);
                if (!response.ok) throw new Error('Failed to load exams');
                const exams = await response.json();
                renderExams(exams);
            } catch (error) {
                console.error("Error fetching exams:", error);
                this.showNotification("Could not load exams.", true);
                examTableBody.innerHTML = '<tr><td colspan="5">Error loading exams.</td></tr>';
            }
        };

        addExamButton.addEventListener('click', () => {
            examForm.style.display = examForm.style.display === 'none' ? 'block' : 'none';
        });

        saveExamButton.addEventListener('click', async () => {
            const date = dateInput.value;
            const subject = subjectInput.value.trim();
            const time = timeInput.value;
            const room = roomInput.value.trim();

            if (!date || !subject || !time || !room) {
                this.showNotification('Please fill in all exam details.', true);
                return;
            }

            const examData = { date, subject, time, room };

            try {
                const response = await fetch(`${this.API_BASE_URL}/exams`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(examData)
                });
                if (!response.ok) throw new Error(`Failed to add exam: ${await response.text()}`);
                this.showNotification("Exam added.");
                dateInput.value = '';
                subjectInput.value = '';
                timeInput.value = '';
                roomInput.value = '';
                examForm.style.display = 'none';
                await fetchAndRenderExams();
            } catch (error) {
                console.error("Error adding exam:", error);
                this.showNotification(`Failed to add exam: ${error.message}`, true);
            }
        });

        fetchAndRenderExams();
    },

    // Task Planner Functionality
    async initTaskPlanner() {
        const newTaskInput = document.getElementById('new-task');
        const addTaskButton = document.getElementById('add-task');
        const taskList = document.getElementById('task-list');

        if (!newTaskInput || !addTaskButton || !taskList) {
            console.error("Task planner elements not found.");
            return;
        }

        const fetchTasks = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/tasks`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const tasks = await response.json();
                return tasks;
            } catch (error) {
                console.error('Error fetching tasks:', error);
                this.showNotification('Failed to load tasks.', true);
                return [];
            }
        };

        const renderTasks = (tasks) => {
            taskList.innerHTML = '';
            if (!tasks || tasks.length === 0) {
                taskList.innerHTML = '<li>No tasks yet!</li>';
                return;
            }
            tasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.className = 'task-item';
                listItem.dataset.taskId = task.id;
                listItem.innerHTML = `
                    <input type="checkbox" class="task-completed" ${task.completed ? 'checked' : ''}>
                    <span class="task-text" style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.text}</span>
                    <button class="edit-task">Edit</button>
                    <button class="delete-task">Delete</button>
                `;
                const checkbox = listItem.querySelector('.task-completed');
                checkbox.addEventListener('change', async () => {
                    const taskId = listItem.dataset.taskId;
                    const isCompleted = checkbox.checked;
                    try {
                        const response = await fetch(`${this.API_BASE_URL}/tasks/${taskId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ completed: isCompleted })
                        });
                        if (!response.ok) throw new Error('Failed to update task status');
                        listItem.querySelector('.task-text').style.textDecoration = isCompleted ? 'line-through' : 'none';
                    } catch (error) {
                        console.error('Error updating task status:', error);
                        this.showNotification('Failed to update task status.', true);
                        checkbox.checked = !isCompleted;
                    }
                });
                listItem.querySelector('.edit-task').addEventListener('click', async () => {
                    const taskId = listItem.dataset.taskId;
                    const spanElement = listItem.querySelector('.task-text');
                    const currentText = spanElement.textContent;
                    const newText = prompt('Edit task:', currentText);
                    if (newText && newText.trim() && newText.trim() !== currentText) {
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/tasks/${taskId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: newText.trim() })
                            });
                            if (!response.ok) throw new Error('Failed to edit task');
                            const updatedTask = await response.json();
                            spanElement.textContent = updatedTask.text;
                        } catch (error) {
                            console.error('Error editing task:', error);
                            this.showNotification('Failed to edit task.', true);
                        }
                    }
                });
                listItem.querySelector('.delete-task').addEventListener('click', async () => {
                    const taskId = listItem.dataset.taskId;
                    const taskText = listItem.querySelector('.task-text').textContent;
                    if (confirm(`Are you sure you want to delete task "${taskText}"?`)) {
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
                            if (!response.ok) throw new Error('Failed to delete task');
                            listItem.remove();
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            this.showNotification(`Failed to delete task: ${error.message}`, true);
                        }
                    }
                });
                taskList.appendChild(listItem);
            });
        };

        addTaskButton.addEventListener('click', async () => {
            const taskText = newTaskInput.value.trim();
            if (!taskText) {
                this.showNotification('Please enter a task.', true);
                return;
            }
            try {
                const response = await fetch(`${this.API_BASE_URL}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: taskText })
                });
                if (!response.ok) throw new Error(`Failed to add task: ${await response.text()}`);
                const updatedTasks = await fetchTasks();
                renderTasks(updatedTasks);
                newTaskInput.value = '';
            } catch (error) {
                console.error('Error adding task:', error);
                this.showNotification(`Failed to add task: ${error.message}`, true);
            }
        });

        newTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTaskButton.click();
            }
        });

        const initialTasks = await fetchTasks();
        renderTasks(initialTasks);
    },

    // Chat System Functionality
    async initChatSystem() {
        const messageInput = document.getElementById('message-input');
        const sendMessageButton = document.getElementById('send-message');
        const chatMessages = document.getElementById('chat-messages');

        if (!messageInput || !sendMessageButton || !chatMessages) {
            console.error("Chat elements not found.");
            return;
        }

        const renderMessages = (messages) => {
            chatMessages.innerHTML = '';
            if (!messages || messages.length === 0) {
                chatMessages.innerHTML = '<div>No messages yet.</div>';
                return;
            }
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();
                messageElement.textContent = `[${timestamp}] ${message.text}`;
                chatMessages.appendChild(messageElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        const fetchAndRenderMessages = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/chatMessages?limit=100`);
                if (!response.ok) throw new Error('Failed to load messages');
                const messages = await response.json();
                renderMessages(messages);
            } catch (error) {
                console.error("Error fetching chat messages:", error);
                this.showNotification("Failed to load chat messages.", true);
                chatMessages.innerHTML = '<div>Error loading messages.</div>';
            }
        };

        sendMessageButton.addEventListener('click', async () => {
            const messageText = messageInput.value.trim();
            if (!messageText) {
                return;
            }

            try {
                const response = await fetch(`${this.API_BASE_URL}/chatMessages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: messageText })
                });
                if (!response.ok) throw new Error(`Failed to send message: ${await response.text()}`);
                messageInput.value = '';
                await fetchAndRenderMessages();
            } catch (error) {
                console.error("Error sending message:", error);
                this.showNotification(`Failed to send message: ${error.message}`, true);
            }
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageButton.click();
            }
        });

        fetchAndRenderMessages();
    },

    // Initialize based on the current page
    init() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';

        const headerContainer = document.querySelector('header.header-container');

        if (headerContainer) {
            this.loadHeader().then(() => {
                this.initializePageScript(page);
            }).catch(error => {
                console.error("Failed to load header, proceeding with page script init.", error);
                this.initializePageScript(page);
            });
        } else {
            this.initializePageScript(page);
        }
    },

    // Helper function to run page-specific init logic
    initializePageScript(page) {
        if (page === 'pdfs.html' || page === 'index.html' || page === '') {
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
        } else {
            console.warn(`No initialization script found for page: ${page}`);
        }
    },

    // Function to load header (returns a promise)
    async loadHeader() {
        const headerElements = document.querySelectorAll('header.header-container:empty');
        if (headerElements.length > 0) {
            try {
                const response = await fetch('header.html');
                if(!response.ok) {
                    throw new Error(`Failed to load header: ${response.statusText}`);
                }
                const headerContent = await response.text();
                headerElements.forEach(header => {
                    header.innerHTML = headerContent;
                });

                // Initialize header-related functionality (e.g., navigation toggle)
                const navToggle = document.querySelector('.nav-toggle');
                const navMenu = document.querySelector('.nav-menu');
                if (navToggle && navMenu) {
                    navToggle.addEventListener('click', () => {
                        navMenu.classList.toggle('active');
                    });
                }
            } catch (error) {
                console.error("Error loading header:", error);
                throw error; // Re-throw to be caught by the caller
            }
        }
    }
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    TextileApp.init();
});