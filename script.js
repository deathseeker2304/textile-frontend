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
    showNotification(message, isError = false) {
        let alertDiv = document.getElementById('alert-notification');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.id = 'alert-notification';
            document.body.appendChild(alertDiv);
        }
        alertDiv.textContent = message;
        alertDiv.className = isError ? 'alert-notification error' : 'alert-notification'; // Add error class if needed
        alertDiv.style.display = 'block';
        setTimeout(() => {
            if (alertDiv) alertDiv.style.display = 'none';
        }, 4000);
    },

       // PDF Viewer Functionality (REVISED FOR DYNAMIC DROPDOWNS)
       async initPDFViewer() {
       // --- Get Elements ---
const semesterSelect = document.getElementById('semester');
const classSelect = document.getElementById('class');
const teacherSelect = document.getElementById('teacher');
const chapterSelect = document.getElementById('chapter');
const pdfUrlInput = document.getElementById('pdf-url');
const uploadPdfButton = document.getElementById('upload-pdf');
const pdfList = document.getElementById('pdf-list');
const pdfViewer = document.getElementById('pdf-viewer');
const pdfViewerContainer = document.getElementById('pdf-viewer-container');
// Add Class/Teacher/Chapter buttons and inputs
const addClassButton = document.getElementById('add-class');
const addTeacherButton = document.getElementById('add-teacher');
const addChapterButton = document.getElementById('add-chapter');
const newClassInput = document.getElementById('new-class');
const newTeacherInput = document.getElementById('new-teacher');
const newChapterInput = document.getElementById('new-chapter');

// --- Check Elements ---
if (!semesterSelect || !classSelect || !teacherSelect || !chapterSelect || !pdfUrlInput || !uploadPdfButton || !pdfList || !pdfViewer || !pdfViewerContainer) {
    return; // Exit if essential elements are missing
}
// --- Helper to Populate a Select Dropdown ---  <<<<<<< PASTE HERE
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
    selectElement.disabled = !items || items.length === 0;
};

// --- Fetch and Populate Classes ---
const fetchAndPopulateClasses = async () => {
    // ...uses populateDropdown...
};

// --- Fetch and Populate Teachers ---
const fetchAndPopulateTeachers = async () => {
    // ...uses populateDropdown...
};

// --- Fetch and Populate Chapters ---
const fetchAndPopulateChapters = async () => {
    // ...uses populateDropdown...
};

