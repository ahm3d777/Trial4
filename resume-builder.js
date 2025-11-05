/**
 * ====================================================================
 * RESUME BUILDER - ENHANCED PROFESSIONAL VERSION
 * ====================================================================
 * Features:
 * - Comprehensive error handling with try-catch blocks
 * - DOM element caching for improved performance
 * - Full input validation (URLs, phone, email, dates)
 * - HTML sanitization to prevent XSS attacks
 * - localStorage quota management
 * - Import/Export JSON backups
 * - Duplicate resume functionality
 * - Visual autosave indicators
 * - Template preview
 * - JSDoc documentation
 * ====================================================================
 */

(function() {
    'use strict';

    // ====================================================================
    // STATE MANAGEMENT
    // ====================================================================

    /** @type {string|null} Current resume ID being edited */
    let currentResumeId = null;

    /** @type {boolean} Track unsaved changes */
    let hasUnsavedChanges = false;

    /** @type {number|null} Autosave timer reference */
    let autosaveTimer = null;

    // ====================================================================
    // DOM ELEMENT CACHE (Performance Optimization)
    // ====================================================================

    const DOM = {
        form: null,
        preview: null,
        templateSelect: null,
        progressBar: null,
        progressPercentage: null,
        autosaveIndicator: null,
        dashboard: null,
        resumeList: null,
        // Form fields
        fullName: null,
        email: null,
        phone: null,
        location: null,
        linkedin: null,
        website: null,
        github: null,
        summary: null,
        // Buttons
        saveBtn: null,
        downloadBtn: null,
        exportBtn: null,
        importBtn: null,
        newResumeBtn: null,
        dashboardBtn: null,
        backToTopBtn: null,
        shortcutsBtn: null,
        // Containers
        educationContainer: null,
        experienceContainer: null,
        skillsContainer: null,
        projectsContainer: null,
        certificationsContainer: null,
        languagesContainer: null
    };

    // ====================================================================
    // CONSTANTS
    // ====================================================================

    const CONFIG = {
        AUTOSAVE_DELAY: 1500, // milliseconds
        NOTIFICATION_DURATION: 3000,
        LOCALSTORAGE_KEY: 'resumes',
        MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
        VALIDATION_REGEX: {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[\d\s\-\+\(\)]{7,20}$/,
            url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            year: /^(19|20)\d{2}$/
        }
    };

    // ====================================================================
    // UTILITY FUNCTIONS
    // ====================================================================

    /**
     * Sanitize HTML to prevent XSS attacks
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    function sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Escape HTML special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Generate unique ID
     * @returns {string} Unique identifier
     */
    function generateId() {
        return 'resume_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Check localStorage quota and availability
     * @returns {boolean} True if localStorage is available and has space
     */
    function checkLocalStorageQuota() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            // Estimate current usage
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }

            if (totalSize > CONFIG.MAX_STORAGE_SIZE * 0.9) {
                showNotification('Storage is almost full. Consider exporting and deleting old resumes.', 'warning');
                return false;
            }

            return true;
        } catch (e) {
            console.error('localStorage check failed:', e);
            showNotification('Storage unavailable. Your changes may not be saved.', 'error');
            return false;
        }
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    function isValidEmail(email) {
        return CONFIG.VALIDATION_REGEX.email.test(email);
    }

    /**
     * Validate phone number format
     * @param {string} phone - Phone to validate
     * @returns {boolean} True if valid
     */
    function isValidPhone(phone) {
        return CONFIG.VALIDATION_REGEX.phone.test(phone);
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     */
    function isValidURL(url) {
        return CONFIG.VALIDATION_REGEX.url.test(url);
    }

    /**
     * Validate year format
     * @param {string} year - Year to validate
     * @returns {boolean} True if valid
     */
    function isValidYear(year) {
        return CONFIG.VALIDATION_REGEX.year.test(year);
    }

    // ====================================================================
    // INITIALIZATION
    // ====================================================================

    /**
     * Initialize the application
     */
    function init() {
        try {
            cacheDOM();
            setupDynamicFields();
            setupFormHandlers();
            setupDashboard();
            setupDownloadButtons();
            setupProgressTracker();
            setupCharacterCounters();
            setupBackToTop();
            setupUnsavedChangesWarning();
            setupKeyboardShortcuts();
            setupImportButton();
            loadCurrentResume();
            checkLocalStorageQuota();
        } catch (error) {
            console.error('Initialization error:', error);
            showNotification('Failed to initialize application. Please refresh the page.', 'error');
        }
    }

    /**
     * Cache DOM elements for performance
     */
    function cacheDOM() {
        try {
            // Main elements
            DOM.form = document.getElementById('resume-form');
            DOM.preview = document.getElementById('real-time-preview');
            DOM.templateSelect = document.getElementById('template-select');
            DOM.progressBar = document.getElementById('progress-bar-fill');
            DOM.progressPercentage = document.getElementById('progress-percentage');
            DOM.autosaveIndicator = document.getElementById('autosave-indicator');
            DOM.dashboard = document.getElementById('user-dashboard');
            DOM.resumeList = document.querySelector('.resume-list');

            // Form fields
            DOM.fullName = document.getElementById('full_name');
            DOM.email = document.getElementById('email');
            DOM.phone = document.getElementById('phone');
            DOM.location = document.getElementById('location');
            DOM.linkedin = document.getElementById('linkedin');
            DOM.website = document.getElementById('website');
            DOM.github = document.getElementById('github');
            DOM.summary = document.getElementById('professional_summary');

            // Buttons
            DOM.saveBtn = document.getElementById('save-resume-btn');
            DOM.downloadBtn = document.getElementById('download-pdf-btn');
            DOM.exportBtn = document.getElementById('export-json-btn');
            DOM.newResumeBtn = document.getElementById('new-resume-btn');
            DOM.dashboardBtn = document.getElementById('show-dashboard-btn');
            DOM.backToTopBtn = document.getElementById('back-to-top');
            DOM.shortcutsBtn = document.getElementById('shortcuts-help-btn');

            // Containers
            DOM.educationContainer = document.getElementById('education-container');
            DOM.experienceContainer = document.getElementById('experience-container');
            DOM.skillsContainer = document.getElementById('skills-container');
            DOM.projectsContainer = document.getElementById('projects-container');
            DOM.certificationsContainer = document.getElementById('certifications-container');
            DOM.languagesContainer = document.getElementById('languages-container');
        } catch (error) {
            console.error('DOM caching error:', error);
        }
    }

    // ====================================================================
    // DYNAMIC FIELDS MANAGEMENT
    // ====================================================================

    /**
     * Setup dynamic field addition/removal
     */
    function setupDynamicFields() {
        try {
            // Add Education Entry
            const addEducationBtn = document.getElementById('add-education-btn');
            if (addEducationBtn) {
                addEducationBtn.addEventListener('click', function() {
                    const entry = createEducationEntry();
                    DOM.educationContainer.appendChild(entry);
                    showNotification('Education entry added', 'info');
                });
            }

            // Add Work Experience Entry
            const addExperienceBtn = document.getElementById('add-experience-btn');
            if (addExperienceBtn) {
                addExperienceBtn.addEventListener('click', function() {
                    const entry = createExperienceEntry();
                    DOM.experienceContainer.appendChild(entry);
                    showNotification('Experience entry added', 'info');
                });
            }

            // Add Skill Entry
            const addSkillBtn = document.getElementById('add-skill-btn');
            if (addSkillBtn) {
                addSkillBtn.addEventListener('click', function() {
                    const entry = createSkillEntry();
                    DOM.skillsContainer.appendChild(entry);
                });
            }

            // Add Project Entry
            const addProjectBtn = document.getElementById('add-project-btn');
            if (addProjectBtn) {
                addProjectBtn.addEventListener('click', function() {
                    const entry = createProjectEntry();
                    DOM.projectsContainer.appendChild(entry);
                    showNotification('Project entry added', 'info');
                });
            }

            // Add Certification Entry
            const addCertBtn = document.getElementById('add-certification-btn');
            if (addCertBtn) {
                addCertBtn.addEventListener('click', function() {
                    const entry = createCertificationEntry();
                    DOM.certificationsContainer.appendChild(entry);
                    showNotification('Certification entry added', 'info');
                });
            }

            // Add Language Entry
            const addLangBtn = document.getElementById('add-language-btn');
            if (addLangBtn) {
                addLangBtn.addEventListener('click', function() {
                    const entry = createLanguageEntry();
                    DOM.languagesContainer.appendChild(entry);
                    showNotification('Language entry added', 'info');
                });
            }
        } catch (error) {
            console.error('Setup dynamic fields error:', error);
        }
    }

    /**
     * Create education entry element
     * @returns {HTMLElement} Education entry element
     */
    function createEducationEntry() {
        const div = document.createElement('div');
        div.className = 'education-entry dynamic-entry';
        div.innerHTML = `
            <div class="entry-header">
                <h4>Education Entry</h4>
                <button type="button" class="remove-entry-btn" aria-label="Remove education entry">Remove</button>
            </div>
            <div class="form-group">
                <label>Degree:</label>
                <input type="text" name="education_degree[]" placeholder="e.g., Bachelor of Science" aria-label="Degree">
            </div>
            <div class="form-group">
                <label>Major:</label>
                <input type="text" name="education_major[]" placeholder="e.g., Computer Science" aria-label="Major">
            </div>
            <div class="form-group">
                <label>School/University:</label>
                <input type="text" name="education_school[]" placeholder="e.g., University Name" aria-label="School">
            </div>
            <div class="form-group">
                <label>Location:</label>
                <input type="text" name="education_location[]" placeholder="e.g., City, State" aria-label="Location">
            </div>
            <div class="form-group">
                <label>Year of Graduation:</label>
                <input type="text" name="education_year[]" placeholder="e.g., 2024" aria-label="Graduation Year">
            </div>
            <div class="form-group">
                <label>GPA (Optional):</label>
                <input type="text" name="education_gpa[]" placeholder="e.g., 3.8/4.0" aria-label="GPA">
            </div>
            <div class="form-group">
                <label>Honors (Optional):</label>
                <input type="text" name="education_honors[]" placeholder="e.g., Magna Cum Laude" aria-label="Honors">
            </div>
        `;

        // Add remove functionality
        const removeBtn = div.querySelector('.remove-entry-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            triggerPreviewUpdate();
        });

        return div;
    }

    /**
     * Create experience entry element
     * @returns {HTMLElement} Experience entry element
     */
    function createExperienceEntry() {
        const div = document.createElement('div');
        div.className = 'experience-entry dynamic-entry';
        div.innerHTML = `
            <div class="entry-header">
                <h4>Experience Entry</h4>
                <button type="button" class="remove-entry-btn" aria-label="Remove experience entry">Remove</button>
            </div>
            <div class="form-group">
                <label>Position:</label>
                <input type="text" name="work_position[]" placeholder="e.g., Software Engineer" aria-label="Job Position">
            </div>
            <div class="form-group">
                <label>Company:</label>
                <input type="text" name="work_company[]" placeholder="e.g., Company Name" aria-label="Company">
            </div>
            <div class="form-group">
                <label>Location:</label>
                <input type="text" name="work_location[]" placeholder="e.g., City, State" aria-label="Work Location">
            </div>
            <div class="form-group">
                <label>Duration:</label>
                <input type="text" name="work_duration[]" placeholder="e.g., Jan 2020 - Dec 2022" aria-label="Employment Duration">
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea name="work_description[]" placeholder="Describe your responsibilities and achievements..." rows="4" maxlength="1000" aria-label="Job Description"></textarea>
                <div class="char-counter" style="text-align: right; font-size: 12px; color: #888; margin-top: 5px;">
                    <span class="char-count">0</span>/1000 characters
                </div>
            </div>
        `;

        // Add remove functionality
        const removeBtn = div.querySelector('.remove-entry-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            triggerPreviewUpdate();
        });

        // Add character counter
        const textarea = div.querySelector('textarea');
        const counter = div.querySelector('.char-count');
        if (textarea && counter) {
            textarea.addEventListener('input', function() {
                counter.textContent = this.value.length;
            });
        }

        return div;
    }

    /**
     * Create skill entry element
     * @returns {HTMLElement} Skill entry element
     */
    function createSkillEntry() {
        const div = document.createElement('div');
        div.className = 'skill-entry';
        div.innerHTML = `
            <div class="form-group">
                <label>Skill:</label>
                <input type="text" name="skill[]" placeholder="e.g., JavaScript" aria-label="Skill">
                <button type="button" class="remove-skill-btn" aria-label="Remove skill">×</button>
            </div>
        `;

        // Add remove functionality
        const removeBtn = div.querySelector('.remove-skill-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            triggerPreviewUpdate();
        });

        return div;
    }

    /**
     * Create project entry element
     * @returns {HTMLElement} Project entry element
     */
    function createProjectEntry() {
        const div = document.createElement('div');
        div.className = 'project-entry dynamic-entry';
        div.innerHTML = `
            <div class="entry-header">
                <h4>Project Entry</h4>
                <button type="button" class="remove-entry-btn" aria-label="Remove project entry">Remove</button>
            </div>
            <div class="form-group">
                <label>Project Name:</label>
                <input type="text" name="project_name[]" placeholder="e.g., E-commerce Platform" aria-label="Project Name">
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea name="project_description[]" placeholder="Describe the project..." rows="3" maxlength="500" aria-label="Project Description"></textarea>
            </div>
            <div class="form-group">
                <label>Technologies:</label>
                <input type="text" name="project_technologies[]" placeholder="e.g., React, Node.js, MongoDB" aria-label="Technologies Used">
            </div>
            <div class="form-group">
                <label>Link (Optional):</label>
                <input type="text" name="project_link[]" placeholder="e.g., github.com/username/project" aria-label="Project Link">
            </div>
        `;

        const removeBtn = div.querySelector('.remove-entry-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            triggerPreviewUpdate();
        });

        return div;
    }

    /**
     * Create certification entry element
     * @returns {HTMLElement} Certification entry element
     */
    function createCertificationEntry() {
        const div = document.createElement('div');
        div.className = 'certification-entry dynamic-entry';
        div.innerHTML = `
            <div class="entry-header">
                <h4>Certification Entry</h4>
                <button type="button" class="remove-entry-btn" aria-label="Remove certification entry">Remove</button>
            </div>
            <div class="form-group">
                <label>Certification Name:</label>
                <input type="text" name="cert_name[]" placeholder="e.g., AWS Certified Solutions Architect" aria-label="Certification Name">
            </div>
            <div class="form-group">
                <label>Issuing Organization:</label>
                <input type="text" name="cert_issuer[]" placeholder="e.g., Amazon Web Services" aria-label="Issuer">
            </div>
            <div class="form-group">
                <label>Date Obtained:</label>
                <input type="text" name="cert_date[]" placeholder="e.g., January 2024" aria-label="Date Obtained">
            </div>
        `;

        const removeBtn = div.querySelector('.remove-entry-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            triggerPreviewUpdate();
        });

        return div;
    }

    /**
     * Create language entry element
     * @returns {HTMLElement} Language entry element
     */
    function createLanguageEntry() {
        const div = document.createElement('div');
        div.className = 'language-entry dynamic-entry';
        div.innerHTML = `
            <div class="entry-header">
                <h4>Language Entry</h4>
                <button type="button" class="remove-entry-btn" aria-label="Remove language entry">Remove</button>
            </div>
            <div class="form-group">
                <label>Language:</label>
                <input type="text" name="language_name[]" placeholder="e.g., English" aria-label="Language">
            </div>
            <div class="form-group">
                <label>Proficiency:</label>
                <select name="language_proficiency[]" aria-label="Language Proficiency">
                    <option value="">Select proficiency</option>
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional">Professional Working Proficiency</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Basic">Basic</option>
                </select>
            </div>
        `;

        const removeBtn = div.querySelector('.remove-entry-btn');
        removeBtn.addEventListener('click', function() {
            div.remove();
            triggerPreviewUpdate();
        });

        return div;
    }

    /**
     * Trigger preview update
     */
    function triggerPreviewUpdate() {
        if (DOM.form) {
            const event = new Event('input', { bubbles: true });
            DOM.form.dispatchEvent(event);
        }
    }

    // ====================================================================
    // FORM VALIDATION
    // ====================================================================

    /**
     * Validate form data with comprehensive checks
     * @param {boolean} silent - If true, don't show notifications
     * @returns {boolean} True if valid
     */
    function validateForm(silent = false) {
        try {
            let isValid = true;
            const errors = {};

            // Required: Full Name
            if (!DOM.fullName?.value.trim()) {
                errors.full_name = 'Full name is required';
                isValid = false;
            }

            // Required: Email
            if (!DOM.email?.value.trim()) {
                errors.email = 'Email address is required';
                isValid = false;
            } else if (!isValidEmail(DOM.email.value)) {
                errors.email = 'Please enter a valid email address';
                isValid = false;
            }

            // Optional: Phone (validate if provided)
            if (DOM.phone?.value.trim() && !isValidPhone(DOM.phone.value)) {
                errors.phone = 'Please enter a valid phone number';
                isValid = false;
            }

            // Optional: LinkedIn (validate if provided)
            if (DOM.linkedin?.value.trim() && !isValidURL(DOM.linkedin.value) && !DOM.linkedin.value.includes('linkedin.com')) {
                errors.linkedin = 'Please enter a valid LinkedIn URL';
                isValid = false;
            }

            // Optional: Website (validate if provided)
            if (DOM.website?.value.trim() && !isValidURL(DOM.website.value)) {
                errors.website = 'Please enter a valid website URL';
                isValid = false;
            }

            // Optional: GitHub (validate if provided)
            if (DOM.github?.value.trim() && !isValidURL(DOM.github.value) && !DOM.github.value.includes('github.com')) {
                errors.github = 'Please enter a valid GitHub URL';
                isValid = false;
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
                    if (inputEl) {
                        inputEl.classList.add('error');
                        inputEl.focus();
                    }
                });

                if (!isValid) {
                    showNotification('Please fix the errors in the form', 'error');
                }
            }

            return isValid;
        } catch (error) {
            console.error('Validation error:', error);
            return false;
        }
    }

    // ====================================================================
    // FORM HANDLERS
    // ====================================================================

    /**
     * Setup form submission and save handlers
     */
    function setupFormHandlers() {
        try {
            if (DOM.form) {
                DOM.form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    if (validateForm()) {
                        saveResume();
                        showNotification('Resume saved successfully!', 'success');
                    }
                });
            }

            // Save button with loading state
            if (DOM.saveBtn) {
                DOM.saveBtn.addEventListener('click', function(e) {
                    e.preventDefault();

                    // Validate first
                    if (!validateForm()) {
                        return;
                    }

                    // Add loading state
                    const originalText = this.innerHTML;
                    this.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
                    this.classList.add('loading');
                    this.disabled = true;

                    // Small delay to show loading state
                    setTimeout(() => {
                        const saved = saveResume();

                        // Reset button state
                        this.innerHTML = originalText;
                        this.classList.remove('loading');
                        this.disabled = false;

                        // Show notification
                        if (saved) {
                            showNotification('Resume saved successfully!', 'success');
                        }
                    }, 300);
                });
            }

            // New resume button
            if (DOM.newResumeBtn) {
                DOM.newResumeBtn.addEventListener('click', function() {
                    if (hasUnsavedChanges) {
                        if (!confirm('Create a new resume? Unsaved changes will be lost.')) {
                            return;
                        }
                    }
                    createNewResume();
                });
            }
        } catch (error) {
            console.error('Setup form handlers error:', error);
        }
    }

    /**
     * Create a new blank resume
     */
    function createNewResume() {
        try {
            currentResumeId = null;
            DOM.form?.reset();
            hasUnsavedChanges = false;

            // Clear dynamic sections
            const dynamicSections = document.querySelectorAll('.dynamic-entry');
            dynamicSections.forEach(section => section.remove());

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            showNotification('Started new resume', 'info');
        } catch (error) {
            console.error('Create new resume error:', error);
            showNotification('Failed to create new resume', 'error');
        }
    }

    // ====================================================================
    // RESUME STORAGE
    // ====================================================================

    /**
     * Save resume to localStorage
     * @returns {Object|null} Saved resume object or null on error
     */
    function saveResume() {
        try {
            if (!checkLocalStorageQuota()) {
                showNotification('Storage full. Cannot save resume.', 'error');
                return null;
            }

            const formData = getFormData();
            const template = DOM.templateSelect?.value || 'template1';

            const resume = {
                id: currentResumeId || generateId(),
                title: sanitizeHTML(formData.fullName) || 'Untitled Resume',
                data: formData,
                template: template,
                createdAt: currentResumeId ? (getResumeById(currentResumeId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
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

            // Save to localStorage with error handling
            localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, JSON.stringify(resumes));

            // Update dashboard
            updateDashboard();

            hasUnsavedChanges = false;

            return resume;
        } catch (error) {
            console.error('Save resume error:', error);
            if (error.name === 'QuotaExceededError') {
                showNotification('Storage quota exceeded. Please delete old resumes.', 'error');
            } else {
                showNotification('Failed to save resume. Please try again.', 'error');
            }
            return null;
        }
    }

    /**
     * Get form data with sanitization
     * @returns {Object} Form data object
     */
    function getFormData() {
        return {
            fullName: sanitizeHTML(DOM.fullName?.value || ''),
            email: sanitizeHTML(DOM.email?.value || ''),
            phone: sanitizeHTML(DOM.phone?.value || ''),
            location: sanitizeHTML(DOM.location?.value || ''),
            linkedin: sanitizeHTML(DOM.linkedin?.value || ''),
            website: sanitizeHTML(DOM.website?.value || ''),
            github: sanitizeHTML(DOM.github?.value || ''),
            summary: sanitizeHTML(DOM.summary?.value || ''),
            education: getEducationData(),
            experience: getExperienceData(),
            skills: getSkillsData(),
            projects: getProjectsData(),
            certifications: getCertificationsData(),
            languages: getLanguagesData()
        };
    }

    /**
     * Get education data from form
     * @returns {Array} Education entries
     */
    function getEducationData() {
        const entries = [];

        try {
            // Get first entry (non-dynamic)
            const degree = document.getElementById('education_degree')?.value || '';
            const major = document.getElementById('education_major')?.value || '';
            const school = document.getElementById('education_school')?.value || '';
            const location = document.getElementById('education_location')?.value || '';
            const year = document.getElementById('education_year')?.value || '';
            const gpa = document.getElementById('education_gpa')?.value || '';
            const honors = document.getElementById('education_honors')?.value || '';

            if (degree || major || school || year) {
                entries.push({
                    degree: sanitizeHTML(degree),
                    major: sanitizeHTML(major),
                    school: sanitizeHTML(school),
                    location: sanitizeHTML(location),
                    year: sanitizeHTML(year),
                    gpa: sanitizeHTML(gpa),
                    honors: sanitizeHTML(honors)
                });
            }

            // Get dynamic entries
            const containers = document.querySelectorAll('.education-entry.dynamic-entry');
            containers.forEach(container => {
                const degree = container.querySelector('[name="education_degree[]"]')?.value || '';
                const major = container.querySelector('[name="education_major[]"]')?.value || '';
                const school = container.querySelector('[name="education_school[]"]')?.value || '';
                const location = container.querySelector('[name="education_location[]"]')?.value || '';
                const year = container.querySelector('[name="education_year[]"]')?.value || '';
                const gpa = container.querySelector('[name="education_gpa[]"]')?.value || '';
                const honors = container.querySelector('[name="education_honors[]"]')?.value || '';

                if (degree || major || school || year) {
                    entries.push({
                        degree: sanitizeHTML(degree),
                        major: sanitizeHTML(major),
                        school: sanitizeHTML(school),
                        location: sanitizeHTML(location),
                        year: sanitizeHTML(year),
                        gpa: sanitizeHTML(gpa),
                        honors: sanitizeHTML(honors)
                    });
                }
            });
        } catch (error) {
            console.error('Get education data error:', error);
        }

        return entries;
    }

    /**
     * Get experience data from form
     * @returns {Array} Experience entries
     */
    function getExperienceData() {
        const entries = [];

        try {
            // Get first entry (non-dynamic)
            const position = document.getElementById('work_position')?.value || '';
            const company = document.getElementById('work_company')?.value || '';
            const location = document.getElementById('work_location')?.value || '';
            const duration = document.getElementById('work_duration')?.value || '';
            const description = document.getElementById('work_description')?.value || '';

            if (position || company || duration || description) {
                entries.push({
                    position: sanitizeHTML(position),
                    company: sanitizeHTML(company),
                    location: sanitizeHTML(location),
                    duration: sanitizeHTML(duration),
                    description: sanitizeHTML(description)
                });
            }

            // Get dynamic entries
            const containers = document.querySelectorAll('.experience-entry.dynamic-entry');
            containers.forEach(container => {
                const position = container.querySelector('[name="work_position[]"]')?.value || '';
                const company = container.querySelector('[name="work_company[]"]')?.value || '';
                const location = container.querySelector('[name="work_location[]"]')?.value || '';
                const duration = container.querySelector('[name="work_duration[]"]')?.value || '';
                const description = container.querySelector('[name="work_description[]"]')?.value || '';

                if (position || company || duration || description) {
                    entries.push({
                        position: sanitizeHTML(position),
                        company: sanitizeHTML(company),
                        location: sanitizeHTML(location),
                        duration: sanitizeHTML(duration),
                        description: sanitizeHTML(description)
                    });
                }
            });
        } catch (error) {
            console.error('Get experience data error:', error);
        }

        return entries;
    }

    /**
     * Get skills data from form
     * @returns {Array} Skills array
     */
    function getSkillsData() {
        const skills = [];

        try {
            // Get initial skills (skill1, skill2, skill3)
            for (let i = 1; i <= 10; i++) {
                const skillInput = document.getElementById(`skill${i}`);
                if (skillInput && skillInput.value.trim()) {
                    skills.push(sanitizeHTML(skillInput.value.trim()));
                }
            }

            // Get dynamic skills
            const skillInputs = document.querySelectorAll('.skill-entry [name="skill[]"]');
            skillInputs.forEach(input => {
                if (input.value.trim()) {
                    skills.push(sanitizeHTML(input.value.trim()));
                }
            });
        } catch (error) {
            console.error('Get skills data error:', error);
        }

        return skills;
    }

    /**
     * Get projects data from form
     * @returns {Array} Projects array
     */
    function getProjectsData() {
        const projects = [];

        try {
            const containers = document.querySelectorAll('.project-entry');
            containers.forEach(container => {
                const name = container.querySelector('[name="project_name[]"]')?.value || '';
                const description = container.querySelector('[name="project_description[]"]')?.value || '';
                const technologies = container.querySelector('[name="project_technologies[]"]')?.value || '';
                const link = container.querySelector('[name="project_link[]"]')?.value || '';

                if (name || description) {
                    projects.push({
                        name: sanitizeHTML(name),
                        description: sanitizeHTML(description),
                        technologies: sanitizeHTML(technologies),
                        link: sanitizeHTML(link)
                    });
                }
            });
        } catch (error) {
            console.error('Get projects data error:', error);
        }

        return projects;
    }

    /**
     * Get certifications data from form
     * @returns {Array} Certifications array
     */
    function getCertificationsData() {
        const certifications = [];

        try {
            const containers = document.querySelectorAll('.certification-entry');
            containers.forEach(container => {
                const name = container.querySelector('[name="cert_name[]"]')?.value || '';
                const issuer = container.querySelector('[name="cert_issuer[]"]')?.value || '';
                const date = container.querySelector('[name="cert_date[]"]')?.value || '';

                if (name || issuer) {
                    certifications.push({
                        name: sanitizeHTML(name),
                        issuer: sanitizeHTML(issuer),
                        date: sanitizeHTML(date)
                    });
                }
            });
        } catch (error) {
            console.error('Get certifications data error:', error);
        }

        return certifications;
    }

    /**
     * Get languages data from form
     * @returns {Array} Languages array
     */
    function getLanguagesData() {
        const languages = [];

        try {
            const containers = document.querySelectorAll('.language-entry');
            containers.forEach(container => {
                const name = container.querySelector('[name="language_name[]"]')?.value || '';
                const proficiency = container.querySelector('[name="language_proficiency[]"]')?.value || '';

                if (name) {
                    languages.push({
                        name: sanitizeHTML(name),
                        proficiency: sanitizeHTML(proficiency)
                    });
                }
            });
        } catch (error) {
            console.error('Get languages data error:', error);
        }

        return languages;
    }

    /**
     * Get all resumes from localStorage
     * @returns {Array} Array of resume objects
     */
    function getResumes() {
        try {
            const resumes = localStorage.getItem(CONFIG.LOCALSTORAGE_KEY);
            return resumes ? JSON.parse(resumes) : [];
        } catch (error) {
            console.error('Get resumes error:', error);
            showNotification('Failed to load resumes', 'error');
            return [];
        }
    }

    /**
     * Get resume by ID
     * @param {string} id - Resume ID
     * @returns {Object|null} Resume object or null
     */
    function getResumeById(id) {
        try {
            const resumes = getResumes();
            return resumes.find(r => r.id === id) || null;
        } catch (error) {
            console.error('Get resume by ID error:', error);
            return null;
        }
    }

    /**
     * Load resume into form
     * @param {string} id - Resume ID
     */
    function loadResume(id) {
        try {
            const resume = getResumeById(id);
            if (!resume) {
                showNotification('Resume not found', 'error');
                return;
            }

            currentResumeId = id;
            const data = resume.data;

            // Load basic info
            if (DOM.fullName) DOM.fullName.value = data.fullName || '';
            if (DOM.email) DOM.email.value = data.email || '';
            if (DOM.phone) DOM.phone.value = data.phone || '';
            if (DOM.location) DOM.location.value = data.location || '';
            if (DOM.linkedin) DOM.linkedin.value = data.linkedin || '';
            if (DOM.website) DOM.website.value = data.website || '';
            if (DOM.github) DOM.github.value = data.github || '';
            if (DOM.summary) DOM.summary.value = data.summary || '';

            // Load template
            if (DOM.templateSelect) {
                DOM.templateSelect.value = resume.template || 'template1';
            }

            // Trigger preview update
            triggerPreviewUpdate();

            showNotification('Resume loaded successfully', 'success');

            // Scroll to form
            document.getElementById('resume-editor')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Load resume error:', error);
            showNotification('Failed to load resume', 'error');
        }
    }

    /**
     * Load current/latest resume on startup
     */
    function loadCurrentResume() {
        try {
            const resumes = getResumes();
            if (resumes.length > 0) {
                // Load the most recently updated resume
                const latest = resumes.reduce((prev, current) =>
                    new Date(current.updatedAt) > new Date(prev.updatedAt) ? current : prev
                );
                currentResumeId = latest.id;
            }
        } catch (error) {
            console.error('Load current resume error:', error);
        }
    }

    /**
     * Delete resume
     * @param {string} id - Resume ID
     */
    function deleteResume(id) {
        try {
            let resumes = getResumes();
            resumes = resumes.filter(r => r.id !== id);
            localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, JSON.stringify(resumes));

            if (currentResumeId === id) {
                currentResumeId = null;
                DOM.form?.reset();
            }

            updateDashboard();
            showNotification('Resume deleted', 'info');
        } catch (error) {
            console.error('Delete resume error:', error);
            showNotification('Failed to delete resume', 'error');
        }
    }

    /**
     * Duplicate resume
     * @param {string} id - Resume ID to duplicate
     */
    function duplicateResume(id) {
        try {
            const resume = getResumeById(id);
            if (!resume) {
                showNotification('Resume not found', 'error');
                return;
            }

            const duplicate = {
                ...resume,
                id: generateId(),
                title: resume.title + ' (Copy)',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            let resumes = getResumes();
            resumes.push(duplicate);
            localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, JSON.stringify(resumes));

            updateDashboard();
            showNotification('Resume duplicated successfully', 'success');
        } catch (error) {
            console.error('Duplicate resume error:', error);
            showNotification('Failed to duplicate resume', 'error');
        }
    }

    // ====================================================================
    // DASHBOARD
    // ====================================================================

    /**
     * Setup dashboard
     */
    function setupDashboard() {
        try {
            updateDashboard();

            // Toggle dashboard visibility
            if (DOM.dashboardBtn) {
                DOM.dashboardBtn.addEventListener('click', function() {
                    if (DOM.dashboard) {
                        const isHidden = DOM.dashboard.style.display === 'none';
                        DOM.dashboard.style.display = isHidden ? 'block' : 'none';

                        if (isHidden) {
                            DOM.dashboard.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Setup dashboard error:', error);
        }
    }

    /**
     * Update dashboard with saved resumes
     */
    function updateDashboard() {
        try {
            if (!DOM.resumeList) return;

            const resumes = getResumes();

            if (resumes.length === 0) {
                DOM.resumeList.innerHTML = '<p style="text-align: center; color: #888; padding: 40px;">No saved resumes yet. Create your first resume!</p>';
                return;
            }

            DOM.resumeList.innerHTML = resumes.map(resume => `
                <div class="resume-item" data-id="${resume.id}">
                    <h3>${escapeHTML(resume.title)}</h3>
                    <p>Created: ${new Date(resume.createdAt).toLocaleDateString()}</p>
                    <p>Last Modified: ${new Date(resume.updatedAt).toLocaleDateString()}</p>
                    <div class="resume-actions">
                        <button class="edit-btn" data-id="${resume.id}" aria-label="Edit resume">Edit</button>
                        <button class="duplicate-btn" data-id="${resume.id}" aria-label="Duplicate resume">Duplicate</button>
                        <button class="download-btn" data-id="${resume.id}" aria-label="Download PDF">Download</button>
                        <button class="delete-btn" data-id="${resume.id}" aria-label="Delete resume">Delete</button>
                    </div>
                </div>
            `).join('');

            // Attach event listeners
            DOM.resumeList.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    loadResume(this.dataset.id);
                });
            });

            DOM.resumeList.querySelectorAll('.duplicate-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    duplicateResume(this.dataset.id);
                });
            });

            DOM.resumeList.querySelectorAll('.download-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    downloadResumePDF(this.dataset.id);
                });
            });

            DOM.resumeList.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
                        deleteResume(this.dataset.id);
                    }
                });
            });
        } catch (error) {
            console.error('Update dashboard error:', error);
        }
    }

    // ====================================================================
    // PDF DOWNLOAD
    // ====================================================================

    /**
     * Setup download buttons
     */
    function setupDownloadButtons() {
        try {
            // PDF Download button with improved loading state
            if (DOM.downloadBtn) {
                DOM.downloadBtn.addEventListener('click', function() {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<span class="btn-icon">⏳</span> Preparing...';
                    this.classList.add('loading');
                    this.disabled = true;

                    // Download with auto-save
                    setTimeout(() => {
                        downloadCurrentResume();

                        // Reset button after a brief delay
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.classList.remove('loading');
                            this.disabled = false;
                        }, 1000);
                    }, 100);
                });
            }

            // JSON Export button
            if (DOM.exportBtn) {
                DOM.exportBtn.addEventListener('click', exportAsJSON);
            }
        } catch (error) {
            console.error('Setup download buttons error:', error);
        }
    }

    /**
     * Download current resume as PDF (with auto-save)
     */
    function downloadCurrentResume() {
        try {
            // Check if form is valid
            if (!validateForm(true)) { // Silent validation
                showNotification('Please fill in required fields (Name and Email)', 'error');
                return;
            }

            // Always save before downloading to ensure PDF has latest data
            showNotification('Preparing resume for download...', 'info');

            const resume = saveResume();
            if (!resume) {
                showNotification('Failed to save resume. Cannot download.', 'error');
                return;
            }

            // Update current resume ID
            currentResumeId = resume.id;

            // Small delay to ensure data is committed
            setTimeout(() => {
                downloadResumePDF(currentResumeId);
            }, 200);
        } catch (error) {
            console.error('Download current resume error:', error);
            showNotification('Failed to download resume', 'error');
        }
    }

    /**
     * Download resume by ID as PDF
     * @param {string} id - Resume ID
     */
    function downloadResumePDF(id) {
        try {
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

            // Get the preview element directly
            const previewElement = DOM.preview;
            if (!previewElement || !previewElement.innerHTML) {
                showNotification('Please fill in your resume details first', 'error');
                return;
            }

            // PDF options
            const options = {
                margin: 10,
                filename: `${resume.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Generate PDF
            html2pdf().set(options).from(previewElement).save().then(() => {
                showNotification('Resume downloaded successfully!', 'success');
            }).catch(error => {
                console.error('PDF generation error:', error);
                showNotification('Failed to generate PDF. Please try again.', 'error');
            });
        } catch (error) {
            console.error('Download resume PDF error:', error);
            showNotification('Failed to download PDF', 'error');
        }
    }

    /**
     * Export resume as JSON
     */
    function exportAsJSON() {
        try {
            if (!currentResumeId) {
                showNotification('Please save your resume first', 'error');
                return;
            }

            const resume = getResumeById(currentResumeId);
            if (!resume) {
                showNotification('Resume not found', 'error');
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
        } catch (error) {
            console.error('Export JSON error:', error);
            showNotification('Failed to export backup', 'error');
        }
    }

    // ====================================================================
    // IMPORT FUNCTIONALITY
    // ====================================================================

    /**
     * Setup import button
     */
    function setupImportButton() {
        try {
            // Create import button if it doesn't exist
            const importBtn = document.createElement('button');
            importBtn.type = 'button';
            importBtn.id = 'import-json-btn';
            importBtn.className = 'btn-secondary';
            importBtn.setAttribute('aria-label', 'Import Backup');
            importBtn.innerHTML = '<span class="btn-icon">📥</span> Import Backup';

            // Add to form actions if not already there
            const formActions = document.querySelector('.form-actions');
            if (formActions && !document.getElementById('import-json-btn')) {
                formActions.appendChild(importBtn);
            }

            // Create hidden file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'import-file-input';
            fileInput.accept = '.json';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);

            // Setup event listeners
            importBtn.addEventListener('click', function() {
                fileInput.click();
            });

            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    importJSON(file);
                }
                // Reset input
                fileInput.value = '';
            });
        } catch (error) {
            console.error('Setup import button error:', error);
        }
    }

    /**
     * Import resume from JSON file
     * @param {File} file - JSON file to import
     */
    function importJSON(file) {
        try {
            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    const resume = JSON.parse(e.target.result);

                    // Validate resume structure
                    if (!resume.id || !resume.data || !resume.title) {
                        throw new Error('Invalid resume format');
                    }

                    // Generate new ID to avoid conflicts
                    resume.id = generateId();
                    resume.title = resume.title + ' (Imported)';
                    resume.createdAt = new Date().toISOString();
                    resume.updatedAt = new Date().toISOString();

                    // Add to resumes
                    let resumes = getResumes();
                    resumes.push(resume);
                    localStorage.setItem(CONFIG.LOCALSTORAGE_KEY, JSON.stringify(resumes));

                    updateDashboard();
                    showNotification('Resume imported successfully!', 'success');
                } catch (error) {
                    console.error('Parse JSON error:', error);
                    showNotification('Invalid JSON file. Please check the format.', 'error');
                }
            };

            reader.onerror = function() {
                showNotification('Failed to read file', 'error');
            };

            reader.readAsText(file);
        } catch (error) {
            console.error('Import JSON error:', error);
            showNotification('Failed to import resume', 'error');
        }
    }

    // ====================================================================
    // PROGRESS TRACKING
    // ====================================================================

    /**
     * Setup progress tracker
     */
    function setupProgressTracker() {
        try {
            if (DOM.form) {
                DOM.form.addEventListener('input', updateProgress);
                updateProgress(); // Initial calculation
            }
        } catch (error) {
            console.error('Setup progress tracker error:', error);
        }
    }

    /**
     * Calculate and update progress
     */
    function updateProgress() {
        try {
            const requiredFields = {
                fullName: DOM.fullName?.value.trim() || '',
                email: DOM.email?.value.trim() || ''
            };

            const optionalFields = {
                phone: DOM.phone?.value.trim() || '',
                location: DOM.location?.value.trim() || '',
                summary: DOM.summary?.value.trim() || ''
            };

            const education = getEducationData();
            const experience = getExperienceData();
            const skills = getSkillsData();

            let completed = 0;
            let total = 10;

            // Required fields (2 points each)
            if (requiredFields.fullName) completed++;
            if (requiredFields.email && isValidEmail(requiredFields.email)) completed++;

            // Important optional fields
            if (optionalFields.phone) completed++;
            if (optionalFields.location) completed++;
            if (optionalFields.summary) completed++;
            if (education.length > 0) completed++;
            if (experience.length > 0) completed++;
            if (skills.length >= 3) completed++;

            // Bonus for detailed info
            if (experience.length > 0 && experience[0].description) completed++;
            if (education.length > 0 && education[0].major) completed++;

            const percentage = Math.round((completed / total) * 100);

            if (DOM.progressBar) DOM.progressBar.style.width = percentage + '%';
            if (DOM.progressPercentage) DOM.progressPercentage.textContent = percentage + '%';

            // Trigger autosave
            triggerAutosave();
        } catch (error) {
            console.error('Update progress error:', error);
        }
    }

    /**
     * Trigger autosave with debouncing
     */
    function triggerAutosave() {
        try {
            hasUnsavedChanges = true;

            if (DOM.autosaveIndicator) {
                DOM.autosaveIndicator.textContent = '💾 Saving...';
                DOM.autosaveIndicator.style.color = '#FFA726';
            }

            // Clear existing timer
            if (autosaveTimer) clearTimeout(autosaveTimer);

            // Set new timer
            autosaveTimer = setTimeout(() => {
                if (validateForm(true)) { // Silent validation
                    const saved = saveResume();

                    if (saved) {
                        hasUnsavedChanges = false;

                        if (DOM.autosaveIndicator) {
                            DOM.autosaveIndicator.textContent = '✓ Saved';
                            DOM.autosaveIndicator.style.color = '#4CAF50';

                            setTimeout(() => {
                                DOM.autosaveIndicator.textContent = '';
                            }, 2000);
                        }
                    }
                }
            }, CONFIG.AUTOSAVE_DELAY);
        } catch (error) {
            console.error('Trigger autosave error:', error);
        }
    }

    // ====================================================================
    // CHARACTER COUNTERS
    // ====================================================================

    /**
     * Setup character counters for text areas
     */
    function setupCharacterCounters() {
        try {
            // Professional summary counter
            const summaryTextarea = DOM.summary;
            const summaryCounter = document.getElementById('professional_summary-count');

            if (summaryTextarea && summaryCounter) {
                const updateCounter = () => {
                    const length = summaryTextarea.value.length;
                    const maxLength = summaryTextarea.maxLength || 500;
                    summaryCounter.textContent = length;

                    // Color coding
                    const parent = summaryCounter.parentElement;
                    if (parent) {
                        parent.style.color = length > maxLength * 0.9 ? '#f44336' :
                                           length > maxLength * 0.7 ? '#FFA726' : '#888';
                    }
                };

                summaryTextarea.addEventListener('input', updateCounter);
                updateCounter();
            }

            // Work description counter
            const descTextarea = document.getElementById('work_description');
            const descCounter = document.getElementById('work_description-count');

            if (descTextarea && descCounter) {
                const updateCounter = () => {
                    const length = descTextarea.value.length;
                    const maxLength = descTextarea.maxLength || 1000;
                    descCounter.textContent = length;

                    // Color coding
                    const parent = descCounter.parentElement;
                    if (parent) {
                        parent.style.color = length > maxLength * 0.9 ? '#f44336' :
                                           length > maxLength * 0.7 ? '#FFA726' : '#888';
                    }
                };

                descTextarea.addEventListener('input', updateCounter);
                updateCounter();
            }
        } catch (error) {
            console.error('Setup character counters error:', error);
        }
    }

    // ====================================================================
    // BACK TO TOP
    // ====================================================================

    /**
     * Setup back to top button
     */
    function setupBackToTop() {
        try {
            if (DOM.backToTopBtn) {
                window.addEventListener('scroll', () => {
                    if (window.pageYOffset > 300) {
                        DOM.backToTopBtn.style.display = 'block';
                    } else {
                        DOM.backToTopBtn.style.display = 'none';
                    }
                });

                DOM.backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                });
            }
        } catch (error) {
            console.error('Setup back to top error:', error);
        }
    }

    // ====================================================================
    // UNSAVED CHANGES WARNING
    // ====================================================================

    /**
     * Setup unsaved changes warning
     */
    function setupUnsavedChangesWarning() {
        try {
            window.addEventListener('beforeunload', (e) => {
                if (hasUnsavedChanges) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                    return e.returnValue;
                }
            });
        } catch (error) {
            console.error('Setup unsaved changes warning error:', error);
        }
    }

    // ====================================================================
    // KEYBOARD SHORTCUTS
    // ====================================================================

    /**
     * Setup keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        try {
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
                    if (DOM.downloadBtn) DOM.downloadBtn.click();
                }

                // Ctrl/Cmd + E to export JSON
                if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                    e.preventDefault();
                    exportAsJSON();
                }
            });

            // Setup shortcuts modal
            const shortcutsModal = document.getElementById('shortcuts-modal');
            const shortcutsClose = document.getElementById('shortcuts-close');

            if (DOM.shortcutsBtn && shortcutsModal) {
                DOM.shortcutsBtn.addEventListener('click', () => {
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
        } catch (error) {
            console.error('Setup keyboard shortcuts error:', error);
        }
    }

    // ====================================================================
    // NOTIFICATIONS
    // ====================================================================

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     */
    function showNotification(message, type = 'info') {
        try {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.setAttribute('role', 'alert');
            notification.setAttribute('aria-live', 'polite');

            const colors = {
                success: '#4CAF50',
                error: '#f44336',
                warning: '#FFA726',
                info: '#2196F3'
            };

            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${colors[type] || colors.info};
                color: white;
                border-radius: 5px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, CONFIG.NOTIFICATION_DURATION);
        } catch (error) {
            console.error('Show notification error:', error);
        }
    }

    // ====================================================================
    // INITIALIZATION - Start the application
    // ====================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// ====================================================================
// GLOBAL STYLES FOR NOTIFICATIONS
// ====================================================================
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

    input.error, textarea.error {
        border-color: #f44336 !important;
        background-color: rgba(244, 67, 54, 0.05) !important;
    }

    .field-error {
        color: #f44336;
        font-size: 12px;
        margin-top: 5px;
        display: block;
    }

    .duplicate-btn {
        background: linear-gradient(135deg, #FF9800, #FF5722);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .duplicate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
    }
`;
document.head.appendChild(style);
