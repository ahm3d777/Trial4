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

    /** @type {HTMLElement|null} Entry currently being drag-reordered */
    let draggedEntry = null;

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
            initEntryReordering();
            initSectionManager();
            setupFormHandlers();
            setupDashboard();
            setupDownloadButtons();
            setupProgressTracker();
            setupCharacterCounters();
            setupBackToTop();
            setupUnsavedChangesWarning();
            setupKeyboardShortcuts();
            setupImportButton();
            setupThemeToggle();
            setupStorageAndHistoryControls();
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
            refreshReorderButtons(DOM.educationContainer, '.education-entry');
            triggerPreviewUpdate();
        });

        bindReorderControls(div, DOM.educationContainer, '.education-entry');

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
                <label>Position:
                    <div class="group relative flex items-center justify-center cursor-help">
                        <span class="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 group-hover:bg-amber-100 group-hover:text-amber-700 group-hover:border-amber-300 dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400 dark:group-hover:border-amber-500/50 transition-colors">?</span>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-200 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 font-normal pointer-events-none text-center leading-relaxed font-sans">
                            Use industry-standard titles for better ATS (Applicant Tracking System) matching.
                            <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800"></div>
                        </div>
                    </div>
                </label>
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
                <label>Description:
                    <div class="group relative flex items-center justify-center cursor-help">
                        <span class="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 group-hover:bg-amber-100 group-hover:text-amber-700 group-hover:border-amber-300 dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400 dark:group-hover:border-amber-500/50 transition-colors">?</span>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-200 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 font-normal pointer-events-none text-center leading-relaxed font-sans">
                            Use bullet points. Start with action verbs and include measurable results (e.g., 'Increased sales by 15%').
                            <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800"></div>
                        </div>
                    </div>
                </label>
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
            refreshReorderButtons(DOM.experienceContainer, '.experience-entry');
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

        bindReorderControls(div, DOM.experienceContainer, '.experience-entry');

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
            refreshReorderButtons(DOM.skillsContainer, '.skill-entry');
            triggerPreviewUpdate();
        });

        bindReorderControls(div, DOM.skillsContainer, '.skill-entry');

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
                <label>Description:
                    <div class="group relative flex items-center justify-center cursor-help">
                        <span class="w-4 h-4 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-bold text-neutral-600 dark:text-neutral-400 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 group-hover:bg-amber-100 group-hover:text-amber-700 group-hover:border-amber-300 dark:group-hover:bg-amber-900/30 dark:group-hover:text-amber-400 dark:group-hover:border-amber-500/50 transition-colors">?</span>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-neutral-900 dark:bg-neutral-800 text-white dark:text-neutral-200 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 font-normal pointer-events-none text-center leading-relaxed font-sans">
                            Focus on the problem you solved, your specific contribution, and the impact.
                            <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800"></div>
                        </div>
                    </div>
                </label>
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
            refreshReorderButtons(DOM.projectsContainer, '.project-entry');
            triggerPreviewUpdate();
        });

        bindReorderControls(div, DOM.projectsContainer, '.project-entry');

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
            refreshReorderButtons(DOM.certificationsContainer, '.certification-entry');
            triggerPreviewUpdate();
        });

        bindReorderControls(div, DOM.certificationsContainer, '.certification-entry');

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
            refreshReorderButtons(DOM.languagesContainer, '.language-entry');
            triggerPreviewUpdate();
        });

        bindReorderControls(div, DOM.languagesContainer, '.language-entry');

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
    // ENTRY REORDERING (drag-and-drop + up/down buttons)
    // ====================================================================

    /**
     * Build the small drag handle + move up/down control bar prepended to
     * every reorderable entry (education, experience, skills, projects,
     * certifications, languages) - including the one static entry each
     * section starts with, not just ones added via "+ Add Another...".
     */
    function createReorderControls() {
        const div = document.createElement('div');
        div.className = 'reorder-controls';
        div.innerHTML = `
            <span class="drag-handle" draggable="true" aria-hidden="true" title="Drag to reorder">⠿</span>
            <button type="button" class="move-up-btn" aria-label="Move up">▲</button>
            <button type="button" class="move-down-btn" aria-label="Move down">▼</button>
        `;
        return div;
    }

    /**
     * Disable the "move up" button on the first entry and "move down" on
     * the last, within one container, so the boundaries are obvious.
     */
    function refreshReorderButtons(containerEl, itemSelector) {
        if (!containerEl) return;
        const items = Array.from(containerEl.querySelectorAll(itemSelector));
        items.forEach((item, idx) => {
            const upBtn = item.querySelector(':scope > .reorder-controls .move-up-btn');
            const downBtn = item.querySelector(':scope > .reorder-controls .move-down-btn');
            if (upBtn) upBtn.disabled = idx === 0;
            if (downBtn) downBtn.disabled = idx === items.length - 1;
        });
    }

    /**
     * Give one entry element working reorder controls: adds the control
     * bar if it doesn't already have one, and wires up the up/down
     * buttons plus the drag handle. Safe to call more than once on the
     * same element (it won't add a second control bar).
     * @param {HTMLElement} entryEl - the .education-entry/.experience-entry/etc.
     * @param {HTMLElement} containerEl - its parent container
     * @param {string} itemSelector - CSS selector matching sibling entries
     * @param {Function} [onChange] - called after a successful reorder,
     *   instead of the default triggerPreviewUpdate (used by the section
     *   manager, which also needs to persist the new order into its
     *   hidden input, not just refresh the preview).
     */
    function bindReorderControls(entryEl, containerEl, itemSelector, onChange) {
        try {
            const notify = onChange || triggerPreviewUpdate;

            let controls = entryEl.querySelector(':scope > .reorder-controls');
            if (!controls) {
                controls = createReorderControls();
                entryEl.insertBefore(controls, entryEl.firstChild);
            }

            const upBtn = controls.querySelector('.move-up-btn');
            const downBtn = controls.querySelector('.move-down-btn');
            const handle = controls.querySelector('.drag-handle');

            upBtn.addEventListener('click', () => {
                const prev = entryEl.previousElementSibling;
                if (prev && prev.matches(itemSelector)) {
                    containerEl.insertBefore(entryEl, prev);
                    refreshReorderButtons(containerEl, itemSelector);
                    notify();
                    upBtn.focus();
                }
            });

            downBtn.addEventListener('click', () => {
                const next = entryEl.nextElementSibling;
                if (next && next.matches(itemSelector)) {
                    containerEl.insertBefore(next, entryEl);
                    refreshReorderButtons(containerEl, itemSelector);
                    notify();
                    downBtn.focus();
                }
            });

            handle.addEventListener('dragstart', (e) => {
                draggedEntry = entryEl;
                entryEl.classList.add('dragging');
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move';
                    try { e.dataTransfer.setData('text/plain', ''); } catch (err) { /* Firefox needs this set, value is unused */ }
                }
            });

            handle.addEventListener('dragend', () => {
                entryEl.classList.remove('dragging');
                draggedEntry = null;
                refreshReorderButtons(containerEl, itemSelector);
                notify();
            });
        } catch (error) {
            console.error('Bind reorder controls error:', error);
        }
    }

    /**
     * Find which sibling a dragged entry should be inserted before, based
     * on the pointer's vertical position - the standard "drag to sort a
     * list" midpoint algorithm.
     */
    function getDragAfterElement(containerEl, itemSelector, y) {
        const items = Array.from(containerEl.querySelectorAll(itemSelector + ':not(.dragging)'));
        return items.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: -Infinity, element: null }).element;
    }

    /**
     * Set up drag-over handling once per container (event delegation - it
     * doesn't need to be re-attached as entries are added/removed).
     */
    function setupContainerDragOver(containerEl, itemSelector) {
        if (!containerEl) return;
        containerEl.addEventListener('dragover', (e) => {
            if (!draggedEntry) return;
            e.preventDefault();
            const afterElement = getDragAfterElement(containerEl, itemSelector, e.clientY);
            if (afterElement == null) {
                containerEl.appendChild(draggedEntry);
            } else if (afterElement !== draggedEntry) {
                containerEl.insertBefore(draggedEntry, afterElement);
            }
        });
    }

    /** One config entry per reorderable section: container + item selector. */
    function getReorderableSections() {
        return [
            { container: DOM.educationContainer, selector: '.education-entry' },
            { container: DOM.experienceContainer, selector: '.experience-entry' },
            { container: DOM.skillsContainer, selector: '.skill-entry' },
            { container: DOM.projectsContainer, selector: '.project-entry' },
            { container: DOM.certificationsContainer, selector: '.certification-entry' },
            { container: DOM.languagesContainer, selector: '.language-entry' }
        ];
    }

    /**
     * One-time setup: give every entry currently in the DOM (the static
     * first entry in each section, present since page load) reorder
     * controls, and set up drag-over handling on each container.
     */
    function initEntryReordering() {
        try {
            getReorderableSections().forEach(({ container, selector }) => {
                if (!container) return;
                setupContainerDragOver(container, selector);
                container.querySelectorAll(selector).forEach(entry => {
                    bindReorderControls(entry, container, selector);
                });
                refreshReorderButtons(container, selector);
            });
        } catch (error) {
            console.error('Init entry reordering error:', error);
        }
    }

    /**
     * Refresh up/down button disabled-states across every reorderable
     * section - call after bulk DOM changes like loading a saved resume.
     */
    function refreshAllReorderButtons() {
        getReorderableSections().forEach(({ container, selector }) => {
            refreshReorderButtons(container, selector);
        });
    }

    // ====================================================================
    // SECTION ORDER / VISIBILITY MANAGER
    // ====================================================================

    /** The resume sections a person can reorder or hide, in their default order. */
    const SECTION_DEFS = [
        { key: 'summary', label: 'Professional Summary' },
        { key: 'education', label: 'Education' },
        { key: 'experience', label: 'Work Experience' },
        { key: 'projects', label: 'Projects' },
        { key: 'skills', label: 'Skills' },
        { key: 'certifications', label: 'Certifications' },
        { key: 'languages', label: 'Languages' }
    ];
    const DEFAULT_SECTION_ORDER = SECTION_DEFS.map(s => s.key);

    /**
     * Read the current section order/visibility settings out of the
     * hidden input that both this script and templates.js share.
     * @returns {{order: string[], hidden: string[]}}
     */
    function getSectionSettings() {
        try {
            const raw = document.getElementById('section-settings-data')?.value;
            if (!raw) return { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };
            const parsed = JSON.parse(raw);
            const validKeys = DEFAULT_SECTION_ORDER;
            const order = Array.isArray(parsed.order) ? parsed.order.filter(k => validKeys.includes(k)) : [];
            validKeys.forEach(k => { if (!order.includes(k)) order.push(k); });
            const hidden = Array.isArray(parsed.hidden) ? parsed.hidden.filter(k => validKeys.includes(k)) : [];
            return { order, hidden };
        } catch (error) {
            return { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };
        }
    }

    /**
     * Persist section order/visibility settings into the shared hidden
     * input (does not by itself refresh anything - callers trigger a
     * preview update afterwards).
     */
    function setSectionSettings(settings) {
        const input = document.getElementById('section-settings-data');
        if (input) input.value = JSON.stringify(settings);
    }

    /**
     * Read the section manager's current DOM order + checkbox states and
     * write them back into the shared hidden input, then refresh the
     * live preview. Called after every reorder (drag or button) and
     * every visibility checkbox toggle.
     */
    function syncSectionSettingsFromDOM() {
        try {
            const list = document.getElementById('section-manager-list');
            if (!list) return;
            const rows = Array.from(list.querySelectorAll('.section-manager-row'));
            const order = rows.map(r => r.dataset.key);
            const hidden = [];
            rows.forEach(row => {
                const checkbox = row.querySelector('.section-visibility-checkbox');
                const isHidden = checkbox ? !checkbox.checked : false;
                row.classList.toggle('section-hidden', isHidden);
                if (isHidden) hidden.push(row.dataset.key);
            });
            setSectionSettings({ order, hidden });
            triggerPreviewUpdate();
        } catch (error) {
            console.error('Sync section settings error:', error);
        }
    }

    /**
     * (Re)build the section manager panel to reflect a given settings
     * object - used on first load (defaults) and whenever a saved resume
     * with its own custom order/visibility is loaded into the editor.
     */
    function renderSectionManagerFromSettings(settings) {
        try {
            const list = document.getElementById('section-manager-list');
            if (!list) return;
            settings = settings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };

            list.innerHTML = settings.order.map(key => {
                const def = SECTION_DEFS.find(d => d.key === key);
                if (!def) return '';
                const isHidden = settings.hidden.includes(key);
                return `
                    <div class="section-manager-row${isHidden ? ' section-hidden' : ''}" data-key="${key}">
                        <label class="section-manager-label">
                            <input type="checkbox" class="section-visibility-checkbox" ${isHidden ? '' : 'checked'}>
                            ${def.label}
                        </label>
                    </div>
                `;
            }).join('');

            list.querySelectorAll('.section-manager-row').forEach(row => {
                bindReorderControls(row, list, '.section-manager-row', syncSectionSettingsFromDOM);
                const checkbox = row.querySelector('.section-visibility-checkbox');
                if (checkbox) checkbox.addEventListener('change', syncSectionSettingsFromDOM);
            });
            refreshReorderButtons(list, '.section-manager-row');

            if (!list.dataset.dragoverBound) {
                setupContainerDragOver(list, '.section-manager-row');
                list.dataset.dragoverBound = 'true';
            }

            setSectionSettings(settings);
        } catch (error) {
            console.error('Render section manager error:', error);
        }
    }

    /** One-time setup, called during init. */
    function initSectionManager() {
        renderSectionManagerFromSettings({ order: DEFAULT_SECTION_ORDER.slice(), hidden: [] });
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

            // Clear dynamic sections (including any extra skill fields,
            // which don't carry the .dynamic-entry class)
            clearDynamicEntries();
            refreshAllReorderButtons();
            renderSectionManagerFromSettings({ order: DEFAULT_SECTION_ORDER.slice(), hidden: [] });

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

            // Snapshot into this resume's autosave history (throttled/deduped)
            recordHistorySnapshot(resume);

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
            languages: getLanguagesData(),
            sectionSettings: getSectionSettings(),
            compactMode: !!document.getElementById('compact-mode-toggle')?.checked
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
     * Fill in the single-value fields (contact info, summary, template)
     * shared by loadResume() and loadCurrentResume().
     * @param {Object} data - resume.data object
     * @param {string} template - template id
     */
    function applyBasicFields(data, template) {
        data = data || {};
        if (DOM.fullName) DOM.fullName.value = data.fullName || '';
        if (DOM.email) DOM.email.value = data.email || '';
        if (DOM.phone) DOM.phone.value = data.phone || '';
        if (DOM.location) DOM.location.value = data.location || '';
        if (DOM.linkedin) DOM.linkedin.value = data.linkedin || '';
        if (DOM.website) DOM.website.value = data.website || '';
        if (DOM.github) DOM.github.value = data.github || '';
        if (DOM.summary) DOM.summary.value = data.summary || '';
        if (DOM.templateSelect) DOM.templateSelect.value = template || 'template1';

        renderSectionManagerFromSettings(data.sectionSettings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] });

        const compactToggle = document.getElementById('compact-mode-toggle');
        if (compactToggle) compactToggle.checked = !!data.compactMode;
    }

    /**
     * Remove every dynamically-added entry so a resume's data can be
     * loaded into the form without old entries lingering behind.
     * Skill entries don't carry the .dynamic-entry class (they use a
     * compact layout, not the bordered card style), so anything past
     * the first 3 is trimmed manually.
     */
    function clearDynamicEntries() {
        try {
            document.querySelectorAll('.dynamic-entry').forEach(el => el.remove());

            if (DOM.skillsContainer) {
                DOM.skillsContainer.querySelectorAll('.skill-entry').forEach((entry, idx) => {
                    if (idx >= 3) entry.remove();
                });
            }
        } catch (error) {
            console.error('Clear dynamic entries error:', error);
        }
    }

    /**
     * Set a form field's value by element id.
     */
    function setFieldValue(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value || '';
    }

    /**
     * Set values on fields inside one entry container, keyed by their
     * `name` attribute (e.g. "education_degree[]").
     */
    function fillEntryFields(container, valuesByName) {
        if (!container) return;
        Object.keys(valuesByName).forEach(name => {
            const el = container.querySelector(`[name="${name}"]`);
            if (el) el.value = valuesByName[name] || '';
        });
    }

    /**
     * Rebuild every dynamic section of the form (education, experience,
     * skills, projects, certifications, languages) from saved resume
     * data. Used when loading a resume for editing and when restoring
     * the most recently saved resume on startup — without this, only
     * the contact info/summary came back and everything else silently
     * looked lost even though it was still in storage.
     * @param {Object} data - resume.data object
     */
    function populateFormSections(data) {
        try {
            data = data || {};
            clearDynamicEntries();

            // ---- Education ----
            const education = data.education || [];
            const eduFirst = education[0] || {};
            setFieldValue('education_degree', eduFirst.degree);
            setFieldValue('education_major', eduFirst.major);
            setFieldValue('education_school', eduFirst.school);
            setFieldValue('education_location', eduFirst.location);
            setFieldValue('education_year', eduFirst.year);
            setFieldValue('education_gpa', eduFirst.gpa);
            setFieldValue('education_honors', eduFirst.honors);
            for (let i = 1; i < education.length; i++) {
                const entry = createEducationEntry();
                DOM.educationContainer.appendChild(entry);
                fillEntryFields(entry, {
                    'education_degree[]': education[i].degree,
                    'education_major[]': education[i].major,
                    'education_school[]': education[i].school,
                    'education_location[]': education[i].location,
                    'education_year[]': education[i].year,
                    'education_gpa[]': education[i].gpa,
                    'education_honors[]': education[i].honors
                });
            }

            // ---- Work Experience ----
            const experience = data.experience || [];
            const expFirst = experience[0] || {};
            setFieldValue('work_position', expFirst.position);
            setFieldValue('work_company', expFirst.company);
            setFieldValue('work_location', expFirst.location);
            setFieldValue('work_duration', expFirst.duration);
            setFieldValue('work_description', expFirst.description);
            for (let i = 1; i < experience.length; i++) {
                const entry = createExperienceEntry();
                DOM.experienceContainer.appendChild(entry);
                fillEntryFields(entry, {
                    'work_position[]': experience[i].position,
                    'work_company[]': experience[i].company,
                    'work_location[]': experience[i].location,
                    'work_duration[]': experience[i].duration,
                    'work_description[]': experience[i].description
                });
                const textarea = entry.querySelector('textarea');
                const counter = entry.querySelector('.char-count');
                if (textarea && counter) counter.textContent = textarea.value.length;
            }

            // ---- Skills ----
            const skills = data.skills || [];
            for (let i = 1; i <= 3; i++) {
                setFieldValue(`skill${i}`, skills[i - 1]);
            }
            for (let i = 3; i < skills.length; i++) {
                const entry = createSkillEntry();
                DOM.skillsContainer.appendChild(entry);
                fillEntryFields(entry, { 'skill[]': skills[i] });
            }

            // ---- Projects ----
            const projects = data.projects || [];
            fillEntryFields(document.querySelector('.project-entry'), {
                'project_name[]': (projects[0] || {}).name,
                'project_description[]': (projects[0] || {}).description,
                'project_technologies[]': (projects[0] || {}).technologies,
                'project_link[]': (projects[0] || {}).link
            });
            for (let i = 1; i < projects.length; i++) {
                const entry = createProjectEntry();
                DOM.projectsContainer.appendChild(entry);
                fillEntryFields(entry, {
                    'project_name[]': projects[i].name,
                    'project_description[]': projects[i].description,
                    'project_technologies[]': projects[i].technologies,
                    'project_link[]': projects[i].link
                });
            }

            // ---- Certifications ----
            const certifications = data.certifications || [];
            fillEntryFields(document.querySelector('.certification-entry'), {
                'cert_name[]': (certifications[0] || {}).name,
                'cert_issuer[]': (certifications[0] || {}).issuer,
                'cert_date[]': (certifications[0] || {}).date
            });
            for (let i = 1; i < certifications.length; i++) {
                const entry = createCertificationEntry();
                DOM.certificationsContainer.appendChild(entry);
                fillEntryFields(entry, {
                    'cert_name[]': certifications[i].name,
                    'cert_issuer[]': certifications[i].issuer,
                    'cert_date[]': certifications[i].date
                });
            }

            // ---- Languages ----
            const languages = data.languages || [];
            fillEntryFields(document.querySelector('.language-entry'), {
                'language_name[]': (languages[0] || {}).name,
                'language_proficiency[]': (languages[0] || {}).proficiency
            });
            for (let i = 1; i < languages.length; i++) {
                const entry = createLanguageEntry();
                DOM.languagesContainer.appendChild(entry);
                fillEntryFields(entry, {
                    'language_name[]': languages[i].name,
                    'language_proficiency[]': languages[i].proficiency
                });
            }

            // Directly refresh the counters bound to the static textareas:
            // they only update on real 'input' events, and we deliberately
            // avoid firing per-field events above so we don't leave any
            // autocomplete dropdown stuck open (those listen on 'input'
            // too, but only hide on 'blur').
            const summaryCounter = document.getElementById('professional_summary-count');
            if (summaryCounter && DOM.summary) summaryCounter.textContent = DOM.summary.value.length;
            const descCounter = document.getElementById('work_description-count');
            const descTextarea = document.getElementById('work_description');
            if (descCounter && descTextarea) descCounter.textContent = descTextarea.value.length;

            refreshAllReorderButtons();
        } catch (error) {
            console.error('Populate form sections error:', error);
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

            applyBasicFields(resume.data, resume.template);
            populateFormSections(resume.data);

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

                // Restore it into the form. Without this, reopening the app
                // showed a blank editor even though a resume was saved, and
                // autosave could silently overwrite that saved resume with
                // empty data the moment the form's initial progress check ran.
                applyBasicFields(latest.data, latest.template);
                populateFormSections(latest.data);
                triggerPreviewUpdate();
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

            try { localStorage.removeItem(HISTORY_KEY_PREFIX + id); } catch (e) { /* ignore */ }

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
                        <button class="history-btn" data-id="${resume.id}" aria-label="View autosave history">History</button>
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

            DOM.resumeList.querySelectorAll('.history-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    openHistoryModal(this.dataset.id);
                });
            });
        } catch (error) {
            console.error('Update dashboard error:', error);
        }

        updateStorageReadout();
    }

    // ====================================================================
    // STORAGE USAGE + BULK ACTIONS
    // ====================================================================

    /** Prefix for the per-resume autosave history keys in localStorage. */
    const HISTORY_KEY_PREFIX = 'resume_history_';

    /**
     * Measure how much of localStorage this app is using, broken down by
     * saved resumes vs. autosave history, plus everything else it might
     * share the origin with.
     * @returns {{resumesBytes:number, historyBytes:number, otherBytes:number, totalBytes:number, resumeCount:number}}
     */
    function calculateStorageBreakdown() {
        const breakdown = { resumesBytes: 0, historyBytes: 0, otherBytes: 0, totalBytes: 0, resumeCount: 0 };
        try {
            for (const key in localStorage) {
                if (!localStorage.hasOwnProperty(key)) continue;
                const size = (localStorage[key] || '').length + key.length;
                breakdown.totalBytes += size;
                if (key === CONFIG.LOCALSTORAGE_KEY) {
                    breakdown.resumesBytes += size;
                } else if (key.indexOf(HISTORY_KEY_PREFIX) === 0) {
                    breakdown.historyBytes += size;
                } else {
                    breakdown.otherBytes += size;
                }
            }
            breakdown.resumeCount = getResumes().length;
        } catch (error) {
            console.error('Calculate storage breakdown error:', error);
        }
        return breakdown;
    }

    /**
     * Format a byte count as a short human-readable string.
     */
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /**
     * Refresh the storage usage readout + bar in the dashboard.
     */
    function updateStorageReadout() {
        try {
            const textEl = document.getElementById('storage-readout-text');
            const barEl = document.getElementById('storage-bar-fill');
            if (!textEl || !barEl) return;

            const usage = calculateStorageBreakdown();
            const percentage = Math.min(100, (usage.totalBytes / CONFIG.MAX_STORAGE_SIZE) * 100);

            const resumeLabel = usage.resumeCount === 1 ? '1 resume' : `${usage.resumeCount} resumes`;
            textEl.textContent = `${formatBytes(usage.totalBytes)} used (${resumeLabel}, plus autosave history) — ${percentage.toFixed(1)}% of the ~5 MB this browser gives this app`;

            barEl.style.width = percentage + '%';
            barEl.classList.toggle('storage-warning', percentage > 75);
        } catch (error) {
            console.error('Update storage readout error:', error);
        }
    }

    /**
     * Export every saved resume (not just the one currently open) as a
     * single JSON file, so someone can back up - or move to another
     * browser - everything at once instead of one-by-one.
     */
    function exportAllResumes() {
        try {
            const resumes = getResumes();
            if (resumes.length === 0) {
                showNotification('No saved resumes to export', 'info');
                return;
            }

            const payload = {
                exportedAt: new Date().toISOString(),
                count: resumes.length,
                resumes: resumes
            };

            const dataStr = JSON.stringify(payload, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `all_resumes_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showNotification(`Exported ${resumes.length} resume${resumes.length === 1 ? '' : 's'}`, 'success');
        } catch (error) {
            console.error('Export all resumes error:', error);
            showNotification('Failed to export resumes', 'error');
        }
    }

    /**
     * Permanently delete every saved resume and all autosave history.
     * Gated behind a double confirmation since it can't be undone.
     */
    function deleteAllResumes() {
        try {
            const resumes = getResumes();
            if (resumes.length === 0) {
                showNotification('There are no saved resumes to delete', 'info');
                return;
            }

            if (!confirm(`Delete all ${resumes.length} saved resume${resumes.length === 1 ? '' : 's'}? This cannot be undone.`)) {
                return;
            }
            if (!confirm('Are you absolutely sure? This will permanently erase everything saved in this browser.')) {
                return;
            }

            localStorage.removeItem(CONFIG.LOCALSTORAGE_KEY);
            resumes.forEach(r => {
                try { localStorage.removeItem(HISTORY_KEY_PREFIX + r.id); } catch (e) { /* ignore */ }
            });

            currentResumeId = null;
            DOM.form?.reset();
            clearDynamicEntries();
            triggerPreviewUpdate();

            updateDashboard();
            showNotification('All resumes deleted', 'info');
        } catch (error) {
            console.error('Delete all resumes error:', error);
            showNotification('Failed to delete resumes', 'error');
        }
    }

    // ====================================================================
    // PER-RESUME AUTOSAVE HISTORY
    // ====================================================================

    /** Keep at most this many history snapshots per resume. */
    const HISTORY_MAX_ENTRIES = 15;
    /** Don't add a new snapshot within this many ms of the last one. */
    const HISTORY_MIN_INTERVAL_MS = 60 * 1000;

    /**
     * Read the snapshot history for one resume.
     * @param {string} id
     * @returns {Array<{timestamp:string, title:string, data:Object, template:string}>}
     */
    function getResumeHistory(id) {
        try {
            const raw = localStorage.getItem(HISTORY_KEY_PREFIX + id);
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.error('Get resume history error:', error);
            return [];
        }
    }

    /**
     * Record a snapshot of a just-saved resume into its history, provided
     * the content actually changed and enough time has passed since the
     * last snapshot - otherwise the 1.5s autosave debounce would fill
     * storage with near-duplicate entries almost instantly.
     * @param {Object} resume - the resume record that was just saved
     */
    function recordHistorySnapshot(resume) {
        try {
            const history = getResumeHistory(resume.id);
            const last = history[history.length - 1];
            const serializedData = JSON.stringify(resume.data);

            if (last) {
                const sameContent = JSON.stringify(last.data) === serializedData && last.template === resume.template;
                const tooSoon = (Date.now() - new Date(last.timestamp).getTime()) < HISTORY_MIN_INTERVAL_MS;
                if (sameContent || tooSoon) return;
            }

            history.push({
                timestamp: new Date().toISOString(),
                title: resume.title,
                template: resume.template,
                data: resume.data
            });

            while (history.length > HISTORY_MAX_ENTRIES) history.shift();

            localStorage.setItem(HISTORY_KEY_PREFIX + resume.id, JSON.stringify(history));
        } catch (error) {
            // History is a nice-to-have safety net, not core functionality -
            // never let a storage hiccup here block a save.
            console.error('Record history snapshot error:', error);
        }
    }

    /**
     * Turn an ISO timestamp into a short "X minutes ago"-style string.
     */
    function relativeTime(isoString) {
        const diffMs = Date.now() - new Date(isoString).getTime();
        const diffSec = Math.round(diffMs / 1000);
        if (diffSec < 60) return 'just now';
        const diffMin = Math.round(diffSec / 60);
        if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
        const diffHour = Math.round(diffMin / 60);
        if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
        const diffDay = Math.round(diffHour / 24);
        return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    }

    /**
     * Open the History modal for one resume and render its snapshots.
     * @param {string} id
     */
    function openHistoryModal(id) {
        try {
            const resume = getResumeById(id);
            const modal = document.getElementById('history-modal');
            const list = document.getElementById('history-list');
            const titleEl = document.getElementById('history-resume-title');
            if (!resume || !modal || !list) return;

            if (titleEl) titleEl.textContent = resume.title;

            const history = getResumeHistory(id).slice().reverse(); // newest first

            if (history.length === 0) {
                list.innerHTML = '<p class="history-empty">No earlier versions saved yet. Snapshots appear here as you keep editing (at most one per minute of changes).</p>';
            } else {
                list.innerHTML = history.map((snapshot, idx) => `
                    <div class="history-item">
                        <div>
                            <span class="history-item-time">${new Date(snapshot.timestamp).toLocaleString()}</span>
                            <span class="history-item-relative">${relativeTime(snapshot.timestamp)}</span>
                        </div>
                        <button type="button" class="history-restore-btn" data-id="${id}" data-index="${history.length - 1 - idx}">Restore</button>
                    </div>
                `).join('');

                list.querySelectorAll('.history-restore-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        restoreHistorySnapshot(this.dataset.id, parseInt(this.dataset.index, 10));
                    });
                });
            }

            modal.style.display = 'block';
        } catch (error) {
            console.error('Open history modal error:', error);
            showNotification('Failed to load history', 'error');
        }
    }

    /**
     * Load one historical snapshot into the editor form (without
     * auto-saving it, so the person can review before committing).
     * @param {string} id
     * @param {number} index - index into the (chronological) history array
     */
    function restoreHistorySnapshot(id, index) {
        try {
            const history = getResumeHistory(id);
            const snapshot = history[index];
            if (!snapshot) {
                showNotification('That version could not be found', 'error');
                return;
            }

            currentResumeId = id;
            applyBasicFields(snapshot.data, snapshot.template);
            populateFormSections(snapshot.data);
            triggerPreviewUpdate();

            const modal = document.getElementById('history-modal');
            if (modal) modal.style.display = 'none';

            showNotification(`Restored version from ${relativeTime(snapshot.timestamp)} — remember to Save`, 'success');
            document.getElementById('resume-editor')?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Restore history snapshot error:', error);
            showNotification('Failed to restore that version', 'error');
        }
    }

    /**
     * Wire up the storage panel's buttons and the history modal's close
     * controls. Called once during init.
     */
    function setupStorageAndHistoryControls() {
        try {
            const exportAllBtn = document.getElementById('export-all-btn');
            if (exportAllBtn) exportAllBtn.addEventListener('click', exportAllResumes);

            const deleteAllBtn = document.getElementById('delete-all-btn');
            if (deleteAllBtn) deleteAllBtn.addEventListener('click', deleteAllResumes);

            const historyModal = document.getElementById('history-modal');
            const historyClose = document.getElementById('history-close');
            if (historyClose && historyModal) {
                historyClose.addEventListener('click', () => { historyModal.style.display = 'none'; });
                window.addEventListener('click', (e) => {
                    if (e.target === historyModal) historyModal.style.display = 'none';
                });
            }
        } catch (error) {
            console.error('Setup storage and history controls error:', error);
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

            // Print button - a real, native browser print (see the
            // @media print rules in Resume-Editor.css), separate from the
            // html2canvas-based "Download PDF" flow above.
            const printBtn = document.getElementById('print-resume-btn');
            if (printBtn) {
                printBtn.addEventListener('click', () => {
                    triggerPreviewUpdate();
                    setTimeout(() => window.print(), 150);
                });
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

            // CRITICAL: Trigger preview update to ensure preview has latest data
            triggerPreviewUpdate();

            // Wait for debounced preview update (100ms) + render time before downloading
            // This ensures the preview element is populated with current data
            setTimeout(() => {
                downloadResumePDF(currentResumeId);
            }, 300); // Increased from 200ms to 300ms to account for debounce + render
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

            // The live preview always reflects whichever resume is
            // currently loaded in the editor form. If the requested resume
            // isn't the one on screen (e.g. clicking "Download" on a
            // different card in the dashboard), load it first - otherwise
            // this would silently export whatever the previous resume's
            // preview happened to contain, under the right resume's name.
            if (currentResumeId !== id) {
                loadResume(id);
                setTimeout(() => generatePDFFromPreview(resume), 400);
                return;
            }

            generatePDFFromPreview(resume);
        } catch (error) {
            console.error('Download resume PDF error:', error);
            showNotification('Failed to download PDF', 'error');
        }
    }

    /**
     * Render the current live preview element to a downloaded PDF.
     * @param {Object} resume - resume record (used for the filename)
     */
    function generatePDFFromPreview(resume) {
        try {
            // Check if html2pdf is available
            if (typeof html2pdf === 'undefined') {
                showNotification('PDF library not loaded. Please refresh the page.', 'error');
                return;
            }

            // Get the preview element directly
            const previewElement = DOM.preview;
            if (!previewElement) {
                showNotification('Preview element not found. Please refresh the page.', 'error');
                return;
            }

            // Check if preview has meaningful content (not just placeholder text)
            const previewContent = previewElement.innerHTML.trim();
            if (!previewContent || previewContent.length < 100) {
                console.error('Preview content too short or empty:', previewContent.substring(0, 100));
                showNotification('Preview is not ready. Please try again in a moment.', 'error');
                return;
            }

            // Verify preview has actual resume data (check for name or email)
            const hasName = previewContent.includes(resume.data.fullName) || resume.data.fullName === '';
            const hasContent = previewElement.querySelector('.resume-template') !== null;

            if (!hasContent) {
                console.error('Preview template not rendered');
                showNotification('Preview not fully loaded. Please try again.', 'error');
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
    // LIGHT / DARK THEME TOGGLE
    // ====================================================================

    /** localStorage key for the user's chosen editor theme */
    const THEME_STORAGE_KEY = 'resumeBuilderTheme';

    /**
     * Wire up the light/dark theme toggle button. The theme itself is
     * applied as early as possible by an inline script in <head> (to avoid
     * a flash of the wrong theme); this just keeps the button in sync and
     * handles clicks.
     */
    function setupThemeToggle() {
        try {
            const btn = document.getElementById('theme-toggle-btn');
            if (!btn) return;

            const applyButtonState = (theme) => {
                const isLight = theme === 'light';
                btn.textContent = isLight ? '☀️' : '🌙';
                btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
                btn.title = isLight ? 'Switch to dark theme' : 'Switch to light theme';
            };

            let current = document.documentElement.getAttribute('data-theme');
            if (current !== 'light' && current !== 'dark') {
                // No explicit choice yet - fall back to the OS preference so
                // the button icon matches what the person is actually seeing.
                current = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
                    ? 'light' : 'dark';
            }
            applyButtonState(current);

            btn.addEventListener('click', () => {
                const isCurrentlyLight = document.documentElement.getAttribute('data-theme') === 'light';
                const next = isCurrentlyLight ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', next);
                applyButtonState(next);
                try {
                    localStorage.setItem(THEME_STORAGE_KEY, next);
                } catch (e) {
                    console.error('Failed to persist theme choice:', e);
                }
            });
        } catch (error) {
            console.error('Setup theme toggle error:', error);
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