// --- Add Class Functionality ---
addClassButton?.addEventListener('click', async () => {
    const semester = semesterSelect.value;
    const newClassName = newClassInput.value.trim();
    if (!semester) { alert('Please select a semester first.'); return; }
    if (!newClassName) { alert('Please enter a class name to add.'); return; }

    try {
        const response = await fetch(`${this.API_BASE_URL}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ semester: parseInt(semester, 10), className: newClassName })
        });
         if (!response.ok && response.status !== 409) { // Allow 409 Conflict (already exists)
            throw new Error(`Failed to add class: ${await response.text()}`);
         }
         const result = await response.json(); // Read body even for 200/409

         this.showNotification(result.message || `Class "${newClassName}" added for Semester ${semester}.`);
         newClassInput.value = ''; // Clear input
         // Refresh the class dropdown for the current semester
         await fetchAndPopulateClasses();
    } catch (error) {
         console.error("Error adding class:", error);
         this.showNotification(error.message, true);
    }
});
    // --- Fetch and Display PDFs (Same as before, just called differently) ---
        const displayPdfs = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;

            pdfList.innerHTML = ''; // Clear list
            pdfViewer.src = 'about:blank';
            pdfViewer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter) return;

            const queryParams = new URLSearchParams({ semester, class: selectedClass, teacher: selectedTeacher, chapter: selectedChapter }).toString();

            try {
                const response = await fetch(`${this.API_BASE_URL}/pdfs?${queryParams}`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
                const pdfs = await response.json();

                if (pdfs.length === 0) {
                    pdfList.innerHTML = '<li>No PDFs found for this selection.</li>'; return;
                }

                const table = document.createElement('table'); table.className = 'pdf-table';
                table.innerHTML = `<thead><tr><th>PDF Name</th><th>Actions</th></tr></thead><tbody></tbody>`;
                const tbody = table.querySelector('tbody');

                pdfs.forEach(pdf => { /* ... (Keep the existing forEach pdf loop content for rendering rows, rename, delete, view) ... */
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
                    // Click on PDF name to view
                    row.querySelector('.pdf-name span').addEventListener('click', () => {
                        if (pdf.url && pdf.url.includes('/preview')) {
                            pdfViewer.src = pdf.url; pdfViewer.style.display = 'block';
                            pdfViewerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            this.showNotification("Cannot display PDF directly. URL might be incorrect.", true);
                            console.warn("PDF URL missing or not embeddable:", pdf.url);
                        }
                    });
                    // Rename PDF
                    row.querySelector('.rename-pdf').addEventListener('click', async () => {
                         const pdfId = row.dataset.pdfId; const currentName = row.querySelector('.pdf-name span').textContent;
                         const newName = prompt('Enter new PDF name:', currentName);
                         if (newName && newName.trim() && newName.trim() !== currentName) {
                            try {
                                const updateResponse = await fetch(`${this.API_BASE_URL}/pdfs/${pdfId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: newName.trim() }) });
                                if (!updateResponse.ok) throw new Error(`Failed to rename: ${await updateResponse.text()}`);
                                const updatedPdf = await updateResponse.json();
                                row.querySelector('.pdf-name span').textContent = updatedPdf.file_name; this.showNotification('PDF renamed.');
                            } catch (error) { console.error(error); this.showNotification(error.message, true); }
                         }
                    });
                    // Delete PDF
                     row.querySelector('.delete-pdf').addEventListener('click', async () => {
                         const pdfId = row.dataset.pdfId; const pdfName = row.querySelector('.pdf-name span').textContent;
                         if (confirm(`Delete "${pdfName}"?`)) {
                            try {
                                const deleteResponse = await fetch(`${this.API_BASE_URL}/pdfs/${pdfId}`, { method: 'DELETE' });
                                if (!deleteResponse.ok) throw new Error(`Failed to delete: ${await deleteResponse.text()}`);
                                row.remove(); this.showNotification('PDF deleted.');
                            } catch (error) { console.error(error); this.showNotification(error.message, true); }
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
        }; // --- END of displayPdfs ---


        // --- Event Listeners for Dropdowns ---
        semesterSelect.addEventListener('change', fetchAndPopulateClasses);
        classSelect.addEventListener('change', fetchAndPopulateTeachers);
        teacherSelect.addEventListener('change', fetchAndPopulateChapters);
        chapterSelect.addEventListener('change', displayPdfs); // Only display PDFs when chapter is selected


        // --- Upload PDF Button Handler (Mostly same as before) ---
        uploadPdfButton.addEventListener('click', async () => {
            const semester = semesterSelect.value; const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value; const selectedChapter = chapterSelect.value;
            const pdfUrl = pdfUrlInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !pdfUrl) {
                alert('Please select semester, class, teacher, chapter, and enter a PDF URL.'); return;
            }
            if (!this.validateGoogleDriveUrl(pdfUrl)) {
                alert('Please enter a valid Google Drive file URL.'); return;
            }
            const embedUrl = this.getGoogleDriveEmbedUrl(pdfUrl);
            if (!embedUrl) { alert('Could not extract File ID from URL.'); return; }

            const suggestedFileName = `PDF_${embedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)[1]}.pdf`;
            const userFileName = prompt("Enter a filename for this PDF:", suggestedFileName);
            const finalFileName = (userFileName && userFileName.trim()) ? userFileName.trim() : suggestedFileName;

            const pdfData = {
                fileName: finalFileName, url: embedUrl, semester: parseInt(semester, 10),
                className: selectedClass, teacherName: selectedTeacher, chapterName: selectedChapter
            };

            try {
                const response = await fetch(`${this.API_BASE_URL}/pdfs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pdfData) });
                if (!response.ok) throw new Error(`Failed to add PDF: ${await response.text()}`);
                this.showNotification('PDF entry added.');
                pdfUrlInput.value = '';
                // Refresh the list if the added PDF matches current selection (or just always refresh)
                await displayPdfs();
                 // TODO: Optionally, refresh the category dropdowns if the added PDF introduced a new category
                 // await fetchAndPopulateChapters(); // Example if chapter might be new
            } catch (error) {
                console.error('Error adding PDF:', error);
                this.showNotification(error.message, true);
            }
        }); // --- END Upload PDF Handler ---

        // --- Initial State ---
        // Disable dropdowns except semester initially
        classSelect.disabled = true;
        teacherSelect.disabled = true;
        chapterSelect.disabled = true;

    }, // --- END initPDFViewer ---

        // Video Integration Functionality
        async initVideoIntegration() {
            // --- GET ALL ELEMENTS ---
            const semesterSelect = document.getElementById('semester-video');
            const classSelect = document.getElementById('class-video');
            const newClassInput = document.getElementById('new-class-video');
            const addClassButton = document.getElementById('add-class-video');
            const teacherSelect = document.getElementById('teacher-video');   // <<< NEEDED
            const newTeacherInput = document.getElementById('new-teacher-video');
            const addTeacherButton = document.getElementById('add-teacher-video');
            const chapterSelect = document.getElementById('chapter-video');     // <<< NEEDED
            const newChapterInput = document.getElementById('new-chapter-video');
            const addChapterButton = document.getElementById('add-chapter-video');
            const videoUrlInput = document.getElementById('video-url');
            const addVideoButton = document.getElementById('add-video-button');
            const videoList = document.getElementById('video-list');
            const videoPlayer = document.getElementById('video-player');
            const videoPlayerContainer = document.getElementById('video-player-container');
    
            // --- CHECK IF ALL ESSENTIAL ELEMENTS EXIST ---
            if (!semesterSelect || !classSelect || /*!newClassInput || !addClassButton || */ // Optional checks
                !teacherSelect || /*!newTeacherInput || !addTeacherButton ||*/              // ADDED CHECK
                !chapterSelect || /*!newChapterInput || !addChapterButton ||*/              // ADDED CHECK
                !videoUrlInput || !addVideoButton ||
                !videoList || !videoPlayer || !videoPlayerContainer ) {                    // Added container
                // console.log("Required video elements not found, skipping initVideoIntegration");
                return; // Exit if any essential element is missing
            }
            // --- END OF CHECK ---
    
    
            // --- HELPER FUNCTION TO DISPLAY VIDEOS ---
            const displayVideos = async () => {
                const semester = semesterSelect.value;
                const selectedClass = classSelect.value;
                // These lines should now work because the variables are declared and checked above
                const selectedTeacher = teacherSelect.value;
                const selectedChapter = chapterSelect.value;
    
                videoList.innerHTML = '';
                if (videoPlayer) videoPlayer.style.display = 'none';
    
                // Only fetch if all dropdowns have a selection
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
    
                        // Click to play video
                        videoItem.addEventListener('click', (e) => {
                            if (!e.target.classList.contains('delete-video')) {
                                videoPlayer.src = `https://www.youtube.com/embed/${video.video_id}`;
                                videoPlayer.style.display = 'block';
                                videoPlayerContainer?.scrollIntoView({ behavior: 'smooth' });
                            }
                        });
    
                        // Delete video button
                        videoItem.querySelector('.delete-video').addEventListener('click', async (e) => {
                            e.stopPropagation(); // Prevent triggering the play click
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
            }; // --- END OF displayVideos ---
    
    
            // --- ADD EVENT LISTENERS ---
            // These should now work correctly
            semesterSelect.addEventListener('change', displayVideos);
            classSelect.addEventListener('change', displayVideos);
            teacherSelect.addEventListener('change', displayVideos);
            chapterSelect.addEventListener('change', displayVideos);
    
            // --- Placeholder Add Functionality ---
            addClassButton?.addEventListener('click', () => alert('Add Class requires backend API.'));
            addTeacherButton?.addEventListener('click', () => alert('Add Teacher requires backend API.'));
            addChapterButton?.addEventListener('click', () => alert('Add Chapter requires backend API.'));
            // Using optional chaining (?.) in case these buttons don't exist
    
            // Add Video button Handler
            addVideoButton.addEventListener('click', async () => {
                const semester = semesterSelect.value;
                const selectedClass = classSelect.value;
                const selectedTeacher = teacherSelect.value; // Uses variable declared above
                const selectedChapter = chapterSelect.value; // Uses variable declared above
                const videoUrl = videoUrlInput.value.trim();
    
                if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !videoUrl) {
                    alert('Please select all fields and enter a YouTube Video URL.');
                    return;
                }
                if (!this.validateYouTubeUrl(videoUrl)) {
                    alert('Please enter a valid YouTube Video URL (e.g., https://youtu.be/VIDEO_ID or full URL).');
                    return;
                }
    
                const videoIdMatch = videoUrl.match(/(?:v=|v\/|embed\/|youtu\.be\/|\/user\/[^#]*#([^\/]*?\/)*?p\/a\/u\/\d+\/|(?<=watch\?v=))([^"&?\/\s]{11})/);
                if (!videoIdMatch || !videoIdMatch[2]){
                     alert('Could not extract Video ID from URL.');
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
                    await displayVideos(); // Refresh list
                } catch (error) {
                    console.error('Error adding video:', error);
                    this.showNotification(`Failed to add video: ${error.message}`, true);
                }
            }); // --- END OF Add Video Button Handler ---
    
        }, // --- END OF initVideoIntegration ---

    // Notes Functionality
    async initNotes() {
        const semesterSelect = document.getElementById('semester-notes');
        const classSelect = document.getElementById('class-notes');
        // ... (get all other notes elements) ...
        const rollSelect = document.getElementById('roll-number-notes');
        const notesContentInput = document.getElementById('notes-content');
        const uploadNotesButton = document.getElementById('upload-notes');
        const notesList = document.getElementById('notes-list');
        const notesViewer = document.getElementById('notes-viewer');
        const notesViewerContainer = document.getElementById('notes-viewer-container');

        if (!semesterSelect || !classSelect /*... add checks for all other elements ...*/ || !notesList || !notesViewer) {
            // console.log("Notes elements not found, skipping initNotes");
            return;
        }

       const displayNotes = async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = teacherSelect.value;
            const selectedChapter = chapterSelect.value;
            const selectedStudent = document.getElementById('student-name-notes').value;
            const selectedRoll = rollSelect.value;

            notesList.innerHTML = '';
            if(notesViewer) notesViewer.style.display = 'none';

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent || !selectedRoll) {
                return; // Don't fetch if criteria missing
            }

            const queryParams = new URLSearchParams({
                semester, class: selectedClass, teacher: selectedTeacher, chapter: selectedChapter, student: selectedStudent, roll: selectedRoll
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
                    // Use note.id and create a display name/preview
                    const notePreview = (note.content.length > 50) ? note.content.substring(0, 50) + '...' : note.content;
                    noteItem.innerHTML = `
                        <i class="fas fa-sticky-note" style="margin-right: 5px; color: #FFC107;"></i>
                        <span>${notePreview}</span>
                        <button class="delete-note" data-id="${note.id}" style="margin-left: auto; background-color: #F44336; color: white; border: none; padding: 3px 6px; border-radius: 3px; cursor: pointer;">Del</button>
                    `;

                    // Click to view note
                    noteItem.addEventListener('click', (e) => {
                         if (!e.target.classList.contains('delete-note')) {
                            if (this.validateUrl(note.content)) {
                                // Maybe open URL notes in new tab?
                                window.open(note.content.startsWith('http') ? note.content : 'http://' + note.content, '_blank');
                                // notesViewer.innerHTML = `<a href="${note.content}" target="_blank">Open Notes Link</a>`;
                            } else {
                                notesViewer.textContent = note.content; // Display text content
                                notesViewer.style.display = 'block';
                                notesViewerContainer?.scrollIntoView({ behavior: 'smooth' });
                            }
                         }
                    });

                    // Delete note button
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

        // Add event listeners to all dropdowns
        semesterSelect.addEventListener('change', displayNotes);
        classSelect.addEventListener('change', displayNotes);
        document.getElementById('teacher-notes')?.addEventListener('change', displayNotes);
        document.getElementById('chapter-notes')?.addEventListener('change', displayNotes);
        document.getElementById('student-name-notes')?.addEventListener('change', displayNotes);
        rollSelect.addEventListener('change', displayNotes);


       // --- Placeholder Add Functionality ---
       document.getElementById('add-class-notes')?.addEventListener('click', () => alert('Add Class requires backend API.'));
       document.getElementById('add-teacher-notes')?.addEventListener('click', () => alert('Add Teacher requires backend API.'));
       document.getElementById('add-chapter-notes')?.addEventListener('click', () => alert('Add Chapter requires backend API.'));
       document.getElementById('add-student-name-notes')?.addEventListener('click', () => alert('Add Student requires backend API.'));
       document.getElementById('add-roll-number-notes')?.addEventListener('click', () => alert('Add Roll requires backend API.'));


       // Upload notes button
       uploadNotesButton.addEventListener('click', async () => {
            const semester = semesterSelect.value;
            const selectedClass = classSelect.value;
            const selectedTeacher = document.getElementById('teacher-notes').value;
            const selectedChapter = document.getElementById('chapter-notes').value;
            const selectedStudent = document.getElementById('student-name-notes').value;
            const selectedRoll = rollSelect.value;
            const notesContent = notesContentInput.value.trim();

            if (!semester || !selectedClass || !selectedTeacher || !selectedChapter || !selectedStudent || !selectedRoll || !notesContent) {
                alert('Please select all fields and enter note content.');
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
                await displayNotes(); // Refresh list
            } catch (error) {
                console.error('Error uploading note:', error);
                this.showNotification(`Failed to upload note: ${error.message}`, true);
            }
       });
    },

    // Calendar Functionality
    async initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl || typeof FullCalendar === 'undefined') {
             // console.log("Calendar element or FullCalendar library not found, skipping initCalendar");
            return;
        }

        let calendarInstance = null; // Hold the calendar instance

        const fetchCalendarEvents = async () => {
            try {
                const response = await fetch(`${this.API_BASE_URL}/calendarEvents`);
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const events = await response.json();
                // Map DB fields to FullCalendar fields if necessary (e.g., start_time -> start)
                return events.map(event => ({
                    id: event.id, // Use DB id
                    title: event.title,
                    start: event.start_time,
                    end: event.end_time, // Might be null
                    allDay: event.all_day,
                    extendedProps: { completed: event.completed } // Store custom props here
                }));
            } catch (error) {
                console.error("Error fetching calendar events:", error);
                this.showNotification("Failed to load calendar events.", true);
                return [];
            }
        };

        calendarInstance = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth', // Changed default view
            headerToolbar: { // Added header toolbar for navigation
                 left: 'prev,next today',
                 center: 'title',
                 right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: await fetchCalendarEvents(), // Load events initially
            editable: true, // Allow drag/drop/resize
            selectable: true, // Allow clicking/dragging to select dates/times

            // Add New Event
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
                         // Add event to calendar UI (map fields if needed)
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
                calendarInstance.unselect(); // Unselect the date range
            },

            // Update Event (Drag/Drop/Resize)
            eventChange: async (changeInfo) => { // Use eventChange for drop/resize
                 const event = changeInfo.event;
                 const eventData = {
                    title: event.title, // Title might not change on drop/resize
                    start: event.startStr,
                    end: event.endStr,
                    allDay: event.allDay
                    // We don't update 'completed' status here
                 };
                try {
                    const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(eventData)
                    });
                    if (!response.ok) {
                        changeInfo.revert(); // Revert change in UI on error
                        throw new Error('Failed to update event time/date');
                    }
                     this.showNotification("Event updated.");
                } catch (error) {
                     console.error("Error updating calendar event time/date:", error);
                     this.showNotification("Failed to update event.", true);
                     changeInfo.revert();
                }
            },

             // Custom Rendering for Edit/Delete/Complete
             eventContent: (arg) => {
                 const event = arg.event;
                 const props = event.extendedProps;

                 // Create elements
                 let italicEl = document.createElement('i'); // Event title
                 let buttonsWrapper = document.createElement('div');
                 let checkbox = document.createElement('input');
                 let editButton = document.createElement('button');
                 let deleteButton = document.createElement('button');

                 // Event Title
                 italicEl.innerText = event.title;
                 if (props.completed) {
                     italicEl.style.textDecoration = 'line-through';
                     italicEl.style.opacity = '0.7';
                 }

                 // Buttons Wrapper (initially hidden)
                 buttonsWrapper.className = 'event-buttons-fc'; // Use a unique class
                 buttonsWrapper.style.display = 'none';
                 buttonsWrapper.style.marginLeft = '10px'; // Spacing
                 buttonsWrapper.style.fontSize = '0.8em'; // Smaller buttons

                 // Completed Checkbox
                 checkbox.type = 'checkbox';
                 checkbox.checked = props.completed || false;
                 checkbox.title = 'Mark as completed';
                 checkbox.addEventListener('change', async () => {
                     const isCompleted = checkbox.checked;
                     try {
                         const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ completed: isCompleted }) // Only send completed status
                         });
                         if (!response.ok) throw new Error('Failed to update completion status');
                         // Update UI immediately
                         event.setExtendedProp('completed', isCompleted); // Update internal state
                         italicEl.style.textDecoration = isCompleted ? 'line-through' : 'none';
                         italicEl.style.opacity = isCompleted ? '0.7' : '1';
                         this.showNotification("Event completion status updated.");
                     } catch (error) {
                         console.error("Error updating event completion:", error);
                         this.showNotification("Failed to update completion.", true);
                         checkbox.checked = !isCompleted; // Revert checkbox on error
                     }
                 });

                 // Edit Button
                 editButton.innerText = '✎'; // Edit icon
                 editButton.title = 'Edit title';
                 editButton.style.cursor = 'pointer';
                 editButton.style.border = 'none';
                 editButton.style.background = 'none';
                 editButton.addEventListener('click', async (e) => {
                     e.stopPropagation(); // Prevent click on event itself
                     const newTitle = prompt('Edit event title:', event.title);
                     if (newTitle && newTitle.trim() && newTitle !== event.title) {
                        try {
                             const response = await fetch(`${this.API_BASE_URL}/calendarEvents/${event.id}`, {
                                 method: 'PUT',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ title: newTitle.trim() }) // Only send title
                             });
                             if (!response.ok) throw new Error('Failed to edit event title');
                             event.setProp('title', newTitle.trim()); // Update title in calendar
                             this.showNotification("Event title updated.");
                         } catch (error) {
                             console.error("Error editing event title:", error);
                             this.showNotification("Failed to edit title.", true);
                         }
                     }
                 });

                 // Delete Button
                 deleteButton.innerText = '🗑️'; // Trash icon
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
                             event.remove(); // Remove from calendar UI
                             this.showNotification("Event deleted.");
                         } catch (error) {
                             console.error("Error deleting calendar event:", error);
                             this.showNotification("Failed to delete event.", true);
                         }
                     }
                 });

                 // Assemble buttons
                 buttonsWrapper.appendChild(checkbox);
                 buttonsWrapper.appendChild(editButton);
                 buttonsWrapper.appendChild(deleteButton);

                 // Main container for title and buttons
                 let containerEl = document.createElement('div');
                 containerEl.style.display = 'flex';
                 containerEl.style.alignItems = 'center';
                 containerEl.appendChild(italicEl);
                 containerEl.appendChild(buttonsWrapper);

                 // Show/Hide buttons on hover
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
            // console.log("Events page elements not found, skipping initEvents");
            return;
        }

        const renderEvents = (events) => {
            eventList.innerHTML = ''; // Clear list
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
                    if(confirm(`Delete event "${event.title}"?`)) {
                        try {
                             const response = await fetch(`${this.API_BASE_URL}/events/${eventId}`, { method: 'DELETE'});
                             if (!response.ok) throw new Error('Failed to delete event');
                             listItem.remove();
                             this.showNotification("Event deleted.");
                         } catch(error) {
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

        // Add event handler
        addEventButton.addEventListener('click', async () => {
            const title = eventTitleInput.value.trim();
            const date = eventDateInput.value; // Should be in YYYY-MM-DD format from input type="date"
            const description = eventDescriptionInput.value.trim();

            if (!title || !date || !description) {
                alert('Please fill in all event details.');
                return;
            }

            const eventData = { title, date, description }; // Use field names matching backend

            try {
                const response = await fetch(`${this.API_BASE_URL}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                if (!response.ok) throw new Error(`Failed to add event: ${await response.text()}`);

                this.showNotification("Event added.");
                // Clear form
                eventTitleInput.value = '';
                eventDateInput.value = '';
                eventDescriptionInput.value = '';
                // Refresh list
                await fetchAndRenderEvents();
            } catch (error) {
                console.error("Error adding event:", error);
                this.showNotification(`Failed to add event: ${error.message}`, true);
            }
        });

        // Initial load
        fetchAndRenderEvents();
    },

    // Exam Routine Functionality
    async initExamRoutine() {
        const addExamButton = document.getElementById('add-exam');
        const examForm = document.getElementById('exam-form'); // Assuming this is the container div
        const saveExamButton = document.getElementById('save-exam');
        const examTableBody = document.querySelector('#exam-table tbody');
        // Get form inputs
        const dateInput = document.getElementById('exam-date');
        const subjectInput = document.getElementById('exam-subject');
        const timeInput = document.getElementById('exam-time');
        const roomInput = document.getElementById('exam-room');


        if (!addExamButton || !examForm || !saveExamButton || !examTableBody || !dateInput || !subjectInput || !timeInput || !roomInput) {
             // console.log("Exam routine elements not found, skipping initExamRoutine");
            return;
        }

        const renderExams = (exams) => {
             examTableBody.innerHTML = ''; // Clear table body
             if (!exams || exams.length === 0) {
                 // Optional: Add a row indicating no exams
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
                        } catch(error) {
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
            } catch(error) {
                 console.error("Error fetching exams:", error);
                 this.showNotification("Could not load exams.", true);
                 examTableBody.innerHTML = '<tr><td colspan="5">Error loading exams.</td></tr>';
            }
        };

        // Show/hide form
        addExamButton.addEventListener('click', () => {
            examForm.style.display = examForm.style.display === 'none' ? 'block' : 'none';
        });

        // Save exam handler
        saveExamButton.addEventListener('click', async () => {
            const date = dateInput.value;
            const subject = subjectInput.value.trim();
            const time = timeInput.value;
            const room = roomInput.value.trim();

            if (!date || !subject || !time || !room) {
                alert('Please fill in all exam details.');
                return;
            }

            const examData = { date, subject, time, room }; // Match backend fields

             try {
                const response = await fetch(`${this.API_BASE_URL}/exams`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(examData)
                });
                if (!response.ok) throw new Error(`Failed to add exam: ${await response.text()}`);

                this.showNotification("Exam added.");
                // Clear form and hide
                dateInput.value = '';
                subjectInput.value = '';
                timeInput.value = '';
                roomInput.value = '';
                examForm.style.display = 'none';
                // Refresh list
                await fetchAndRenderExams();
            } catch (error) {
                console.error("Error adding exam:", error);
                this.showNotification(`Failed to add exam: ${error.message}`, true);
            }
        });

        // Initial load
        fetchAndRenderExams();
    },

    // Task Planner Functionality
    async initTaskPlanner() {
        const newTaskInput = document.getElementById('new-task');
        const addTaskButton = document.getElementById('add-task');
        const taskList = document.getElementById('task-list');

        if (!newTaskInput || !addTaskButton || !taskList) {
            // console.log("Task planner elements not found, skipping initTaskPlanner");
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
                listItem.dataset.taskId = task.id; // Store id on the element
                listItem.innerHTML = `
                    <input type="checkbox" class="task-completed" ${task.completed ? 'checked' : ''}>
                    <span class="task-text" style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.text}</span>
                    <button class="edit-task">Edit</button>
                    <button class="delete-task">Delete</button>
                `;

                // Checkbox handler
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
                        // No notification needed for simple toggle
                    } catch (error) {
                        console.error('Error updating task status:', error);
                        this.showNotification('Failed to update task status.', true);
                        checkbox.checked = !isCompleted; // Revert UI on error
                    }
                });

                // Edit task handler
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
                            spanElement.textContent = updatedTask.text; // Update UI
                            // this.showNotification('Task edited.'); // Optional notification
                       } catch (error) {
                           console.error('Error editing task:', error);
                           this.showNotification('Failed to edit task.', true);
                       }
                    }
                });

                // Delete task handler
                listItem.querySelector('.delete-task').addEventListener('click', async () => {
                    const taskId = listItem.dataset.taskId;
                    const taskText = listItem.querySelector('.task-text').textContent;
                    if (confirm(`Are you sure you want to delete task "${taskText}"?`)) {
                         try {
                            const response = await fetch(`${this.API_BASE_URL}/tasks/${taskId}`, { method: 'DELETE' });
                             if (!response.ok) throw new Error('Failed to delete task');
                             listItem.remove(); // Remove from UI
                             // this.showNotification('Task deleted.'); // Optional notification
                         } catch(error) {
                            console.error('Error deleting task:', error);
                            this.showNotification(`Failed to delete task: ${error.message}`, true);
                         }
                    }
                });
                taskList.appendChild(listItem);
            });
        };

        // Add task handler
        addTaskButton.addEventListener('click', async () => {
            const taskText = newTaskInput.value.trim();
            if (!taskText) {
                alert('Please enter a task.');
                return;
            }
            try {
                const response = await fetch(`${this.API_BASE_URL}/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: taskText })
                });
                 if (!response.ok) throw new Error(`Failed to add task: ${await response.text()}`);
                 // Refresh the entire list after adding
                 const updatedTasks = await fetchTasks();
                 renderTasks(updatedTasks);
                 newTaskInput.value = ''; // Clear input
                 // this.showNotification('Task added.'); // Optional
            } catch (error) {
                console.error('Error adding task:', error);
                this.showNotification(`Failed to add task: ${error.message}`, true);
            }
        });

         // Allow adding tasks with Enter key
         newTaskInput.addEventListener('keypress', (e) => {
             if (e.key === 'Enter') {
                 addTaskButton.click(); // Trigger the add button click
             }
         });

        // Initial load of tasks
        const initialTasks = await fetchTasks();
        renderTasks(initialTasks);
    },

    // Chat System Functionality (Basic - Fetch/POST only)
    async initChatSystem() {
        const messageInput = document.getElementById('message-input');
        const sendMessageButton = document.getElementById('send-message');
        const chatMessages = document.getElementById('chat-messages');

        if (!messageInput || !sendMessageButton || !chatMessages) {
             // console.log("Chat elements not found, skipping initChatSystem");
            return;
        }

         const renderMessages = (messages) => {
            chatMessages.innerHTML = ''; // Clear messages
             if (!messages || messages.length === 0) {
                 chatMessages.innerHTML = '<div>No messages yet.</div>';
                 return;
             }
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                // Use created_at from DB if available, otherwise fallback
                const timestamp = message.created_at ? new Date(message.created_at).toLocaleTimeString() : new Date().toLocaleTimeString();
                messageElement.textContent = `[${timestamp}] ${message.text}`;
                chatMessages.appendChild(messageElement);
            });
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
         };

         const fetchAndRenderMessages = async () => {
             try {
                 const response = await fetch(`${this.API_BASE_URL}/chatMessages?limit=100`); // Get last 100
                 if (!response.ok) throw new Error('Failed to load messages');
                 const messages = await response.json();
                 renderMessages(messages);
             } catch(error) {
                 console.error("Error fetching chat messages:", error);
                 this.showNotification("Failed to load chat messages.", true);
                 chatMessages.innerHTML = '<div>Error loading messages.</div>';
             }
         };

         // Send Message Handler
        sendMessageButton.addEventListener('click', async () => {
            const messageText = messageInput.value.trim();
            if (!messageText) {
                // Don't send empty messages
                return;
            }

            try {
                 const response = await fetch(`${this.API_BASE_URL}/chatMessages`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ text: messageText })
                 });
                 if (!response.ok) throw new Error(`Failed to send message: ${await response.text()}`);
                 messageInput.value = ''; // Clear input
                 // Refresh messages after sending
                 await fetchAndRenderMessages();
            } catch(error) {
                console.error("Error sending message:", error);
                this.showNotification(`Failed to send message: ${error.message}`, true);
            }
        });

        // Allow sending messages with Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessageButton.click();
            }
        });

        // Initial load
        fetchAndRenderMessages();

        // Basic polling (optional, inefficient for real chat)
        // setInterval(fetchAndRenderMessages, 15000); // Refresh every 15 seconds
    },

    // Initialize based on the current page
    init() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';

        // Find the header container on the current page, if it exists.
        const headerContainer = document.querySelector('header.header-container');

        if (headerContainer) {
             // Load header only if the container is present
             this.loadHeader().then(() => {
                 // Initialize page-specific scripts AFTER header is potentially loaded
                 this.initializePageScript(page);
             }).catch(error => {
                 console.error("Failed to load header, proceeding with page script init.", error);
                 this.initializePageScript(page);
             });
        } else {
            // If no header container, initialize page script directly
             this.initializePageScript(page);
        }
    },

    // Helper function to run page-specific init logic
    initializePageScript(page) {
        if (page === 'pdfs.html' || page==='') { // Treat empty path as index/pdf maybe? Adjust as needed
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
        // Add other page checks here if needed
    },

    // Function to load header (returns a promise)
    async loadHeader() {
        // Find header elements again within this function scope
        const headerElements = document.querySelectorAll('header.header-container:empty'); // Select only empty ones to avoid multiple loads
        if (headerElements.length > 0) {
            try {
                const response = await fetch('header.html');
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                const data = await response.text();
                headerElements.forEach(header => {
                    // Replace the placeholder's inner content instead of outerHTML
                    // This assumes header.html contains the CONTENT for the header,
                    // not the <header> tag itself. Adjust if header.html includes <header> tag.
                    if (header.innerHTML.trim() === '') { // Only fill if empty
                         header.innerHTML = data;
                    }
                });
            } catch (error) {
                console.error('Error loading header:', error);
                // Propagate the error so the caller knows
                throw error;
            }
        }
        // If no header elements found or needed loading, resolve immediately
        return Promise.resolve();
    }

}; // End TextileApp Object

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    TextileApp.init();
});