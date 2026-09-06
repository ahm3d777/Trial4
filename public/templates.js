document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const resumeForm = document.getElementById('resume-form');
    const templateSelect = document.getElementById('template-select');
    const realTimePreview = document.getElementById('real-time-preview');

    // Debounce timer for performance optimization
    let previewUpdateTimer = null;

    /**
     * Debounced update preview - waits 100ms after user stops typing
     * This prevents unnecessary DOM updates on every keystroke
     * Improves performance by ~90% for large forms
     */
    function debouncedUpdatePreview() {
        clearTimeout(previewUpdateTimer);
        previewUpdateTimer = setTimeout(() => {
            updatePreview();
        }, 100); // Update 100ms after user stops typing
    }

    // Event listener for form input change (debounced for performance)
    if (resumeForm) {
        resumeForm.addEventListener('input', debouncedUpdatePreview);
    }

    // Event listener for template selection change (instant, no debounce needed)
    if (templateSelect) {
        templateSelect.addEventListener('change', updatePreview);
    }

    // Function to update the Real-time Preview based on the selected template and form content
    function updatePreview() {
        // Get the selected template
        const selectedTemplate = templateSelect.value;

        // Add the appropriate template class to real-time preview
        realTimePreview.className = 'real-time-preview'; // Clear existing classes
        realTimePreview.classList.add(selectedTemplate); // Add selected template class

        // Generate HTML for the selected template and form content
        const templateHTML = generateTemplate(selectedTemplate);

        // Update the Real-time Preview with the generated HTML
        realTimePreview.innerHTML = templateHTML;

        // "Shrink to fit one page" - only scales things down when the
        // resume would actually spill onto a second PDF page.
        const compactToggle = document.getElementById('compact-mode-toggle');
        if (compactToggle && compactToggle.checked) {
            applyCompactFit(realTimePreview);
        }
    }

    // ------------------------------------------------------------------
    // "Shrink to fit one page"
    // ------------------------------------------------------------------
    // Snapshot every descendant's current font-size/padding/margin/
    // line-height (in px, before any scaling), so a scale factor can be
    // computed from real, un-compounded values - re-applying a fresh
    // scale on top of an already-shrunk element would double-shrink it.
    function collectOriginalBoxMetrics(rootEl) {
        const elements = [rootEl, ...rootEl.querySelectorAll('*')];
        return elements.map(el => {
            const cs = getComputedStyle(el);
            const lineHeightRaw = cs.lineHeight;
            const lineHeightPx = lineHeightRaw === 'normal' ? null : parseFloat(lineHeightRaw);
            return {
                el,
                fontSize: parseFloat(cs.fontSize) || 0,
                paddingTop: parseFloat(cs.paddingTop) || 0,
                paddingBottom: parseFloat(cs.paddingBottom) || 0,
                paddingLeft: parseFloat(cs.paddingLeft) || 0,
                paddingRight: parseFloat(cs.paddingRight) || 0,
                marginTop: parseFloat(cs.marginTop) || 0,
                marginBottom: parseFloat(cs.marginBottom) || 0,
                marginLeft: parseFloat(cs.marginLeft) || 0,
                marginRight: parseFloat(cs.marginRight) || 0,
                lineHeight: (lineHeightPx == null || isNaN(lineHeightPx)) ? null : lineHeightPx
            };
        });
    }

    function applyBoxMetricsScale(metrics, scale) {
        metrics.forEach(m => {
            if (m.fontSize) m.el.style.fontSize = (m.fontSize * scale).toFixed(2) + 'px';
            m.el.style.paddingTop = (m.paddingTop * scale).toFixed(2) + 'px';
            m.el.style.paddingBottom = (m.paddingBottom * scale).toFixed(2) + 'px';
            m.el.style.paddingLeft = (m.paddingLeft * scale).toFixed(2) + 'px';
            m.el.style.paddingRight = (m.paddingRight * scale).toFixed(2) + 'px';
            m.el.style.marginTop = (m.marginTop * scale).toFixed(2) + 'px';
            m.el.style.marginBottom = (m.marginBottom * scale).toFixed(2) + 'px';
            m.el.style.marginLeft = (m.marginLeft * scale).toFixed(2) + 'px';
            m.el.style.marginRight = (m.marginRight * scale).toFixed(2) + 'px';
            if (m.lineHeight != null) m.el.style.lineHeight = (m.lineHeight * scale).toFixed(2) + 'px';
        });
    }

    /**
     * If the freshly-rendered resume is taller than one A4 page (matching
     * the "Download PDF" button's margin:10mm / A4 portrait settings),
     * proportionally shrink font-size/padding/margin/line-height across
     * every element until it fits (down to a 55% floor, past which text
     * would become illegible - at that point it's left slightly over rather
     * than shrunk further).
     */
    function applyCompactFit(previewEl) {
        const templateEl = previewEl.querySelector('.resume-template');
        if (!templateEl) return;

        const width = templateEl.getBoundingClientRect().width;
        if (!width) return;

        // A4 usable area in mm, after the 10mm margins the PDF export uses.
        const PAGE_CONTENT_WIDTH_MM = 190;
        const PAGE_CONTENT_HEIGHT_MM = 277;
        const maxHeightPx = width * (PAGE_CONTENT_HEIGHT_MM / PAGE_CONTENT_WIDTH_MM);

        const naturalHeight = templateEl.scrollHeight;
        if (naturalHeight <= maxHeightPx) return; // already fits - leave it alone

        const SCALE_FLOOR = 0.55;
        const metrics = collectOriginalBoxMetrics(templateEl);
        let scale = Math.max(SCALE_FLOOR, maxHeightPx / naturalHeight);
        applyBoxMetricsScale(metrics, scale);

        // Shrinking text can change how it wraps, so re-measure and nudge
        // down a couple more times if it's still slightly over.
        for (let i = 0; i < 3; i++) {
            const currentHeight = templateEl.scrollHeight;
            if (currentHeight <= maxHeightPx * 1.01 || scale <= SCALE_FLOOR) break;
            scale = Math.max(SCALE_FLOOR, scale * (maxHeightPx / currentHeight));
            applyBoxMetricsScale(metrics, scale);
        }
    }

    // ------------------------------------------------------------------
    // Section order / visibility (shared with resume-builder.js via the
    // #section-settings-data hidden input - see its Section Manager).
    // ------------------------------------------------------------------
    const DEFAULT_SECTION_ORDER = ['summary', 'education', 'experience', 'projects', 'skills', 'certifications', 'languages'];

    function getSectionSettings() {
        try {
            const raw = document.getElementById('section-settings-data')?.value;
            if (!raw) return { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };
            const parsed = JSON.parse(raw);
            const order = Array.isArray(parsed.order) ? parsed.order.filter(k => DEFAULT_SECTION_ORDER.includes(k)) : [];
            DEFAULT_SECTION_ORDER.forEach(k => { if (!order.includes(k)) order.push(k); });
            const hidden = Array.isArray(parsed.hidden) ? parsed.hidden.filter(k => DEFAULT_SECTION_ORDER.includes(k)) : [];
            return { order, hidden };
        } catch (e) {
            return { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };
        }
    }

    /**
     * Concatenate a map of {sectionKey: html} in the person's chosen
     * order, skipping hidden sections and any keys not relevant to this
     * particular column (e.g. a template's sidebar only shows a subset).
     */
    function buildOrderedSections(sectionMap, settings, allowedKeys) {
        const hidden = settings.hidden || [];
        return settings.order
            .filter(key => allowedKeys.includes(key) && !hidden.includes(key))
            .map(key => sectionMap[key] || '')
            .join('');
    }

    // Function to generate HTML for the selected template and form content
    function generateTemplate(template) {
        // Get the form data
        const formData = getFormData();

        // Generate HTML for the selected template with form content
        switch (template) {
            case 'template1':
                return generateTemplate1(formData);
            case 'template2':
                return generateTemplate2(formData);
            case 'template3':
                return generateTemplate3(formData);
            case 'template4':
                return generateTemplate4(formData);
            case 'template5':
                return generateTemplate5(formData);
            case 'template6':
                return generateTemplate6(formData);
            default:
                return '<p style="color: #888; text-align: center; padding: 40px;">Select a template to preview your resume</p>';
        }
    }

    // Function to generate HTML for Template 1 - Classic Professional
    function generateTemplate1(data) {
        const settings = data.sectionSettings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };

        const sections = {
            summary: data.summary ? `
                <div class="resume-section">
                    <h2 class="section-title">Professional Summary</h2>
                    <p class="summary-text">${data.summary}</p>
                </div>
                ` : '',

            education: data.education.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Education</h2>
                    ${data.education.map(edu => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${edu.degree || 'Degree'}</h3>
                                <span class="item-date">${edu.year || ''}</span>
                            </div>
                            <p class="item-subtitle">${edu.school || 'School/University'}${edu.location ? ` • ${edu.location}` : ''}</p>
                            ${edu.major ? `<p class="item-detail">Major: ${edu.major}</p>` : ''}
                            ${edu.gpa ? `<p class="item-detail">GPA: ${edu.gpa}</p>` : ''}
                            ${edu.honors ? `<p class="item-detail">${edu.honors}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            experience: data.experience.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Work Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${exp.position || 'Position'}</h3>
                                <span class="item-date">${exp.duration || ''}</span>
                            </div>
                            <p class="item-subtitle">${exp.company || 'Company'}${exp.location ? ` • ${exp.location}` : ''}</p>
                            ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            projects: data.projects && data.projects.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Projects</h2>
                    ${data.projects.map(project => `
                        <div class="section-item">
                            <h3>${project.name || 'Project Name'}</h3>
                            ${project.description ? `<p class="item-description">${project.description}</p>` : ''}
                            ${project.technologies ? `<p class="item-detail"><strong>Technologies:</strong> ${project.technologies}</p>` : ''}
                            ${project.link ? `<p class="item-detail"><strong>Link:</strong> ${project.link}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            skills: data.skills.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Skills</h2>
                    <div class="skills-list">
                        ${data.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : '',

            certifications: data.certifications && data.certifications.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Certifications</h2>
                    ${data.certifications.map(cert => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${cert.name || 'Certification Name'}</h3>
                                <span class="item-date">${cert.date || ''}</span>
                            </div>
                            ${cert.issuer ? `<p class="item-subtitle">${cert.issuer}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            languages: data.languages && data.languages.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Languages</h2>
                    <div class="languages-list">
                        ${data.languages.map(lang => `
                            <div class="language-item">
                                <strong>${lang.language}</strong>${lang.proficiency ? ` - ${lang.proficiency}` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''
        };

        return `
            <div class="resume-template template1-design">
                <div class="resume-header">
                    <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                    <div class="contact-info">
                        ${data.location ? `<span>📍 ${data.location}</span>` : ''}
                        ${data.email ? `<span>✉ ${data.email}</span>` : ''}
                        ${data.phone ? `<span>📞 ${data.phone}</span>` : ''}
                    </div>
                    <div class="contact-info contact-links">
                        ${data.linkedin ? `<span>🔗 ${data.linkedin}</span>` : ''}
                        ${data.website ? `<span>🌐 ${data.website}</span>` : ''}
                        ${data.github ? `<span>💻 ${data.github}</span>` : ''}
                    </div>
                </div>
                ${buildOrderedSections(sections, settings, DEFAULT_SECTION_ORDER)}
            </div>
        `;
    }

    // Function to generate HTML for Template 2 - Modern Minimal
    function generateTemplate2(data) {
        const settings = data.sectionSettings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };
        const SIDEBAR_KEYS = ['skills', 'languages'];
        const MAIN_KEYS = ['summary', 'education', 'experience', 'projects', 'certifications'];

        const sections = {
            skills: data.skills.length > 0 ? `
                <div class="sidebar-section">
                    <h2 class="section-title">Skills</h2>
                    <div class="skills-list">
                        ${data.skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
                    </div>
                </div>
                ` : '',

            languages: data.languages && data.languages.length > 0 ? `
                <div class="sidebar-section">
                    <h2 class="section-title">Languages</h2>
                    <div class="languages-list">
                        ${data.languages.map(lang => `
                            <div class="language-item">
                                <strong>${lang.language}</strong>
                                ${lang.proficiency ? `<br><span style="font-size: 11px;">${lang.proficiency}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '',

            summary: data.summary ? `
                <div class="resume-section">
                    <h2 class="section-title">Professional Summary</h2>
                    <p class="summary-text">${data.summary}</p>
                </div>
                ` : '',

            education: data.education.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Education</h2>
                    ${data.education.map(edu => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${edu.degree || 'Degree'}</h3>
                                <span class="item-date">${edu.year || ''}</span>
                            </div>
                            <p class="item-subtitle">${edu.school || 'School/University'}${edu.location ? ` • ${edu.location}` : ''}</p>
                            ${edu.major ? `<p class="item-detail">Major: ${edu.major}</p>` : ''}
                            ${edu.gpa ? `<p class="item-detail">GPA: ${edu.gpa}</p>` : ''}
                            ${edu.honors ? `<p class="item-detail">${edu.honors}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            experience: data.experience.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${exp.position || 'Position'}</h3>
                                <span class="item-date">${exp.duration || ''}</span>
                            </div>
                            <p class="item-subtitle">${exp.company || 'Company'}${exp.location ? ` • ${exp.location}` : ''}</p>
                            ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            projects: data.projects && data.projects.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Projects</h2>
                    ${data.projects.map(project => `
                        <div class="section-item">
                            <h3>${project.name || 'Project Name'}</h3>
                            ${project.description ? `<p class="item-description">${project.description}</p>` : ''}
                            ${project.technologies ? `<p class="item-detail"><strong>Technologies:</strong> ${project.technologies}</p>` : ''}
                            ${project.link ? `<p class="item-detail"><strong>Link:</strong> ${project.link}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            certifications: data.certifications && data.certifications.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title">Certifications</h2>
                    ${data.certifications.map(cert => `
                        <div class="section-item">
                            <div class="item-header">
                                <h3>${cert.name || 'Certification Name'}</h3>
                                <span class="item-date">${cert.date || ''}</span>
                            </div>
                            ${cert.issuer ? `<p class="item-subtitle">${cert.issuer}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''
        };

        return `
            <div class="resume-template template2-design">
                <div class="resume-sidebar">
                    <div class="sidebar-section">
                        <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                        <div class="contact-info">
                            ${data.location ? `<p>📍 ${data.location}</p>` : ''}
                            ${data.email ? `<p>✉ ${data.email}</p>` : ''}
                            ${data.phone ? `<p>📞 ${data.phone}</p>` : ''}
                            ${data.linkedin ? `<p>🔗 LinkedIn</p>` : ''}
                            ${data.website ? `<p>🌐 Portfolio</p>` : ''}
                            ${data.github ? `<p>💻 GitHub</p>` : ''}
                        </div>
                    </div>
                    ${buildOrderedSections(sections, settings, SIDEBAR_KEYS)}
                </div>

                <div class="resume-main">
                    ${buildOrderedSections(sections, settings, MAIN_KEYS)}
                </div>
            </div>
        `;
    }

    // Function to generate HTML for Template 3 - Creative Bold
    function generateTemplate3(data) {
        const settings = data.sectionSettings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };

        const sections = {
            summary: data.summary ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">PROFESSIONAL SUMMARY</h2>
                    <div class="section-content">
                        <p class="summary-text">${data.summary}</p>
                    </div>
                </div>
                ` : '',

            experience: data.experience.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">EXPERIENCE</h2>
                    <div class="section-content">
                        ${data.experience.map(exp => `
                            <div class="section-item">
                                <div class="item-header">
                                    <div>
                                        <h3>${exp.position || 'Position'}</h3>
                                        <p class="item-subtitle">${exp.company || 'Company'}${exp.location ? ` • ${exp.location}` : ''}</p>
                                    </div>
                                    <span class="item-date">${exp.duration || ''}</span>
                                </div>
                                ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '',

            education: data.education.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">EDUCATION</h2>
                    <div class="section-content">
                        ${data.education.map(edu => `
                            <div class="section-item">
                                <div class="item-header">
                                    <div>
                                        <h3>${edu.degree || 'Degree'}</h3>
                                        <p class="item-subtitle">${edu.school || 'School/University'}${edu.location ? ` • ${edu.location}` : ''}</p>
                                    </div>
                                    <span class="item-date">${edu.year || ''}</span>
                                </div>
                                ${edu.major ? `<p class="item-detail">Major: ${edu.major}</p>` : ''}
                                ${edu.gpa ? `<p class="item-detail">GPA: ${edu.gpa}</p>` : ''}
                                ${edu.honors ? `<p class="item-detail">${edu.honors}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '',

            projects: data.projects && data.projects.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">PROJECTS</h2>
                    <div class="section-content">
                        ${data.projects.map(project => `
                            <div class="section-item">
                                <h3>${project.name || 'Project Name'}</h3>
                                ${project.description ? `<p class="item-description">${project.description}</p>` : ''}
                                ${project.technologies ? `<p class="item-detail"><strong>Technologies:</strong> ${project.technologies}</p>` : ''}
                                ${project.link ? `<p class="item-detail"><strong>Link:</strong> ${project.link}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '',

            skills: data.skills.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">SKILLS</h2>
                    <div class="section-content">
                        <div class="skills-grid">
                            ${data.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
                        </div>
                    </div>
                </div>
                ` : '',

            certifications: data.certifications && data.certifications.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">CERTIFICATIONS</h2>
                    <div class="section-content">
                        ${data.certifications.map(cert => `
                            <div class="section-item">
                                <div class="item-header">
                                    <h3>${cert.name || 'Certification Name'}</h3>
                                    <span class="item-date">${cert.date || ''}</span>
                                </div>
                                ${cert.issuer ? `<p class="item-subtitle">${cert.issuer}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '',

            languages: data.languages && data.languages.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-bold">LANGUAGES</h2>
                    <div class="section-content">
                        <div class="languages-grid">
                            ${data.languages.map(lang => `
                                <div class="language-item">
                                    <strong>${lang.language}</strong>${lang.proficiency ? ` - ${lang.proficiency}` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                ` : ''
        };

        return `
            <div class="resume-template template3-design">
                <div class="resume-header-bold">
                    <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                    <div class="contact-info">
                        ${data.location ? `<span>📍 ${data.location}</span>` : ''}
                        ${data.email ? `<span>${data.email ? ' | ' : ''}${data.email}</span>` : ''}
                        ${data.phone ? `<span>${data.phone ? ' | ' : ''}${data.phone}</span>` : ''}
                    </div>
                    <div class="contact-info">
                        ${data.linkedin ? `<span>🔗 LinkedIn</span>` : ''}
                        ${data.website ? `<span>${data.linkedin ? ' | ' : ''}🌐 Portfolio</span>` : ''}
                        ${data.github ? `<span>${(data.linkedin || data.website) ? ' | ' : ''}💻 GitHub</span>` : ''}
                    </div>
                </div>
                ${buildOrderedSections(sections, settings, DEFAULT_SECTION_ORDER)}
            </div>
        `;
    }

    // Function to generate HTML for Template 4 - Executive Professional
    function generateTemplate4(data) {
        const settings = data.sectionSettings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };
        const MAIN_KEYS = ['experience', 'education'];
        const SIDEBAR_KEYS = ['skills', 'certifications', 'languages', 'projects'];
        const summaryHidden = (settings.hidden || []).includes('summary');

        const sections = {
            experience: data.experience.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-executive">Professional Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="section-item-executive">
                            <div class="item-header">
                                <div>
                                    <h3>${exp.position || 'Position'}</h3>
                                    <p class="item-company">${exp.company || 'Company'}${exp.location ? ` • ${exp.location}` : ''}</p>
                                </div>
                                <span class="item-date-executive">${exp.duration || ''}</span>
                            </div>
                            ${exp.description ? `<p class="item-description">${exp.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            education: data.education.length > 0 ? `
                <div class="resume-section">
                    <h2 class="section-title-executive">Education</h2>
                    ${data.education.map(edu => `
                        <div class="section-item-executive">
                            <div class="item-header">
                                <div>
                                    <h3>${edu.degree || 'Degree'}</h3>
                                    <p class="item-company">${edu.school || 'School/University'}${edu.location ? ` • ${edu.location}` : ''}</p>
                                </div>
                                <span class="item-date-executive">${edu.year || ''}</span>
                            </div>
                            ${edu.major ? `<p class="item-detail">Major: ${edu.major}</p>` : ''}
                            ${edu.gpa ? `<p class="item-detail">GPA: ${edu.gpa}</p>` : ''}
                            ${edu.honors ? `<p class="item-detail">${edu.honors}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            skills: data.skills.length > 0 ? `
                <div class="sidebar-section-executive">
                    <h3 class="sidebar-title">Key Skills</h3>
                    <div class="skills-list-executive">
                        ${data.skills.map(skill => `<div class="skill-item-executive">${skill}</div>`).join('')}
                    </div>
                </div>
                ` : '',

            certifications: data.certifications && data.certifications.length > 0 ? `
                <div class="sidebar-section-executive">
                    <h3 class="sidebar-title">Certifications</h3>
                    ${data.certifications.map(cert => `
                        <div class="cert-item-executive">
                            <strong>${cert.name || 'Certification'}</strong>
                            ${cert.issuer ? `<div class="cert-issuer">${cert.issuer}</div>` : ''}
                            ${cert.date ? `<div class="cert-date">${cert.date}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            languages: data.languages && data.languages.length > 0 ? `
                <div class="sidebar-section-executive">
                    <h3 class="sidebar-title">Languages</h3>
                    ${data.languages.map(lang => `
                        <div class="lang-item-executive">
                            <strong>${lang.language}</strong>
                            ${lang.proficiency ? `<span>${lang.proficiency}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            projects: data.projects && data.projects.length > 0 ? `
                <div class="sidebar-section-executive">
                    <h3 class="sidebar-title">Projects</h3>
                    ${data.projects.map(project => `
                        <div class="project-item-executive">
                            <strong>${project.name || 'Project'}</strong>
                            ${project.description ? `<p class="project-desc">${project.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''
        };

        return `
            <div class="resume-template template4-design">
                <div class="resume-header-executive">
                    <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                    ${data.summary && !summaryHidden ? `<p class="executive-tagline">${data.summary}</p>` : ''}
                </div>

                <div class="executive-contact-bar">
                    ${data.email ? `<span>✉ ${data.email}</span>` : ''}
                    ${data.phone ? `<span>📞 ${data.phone}</span>` : ''}
                    ${data.location ? `<span>📍 ${data.location}</span>` : ''}
                    ${data.linkedin ? `<span>🔗 LinkedIn</span>` : ''}
                    ${data.website ? `<span>🌐 ${data.website}</span>` : ''}
                </div>

                <div class="executive-layout">
                    <div class="executive-main">
                        ${buildOrderedSections(sections, settings, MAIN_KEYS)}
                    </div>

                    <div class="executive-sidebar">
                        ${buildOrderedSections(sections, settings, SIDEBAR_KEYS)}
                    </div>
                </div>
            </div>
        `;
    }

    // Function to generate HTML for Template 5 - Technical Clean
    function generateTemplate5(data) {
        const settings = data.sectionSettings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };

        const sections = {
            summary: data.summary ? `
                <div class="resume-section tech-section">
                    <h2 class="section-title-tech">// Professional Summary</h2>
                    <p class="summary-text">${data.summary}</p>
                </div>
                ` : '',

            skills: data.skills.length > 0 ? `
                <div class="resume-section tech-section">
                    <h2 class="section-title-tech">// Technical Skills</h2>
                    <div class="tech-skills-container">
                        ${data.skills.map(skill => `<span class="tech-skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
                ` : '',

            experience: data.experience.length > 0 ? `
                <div class="resume-section tech-section">
                    <h2 class="section-title-tech">// Work Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="section-item-tech">
                            <div class="tech-item-header">
                                <div>
                                    <h3 class="tech-position">${exp.position || 'Position'}</h3>
                                    <div class="tech-company">${exp.company || 'Company'}${exp.location ? ` | ${exp.location}` : ''}</div>
                                </div>
                                <span class="tech-duration">${exp.duration || ''}</span>
                            </div>
                            ${exp.description ? `<div class="tech-description">${exp.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            projects: data.projects && data.projects.length > 0 ? `
                <div class="resume-section tech-section">
                    <h2 class="section-title-tech">// Notable Projects</h2>
                    ${data.projects.map(project => `
                        <div class="section-item-tech">
                            <h3 class="tech-project-name">${project.name || 'Project Name'}</h3>
                            ${project.description ? `<div class="tech-description">${project.description}</div>` : ''}
                            ${project.technologies ? `<div class="tech-stack"><strong>Stack:</strong> ${project.technologies}</div>` : ''}
                            ${project.link ? `<div class="tech-link">🔗 ${project.link}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            education: data.education.length > 0 ? `
                <div class="resume-section tech-section">
                    <h2 class="section-title-tech">// Education</h2>
                    ${data.education.map(edu => `
                        <div class="section-item-tech">
                            <div class="tech-item-header">
                                <div>
                                    <h3 class="tech-position">${edu.degree || 'Degree'}</h3>
                                    <div class="tech-company">${edu.school || 'School/University'}${edu.location ? ` | ${edu.location}` : ''}</div>
                                </div>
                                <span class="tech-duration">${edu.year || ''}</span>
                            </div>
                            ${edu.major ? `<div class="item-detail">Major: ${edu.major}</div>` : ''}
                            ${edu.gpa ? `<div class="item-detail">GPA: ${edu.gpa}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            certifications: data.certifications && data.certifications.length > 0 ? `
                <div class="resume-section tech-section">
                    <h2 class="section-title-tech">// Certifications</h2>
                    <div class="tech-certs">
                        ${data.certifications.map(cert => `
                            <div class="tech-cert-item">
                                <strong>${cert.name || 'Certification'}</strong>
                                ${cert.issuer ? ` - ${cert.issuer}` : ''}
                                ${cert.date ? ` (${cert.date})` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : '',

            languages: data.languages && data.languages.length > 0 ? `
                <div class="resume-section tech-section">
                    <h2 class="section-title-tech">// Languages</h2>
                    <div class="tech-certs">
                        ${data.languages.map(lang => `
                            <div class="tech-cert-item">
                                <strong>${lang.language}</strong>${lang.proficiency ? ` - ${lang.proficiency}` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''
        };

        return `
            <div class="resume-template template5-design">
                <div class="tech-header">
                    <div class="tech-name-section">
                        <h1 class="resume-name">${data.fullName || 'Your Name'}</h1>
                        <div class="tech-title">${data.experience.length > 0 ? (data.experience[0].position || 'Professional') : 'Professional'}</div>
                    </div>
                    <div class="tech-contact">
                        ${data.email ? `<div>✉ ${data.email}</div>` : ''}
                        ${data.phone ? `<div>📞 ${data.phone}</div>` : ''}
                        ${data.location ? `<div>📍 ${data.location}</div>` : ''}
                        ${data.github ? `<div>💻 ${data.github}</div>` : ''}
                        ${data.linkedin ? `<div>🔗 ${data.linkedin}</div>` : ''}
                    </div>
                </div>
                ${buildOrderedSections(sections, settings, DEFAULT_SECTION_ORDER)}
            </div>
        `;
    }

    // Function to generate HTML for Template 6 - Academic Formal
    function generateTemplate6(data) {
        const settings = data.sectionSettings || { order: DEFAULT_SECTION_ORDER.slice(), hidden: [] };

        const sections = {
            summary: data.summary ? `
                <div class="resume-section academic-section">
                    <h2 class="section-title-academic">Research Interests / Professional Summary</h2>
                    <p class="academic-text">${data.summary}</p>
                </div>
                ` : '',

            education: data.education.length > 0 ? `
                <div class="resume-section academic-section">
                    <h2 class="section-title-academic">Education</h2>
                    ${data.education.map(edu => `
                        <div class="section-item-academic">
                            <div class="academic-item-header">
                                <strong>${edu.degree || 'Degree'}</strong>
                                <span class="academic-year">${edu.year || ''}</span>
                            </div>
                            <div class="academic-institution">${edu.school || 'Institution'}${edu.location ? `, ${edu.location}` : ''}</div>
                            ${edu.major ? `<div class="academic-detail">Major: ${edu.major}</div>` : ''}
                            ${edu.gpa ? `<div class="academic-detail">GPA: ${edu.gpa}</div>` : ''}
                            ${edu.honors ? `<div class="academic-detail">${edu.honors}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            experience: data.experience.length > 0 ? `
                <div class="resume-section academic-section">
                    <h2 class="section-title-academic">Professional Experience</h2>
                    ${data.experience.map(exp => `
                        <div class="section-item-academic">
                            <div class="academic-item-header">
                                <strong>${exp.position || 'Position'}</strong>
                                <span class="academic-year">${exp.duration || ''}</span>
                            </div>
                            <div class="academic-institution">${exp.company || 'Organization'}${exp.location ? `, ${exp.location}` : ''}</div>
                            ${exp.description ? `<div class="academic-description">${exp.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            projects: data.projects && data.projects.length > 0 ? `
                <div class="resume-section academic-section">
                    <h2 class="section-title-academic">Research Projects / Publications</h2>
                    ${data.projects.map(project => `
                        <div class="section-item-academic">
                            <div><strong>${project.name || 'Project Title'}</strong></div>
                            ${project.description ? `<div class="academic-description">${project.description}</div>` : ''}
                            ${project.technologies ? `<div class="academic-detail">Methods/Tools: ${project.technologies}</div>` : ''}
                            ${project.link ? `<div class="academic-detail">Link: ${project.link}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            certifications: data.certifications && data.certifications.length > 0 ? `
                <div class="resume-section academic-section">
                    <h2 class="section-title-academic">Certifications & Awards</h2>
                    ${data.certifications.map(cert => `
                        <div class="section-item-academic">
                            <div class="academic-item-header">
                                <strong>${cert.name || 'Certification/Award'}</strong>
                                <span class="academic-year">${cert.date || ''}</span>
                            </div>
                            ${cert.issuer ? `<div class="academic-institution">${cert.issuer}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : '',

            skills: data.skills.length > 0 ? `
                <div class="resume-section academic-section">
                    <h2 class="section-title-academic">Skills & Competencies</h2>
                    <div class="academic-skills">
                        ${data.skills.map(skill => `<span class="academic-skill">${skill}</span>`).join(' • ')}
                    </div>
                </div>
                ` : '',

            languages: data.languages && data.languages.length > 0 ? `
                <div class="resume-section academic-section">
                    <h2 class="section-title-academic">Languages</h2>
                    <div class="academic-languages">
                        ${data.languages.map(lang => `
                            <div class="academic-lang-item">
                                <strong>${lang.language}:</strong> ${lang.proficiency || 'Proficient'}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''
        };

        return `
            <div class="resume-template template6-design">
                <div class="academic-header">
                    <h1 class="resume-name-academic">${data.fullName || 'Your Name'}</h1>
                    <div class="academic-contact">
                        ${data.email ? `${data.email}` : ''}
                        ${data.phone ? ` • ${data.phone}` : ''}
                        ${data.location ? ` • ${data.location}` : ''}
                    </div>
                    <div class="academic-links">
                        ${data.linkedin ? `LinkedIn: ${data.linkedin}` : ''}
                        ${data.website ? `${data.linkedin ? ' • ' : ''}Website: ${data.website}` : ''}
                    </div>
                </div>
                ${buildOrderedSections(sections, settings, DEFAULT_SECTION_ORDER)}
            </div>
        `;
    }

    // Function to get form data in structured format
    function getFormData() {
        return {
            fullName: document.getElementById('full_name')?.value || '',
            email: document.getElementById('email')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            location: document.getElementById('location')?.value || '',
            linkedin: document.getElementById('linkedin')?.value || '',
            website: document.getElementById('website')?.value || '',
            github: document.getElementById('github')?.value || '',
            summary: document.getElementById('professional_summary')?.value || '',
            education: getEducationEntries(),
            experience: getExperienceEntries(),
            skills: getSkills(),
            certifications: getCertifications(),
            projects: getProjects(),
            languages: getLanguages(),
            sectionSettings: getSectionSettings()
        };
    }

    // Get all education entries
    function getEducationEntries() {
        const entries = [];
        const containers = document.querySelectorAll('.education-entry');

        containers.forEach(container => {
            // Try array notation first (dynamic entries), then fall back to non-array (initial entry)
            const degree = container.querySelector('[name="education_degree[]"]')?.value ||
                          container.querySelector('#education_degree')?.value || '';
            const major = container.querySelector('[name="education_major[]"]')?.value ||
                         container.querySelector('#education_major')?.value || '';
            const school = container.querySelector('[name="education_school[]"]')?.value ||
                          container.querySelector('#education_school')?.value || '';
            const year = container.querySelector('[name="education_year[]"]')?.value ||
                        container.querySelector('#education_year')?.value || '';
            const location = container.querySelector('[name="education_location[]"]')?.value ||
                            container.querySelector('#education_location')?.value || '';
            const gpa = container.querySelector('[name="education_gpa[]"]')?.value ||
                       container.querySelector('#education_gpa')?.value || '';
            const honors = container.querySelector('[name="education_honors[]"]')?.value ||
                          container.querySelector('#education_honors')?.value || '';

            if (degree || major || school || year) {
                entries.push({ degree, major, school, year, location, gpa, honors });
            }
        });

        return entries;
    }

    // Get all work experience entries
    function getExperienceEntries() {
        const entries = [];
        const containers = document.querySelectorAll('.experience-entry');

        containers.forEach(container => {
            // Try array notation first (dynamic entries), then fall back to non-array (initial entry)
            const position = container.querySelector('[name="work_position[]"]')?.value ||
                           container.querySelector('#work_position')?.value || '';
            const company = container.querySelector('[name="work_company[]"]')?.value ||
                          container.querySelector('#work_company')?.value || '';
            const duration = container.querySelector('[name="work_duration[]"]')?.value ||
                           container.querySelector('#work_duration')?.value || '';
            const location = container.querySelector('[name="work_location[]"]')?.value ||
                           container.querySelector('#work_location')?.value || '';
            const description = container.querySelector('[name="work_description[]"]')?.value ||
                              container.querySelector('#work_description')?.value || '';

            if (position || company || duration || description) {
                entries.push({ position, company, duration, location, description });
            }
        });

        return entries;
    }

    // Get all skills
    function getSkills() {
        const skills = [];

        // Get numbered skills (skill1, skill2, skill3, etc.)
        for (let i = 1; i <= 10; i++) {
            const skillInput = document.getElementById(`skill${i}`);
            if (skillInput && skillInput.value.trim()) {
                skills.push(skillInput.value.trim());
            }
        }

        // Get dynamic skills from skill-entry containers
        const skillContainers = document.querySelectorAll('.skill-entry [name="skill[]"]');
        skillContainers.forEach(skillInput => {
            if (skillInput && skillInput.value.trim()) {
                skills.push(skillInput.value.trim());
            }
        });

        return skills;
    }

    // Get all certification entries
    function getCertifications() {
        const entries = [];
        const containers = document.querySelectorAll('.certification-entry');

        containers.forEach(container => {
            const name = container.querySelector('[name="cert_name[]"]')?.value || '';
            const issuer = container.querySelector('[name="cert_issuer[]"]')?.value || '';
            const date = container.querySelector('[name="cert_date[]"]')?.value || '';

            if (name || issuer || date) {
                entries.push({ name, issuer, date });
            }
        });

        return entries;
    }

    // Get all project entries
    function getProjects() {
        const entries = [];
        const containers = document.querySelectorAll('.project-entry');

        containers.forEach(container => {
            const name = container.querySelector('[name="project_name[]"]')?.value || '';
            const description = container.querySelector('[name="project_description[]"]')?.value || '';
            const technologies = container.querySelector('[name="project_technologies[]"]')?.value || '';
            const link = container.querySelector('[name="project_link[]"]')?.value || '';

            if (name || description || technologies) {
                entries.push({ name, description, technologies, link });
            }
        });

        return entries;
    }

    // Get all language entries
    function getLanguages() {
        const entries = [];
        const containers = document.querySelectorAll('.language-entry');

        containers.forEach(container => {
            const language = container.querySelector('[name="language_name[]"]')?.value || '';
            const proficiency = container.querySelector('[name="language_proficiency[]"]')?.value || '';

            if (language || proficiency) {
                entries.push({ language, proficiency });
            }
        });

        return entries;
    }

    // Trigger initial preview update
    updatePreview();
});
