"use strict";

// Main application module
const TextileApp = {
    API_BASE_URL: 'https://textile-backend-lxda.onrender.com/api', // <<< YOUR DEPLOYED BACKEND URL + /api

    // Utility function for date formatting
    formatDate(date) {
        // Ensure date is valid before formatting
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return 'Invalid Date';
        }
        // Adjust for potential timezone issues if dates look off by one day
        // const adjustedDate = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' // Specify timezone to avoid local shifts if dates are date-only
        });
    },

    // Utility function to validate Google Drive PDF URL
    validateGoogleDriveUrl(url) {
        // Allow broader Google Drive links for view/edit/preview
        const regex = /https:\/\/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)(?:\/view|\/edit|\/preview)?/;
        return regex.test(url);
    },

     // Extract File ID and create Preview URL
     getGoogleDriveEmbedUrl(url) {
        const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)|\?id=([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            const fileId = fileIdMatch[1] || fileIdMatch[2]; // Get ID from either format
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        return null; // Return null if ID cannot be extracted
     },


    // Utility function to validate YouTube URL
    validateYouTubeUrl(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        return regex.test(url);
    },

    // Extract YouTube Video ID
     getYouTubeVideoId(url) {
        const videoIdMatch = url.match(/(?:v=|v\/|embed\/|youtu\.be\/|\/user\/[^#]*#([^\/]*?\/)*?p\/a\/u\/\d+\/|(?<=watch\?v=))([^"&?\/\s]{11})/);
        if (videoIdMatch && videoIdMatch[2]) {
            return videoIdMatch[2];
        }
        return null;
     },


    // Utility function to validate URL (for notes)
    validateUrl(url) {
        // Simple check for something that looks like a URL
        const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?/i;
         // More lenient check for common protocols or simple domain structures
         const simpleUrlRegex = /^(?:[a-z]+:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,6}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)$/i;
        return regex.test(url) || simpleUrlRegex.test(url);
    },

    // Ensure URL has http/https if missing
    ensureUrlProtocol(url) {
        if (!url) return url;
        if (!/^https?:\/\//i.test(url)) {
            return 'http://' + url;
        }
        return url;
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
        alertDiv.className = isError ? 'alert-notification error' : 'alert-notification success'; // Add distinct classes
        alertDiv.style.display = 'block';
        // Add CSS for .alert-notification.error and .alert-notification.success in style.css
        // e.g., .error { background-color: #F44336; } .success { background-color: #4CAF50; }
        setTimeout(() => {
            if (alertDiv) alertDiv.style.display = 'none';
        }, 4000);
    },

    // PDF Viewer Functionality
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

        if (!semesterSelect || !classSelect || !teacherSelect || !chapterSelect || !pdfUrlInput || !uploadPdfButton || !pdfList || !pdfViewer || !pdfViewerContainer) {
            return; // Exit if essential elements are missing
        }
         // --- Add Class/Teacher/Chapter PLACEHOLDERS ---
         addClassButton?.addEventListener('click', () => alert('Add Class functionality requires backend API endpoint.'));
         addTeacherButton?.addEventListener('click', () => alert('Add Teacher functionality requires backend API endpoint.'));
         addChapterButton?.addEventListener('click', () => alert('Add Chapter functionality requires backend API endpoint.'));


        // Helper function to fetch and display PDFs based on selection
        const displayPdfs = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;

            pdfList.innerHTML = ''; // Clear list
            pdfViewer.src = 'about:blank'; // Clear iframe
            pdfViewer.style.display = 'none'; // Hide viewer

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) {
                return; // Don't fetch if criteria aren't met
            }

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
                    row.dataset.pdfId = pdf.id; // Store ID
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

                    // Click on PDF name to view
                    row.querySelector('.pdf-name span').addEventListener('click', () => {
                         if (pdf.url && pdf.url.includes('/preview')) { // Check if it's likely embeddable
                            pdfViewer.src = pdf.url;
                            pdfViewer.style.display = 'block';
                            pdfViewerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            this.showNotification("Cannot display PDF directly. URL might be incorrect or not a preview link.", true);
                             console.warn("PDF URL missing or not embeddable:", pdf.url);
                              // Maybe provide a direct link?
                              const link = document.createElement('a');
                              link.href = pdf.url;
                              link.textContent = "Open Link (if available)";
                              link.target = "_blank";
                              pdfList.insertBefore(link, pdfList.firstChild);
                        }
                    });

                    // Rename PDF (Calls PUT API)
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
                                if (!updateResponse.ok) throw new Error(`Failed to rename PDF: ${await updateResponse.text()}`);
                                const updatedPdf = await updateResponse.json();
                                row.querySelector('.pdf-name span').textContent = updatedPdf.file_name; // Update UI
                                this.showNotification('PDF renamed.');
                            } catch (error) {
                                console.error('Error renaming PDF:', error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });

                    // Delete PDF (Calls DELETE API)
                    row.querySelector('.delete-pdf').addEventListener('click', async () => {
                        const pdfId = row.dataset.pdfId;
                        const pdfName = row.querySelector('.pdf-name span').textContent;
                        if (confirm(`Are you sure you want to delete "${pdfName}"?`)) {
                            try {
                                const deleteResponse = await fetch(`${this.API_BASE_URL}/pdfs/${pdfId}`, { method: 'DELETE' });
                                if (!deleteResponse.ok) throw new Error(`Failed to delete PDF: ${await deleteResponse.text()}`);
                                row.remove(); // Remove from UI
                                this.showNotification('PDF deleted.');
                            } catch (error) {
                                console.error('Error deleting PDF:', error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });
                    tbody.appendChild(row);
                });
                pdfList.appendChild(table);

            } catch (error) {
                console.error('Error displaying PDFs:', error);
                pdfList.innerHTML = '<li>Error loading PDFs. Please try again later.</li>';
                this.showNotification(`Failed to load PDFs: ${error.message}`, true);
            }
        };

        // Add event listeners to dropdowns
        semesterSelect.addEventListener('change', displayPdfs);
        classSelect.addEventListener('change', displayPdfs);
        teacherSelect.addEventListener('change', displayPdfs);
        chapterSelect.addEventListener('change', displayPdfs);

        // Upload PDF (Calls POST API)
        uploadPdfButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const pdfUrl = pdfUrlInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !pdfUrl) {
                alert('Please select semester, class, teacher, chapter, and enter a PDF URL.'); return;
            }
            if (!this.validateGoogleDriveUrl(pdfUrl)) {
                alert('Please enter a valid Google Drive file URL (e.g., https://drive.google.com/file/d/FILE_ID/...).'); return;
            }

            const embedUrl = this.getGoogleDriveEmbedUrl(pdfUrl);
            if (!embedUrl) {
                 alert('Could not extract File ID from Google Drive URL.'); return;
            }

            const suggestedFileName = `PDF_${embedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)[1]}.pdf`;
            const userFileName = prompt("Enter a filename for this PDF:", suggestedFileName);
            const finalFileName = (userFileName && userFileName.trim()) ? userFileName.trim() : suggestedFileName;

            const pdfData = {
                fileName: finalFileName, url: embedUrl, semester: parseInt(semester, 10),
                className: selectedClass, teacherName: selectedTeacher, chapterName: selectedChapter
            };

            try {
                const response = await fetch(`${this.API_BASE_URL}/pdfs`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pdfData)
                });
                if (!response.ok) throw new Error(`Failed to add PDF entry: ${await response.text()}`);
                this.showNotification('PDF entry added.');
                pdfUrlInput.value = '';
                await displayPdfs(); // Refresh list
            } catch (error) {
                console.error('Error adding PDF:', error);
                this.showNotification(error.message, true);
            }
        });
        // Initial empty load
        displayPdfs();
    },

    // Video Integration Functionality
    async initVideoIntegration() {
        const semesterSelect = document.getElementById('semester-video');
        const classSelect = document.getElementById('class-video');
        const teacherSelect = document.getElementById('teacher-video');
        const chapterSelect = document.getElementById('chapter-video');
        const videoUrlInput = document.getElementById('video-url');
        const addVideoButton = document.getElementById('add-video-button');
        const videoList = document.getElementById('video-list');
        const videoPlayer = document.getElementById('video-player');
        const videoPlayerContainer = document.getElementById('video-player-container');

        if (!semesterSelect || !classSelect || !teacherSelect || !chapterSelect || !videoUrlInput || !addVideoButton || !videoList || !videoPlayer || !videoPlayerContainer) {
            return; // Exit if essential elements are missing
        }
         // --- Add Class/Teacher/Chapter PLACEHOLDERS ---
         document.getElementById('add-class-video')?.addEventListener('click', () => alert('Add Class requires backend API.'));
         document.getElementById('add-teacher-video')?.addEventListener('click', () => alert('Add Teacher requires backend API.'));
         document.getElementById('add-chapter-video')?.addEventListener('click', () => alert('Add Chapter requires backend API.'));

        const displayVideos = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;

            videoList.innerHTML = '';
            videoPlayer.src = 'about:blank';
            videoPlayer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) return;

            const queryParams = new URLSearchParams({ semester, class: selectedClass, teacher: selectedTeacher, chapter: selectedChapter }).toString();

            try {
                const response = await fetch(`${this.API_BASE_URL}/videos?${queryParams}`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                const videos = await response.json();

                if (videos.length === 0) {
                    videoList.innerHTML = '<li>No videos found for this selection.</li>'; return;
                }

                videos.forEach(video => {
                    const videoItem = document.createElement('div');
                    videoItem.className = 'video-item';
                    videoItem.dataset.videoId = video.id; // Store DB ID
                    videoItem.innerHTML = `
                        <i class="fas fa-video" style="margin-right: 5px; color: #1976D2;"></i>
                        <span>Video ${video.video_id || 'Unknown ID'}</span>
                        <button class="delete-video" style="margin-left: auto; background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">Del</button>
                    `;

                    videoItem.addEventListener('click', (e) => {
                        if (!e.target.classList.contains('delete-video')) {
                            if (video.video_id) {
                                videoPlayer.src = `https://www.youtube.com/embed/${video.video_id}`;
                                videoPlayer.style.display = 'block';
                                videoPlayerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                                 this.showNotification("Missing YouTube Video ID.", true);
                            }
                        }
                    });

                    videoItem.querySelector('.delete-video').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const videoEntryId = videoItem.dataset.videoId;
                        if (confirm(`Are you sure you want to delete video ${video.video_id}?`)) {
                            try {
                                const deleteResponse = await fetch(`${this.API_BASE_URL}/videos/${videoEntryId}`, { method: 'DELETE' });
                                if (!deleteResponse.ok) throw new Error(`Failed to delete video: ${await deleteResponse.text()}`);
                                videoItem.remove();
                                this.showNotification('Video deleted.');
                            } catch (error) {
                                console.error('Error deleting video:', error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });
                    videoList.appendChild(videoItem);
                });
            } catch (error) {
                console.error('Error displaying videos:', error);
                videoList.innerHTML = '<li>Error loading videos.</li>';
                this.showNotification(`Failed to load videos: ${error.message}`, true);
            }
        };

        semesterSelect.addEventListener('change', displayVideos);
        classSelect.addEventListener('change', displayVideos);
        teacherSelect.addEventListener('change', displayVideos);
        chapterSelect.addEventListener('change', displayVideos);

        addVideoButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const videoUrl = videoUrlInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !videoUrl) {
                alert('Please select all fields and enter a YouTube Video URL.'); return;
            }
            if (!this.validateYouTubeUrl(videoUrl)) {
                alert('Please enter a valid YouTube Video URL.'); return;
            }

            const videoId = this.getYouTubeVideoId(videoUrl);
            if (!videoId) {
                alert('Could not extract Video ID from URL.'); return;
            }

            const videoData = {
                videoId, semester: parseInt(semester, 10), className: selectedClass,
                teacherName: selectedTeacher, chapterName: selectedChapter
            };

            try {
                const response = await fetch(`${this.API_BASE_URL}/videos`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(videoData)
                });
                if (!response.ok) throw new Error(`Failed to add video: ${await response.text()}`);
                this.showNotification('Video added.');
                videoUrlInput.value = '';
                await displayVideos(); // Refresh list
            } catch (error) {
                console.error('Error adding video:', error);
                this.showNotification(error.message, true);
            }
        });
         // Initial empty load
         displayVideos();
    },

    // Notes Functionality
    async initNotes() {
        const semesterSelect = document.getElementById('semester-notes');
        const classSelect = document.getElementById('class-notes');
        const teacherSelect = document.getElementById('teacher-notes');
        const chapterSelect = document.getElementById('chapter-notes');
        const studentSelect = document.getElementById('student-name-notes');
        const rollSelect = document.getElementById('roll-number-notes');
        const notesContentInput = document.getElementById('notes-content');
        const uploadNotesButton = document.getElementById('upload-notes');
        const notesList = document.getElementById('notes-list');
        const notesViewer = document.getElementById('notes-viewer');
        const notesViewerContainer = document.getElementById('notes-viewer-container');

        if (!semesterSelect || !classSelect || !teacherSelect || !chapterSelect || !studentSelect || !rollSelect || !notesContentInput || !uploadNotesButton || !notesList || !notesViewer || !notesViewerContainer) {
             return; // Exit if essential elements missing
        }

        // --- Add Category PLACEHOLDERS ---
        document.getElementById('add-class-notes')?.addEventListener('click', () => alert('Add Class requires backend API.'));
        document.getElementById('add-teacher-notes')?.addEventListener('click', () => alert('Add Teacher requires backend API.'));
        document.getElementById('add-chapter-notes')?.addEventListener('click', () => alert('Add Chapter requires backend API.'));
        document.getElementById('add-student-name-notes')?.addEventListener('click', () => alert('Add Student requires backend API.'));
        document.getElementById('add-roll-number-notes')?.addEventListener('click', () => alert('Add Roll requires backend API.'));


       const displayNotes = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentSelect.value;
            const selectedRoll = rollSelect.value;

            notesList.innerHTML = '';
            notesViewer.textContent = ''; // Clear viewer
            notesViewer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent || !selectedRoll) return;

            const queryParams = new URLSearchParams({
                semester, class: selectedClass, teacher: selectedTeacher, chapter: selectedChapter, student: selectedStudent, roll: selectedRoll
            }).toString();

             try {
                const response = await fetch(`${this.API_BASE_URL}/notes?${queryParams}`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                const notes = await response.json();

                if (notes.length === 0) {
                    notesList.innerHTML = '<li>No notes found for this selection.</li>'; return;
                }

                notes.forEach(note => {
                    const noteItem = document.createElement('div');
                    noteItem.className = 'note-item';
                    noteItem.dataset.noteId = note.id;
                    const isUrl = this.validateUrl(note.content);
                    const notePreview = isUrl ? note.content : (note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content);
                    noteItem.innerHTML = `
                        <i class="fas ${isUrl ? 'fa-link' : 'fa-sticky-note'}" style="margin-right: 5px; color: #FFC107;"></i>
                        <span>${notePreview}</span>
                        <button class="delete-note" style="margin-left: auto; background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">Del</button>
                    `;

                    noteItem.addEventListener('click', (e) => {
                         if (!e.target.classList.contains('delete-note')) {
                            if (isUrl) {
                                window.open(this.ensureUrlProtocol(note.content), '_blank');
                            } else {
                                notesViewer.textContent = note.content;
                                notesViewer.style.display = 'block';
                                notesViewerContainer.scrollIntoView({ behavior: 'smooth', block: 'start'});
                            }
                         }
                    });

                    noteItem.querySelector('.delete-note').addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const noteId = noteItem.dataset.noteId;
                        if (confirm(`Are you sure you want to delete this note?`)) {
                           try {
                                const deleteResponse = await fetch(`${this.API_BASE_URL}/notes/${noteId}`, { method: 'DELETE' });
                                if (!deleteResponse.ok) throw new Error(`Failed to delete note: ${await deleteResponse.text()}`);
                                noteItem.remove();
                                notesViewer.style.display = 'none'; // Hide viewer if the viewed note was deleted
                                this.showNotification('Note deleted.');
                            } catch (error) {
                                console.error('Error deleting note:', error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });
                    notesList.appendChild(noteItem);
                });

             } catch (error) {
                 console.error('Error displaying notes:', error);
                 notesList.innerHTML = '<li>Error loading notes.</li>';
                 this.showNotification(`Failed to load notes: ${error.message}`, true);
             }
       };

        semesterSelect.addEventListener('change', displayNotes);
        classSelect.addEventListener('change', displayNotes);
        teacherSelect.addEventListener('change', displayNotes);
        chapterSelect.addEventListener('change', displayNotes);
        studentSelect.addEventListener('change', displayNotes);
        rollSelect.addEventListener('change', displayNotes);

       uploadNotesButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = studentSelect.value;
            const selectedRoll = rollSelect.value;
            const notesContent = notesContentInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent || !selectedRoll || !notesContent) {
                alert('Please select all fields and enter note content or a URL.'); return;
            }

            const noteData = {
                content: notesContent, semester: parseInt(semester, 10), className: selectedClass,
                teacherName: selectedTeacher, chapterName: selectedChapter, studentName: selectedStudent, rollNumber: selectedRoll
            };

             try {
                const response = await fetch(`${this.API_BASE_URL}/notes`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(noteData)
                });
                if (!response.ok) throw new Error(`Failed to upload note: ${await response.text()}`);
                this.showNotification('Note uploaded.');
                notesContentInput.value = '';
                await displayNotes(); // Refresh list
            } catch (error) {
                console.error('Error uploading note:', error);
                this.showNotification(error.message, true);
            }
       });
        // Initial empty load
        displayNotes();
    },

    // Calendar Functionality
    async initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl || typeof FullCalendar === 'undefined') {
            return; // Exit if Calendar library or element not found
        }

        let calendarInstance = null;

        const fetchCalendarEvents = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/calendarEvents`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                const events = await response.json();
                return events.map(event => ({ // Map DB fields to FullCalendar fields
                    id: event.id.toString(), // Ensure ID is string for FullCalendar
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

        try {
            const events = await fetchCalendarEvents(); // Fetch events before initializing

            calendarInstance = new FullCalendar.Calendar(calendarEl, {
                initialView: 'dayGridMonth',
                headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
                events: events, // Use fetched events
                editable: true,
                selectable: true,

                select: async (info) => { // Add New Event
                    const title = prompt('Enter event title:');
                    if (title && title.trim()) {
                        const newEventData = {
                            title: title.trim(), start: info.startStr, end: info.endStr,
                            allDay: info.allDay, completed: false
                        };
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/calendarEvents`, {
                                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newEventData)
                            });
                            if (!response.ok) throw new Error(`Failed to add event: ${await response.text()}`);
                            const createdEvent = await response.json();
                            calendarInstance.addEvent({ // Add mapped event to UI
                                id: createdEvent.id.toString(), title: createdEvent.title, start: createdEvent.start_time,
                                end: createdEvent.end_time, allDay: createdEvent.all_day, extendedProps: { completed: createdEvent.completed }
                            });
                            this.showNotification("Event added.");
                        } catch (error) {
                            console.error("Error adding calendar event:", error);
                            this.showNotification(error.message, true);
                        }
                    }
                    calendarInstance.unselect();
                },

                eventChange: async (changeInfo) => { // Update Event (Drag/Drop/Resize)
                    const event = changeInfo.event;
                    // Note: ExtendedProps are not automatically included in event object here
                    // Fetch current completion status if needed, or handle separately
                    const eventData = {
                        title: event.title, start: event.startStr,
                        end: event.endStr, allDay: event.allDay
                        // We do NOT update completion status on drag/drop
                    };
                    try {
                        const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData)
                        });
                        if (!response.ok) {
                            changeInfo.revert();
                            throw new Error(`Failed to update event time/date: ${await response.text()}`);
                        }
                        // No notification usually needed for drag/drop
                    } catch (error) {
                        console.error("Error updating calendar event time/date:", error);
                        this.showNotification(error.message, true);
                        changeInfo.revert();
                    }
                },

                eventContent: (arg) => { // Custom Rendering for Edit/Delete/Complete
                    const event = arg.event;
                    const props = event.extendedProps;

                    let italicEl = document.createElement('i');
                    let buttonsWrapper = document.createElement('div');
                    let checkbox = document.createElement('input');
                    let editButton = document.createElement('button');
                    let deleteButton = document.createElement('button');

                    italicEl.innerText = event.title;
                    italicEl.style.marginRight = '5px'; // Add space before buttons
                    if (props.completed) {
                        italicEl.style.textDecoration = 'line-through';
                        italicEl.style.opacity = '0.7';
                    }

                    buttonsWrapper.className = 'event-buttons-fc';
                    buttonsWrapper.style.display = 'none'; // Hide initially
                    buttonsWrapper.style.fontSize = '0.8em';

                    checkbox.type = 'checkbox';
                    checkbox.checked = props.completed || false;
                    checkbox.title = 'Mark as completed';
                    checkbox.style.cursor = 'pointer';
                    checkbox.addEventListener('change', async () => {
                        const isCompleted = checkbox.checked;
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: isCompleted })
                            });
                            if (!response.ok) throw new Error(`Failed to update completion: ${await response.text()}`);
                            event.setExtendedProp('completed', isCompleted); // Update internal state
                            this.showNotification("Event completion updated.");
                            // Re-rendering happens automatically via setExtendedProp
                        } catch (error) {
                            console.error("Error updating event completion:", error);
                            this.showNotification(error.message, true);
                            checkbox.checked = !isCompleted; // Revert checkbox
                        }
                    });

                    editButton.innerText = '✎'; editButton.title = 'Edit title';
                    editButton.style.all = 'unset'; editButton.style.cursor = 'pointer'; editButton.style.marginLeft = '5px';
                    editButton.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const newTitle = prompt('Edit event title:', event.title);
                        if (newTitle && newTitle.trim() && newTitle !== event.title) {
                            try {
                                const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                                    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle.trim() })
                                });
                                if (!response.ok) throw new Error(`Failed to edit title: ${await response.text()}`);
                                event.setProp('title', newTitle.trim());
                                this.showNotification("Event title updated.");
                            } catch (error) {
                                console.error("Error editing event title:", error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });

                    deleteButton.innerText = '🗑️'; deleteButton.title = 'Delete event';
                    deleteButton.style.all = 'unset'; deleteButton.style.cursor = 'pointer'; deleteButton.style.marginLeft = '5px';
                    deleteButton.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (confirm(`Delete event "${event.title}"?`)) {
                            try {
                                const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, { method: 'DELETE' });
                                if (!response.ok) throw new Error(`Failed to delete event: ${await response.text()}`);
                                event.remove();
                                this.showNotification("Event deleted.");
                            } catch (error) {
                                console.error("Error deleting calendar event:", error);
                                this.showNotification(error.message, true);
                            }
                        }
                    });

                    buttonsWrapper.appendChild(checkbox);
                    buttonsWrapper.appendChild(editButton);
                    buttonsWrapper.appendChild(deleteButton);

                    let containerEl = document.createElement('div');
                    containerEl.style.display = 'flex'; containerEl.style.alignItems = 'center'; containerEl.style.overflow = 'hidden';
                    containerEl.appendChild(italicEl);
                    containerEl.appendChild(buttonsWrapper);

                    // Use eventMouseEnter/Leave for better control
                    arg.el.addEventListener('mouseenter', () => { buttonsWrapper.style.display = 'inline-flex'; });
                    arg.el.addEventListener('mouseleave', () => { buttonsWrapper.style.display = 'none'; });

                    return { domNodes: [containerEl] };
                }
            });
            calendarInstance.render();

        } catch (error) {
             console.error("Failed to initialize calendar:", error);
             calendarEl.innerHTML = "Error loading calendar."; // Show error message in the calendar div
             this.showNotification("Could not initialize calendar.", true);
        }
    },

    // Events Functionality (Separate Events Page)
    async initEvents() {
        const addEventButton = document.getElementById('add-event');
        const eventTitleInput = document.getElementById('event-title');
        const eventDateInput = document.getElementById('event-date');
        const eventDescriptionInput = document.getElementById('event-description');
        const eventList = document.getElementById('event-list');

        if (!addEventButton || !eventTitleInput || !eventDateInput || !eventDescriptionInput || !eventList) {
            return;
        }

        const renderEvents = (events) => {
            eventList.innerHTML = '';
            if (!events || events.length === 0) {
                eventList.innerHTML = '<li>No events found.</li>'; return;
            }
            events.forEach(event => {
                const listItem = document.createElement('li');
                listItem.dataset.eventId = event.id;
                listItem.style.marginBottom = '10px'; // Add spacing
                listItem.innerHTML = `
                    <div>
                        <strong>${event.title}</strong> - ${this.formatDate(event.event_date)}
                        <button class="delete-event" style="margin-left: 10px; background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer; float: right;">Delete</button>
                    </div>
                    <div style="margin-left: 10px; font-size: 0.9em; color: #555;">${event.description || ''}</div>
                `;
                listItem.querySelector('.delete-event').addEventListener('click', async () => {
                    const eventId = listItem.dataset.eventId;
                    if(confirm(`Delete event "${event.title}"?`)) {
                        try {
                             const response = await fetch(`${this.API_BASE_URL}/events/${eventId}`, { method: 'DELETE'});
                             if (!response.ok) throw new Error(`Failed to delete event: ${await response.text()}`);
                             listItem.remove();
                             this.showNotification("Event deleted.");
                         } catch(error) {
                            console.error("Error deleting event:", error);
                            this.showNotification(error.message, true);
                         }
                    }
                });
                eventList.appendChild(listItem);
            });
        };

        const fetchAndRenderEvents = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/events`);
                if (!response.ok) throw new Error(`Failed to load events: ${await response.text()}`);
                const events = await response.json();
                renderEvents(events);
            } catch (error) {
                console.error("Error fetching events:", error);
                this.showNotification(error.message, true);
                eventList.innerHTML = '<li>Error loading events.</li>';
            }
        };

        addEventButton.addEventListener('click', async () => {
            const title = eventTitleInput.value.trim();
            const date = eventDateInput.value;
            const description = eventDescriptionInput.value.trim();

            if (!title || !date || !description) {
                alert('Please fill in all event details.'); return;
            }
            const eventData = { title, date, description };

            try {
                const response = await fetch(`${this.API_BASE_URL}/events`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData)
                });
                if (!response.ok) throw new Error(`Failed to add event: ${await response.text()}`);
                this.showNotification("Event added.");
                eventTitleInput.value = ''; eventDateInput.value = ''; eventDescriptionInput.value = '';
                await fetchAndRenderEvents(); // Refresh list
            } catch (error) {
                console.error("Error adding event:", error);
                this.showNotification(error.message, true);
            }
        });
        fetchAndRenderEvents(); // Initial load
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
            return;
        }

        const renderExams = (exams) => {
             examTableBody.innerHTML = '';
             if (!exams || exams.length === 0) {
                 examTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No exams scheduled.</td></tr>'; return;
             }
             exams.forEach(exam => {
                 const row = examTableBody.insertRow();
                 row.dataset.examId = exam.id;
                 row.innerHTML = `
                     <td>${this.formatDate(exam.exam_date)}</td>
                     <td>${exam.subject || ''}</td>
                     <td>${exam.exam_time || ''}</td>
                     <td>${exam.room || ''}</td>
                     <td><button class="delete-exam" style="background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">Delete</button></td>
                 `;
                 row.querySelector('.delete-exam').addEventListener('click', async () => {
                     const examId = row.dataset.examId;
                     if (confirm(`Delete exam "${exam.subject}" on ${this.formatDate(exam.exam_date)}?`)) {
                        try {
                            const response = await fetch(`${this.API_BASE_URL}/exams/${examId}`, { method: 'DELETE' });
                            if (!response.ok) throw new Error(`Failed to delete exam: ${await response.text()}`);
                            row.remove();
                            this.showNotification("Exam deleted.");
                        } catch(error) {
                            console.error("Error deleting exam:", error);
                            this.showNotification(error.message, true);
                        }
                     }
                 });
             });
        };

        const fetchAndRenderExams = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/exams`);
                 if (!response.ok) throw new Error(`Failed to load exams: ${await response.text()}`);
                 const exams = await response.json();
                 renderExams(exams);
            } catch(error) {
                 console.error("Error fetching exams:", error);
                 this.showNotification(error.message, true);
                 examTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Error loading exams.</td></tr>';
            }
        };

        addExamButton.addEventListener('click', () => { examForm.style.display = examForm.style.display === 'none' ? 'block' : 'none'; });

        saveExamButton.addEventListener('click', async () => {
            const date = dateInput.value; const subject = subjectInput.value.trim();
            const time = timeInput.value; const room = roomInput.value.trim();
            if (!date || !subject || !time || !room) { alert('Please fill in all exam details.'); return; }
            const examData = { date, subject, time, room };

             try {
                const response = await fetch(`${this.API_BASE_URL}/exams`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(examData)
                });
                if (!response.ok) throw new Error(`Failed to add exam: ${await response.text()}`);
                this.showNotification("Exam added.");
                dateInput.value = ''; subjectInput.value = ''; timeInput.value = ''; roomInput.value = '';
                examForm.style.display = 'none';
                await fetchAndRenderExams(); // Refresh list
            } catch (error) {
                console.error("Error adding exam:", error);
                this.showNotification(error.message, true);
            }
        });
        fetchAndRenderExams(); // Initial load
    },

    // Task Planner Functionality
    async initTaskPlanner() {
        const newTaskInput = document.getElementById('new-task');
        const addTaskButton = document.getElementById('add-task');
        const taskList = document.getElementById('task-list');

        if (!newTaskInput || !addTaskButton || !taskList) {
            return;
        }

        const fetchTasks = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/tasks`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status} ${await response.text()}`);
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
                 taskList.innerHTML = '<li>No tasks yet!</li>'; return;
            }
            tasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.className = 'task-item';
                listItem.dataset.taskId = task.id; // Store id
                listItem.innerHTML = `
                    <input type="checkbox" class="task-completed" title="Mark complete" ${task.completed ? 'checked' : ''}>
                    <span class="task-text" style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.text}</span>
                    <button class="edit-task" title="Edit task">Edit</button>
                    <button class="delete-task" title="Delete task">Delete</button>
                `;

                const checkbox = listItem.querySelector('.task-completed');
                checkbox.addEventListener('change', async () => {
                    const taskId = listItem.dataset.taskId;
                    const isCompleted = checkbox.checked;
                    try {
                        const response = await fetch(`${this.API_BASE_URL}/tasks/${taskId}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: isCompleted })
                        });
                        if (!response.ok) throw new Error(`Failed to update task: ${await response.text()}`);
                        listItem.querySelector('.task-text').style.textDecoration = isCompleted ? 'line-through' : 'none';
                    } catch (error) {
                        console.error('Error updating task status:', error);
                        this.showNotification(error.message, true);
                        checkbox.checked = !isCompleted; // Revert
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
                                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: newText.trim() })
                            });
                            if (!response.ok) throw new Error(`Failed to edit task: ${await response.text()}`);
                            const updatedTask = await response.json();
                            spanElement.textContent = updatedTask.text;
                       } catch (error) {
                           console.error('Error editing task:', error);
                           this.showNotification(error.message, true);
                       }
                    }
                });

                listItem.querySelector('.delete-task').addEventListener('click', async () => {
                    const taskId = listItem.dataset.taskId;
                    const taskText = listItem.querySelector('.task-text').textContent;
                    if (confirm(`Delete task "${taskText}"?`)) {
                         try {
                            const response = await fetch(`${this.API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
                             if (!response.ok) throw new Error(`Failed to delete task: ${await response.text()}`);
                             listItem.remove();
                         } catch(error) {
                            console.error('Error deleting task:', error);
                            this.showNotification(error.message, true);
                         }
                    }
                });
                taskList.appendChild(listItem);
            });
        };

        addTaskButton.addEventListener('click', async () => {
            const taskText = newTaskInput.value.trim();
            if (!taskText) { alert('Please enter a task.'); return; }
            try {
                const response = await fetch(`${this.API_BASE_URL}/tasks`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: taskText })
                });
                 if (!response.ok) throw new Error(`Failed to add task: ${await response.text()}`);
                 const updatedTasks = await fetchTasks(); // Refresh list
                 renderTasks(updatedTasks);
                 newTaskInput.value = '';
            } catch (error) {
                console.error('Error adding task:', error);
                this.showNotification(error.message, true);
            }
        });

         newTaskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTaskButton.click(); });

        const initialTasks = await fetchTasks(); // Initial load
        renderTasks(initialTasks);
    },

    // Chat System Functionality (Basic - Fetch/POST only)
    async initChatSystem() {
        const messageInput = document.getElementById('message-input');
        const sendMessageButton = document.getElementById('send-message');
        const chatMessages = document.getElementById('chat-messages');

        if (!messageInput || !sendMessageButton || !chatMessages) {
            return;
        }

         const renderMessages = (messages) => {
            chatMessages.innerHTML = '';
             if (!messages || messages.length === 0) { chatMessages.innerHTML = '<div style="text-align: center; color: grey; padding: 10px;">No messages yet.</div>'; return; }
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString() : '...';
                messageElement.textContent = `[${timestamp}] ${message.text}`;
                messageElement.style.marginBottom = '5px'; // Add spacing
                chatMessages.appendChild(messageElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
         };

         const fetchAndRenderMessages = async () => {
             try {
                 const response = await fetch(`${this.API_BASE_URL}/chatMessages?limit=100`);
                 if (!response.ok) throw new Error(`Failed to load messages: ${await response.text()}`);
                 const messages = await response.json();
                 renderMessages(messages);
             } catch(error) {
                 console.error("Error fetching chat messages:", error);
                 this.showNotification(error.message, true);
                 chatMessages.innerHTML = '<div style="text-align: center; color: red; padding: 10px;">Error loading messages.</div>';
             }
         };

        sendMessageButton.addEventListener('click', async () => {
            const messageText = messageInput.value.trim();
            if (!messageText) return; // Don't send empty
            messageInput.disabled = true; sendMessageButton.disabled = true; // Prevent double send

            try {
                 const response = await fetch(`${this.API_BASE_URL}/chatMessages`, {
                     method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: messageText })
                 });
                 if (!response.ok) throw new Error(`Failed to send message: ${await response.text()}`);
                 messageInput.value = '';
                 await fetchAndRenderMessages(); // Refresh after sending
            } catch(error) {
                console.error("Error sending message:", error);
                this.showNotification(error.message, true);
            } finally {
                 messageInput.disabled = false; sendMessageButton.disabled = false; // Re-enable form
                 messageInput.focus(); // Focus input again
            }
        });

        messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessageButton.click(); });

        fetchAndRenderMessages(); // Initial load
        // setInterval(fetchAndRenderMessages, 30000); // Optional: Poll every 30s (Inefficient!)
    },

    // Initialize based on the current page
    init() {
        const path = window.location.pathname;
        // Handle potential trailing slash or default index.html cases
        let page = path.substring(path.lastIndexOf('/') + 1);
        if (page === '' || page === 'index.html') {
             page = 'pdfs.html'; // Or your actual default page, e.g., index.html if it has content
        }


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
        // console.log("Initializing script for page:", page); // Debug which page is detected
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
        // Add else if for index.html if it has specific scripts
        // else if (page === 'index.html') { /* init index stuff */ }
    },

    // Function to load header (returns a promise)
    async loadHeader() {
        const headerElements = document.querySelectorAll('header.header-container:empty');
        if (headerElements.length > 0) {
            try {
                // Use absolute path if header.html is always at the root
                const response = await fetch('/header.html'); // Or just 'header.html' if relative works
                if (!response.ok) throw new Error(`HTTP error ${response.status} loading header.html`);
                const data = await response.text();
                headerElements.forEach(header => {
                     if (header.innerHTML.trim() === '') {
                         header.innerHTML = data;
                     }
                });
            } catch (error) {
                console.error('Error loading header:', error);
                throw error; // Re-throw to be caught by caller
            }
        }
        return Promise.resolve(); // Resolve even if nothing to load
    }

}; // End TextileApp Object

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TextileApp.init();
});