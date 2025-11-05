// Resume Builder Main Functionality
(function() {
    'use strict';

    // Current resume being edited
    let currentResumeId = null;
    let hasUnsavedChanges = false;
    let autosaveTimer = null;

    // Initialize the application
    function init() {
        setupDynamicFields();
        setupFormHandlers();
        setupDashboard();
        setupDownloadButtons();
        setupProgressTracker();
        setupCharacterCounters();
        setupBackToTop();
        setupUnsavedChangesWarning();
        setupKeyboardShortcuts();
        loadCurrentResume();
    }

    // Setup dynamic field addition/removal
    function setupDynamicFields() {
        // Add Education Entry
        const addEducationBtn = document.getElementById('add-education-btn');
        if (addEducationBtn) {
            addEducationBtn.addEventListener('click', function() {
                const container = document.getElementById('education-container');
                const entry = createEducationEntry();
                container.appendChild(entry);
            });
        }

        // Add Work Experience Entry
        const addExperienceBtn = document.getElementById('add-experience-btn');
        if (addExperienceBtn) {
            addExperienceBtn.addEventListener('click', function() {
                const container = document.getElementById('experience-container');
                const entry = createExperienceEntry();
                container.appendChild(entry);
            });
        }

        // Add Skill Entry
        const addSkillBtn = document.getElementById('add-skill-btn');
        if (addSkillBtn) {
            addSkillBtn.addEventListener('click', function() {
                const container = document.getElementById('skills-container');
                const entry = createSkillEntry();
                container.appendChild(entry);
            });
        }
    }

    // Create education entry element
    function createEducationEntry() {
        const div = document.createElement('div');
        div.className = 'education-entry dynamic-entry';
        div.innerHTML = `
            <div class="entry-header">
                <h4>Education Entry</h4>
                <button type="button" class="remove-entry-btn">Remove</button>
            </div>
            <div class="form-group">
                <label>Degree:</label>
                <input type="text" name="education_degree[]" placeholder="e.g., Bachelor of Science">
            </div>
            <div class="form-group">
                <label>Major:</label>
                <input type="text" name="education_major[]" placeholder="e.g., Computer Science">
            </div>
            <div class="form-group">
                <label>School/University:</label>
                <input type="text" name="education_school[]" placeholder="e.g., University Name">
            </div>
            <div class="form-group">
                <label>Year of Graduation:</label>
                <input type="text" name="education_year[]" placeholder="e.g., 2024">
            </div>
        `;

        // Add remove functionality
        const removeBtn = div.querySelector('.remove-entry-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            // Trigger preview update
            const event = new Event('input', { bubbles: true });
            document.getElementById('resume-form').dispatchEvent(event);
        });

        return div;
    }

    // Create experience entry element
    function createExperienceEntry() {
        const div = document.createElement('div');
        div.className = 'experience-entry dynamic-entry';
        div.innerHTML = `
            <div class="entry-header">
                <h4>Experience Entry</h4>
                <button type="button" class="remove-entry-btn">Remove</button>
            </div>
            <div class="form-group">
                <label>Position:</label>
                <input type="text" name="work_position[]" placeholder="e.g., Software Engineer">
            </div>
            <div class="form-group">
                <label>Company:</label>
                <input type="text" name="work_company[]" placeholder="e.g., Company Name">
            </div>
            <div class="form-group">
                <label>Duration:</label>
                <input type="text" name="work_duration[]" placeholder="e.g., Jan 2020 - Dec 2022">
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea name="work_description[]" placeholder="Describe your responsibilities and achievements..."></textarea>
            </div>
        `;

        // Add remove functionality
        const removeBtn = div.querySelector('.remove-entry-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            // Trigger preview update
            const event = new Event('input', { bubbles: true });
            document.getElementById('resume-form').dispatchEvent(event);
        });

        return div;
    }

    // Create skill entry element
    function createSkillEntry() {
        const div = document.createElement('div');
        div.className = 'skill-entry';
        div.innerHTML = `
            <div class="skill-input-group">
                <input type="text" name="skill[]" placeholder="e.g., JavaScript">
                <button type="button" class="remove-skill-btn">×</button>
            </div>
        `;

        // Add remove functionality
        const removeBtn = div.querySelector('.remove-skill-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            // Trigger preview update
            const event = new Event('input', { bubbles: true });
            document.getElementById('resume-form').dispatchEvent(event);
        });

        return div;
    }

    // Validate form data
    function validateForm(silent = false) {
        const fullName = document.getElementById('full_name')?.value.trim();
        const email = document.getElementById('email')?.value.trim();

        if (!fullName) {
            if (!silent) {
                showNotification('Please enter your full name', 'error');
                document.getElementById('full_name')?.focus();
                const errorEl = document.getElementById('full_name-error');
                if (errorEl) errorEl.textContent = 'Full name is required';
            }
            return false;
        }

        if (!email) {
            if (!silent) {
                showNotification('Please enter your email address', 'error');
                document.getElementById('email')?.focus();
                const errorEl = document.getElementById('email-error');
                if (errorEl) errorEl.textContent = 'Email address is required';
            }
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            if (!silent) {
                showNotification('Please enter a valid email address', 'error');
                document.getElementById('email')?.focus();
                const errorEl = document.getElementById('email-error');
                if (errorEl) errorEl.textContent = 'Please enter a valid email address';
            }
            return false;
        }

        // Clear errors if validation passes
        if (!silent) {
            const fullNameError = document.getElementById('full_name-error');
            const emailError = document.getElementById('email-error');
            if (fullNameError) fullNameError.textContent = '';
            if (emailError) emailError.textContent = '';
        }

        return true;
    }

    // Setup form submission and save handlers
    function setupFormHandlers() {
        const form = document.getElementById('resume-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                if (validateForm()) {
                    saveResume();
                    showNotification('Resume saved successfully!', 'success');
                }
            });
        }

        // Save button handler
        const saveBtn = document.getElementById('save-resume-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (validateForm()) {
                    saveResume();
                    showNotification('Resume saved successfully!', 'success');
                }
            });
        }

        // New resume button
        const newResumeBtn = document.getElementById('new-resume-btn');
        if (newResumeBtn) {
            newResumeBtn.addEventListener('click', function() {
                if (confirm('Create a new resume? Unsaved changes will be lost.')) {
                    currentResumeId = null;
                    document.getElementById('resume-form').reset();
                    showNotification('Started new resume', 'info');
                }
            });
        }
    }

    // Save resume to localStorage
    function saveResume() {
        const formData = getFormData();
        const template = document.getElementById('template-select')?.value || 'template1';

        const resume = {
            id: currentResumeId || generateId(),
            title: formData.fullName || 'Untitled Resume',
            data: formData,
            template: template,
            createdAt: currentResumeId ? getResumeById(currentResumeId)?.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        currentResumeId = resume.id;

        // Get existing resumes
        let resumes = getResumes();

        // Update or add resume
        const index = resumes.findIndex(r => r.id === resume.id);
        if (index !== -1) {
            resumes[index] = resume;
        } else {
            resumes.push(resume);
        }

        // Save to localStorage
        localStorage.setItem('resumes', JSON.stringify(resumes));

        // Update dashboard
        updateDashboard();

        return resume;
    }

    // Get form data
    function getFormData() {
        return {
            fullName: document.getElementById('full_name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            education: getEducationData(),
            experience: getExperienceData(),
            skills: getSkillsData()
        };
    }

    // Get education data from form
    function getEducationData() {
        const entries = [];
        const containers = document.querySelectorAll('.education-entry');

        if (containers.length === 0) {
            const degree = document.getElementById('education_degree')?.value || '';
            const major = document.getElementById('education_major')?.value || '';
            const school = document.getElementById('education_school')?.value || '';
            const year = document.getElementById('education_year')?.value || '';

            if (degree || major || school || year) {
                entries.push({ degree, major, school, year });
            }
        } else {
            containers.forEach(container => {
                const degree = container.querySelector('[name="education_degree[]"]')?.value || '';
                const major = container.querySelector('[name="education_major[]"]')?.value || '';
                const school = container.querySelector('[name="education_school[]"]')?.value || '';
                const year = container.querySelector('[name="education_year[]"]')?.value || '';

                if (degree || major || school || year) {
                    entries.push({ degree, major, school, year });
                }
            });
        }

        return entries;
    }

    // Get experience data from form
    function getExperienceData() {
        const entries = [];
        const containers = document.querySelectorAll('.experience-entry');

        if (containers.length === 0) {
            const position = document.getElementById('work_position')?.value || '';
            const company = document.getElementById('work_company')?.value || '';
            const duration = document.getElementById('work_duration')?.value || '';
            const description = document.getElementById('work_description')?.value || '';

            if (position || company || duration || description) {
                entries.push({ position, company, duration, description });
            }
        } else {
            containers.forEach(container => {
                const position = container.querySelector('[name="work_position[]"]')?.value || '';
                const company = container.querySelector('[name="work_company[]"]')?.value || '';
                const duration = container.querySelector('[name="work_duration[]"]')?.value || '';
                const description = container.querySelector('[name="work_description[]"]')?.value || '';

                if (position || company || duration || description) {
                    entries.push({ position, company, duration, description });
                }
            });
        }

        return entries;
    }

    // Get skills data from form
    function getSkillsData() {
        const skills = [];
        const skillContainers = document.querySelectorAll('.skill-entry');

        if (skillContainers.length === 0) {
            for (let i = 1; i <= 10; i++) {
                const skillInput = document.getElementById(`skill${i}`);
                if (skillInput && skillInput.value.trim()) {
                    skills.push(skillInput.value.trim());
                }
            }
        } else {
            skillContainers.forEach(container => {
                const skillInput = container.querySelector('[name="skill[]"]');
                if (skillInput && skillInput.value.trim()) {
                    skills.push(skillInput.value.trim());
                }
            });
        }

        return skills;
    }

    // Get all resumes from localStorage
    function getResumes() {
        const resumes = localStorage.getItem('resumes');
        return resumes ? JSON.parse(resumes) : [];
    }

    // Get resume by ID
    function getResumeById(id) {
        const resumes = getResumes();
        return resumes.find(r => r.id === id);
    }

    // Load resume into form
    function loadResume(id) {
        const resume = getResumeById(id);
        if (!resume) {
            showNotification('Resume not found', 'error');
            return;
        }

        currentResumeId = id;
        const data = resume.data;

        // Load basic info
        document.getElementById('full_name').value = data.fullName || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('phone').value = data.phone || '';

        // Load template
        if (document.getElementById('template-select')) {
            document.getElementById('template-select').value = resume.template || 'template1';
        }

        // Clear and load education (will be implemented with dynamic fields)
        // Clear and load experience (will be implemented with dynamic fields)
        // Clear and load skills (will be implemented with dynamic fields)

        // Trigger preview update
        const event = new Event('input', { bubbles: true });
        document.getElementById('resume-form')?.dispatchEvent(event);

        showNotification('Resume loaded successfully', 'success');

        // Scroll to form
        document.getElementById('resume-editor')?.scrollIntoView({ behavior: 'smooth' });
    }

    // Load current/latest resume
    function loadCurrentResume() {
        const resumes = getResumes();
        if (resumes.length > 0) {
            // Load the most recently updated resume
            const latest = resumes.reduce((prev, current) =>
                new Date(current.updatedAt) > new Date(prev.updatedAt) ? current : prev
            );
            currentResumeId = latest.id;
        }
    }

    // Setup dashboard
    function setupDashboard() {
        updateDashboard();

        // Toggle dashboard visibility
        const dashboardBtn = document.getElementById('show-dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', function() {
                const dashboard = document.getElementById('user-dashboard');
                if (dashboard) {
                    dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    // Update dashboard with saved resumes
    function updateDashboard() {
        const resumeList = document.querySelector('.resume-list');
        if (!resumeList) return;

        const resumes = getResumes();

        if (resumes.length === 0) {
            resumeList.innerHTML = '<p>No saved resumes yet. Create your first resume!</p>';
            return;
        }

        resumeList.innerHTML = resumes.map(resume => `
            <div class="resume-item" data-id="${resume.id}">
                <h3>${resume.title}</h3>
                <p>Created: ${new Date(resume.createdAt).toLocaleDateString()}</p>
                <p>Last Modified: ${new Date(resume.updatedAt).toLocaleDateString()}</p>
                <div class="resume-actions">
                    <button class="edit-btn" data-id="${resume.id}">Edit</button>
                    <button class="download-btn" data-id="${resume.id}">Download</button>
                    <button class="delete-btn" data-id="${resume.id}">Delete</button>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        resumeList.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                loadResume(this.dataset.id);
            });
        });

        resumeList.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                downloadResumePDF(this.dataset.id);
            });
        });

        resumeList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm('Are you sure you want to delete this resume?')) {
                    deleteResume(this.dataset.id);
                }
            });
        });
    }

    // Delete resume
    function deleteResume(id) {
        let resumes = getResumes();
        resumes = resumes.filter(r => r.id !== id);
        localStorage.setItem('resumes', JSON.stringify(resumes));

        if (currentResumeId === id) {
            currentResumeId = null;
            document.getElementById('resume-form')?.reset();
        }

        updateDashboard();
        showNotification('Resume deleted', 'info');
    }

    // Setup download buttons
    function setupDownloadButtons() {
        // PDF Download button
        const downloadPdfBtn = document.getElementById('download-pdf-btn');
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', function() {
                downloadPdfBtn.classList.add('loading');
                downloadPdfBtn.disabled = true;

                setTimeout(() => {
                    downloadCurrentResume();
                    downloadPdfBtn.classList.remove('loading');
                    downloadPdfBtn.disabled = false;
                }, 500);
            });
        }

        // JSON Export button
        const exportJsonBtn = document.getElementById('export-json-btn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', exportAsJSON);
        }

        // Legacy download buttons in dashboard
        const legacyDownloadBtns = document.querySelectorAll('.download-btn');
        legacyDownloadBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                downloadCurrentResume();
            });
        });
    }

    // Download current resume as PDF
    function downloadCurrentResume() {
        if (!currentResumeId) {
            // Save first
            const resume = saveResume();
            currentResumeId = resume.id;
        }
        downloadResumePDF(currentResumeId);
    }

    // Download resume by ID as PDF
    function downloadResumePDF(id) {
        const resume = getResumeById(id);
        if (!resume) {
            showNotification('Resume not found', 'error');
            return;
        }

        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            showNotification('PDF library not loaded. Please refresh the page.', 'error');
            return;
        }

        // Create preview element
        const previewElement = document.createElement('div');
        previewElement.style.position = 'absolute';
        previewElement.style.left = '-9999px';
        document.body.appendChild(previewElement);

        // Generate resume HTML
        const resumeHTML = generateResumeHTML(resume.data, resume.template);
        previewElement.innerHTML = resumeHTML;

        // PDF options
        const options = {
            margin: 10,
            filename: `${resume.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate PDF
        html2pdf().set(options).from(previewElement).save().then(() => {
            document.body.removeChild(previewElement);
            showNotification('Resume downloaded successfully!', 'success');
        });
    }

    // Generate resume HTML based on template
    function generateResumeHTML(data, template) {
        // Use the template generation functions from templates.js
        // This is a simplified version - in production, share template functions
        switch (template) {
            case 'template1':
                return generateTemplate1HTML(data);
            case 'template2':
                return generateTemplate2HTML(data);
            case 'template3':
                return generateTemplate3HTML(data);
            default:
                return generateTemplate1HTML(data);
        }
    }

    // Simplified template generators (these should match templates.js)
    function generateTemplate1HTML(data) {
        return `
            <div class="resume-template template1-design" style="font-family: Arial, sans-serif; padding: 30px; background: white;">
                <div style="text-align: center; border-bottom: 3px solid #57078f; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="font-size: 32px; color: #57078f; margin-bottom: 10px;">${data.fullName || 'Your Name'}</h1>
                    <div style="font-size: 14px; color: #666;">
                        ${data.email ? `<span>${data.email}</span>` : ''}
                        ${data.phone ? `<span style="margin: 0 15px;">${data.phone}</span>` : ''}
                    </div>
                </div>
                ${data.education.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 20px; color: #57078f; border-bottom: 2px solid #57078f; padding-bottom: 5px; margin-bottom: 15px;">Education</h2>
                    ${data.education.map(edu => `
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between;">
                                <h3 style="font-size: 18px; margin: 0;">${edu.degree}</h3>
                                <span style="font-size: 14px; color: #666; font-style: italic;">${edu.year}</span>
                            </div>
                            <p style="font-size: 16px; color: #555; margin: 5px 0;">${edu.school}</p>
                            ${edu.major ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">Major: ${edu.major}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                ${data.experience.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h2 style="font-size: 20px; color: #57078f; border-bottom: 2px solid #57078f; padding-bottom: 5px; margin-bottom: 15px;">Work Experience</h2>
                    ${data.experience.map(exp => `
                        <div style="margin-bottom: 15px;">
                            <div style="display: flex; justify-content: space-between;">
                                <h3 style="font-size: 18px; margin: 0;">${exp.position}</h3>
                                <span style="font-size: 14px; color: #666; font-style: italic;">${exp.duration}</span>
                            </div>
                            <p style="font-size: 16px; color: #555; margin: 5px 0;">${exp.company}</p>
                            ${exp.description ? `<p style="font-size: 14px; color: #666; margin: 5px 0;">${exp.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                ${data.skills.length > 0 ? `
                <div>
                    <h2 style="font-size: 20px; color: #57078f; border-bottom: 2px solid #57078f; padding-bottom: 5px; margin-bottom: 15px;">Skills</h2>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${data.skills.map(skill => `<span style="background: #57078f; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    function generateTemplate2HTML(data) {
        return generateTemplate1HTML(data); // Simplified for now
    }

    function generateTemplate3HTML(data) {
        return generateTemplate1HTML(data); // Simplified for now
    }

    // Utility: Generate unique ID
    function generateId() {
        return 'resume_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Setup progress tracker
    function setupProgressTracker() {
        const form = document.getElementById('resume-form');
        if (form) {
            form.addEventListener('input', updateProgress);
            updateProgress(); // Initial calculation
        }
    }

    // Calculate and update progress
    function updateProgress() {
        const requiredFields = {
            fullName: document.getElementById('full_name')?.value.trim() || '',
            email: document.getElementById('email')?.value.trim() || '',
            phone: document.getElementById('phone')?.value.trim() || ''
        };

        const education = getEducationData();
        const experience = getExperienceData();
        const skills = getSkillsData();

        let completed = 0;
        let total = 8; // Total criteria

        // Required fields (2 points each)
        if (requiredFields.fullName) completed++;
        if (requiredFields.email) completed++;

        // Optional but important fields
        if (requiredFields.phone) completed++;
        if (education.length > 0) completed++;
        if (experience.length > 0) completed++;
        if (skills.length >= 3) completed++;

        // Bonus for detailed info
        if (experience.length > 0 && experience[0].description) completed++;
        if (education.length > 0 && education[0].major) completed++;

        const percentage = Math.round((completed / total) * 100);

        const progressBar = document.getElementById('progress-bar-fill');
        const progressPercentage = document.getElementById('progress-percentage');

        if (progressBar) progressBar.style.width = percentage + '%';
        if (progressPercentage) progressPercentage.textContent = percentage + '%';

        // Trigger autosave
        triggerAutosave();
    }

    // Trigger autosave with debouncing
    function triggerAutosave() {
        hasUnsavedChanges = true;

        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.textContent = 'Saving...';
            indicator.className = 'autosave-saving';
        }

        // Clear existing timer
        if (autosaveTimer) clearTimeout(autosaveTimer);

        // Set new timer
        autosaveTimer = setTimeout(() => {
            if (validateForm(true)) { // Silent validation
                saveResume();
                hasUnsavedChanges = false;

                if (indicator) {
                    indicator.textContent = '✓ Saved';
                    indicator.className = 'autosave-saved';

                    setTimeout(() => {
                        indicator.textContent = '';
                        indicator.className = '';
                    }, 2000);
                }
            }
        }, 1500); // Autosave after 1.5 seconds of inactivity
    }

    // Setup character counters
    function setupCharacterCounters() {
        const textarea = document.getElementById('work_description');
        const counter = document.getElementById('work_description-count');

        if (textarea && counter) {
            const updateCounter = () => {
                const length = textarea.value.length;
                const maxLength = textarea.maxLength || 1000;
                counter.textContent = length;

                // Color coding
                const parent = counter.parentElement;
                parent.classList.remove('warning', 'danger');

                if (length > maxLength * 0.9) {
                    parent.classList.add('danger');
                } else if (length > maxLength * 0.7) {
                    parent.classList.add('warning');
                }
            };

            textarea.addEventListener('input', updateCounter);
            updateCounter();
        }
    }

    // Setup back to top button
    function setupBackToTop() {
        const backToTopBtn = document.getElementById('back-to-top');

        if (backToTopBtn) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTopBtn.style.display = 'block';
                } else {
                    backToTopBtn.style.display = 'none';
                }
            });

            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    // Setup unsaved changes warning
    function setupUnsavedChangesWarning() {
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    // Setup keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (validateForm()) {
                    saveResume();
                    showNotification('Resume saved!', 'success');
                }
            }

            // Ctrl/Cmd + P to download PDF
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                const downloadBtn = document.getElementById('download-pdf-btn');
                if (downloadBtn) downloadBtn.click();
            }
        });

        // Setup shortcuts modal
        const shortcutsBtn = document.getElementById('shortcuts-help-btn');
        const shortcutsModal = document.getElementById('shortcuts-modal');
        const shortcutsClose = document.getElementById('shortcuts-close');

        if (shortcutsBtn && shortcutsModal) {
            shortcutsBtn.addEventListener('click', () => {
                shortcutsModal.style.display = 'block';
            });

            if (shortcutsClose) {
                shortcutsClose.addEventListener('click', () => {
                    shortcutsModal.style.display = 'none';
                });
            }

            // Close on outside click
            window.addEventListener('click', (e) => {
                if (e.target === shortcutsModal) {
                    shortcutsModal.style.display = 'none';
                }
            });
        }
    }

    // Enhanced validation with silent mode
    function validateFormEnhanced(silent = false) {
        let isValid = true;
        const errors = {};

        const fullName = document.getElementById('full_name');
        const email = document.getElementById('email');

        // Validate full name
        if (!fullName?.value.trim()) {
            errors.full_name = 'Full name is required';
            isValid = false;
        }

        // Validate email
        if (!email?.value.trim()) {
            errors.email = 'Email address is required';
            isValid = false;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                errors.email = 'Please enter a valid email address';
                isValid = false;
            }
        }

        // Display errors if not silent
        if (!silent) {
            // Clear previous errors
            document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
            document.querySelectorAll('input.error, textarea.error').forEach(el => el.classList.remove('error'));

            // Show new errors
            Object.keys(errors).forEach(field => {
                const errorEl = document.getElementById(`${field}-error`);
                const inputEl = document.getElementById(field);

                if (errorEl) errorEl.textContent = errors[field];
                if (inputEl) inputEl.classList.add('error');
            });

            if (!isValid) {
                showNotification('Please fix the errors in the form', 'error');
            }
        }

        return isValid;
    }

    // Export resume as JSON
    function exportAsJSON() {
        const resume = getResumeById(currentResumeId);
        if (!resume) {
            showNotification('Please save your resume first', 'error');
            return;
        }

        const dataStr = JSON.stringify(resume, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${resume.title.replace(/[^a-z0-9]/gi, '_')}_backup.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showNotification('Resume backup downloaded', 'success');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
